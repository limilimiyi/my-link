"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/firebase"
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from "firebase/auth"

// 🐆 테마용 호피 무늬 패턴 스타일 (불규칙한 디자인)
const leopardPattern = {
  backgroundImage: `radial-gradient(ellipse at 10px 10px, #8b5a2b 4px, #3d2a1c 6.5px, transparent 7px),
                    radial-gradient(circle at 28px 12px, #3d2a1c 2.5px, transparent 3px),
                    radial-gradient(ellipse at 38px 28px, #8b5a2b 5px, #3d2a1c 8px, transparent 8.5px),
                    radial-gradient(circle at 18px 38px, #3d2a1c 3.5px, transparent 4px),
                    radial-gradient(ellipse at 8px 30px, #8b5a2b 3px, #3d2a1c 5.5px, transparent 6px)`,
  backgroundColor: '#fcd34d',
  backgroundSize: '48px 48px'
};

export default function LoginPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // 로그인 상태 감지 후 자동 리다이렉트
  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        router.push("/mypage")
      } else {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleGoogleLogin = async () => {
    if (!auth) {
      alert("⚠️ 아직 설정이 안 됐어! Firebase 콘솔 확인해줘 💅✨")
      return
    }

    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
      router.push("/mypage")
    } catch (error: any) {
      console.error("구글 로그인 실패:", error)
      if (error.code === "auth/configuration-not-found") {
        alert("⚠️ Authentication 기능이 비활성화야! 켜고 와줘 💖")
      } else if (error.code !== "auth/popup-closed-by-user") {
        alert("에러 났어: " + error.message)
      }
    }
  }

  if (loading || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAFA] font-[var(--font-hi-melody)]">
        <div className="text-6xl animate-bounce mb-4">🎀</div>
        <p className="text-3xl font-black text-pink-500 animate-pulse">
          로딩 중이야 쫌만 기다려봐 💅✨
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAFA] px-4 font-[var(--font-hi-melody)] selection:bg-pink-500/30 overflow-hidden relative">
      
      {/* 백그라운드 디자인 요소 */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <div className="absolute top-[10%] left-[10%] text-6xl animate-pulse opacity-50">✨</div>
        <div className="absolute bottom-[20%] right-[10%] text-7xl animate-bounce opacity-40">💖</div>
        <div className="absolute bottom-[10%] left-[20%] text-6xl animate-pulse opacity-60 delay-300">💅</div>
      </div>

      <div className="relative z-10 w-full max-w-sm animate-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6 hover:scale-110 transition-transform">
            <span className="text-5xl">🔗</span>
          </Link>
          <h1 className="text-5xl font-[var(--font-black-han)] text-pink-500 italic drop-shadow-[0_4px_0_rgba(0,0,0,0.1)] mb-2">
            마이링크 로그인 💖
          </h1>
          <p className="text-2xl font-bold text-pink-400">
            구글로 빠르게 들어와! 💅✨
          </p>
        </div>

        <div className="relative rounded-[3rem] border-[6px] border-pink-500 bg-white p-10 shadow-[16px_16px_0px_0px_rgba(252,211,77,1)] transition-all overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 opacity-80 pointer-events-none z-0" style={{ ...leopardPattern, clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }}></div>
          
          <button
            onClick={handleGoogleLogin}
            className="group relative flex w-full items-center justify-center gap-4 rounded-3xl bg-yellow-400 px-6 py-6 text-2xl font-[var(--font-black-han)] text-pink-600 shadow-[6px_6px_0px_0px_rgba(236,72,153,1)] border-4 border-pink-500 transition-all hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(236,72,153,1)] active:scale-95 mt-6"
          >
            <span className="text-4xl bg-white p-2 rounded-full border-2 border-pink-500 shadow-sm">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
            </span>
            구글로 계속하기
          </button>
          
          <p className="mt-8 text-center text-lg font-bold text-neutral-400 break-keep leading-relaxed">
            로그인하면 <Link href="#" className="text-pink-400 hover:text-pink-600 underline decoration-wavy">약관</Link>이랑 <Link href="#" className="text-pink-400 hover:text-pink-600 underline decoration-wavy">개인정보</Link>에 완전 동의하는 거임! 🎀
          </p>
        </div>
        
        <div className="mt-12 text-center">
          <Link href="/" className="text-2xl font-[var(--font-black-han)] text-pink-400 hover:text-pink-600 transition-colors drop-shadow-sm">
            ← 뒤로 가기 💅
          </Link>
        </div>
      </div>
    </div>
  )
}
