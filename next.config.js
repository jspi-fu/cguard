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
}

module.exports = nextConfig

