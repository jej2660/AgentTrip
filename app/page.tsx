export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h1 className="text-2xl font-bold mb-2">Downhill Route</h1>
      <p className="text-slate-600 mb-6">내리막 중심 체력 아낌 길찾기</p>
      <a
        href="/plan"
        className="w-full max-w-xs py-3 px-4 bg-blue-600 text-white font-medium rounded-lg text-center hover:bg-blue-700 transition-colors"
      >
        동인천에서 시작하기
      </a>
    </div>
  );
}
