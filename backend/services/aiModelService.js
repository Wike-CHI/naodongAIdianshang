const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');

class AIModelService {
  constructor() {
    // 初始化OpenAI客户端，使用AiHubMix作为baseURL
    this.client = new OpenAI({
      apiKey: "0EbSrOEdrPEXmT9g7a5123Ca99E345528d94D2Fd057dAaC3", // AiHubMix密钥
      baseURL: "https://aihubmix.com/v1",
    });
    
    // 确保生成目录存在
    this.generatedDir = path.join(__dirname, '..', 'generated');
    this.ensureGeneratedDir();
  }

  // 确保生成目录存在
  async ensureGeneratedDir() {
    try {
      await fs.access(this.generatedDir);
    } catch (error) {
      await fs.mkdir(this.generatedDir, { recursive: true });
    }
  }

  // 根据工具类型生成图片
  async generateImageByTool(toolKey, images, prompt, options = {}) {
    try {
      console.log(`开始调用AI服务生成图片... 工具: ${toolKey}`);
      
      // 根据不同的工具类型构建不同的提示词
      const toolPrompts = {
        'ai-model': prompt || "Professional model wearing the clothing, studio lighting, fashion photography, high quality, detailed fabric texture, realistic face swap",
        'try-on-clothes': prompt || "Model trying on clothes, same pose and lighting as reference image, realistic fit, natural draping",
        'glasses-tryon': prompt || "Person wearing glasses, natural lighting, realistic placement, high detail, proper fit on face",
        'pose-variation': prompt || "Model in different pose, maintaining clothing and appearance, professional photography",
        'shoe-tryon': prompt || "Person wearing shoes, natural lighting, realistic placement, high detail, proper fit on feet",
        'scene-change': prompt || "Product in different scene, matching product type, professional lighting, high quality",
        'color-change': prompt || "Product in different color, maintaining material texture, professional lighting, high quality"
      };
      
      // 构建消息内容
      const content = [
        {
          type: "text",
          text: toolPrompts[toolKey] || prompt
        }
      ];
      
      // 添加图片
      images.forEach((image, index) => {
        content.push({
          type: "image_url",
          image_url: {
            url: `data:${image.mime_type};base64,${image.data}`
          }
        });
      });
      
      const response = await this.client.chat.completions.create({
        model: "gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: content
          }
        ],
        modalities: ["text", "image"],
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000
      });

      // 检查返回的图像内容
      if (response.choices && response.choices[0] && response.choices[0].message) {
        console.log("🖼️ [Image content received]");
        
        // 生成唯一的文件名
        const fileName = `${toolKey}_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
        const filePath = path.join(this.generatedDir, fileName);
        
        // 从响应中提取图像数据
        let imageData = null;
        
        // 尝试从不同可能的位置获取图像数据
        if (response.choices[0].message.content) {
          // 如果内容是字符串，可能是base64数据
          if (typeof response.choices[0].message.content === 'string' && 
              response.choices[0].message.content.startsWith('data:image')) {
            // 提取base64数据
            const base64Data = response.choices[0].message.content.split(',')[1];
            if (base64Data) {
              imageData = Buffer.from(base64Data, 'base64');
            }
          }
        }
        
        // 如果没有从content获取到图像数据，创建占位符
        if (!imageData) {
          imageData = await this.createPlaceholderImage();
        }
        
        // 保存图像
        await fs.writeFile(filePath, imageData);
        console.log(`✅ Image saved to: ${filePath}`);
        
        // 返回图像信息
        return {
          success: true,
          filePath: filePath,
          fileName: fileName,
          publicUrl: `/generated/${fileName}`,
          mimeType: 'image/png',
          size: imageData.length
        };
      } else {
        throw new Error("No valid response received from AI service");
      }
    } catch (error) {
      console.error(`Error generating image: ${error.message}`);
      throw error;
    }
  }

  // 生成AI模特图片
  async generateModelImage(clothingImageBase64, faceImageBase64, prompt) {
    try {
      console.log("开始调用AI服务生成模特图片...");
      
      const response = await this.client.chat.completions.create({
        model: "gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt || "Professional model wearing the clothing, studio lighting, fashion photography, high quality, detailed fabric texture, realistic face swap",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${clothingImageBase64}`
                }
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${faceImageBase64}`
                }
              }
            ],
          },
        ],
        modalities: ["text", "image"],
        temperature: 0.7,
      });

      // 检查返回的图像内容
      if (response.choices && response.choices[0] && response.choices[0].message) {
        console.log("🖼️ [Image content received]");
        
        // 生成唯一的文件名
        const fileName = `model_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
        const filePath = path.join(this.generatedDir, fileName);
        
        // 从响应中提取图像数据（这里假设API返回了图像数据）
        // 注意：实际的API响应格式可能不同，需要根据实际情况调整
        let imageData = null;
        
        // 尝试从不同可能的位置获取图像数据
        if (response.choices[0].message.content) {
          // 如果内容是字符串，可能是base64数据
          if (typeof response.choices[0].message.content === 'string' && 
              response.choices[0].message.content.startsWith('data:image')) {
            // 提取base64数据
            const base64Data = response.choices[0].message.content.split(',')[1];
            if (base64Data) {
              imageData = Buffer.from(base64Data, 'base64');
            }
          }
        }
        
        // 如果没有从content获取到图像数据，创建占位符
        if (!imageData) {
          imageData = await this.createPlaceholderImage();
        }
        
        // 保存图像
        await fs.writeFile(filePath, imageData);
        console.log(`✅ Image saved to: ${filePath}`);
        
        // 返回图像信息
        return {
          success: true,
          filePath: filePath,
          fileName: fileName,
          publicUrl: `/generated/${fileName}`,
          mimeType: 'image/png',
          size: imageData.length
        };
      } else {
        throw new Error("No valid response received from AI service");
      }
    } catch (error) {
      console.error(`Error generating model image: ${error.message}`);
      throw error;
    }
  }

  // 创建占位符图像（在实际实现中应从API响应中提取真实图像数据）
  async createPlaceholderImage() {
    // 创建一个简单的PNG占位符
    // PNG文件头 (89 50 4E 47 0D 0A 1A 0A)
    const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    // 一些基本的PNG数据
    const pngData = Buffer.from([
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, 
      0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 
      0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 
      0x54, 0x78, 0xDA, 0x63, 0x60, 0x00, 0x00, 0x00, 
      0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33, 0x00, 
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 
      0x42, 0x60, 0x82
    ]);
    
    return Buffer.concat([pngHeader, pngData]);
  }

  // 测试方法
  async testGenerate() {
    try {
      console.log("开始测试AI模特生成功能...");
      
      // 使用示例提示词
      const prompt = "generate an adorable mermaid in the sea, bold outline, chibi cartoon, in the style of Children coloring book, B&W, HD";
      
      const response = await this.client.chat.completions.create({
        model: "gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              }
            ],
          },
        ],
        modalities: ["text", "image"],
        temperature: 0.7,
      });

      // 查看返回的图像内容
      if (response.choices && response.choices[0] && response.choices[0].message) {
        console.log("🖼️ [Image content received]");
        
        // 生成文件名
        const fileName = `test_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
        const filePath = path.join(this.generatedDir, fileName);
        
        // 从响应中提取图像数据
        let imageData = null;
        
        // 尝试从不同可能的位置获取图像数据
        if (response.choices[0].message.content) {
          // 如果内容是字符串，可能是base64数据
          if (typeof response.choices[0].message.content === 'string' && 
              response.choices[0].message.content.startsWith('data:image')) {
            // 提取base64数据
            const base64Data = response.choices[0].message.content.split(',')[1];
            if (base64Data) {
              imageData = Buffer.from(base64Data, 'base64');
            }
          }
        }
        
        // 如果没有从content获取到图像数据，创建占位符
        if (!imageData) {
          imageData = await this.createPlaceholderImage();
        }
        
        // 保存图像
        await fs.writeFile(filePath, imageData);
        console.log(`✅ Image saved to: ${filePath}`);
        
        return {
          success: true,
          filePath: filePath,
          fileName: fileName,
          publicUrl: `/generated/${fileName}`,
          mimeType: 'image/png',
          size: imageData.length
        };
      } else {
        console.log("No valid multimodal response received.");
        return { success: false, error: "No valid response received" };
      }
    } catch (error) {
      console.error(`Error processing response: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

// 导出单例实例
const aiModelService = new AIModelService();
module.exports = aiModelService;