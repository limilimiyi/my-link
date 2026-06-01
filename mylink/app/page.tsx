"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { db, auth } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, setDoc, increment } from "firebase/firestore"
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth"
import { dummyLinks, LinkItem } from "@/data/links"
import Link from "next/link"

// 🐆 갸루 테마용 호피 무늬 패턴 스타일 (왼쪽 위 모서리 프렌치 포인트 전용)
const leopardFrenchPoint = {
  backgroundImage: `radial-gradient(circle at 2px 2px, #3d2a1c 1.5px, transparent 0),
                    radial-gradient(circle at 12px 12px, #3d2a1c 1.5px, transparent 0),
                    radial-gradient(circle at 6px 6px, #8b5a2b 3px, #3d2a1c 4.5px, transparent 0),
                    radial-gradient(circle at 15px 5px, #8b5a2b 2px, #3d2a1c 3.5px, transparent 0)`,
  backgroundColor: '#fcd34d', // yellow-300
  backgroundSize: '18px 18px',
  clipPath: 'polygon(0 0, 100% 0, 0 100%)', // 삼각형 형태로 왼쪽 위 모서리만 채움
};

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
  const [links, setLinks] = useState<LinkItem[]>(dummyLinks)
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editUrl, setEditUrl] = useState("")
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [linkToDelete, setLinkToDelete] = useState<LinkItem | null>(null)
  const [deletedDummyIds, setDeletedDummyIds] = useState<string[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{ displayName: string; username: string; bio: string } | null>(null)

  // Auth 상태 변경 실시간 감시
  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribeAuth()
  }, [])

  // 프로필 실시간 동적 연동
  useEffect(() => {
    if (!db || !user) {
      setProfile(null)
      return
    }
    const profileRef = doc(db, "users", user.uid, "profile", "info")
    const unsubscribe = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        setProfile({
          displayName: data.displayName || "",
          username: data.username || "",
          bio: data.bio || ""
        })
      }
    })
    return () => unsubscribe()
  }, [user])

  // Firestore 실시간 구독
  useEffect(() => {
    if (!db || !user) {
      setLinks(dummyLinks.filter(l => !deletedDummyIds.includes(l.id)))
      return
    }
    const q = query(
      collection(db, "users", user.uid, "links"),
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
          icon: "link",
          clickCount: data.clickCount || 0
        })
      })
      const fetchedIds = new Set(fetchedLinks.map(l => l.id))
      const uniqueDummyLinks = dummyLinks.filter(
        l => !fetchedIds.has(l.id) && !deletedDummyIds.includes(l.id)
      )
      setLinks([...fetchedLinks, ...uniqueDummyLinks])
    })
    return () => unsubscribe()
  }, [user, deletedDummyIds])

  const handleLogout = async () => {
    if (!auth) return
    await signOut(auth)
    setEditingId(null)
  }

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const trimmedTitle = title.trim()
    const trimmedUrl = url.trim()
    if (!trimmedTitle || !trimmedUrl) return
    const formattedUrl = trimmedUrl.startsWith("http") ? trimmedUrl : `https://${trimmedUrl}`
    try {
      await addDoc(collection(db, "users", user.uid, "links"), {
        title: trimmedTitle,
        url: formattedUrl,
        clickCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      setTitle("")
      setUrl("")
    } catch (error) {
      console.error("저장 에러:", error)
    }
  }

  const handleOpenDeleteModal = (e: React.MouseEvent, link: LinkItem) => {
    e.preventDefault(); e.stopPropagation()
    setLinkToDelete(link)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!linkToDelete || !user) return
    try {
      if (linkToDelete.id.length === 1 || ["1", "2", "3", "4", "5"].includes(linkToDelete.id)) {
        setDeletedDummyIds(prev => [...prev, linkToDelete.id])
      }
      await deleteDoc(doc(db, "users", user.uid, "links", linkToDelete.id))
      setIsDeleteModalOpen(false)
    } catch (error) {
      console.error("삭제 에러:", error)
    }
  }

  const handleLinkClick = async (e: React.MouseEvent<HTMLAnchorElement>, linkId: string) => {
    if (!user) return
    if (linkId.length === 1 || ["1", "2", "3", "4", "5"].includes(linkId)) return
    try {
      const linkRef = doc(db, "users", user.uid, "links", linkId)
      await updateDoc(linkRef, { clickCount: increment(1) })
    } catch (error) {
      console.error("클릭 카운트 에러:", error)
    }
  }

  // --- 💖 갸루 스타일 렌더링 (로그인 전) ---
  if (!user && !loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAFAFA] font-[var(--font-hi-melody)] selection:bg-pink-500/30 overflow-x-hidden">
        {/* 🧭 네비게이션 */}
        <nav className="fixed top-0 w-full z-50 border-b-4 border-pink-500 bg-white/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2 group cursor-default">
              <span className="text-3xl animate-bounce">🎀</span>
              <span className="text-3xl font-[var(--font-bagel)] text-pink-500 tracking-tighter italic drop-shadow-sm group-hover:text-yellow-500 transition-colors">MyLink</span>
              <span className="text-2xl animate-pulse">✨</span>
            </div>
            <Link
              href="/login"
              className="group relative overflow-hidden rounded-2xl bg-pink-500 px-8 py-3 text-sm font-[var(--font-bagel)] text-white shadow-[4px_4px_0px_0px_rgba(252,211,77,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:scale-95"
            >
              로그인 💖
            </Link>
          </div>
        </nav>

        {/* 🌟 히어로 */}
        <main className="flex-1 flex flex-col items-center justify-center pt-48 pb-20 px-4 text-center relative">
          {/* 🐆 호피 프렌치 포인트 (왼쪽 위 모서리 장식) */}
          <div className="absolute top-0 left-0 w-32 h-32 opacity-70 pointer-events-none -z-5" style={leopardFrenchPoint}></div>

          <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10 text-xl text-neutral-400">
             <span className="absolute top-[10%] left-[5%] text-4xl animate-pulse opacity-50">✨</span>
             <span className="absolute top-[20%] right-[10%] text-5xl animate-bounce opacity-40 text-pink-300">💖</span>
             <span className="absolute bottom-[15%] left-[15%] text-4xl animate-pulse opacity-60 delay-300 text-pink-200">💅</span>
             <span className="absolute bottom-[25%] right-[5%] text-6xl animate-bounce opacity-30 delay-700 text-yellow-200">🦋</span>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
            <span className="inline-block rounded-full bg-yellow-300 px-6 py-2.5 text-xl font-bold text-pink-600 mb-8 border-2 border-pink-500 shadow-[6px_6px_0px_0px_rgba(236,72,153,1)] rotate-[-1deg]">
              ✨ 30분 만에 끝내는 초강력 퍼스널 브랜딩 ✨
            </span>
          </div>
          
          <h1 className="text-8xl sm:text-9xl font-[var(--font-bagel)] tracking-tighter text-neutral-900 mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-both italic">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-pink-400 to-yellow-500 drop-shadow-[0_6px_0_rgba(0,0,0,0.1)] pr-4 text-stroke">마이링크</span>
          </h1>
          
          <p className="text-4xl sm:text-5xl text-pink-500 font-bold mb-16 max-w-none w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both leading-tight whitespace-nowrap">
            세상에서 제일 <span className="text-yellow-500 underline decoration-pink-500 decoration-8 underline-offset-8">귀엽게</span> 나를 표현해봐! 💅✨
          </p>
          
          <Link
            href="/login"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-[2.5rem] bg-pink-500 px-16 py-7 font-[var(--font-bagel)] text-3xl text-white transition-all duration-300 hover:scale-110 hover:rotate-2 shadow-[12px_12px_0px_0px_rgba(252,211,77,1)]"
          >
            <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none z-0" style={leopardFrenchPoint}></div>
            <span className="relative z-10 flex items-center gap-4">
              지금 시작하기 💖
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 animate-bounce-x" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
          </Link>
        </main>

        {/* 🚀 기능 */}
        <section className="bg-white py-32 border-t-8 border-pink-500 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 opacity-70 pointer-events-none z-0" style={leopardFrenchPoint}></div>
          <div className="mx-auto max-w-6xl px-6 pt-10 text-center">
            <h2 className="text-7xl font-[var(--font-bagel)] text-pink-600 italic tracking-tighter mb-20 drop-shadow-sm">✨ 나만의 필수템! ✨</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-2xl">
              {[
                { t: "링크 관리", d: "쉽고 빠르게! 수정하고 삭제하는 것도 완전 쉬워. 💅", i: "🔗", c: "border-pink-500", s: "rgba(252,211,77,1)" },
                { t: "클릭 통계", d: "누가 눌렀을까? 실시간 대시보드도 완전 대박! ✨", i: "📈", c: "border-yellow-400", s: "rgba(236,72,153,1)" },
                { t: "개인 URL", d: "나만의 고유 ID로 친구들과 연결돼봐. 💖", i: "👱‍♀️", c: "border-pink-500", s: "rgba(252,211,77,1)" }
              ].map((item, idx) => (
                <div key={idx} className={`group relative overflow-hidden rounded-[3rem] border-[6px] ${item.c} bg-white p-12 transition-all hover:-translate-y-4 hover:shadow-[20px_20px_0px_0px_${item.s}]`}>
                  <div className="absolute top-0 left-0 w-12 h-12 opacity-80 pointer-events-none z-0" style={leopardFrenchPoint}></div>
                  <div className="mb-10 text-7xl">{item.i}</div>
                  <h3 className="mb-6 text-4xl font-[var(--font-bagel)] text-pink-600">{item.t}</h3>
                  <p className="font-bold text-neutral-600">{item.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="bg-pink-100 py-20 text-center border-t-8 border-pink-500">
          <p className="text-4xl text-pink-500 font-[var(--font-bagel)] italic tracking-tighter mb-4">© 2026 MyLink. Stay Kawaii! 🎀💅✨</p>
          <div className="flex justify-center gap-4">
            <span className="text-4xl animate-bounce">🐆</span>
            <span className="text-4xl animate-bounce delay-100">💄</span>
            <span className="text-4xl animate-bounce delay-200">💖</span>
          </div>
        </footer>
      </div>
    )
  }

  // --- 💖 스타일 렌더링 (로그인 후 대시보드) ---
  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-[#FAFAFA] px-4 py-8 sm:py-12 font-[var(--font-hi-melody)] selection:bg-pink-500/30">
      {/* 🧭 네비게이션 */}
      <header className="w-full max-w-xl flex items-center justify-between py-4 px-6 mb-12 rounded-3xl border-4 border-pink-500 bg-white/90 shadow-[8px_8px_0px_0px_rgba(252,211,77,1)] animate-fadeIn font-[var(--font-bagel)] overflow-hidden relative">
        <div className="absolute top-0 left-0 w-12 h-12 opacity-50 pointer-events-none" style={leopardFrenchPoint}></div>
        <div className="flex items-center gap-2 relative z-10">
          <span className="text-2xl animate-pulse">🎀</span>
          <span className="font-black text-pink-500 text-xl italic tracking-tighter">MyLink</span>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          {user && (
            <div className="flex items-center gap-3 text-base">
              <span className="font-black text-pink-400 mr-1">{profile?.displayName || user.displayName || "홍길동"}님💅</span>
              <Link href="/mypage" className="rounded-xl border-2 border-pink-500 bg-white px-3 py-1.5 text-sm font-black text-pink-600 hover:bg-pink-50 transition-all">관리</Link>
              <Link href="/stats" className="rounded-xl border-2 border-yellow-400 bg-white px-3 py-1.5 text-sm font-black text-yellow-600 hover:bg-yellow-50 transition-all">📈통계</Link>
              <button onClick={handleLogout} className="text-sm font-black text-neutral-400 hover:text-red-500 transition-colors">로그아웃</button>
            </div>
          )}
        </div>
      </header>

      {/* 🧑‍💻 프로필 영역 */}
      <div className="flex flex-col items-center text-center mb-12 max-w-md w-full animate-fadeIn">
        <div className="relative group">
          <div className="flex h-28 w-28 items-center justify-center rounded-[2.5rem] bg-white border-4 border-pink-500 text-5xl shadow-[10px_10px_0px_0px_rgba(252,211,77,1)] transition-transform group-hover:scale-110 group-hover:rotate-6">
            {profile?.displayName ? profile.displayName.charAt(0) : "👱‍♀️"}
          </div>
          <span className="absolute -bottom-2 -right-2 flex h-8 w-8">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-8 w-8 bg-pink-500 border-4 border-white text-xs items-center justify-center font-bold">✨</span>
          </span>
        </div>

        <h1 className="mt-8 text-6xl font-[var(--font-bagel)] tracking-tighter text-neutral-900 italic">
          <span className="text-pink-500">{profile?.displayName || (user ? (user.displayName || "홍길동") : "마이링크_개발자")}</span>
          {profile?.username && <span className="ml-2 text-3xl text-yellow-500 not-italic">@{profile.username}</span>}
        </h1>
        <p className="mt-4 text-3xl font-bold text-pink-400 max-w-[400px] break-words leading-tight">
          {profile?.bio || "나만의 마이링크를 완전 예쁘게 꾸며보는 중! 💅✨"}
        </p>
      </div>

      {/* 📝 링크 추가 폼 */}
      {user && (
        <Card className="relative w-full max-w-xl border-4 border-pink-500 bg-white shadow-[12px_12px_0px_0px_rgba(252,211,77,1)] mb-12 rounded-[2rem] overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 opacity-70 pointer-events-none z-0" style={leopardFrenchPoint}></div>
          <CardContent className="p-8 relative z-10">
            <form onSubmit={handleAddLink} className="flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xl font-black text-pink-500 mb-2 ml-1 uppercase tracking-wider">Title 🎀</label>
                  <input
                    type="text" placeholder="예: My Instagram" value={title} onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-2xl border-2 border-pink-100 bg-pink-50/30 px-5 py-3 text-xl font-bold outline-none focus:border-pink-500 focus:bg-white transition-all"
                  />
                </div>
                <div className="flex-[1.5]">
                  <label className="block text-xl font-black text-pink-500 mb-2 ml-1 uppercase tracking-wider">URL ✨</label>
                  <input
                    type="text" placeholder="예: instagram.com/gal" value={url} onChange={(e) => setUrl(e.target.value)}
                    className="w-full rounded-2xl border-2 border-pink-100 bg-pink-50/30 px-5 py-3 text-xl font-bold outline-none focus:border-pink-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
              <button type="submit" className="w-full rounded-2xl bg-pink-500 py-4 text-2xl font-[var(--font-bagel)] text-white shadow-md hover:bg-pink-600 active:scale-[0.98] transition-all">
                새 링크 추가하기 💅✨
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 🔗 링크 리스트 */}
      <div className="flex w-full max-w-xl flex-col gap-6 mb-20">
        {links.map((link, index) => {
          const isEditing = editingId === link.id;
          const domain = getDomain(link.url);
          const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null;

          if (isEditing && user) {
            return (
              <Card key={link.id} className="relative border-4 border-yellow-400 bg-white shadow-lg rounded-[2rem] overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="absolute top-0 left-0 w-20 h-20 opacity-70 pointer-events-none z-0" style={leopardFrenchPoint}></div>
                <CardContent className="p-6 flex flex-col gap-4 relative z-10">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="flex-1 rounded-xl border-2 border-yellow-100 px-4 py-2 text-lg font-bold outline-none focus:border-yellow-400"/>
                    <input type="text" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} className="flex-[1.5] rounded-xl border-2 border-yellow-100 px-4 py-2 text-lg font-bold outline-none focus:border-yellow-400"/>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingId(null)} className="px-4 py-2 text-base font-black text-neutral-400">취소</button>
                    <button onClick={async (e) => {
                       e.preventDefault();
                       const trimmedTitle = editTitle.trim(); const trimmedUrl = editUrl.trim();
                       if (!trimmedTitle || !trimmedUrl) return;
                       const formattedUrl = trimmedUrl.startsWith("http") ? trimmedUrl : `https://${trimmedUrl}`;
                       const linkRef = doc(db, "users", user.uid, "links", link.id);
                       await updateDoc(linkRef, { title: trimmedTitle, url: formattedUrl, updatedAt: serverTimestamp() });
                       setEditingId(null);
                    }} className="rounded-xl bg-yellow-400 px-6 py-2 text-base font-black text-yellow-800 shadow-sm">저장 ✨</button>
                  </div>
                </CardContent>
              </Card>
            );
          }

          return (
            <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" onClick={(e) => handleLinkClick(e, link.id)}
               className="group block transition-transform duration-200 hover:-translate-y-1 hover:rotate-1 active:translate-y-0 active:rotate-0"
            >
              <Card className="overflow-hidden border-[3px] border-pink-100 bg-white/90 shadow-sm hover:border-pink-500 hover:shadow-[8px_8px_0px_0px_rgba(236,72,153,0.1)] rounded-[2.5rem] transition-all duration-300 relative">
                <div className="absolute top-0 left-0 w-8 h-8 opacity-40 pointer-events-none group-hover:opacity-70 transition-opacity" style={leopardFrenchPoint}></div>
                <CardContent className="flex items-center gap-5 p-6 relative z-10">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] bg-pink-50 border-2 border-pink-100 overflow-hidden group-hover:border-pink-500 transition-colors">
                    {faviconUrl ? <img src={faviconUrl} alt="logo" className="h-8 w-8 object-contain"/> : <span className="text-3xl">🔗</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-black text-neutral-800 group-hover:text-pink-600 transition-colors">{link.title}</h2>
                      {user && !(["1","2","3","4","5"].includes(link.id) || link.id.length === 1) && (
                        <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-black text-yellow-700 border border-yellow-200">🖱️ {link.clickCount || 0}</span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-neutral-400 truncate mt-0.5">{link.url}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingId(link.id); setEditTitle(link.title); setEditUrl(link.url); }} className="p-2 text-2xl">✏️</button>
                    <button onClick={(e) => handleOpenDeleteModal(e, link)} className="p-2 text-2xl">🗑️</button>
                  </div>
                </CardContent>
              </Card>
            </a>
          );
        })}
      </div>

      {/* 🗑️ 삭제 모달 */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-[3rem] bg-white p-10 shadow-2xl border-[6px] border-pink-500 text-center animate-in zoom-in-95 duration-200">
            <span className="text-7xl mb-6 block animate-bounce">⚠️</span>
            <h3 className="text-3xl font-[var(--font-bagel)] text-neutral-900 mb-4 tracking-tighter italic underline decoration-yellow-400 underline-offset-4">진짜 삭제할거야?</h3>
            <p className="text-xl font-bold text-pink-500 mb-8 leading-relaxed">이 링크를 지우면 다시 복구할 수 없어! <br/>완전 신중하게 결정해 💅✨</p>
            <div className="flex gap-4">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 text-xl font-black text-neutral-400">취소</button>
              <button onClick={handleConfirmDelete} className="flex-1 rounded-2xl bg-red-500 py-4 text-xl font-black text-white shadow-md hover:bg-red-600 transition-all font-[var(--font-black-han)]">지우기 🔥</button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-auto pt-20 pb-10 text-center">
        <p className="text-xl text-pink-400 font-[var(--font-black-han)] italic tracking-tighter">© 2026 MyLink. Stay Kawaii! 🎀✨💅</p>
      </footer>
    </div>
  )
}
