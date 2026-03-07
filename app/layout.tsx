import './globals.css';
import { Shell } from '@/components/shell';

export const metadata = {
  title: 'Personal HQ',
  description: 'A personal tracker app for money, habits, skills, work, travel, and wishlist planning.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Anti-flash: set theme before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('phq-theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', t);
                } catch(e) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}