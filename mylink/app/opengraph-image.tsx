import { ImageResponse } from 'next/og'
import fs from 'fs'
import path from 'path'

export const alt = 'MyLink - 세상에서 제일 귀엽게 나를 표현해봐!'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const bagelFontData = fs.readFileSync(path.join(process.cwd(), 'public/fonts/BagelFatOne-Regular.ttf'))
  const blackHanSansFontData = fs.readFileSync(path.join(process.cwd(), 'public/fonts/BlackHanSans-Regular.ttf'))

  // 호피무늬 패턴 SVG 생성 (좌상단, 우하단 장식)
  const LeopardSpots = () => (
    <>
      {/* 좌측 상단 호피 */}
      <svg width="400" height="400" viewBox="0 0 400 400" style={{ position: 'absolute', top: -50, left: -50, opacity: 0.8 }}>
        <path d="M120,80 C150,70 170,110 140,140 C110,170 80,150 70,110 C60,70 90,90 120,80 Z" fill="#ec4899" />
        <path d="M220,120 C250,110 260,150 230,170 C200,190 180,160 190,130 C200,100 190,130 220,120 Z" fill="#f59e0b" />
        <path d="M80,220 C110,210 130,240 100,270 C70,300 40,280 50,240 C60,200 50,230 80,220 Z" fill="#ec4899" />
        <path d="M180,260 C210,240 230,280 200,310 C170,340 140,320 150,280 C160,240 150,280 180,260 Z" fill="#f59e0b" />
        <path d="M280,60 C320,50 330,90 290,110 C250,130 230,100 240,70 C250,40 240,70 280,60 Z" fill="#ec4899" />
      </svg>
      {/* 우측 하단 호피 */}
      <svg width="400" height="400" viewBox="0 0 400 400" style={{ position: 'absolute', bottom: -50, right: -50, opacity: 0.8 }}>
        <path d="M280,320 C250,330 230,290 260,260 C290,230 320,250 330,290 C340,330 310,310 280,320 Z" fill="#ec4899" />
        <path d="M180,280 C150,290 140,250 170,230 C200,210 220,240 210,270 C200,300 210,270 180,280 Z" fill="#f59e0b" />
        <path d="M320,180 C290,190 270,160 300,130 C330,100 360,120 350,160 C340,200 350,170 320,180 Z" fill="#ec4899" />
        <path d="M220,140 C190,160 170,120 200,90 C230,60 260,80 250,120 C240,160 250,120 220,140 Z" fill="#f59e0b" />
        <path d="M120,340 C80,350 70,310 110,290 C150,270 170,300 160,330 C150,360 160,330 120,340 Z" fill="#ec4899" />
      </svg>
    </>
  )

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#fdf2f8',
          position: 'relative',
        }}
      >
        <LeopardSpots />
        
        <div style={{ position: 'absolute', top: 24, left: 24, right: 24, bottom: 24, border: '24px solid #ec4899', borderRadius: '60px', display: 'flex' }} />
        
        <div style={{ position: 'absolute', top: 80, left: 80, fontSize: 100 }}>🎀</div>
        <div style={{ position: 'absolute', bottom: 80, right: 80, fontSize: 100 }}>💖</div>
        
        <div
          style={{
            display: 'flex',
            fontFamily: '"Bagel Fat One"',
            fontSize: 130,
            color: '#ec4899',
            textAlign: 'center',
            textShadow: '10px 10px 0px rgba(252,211,77,1)',
            padding: '0 80px',
          }}
        >
          MyLink ✨
        </div>
        
        <div
          style={{
            display: 'flex',
            fontFamily: '"Black Han Sans"',
            fontSize: 55,
            color: '#eab308',
            marginTop: 40,
            textShadow: '3px 3px 0px rgba(236,72,153,0.3)',
          }}
        >
          세상에서 제일 귀엽게 나를 표현해봐! 💅
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Bagel Fat One',
          data: bagelFontData,
          style: 'normal',
        },
        {
          name: 'Black Han Sans',
          data: blackHanSansFontData,
          style: 'normal',
        },
      ],
    }
  )
}
