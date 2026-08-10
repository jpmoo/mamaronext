import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mamaronext — 2026-2027 School and District Goals',
  description:
    'Visual navigation of Mamaroneck UFSD 2026-2027 district and school goals, organized by Superintendent Initiative.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
