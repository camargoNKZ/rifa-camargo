import type { Metadata } from 'next';
import { Fredoka, Nunito_Sans } from 'next/font/google';
import './globals.css';

const display = Fredoka({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const body = Nunito_Sans({ variable: '--font-body', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Gestão da Rifa Doce | Camargo Confeitaria',
  description: 'Painel para gerenciar os números e compradores da Rifa Doce.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${display.variable} ${body.variable}`}>{children}</body>
    </html>
  );
}
