import type { Metadata } from 'next';
import './globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'เช็กก่อนเซ็น | ระบบตรวจสอบสัญญาตามตัวบทกฎหมายจริง',
  description: 'ตรวจสัญญาเช่าหอพัก อพาร์ตเมนต์ คอนโด ว่าข้อไหนขัดประกาศ สคบ. ตัดสินด้วยโค้ด TypeScript ตามตัวบทจริงในราชกิจจานุเบกษา ทำงานในเครื่อง 100% ไม่เก็บข้อมูล',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="min-h-screen flex flex-col antialiased">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
