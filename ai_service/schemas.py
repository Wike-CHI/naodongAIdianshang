from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ImageInput(BaseModel):
    data: str = Field(..., description="Base64 encoded image data.")
    mime_type: str = Field(..., description="MIME type of the uploaded image.")
    role: Optional[str] = Field(None, description="Logical role of the image (primary, reference, etc).")
    file_name: Optional[str] = Field(None, description="Original filename for logging/debugging.")


class GenerateRequest(BaseModel):
    user_prompt: Optional[str] = Field("", description="User-provided free-form prompt.")
    options: Dict[str, Any] = Field(default_factory=dict, description="Structured options coming from the frontend.")
    images: List[ImageInput] = Field(default_factory=list, description="Uploaded reference images.")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata for tracking.")


class GeneratedImage(BaseModel):
    index: int
    data: str = Field(..., description="Base64 encoded generated image.")
    mime_type: str = Field(..., description="MIME type of the generated image.")
    size_bytes: int = Field(..., description="Size in bytes before encoding.")


class GenerateResponse(BaseModel):
    success: bool = True
    tool_id: str
    built_prompt: str
    options: Dict[str, Any]
    images: List[GeneratedImage]
    text_outputs: List[str] = Field(default_factory=list)
    timing_ms: int
    metadata: Dict[str, Any] = Field(default_factory=dict)


class HealthResponse(BaseModel):
    status: str = "ok"
    tools: List[str] = Field(default_factory=list)
