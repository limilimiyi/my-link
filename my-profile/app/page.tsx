export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-8">
      <main className="flex flex-col items-center gap-8 text-center max-w-2xl">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            이림
          </h1>
          <p className="text-xl leading-relaxed text-zinc-600 dark:text-zinc-400">
            안녕하세요! 한양대학교에 재학 중이며, <br />
            바이브 코딩을 열심히 배우고 있는 대학생입니다.
          </p>
        </div>
        
        <div className="h-px w-24 bg-zinc-300 dark:bg-zinc-800" />
        
        <div className="flex gap-4">
          <button className="px-6 py-2 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 transition-colors dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">
            Contact
          </button>
          <button className="px-6 py-2 rounded-full border border-zinc-300 hover:bg-zinc-100 transition-colors dark:border-zinc-700 dark:hover:bg-zinc-900">
            Projects
          </button>
        </div>
      </main>
    </div>
  );
}
