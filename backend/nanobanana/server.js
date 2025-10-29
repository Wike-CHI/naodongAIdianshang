import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import openRouterService from './services/openRouterService.js';
import modelScopeService from './services/modelScopeService.js';

// 加载环境变量
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:8080'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'static')));

// --- 辅助函数：创建 JSON 错误响应 ---
function createJsonErrorResponse(message, statusCode = 500) {
    return {
        error: message,
        statusCode
    };
}

// --- API 路由 ---

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 检查 OpenRouter API 密钥状态
app.get('/api/key-status', async (req, res) => {
    try {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return res.json({ valid: false, error: 'API key not configured' });
        }
        
        const isValid = await openRouterService.validateApiKey(apiKey);
        res.json({ valid: isValid });
    } catch (error) {
        console.error('Error checking OpenRouter API key:', error);
        res.json({ valid: false, error: error.message });
    }
});

// 检查 ModelScope API 密钥状态
app.get('/api/modelscope-key-status', async (req, res) => {
    try {
        const apiKey = process.env.MODELSCOPE_API_KEY;
        if (!apiKey) {
            return res.json({ valid: false, error: 'ModelScope API key not configured' });
        }
        
        const isValid = await modelScopeService.validateApiKey(apiKey);
        res.json({ valid: isValid });
    } catch (error) {
        console.error('Error checking ModelScope API key:', error);
        res.json({ valid: false, error: error.message });
    }
});

// 主要的图片生成接口
app.post('/generate', async (req, res) => {
    try {
        const { prompt, model = 'nanobanana', ...otherParams } = req.body;
        
        if (!prompt) {
            return res.status(400).json(createJsonErrorResponse('Prompt is required', 400));
        }
        
        console.log(`[Generate] Received request for model: ${model}, prompt: ${prompt}`);
        
        if (model === 'nanobanana') {
            // 使用 OpenRouter 服务
            const apiKey = process.env.OPENROUTER_API_KEY;
            if (!apiKey) {
                return res.status(500).json(createJsonErrorResponse('OpenRouter API key not configured', 500));
            }
            
            const result = await openRouterService.generateImage(prompt, apiKey, otherParams);
            res.json(result);
        } else {
            // 使用 ModelScope 服务
            const apiKey = process.env.MODELSCOPE_API_KEY;
            if (!apiKey) {
                return res.status(500).json(createJsonErrorResponse('ModelScope API key not configured', 500));
            }
            
            const result = await modelScopeService.generateImage(model, prompt, apiKey, otherParams);
            res.json(result);
        }
    } catch (error) {
        console.error('Error in /generate:', error);
        res.status(500).json(createJsonErrorResponse(error.message, 500));
    }
});

// 处理OPTIONS请求
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.sendStatus(204);
});

// 默认路由 - 服务静态文件
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 NanoBanana API Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🎨 Generate endpoint: http://localhost:${PORT}/generate`);
    console.log(`🔑 OpenRouter key status: http://localhost:${PORT}/api/key-status`);
    console.log(`🔑 ModelScope key status: http://localhost:${PORT}/api/modelscope-key-status`);
});

export default app;