import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'MyLink - 세상에서 제일 귀엽게 나를 표현해봐!'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
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
          backgroundColor: '#fdf2f8', // pink-50
          position: 'relative',
        }}
      >
        {/* 💖 굵은 프레임 */}
        <div 
          style={{ 
            position: 'absolute', 
            top: 24, 
            left: 24, 
            right: 24, 
            bottom: 24, 
            border: '24px solid #ec4899', 
            borderRadius: '60px',
            display: 'flex' 
          }} 
        />
        
        {/* ✨ 장식 이모지 */}
        <div style={{ position: 'absolute', top: 80, left: 80, fontSize: 100 }}>🎀</div>
        <div style={{ position: 'absolute', bottom: 80, right: 80, fontSize: 100 }}>💖</div>
        <div style={{ position: 'absolute', top: 80, right: 120, fontSize: 80 }}>✨</div>
        <div style={{ position: 'absolute', bottom: 120, left: 120, fontSize: 90 }}>🐆</div>

        {/* 🎀 메인 텍스트 */}
        <div
          style={{
            display: 'flex',
            fontSize: 110,
            fontWeight: 900,
            color: '#ec4899', // pink-500
            textAlign: 'center',
            textShadow: '8px 8px 0px rgba(252,211,77,1)', // yellow-300 drop shadow
            padding: '0 80px',
            fontStyle: 'italic'
          }}
        >
          MyLink ✨
        </div>
        
        {/* ✨ 서브 텍스트 */}
        <div
          style={{
            display: 'flex',
            fontSize: 45,
            fontWeight: 'bold',
            color: '#eab308', // yellow-500
            marginTop: 50,
          }}
        >
          세상에서 제일 귀엽게 나를 표현해봐! 💅
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
