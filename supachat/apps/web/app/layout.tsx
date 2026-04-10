import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SupaChat — Conversational Analytics',
  description: 'Ask questions in plain English. Get SQL, tables, and charts back.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-mono antialiased">{children}</body>
    </html>
  );
}
