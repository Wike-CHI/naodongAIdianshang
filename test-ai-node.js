import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';

// 初始化OpenAI客户端
const client = new OpenAI({
  apiKey: "sk-0EbSrOEdrPEXmT9g7a5123Ca99E345528d94D2Fd057dAaC3", // 换成你在 AiHubMix 生成的密钥
  baseURL: "https://aihubmix.com/v1",
});

async function generateImage() {
  try {
    console.log("开始调用AI服务生成图像...");
    
    const response = await client.chat.completions.create({
      model: "gemini-2.5-flash-image",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "a woman in the park",
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
      
      // 确保生成目录存在
      const generatedDir = path.join(process.cwd(), 'generated');
      try {
        await fs.access(generatedDir);
      } catch (error) {
        // 如果目录不存在，创建它
        await fs.mkdir(generatedDir, { recursive: true });
      }
      
      // 生成唯一的文件名
      const fileName = `generated_image_${Date.now()}.png`;
      const filePath = path.join(generatedDir, fileName);
      
      // 从响应中提取图像数据
      let imageData = null;
      
      // 尝试从 multi_mod_content 获取图像数据
      if (response.choices[0].message.multi_mod_content) {
        for (const part of response.choices[0].message.multi_mod_content) {
          if (part.inline_data && part.inline_data.data) {
            imageData = Buffer.from(part.inline_data.data, 'base64');
            break;
          }
        }
      }
      
      // 如果没有从 multi_mod_content 获取到图像数据，尝试从 content 获取
      if (!imageData && response.choices[0].message.content) {
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
      
      // 如果仍然没有图像数据，创建占位符
      if (!imageData) {
        console.log("未找到有效的图像数据，创建占位符图像");
        imageData = await createPlaceholderImage();
      }
      
      // 保存图像
      await fs.writeFile(filePath, imageData);
      console.log(`✅ Image saved to: ${filePath}`);
      
      return {
        success: true,
        filePath: filePath,
        fileName: fileName
      };
    } else {
      throw new Error("No valid response received from AI service");
    }
  } catch (error) {
    console.error(`Error generating image: ${error.message}`);
    throw error;
  }
}

// 创建占位符图像
async function createPlaceholderImage() {
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

// 运行测试
generateImage()
  .then(result => {
    console.log("图像生成完成:", result);
  })
  .catch(error => {
    console.error("图像生成失败:", error);
  });