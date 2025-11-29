/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Netlify 部署配置
  // 在 Windows 上禁用 standalone 模式以避免符号链接权限问题
  // Netlify 插件会自动处理部署，不需要 standalone 模式
  output: process.platform === 'win32' ? undefined : 'standalone',
  // 允许访问外部图片
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  // 构建时忽略 ESLint 错误
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 构建时忽略 TypeScript 错误（类型检查已在编译阶段完成）
  typescript: {
    ignoreBuildErrors: false,
  },
  // 确保服务端环境变量不会在构建时被替换到客户端代码中
  // 只有 NEXT_PUBLIC_ 前缀的环境变量会被替换到客户端
  // DIFY_* 变量只在服务端使用，不会被打包到客户端
}

module.exports = nextConfig

