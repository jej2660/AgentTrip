import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Downhill Route - 내리막 중심 체력 아낌 길찾기',
  description: '오르막 피로를 최소화하는 맞춤형 관광 동선 추천 서비스',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col items-center">
        <main className="w-full max-w-[430px] min-h-screen bg-white shadow-md flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
