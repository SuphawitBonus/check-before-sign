import type { Metadata, Viewport } from 'next';
import { Noto_Serif_Thai, IBM_Plex_Sans_Thai_Looped, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

// next/font downloads these at build time and serves them from this site,
// so visitors' browsers never contact Google Fonts (DESIGN.md §2).
const display = Noto_Serif_Thai({
  subsets: ['thai', 'latin'],
  weight: ['600', '700'],
  variable: '--font-display',
  display: 'swap',
});
const body = IBM_Plex_Sans_Thai_Looped({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['500'],
  variable: '--font-mono',
  display: 'swap',
});

const description =
  'ตอบคำถามเกี่ยวกับสัญญาเช่าที่อยู่อาศัย แล้วดูว่าข้อไหนขัด ไม่ขัด หรือบอกไม่ได้ ตามประกาศคณะกรรมการว่าด้วยสัญญา พ.ศ. 2568 ทำงานในเบราว์เซอร์ ไม่เก็บคำตอบ ไม่ใช่คำปรึกษาทางกฎหมาย';

// Absolute base for og:image. Set NEXT_PUBLIC_SITE_URL when the real domain is known;
// on Vercel the production URL is used automatically.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3020');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'เช็กก่อนเซ็น — ตรวจสัญญาเช่ากับตัวบทกฎหมายก่อนลงชื่อ',
  description,
  openGraph: {
    title: 'เช็กก่อนเซ็น — ตรวจสัญญาเช่ากับตัวบทกฎหมายก่อนลงชื่อ',
    description,
    locale: 'th_TH',
    type: 'website',
    siteName: 'เช็กก่อนเซ็น',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export const viewport: Viewport = {
  themeColor: '#101A2B',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-surface focus:px-4 focus:py-2 focus:text-ink focus:shadow-card"
        >
          ข้ามไปที่เนื้อหา
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
