import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sentinel Review - 内容审查系统',
  description: 'AI 辅助内容审查系统',
  icons: {
    icon: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  )
}

