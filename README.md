# Sentinel Review - 内容审查系统

[![React](https://img.shields.io/badge/Frontend-React_19-blue)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

Sentinel Review 是一个现代化的内容审查系统，结合了人工智能分析和人工复核机制，并通过图像模糊与文本毒性降低来保护人类审核员的心理健康。系统采用前后端分离架构，前端基于 React + Tailwind CSS 构建，提供直观易用的三栏式界面；后端使用 FastAPI 实现安全的中间层服务，保护敏感的 API 密钥。

## 🔍 功能特性

- **AI 辅助审查**: 集成 Dify AI 工作流，自动分析内容风险
- **人机协同**: 提供直观的界面供人工复核 AI 分析结果
- **双模式支持**: 支持单条内容审查和批量内容审查
- **多媒体支持**: 同时支持文本和图像内容的审查
- **本地文件处理**: 自动处理本地图片文件上传
- **安全架构**: 通过中间层隐藏敏感凭证，保障系统安全
- **响应式设计**: 基于 Tailwind CSS 的现代化 UI 设计
- **国际化支持**: 内置中英文界面切换

## 📦 安装与配置

### 环境要求

- Node.js ≥ 18
- Python ≥ 3.8
- Dify 平台账号及相关配置

### 前端安装

```bash
cd frontend
npm install
# 或者使用 yarn
yarn install
# 或者使用 pnpm
pnpm install
```

### 后端安装

```bash
cd server
# 使用 venv 创建虚拟环境
python -m venv .venv
. .venv/Scripts/activate  # Windows
# 或 source .venv/bin/activate (Linux/Mac)
# 使用 conda 创建虚拟环境
conda create -n sentinel-review python=3.10
conda activate sentinel-review
pip install -r requirements.txt
```

### 环境配置

1. 前端配置：
   ```bash
   cd frontend
   cp env.example .env
   ```
   在 `frontend/.env` 文件中设置：
   ```
   VITE_PROXY_BASE_URL=http://localhost:9000
   ```

2. 后端配置：
   ```bash
   cd server
   cp env.example .env
   ```
   在 `server/.env` 文件中设置 Dify 相关参数：
   ```
   DIFY_BASE_URL=https://api.dify.ai/v1
   DIFY_API_KEY=your_api_key
   DIFY_APP_ID=your_app_id
   DIFY_USER_ID=your_user_id
   ```

### 快速启动

1. 启动后端服务：
   ```bash
   cd server
   uvicorn main:app --reload --port 9000
   ```

2. 启动前端应用：
   ```bash
   cd frontend
   npm run dev
   # 或者使用 yarn
   yarn dev
   # 或者使用 pnpm
   pnpm dev
   ```

访问 http://localhost:5173 查看应用。


## 🏗 项目结构

```
.
├── frontend/                    # 前端应用
│   ├── components/              # React 组件
│   │   ├── ui/                  # 通用UI组件
│   │   ├── LeftPanel.tsx        # 左侧面板(输入区域)
│   │   ├── CenterPanel.tsx      # 中间面板(核心复核区域)
│   │   └── RightPanel.tsx       # 右侧面板(进度与AI分析)
│   ├── services/                # API服务
│   │   └── dify.ts              # Dify API集成
│   ├── App.tsx                  # 主应用容器
│   └── ...
└── server/                      # 后端服务(FastAPI)
    ├── main.py                  # 应用入口
    ├── requirements.txt         # Python依赖
    └── README.md                # 后端说明文档
```