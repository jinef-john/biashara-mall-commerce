//@ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ik.imagekit.io' },
      // Buyer avatars in the inbox: User.avatarUrl is mirrored from Clerk.
      { protocol: 'https', hostname: 'img.clerk.com' },
      // Seed data only (scripts/seed-lovo-products.ts pulls sample images
      // from Amazon's CDN) — real listings all go through ImageKit.
      { protocol: 'https', hostname: 'm.media-amazon.com' },
    ],
  },
};

module.exports = nextConfig;
