import { ImageResponse } from 'next/og'
import fs from 'fs'
import path from 'path'

export const alt = 'MyLink Profile'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { username: string } }) {
  const rawUsername = params.username || ''
  const username = decodeURIComponent(rawUsername).trim()

  const bagelFontData = fs.readFileSync(path.join(process.cwd(), 'public/fonts/BagelFatOne-Regular.ttf'))
  const blackHanSansFontData = fs.readFileSync(path.join(process.cwd(), 'public/fonts/BlackHanSans-Regular.ttf'))

  // 대각선 호피무늬 패턴 SVG 생성 (좌상단, 우하단 장식)
  const LeopardSpots = () => (
    <>
      {/* 좌측 상단 대각선 덩어리 */}
      <svg width="500" height="500" viewBox="0 0 500 500" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.95 }}>
        {/* Spot 1 */}
        <path d="M50,50 C70,30 110,40 100,70 C90,100 50,110 40,80 C30,50 60,30 50,50 Z" fill="#ec4899" />
        <path d="M60,60 C70,50 90,55 85,70 C80,85 60,90 55,75 C50,60 65,50 60,60 Z" fill="#fdf2f8" />
        <circle cx="70" cy="70" r="10" fill="#f59e0b" />
        
        {/* Spot 2 */}
        <path d="M150,80 C180,60 220,80 200,110 C180,140 130,130 140,100 C150,70 170,50 150,80 Z" fill="#ec4899" />
        <path d="M165,90 C180,75 200,90 190,105 C180,120 155,115 160,100 C165,85 175,75 165,90 Z" fill="#fdf2f8" />
        <circle cx="175" cy="95" r="12" fill="#f59e0b" />

        {/* Spot 3 */}
        <path d="M80,180 C120,150 160,180 140,220 C120,260 60,240 70,200 C80,160 110,140 80,180 Z" fill="#ec4899" />
        <path d="M95,190 C115,175 140,195 130,215 C120,235 85,225 90,205 C95,185 110,175 95,190 Z" fill="#fdf2f8" />
        <circle cx="110" cy="205" r="15" fill="#f59e0b" />
        
        {/* Small solid spots */}
        <path d="M250,50 C270,40 280,60 260,70 C240,80 230,60 250,50 Z" fill="#ec4899" />
        <path d="M300,120 C320,110 330,140 310,150 C290,160 280,130 300,120 Z" fill="#f59e0b" />
        <path d="M180,220 C200,210 210,240 190,250 C170,260 160,230 180,220 Z" fill="#ec4899" />
        <path d="M80,320 C100,310 110,340 90,350 C70,360 60,330 80,320 Z" fill="#f59e0b" />
        <path d="M220,150 C240,130 270,150 250,170 C230,190 200,170 220,150 Z" fill="#ec4899" />
        <path d="M50,280 C70,260 90,280 80,300 C70,320 40,300 50,280 Z" fill="#ec4899" />
        <path d="M380,30 C410,20 420,50 390,60 C360,70 350,40 380,30 Z" fill="#ec4899" />
        <path d="M120,400 C150,380 170,410 140,430 C110,450 90,420 120,400 Z" fill="#ec4899" />
      </svg>
      
      {/* 우측 하단 대각선 덩어리 */}
      <svg width="500" height="500" viewBox="0 0 500 500" style={{ position: 'absolute', bottom: 0, right: 0, opacity: 0.95 }}>
        {/* Spot 1 */}
        <path d="M450,450 C430,470 390,460 400,430 C410,400 450,390 460,420 C470,450 440,470 450,450 Z" fill="#ec4899" />
        <path d="M440,440 C430,450 410,445 415,430 C420,415 440,410 445,425 C450,440 435,450 440,440 Z" fill="#fdf2f8" />
        <circle cx="430" cy="430" r="10" fill="#f59e0b" />
        
        {/* Spot 2 */}
        <path d="M350,420 C320,440 280,420 300,390 C320,360 370,370 360,400 C350,430 330,450 350,420 Z" fill="#ec4899" />
        <path d="M335,410 C320,425 300,410 310,395 C320,380 345,385 340,400 C335,415 325,425 335,410 Z" fill="#fdf2f8" />
        <circle cx="325" cy="405" r="12" fill="#f59e0b" />

        {/* Spot 3 */}
        <path d="M420,320 C380,350 340,320 360,280 C380,240 440,260 430,300 C420,340 390,360 420,320 Z" fill="#ec4899" />
        <path d="M405,310 C385,325 360,305 370,285 C380,265 415,275 410,295 C405,315 390,325 405,310 Z" fill="#fdf2f8" />
        <circle cx="390" cy="295" r="15" fill="#f59e0b" />
        
        {/* Small solid spots */}
        <path d="M250,450 C230,460 220,440 240,430 C260,420 270,440 250,450 Z" fill="#ec4899" />
        <path d="M200,380 C180,390 170,360 190,350 C210,340 220,370 200,380 Z" fill="#f59e0b" />
        <path d="M320,280 C300,290 290,260 310,250 C330,240 340,270 320,280 Z" fill="#ec4899" />
        <path d="M420,180 C400,190 390,160 410,150 C430,140 440,170 420,180 Z" fill="#f59e0b" />
        <path d="M280,350 C260,370 230,350 250,330 C270,310 300,330 280,350 Z" fill="#ec4899" />
        <path d="M450,220 C430,240 410,220 420,200 C430,180 460,200 450,220 Z" fill="#ec4899" />
        <path d="M120,470 C90,480 80,450 110,440 C140,430 150,460 120,470 Z" fill="#ec4899" />
        <path d="M380,100 C350,120 330,90 360,70 C390,50 410,80 380,100 Z" fill="#ec4899" />
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
        <div
          style={{
            display: 'flex',
            fontFamily: '"Bagel Fat One"',
            fontSize: 100,
            color: '#ec4899',
            textAlign: 'center',
            textShadow: '8px 8px 0px rgba(252,211,77,1)',
            padding: '0 80px',
          }}
        >
          {username}삐의 마이링크♡
        </div>
        
        <div
          style={{
            display: 'flex',
            fontFamily: '"Black Han Sans"',
            fontSize: 45,
            color: '#eab308',
            marginTop: 40,
            textShadow: '3px 3px 0px rgba(236,72,153,0.3)',
          }}
        >
          세상에서 제일 귀엽게 나를 표현해봐! ✨
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
