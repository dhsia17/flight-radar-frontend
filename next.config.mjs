/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow server components to connect to Turso
  serverExternalPackages: ["@libsql/client"],
};

export default nextConfig;
