/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // sharp (native binary) and heic-convert's libheif-js (WASM + dynamic
  // require) shouldn't be run through webpack's bundler — Node's own
  // require() handles them correctly, webpack's static analysis doesn't
  // (surfaces as a "Critical dependency" warning otherwise). Used by
  // lib/image-upload.ts (Custom Order photo processing).
  experimental: {
    serverComponentsExternalPackages: ["sharp", "heic-convert", "libheif-js"],
  },

  images: {
    // Product photos are served from /public/uploads (see TECH_STACK.md).
    // Add remotePatterns here if/when images move to an external host.
    formats: ["image/avif", "image/webp"],
  },

  // Security headers — see SECURITY_CHECKLIST.md §3 "Security headers".
  // Cloudflare/Nginx add their own layer in production (HOSTING_HOSTINGER.md),
  // these ensure the app is safe even served directly.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
