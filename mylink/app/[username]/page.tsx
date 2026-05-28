"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, orderBy, onSnapshot } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { LinkItem } from "@/data/links"
import Link from "next/link"

// URL에서 도메인을 파싱해주는 헬퍼 함수
const getDomain = (url: string) => {
  try {
    const cleanUrl = url.trim();
    const withProtocol = cleanUrl.startsWith("http") ? cleanUrl : `https://${cleanUrl}`;
    const parsed = new URL(withProtocol);
    return parsed.hostname;
  } catch (e) {
    return "";
  }
}

interface SharedProfile {
  username: string;
  displayName: string;
  bio: string;
}

export default function SharedProfilePage() {
  const params = useParams()
  const rawUsername = params.username as string
  const username = decodeURIComponent(rawUsername).trim().toLowerCase()

  const [loading, setLoading] = useState(true)
  const [userFound, setUserFound] = useState<boolean | null>(null)
  const [profile, setProfile] = useState<SharedProfile | null>(null)
  const [links, setLinks] = useState<LinkItem[]>([])

  useEffect(() => {
    if (!db || !username) {
      setLoading(false)
      setUserFound(false)
      return
    }

    const resolveUser = async () => {
      try {
        // 1. username으로 userId 검색 (usernames 글로벌 컬렉션 매핑)
        const usernameRef = doc(db, "usernames", username)
        const usernameSnap = await getDoc(usernameRef)

        if (!usernameSnap.exists()) {
          setUserFound(false)
          setLoading(false)
          return
        }

        const userId = usernameSnap.data().uid
        setUserFound(true)

        // 2. 프로필 정보 조회 (users/{userId}/profile/info)
        const profileRef = doc(db, "users", userId, "profile", "info")
        const profileSnap = await getDoc(profileRef)
        if (profileSnap.exists()) {
          const pData = profileSnap.data()
          setProfile({
            username: pData.username || username,
            displayName: pData.displayName || "홍길동",
            bio: pData.bio || ""
          })
        } else {
          // 문서가 없는 경우 폴백 기본값 설정
          setProfile({
            username: username,
            displayName: "마이링크 회원",
            bio: ""
          })
        }

        // 3. 링크 목록 실시간 연동 (users/{userId}/links)
        const linksQuery = query(
          collection(db, "users", userId, "links"),
          orderBy("createdAt", "desc")
        )

        const unsubscribeLinks = onSnapshot(linksQuery, (snapshot) => {
          const fetchedLinks: LinkItem[] = []
          snapshot.forEach((doc) => {
            const data = doc.data()
            fetchedLinks.push({
              id: doc.id,
              title: data.title || "",
              url: data.url || "",
              icon: "link"
            })
          })
          setLinks(fetchedLinks)
          setLoading(false)
        }, (error) => {
          console.error("공유 페이지 링크 로딩 실패:", error)
          setLoading(false)
        })

        return unsubscribeLinks

      } catch (error) {
        console.error("사용자 정보 검색 중 에러 발생:", error)
        setUserFound(false)
        setLoading(false)
      }
    }

    let unsubscribePromise = resolveUser()

    return () => {
      unsubscribePromise.then((unsubscribe) => {
        if (typeof unsubscribe === "function") {
          unsubscribe()
        }
      })
    }
  }, [username])

  // 1. 로딩 상태 화면
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FA] px-4 dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
          <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
            프로필을 불러오는 중입니다...
          </p>
        </div>
      </div>
    )
  }

  // 2. 존재하지 않는 username일 경우 세련된 커스텀 404 폴백 화면
  if (userFound === false || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FA] px-4 dark:bg-neutral-950">
        <Card className="w-full max-w-sm border border-neutral-200 bg-white/90 p-6 shadow-md dark:border-neutral-800 dark:bg-neutral-900/90 text-center animate-fadeIn">
          <CardContent className="p-0 flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 text-3xl dark:bg-red-950/20 dark:text-red-400">
              🔍
            </div>
            <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">
              사용자를 찾을 수 없습니다.
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              입력하신 사용자 이름(<span className="font-semibold text-purple-600">@{username}</span>)의 프로필 주소는 존재하지 않거나 탈퇴/변경되었을 수 있습니다.
            </p>
            <div className="w-full border-t border-neutral-100 dark:border-neutral-800 pt-4 mt-2">
              <Link
                href="/"
                className="inline-flex w-full justify-center rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 transition-all active:scale-[0.98]"
              >
                나만의 마이링크 만들기
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 3. 정상 조회 상태 프로필 화면
  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-[#F8F9FA] px-4 py-12 sm:py-16 dark:bg-neutral-950">
      
      {/* 🧭 홈가기 슬림 배너 */}
      <header className="w-full max-w-md flex justify-center mb-8">
        <Link 
          href="/" 
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-neutral-200 bg-white text-xs font-bold text-neutral-600 shadow-xs hover:bg-neutral-50 hover:text-purple-600 transition-colors dark:border-neutral-850 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-850"
        >
          <span>🔗</span>
          <span>나의 마이링크 만들기</span>
        </Link>
      </header>

      {/* 🧑‍💻 프로필 카드 */}
      <div className="flex flex-col items-center text-center mb-10 max-w-md w-full animate-fadeIn">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white border-2 border-purple-500 text-4xl shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
            {profile.displayName ? profile.displayName.charAt(0) : "🧑"}
          </div>
          {/* 초록색 Pulse 온라인 배지 */}
          <span className="absolute bottom-0 right-1.5 flex h-4.5 w-4.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4.5 w-4.5 bg-green-500 border-2 border-white dark:border-neutral-950"></span>
          </span>
        </div>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-800 dark:text-neutral-50 flex items-center justify-center gap-2">
          {profile.displayName}
        </h1>
        
        <span className="mt-1 px-3 py-0.5 rounded-full bg-purple-50 text-[10.5px] font-extrabold text-purple-600 border border-purple-100/80 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50 shadow-2xs">
          @{profile.username}
        </span>

        <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-350 max-w-xs break-words leading-relaxed">
          {profile.bio || "반갑습니다! 제 소셜 링크 모음 페이지입니다."}
        </p>
      </div>

      {/* 🔗 링크 리스트 (클릭 시 새 탭 target="_blank") */}
      <div className="flex w-full max-w-md flex-col gap-4 animate-fadeIn">
        {links.length === 0 ? (
          <div className="text-center py-10 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white/40 dark:bg-neutral-900/40">
            <p className="text-xs text-neutral-400">아직 등록된 링크가 없습니다.</p>
          </div>
        ) : (
          links.map((link, idx) => {
            const domain = getDomain(link.url);
            const faviconUrl = domain 
              ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` 
              : null;

            return (
              <a
                key={`${link.id}-${idx}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                <Card className="overflow-hidden border border-neutral-200/80 bg-white/95 shadow-xs transition-all duration-300 hover:border-neutral-350 hover:bg-white hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/95 dark:hover:border-neutral-700 dark:hover:bg-neutral-900">
                  <CardContent className="flex items-center gap-4 p-4">
                    {/* 구글 파비콘 추출 */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-50 border border-neutral-100 overflow-hidden dark:bg-neutral-850 dark:border-neutral-800">
                      {faviconUrl ? (
                        <img 
                          src={faviconUrl} 
                          alt={`${link.title} 로고`}
                          className="h-5 w-5 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'/%3E%3Cpath d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'/%3E%3C/svg%3E";
                          }}
                        />
                      ) : (
                        "🔗"
                      )}
                    </div>
                    
                    {/* 링크 정보 */}
                    <div className="flex-1 min-w-0 text-left">
                      <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 group-hover:text-black dark:group-hover:text-white">
                        {link.title}
                      </h2>
                      <p className="text-xs text-neutral-400 truncate dark:text-neutral-500">
                        {link.url}
                      </p>
                    </div>
                    
                    {/* Chevron 아이콘 */}
                    <div className="text-neutral-400 transition-transform duration-300 group-hover:translate-x-0.5 dark:text-neutral-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </CardContent>
                </Card>
              </a>
            )
          })
        )}
      </div>

      {/* 심플 푸터 */}
      <footer className="mt-auto pt-20 text-center text-[10px] text-neutral-400 dark:text-neutral-600">
        Powered by MyLink © 2026. All rights reserved.
      </footer>
    </div>
  )
}
