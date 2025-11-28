import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from services.review_engine import DifyReviewEngine, EngineConfig, ReviewPayload

ROOT_DIR = Path(__file__).resolve().parent
load_dotenv(ROOT_DIR / ".env")

DIFY_BASE_URL = os.getenv("DIFY_BASE_URL")
DIFY_API_KEY = os.getenv("DIFY_API_KEY")
DIFY_APP_ID = os.getenv("DIFY_APP_ID")
DIFY_USER_ID = os.getenv("DIFY_USER_ID", "sentinel-review-web")

REQUIRED_ENV = {
    "DIFY_BASE_URL": DIFY_BASE_URL,
    "DIFY_API_KEY": DIFY_API_KEY,
    "DIFY_APP_ID": DIFY_APP_ID,
}

missing = [key for key, value in REQUIRED_ENV.items() if not value]
if missing:
    raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")

HTTP_TIMEOUT = httpx.Timeout(60.0, read=60.0)
engine_config = EngineConfig(
    base_url=DIFY_BASE_URL,
    api_key=DIFY_API_KEY,
    app_id=DIFY_APP_ID,
    user_id=DIFY_USER_ID,
)
review_engine = DifyReviewEngine(engine_config, HTTP_TIMEOUT)


class SingleReviewRequest(BaseModel):
    id: Optional[str] = None
    text: Optional[str] = None
    photo: Optional[str] = None

    def to_payload(self) -> ReviewPayload:
        """转换为服务层通用输入。"""
        return ReviewPayload(id=self.id, text=self.text, photo=self.photo)


class BatchReviewRequest(BaseModel):
    items: List[SingleReviewRequest] = Field(..., description="待审条目列表")


class ReviewResponse(BaseModel):
    id: Optional[str]
    outputs: Optional[Dict[str, Any]] = None
    status: str
    error: Optional[str] = None


app = FastAPI(title="Sentinel Review Proxy")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/review/single", response_model=ReviewResponse)
async def review_single(
    id: Optional[str] = Form(None),
    text: Optional[str] = Form(None),
    photo: Optional[str] = Form(None),
    photo_file: Optional[UploadFile] = File(None),
):
    try:
        request = SingleReviewRequest(id=id, text=text, photo=photo)
        outputs = await review_engine.submit(request.to_payload(), photo_file)
        return ReviewResponse(id=request.id, outputs=outputs, status="succeeded")
    except HTTPException as exc:
        raise exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/review/batch", response_model=List[ReviewResponse])
async def review_batch(request: BatchReviewRequest):
    results: List[ReviewResponse] = []
    for item in request.items:
        try:
            outputs = await review_engine.submit(item.to_payload())
            results.append(ReviewResponse(id=item.id, outputs=outputs, status="succeeded"))
        except HTTPException as exc:
            results.append(
                ReviewResponse(
                    id=item.id,
                    status="failed",
                    error=exc.detail if isinstance(exc.detail, str) else str(exc.detail),
                )
            )
        except Exception as exc:
            results.append(
                ReviewResponse(
                    id=item.id,
                    status="failed",
                    error=str(exc),
                )
            )
    return results


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

