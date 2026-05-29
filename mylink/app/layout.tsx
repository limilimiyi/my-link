import { Geist, Geist_Mono, Lora, Figtree, Black_Han_Sans, Hi_Melody, Bagel_Fat_One } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";

const figtreeHeading = Figtree({subsets:['latin'],variable:'--font-heading'});

const blackHanSans = Black_Han_Sans({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-black-han",
});

const hiMelody = Hi_Melody({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-hi-melody",
});

const bagelFatOne = Bagel_Fat_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bagel",
});

const lora = Lora({subsets:['latin'],variable:'--font-serif'});

const geist = Geist({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

import { Metadata } from "next"

export const metadata: Metadata = {
  metadataBase: new URL("https://my-link-liard.vercel.app"),
  title: "MyLink | 🎀 세상에서 제일 귀엽게 나를 표현해봐! 💅✨",
  description: "30분 만에 끝내는 초강력 퍼스널 브랜딩! 나만의 링크 페이지를 갸루 감성으로 꾸며보세요. 💖🐆✨",
  openGraph: {
    title: "MyLink | 🎀 세상에서 제일 귀엽게 나를 표현해봐! 💅✨",
    description: "30분 만에 끝내는 초강력 퍼스널 브랜딩! 나만의 링크 페이지를 갸루 감성으로 꾸며보세요. 💖🐆✨",
    type: "website",
    locale: "ko_KR",
    url: "https://my-link-liard.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyLink | 🎀 세상에서 제일 귀엽게 나를 표현해봐! 💅✨",
    description: "나만의 링크 페이지를 갸루 감성으로 꾸며보세요. 💖🐆✨",
  },
  verification: {
    google: "IMVLc2aclm9odcoA8O70agyJ6nq4wzQvEHkiRgeSxvk",
    other: {
      "naver-site-verification": "ad193c5029a3a05064f539b72c405171d903c6a1",
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, lora.variable, figtreeHeading.variable, blackHanSans.variable, hiMelody.variable, bagelFatOne.variable, "font-sans", geist.variable)}
    >
      <body className={bagelFatOne.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
