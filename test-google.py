import os
from openai import OpenAI
from PIL import Image
from io import BytesIO
import base64

client = OpenAI(
    api_key="sk-0EbSrOEdrPEXmT9g7a5123Ca99E345528d94D2Fd057dAaC3", # 换成你在 AiHubMix 生成的密钥
    base_url="https://aihubmix.com/v1",
)

response = client.chat.completions.create(
    model="gemini-2.5-flash-image",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "a woman in the park",
                }
            ],
        },
    ],
    modalities=["text", "image"],
    temperature=0.7,
)
try:
    # 查看返回的图像内容
    if (
        hasattr(response.choices[0].message, "multi_mod_content")
        and response.choices[0].message.multi_mod_content is not None
    ):
        for part in response.choices[0].message.multi_mod_content:
            if "inline_data" in part and part["inline_data"] is not None:
                print("\n🖼️ [Image content received]")
                image_data = base64.b64decode(part["inline_data"]["data"])
                image = Image.open(BytesIO(image_data))
                # image.show() # 取消注释以显示图片
                image.save("generated_image.png")
                print("✅ Image saved to: generated_image.png")
            
    else:
        print("No valid multimodal response received.")
except Exception as e:
    print(f"Error processing response: {str(e)}")