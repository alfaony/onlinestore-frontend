// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Memungkinkan verifikasi build berjalan tanpa mengganggu server dev aktif.
  output: 'standalone',  // ← tambah baris ini
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/**'
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      {
        protocol: 'http',
        hostname: 'backend.test',
      },
      {
        protocol: 'https',
        hostname: 'api.seraso.id',    // ← production
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
    ],
  },
}

export default nextConfig
