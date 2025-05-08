/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/a/**', // Allows any path starting with /a/ which is common for Google user content
      },
    ],
  },
};

export default nextConfig; 