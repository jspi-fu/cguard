# 审核接口规范

本文档描述 Sentinel Review 项目当前采用的“前端 ⇆ FastAPI 网关”通信协议。该协议已与具体的审核引擎解耦，后端可自由替换底层实现（当前为 Dify Workflow），前端无需感知差异。

## 1. 基础约定

- **Base URL**：`http://<gateway-host>:9000`（由 `VITE_PROXY_BASE_URL` 配置）。
- **鉴权**：目前无需额外 Header，后端通过 `.env` 管理第三方凭证。
- **字符编码**：统一使用 UTF-8；CSV 解析额外兼容 GBK / GB2312。
- **时间戳**：所有时间字段使用毫秒级 Unix 时间。

## 2. 数据模型

| 字段 | 位置 | 类型 | 说明 |
| :--- | :--- | :--- | :--- |
| `id` | form-data / JSON | `string` | 可选。自定义样本 ID，便于结果回写进度网格。|
| `text` | form-data / JSON | `string` | 可选。待审文本。|
| `photo` | form-data / JSON | `string` | 可选。图片远程 URL 或服务器可访问的本地路径。|
| `photo_file` | form-data | `File` | 可选。直接上传图片文件。与 `photo` 二选一。|

响应统一返回：

```json
{
  "id": "与请求对应的 ID，可为空",
  "status": "succeeded | failed",
  "outputs": {
    "type": "仅含标签时的提示",
    "text": "净化后的文本",
    "content": "原始文本",
    "photo": { "remote_url": "..." },
    "results": {
      "有害内容类型": ["色情", "暴力"],
      "原因解释": "模型解释文本"
    }
  },
  "error": "status = failed 时的错误描述"
}
```

> `outputs` 内部字段遵循业务语义，底层审核引擎可自行扩展，但需保持 `type/results/text/content/photo` 这些核心键与前端约定一致。

## 3. 接口定义

### 3.1 `POST /api/review/single`

- **Content-Type**：`multipart/form-data`
- **用途**：单条样本审核（左侧“单次输入”入口）。

| 字段 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | string | 否 | 不提供时后端自动生成。|
| `text` | string | 否 | 待审文本。|
| `photo` | string | 否 | 远程 URL 或服务端可读的本地路径。|
| `photo_file` | file | 否 | 浏览器直接上传的图片。|

示例（curl）：

```bash
curl -X POST http://localhost:9000/api/review/single \
  -F "id=sample-001" \
  -F "text=待审文本" \
  -F "photo=https://example.com/image.png"
```

返回：

```json
{
  "id": "sample-001",
  "status": "succeeded",
  "outputs": {
    "text": "净化文本",
    "content": "原始文本",
    "photo": { "remote_url": "https://..." },
    "results": {
      "有害内容类型": ["Violence"],
      "原因解释": "描述信息"
    }
  }
}
```

### 3.2 `POST /api/review/batch`

- **Content-Type**：`application/json`
- **用途**：批量样本审核（左侧“批量输入”入口）。

请求体：

```json
{
  "items": [
    { "id": "1", "text": "内容A", "photo": "D:\\materials\\1.png" },
    { "id": "2", "photo": "https://cdn.example.com/img.jpg" }
  ]
}
```

返回：

```json
[
  { "id": "1", "status": "succeeded", "outputs": { ... } },
  { "id": "2", "status": "failed", "error": "Dify API error: ..." }
]
```

后端会在任务之间添加 350ms 缓冲，前端依序展示 Toast 并将结果写入 `{date}_review_results.csv`。

## 4. 文件解析规则

1. **浏览器上传**：`photo_file` 直接由 FastAPI 上传到审核引擎。
2. **远程 URL**：`photo` 以 `http(s)` 开头时走 `remote_url` 通道。
3. **本地路径**：`photo` 为本地路径时，由 FastAPI 按绝对/相对路径读取文件并再上传。
4. **批量模板**：CSV / XLS / XLSX 内必须包含 `ID`, `content`, `photo` 列，其中 `content` 会映射为请求体的 `text`。

## 5. 状态码与错误

| HTTP 状态 | 场景 |
| :--- | :--- |
| `200` | 业务成功（批量接口会按条返回 `succeeded/failed`）。 |
| `400` | 输入缺失（text/photo 均为空、本地路径不存在等）。 |
| `502` | 第三方审核引擎失败或上传失败，`error` 字段包含原始信息。 |
| `500` | FastAPI 内部异常。 |

前端在收到失败条目时会写入审查日志并使用红色 Toast 提示。

## 6. 版本与扩展

- 当前实现：`server/services/review_engine.py` 对接 Dify Workflow。
- 替换审核算法时，只需实现同签名的 `submit(payload, photo_upload)` 方法并在 `main.py` 中替换实例，前端及文档无需调整。
- 若需要扩展输出字段，应在文档中补充说明并保持兼容旧字段，以免破坏既有 UI 渲染逻辑。

