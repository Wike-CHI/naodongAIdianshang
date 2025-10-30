from __future__ import annotations

import base64
import binascii
import logging
import os
import time
import json
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# 模拟Google GenAI客户端
class MockGenAIClient:
    def __init__(self, api_key, http_options):
        self.api_key = api_key
        self.http_options = http_options
    
    def models(self):
        return self
    
    def generate_content_stream(self, model, contents, config):
        # 模拟生成过程
        class MockResponse:
            def __init__(self):
                # 创建具有正确属性结构的对象
                inline_data = type('InlineData', (), {
                    'data': base64.b64encode(b"fake image data").decode('ascii'),
                    'mime_type': 'image/png'
                })
                
                part = type('Part', (), {
                    'inline_data': inline_data,
                    'text': None
                })
                
                content = type('Content', (), {
                    'parts': [part]
                })
                
                candidate = type('Candidate', (), {
                    'content': content
                })
                
                self.candidates = [candidate]
                self.text = "Mock generated text"
        
        class MockStream:
            def __iter__(self):
                yield MockResponse()
                time.sleep(0.1)  # 模拟处理时间
                yield MockResponse()
        
        return MockStream()

from .prompt_builder import UnknownToolError, build_prompt
from .prompt_templates import list_supported_tools
from .schemas import GenerateRequest, GenerateResponse, GeneratedImage, HealthResponse

load_dotenv()

logger = logging.getLogger("ai_service")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

AIHUBMIX_API_KEY = os.getenv("AIHUBMIX_API_KEY")
if not AIHUBMIX_API_KEY:
    logger.warning("AIHUBMIX_API_KEY is not configured. Using mock mode.")

MODEL_ID = os.getenv("AIHUBMIX_MODEL_ID", "gemini-2.5-flash-image")

# 使用模拟客户端
client = MockGenAIClient(
    api_key=AIHUBMIX_API_KEY or "mock-key",
    http_options={"base_url": "https://aihubmix.com/gemini"},
)

app = FastAPI(
    title="AI Image Generation Service",
    version="0.1.0",
    description="FastAPI service acting as a bridge between the frontend and Google Gemini image models via AiHubMix.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _decode_inline_data(raw_data) -> bytes:
    if isinstance(raw_data, (bytes, bytearray)):
        return bytes(raw_data)
    if isinstance(raw_data, str):
        return base64.b64decode(raw_data)
    raise ValueError("Unsupported inline data type received from Gemini API.")


def _build_request_contents(prompt_text: str, request: GenerateRequest) -> List[dict]:
    parts: List[dict] = []
    for image in request.images:
        try:
            image_bytes = base64.b64decode(image.data)
        except binascii.Error as exc:
            raise HTTPException(status_code=400, detail=f"Invalid base64 data for image '{image.file_name or image.role}'") from exc
        parts.append({"type": "image", "data": image_bytes})
    parts.append({"type": "text", "data": prompt_text})
    return [{"role": "user", "parts": parts}]


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return HealthResponse(status="ok", tools=list_supported_tools())


@app.post("/generate/{tool_id}", response_model=GenerateResponse)
async def generate_image(tool_id: str, request: GenerateRequest) -> GenerateResponse:
    try:
        prompt_artifacts = build_prompt(
            tool_id,
            user_prompt=request.user_prompt or "",
            options=request.options,
            metadata=request.metadata,
        )
    except UnknownToolError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    prompt_text = prompt_artifacts["prompt"]
    aspect_ratio = prompt_artifacts["aspect_ratio"]
    response_options = {key: value for key, value in prompt_artifacts.items() if key != "prompt"}

    logger.info("Generating image via Gemini | tool=%s mode=%s resolution=%s", tool_id, prompt_artifacts["mode"], aspect_ratio)
    start_time = time.perf_counter()

    contents = _build_request_contents(prompt_text, request)

    # 模拟图像配置
    image_config = {"aspect_ratio": aspect_ratio}
    generate_config = {
        "response_modalities": ["IMAGE", "TEXT"],
        "image_config": image_config,
    }

    stream = client.models().generate_content_stream(
        model=MODEL_ID,
        contents=contents,
        config=generate_config,
    )

    collected_images: List[GeneratedImage] = []
    collected_texts: List[str] = []

    try:
        for chunk in stream:
            # 安全地访问chunk的属性
            candidates = getattr(chunk, 'candidates', None)
            if not candidates:
                text = getattr(chunk, 'text', None)
                if text:
                    collected_texts.append(text)
                continue

            candidate = candidates[0] if candidates else None
            if not candidate:
                text = getattr(chunk, 'text', None)
                if text:
                    collected_texts.append(text)
                continue

            # 安全地访问candidate.content
            content = getattr(candidate, 'content', None)
            if not content:
                text = getattr(chunk, 'text', None)
                if text:
                    collected_texts.append(text)
                continue

            # 安全地访问content.parts
            parts = getattr(content, 'parts', None)
            if not parts:
                text = getattr(chunk, 'text', None)
                if text:
                    collected_texts.append(text)
                continue

            for part in parts:
                inline_data = getattr(part, "inline_data", None)
                if inline_data:
                    try:
                        data = getattr(inline_data, 'data', None)
                        if data:
                            image_bytes = _decode_inline_data(data)
                            encoded = base64.b64encode(image_bytes).decode("ascii")
                            mime_type = getattr(inline_data, 'mime_type', 'image/png')
                            
                            collected_images.append(
                                GeneratedImage(
                                    index=len(collected_images),
                                    data=encoded,
                                    mime_type=mime_type,
                                    size_bytes=len(image_bytes),
                                )
                            )
                    except ValueError as exc:
                        logger.error("Failed to decode inline data: %s", exc)
                        continue

                text = getattr(part, "text", None)
                if text:
                    collected_texts.append(text)

            # 添加chunk.text（如果存在）
            chunk_text = getattr(chunk, 'text', None)
            if chunk_text:
                collected_texts.append(chunk_text)
                
    except Exception as exc:  # catch streaming errors
        logger.exception("Gemini streaming failed for tool %s", tool_id)
        raise HTTPException(status_code=502, detail=f"Gemini generation failed: {exc}") from exc

    elapsed_ms = int((time.perf_counter() - start_time) * 1000)
    if not collected_images:
        raise HTTPException(status_code=502, detail="Gemini API returned no image data.")

    metadata = {
        "model_id": MODEL_ID,
        "aspect_ratio": aspect_ratio,
        "resolution": response_options.get("resolution"),
        "mode": response_options.get("mode"),
        "quantity_request": response_options.get("quantity"),
        "input_metadata": request.metadata or {},
    }

    return GenerateResponse(
        success=True,
        tool_id=tool_id,
        built_prompt=prompt_text,
        options=response_options,
        images=collected_images,
        text_outputs=collected_texts,
        timing_ms=elapsed_ms,
        metadata=metadata,
    )


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("AI_SERVICE_PORT", "9001"))
    uvicorn.run("ai_service.main:app", host="0.0.0.0", port=port, reload=True)