// next.config.js
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Resolve `fs` and other Node.js modules to empty in the browser environment
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        os: false,
        module: false
      };
    }
    return config;
  },
};

module.exports = nextConfig;