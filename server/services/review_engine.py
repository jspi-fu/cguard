from __future__ import annotations

import mimetypes
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional

import httpx
from fastapi import HTTPException, UploadFile


@dataclass
class EngineConfig:
    """结构化的审核引擎配置，便于未来替换不同实现。"""

    base_url: str
    api_key: str
    app_id: str
    user_id: str = "sentinel-review-web"


@dataclass
class ReviewPayload:
    """前端提交的审核输入。"""

    id: Optional[str] = None
    text: Optional[str] = None
    photo: Optional[str] = None


class DifyReviewEngine:
    """对接 Dify Workflow 的实现，封装上传与调用细节。"""

    def __init__(self, config: EngineConfig, timeout: httpx.Timeout):
        self.config = config
        self.timeout = timeout

    async def _upload_binary(
        self,
        filename: str,
        content: bytes,
        mime_type: Optional[str] = None,
    ) -> str:
        mime = mime_type or "application/octet-stream"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            files = {"file": (filename, content, mime)}
            data = {"user": self.config.user_id}
            headers = {"Authorization": f"Bearer {self.config.api_key}"}
            response = await client.post(
                f"{self.config.base_url}/files/upload",
                headers=headers,
                data=data,
                files=files,
            )
        if response.status_code >= 400:
            raise HTTPException(
                status_code=502,
                detail=f"Dify file upload failed: {response.text}",
            )
        payload = response.json()
        file_id = payload.get("id") or payload.get("data", {}).get("id")
        if not file_id:
            raise HTTPException(status_code=502, detail="Dify upload response missing file id")
        return file_id

    async def _upload_local_path(self, photo: str) -> str:
        path = Path(photo).expanduser()
        if not path.exists():
            raise HTTPException(status_code=400, detail=f"File not found: {path}")
        mime_type, _ = mimetypes.guess_type(str(path))
        with path.open("rb") as file_handle:
            content = file_handle.read()
        return await self._upload_binary(path.name, content, mime_type)

    async def _upload_form_file(self, upload: UploadFile) -> str:
        filename = upload.filename or "upload"
        content = await upload.read()
        return await self._upload_binary(filename, content, upload.content_type)

    async def _build_photo_payload(
        self,
        payload: ReviewPayload,
        photo_upload: Optional[UploadFile],
    ) -> Optional[Dict[str, Any]]:
        if photo_upload:
            file_id = await self._upload_form_file(photo_upload)
            return {
                "type": "image",
                "transfer_method": "local_file",
                "upload_file_id": file_id,
            }
        if not payload.photo:
            return None
        if payload.photo.lower().startswith(("http://", "https://")):
            return {
                "type": "image",
                "transfer_method": "remote_url",
                "url": payload.photo,
                "remote_url": payload.photo,
            }
        file_id = await self._upload_local_path(payload.photo)
        return {
            "type": "image",
            "transfer_method": "local_file",
            "upload_file_id": file_id,
        }

    async def submit(
        self,
        payload: ReviewPayload,
        photo_upload: Optional[UploadFile] = None,
    ) -> Dict[str, Any]:
        inputs: Dict[str, Any] = {}
        if payload.text and payload.text.strip():
            trimmed = payload.text.strip()
            inputs["text"] = trimmed
            inputs["Content"] = trimmed

        photo = await self._build_photo_payload(payload, photo_upload)
        if photo:
            inputs["photo"] = photo

        if not inputs:
            raise HTTPException(status_code=400, detail="At least one input (text or photo) is required.")

        request_body = {
            "app_id": self.config.app_id,
            "inputs": inputs,
            "response_mode": "blocking",
            "user": self.config.user_id,
        }
        headers = {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.config.base_url}/workflows/run",
                headers=headers,
                json=request_body,
            )

        if response.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"Dify workflow failed: {response.text}")

        data = response.json()
        outputs = data.get("data", {}).get("outputs") or data.get("outputs")
        status = data.get("data", {}).get("status") or data.get("status") or "succeeded"
        error = data.get("data", {}).get("error") or data.get("error")

        if status == "failed":
            raise HTTPException(status_code=502, detail=error or "Workflow failed")

        return outputs or {}

