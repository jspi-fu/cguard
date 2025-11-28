## POST /workflows/run

### Request Body
- inputs (object) Required 允许传入 App 定义的各变量值。 inputs 参数包含了多组键值对（Key/Value pairs），每组的键对应一个特定变量，每组的值则是该变量的具体值。变量可以是文件列表类型。 文件列表类型变量适用于传入文件结合文本理解并回答问题，仅当模型支持该类型文件解析能力时可用。如果该变量是文件列表类型，该变量对应的值应是列表格式，其中每个元素应包含以下内容：
    - type (string) 支持类型：
        - document 具体类型包含：'TXT', 'MD', 'MARKDOWN', 'PDF', 'HTML', 'XLSX', 'XLS', 'DOCX', 'CSV', 'EML', 'MSG', 'PPTX', 'PPT', 'XML', 'EPUB'
        - image 具体类型包含：'JPG', 'JPEG', 'PNG', 'GIF', 'WEBP', 'SVG'
        - audio 具体类型包含：'MP3', 'M4A', 'WAV', 'WEBM', 'AMR'
        - video 具体类型包含：'MP4', 'MOV', 'MPEG', 'MPGA'
        - custom 具体类型包含：其他文件类型
    - transfer_method (string) 传递方式，remote_url 图片地址 / local_file 上传文件
    - url (string) 图片地址（仅当传递方式为 remote_url 时）
    - upload_file_id (string) 上传文件 ID（仅当传递方式为 local_file 时）


## POST /files/upload
上传文件并在发送消息时使用，可实现图文多模态理解。 支持您的工作流程所支持的任何格式。 上传的文件仅供当前终端用户使用。
Request Example:
```bash
curl -X POST 'https://api.dify.ai/v1/files/upload' \
--header 'Authorization: Bearer {api_key}' \
--form 'file=@localfile;type=image/[png|jpeg|jpg|webp|gif]' \
--form 'user=abc-123'
```
Response Example:
```json
{
  "id": "72fa9618-8f89-4a37-9b33-7e1178a24a67",
  "name": "example.png",
  "size": 1024,
  "extension": "png",
  "mime_type": "image/png",
  "created_by": 123,
  "created_at": 1577836800,
}
```

### Request Body
该接口需使用 multipart/form-data 进行请求。
- file (file) 要上传的文件。
- user (string) 用户标识，用于定义终端用户的身份，必须和发送消息接口传入 user 保持一致。服务 API 不会共享 WebApp 创建的对话。

### Response
成功上传后，服务器会返回文件的 ID 和相关信息。

- id (uuid) ID
- name (string) 文件名
- size (int) 文件大小（byte）
- extension (string) 文件后缀
- mime_type (string) 文件 mime-type
- created_by (uuid) 上传人 ID
- created_at (timestamp) 上传时间

### Errors
- 400，no_file_uploaded，必须提供文件
- 400，too_many_files，目前只接受一个文件
- 400，unsupported_preview，该文件不支持预览
- 400，unsupported_estimate，该文件不支持估算
- 413，file_too_large，文件太大
- 415，unsupported_file_type，不支持的扩展名，当前只接受文档类文件
- 503，s3_connection_failed，无法连接到 S3 服务
- 503，s3_permission_denied，无权限上传文件到 S3
- 503，s3_file_too_large，文件超出 S3 大小限制