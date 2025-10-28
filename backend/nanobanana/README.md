# 🎨 AI 图片生成中心

[English Version](./README.en.md)

一个先进、一体化的 AI 图片生成 Web 应用平台。本项目提供了一个直观的 **Web 用户界面**，让您可以与一系列强大的文生图模型进行交互，包括 **Qwen-Image (通义万相)、Flux、Kontext、Krea**，以及多模态模型 **Nano Banana**。

项目基于强大的 Deno 后端构建，旨在提供一个无缝衔接且具备专业级水准的创作体验。

---

## ✨ 核心功能

*   **多模型支持**: 在主界面即可无缝切换多种业界顶尖的图片生成模型。
*   **直观的 Web UI**: 拥有一个干净、现代化且响应式的用户界面，专为专业创作流程而设计。
*   **高级生成控制**:
    *   **文生图**: 完全掌控正向/负向提示词、分辨率、采样步数、引导系数 (CFG) 和随机种子。
    *   **多模态 (Nano Banana)**: 结合上传的图片和文本提示词，执行图生图、图文理解等任务。
*   **批量生成**: 一次最多可生成4张图片。应用能够智能处理 API 的速率限制，通过在**并发请求**（适用于Flux等模型）和**串行请求**（适用于Qwen等模型）之间自动切换，确保任务成功率。
*   **智能会话记忆**:
    *   **输入持久化**: 您为每个模型设置的所有提示词和参数，都会在当前会话中被记住。即使来回切换模型，您的工作内容也不会丢失。
    *   **后台任务**: 您可以为一个模型开启生成任务，然后立即切换到其他模型进行操作。应用会持续追踪正在运行的任务，当您切回来时，它会自动恢复视图——如果任务仍在运行，则显示实时进度；如果已完成，则展示结果。
*   **专业级用户体验**:
    *   **浅色 & 深色模式**: 内置主题切换功能，满足您的视觉偏好。
    *   **动态进度更新**: 在生成多张图片时，获得实时反馈（例如：“正在生成 2/4 张图片...”）。
    *   **全屏预览**: 点击任何一张生成的图片，即可在弹窗中进行全屏预览。
*   **智能 API Key 处理**:
    *   在部署时将 `OPENROUTER_API_KEYS` 和 `MODELSCOPE_API_KEY` 设置为环境变量，前端将自动隐藏密钥输入框，打造一个清爽、可供分享的界面。
    *   如果未设置环境变量，也支持在UI中直接输入。
    *   环境变量支持多个API密钥（用逗号分隔），以实现随机、无状态的负载均衡。

---

## 🚀 部署到 Deno Deploy

1.  **Fork 本项目**: 将此仓库 Fork 到您自己的 GitHub 账户。
2.  **登录 Deno Deploy**: 使用您的 GitHub 账号登录 [Deno Deploy Dashboard](https://dash.deno.com/projects)。
3.  **创建新项目**:
    *   点击 "New Project"。
    *   选择您刚刚 Fork 的 GitHub 仓库。
    *   选择 `main` 分支和 `main.ts` 作为入口文件。
4.  **(推荐) 添加环境变量**:
    *   进入项目的 "Settings" -> "Environment Variables"。
    *   添加 `MODELSCOPE_API_KEY`，值为您的 ModelScope 密钥（用于 Qwen, Flux 等）。
    *   添加 `OPENROUTER_API_KEYS`，值为您的 OpenRouter 密钥（用于 Nano Banana）。
    *   *提示: 您可以添加多个由逗号分隔的密钥 (例如 `key1,key2,key3`) 来实现负载均衡。*
    *   **没有密钥？**
        *   [如何注册 ModelScope API 密钥](https://x230rpqk6u.feishu.cn/wiki/AJxKwmleQiUovZkZZOJc4mp4n5g)
        *   [如何注册 OpenRouter API 密钥](https://x230rpqk6u.feishu.cn/wiki/FptCw2H1ViN7QwkhT16cMTDPnCe)
5.  **部署**: 点击 "Link" 或 "Deploy" 按钮，您的 AI 图片生成中心就上线了！

---

## 🛠️ 如何使用

1.  打开您部署后的 `*.deno.dev` URL。
2.  如果您没有在部署时设置环境变量，请在所选模型的“设置”区域输入对应的 API Key。（如没有密钥，请参考上方“部署”部分的教程链接）。
3.  **对于文生图模型 (Qwen, Flux 等)**:
    *   输入您的正向和负向提示词。
    *   调整分辨率、步数、引导系数等参数。
    *   选择您想生成的图片数量。
    *   点击“生成”。
4.  **对于 Nano Banana (多模态模型)**:
    *   （可选）上传一张或多张图片。
    *   输入您的文本提示词。
    *   点击“生成”。

---

## 💻 技术栈

-   **前端**: 原生 HTML, CSS, JavaScript (无框架)
-   **后端**: Deno, Deno Standard Library
-   **AI 模型**:
    *   [魔搭 (ModelScope)](https://modelscope.cn/): `Qwen/Qwen-Image`, `MusePublic/FLUX.1` 等
    *   [OpenRouter](https://openrouter.ai/): `google/gemini-2.5-flash-image-preview` (用于 Nano Banana)

---

## 📜 许可证

本项目采用 [MIT License](LICENSE) 开源。
