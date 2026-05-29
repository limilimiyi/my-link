"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { LinkItem } from "@/data/links"
import { db, auth } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, getDoc, setDoc, increment } from "firebase/firestore"
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth"
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

interface UserProfile {
  username: string;
  displayName: string;
  bio: string;
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

  // Auth 및 프로필 상태 관리
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile>({ username: "", displayName: "", bio: "" })
  const [profileLoading, setProfileLoading] = useState(true)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // 프로필 편집 입력 폼 상태
  const [inputUsername, setInputUsername] = useState("")
  const [inputDisplayName, setInputDisplayName] = useState("")
  const [inputBio, setInputBio] = useState("")

  // Username 중복 검사 보조 상태
  const [savedUsername, setSavedUsername] = useState("")
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameFeedback, setUsernameFeedback] = useState<{
    available: boolean | null;
    message: string;
  }>({ available: null, message: "" })

  // 1. Auth 상태 변경 실시간 감시 (try-catch 예외 처리 보완)
  useEffect(() => {
    if (!auth) {
      setProfileLoading(false)
      return
    }

    try {
      const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser)
        if (!currentUser) {
          setProfile({ username: "", displayName: "", bio: "" })
          setSavedUsername("")
          setProfileLoading(false)
        }
      }, (error) => {
        console.error("Auth 상태 변경 중 오류 감지:", error)
        setProfileLoading(false)
      })
      return () => unsubscribeAuth()
    } catch (error) {
      console.error("onAuthStateChanged 등록 중 에러 발생:", error)
      setProfileLoading(false)
    }
  }, [])

  // 고유한 username 자동 생성 헬퍼 함수
  const generateUniqueUsername = async (email: string, uid: string) => {
    const emailPrefix = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_.]/g, "")
    const base = emailPrefix || "user"
    
    let candidate = base
    let isUnique = false
    let counter = 0
    
    while (!isUnique && counter < 20) {
      const checkName = counter === 0 ? base : `${base}${counter}`
      try {
        const usernameRef = doc(db, "usernames", checkName)
        const docSnap = await getDoc(usernameRef)
        // 존재하지 않거나, 존재하지만 본인의 uid인 경우 사용 가능
        if (!docSnap.exists() || docSnap.data()?.uid === uid) {
          candidate = checkName
          isUnique = true
        } else {
          counter++
        }
      } catch (e) {
        console.error("사용자 이름 중복 확인 중 실패:", e)
        counter++
      }
    }
    return candidate
  }

  // 2. 로그인된 사용자 정보 기반으로 프로필 실시간 불러오기 + 자동 생성
  useEffect(() => {
    if (!db || !user) {
      setProfile({ username: "", displayName: "", bio: "" })
      setSavedUsername("")
      setInputUsername("")
      setInputDisplayName("")
      setInputBio("")
      setProfileLoading(false)
      return
    }

    const userId = user.uid
    const profileRef = doc(db, "users", userId, "profile", "info")

    const unsubscribe = onSnapshot(profileRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        const fetchedProfile = {
          username: data.username || "",
          displayName: data.displayName || "",
          bio: data.bio || ""
        }
        setProfile(fetchedProfile)
        setSavedUsername(data.username || "")
        
        // 입력창 상태 초기값 세팅
        setInputUsername(data.username || "")
        setInputDisplayName(data.displayName || "")
        setInputBio(data.bio || "")
        setProfileLoading(false)
      } else {
        // 프로필 정보가 없는데 로그인 상태인 경우: 자동 생성 및 동기화
        try {
          setProfileLoading(true)
          const email = user.email || ""
          const uniqueUsername = await generateUniqueUsername(email, user.uid)
          const defaultDisplayName = user.displayName || "홍길동"
          
          const newProfile = {
            username: uniqueUsername,
            displayName: defaultDisplayName,
            bio: ""
          }

          // DB 저장 경로: users/{userId}/profile에 저장하기 위해
          // doc(db, "users", userId)의 profile 필드와 하위 호환을 위한 profile/info, profile/profile 동시 저장
          const infoRef = doc(db, "users", user.uid, "profile", "info")
          const subdocRef = doc(db, "users", user.uid, "profile", "profile")
          const userDocRef = doc(db, "users", user.uid)
          const usernameRef = doc(db, "usernames", uniqueUsername)

          await setDoc(infoRef, newProfile, { merge: true })
          await setDoc(subdocRef, newProfile, { merge: true })
          await setDoc(userDocRef, { profile: newProfile }, { merge: true })
          await setDoc(usernameRef, { uid: user.uid })

          setProfile(newProfile)
          setSavedUsername(uniqueUsername)
          setInputUsername(uniqueUsername)
          setInputDisplayName(defaultDisplayName)
          setInputBio("")
        } catch (e) {
          console.error("프로필 자동 생성 실패:", e)
        } finally {
          setProfileLoading(false)
        }
      }
    }, (error) => {
      console.error("프로필 정보 실시간 조회 중 에러:", error)
      setProfileLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  // 3. Firestore에서 개인화(uid) 링크 목록 실시간 불러오기
  useEffect(() => {
    if (!db || !user) {
      setLinks([])
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
      setLinks(fetchedLinks)
    }, (error) => {
      console.error("Firestore 로딩 에러:", error)
    })

    return () => unsubscribe()
  }, [user])

  // 구글 소셜 로그인
  const handleGoogleLogin = async () => {
    if (!auth) {
      alert("Firebase Authentication 모듈이 로드되지 않았습니다. 설정을 확인해 주세요.")
      return
    }
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (error: any) {
      console.error("구글 로그인 실패:", error)
      if (error.code === "auth/configuration-not-found") {
        alert("⚠️ Firebase 콘솔에서 Authentication 기능(Google 로그인 제공업체)이 비활성화 상태입니다. 설정을 완료해 주세요.")
      } else {
        alert("로그인 도중 에러가 발생했습니다: " + error.message)
      }
    }
  }

  // 로그아웃
  const handleLogout = async () => {
    if (!auth) return
    try {
      await signOut(auth)
      setIsEditingProfile(false)
      setEditingId(null)
    } catch (error: any) {
      console.error("로그아웃 실패:", error)
      alert("로그아웃 처리 중 에러가 발생했습니다.")
    }
  }

  // 4. 실시간 Username 중복 검사 기능
  const checkUsernameAvailability = async () => {
    if (!db) return

    const trimmed = inputUsername.trim().toLowerCase()
    
    if (!trimmed) {
      setUsernameFeedback({ available: false, message: "사용자 이름을 입력해주세요." })
      return
    }

    const usernameRegex = /^[a-zA-Z0-9_.]+$/
    if (!usernameRegex.test(trimmed)) {
      setUsernameFeedback({ available: false, message: "영문, 숫자, 밑줄(_), 마침표(.)만 사용할 수 있습니다." })
      return
    }

    if (trimmed.length < 3) {
      setUsernameFeedback({ available: false, message: "최소 3자 이상 입력해주세요." })
      return
    }

    // 본인의 기존 사용자 이름과 동일할 경우 패스
    if (trimmed === savedUsername.toLowerCase()) {
      setUsernameFeedback({ available: true, message: "현재 회원님의 사용자 이름입니다." })
      return
    }

    setIsCheckingUsername(true)
    try {
      const usernameRef = doc(db, "usernames", trimmed)
      const docSnap = await getDoc(usernameRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        if (data.uid !== user?.uid) {
          setUsernameFeedback({ available: false, message: "이미 사용 중인 사용자 이름입니다." })
        } else {
          setUsernameFeedback({ available: true, message: "사용 가능한 사용자 이름입니다." })
        }
      } else {
        setUsernameFeedback({ available: true, message: "사용 가능한 사용자 이름입니다." })
      }
    } catch (error) {
      console.error("Username 중복 검사 오류:", error)
      setUsernameFeedback({ available: false, message: "중복 검사 중 오류가 발생했습니다." })
    } finally {
      setIsCheckingUsername(false)
    }
  }

  // 5. 프로필 업데이트 및 기존 Username 자원 회수 처리
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      alert("로그인이 필요한 서비스입니다.")
      return
    }

    if (!db) return

    const trimmedUsername = inputUsername.trim().toLowerCase()
    const trimmedDisplayName = inputDisplayName.trim()
    const trimmedBio = inputBio.trim()

    if (!trimmedUsername) {
      alert("사용자 이름을 입력해주세요.")
      return
    }

    if (!trimmedDisplayName) {
      alert("이름을 입력해주세요.")
      return
    }

    setIsSavingProfile(true)

    try {
      // 신규 입력된 Username 중복여부 최종 확인
      if (trimmedUsername !== savedUsername.toLowerCase()) {
        const usernameRef = doc(db, "usernames", trimmedUsername)
        const docSnap = await getDoc(usernameRef)
        if (docSnap.exists() && docSnap.data()?.uid !== user.uid) {
          alert("이미 사용 중인 사용자 이름입니다. 다른 이름을 사용해주세요.")
          setIsSavingProfile(false)
          return
        }
      }

      const updatedProfile = {
        username: trimmedUsername,
        displayName: trimmedDisplayName,
        bio: trimmedBio,
        updatedAt: serverTimestamp()
      }

      // 프로필 저장
      const userId = user.uid
      const infoRef = doc(db, "users", userId, "profile", "info")
      const subdocRef = doc(db, "users", userId, "profile", "profile")
      const userDocRef = doc(db, "users", userId)

      // 이중 저장을 통해 경로 요구조건과 하위 컬렉션 완벽 대응
      await setDoc(infoRef, updatedProfile, { merge: true })
      await setDoc(subdocRef, updatedProfile, { merge: true })
      await setDoc(userDocRef, { profile: updatedProfile }, { merge: true })

      // 글로벌 usernames 매핑 갱신
      if (trimmedUsername !== savedUsername.toLowerCase()) {
        // 새 username 바인딩
        await setDoc(doc(db, "usernames", trimmedUsername), {
          uid: userId
        })

        // 기존 구 username 문서 삭제 (청소)
        if (savedUsername) {
          await deleteDoc(doc(db, "usernames", savedUsername.toLowerCase()))
        }
      }

      setIsEditingProfile(false)
      setUsernameFeedback({ available: null, message: "" })
      alert("프로필이 성공적으로 저장되었습니다.")
    } catch (error) {
      console.error("프로필 저장 실패:", error)
      alert("프로필 저장 중 오류가 발생했습니다.")
    } finally {
      setIsSavingProfile(false)
    }
  }

  // 링크 추가 핸들러
  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      alert("로그인이 필요한 서비스입니다.")
      return
    }

    const trimmedTitle = title.trim()
    const trimmedUrl = url.trim()

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
      console.error("Firestore 저장 에러:", error)
      alert("데이터를 저장하는 중에 오류가 발생했습니다.")
    }
  }

  // 링크 삭제
  const handleOpenDeleteModal = (e: React.MouseEvent, link: LinkItem) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) return

    setLinkToDelete(link)
    setIsDeleteModalOpen(true)
  }

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setLinkToDelete(null)
  }

  const handleConfirmDelete = async () => {
    if (!linkToDelete || !user) return

    try {
      await deleteDoc(doc(db, "users", user.uid, "links", linkToDelete.id))
      handleCloseDeleteModal()
    } catch (error) {
      console.error("Firestore 삭제 에러:", error)
      alert("링크를 삭제하는 도중 오류가 발생했습니다.")
    }
  }

  // 링크 수정
  const handleStartEdit = (e: React.MouseEvent, link: LinkItem) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) return

    setEditingId(link.id)
    setEditTitle(link.title)
    setEditUrl(link.url)
  }

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingId(null)
    setEditTitle("")
    setEditUrl("")
  }

  const handleSaveEdit = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) return

    const trimmedTitle = editTitle.trim()
    const trimmedUrl = editUrl.trim()

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

    try {
      const linkRef = doc(db, "users", user.uid, "links", id)
      await updateDoc(linkRef, {
        title: trimmedTitle,
        url: formattedUrl,
        updatedAt: serverTimestamp()
      })

      setEditingId(null)
      setEditTitle("")
      setEditUrl("")
    } catch (error) {
      console.error("Firestore 수정 에러:", error)
      alert("데이터를 수정하는 중에 오류가 발생했습니다.")
    }
  }

  const handleLinkClick = async (e: React.MouseEvent<HTMLAnchorElement>, linkId: string) => {
    if (!user) return

    if (!auth || !auth.currentUser) {
      console.error("클릭 카운트 저장 실패: 로그인 상태가 아닙니다.")
      return
    }

    try {
      const linkRef = doc(db, "users", user.uid, "links", linkId)
      await updateDoc(linkRef, {
        clickCount: increment(1)
      })
    } catch (error) {
      console.error("클릭 카운트 저장 중 에러 발생:", error)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-[#F8F9FA] px-4 py-8 sm:py-12 dark:bg-neutral-950">
      
      {/* 🧭 네비게이션 헤더 */}
      <header className="w-full max-w-xl flex items-center justify-between py-3 px-4 mb-8 rounded-xl border border-neutral-200/80 bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80 shadow-xs">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-lg">🏡</span>
          <span className="font-bold text-neutral-800 dark:text-neutral-50 text-sm">홈으로</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2.5 animate-fadeIn">
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-350 mr-1">
                {profile.displayName || user.displayName || "홍길동"}님
              </span>
              <Link
                href="/stats"
                className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 hover:text-purple-600 transition-colors dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-350 dark:hover:bg-neutral-850"
              >
                📈 통계
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 hover:text-red-500 transition-colors dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-450 dark:hover:bg-neutral-850"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleLogin}
              className="flex items-center gap-2 rounded-lg bg-neutral-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800 transition-colors active:scale-[0.98] dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Google 로그인
            </button>
          )}
        </div>
      </header>

      {/* 🧑‍💻 프로필 수정 및 전시 대시보드 카드 */}
      <Card className="w-full max-w-xl border border-neutral-200 bg-white/90 shadow-xs mb-8 dark:border-neutral-800 dark:bg-neutral-900/90 overflow-hidden">
        <CardContent className="p-6">
          {profileLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
              <p className="text-xs text-neutral-400">프로필 정보를 불러오는 중입니다...</p>
            </div>
          ) : !user ? (
            // 비로그인 안내 카드
            <div className="flex flex-col items-center text-center py-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-50 text-3xl mb-4 dark:bg-purple-950/20">
                🔒
              </div>
              <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">
                개인 프로필 기능을 활성화하세요
              </h2>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
                Google 계정으로 로그인하시면 나만의 고유 Username, 표시 이름, 소개글을 설정하고 개인 링크 목록을 클라우드에 영구히 저장할 수 있습니다.
              </p>
              <button
                onClick={handleGoogleLogin}
                className="mt-6 flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-purple-700 transition-all active:scale-[0.98]"
              >
                지금 Google로 로그인하기
              </button>
            </div>
          ) : isEditingProfile ? (
            // 프로필 편집 모드 폼
            <form onSubmit={handleSaveProfile} className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
                <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  프로필 수정
                </h3>
                <span className="text-xs text-neutral-400">내 개인 브랜드 구축하기</span>
              </div>

              {/* Username 입력 필드 */}
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1.5 dark:text-neutral-400">
                  사용자 이름 (Username - 공유 URL용)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-semibold text-sm">
                      @
                    </span>
                    <input
                      type="text"
                      placeholder="예: codelimi"
                      value={inputUsername}
                      onChange={(e) => {
                        setInputUsername(e.target.value);
                        setUsernameFeedback({ available: null, message: "" });
                      }}
                      className="w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-8 pr-3.5 py-2 text-sm outline-none transition-all focus:border-purple-500 focus:bg-white dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-purple-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={checkUsernameAvailability}
                    disabled={isCheckingUsername}
                    className="shrink-0 rounded-lg border border-neutral-200 bg-white px-3.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-350"
                  >
                    {isCheckingUsername ? "확인 중..." : "중복 확인"}
                  </button>
                </div>
                {usernameFeedback.message && (
                  <p className={`mt-1.5 text-xs font-medium ${
                    usernameFeedback.available ? "text-green-600 dark:text-green-450" : "text-red-500 dark:text-red-400"
                  }`}>
                    {usernameFeedback.available ? "✓" : "✗"} {usernameFeedback.message}
                  </p>
                )}
              </div>

              {/* displayName 입력 필드 */}
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1.5 dark:text-neutral-400">
                  표시 이름 (Display Name)
                </label>
                <input
                  type="text"
                  placeholder="예: 홍길동"
                  value={inputDisplayName}
                  onChange={(e) => setInputDisplayName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-sm outline-none transition-all focus:border-purple-500 focus:bg-white dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-purple-500"
                />
              </div>

              {/* 소개글 입력 필드 */}
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1.5 dark:text-neutral-400">
                  소개글 (Bio)
                </label>
                <textarea
                  placeholder="자기소개를 간단히 입력해 주세요."
                  value={inputBio}
                  onChange={(e) => setInputBio(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-sm outline-none transition-all focus:border-purple-500 focus:bg-white dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-purple-500 resize-none"
                />
              </div>

              {/* 버튼 세트 */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingProfile(false);
                    setUsernameFeedback({ available: null, message: "" });
                    // 값 원래대로 되돌림
                    setInputUsername(profile.username);
                    setInputDisplayName(profile.displayName);
                    setInputBio(profile.bio);
                  }}
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-850"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile || (usernameFeedback.available === false && inputUsername.trim().toLowerCase() !== savedUsername.toLowerCase())}
                  className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-50"
                >
                  {isSavingProfile ? "저장 중..." : "저장 완료"}
                </button>
              </div>
            </form>
          ) : (
            // 프로필 전시 모드
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-5 animate-fadeIn">
              {/* 프로필 이미지 아이콘 */}
              <div className="relative shrink-0">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-50 border border-purple-100 text-3xl shadow-xs dark:bg-neutral-850 dark:border-neutral-800">
                  {profile.displayName ? profile.displayName.charAt(0) : "🧑‍💻"}
                </div>
                <span className="absolute bottom-0 right-0 flex h-4.5 w-4.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4.5 w-4.5 bg-green-500 border-2 border-white dark:border-neutral-900"></span>
                </span>
              </div>

              {/* 프로필 정보 */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 truncate">
                    {profile.displayName || user.displayName || "홍길동"}
                  </h2>
                  {profile.username && (
                    <span className="inline-block self-center px-2 py-0.5 rounded-full bg-purple-50 text-[10px] font-bold text-purple-600 border border-purple-100 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50">
                      @{profile.username}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-350 break-words">
                  {profile.bio || "아직 작성된 소개글이 없습니다. 멋진 자기소개를 채워보세요!"}
                </p>
                
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-850 shadow-xs"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                    <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                  </svg>
                  프로필 수정하기
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. 중간 - 링크 추가 폼 - 로그인 시에만 노출 */}
      {user && (
        <>
          <Card className="w-full max-w-xl border border-neutral-200 bg-white shadow-xs mb-10 dark:border-neutral-800 dark:bg-neutral-900">
            <CardContent className="p-6">
              <form onSubmit={handleAddLink} noValidate className="flex flex-col gap-4">
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
                
                <button
                  type="submit"
                  className="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-purple-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-950"
                >
                  새 링크 추가하기
                </button>
              </form>
            </CardContent>
          </Card>

          {/* 3. 하단 - 링크 목록 */}
          <div className="w-full max-w-xl flex flex-col gap-4">
            <h2 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 px-1 mb-1">
              현재 링크 목록 ({links.length}개)
            </h2>
            
            {links.map((link, idx) => {
              const isEditing = editingId === link.id;
              const domain = getDomain(link.url);
              const faviconUrl = domain 
                ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` 
                : null;

              if (isEditing) {
                return (
                  <div key={`${link.id}-${idx}`} className="w-full">
                    <Card className="overflow-hidden border border-purple-500 bg-white shadow-md dark:border-purple-500 dark:bg-neutral-900">
                      <CardContent className="flex flex-col gap-3.5 p-4 animate-fadeIn">
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
                  key={`${link.id}-${idx}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => handleLinkClick(e, link.id)}
                  className="group block transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Card className="overflow-hidden border border-neutral-200/80 bg-white/95 shadow-sm transition-all duration-300 hover:border-neutral-300 hover:bg-white hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/95 dark:hover:border-neutral-700 dark:hover:bg-neutral-900">
                    <CardContent className="flex items-center gap-4 p-4">
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
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 group-hover:text-black dark:group-hover:text-white">
                            {link.title}
                          </h3>
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-600 border border-purple-100/50 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/30">
                            🖱️ {link.clickCount || 0}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 truncate dark:text-neutral-500">
                          {link.url}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1">
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
        </>
      )}
      
      {/* 🗑️ 삭제 확인 모달 */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-neutral-100 dark:bg-neutral-900 dark:border-neutral-800 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-3">
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
