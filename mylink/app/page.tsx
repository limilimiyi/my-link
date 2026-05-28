"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from "firebase/firestore"

// 로컬 인터페이스 정의로 외부 파일 순환 참조 우려 완전 제거
interface LinkItem {
  id: string
  title: string
  url: string
  icon?: string
}

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

export default function Page() {
  const [links, setLinks] = useState<LinkItem[]>([])
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editUrl, setEditUrl] = useState("")
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [linkToDelete, setLinkToDelete] = useState<LinkItem | null>(null)

  // Firestore 실시간 구독 및 무한 루프 안전 방지 처리 (의존성 배열 및 클린업 기능 극대화)
  useEffect(() => {
    if (!db) return;

    const q = query(
      collection(db, "users", "anonymous", "links"),
      orderBy("createdAt", "desc")
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
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
      },
      (error) => {
        console.error("Firestore 로딩 에러:", error)
        setLinks([])
      }
    )

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

  // 실시간 링크 삭제 모달 열기 (이벤트 전파 방지 적용)
  const handleOpenDeleteModal = (e: React.MouseEvent, link: LinkItem) => {
    e.preventDefault()
    e.stopPropagation()
    setLinkToDelete(link)
    setIsDeleteModalOpen(true)
  }

  // 실시간 링크 삭제 모달 닫기
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setLinkToDelete(null)
  }

  // 실시간 링크 삭제 기능 (Firestore deleteDoc)
  const handleConfirmDelete = async () => {
    if (!linkToDelete) return

    try {
      await deleteDoc(doc(db, "users", "anonymous", "links", linkToDelete.id))
      handleCloseDeleteModal()
    } catch (error) {
      console.error("Firestore 삭제 에러:", error)
      alert("링크를 삭제하는 도중 오류가 발생했습니다.")
    }
  }

  // 인라인 수정 시작
  const handleStartEdit = (e: React.MouseEvent, link: LinkItem) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingId(link.id)
    setEditTitle(link.title)
    setEditUrl(link.url)
  }

  // 인라인 수정 취소
  const handleCancelEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingId(null)
    setEditTitle("")
    setEditUrl("")
  }

  // 인라인 수정 저장 (빈 칸 검증 + Firestore updateDoc)
  const handleSaveEdit = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()

    const trimmedTitle = editTitle.trim()
    const trimmedUrl = editUrl.trim()

    // 1. 빈 칸 검증
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

    const formattedUrl = trimmedUrl.startsWith("http") ? trimmedUrl : `https://${trimmedUrl}`

    // 2. Firestore updateDoc
    try {
      const linkRef = doc(db, "users", "anonymous", "links", id)
      await updateDoc(linkRef, {
        title: trimmedTitle,
        url: formattedUrl,
        updatedAt: serverTimestamp()
      })

      // 수정 모드 초기화
      setEditingId(null)
      setEditTitle("")
      setEditUrl("")
    } catch (error) {
      console.error("Firestore 수정 에러:", error)
      alert("데이터를 수정하는 중에 오류가 발생했습니다.")
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-[#F8F9FA] px-4 py-16 dark:bg-neutral-950">
      
      {/* 🧑‍💻 프로필 헤더 영역 */}
      <div className="flex flex-col items-center text-center mb-8 max-w-md w-full">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white border border-neutral-200 text-3xl shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
            🧑‍💻
          </div>
          {/* 초록색 Pulse 온라인 상태 배지 */}
          <span className="absolute bottom-0 right-0 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white dark:border-neutral-950"></span>
          </span>
        </div>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-800 dark:text-neutral-50">
          이림_개발자
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400 max-w-[280px]">
          React와 TypeScript를 좋아하는 프론트엔드 신입 개발자입니다.
        </p>
      </div>

      {/* 📝 링크 추가 입력 폼 */}
      <Card className="w-full max-w-md border border-neutral-200 bg-white/90 shadow-sm mb-8 dark:border-neutral-800 dark:bg-neutral-900/90">
        <CardContent className="p-4">
          <form onSubmit={handleAddLink} noValidate className="flex flex-col gap-3.5">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-neutral-500 mb-1 dark:text-neutral-450">
                  링크 제목
                </label>
                <input
                  type="text"
                  placeholder="예: GitHub"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm outline-none transition-all focus:border-purple-500 focus:bg-white dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-purple-500"
                />
              </div>
              <div className="flex-[1.5]">
                <label className="block text-xs font-semibold text-neutral-500 mb-1 dark:text-neutral-450">
                  연결 주소 (URL)
                </label>
                <input
                  type="text"
                  placeholder="예: github.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm outline-none transition-all focus:border-purple-500 focus:bg-white dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-purple-500"
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-purple-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-950"
            >
              새 링크 추가하기
            </button>
          </form>
        </CardContent>
      </Card>

      {/* 🔗 링크 카드 리스트 (실시간 Firestore 연동 & 우측 삭제 버튼 탑재) */}
      <div className="flex w-full max-w-md flex-col gap-4">
        {links.map((link, index) => {
          const isEditing = editingId === link.id;
          const domain = getDomain(link.url);
          const faviconUrl = domain 
            ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` 
            : null;

          if (isEditing) {
            return (
              <div
                key={`${link.id}-${index}`}
                className="w-full"
              >
                <Card className="overflow-hidden border border-purple-500 bg-white shadow-md dark:border-purple-500 dark:bg-neutral-900">
                  <CardContent className="flex flex-col gap-3.5 p-4 animate-fadeIn">
                    {/* 입력창 레이아웃 */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-neutral-500 mb-1 dark:text-neutral-400">
                          링크 제목
                        </label>
                        <input
                          type="text"
                          placeholder="예: GitHub"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm outline-none transition-all focus:border-purple-500 focus:bg-white dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-purple-500"
                        />
                      </div>
                      <div className="flex-[1.5]">
                        <label className="block text-xs font-semibold text-neutral-500 mb-1 dark:text-neutral-400">
                          연결 주소 (URL)
                        </label>
                        <input
                          type="text"
                          placeholder="예: github.com"
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm outline-none transition-all focus:border-purple-500 focus:bg-white dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-purple-500"
                        />
                      </div>
                    </div>
                    
                    {/* 저장 / 취소 버튼 */}
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="rounded-lg border border-neutral-200 px-3.5 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-850"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleSaveEdit(e, link.id)}
                        className="rounded-lg bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 transition-colors active:scale-[0.98]"
                      >
                        저장
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          }

          return (
            <a
              key={`${link.id}-${index}`}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Card className="overflow-hidden border border-neutral-200/80 bg-white/95 shadow-sm transition-all duration-300 hover:border-neutral-300 hover:bg-white hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/95 dark:hover:border-neutral-700 dark:hover:bg-neutral-900">
                <CardContent className="flex items-center gap-4 p-4">
                  {/* 구글 파비콘 */}
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
                  
                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 group-hover:text-black dark:group-hover:text-white">
                      {link.title}
                    </h2>
                    <p className="text-xs text-neutral-400 truncate dark:text-neutral-500">
                      {link.url}
                    </p>
                  </div>
                  
                  {/* 우측 아이콘 세트 (Chevron + 수정/삭제 버튼) */}
                  <div className="flex items-center gap-1">
                    {/* 우측 이동 Chevron */}
                    <div className="text-neutral-400 transition-transform duration-300 group-hover:translate-x-0.5 dark:text-neutral-600 mr-1.5">
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

                    {/* 수정 연필 버튼 (이벤트 버블링 차단 완벽 적용) */}
                    <button
                      type="button"
                      onClick={(e) => handleStartEdit(e, link)}
                      className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-purple-600 transition-colors focus:outline-none dark:hover:bg-neutral-800"
                      title="링크 수정"
                    >
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
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>

                    {/* 쓰레기통 삭제 버튼 (이벤트 버블링 차단 완벽 적용) */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenDeleteModal(e, link)}
                      className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-red-500 transition-colors focus:outline-none dark:hover:bg-neutral-800"
                      title="링크 삭제"
                    >
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
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </a>
          );
        })}
      </div>
      
      {/* 🗑️ 삭제 확인 모달 */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-neutral-100 dark:bg-neutral-900 dark:border-neutral-800 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-3">
              {/* ⚠️ 경고 아이콘 */}
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500 text-2xl dark:bg-red-950/30 dark:text-red-400">
                ⚠️
              </div>
              <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">
                정말 삭제하시겠습니까?
              </h3>
              <div className="space-y-1.5 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                <p>
                  <span className="font-semibold text-neutral-750 dark:text-neutral-250">
                    &ldquo;{linkToDelete?.title}&rdquo;
                  </span>{" "}
                  링크가 삭제됩니다.
                </p>
                <p className="text-xs text-red-500 font-semibold dark:text-red-400 flex items-center justify-center gap-1">
                  ⚠️ 이 작업은 되돌릴 수 없습니다
                </p>
              </div>
            </div>
            
            <div className="flex w-full gap-2.5 mt-6">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                className="flex-1 rounded-xl border border-neutral-200 bg-white py-2.5 text-sm font-semibold text-neutral-600 shadow-sm transition-all hover:bg-neutral-50 active:scale-[0.98] dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-350 dark:hover:bg-neutral-850"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-600 active:scale-[0.98]"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 심플 푸터 */}
      <footer className="mt-auto pt-16 text-center text-xs text-neutral-400 dark:text-neutral-600">
        © 2026 MyLink. All rights reserved.
      </footer>
    </div>
  )
}
