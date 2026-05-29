# MyLink (마이링크) 🎀✨

> **30분 만에 끝내는 초강력 퍼스널 브랜딩! 나만의 링크 페이지를 갸루 감성으로 꾸며보세요. 💖🐆✨**

세상에서 제일 귀엽게 나를 표현할 수 있는 커스텀 멀티 링크 서비스입니다. 인스타그램, 유튜브, 틱톡 등 다양한 소셜 미디어 링크를 한 곳에 모아 개성 넘치는 나만의 프로필 페이지를 만들어 보세요!

<br/>

## 🚀 주요 기능 (Features)

- **🎨 개성 넘치는 갸루(Gyaru) 테마 디자인**
  - 핫핑크 & 옐로우 컬러와 호피 무늬(Leopard)를 활용한 유니크한 감성
  - `Bagel Fat One` 및 `Black Han Sans` 등 통통 튀고 가독성 좋은 커스텀 폰트 적용
- **🔗 손쉬운 멀티 링크 관리**
  - 인스타그램, 유튜브, 틱톡, X(트위터), 페이스북 등 다양한 SNS 아이콘 지원
  - 나만의 커스텀 링크 추가 기능
- **🔐 Firebase 기반의 안전한 로그인 및 데이터베이스**
  - Firebase Authentication을 통한 간편 로그인
  - Firestore를 활용한 실시간 프로필 데이터 저장 및 반영
- **🌐 SEO 및 소셜 공유 최적화 (OpenGraph)**
  - 메인 페이지 및 개별 유저 프로필(`/username`)에 동적 OG 썸네일(OpenGraph Image) 자동 생성 적용
  - 카카오톡, 슬랙 등 메신저 공유 시 시선을 사로잡는 커스텀 이미지 제공
  - 네이버 서치어드바이저 및 구글 서치콘솔 소유권 인증 완료
  - 동적 `sitemap.xml` 자동 생성 지원

<br/>

## 🛠️ 기술 스택 (Tech Stack)

- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) / Vanilla CSS
- **Database & Auth**: [Firebase](https://firebase.google.com/) (Firestore, Authentication)
- **Deployment**: [Vercel](https://vercel.com)
- **Image Generation**: `@vercel/og` (next/og) 기반 동적 썸네일 생성

<br/>

## ⚙️ 로컬 실행 방법 (Getting Started)

1. **레포지토리 클론 및 폴더 이동**
   ```bash
   git clone https://github.com/limilimiyi/my-link.git
   cd my-link/mylink
   ```

2. **패키지 설치**
   ```bash
   npm install
   ```

3. **환경 변수 설정**
   루트 경로에 `.env.local` 파일을 생성하고 Firebase 설정 키를 입력합니다.
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
   NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
   ```

4. **개발 서버 실행**
   ```bash
   npm run dev
   ```
   브라우저에서 `http://localhost:3000`으로 접속하여 확인합니다.

<br/>

## 🌐 라이브 배포 주소 (Live Demo)

- **Production URL**: [https://my-link-liard.vercel.app](https://my-link-liard.vercel.app)
- **Sitemap**: [https://my-link-liard.vercel.app/sitemap.xml](https://my-link-liard.vercel.app/sitemap.xml)
