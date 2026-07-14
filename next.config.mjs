/** @type {import('next').NextConfig} */
const nextConfig = {
  // node-ical's Temporal polyfill trips up Turbopack's build-time analysis
  // when bundled inline; load it as a plain runtime require instead.
  serverExternalPackages: ["node-ical"],
};

export default nextConfig;
