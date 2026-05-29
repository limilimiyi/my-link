import { MetadataRoute } from 'next'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 실제 사용 중인 프로덕션 도메인으로 설정
  const baseUrl = 'https://my-link-liard.vercel.app'
  
  // 1. 정적(Static) 라우트 설정
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  // 2. 동적(Dynamic) 라우트 설정 (Firestore에서 username 목록 가져오기)
  try {
    if (db) {
      // 'usernames' 컬렉션의 모든 문서(doc.id = username) 가져오기
      const usernamesSnap = await getDocs(collection(db, 'usernames'))
      
      usernamesSnap.forEach((doc) => {
        const username = doc.id
        routes.push({
          url: `${baseUrl}/${encodeURIComponent(username)}`,
          lastModified: new Date(), // 실제 업데이트 날짜가 있다면 해당 필드 사용 가능
          changeFrequency: 'weekly',
          priority: 0.9,
        })
      })
    }
  } catch (error) {
    console.error('사이트맵 생성 중 사용자 목록 불러오기 실패:', error)
  }

  return routes
}
