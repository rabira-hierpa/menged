/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    domains: [
      "images.unsplash.com",
      "upload.wikimedia.org",
      "digitaltransport4africa.org",
    ],
  },
};

export default nextConfig;
