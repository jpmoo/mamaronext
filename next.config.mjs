/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production builds write to a separate directory so `npm run build` can't
  // clobber a running `npm run dev` server's .next cache.
  distDir: process.env.NEXT_DIST_DIR || '.next',
};
export default nextConfig;
