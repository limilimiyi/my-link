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
