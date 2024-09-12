/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    GCP_PROJECT_ID: process.env.GCP_PROJECT_ID,
    GCP_BUCKET_NAME: process.env.GCP_BUCKET_NAME,
  },
  publicRuntimeConfig: {
    NEXT_PUBLIC_CONVERSION_FUNCTION_URL: process.env.CONVERSION_FUNCTION_URL,
  },
};

export default nextConfig;
