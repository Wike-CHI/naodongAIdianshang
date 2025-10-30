from __future__ import annotations

import base64
import binascii
import logging
import os
import time
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types

from .prompt_builder import UnknownToolError, build_prompt
from .prompt_templates import list_supported_tools
from .schemas import GenerateRequest, GenerateResponse, GeneratedImage, HealthResponse

load_dotenv()

logger = logging.getLogger("ai_service")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

AIHUBMIX_API_KEY = os.getenv("AIHUBMIX_API_KEY")
if not AIHUBMIX_API_KEY:
    raise RuntimeError("AIHUBMIX_API_KEY is not configured. Set it in the environment or .env file.")

MODEL_ID = os.getenv("AIHUBMIX_MODEL_ID", "gemini-2.5-flash-image")

client = genai.Client(
    api_key=AIHUBMIX_API_KEY,
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


def _build_request_contents(prompt_text: str, request: GenerateRequest) -> List[types.Content]:
    parts: List[types.Part] = []
    for image in request.images:
        try:
            image_bytes = base64.b64decode(image.data)
        except binascii.Error as exc:
            raise HTTPException(status_code=400, detail=f"Invalid base64 data for image '{image.file_name or image.role}'") from exc
        parts.append(types.Part.from_data(mime_type=image.mime_type, data=image_bytes))
    parts.append(types.Part.from_text(text=prompt_text))
    return [types.Content(role="user", parts=parts)]


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

    image_config = types.ImageConfig(aspect_ratio=aspect_ratio)
    generate_config = types.GenerateContentConfig(
        response_modalities=["IMAGE", "TEXT"],
        image_config=image_config,
    )

    stream = client.models.generate_content_stream(
        model=MODEL_ID,
        contents=contents,
        config=generate_config,
    )

    collected_images: List[GeneratedImage] = []
    collected_texts: List[str] = []

    try:
        for chunk in stream:
            candidate = (chunk.candidates or [None])[0]
            if not candidate or not candidate.content:
                if chunk.text:
                    collected_texts.append(chunk.text)
                continue

            for part in candidate.content.parts or []:
                if getattr(part, "inline_data", None):
                    try:
                        image_bytes = _decode_inline_data(part.inline_data.data)
                    except ValueError as exc:
                        logger.error("Failed to decode inline data: %s", exc)
                        continue

                    encoded = base64.b64encode(image_bytes).decode("ascii")
                    collected_images.append(
                        GeneratedImage(
                            index=len(collected_images),
                            data=encoded,
                            mime_type=part.inline_data.mime_type or "image/png",
                            size_bytes=len(image_bytes),
                        )
                    )
                elif getattr(part, "text", None):
                    collected_texts.append(part.text)

            if chunk.text:
                collected_texts.append(chunk.text)
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
