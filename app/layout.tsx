import React from "react"
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://vuuzy.com'),
  title: 'Remove Backgrounds Instantly with AI | Vuuzy',
  description: 'Upload any photo and remove the background in seconds — or generate a brand new one with AI.',
  keywords: ['background remover', 'AI image editor', 'remove background free', 'transparent background', 'AI background generator'],
  alternates: {
    canonical: '/',
  },
  generator: 'v0.app',
  openGraph: {
    title: 'Remove Backgrounds Instantly with AI | Vuuzy',
    description: 'Upload any photo and remove the background in seconds — or generate a brand new one with AI.',
    url: 'https://vuuzy.com',
    siteName: 'Vuuzy',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vuuzy AI Background Remover',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Remove Backgrounds Instantly with AI | Vuuzy',
    description: 'Upload any photo and remove the background in seconds — or generate a brand new one with AI.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'googleed849a59572d3fe3',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
