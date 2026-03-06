import './globals.css';
import { Shell } from '@/components/shell';

export const metadata = {
  title: 'Personal HQ',
  description: 'A personal tracker app for money, habits, skills, work, travel, and wishlist planning.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
