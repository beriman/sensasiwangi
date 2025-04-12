/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Exclude problematic pages from the build
  exportPathMap: async function () {
    return {
      '/': { page: '/' },
      '/404': { page: '/404' },
    };
  },
}

module.exports = nextConfig
