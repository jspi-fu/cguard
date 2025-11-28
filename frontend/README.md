# Sentinel Review - 内容审查系统 (Content Moderation Dashboard)

Sentinel Review 是一个基于 React + Tailwind CSS 构建的现代化内容审查 Web 应用原型。它采用了经典的“左-中-右”三栏布局，专为高效的人工复核（Human-in-the-loop）场景设计。

## 🛠 技术栈

- **核心框架**: React 19 (TypeScript) + Vite
- **样式方案**: Tailwind CSS
- **图标库**: Lucide React
- **API 集成**: Fetch API (支持流式响应 / SSE)

## 🏗 项目架构

本项目采用单页应用 (SPA) 架构，状态提升至根组件管理，通过 Props 下发至各功能面板。

### 目录结构

```
/
├── index.html              # 入口 HTML
├── src/
    ├── index.tsx           # React 挂载点
    ├── App.tsx             # 主应用容器 (状态管理、布局组合)
    ├── config.ts           # 环境变量配置
    ├── types.ts            # TypeScript 类型定义 (ContentItem, RiskType 等)
    ├── translations.ts     # 国际化资源文件 (中/英)
    ├── mockData.ts         # 演示用假数据
    ├── services/
    │   └── review.ts       # 审核 API 服务 (封装 FastAPI 网关调用)
    └── components/
        ├── LeftPanel.tsx   # 左侧面板 (输入与上传)
        ├── CenterPanel.tsx # 中间面板 (核心复核与展示)
        ├── RightPanel.tsx  # 右侧面板 (进度与 AI 分析)
        └── ui/             # 通用 UI 组件
            ├── Badge.tsx
            ├── Toast.tsx
            └── Tooltip.tsx
```

### 数据流向

1.  **输入**: 用户在 `LeftPanel` 输入文本或上传图片，或点击“开始审查”调用 FastAPI 网关。
2.  **处理**: `server/main.py` 负责读取 `.env`、解析本地路径/图片并对接当前审核引擎（默认实现为 Dify），前端通过 `services/review.ts` 获取标准化结果。
3.  **状态**: `App.tsx` 接收新数据，更新 `items` 数组，并管理当前索引 `currentIndex` 和审核决定 `decisions`。
4.  **展示**: `CenterPanel` 渲染当前 item，`RightPanel` 计算进度和展示 AI 分析结果。

## ⚙️ 环境配置

在 `frontend` 目录下创建 `.env` 文件，配置 FastAPI 网关地址：

```
VITE_PROXY_BASE_URL=http://localhost:9000
```

> 该地址需与 FastAPI 服务 (`uvicorn main:app --port 9000`) 保持一致。Dify 的 `BASE_URL/API_KEY/APP_ID` 现已由后端读取 `.env` 管理，前端无须再持有密钥。

---

## 🧩 UI 组件详解

以下是主要 UI 组件的位置及功能描述：

### 1. 核心面板组件

| 组件名称 | 文件位置 | 核心功能描述 |
| :--- | :--- | :--- |
| **LeftPanel** | `components/LeftPanel.tsx` <br> (约 110 行) | **用户输入区**。<br>- 包含“批量输入”和“单次输入”两个 Tab。<br>- 处理文件拖拽上传 UI。<br>- 包含文本输入框和图片上传按钮。<br>- 底部包含中英文切换按钮。<br>- 触发 API 调用的入口。 |
| **CenterPanel** | `components/CenterPanel.tsx` <br> (约 180 行) | **核心复核区**。<br>- 展示待审核的图片（支持高斯模糊/点击查看）。<br>- 展示文本内容（支持去毒/原句切换）。<br>- 包含“通过”和“拒绝”的大尺寸操作按钮。<br>- 处理键盘快捷键（空格查看、左右键导航）。 |
| **RightPanel** | `components/RightPanel.tsx` <br> (约 130 行) | **辅助信息区**。<br>- **顶部**：进度条与答题卡式网格导航（自动跟随滚动）。<br>- **底部**：AI 模型分析结果展示（风险标签、原因解释）。 |

### 2. 通用 UI 组件 (components/ui/)

| 组件名称 | 文件位置 | 功能描述 |
| :--- | :--- | :--- |
| **Toast** | `components/ui/Toast.tsx` <br> (约 70 行) | **全局通知组件**。<br>- 提供 `ToastProvider` 上下文。<br>- 支持成功、警告、信息三种状态的浮层提示。 |
| **Badge** | `components/ui/Badge.tsx` <br> (约 20 行) | **标签组件**。<br>- 用于显示风险类型（如 Sexual, Violence 等）。<br>- 根据风险等级自动映射颜色（红/黄/绿）。 |
| **Tooltip** | `components/ui/Tooltip.tsx` <br> (约 20 行) | **工具提示组件**。<br>- 用于在鼠标悬停时显示辅助说明文字。 |