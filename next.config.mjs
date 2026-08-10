/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production builds write to a separate directory so `npm run build` can't
  // clobber a running `npm run dev` server's .next cache.
  distDir: process.env.NEXT_DIST_DIR || '.next',

  // Set BASE_PATH when serving under a sub-path behind a reverse proxy — e.g.
  // BASE_PATH=/goals for https://example.org/goals. Without it the HTML asks for
  // /_next/static/... at the domain root, which the proxy won't route to this
  // app, and the page renders unstyled. Must be set at BUILD time, not just at
  // start time, since the asset URLs are baked into the output.
  ...(process.env.BASE_PATH ? { basePath: process.env.BASE_PATH } : {}),

  // STATIC_EXPORT=1 emits a plain folder of HTML/CSS/JS into out/ instead of a
  // server build. Nothing in this app runs server-side, so the static site is
  // fully equivalent — see `npm run export`.
  ...(process.env.STATIC_EXPORT ? { output: 'export' } : {}),
};
export default nextConfig;
