/**
 * ModelScope API 服务模块
 * 负责处理与ModelScope API的所有交互
 */

import fetch from 'node-fetch';

class ModelScopeService {
    constructor() {
        this.baseUrl = 'https://api-inference.modelscope.cn/';
        this.defaultPollingInterval = 5000; // 5秒
        this.defaultTimeout = 180; // 3分钟
    }

    /**
     * 调用ModelScope API生成图片
     * @param {Object} options - 调用参数
     * @param {string} options.model - 模型名称
     * @param {string} options.apiKey - ModelScope API密钥
     * @param {Object} options.parameters - 生成参数
     * @param {number} options.timeout - 超时时间（秒）
     * @returns {Promise<Object>} 生成结果
     */
    async generateImage({ model, apiKey, parameters, timeout = this.defaultTimeout }) {
        if (!model) {
            throw new Error('Model name is required');
        }

        if (!apiKey) {
            throw new Error('ModelScope API key is required');
        }

        if (!parameters || !parameters.prompt) {
            throw new Error('Parameters with prompt are required');
        }

        const headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };

        console.log(`[ModelScopeService] Submitting task for model: ${model}`);

        // 提交生成任务
        const taskId = await this._submitTask(model, parameters, headers);
        
        // 轮询任务状态
        return await this._pollTaskStatus(taskId, headers, timeout);
    }

    /**
     * 提交生成任务
     * @private
     * @param {string} model - 模型名称
     * @param {Object} parameters - 生成参数
     * @param {Object} headers - 请求头
     * @returns {Promise<string>} 任务ID
     */
    async _submitTask(model, parameters, headers) {
        try {
            const response = await fetch(`${this.baseUrl}v1/images/generations`, {
                method: 'POST',
                headers: {
                    ...headers,
                    'X-ModelScope-Async-Mode': 'true'
                },
                body: JSON.stringify({ model, ...parameters })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`ModelScope API Error (Generation): ${response.status} - ${errorBody}`);
            }

            const { task_id } = await response.json();
            if (!task_id) {
                throw new Error('ModelScope API did not return a task_id');
            }

            console.log(`[ModelScopeService] Task submitted. Task ID: ${task_id}`);
            return task_id;
        } catch (error) {
            console.error('[ModelScopeService] Error submitting task:', error);
            throw error;
        }
    }

    /**
     * 轮询任务状态
     * @private
     * @param {string} taskId - 任务ID
     * @param {Object} headers - 请求头
     * @param {number} timeout - 超时时间（秒）
     * @returns {Promise<Object>} 生成结果
     */
    async _pollTaskStatus(taskId, headers, timeout) {
        const pollingIntervalSeconds = this.defaultPollingInterval / 1000;
        const maxRetries = Math.ceil(timeout / pollingIntervalSeconds);
        
        console.log(`[ModelScopeService] Task timeout set to ${timeout}s, polling a max of ${maxRetries} times.`);

        for (let i = 0; i < maxRetries; i++) {
            await this._sleep(this.defaultPollingInterval);
            console.log(`[ModelScopeService] Polling task status... Attempt ${i + 1}/${maxRetries}`);

            try {
                const response = await fetch(`${this.baseUrl}v1/tasks/${taskId}`, {
                    headers: {
                        ...headers,
                        'X-ModelScope-Task-Type': 'image_generation'
                    }
                });

                if (!response.ok) {
                    console.error(`[ModelScopeService] Failed to get task status. Status: ${response.status}`);
                    continue;
                }

                const data = await response.json();
                
                if (data.task_status === 'SUCCEED') {
                    console.log('[ModelScopeService] Task Succeeded.');
                    return this._parseSuccessResponse(data);
                } else if (data.task_status === 'FAILED') {
                    console.error('[ModelScopeService] Task Failed:', data);
                    throw new Error(`ModelScope task failed: ${data.message || 'Unknown error'}`);
                }
                
                // 任务仍在进行中，继续轮询
                console.log(`[ModelScopeService] Task status: ${data.task_status}, continuing to poll...`);
            } catch (error) {
                console.error(`[ModelScopeService] Error polling task status (attempt ${i + 1}):`, error.message);
                if (i === maxRetries - 1) {
                    throw error;
                }
            }
        }

        throw new Error(`ModelScope task timed out after ${timeout} seconds`);
    }

    /**
     * 解析成功响应
     * @private
     * @param {Object} data - 响应数据
     * @returns {Object} 解析后的结果
     */
    _parseSuccessResponse(data) {
        if (data.output?.images?.[0]?.url) {
            return { imageUrl: data.output.images[0].url };
        } else if (data.output_images?.[0]) {
            return { imageUrl: data.output_images[0] };
        } else {
            throw new Error('ModelScope task succeeded but returned no images');
        }
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
            const response = await fetch(`${this.baseUrl}v1/models`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.ok;
        } catch (error) {
            console.error('[ModelScopeService] API key validation failed:', error.message);
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
            throw new Error('ModelScope API key is required');
        }

        try {
            const response = await fetch(`${this.baseUrl}v1/models`, {
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
            console.error('[ModelScopeService] Error fetching models:', error);
            throw error;
        }
    }

    /**
     * 获取任务状态
     * @param {string} taskId - 任务ID
     * @param {string} apiKey - API密钥
     * @returns {Promise<Object>} 任务状态
     */
    async getTaskStatus(taskId, apiKey) {
        if (!taskId) {
            throw new Error('Task ID is required');
        }

        if (!apiKey) {
            throw new Error('ModelScope API key is required');
        }

        try {
            const response = await fetch(`${this.baseUrl}v1/tasks/${taskId}`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'X-ModelScope-Task-Type': 'image_generation'
                }
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Failed to get task status: ${response.status} ${response.statusText} - ${errorBody}`);
            }

            return await response.json();
        } catch (error) {
            console.error('[ModelScopeService] Error getting task status:', error);
            throw error;
        }
    }

    /**
     * 休眠函数
     * @private
     * @param {number} ms - 毫秒数
     * @returns {Promise<void>}
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 创建单例实例
const modelScopeService = new ModelScopeService();

export default modelScopeService;
export { ModelScopeService };