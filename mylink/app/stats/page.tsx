"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { db, auth } from "@/lib/firebase"
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"
import { onAuthStateChanged, User } from "firebase/auth"
import { LinkItem } from "@/data/links"
import Link from "next/link"

// Helper function to extract hostname for favicon extraction
const getDomain = (url: string) => {
  try {
    const cleanUrl = url.trim()
    const withProtocol = cleanUrl.startsWith("http") ? cleanUrl : `https://${cleanUrl}`
    const parsed = new URL(withProtocol)
    return parsed.hostname
  } catch (e) {
    return ""
  }
}

export default function StatsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [links, setLinks] = useState<LinkItem[]>([])
  const [loadingLinks, setLoadingLinks] = useState(true)

  // 1. Auth state verification
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false)
      return
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)
    }, (error) => {
      console.error("Auth 상태 조회 실패:", error)
      setAuthLoading(false)
    })

    return () => unsubscribeAuth()
  }, [])

  // 2. Redirect to `/` if not logged in after auth check completes
  useEffect(() => {
    if (!authLoading && !user) {
      alert("로그인해주세욤~")
      router.push("/")
    }
  }, [user, authLoading, router])

  // 3. Query user links ordered by clickCount descending
  useEffect(() => {
    if (!db || !user) return

    setLoadingLinks(true)
    try {
      const q = query(
        collection(db, "users", user.uid, "links"),
        orderBy("clickCount", "desc")
      )

      const unsubscribeLinks = onSnapshot(q, (snapshot) => {
        const fetchedLinks: LinkItem[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          fetchedLinks.push({
            id: doc.id,
            title: data.title || "",
            url: data.url || "",
            icon: "link",
            clickCount: data.clickCount || 0
          })
        })
        setLinks(fetchedLinks)
        setLoadingLinks(false)
      }, (error) => {
        console.error("통계 링크 조회 중 오류:", error)
        setLoadingLinks(false)
      })

      return () => unsubscribeLinks()
    } catch (error) {
      console.error("통계 쿼리 초기화 실패:", error)
      setLoadingLinks(false)
    }
  }, [user])

  // Calculate metrics
  const totalClicks = links.reduce((sum, link) => sum + (link.clickCount || 0), 0)

  // 4. Loading State Screen
  if (authLoading || (user && loadingLinks)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FA] px-4 dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
          <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
            통계 데이터를 분석하는 중입니다...
          </p>
        </div>
      </div>
    )
  }

  // If not logged in, render null while redirecting
  if (!user) return null

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-[#F8F9FA] px-4 py-8 sm:py-12 dark:bg-neutral-950">
      
      {/* 🧭 슬림 네비게이션 헤더 */}
      <header className="w-full max-w-xl flex items-center justify-between py-3 px-4 mb-8 rounded-xl border border-neutral-200/80 bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80 shadow-xs animate-fadeIn">
        <Link href="/mypage" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-sm">⬅️</span>
          <span className="font-bold text-neutral-800 dark:text-neutral-50 text-sm">마이페이지로</span>
        </Link>
        <span className="text-xs font-bold text-neutral-500 dark:text-neutral-450 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800">
          Analytics Dashboard
        </span>
      </header>

      {/* 📊 상단 섹션 : 총 클릭수 메인 메트릭 카드 */}
      <div className="w-full max-w-xl mb-8 animate-fadeIn">
        <Card className="relative overflow-hidden border border-purple-100 bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-md dark:border-purple-900/50">
          {/* Subtle design pattern background */}
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-2xl"></div>
          
          <CardContent className="p-6 sm:p-8 flex flex-col items-center text-center relative z-10">
            <span className="text-xs font-bold tracking-widest text-purple-100 uppercase mb-2">
              Total Link Engagements
            </span>
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight drop-shadow-sm select-none animate-fadeIn">
              {totalClicks.toLocaleString()}
            </h1>
            <p className="mt-2 text-xs font-semibold text-purple-200">
              현재 등록된 모든 링크의 총 클릭 수 합계
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 📈 하단 섹션 : 링크별 클릭수 리스트 */}
      <div className="w-full max-w-xl flex flex-col gap-4 animate-fadeIn">
        <div className="flex items-center justify-between px-1 mb-1">
          <h2 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
            링크별 클릭 통계 순위 ({links.length}개)
          </h2>
          <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full dark:bg-purple-950/40 dark:text-purple-400 border border-purple-150/10">
            실시간 랭킹 순
          </span>
        </div>

        {links.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs">
            <span className="text-4xl">📉</span>
            <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-200 mt-3">기록된 클릭이 없습니다</h3>
            <p className="text-xs text-neutral-400 mt-1">링크를 추가하고 공유 페이지를 통해 클릭을 유도해 보세요.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {links.map((link, index) => {
              const domain = getDomain(link.url)
              const faviconUrl = domain 
                ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` 
                : null
              
              // Calculate individual percentage share
              const percentage = totalClicks > 0 
                ? Math.round(((link.clickCount || 0) / totalClicks) * 100) 
                : 0

              return (
                <Card 
                  key={link.id}
                  className="overflow-hidden border border-neutral-200/80 bg-white shadow-xs transition-all duration-300 hover:border-neutral-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/90 dark:hover:border-neutral-750"
                >
                  <CardContent className="p-4 flex flex-col gap-3">
                    
                    {/* Header: Rank + Favicon + Link Details + Click count badge */}
                    <div className="flex items-center gap-3">
                      {/* Rank badge */}
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black select-none ${
                        index === 0 
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                          : index === 1
                          ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          : index === 2
                          ? "bg-amber-50 text-amber-700 dark:bg-orange-950/30 dark:text-orange-400"
                          : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500"
                      }`}>
                        {index + 1}
                      </span>

                      {/* Google favicon extraction */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-50 border border-neutral-100 overflow-hidden dark:bg-neutral-850 dark:border-neutral-800">
                        {faviconUrl ? (
                          <img 
                            src={faviconUrl} 
                            alt={`${link.title} 로고`}
                            className="h-4 w-4 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'/%3E%3Cpath d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'/%3E%3C/svg%3E"
                            }}
                          />
                        ) : (
                          "🔗"
                        )}
                      </div>

                      {/* Title & URL */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-neutral-850 dark:text-neutral-100 truncate">
                          {link.title}
                        </h3>
                        <p className="text-[10.5px] text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
                          {link.url}
                        </p>
                      </div>

                      {/* Click stats badge */}
                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-600 border border-purple-100/50 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/40 shadow-3xs">
                          🖱️ {link.clickCount || 0}
                        </span>
                      </div>
                    </div>

                    {/* Footer Progress Bar (Visual share) */}
                    <div className="w-full">
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500 mb-1">
                        <span>전체 중 비율</span>
                        <span className="font-semibold text-neutral-600 dark:text-neutral-400">{percentage}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500 ease-out" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>

                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* 심플 푸터 */}
      <footer className="mt-auto pt-16 text-center text-xs text-neutral-400 dark:text-neutral-600 select-none">
        Powered by MyLink © 2026. All rights reserved.
      </footer>
    </div>
  )
}
