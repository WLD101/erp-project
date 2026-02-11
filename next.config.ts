/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure environment variables are available at build time
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_MOCK_SUPER_ADMIN: process.env.NEXT_PUBLIC_MOCK_SUPER_ADMIN,
  },

  // Optimize images
  images: {
    domains: ['pepolhskamqhhjqnmkex.supabase.co'],
    formats: ['image/avif', 'image/webp'],
  },

  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Disable x-powered-by header for security
  poweredByHeader: false,
}

export default nextConfig
