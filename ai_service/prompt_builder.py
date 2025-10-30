from __future__ import annotations

import math
from typing import Any, Dict, Tuple

from .prompt_templates import PROMPT_LIBRARY, PromptDirective


class UnknownToolError(Exception):
    """Raised when the requested tool is not supported."""


RESOLUTION_PRESETS: Dict[str, Dict[str, Any]] = {
    "0.5k": {"width": 960, "height": 540, "label": "0.5K (960×540)"},
    "1080p": {"width": 1920, "height": 1080, "label": "1080P (1920×1080)"},
    "2k": {"width": 2560, "height": 1440, "label": "2K (2560×1440)"},
}


def _format_aspect_ratio(width: int, height: int) -> str:
    gcd = math.gcd(width, height)
    return f"{width // gcd}:{height // gcd}"


def resolve_aspect_ratio(option_value: str) -> Tuple[str, Dict[str, Any]]:
    preset = RESOLUTION_PRESETS.get(option_value, RESOLUTION_PRESETS["1080p"])
    aspect_ratio = _format_aspect_ratio(preset["width"], preset["height"])
    return aspect_ratio, preset


def build_prompt(
    tool_id: str,
    user_prompt: str = "",
    options: Dict[str, Any] | None = None,
    metadata: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    directive: PromptDirective | None = PROMPT_LIBRARY.get(tool_id)
    if not directive:
        raise UnknownToolError(f"Unsupported tool '{tool_id}'")

    options = options or {}
    metadata = metadata or {}
    mode = options.get("mode", "fast")
    resolution_key = options.get("resolution", "1080p")
    quantity = options.get("quantity", 1)

    # Assemble core prompt paragraphs
    prompt_segments = [
        directive.summary,
        *directive.core_steps,
    ]

    # Mode-specific guidance
    mode_guidance = directive.mode_overrides.get(mode)
    if mode_guidance:
        prompt_segments.append(mode_guidance)

    # Resolution-specific guidance
    resolution_guidance = directive.guidance_overrides.get("resolution", {}).get(resolution_key)
    if resolution_guidance:
        prompt_segments.append(resolution_guidance)

    if tool_id == "ai-model":
        face_swap_requested = bool(
            metadata.get("faceSwap")
            or metadata.get("face_reference")
            or metadata.get("faceReferenceProvided")
            or metadata.get("hasReference")
            or options.get("face_swap")
        )
        if face_swap_requested:
            prompt_segments.append(
                "Blend the face from the reference portrait seamlessly onto the base model while preserving expressions, lighting, and skin tone continuity. "
                "Keep the hairstyle and wardrobe from the base model image intact, ensuring the final identity clearly matches the reference person."
            )

    # Default subject or scene hints
    if directive.default_subject and "subject_hint" not in options:
        prompt_segments.append(f"Subject focus: {directive.default_subject}.")
    if directive.default_scene and "scene_hint" not in options:
        prompt_segments.append(f"Scene direction: {directive.default_scene}.")

    # Explicit user instructions
    if user_prompt and user_prompt.strip():
        prompt_segments.append(f"Custom request: {user_prompt.strip()}")

    # Quantity hint (Gemini currently streams sequentially, but we keep it for metadata)
    prompt_segments.append(f"Number of variations requested: {quantity}.")

    aspect_ratio, resolution_detail = resolve_aspect_ratio(resolution_key)

    prompt_text = "\n".join(segment for segment in prompt_segments if segment)
    return {
        "prompt": prompt_text,
        "mode": mode,
        "quantity": quantity,
        "aspect_ratio": aspect_ratio,
        "resolution": resolution_detail,
    }
