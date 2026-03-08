import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Personal HQ',
    short_name: 'PersonalHQ',
    description: 'Your personal life tracker',
    start_url: '/',
    display: 'standalone',
    background_color: '#080a0f',
    theme_color: '#00d4aa',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}