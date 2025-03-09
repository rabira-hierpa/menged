/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    domains: ["images.unsplash.com", "upload.wikimedia.org"],
  },
};

export default nextConfig;
