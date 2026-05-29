import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, getFirestore, Firestore } from "firebase/firestore";

// Your web app's Firebase configuration managed via environment variables for security
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// 필수 환경변수 누락 여부 검증
const isConfigComplete = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);

if (!isConfigComplete) {
  console.warn("⚠️ Firebase 환경 변수설정이 유효하지 않거나 누락되었습니다. .env.local 파일을 확인해주세요.");
}

// Next.js SSR 및 Hot Reloading 환경에서의 안전한 중복 초기화 방지
let app: any = null;
if (isConfigComplete) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

// Authentication 초기화
let auth: any = null;
if (app) {
  try {
    auth = getAuth(app);
  } catch (error) {
    console.error("⚠️ Firebase Auth 초기화 중 에러 발생 (콘솔 확인 필요):", error);
  }
} else {
  console.warn("⚠️ Firebase가 초기화되지 않아 Auth를 초기화하지 않습니다.");
}

// Firestore 연결 실패(10초 대기 시간 초과) 방지를 위해 Long Polling 강제 활성화 및 중복 초기화 방지 처리
let db: any = null;
if (app) {
  try {
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  } catch (error) {
    // HMR 등으로 인해 이미 초기화된 경우, getFirestore를 호출하여 기존 인스턴스 안전하게 획득
    db = getFirestore(app);
  }
}

export { app, auth, db };
