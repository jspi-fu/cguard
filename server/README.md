# FastAPI 中间层

该服务负责：

1. 读取 `.env` 中的审核引擎凭证（当前实现仍为 Dify）并封装在 `services/review_engine.py` 中；
2. 当批量模板中的 `photo` 是本地路径时，直接从磁盘读取文件并上传；
3. 暴露 `POST /api/review/single` 与 `POST /api/review/batch` 供前端调用。

## 快速开始

```bash
cd server
python -m venv .venv
. .venv/Scripts/activate  # Windows
pip install -r requirements.txt
cp env.sample .env        # 修改为真实的 Dify 配置
uvicorn main:app --reload --port 9000
```

## API 概览

### `POST /api/review/single`

```json
{
  "id": "可选 ID",
  "text": "待审文本",
  "photo": "https://... 或 D:\\本地图片.png"
}
```

返回：

```json
{
  "id": "可选 ID",
  "status": "succeeded",
  "outputs": { "...": "..." }
}
```

### `POST /api/review/batch`

```json
{
  "items": [
    { "id": "1", "text": "xxx", "photo": "D:\\image.png" },
    { "id": "2", "photo": "https://example.com/a.jpg" }
  ]
}
```

返回每条记录的执行结果，失败时 `status` 为 `failed` 并附带错误信息。

更多字段、错误码与文件解析细节参考 `../docs/api-spec.md`。

