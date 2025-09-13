import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '诸葛调度 - 智能蓝领派工平台',
  description: '让每一次派工都精准高效。AI智能匹配，连接工人与企业。',
  icons: {
    icon: '/images/zhuge.png',
    shortcut: '/images/zhuge.png',
    apple: '/images/zhuge.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  )
}