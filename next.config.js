/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

module.exports = withPWA({
  // Increase the body size limit for API routes (needed for base64 photo uploads)
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
});