/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@portal/types', '@portal/validation'],
  // Images from the API server
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '4000' },
    ],
  },
};
export default nextConfig;
