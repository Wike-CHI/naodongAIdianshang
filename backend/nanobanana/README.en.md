# 🎨 AI Image Generation Hub

[中文版](./README.md)

An advanced, all-in-one web application for AI image generation. This platform provides an intuitive **Web User Interface** to interact with a suite of powerful text-to-image models, including **Qwen-Image, Flux, Kontext, Krea**, and the multimodal **Nano Banana**.

Built with a robust Deno backend, it offers a seamless and professional-grade creative experience.

---

## ✨ Core Features

*   **Multi-Model Support**: Switch seamlessly between various state-of-the-art image generation models right from the main interface.
*   **Intuitive Web UI**: A clean, modern, and responsive user interface designed for a professional workflow.
*   **Advanced Generation Controls**:
    *   **Text-to-Image**: Full control over positive & negative prompts, resolution, sampling steps, guidance scale (CFG), and seed.
    *   **Multimodal (Nano Banana)**: Combine text prompts with uploaded images for image-to-image tasks.
*   **Batch Generation**: Generate up to 4 images at once. The app intelligently handles API rate limits by switching between concurrent (for Flux) and sequential (for Qwen) requests.
*   **Smart Session Memory**:
    *   **Persistent Inputs**: All your prompts and parameter settings for each model are saved for the duration of your session. Switch between models without losing your work.
    *   **Background Tasks**: Start a generation task, switch to another model, and come back later. The app keeps track of running tasks and restores the view, complete with progress updates.
*   **Professional UX**:
    *   **Light & Dark Mode**: Toggle between themes to suit your preference.
    *   **Dynamic Progress Updates**: Get real-time feedback when generating multiple images (e.g., "Generating 2/4...").
    *   **Fullscreen Preview**: Click on any generated image to view it in a fullscreen modal.
*   **Smart API Key Handling**:
    *   Set `OPENROUTER_API_KEYS` and `MODELSCOPE_API_KEY` as environment variables during deployment to hide the input fields for a clean, shareable interface.
    *   Supports entering keys directly in the UI if environment variables are not set.
    *   Supports multiple, comma-separated API keys in environment variables for random, stateless load balancing.

---

## 🚀 Deploy to Deno Deploy

1.  **Fork this Project**: Fork this repository to your own GitHub account.
2.  **Log in to Deno Deploy**: Use your GitHub account to log in to the [Deno Deploy Dashboard](https://dash.deno.com/projects).
3.  **Create a New Project**:
    *   Click "New Project".
    *   Select the GitHub repository you just forked.
    *   Choose the `main` branch and select `main.ts` as the entry point file.
4.  **(Recommended) Add Environment Variables**:
    *   Go to your project's "Settings" -> "Environment Variables".
    *   Add `MODELSCOPE_API_KEY` with your key for Qwen, Flux, etc.
    *   Add `OPENROUTER_API_KEYS` with your key(s) for the Nano Banana model.
    *   *Tip: You can add multiple keys separated by commas (e.g., `key1,key2,key3`) for load balancing.*
    *   **Need a key?**
        *   [How to get a ModelScope API key](https://x230rpqk6u.feishu.cn/wiki/AJxKwmleQiUovZkZZOJc4mp4n5g)
        *   [How to get an OpenRouter API key](https://x230rpqk6u.feishu.cn/wiki/FptCw2H1ViN7QwkhT16cMTDPnCe)
5.  **Deploy**: Click the "Link" or "Deploy" button. Your AI Image Generation Hub is now live!

---

## 🛠️ How to Use

1.  Open your deployed `*.deno.dev` URL.
2.  If you haven't set the environment variables, enter the required API Key in the "Settings" section of the selected model. (Don't have a key? See the links in the "Deploy" section above).
3.  **For Text-to-Image Models (Qwen, Flux, etc.)**:
    *   Enter your positive and negative prompts.
    *   Adjust parameters like resolution, steps, and guidance.
    *   Select the number of images to generate.
    *   Click "Generate".
4.  **For Nano Banana (Multimodal)**:
    *   (Optional) Upload one or more images.
    *   Enter your text prompt.
    *   Click "Generate".

---

## 💻 Tech Stack

-   **Frontend**: Native HTML, CSS, JavaScript (No frameworks)
-   **Backend**: Deno, Deno Standard Library
-   **AI Models**:
    *   [ModelScope](https://modelscope.cn/): `Qwen/Qwen-Image`, `MusePublic/FLUX.1`, etc.
    *   [OpenRouter](https://openrouter.ai/): `google/gemini-2.5-flash-image-preview` (for Nano Banana)

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
