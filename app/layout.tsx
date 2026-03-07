import './globals.css';
import { Shell } from '@/components/shell';

export const metadata = {
  title: 'Personal HQ',
  description: 'A personal tracker app for money, habits, skills, work, travel, and wishlist planning.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA manifest — must be publicly accessible, no auth */}
        <link rel="manifest" href="/manifest.json" />

        {/* Browser chrome colour */}
        <meta name="theme-color" content="#00d4aa" />

        {/* PWA installability — modern tag replaces deprecated apple-mobile-web-app-capable */}
        <meta name="mobile-web-app-capable" content="yes" />

        {/* iOS-specific */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Personal HQ" />

        {/* Viewport with safe area for notched phones */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

        {/* Anti-flash: apply saved theme before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('phq-theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`,
          }}
        />
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}``