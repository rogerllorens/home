import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co'
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      }
    ]
  },
  logging: {
    fetches: {
      fullUrl: false
    }
  }
};

const sentryWebpackPluginOptions = {
  silent: true,
  widenClientFileUpload: true
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
