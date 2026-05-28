"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { LinkItem } from "@/data/links"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from "firebase/firestore"

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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editUrl, setEditUrl] = useState("")
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [linkToDelete, setLinkToDelete] = useState<LinkItem | null>(null)

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
          const isEditing = editingId === link.id;
          const domain = getDomain(link.url);
          const faviconUrl = domain 
            ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` 
            : null;

          if (isEditing) {
            return (
              <div
                key={link.id}
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
                          placeholder="예: 내 블로그"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-sm outline-none transition-all focus:border-purple-500 focus:bg-white dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-purple-500"
                        />
                      </div>
                      <div className="flex-[2]">
                        <label className="block text-xs font-semibold text-neutral-500 mb-1 dark:text-neutral-400">
                          연결 주소 (URL)
                        </label>
                        <input
                          type="text"
                          placeholder="예: https://velog.io/@limi"
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-sm outline-none transition-all focus:border-purple-500 focus:bg-white dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-purple-500"
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
                  
                  {/* 우측 아이콘 세트 (Chevron + 수정/삭제 버튼) */}
                  <div className="flex items-center gap-1">
                    {/* 이동 Chevron */}
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
                      className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-purple-650 transition-colors focus:outline-none dark:hover:bg-neutral-800"
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
    </div>
  )
}
