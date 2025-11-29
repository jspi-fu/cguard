// 服务端专用模块 - 使用 Node.js fs 模块，只能在服务端运行
import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';
import FormData from 'form-data';

// 获取环境变量（延迟到运行时读取）
function getEnvConfig(): EngineConfig {
  const DIFY_BASE_URL = process.env.DIFY_BASE_URL;
  const DIFY_API_KEY = process.env.DIFY_API_KEY;
  const DIFY_APP_ID = process.env.DIFY_APP_ID;
  const DIFY_USER_ID = process.env.DIFY_USER_ID || 'sentinel-review-web';

  // 检查必需的环境变量
  const missing: string[] = [];
  if (!DIFY_BASE_URL) missing.push('DIFY_BASE_URL');
  if (!DIFY_API_KEY) missing.push('DIFY_API_KEY');
  if (!DIFY_APP_ID) missing.push('DIFY_APP_ID');

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // 此时已经确保这些值不为 undefined
  return {
    baseUrl: DIFY_BASE_URL as string,
    apiKey: DIFY_API_KEY as string,
    appId: DIFY_APP_ID as string,
    userId: DIFY_USER_ID,
  };
}

// 审核引擎配置
export interface EngineConfig {
  baseUrl: string;
  apiKey: string;
  appId: string;
  userId: string;
}

// 审核输入载荷
export interface ReviewPayload {
  id?: string;
  text?: string;
  photo?: string;
}

// 文件上传结果
interface FileUploadResponse {
  id?: string;
  data?: {
    id?: string;
  };
}

// Dify 审核引擎类
export class DifyReviewEngine {
  private config: EngineConfig;
  private timeout: number;

  constructor(config?: Partial<EngineConfig>) {
    // 如果提供了完整配置，使用提供的配置；否则从环境变量读取
    if (config?.baseUrl && config?.apiKey && config?.appId) {
      this.config = {
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        appId: config.appId,
        userId: config.userId || 'sentinel-review-web',
      };
    } else {
      // 延迟到运行时读取环境变量
      const envConfig = getEnvConfig();
      this.config = {
        baseUrl: config?.baseUrl || envConfig.baseUrl,
        apiKey: config?.apiKey || envConfig.apiKey,
        appId: config?.appId || envConfig.appId,
        userId: config?.userId || envConfig.userId,
      };
    }
    this.timeout = 60000; // 60秒超时
  }

  // 上传二进制文件到 Dify
  private async uploadBinary(
    filename: string,
    content: Buffer,
    mimeType?: string
  ): Promise<string> {
    const formData = new FormData();
    formData.append('file', content, {
      filename,
      contentType: mimeType || 'application/octet-stream',
    });
    formData.append('user', this.config.userId);

    // 使用 node-fetch 兼容的方式发送 form-data
    const headers: Record<string, string> = formData.getHeaders() as Record<string, string>;
    headers['Authorization'] = `Bearer ${this.config.apiKey}`;

    const response = await fetch(`${this.config.baseUrl}/files/upload`, {
      method: 'POST',
      headers: headers,
      body: formData as unknown as BodyInit,
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Dify file upload failed: ${errorText}`);
    }

    const payload: FileUploadResponse = await response.json();
    const fileId = payload.id || payload.data?.id;
    
    if (!fileId) {
      throw new Error('Dify upload response missing file id');
    }

    return fileId;
  }

  // 上传本地路径文件
  private async uploadLocalPath(photoPath: string): Promise<string> {
    // 检查是否在 Netlify 环境（不支持本地文件系统访问）
    if (process.env.NETLIFY || process.env.VERCEL) {
      throw new Error(
        'Local file paths are not supported in serverless environments. Please use remote URLs instead.'
      );
    }

    const filePath = path.resolve(photoPath);
    
    try {
      await fs.access(filePath);
    } catch {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    return await this.uploadBinary(path.basename(filePath), content, mimeType);
  }

  // 上传 FormData 文件
  private async uploadFormFile(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return await this.uploadBinary(file.name || 'upload', buffer, file.type);
  }

  // 构建照片载荷
  // 根据 right_upload.md，工作流接收的格式是对象，包含 dify_model_identity
  // 但根据 API.md，发送给 API 的格式应该是数组（文件列表类型）或对象（单个文件类型）
  // 根据错误信息和 right_upload.md，尝试使用对象格式
  private async buildPhotoPayload(
    payload: ReviewPayload,
    photoFile?: File
  ): Promise<Record<string, unknown> | null> {
    if (photoFile) {
      const fileId = await this.uploadFormFile(photoFile);
      return {
        type: 'image',
        transfer_method: 'local_file',
        upload_file_id: fileId,
      };
    }

    if (!payload.photo) {
      return null;
    }

    // 远程 URL
    if (payload.photo.toLowerCase().startsWith('http://') || payload.photo.toLowerCase().startsWith('https://')) {
      return {
        type: 'image',
        transfer_method: 'remote_url',
        url: payload.photo,
      };
    }

    // 本地路径
    const fileId = await this.uploadLocalPath(payload.photo);
    return {
      type: 'image',
      transfer_method: 'local_file',
      upload_file_id: fileId,
    };
  }

  // 提交审核请求
  async submit(
    payload: ReviewPayload,
    photoFile?: File
  ): Promise<Record<string, unknown>> {
    const inputs: Record<string, unknown> = {};

    if (payload.text && payload.text.trim()) {
      const trimmed = payload.text.trim();
      inputs.text = trimmed;
      inputs.Content = trimmed;
    }

    const photo = await this.buildPhotoPayload(payload, photoFile);
    if (photo) {
      inputs.photo = photo;
    }

    if (Object.keys(inputs).length === 0) {
      throw new Error('At least one input (text or photo) is required.');
    }

    const requestBody = {
      app_id: this.config.appId,
      inputs,
      response_mode: 'blocking',
      user: this.config.userId,
    };

    const response = await fetch(`${this.config.baseUrl}/workflows/run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Dify workflow failed: ${errorText}`);
    }

    const data = await response.json();
    const outputs = data.data?.outputs || data.outputs;
    const status = data.data?.status || data.status || 'succeeded';
    const error = data.data?.error || data.error;

    if (status === 'failed') {
      throw new Error(error || 'Workflow failed');
    }

    return outputs || {};
  }
}

// 懒加载单例实例（延迟到首次使用时创建，避免构建时读取环境变量）
let reviewEngineInstance: DifyReviewEngine | null = null;

export function getReviewEngine(): DifyReviewEngine {
  if (!reviewEngineInstance) {
    reviewEngineInstance = new DifyReviewEngine();
  }
  return reviewEngineInstance;
}

// 为了保持向后兼容，导出单例实例（但会在首次访问时创建）
export const reviewEngine = new Proxy({} as DifyReviewEngine, {
  get(_target, prop) {
    const instance = getReviewEngine();
    const value = instance[prop as keyof DifyReviewEngine];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

