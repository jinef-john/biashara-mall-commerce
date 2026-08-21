//@ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ik.imagekit.io' },
      // Buyer avatars in the inbox: User.avatarUrl is mirrored from Clerk.
      { protocol: 'https', hostname: 'img.clerk.com' },
    ],
  },
};

module.exports = nextConfig;
