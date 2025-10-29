/**
 * OpenRouter API 服务模块
 * 负责处理与OpenRouter API的所有交互
 */

import fetch from 'node-fetch';

class OpenRouterService {
    constructor() {
        this.baseUrl = 'https://openrouter.ai/api/v1';
        this.defaultModel = 'google/gemini-2.5-flash-image-preview';
    }

    /**
     * 调用OpenRouter API生成图片
     * @param {Object} options - 调用参数
     * @param {string} options.apiKey - OpenRouter API密钥
     * @param {Array} options.messages - 消息数组
     * @param {string} options.model - 模型名称（可选）
     * @returns {Promise<Object>} 生成结果
     */
    async generateImage({ apiKey, messages, model = this.defaultModel }) {
        if (!apiKey) {
            throw new Error('OpenRouter API key is required');
        }

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            throw new Error('Messages array is required and cannot be empty');
        }

        const payload = {
            model,
            messages
        };

        console.log('[OpenRouterService] Sending request:', JSON.stringify(payload, null, 2));

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorBody}`);
            }

            const responseData = await response.json();
            console.log('[OpenRouterService] Response received:', JSON.stringify(responseData, null, 2));

            return this._parseResponse(responseData);
        } catch (error) {
            console.error('[OpenRouterService] Error:', error);
            throw error;
        }
    }

    /**
     * 构建消息内容
     * @param {string} prompt - 文本提示
     * @param {Array} images - 图片数组（可选）
     * @returns {Array} 格式化的消息数组
     */
    buildMessages(prompt, images = []) {
        if (!prompt || typeof prompt !== 'string') {
            throw new Error('Prompt is required and must be a string');
        }

        const contentPayload = [{ type: 'text', text: prompt }];

        if (images && Array.isArray(images) && images.length > 0) {
            const imageParts = images.map(img => ({
                type: 'image_url',
                image_url: { url: img }
            }));
            contentPayload.push(...imageParts);
        }

        return [{ role: 'user', content: contentPayload }];
    }

    /**
     * 检查API密钥是否有效
     * @param {string} apiKey - API密钥
     * @returns {Promise<boolean>} 密钥是否有效
     */
    async validateApiKey(apiKey) {
        if (!apiKey) {
            return false;
        }

        try {
            const testMessages = this.buildMessages('test');
            await this.generateImage({ apiKey, messages: testMessages });
            return true;
        } catch (error) {
            console.error('[OpenRouterService] API key validation failed:', error.message);
            return false;
        }
    }

    /**
     * 获取支持的模型列表
     * @param {string} apiKey - API密钥
     * @returns {Promise<Array>} 模型列表
     */
    async getModels(apiKey) {
        if (!apiKey) {
            throw new Error('OpenRouter API key is required');
        }

        try {
            const response = await fetch(`${this.baseUrl}/models`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Failed to fetch models: ${response.status} ${response.statusText} - ${errorBody}`);
            }

            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('[OpenRouterService] Error fetching models:', error);
            throw error;
        }
    }

    /**
     * 解析API响应
     * @private
     * @param {Object} responseData - API响应数据
     * @returns {Object} 解析后的结果
     */
    _parseResponse(responseData) {
        const message = responseData.choices?.[0]?.message;
        
        if (!message) {
            return { type: 'text', content: '[模型没有返回有效内容]' };
        }

        // 检查是否有图片URL
        if (message.images?.[0]?.image_url?.url) {
            return { type: 'image', content: message.images[0].image_url.url };
        }

        // 检查是否有base64图片
        if (typeof message.content === 'string' && message.content.startsWith('data:image/')) {
            return { type: 'image', content: message.content };
        }

        // 检查是否有文本内容
        if (typeof message.content === 'string' && message.content.trim() !== '') {
            return { type: 'text', content: message.content };
        }

        return { type: 'text', content: '[模型没有返回有效内容]' };
    }
}

// 创建单例实例
const openRouterService = new OpenRouterService();

export default openRouterService;
export { OpenRouterService };