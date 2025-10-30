# AI Image Generation Service

This FastAPI microservice wraps the Gemini image generation API exposed via AiHubMix. It builds consistent prompts for all e-commerce tooling features and streams generated images back to the Node backend.

## Requirements

```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

Set the required environment variables before running:

```text
AIHUBMIX_API_KEY=your-aihubmix-api-key   # Obtain from https://docs.aihubmix.com/
AIHUBMIX_MODEL_ID=gemini-2.5-flash-image # Optional override
AI_SERVICE_PORT=9001                     # Optional, defaults to 9001
```

## Running the service

```bash
uvicorn ai_service.main:app --host 0.0.0.0 --port 9001 --reload
```

The Node backend reads `AI_SERVICE_BASE_URL` (default `http://localhost:9001`) and forwards generation requests to this service. The FastAPI app handles prompt template selection and returns generated image data as Base64 strings together with build metadata.
