"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { LinkItem } from "@/data/links"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore"

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

export default function MyPage() {
  const [links, setLinks] = useState<LinkItem[]>([])
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")

  // Firestore에서 실시간으로 링크 목록 불러오기
  useEffect(() => {
    const q = query(
      collection(db, "users", "anonymous", "links"),
      orderBy("createdAt", "desc")
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
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
    }, (error) => {
      console.error("Firestore 로딩 에러:", error)
    })

    return () => unsubscribe()
  }, [])

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault()

    // 1. 제목/주소 가져오기
    const trimmedTitle = title.trim()
    const trimmedUrl = url.trim()

    // 2. 검증
    if (!trimmedTitle) {
      alert("제목을 입력해주세요")
      return
    }

    if (!trimmedUrl) {
      alert("주소를 입력해주세요")
      return
    }

    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i
    if (!urlPattern.test(trimmedUrl)) {
      alert("올바른 주소를 입력해주세요")
      return
    }

    // 3. Firestore에 저장
    const formattedUrl = trimmedUrl.startsWith("http") ? trimmedUrl : `https://${trimmedUrl}`
    
    try {
      await addDoc(collection(db, "users", "anonymous", "links"), {
        title: trimmedTitle,
        url: formattedUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      // 입력 필드 초기화
      setTitle("")
      setUrl("")
    } catch (error) {
      console.error("Firestore 저장 에러:", error)
      alert("데이터를 저장하는 중에 오류가 발생했습니다.")
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-[#F8F9FA] px-4 py-16 dark:bg-neutral-950">
      
      {/* 1. 상단 - 제목 */}
      <div className="flex flex-col items-center text-center mb-8 max-w-xl w-full">
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
          마이링크 관리 <span className="text-purple-600">MyPage</span>
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          나만의 링크 목록을 실시간으로 추가하고 관리해 보세요.
        </p>
      </div>

      {/* 2. 중간 - 폼 */}
      <Card className="w-full max-w-xl border border-neutral-200 bg-white shadow-sm mb-10 dark:border-neutral-800 dark:bg-neutral-900">
        <CardContent className="p-6">
          <form onSubmit={handleAddLink} noValidate className="flex flex-col gap-4">
            {/* 입력 칸 가로 나란히 배치 */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-neutral-500 mb-1.5 dark:text-neutral-400">
                  링크 제목
                </label>
                <input
                  type="text"
                  placeholder="예: 내 블로그"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-sm outline-none transition-all focus:border-purple-500 focus:bg-white dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-purple-500"
                />
              </div>
              <div className="flex-[2]">
                <label className="block text-xs font-semibold text-neutral-500 mb-1.5 dark:text-neutral-400">
                  연결 주소 (URL)
                </label>
                <input
                  type="text"
                  placeholder="예: https://velog.io/@limi"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-sm outline-none transition-all focus:border-purple-500 focus:bg-white dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-purple-500"
                />
              </div>
            </div>
            
            {/* 추가 버튼 */}
            <button
              type="submit"
              className="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-purple-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-950"
            >
              새 링크 추가하기
            </button>
          </form>
        </CardContent>
      </Card>

      {/* 3. 하단 - 목록 */}
      <div className="w-full max-w-xl flex flex-col gap-4">
        <h2 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 px-1 mb-1">
          현재 링크 목록 ({links.length}개)
        </h2>
        
        {links.map((link) => {
          const domain = getDomain(link.url);
          const faviconUrl = domain 
            ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` 
            : null;

          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Card className="overflow-hidden border border-neutral-200/80 bg-white/95 shadow-sm transition-all duration-300 hover:border-neutral-300 hover:bg-white hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/95 dark:hover:border-neutral-700 dark:hover:bg-neutral-900">
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
                  
                  {/* 텍스트 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 group-hover:text-black dark:group-hover:text-white">
                      {link.title}
                    </h3>
                    <p className="text-xs text-neutral-400 truncate dark:text-neutral-500">
                      {link.url}
                    </p>
                  </div>
                  
                  {/* 이동 Chevron */}
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
          );
        })}
      </div>
    </div>
  )
}
