from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass(frozen=True)
class PromptDirective:
    """
    Represents the reusable prompt snippets for a specific tool.
    """

    tool_id: str
    title: str
    summary: str
    core_steps: List[str]
    mode_overrides: Dict[str, str] = field(default_factory=dict)
    guidance_overrides: Dict[str, Dict[str, str]] = field(default_factory=dict)
    default_scene: Optional[str] = None
    default_subject: Optional[str] = None


PROMPT_LIBRARY: Dict[str, PromptDirective] = {
    "ai-model": PromptDirective(
        tool_id="ai-model",
        title="AI 模特生成",
        summary="将上传的模特图中服装保持不变，并替换为参考人物的脸部，生成真实电商模特图。",
        core_steps=[
            "Use the base model upload to retain wardrobe, pose and body proportions.",
            "Seamlessly replace the face with the identity from the reference portrait while matching skin tone, expression and lighting.",
            "Preserve hair, makeup cues and neckline transitions so they align naturally with the swapped face.",
            "Keep the background clean and studio-ready for ecommerce compositing.",
        ],
        mode_overrides={
            "fast": "Prioritise rapid turnaround with balanced detail suitable for PDP thumbnails.",
            "ultra": "Maximise fabric fidelity, subtle shadows and skin rendering for hero imagery.",
        },
        guidance_overrides={
            "resolution": {
                "0.5k": "Optimise composition for quick previews at 960×540 resolution.",
                "1080p": "Render at 1920×1080 with crisp fabric micro-details and hair strands.",
                "2k": "Target 2560×1440 output with couture-level material realism.",
            }
        },
        default_subject="fashion model",
    ),
    "try-on-clothes": PromptDirective(
        tool_id="try-on-clothes",
        title="同版型试衣",
        summary="将服装在模特身上呈现同版型试穿效果，保持体型一致。",
        core_steps=[
            "Match the body silhouette and garment fit from the reference upload.",
            "Blend the textile from the new garment seamlessly, preserving wrinkles and seams.",
            "Ensure the resulting pose aligns with the original reference for easy comparison.",
        ],
        mode_overrides={
            "fast": "Quickly approximate fabric transfer while keeping arm and torso placement stable.",
            "ultra": "Deliver pixel-accurate fabric overlay with refined shadows and depth cues.",
        },
        guidance_overrides={
            "resolution": {
                "0.5k": "Generate a clean ecommerce cut-out for quick catalogue checks.",
                "1080p": "Provide a marketing-ready 1080p try-on visual.",
                "2k": "Output a 2K editorial-ready composite with immaculate blending.",
            }
        },
        default_subject="model try-on view",
    ),
    "glasses-tryon": PromptDirective(
        tool_id="glasses-tryon",
        title="配件试戴",
        summary="在模特脸部自然叠加上传的配件，如眼镜、帽子。",
        core_steps=[
            "Position the accessory from the primary upload naturally on the subject's face.",
            "Maintain realistic reflections and accurate scale for temples and bridge fit.",
            "Preserve the facial expression and skin texture of the subject.",
        ],
        mode_overrides={
            "fast": "Focus on quick accessory alignment suitable for preview use.",
            "ultra": "Enhance subtle shadow casting, lens transparency and metal shine.",
        },
        guidance_overrides={
            "resolution": {
                "0.5k": "Frame a tight portrait for browsing quickly.",
                "1080p": "Deliver a polished ecommerce accessory try-on render.",
                "2k": "Provide a 2K high-detail close-up emphasising material quality.",
            }
        },
        default_subject="portrait accessory try-on",
    ),
    "pose-variation": PromptDirective(
        tool_id="pose-variation",
        title="姿态变换",
        summary="在保持人物特征与服装的情况下，生成新的姿势。",
        core_steps=[
            "Retain the garment style and subject identity from the uploads.",
            "Apply the requested pose variation while keeping anatomy natural.",
            "Keep the lighting and mood consistent with the input reference.",
        ],
        mode_overrides={
            "fast": "Suggest a simplified pose adjustment for rapid iteration.",
            "ultra": "Craft an expressive yet realistic pose with smooth limb transitions.",
        },
        guidance_overrides={
            "resolution": {
                "0.5k": "Provide a storyboard-friendly frame for quick approvals.",
                "1080p": "Render a full-body ecommerce pose at 1080p clarity.",
                "2k": "Showcase a 2K editorial dynamic pose with immaculate edge quality.",
            }
        },
        default_scene="studio backdrop",
    ),
    "shoe-tryon": PromptDirective(
        tool_id="shoe-tryon",
        title="鞋靴试穿",
        summary="将鞋靴与脚部自然结合，展示穿着效果。",
        core_steps=[
            "Align the footwear from the primary upload onto the subject's feet.",
            "Maintain accurate proportions, contact shadows and ground interaction.",
            "Highlight the shoe material, stitching and colour accurately.",
        ],
        mode_overrides={
            "fast": "Deliver a quick merchandise preview emphasising silhouette accuracy.",
            "ultra": "Illustrate premium product light falloff and realistic skin-to-shoe contact.",
        },
        guidance_overrides={
            "resolution": {
                "0.5k": "Create a clean 3/4 angle try-on at 960×540.",
                "1080p": "Provide a 1080p ecommerce close-up focusing on footwear detail.",
                "2k": "Render a 2K hero shot with cinematic lighting on the footwear.",
            }
        },
        default_scene="minimal studio floor",
    ),
    "scene-change": PromptDirective(
        tool_id="scene-change",
        title="场景更换",
        summary="保持主体不变，替换合适的场景背景。",
        core_steps=[
            "Keep the product or model identity intact from the uploads.",
            "Replace the environment with a contextually relevant backdrop.",
            "Ensure shadows and colour grading remain coherent after the change.",
        ],
        mode_overrides={
            "fast": "Produce a quick background swap suitable for rapid review.",
            "ultra": "Compose a fully graded scene with cinematic lighting integration.",
        },
        guidance_overrides={
            "resolution": {
                "0.5k": "Generate a compact marketing storyboard frame.",
                "1080p": "Deliver a 1080p lifestyle background replacement.",
                "2k": "Provide a 2K high-impact campaign-ready composite.",
            }
        },
        default_scene="ecommerce lifestyle backdrop",
    ),
    "color-change": PromptDirective(
        tool_id="color-change",
        title="商品换色",
        summary="保持材质与光影，替换指定颜色的商品展示。",
        core_steps=[
            "Respect original material textures and reflections from the uploaded product.",
            "Apply the new colour uniformly while honouring specular highlights.",
            "Return a consistent lighting setup to showcase the updated colourway.",
        ],
        mode_overrides={
            "fast": "Deliver a quick recolour preview for merchandising decisions.",
            "ultra": "Produce a hero product render with precise colour management.",
        },
        guidance_overrides={
            "resolution": {
                "0.5k": "Create a catalogue-ready recolour at 960×540.",
                "1080p": "Render a PDP-ready recolour at 1080p resolution.",
                "2k": "Output a marketing-grade 2K recolour with flawless gradients.",
            }
        },
        default_scene="neutral product table",
    ),
}


def list_supported_tools() -> List[str]:
    return list(PROMPT_LIBRARY.keys())
