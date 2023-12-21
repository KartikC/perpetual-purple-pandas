/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.githubusercontent.com', // Use the pattern that matches your image sources
      },
      // ...any additional patterns
    ],
  },
  // ...add any additional Next.js configuration options here
}

module.exports = nextConfig;
