import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'
import { ThemeProvider } from '@/components/ThemeProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'FlagHouse',
  description: 'Houses. Briefs. Logs. Flags.',
}

// Inline script prevents theme flash before React hydrates
const themeScript = `
(function(){
  function isNight(){
    var t=new Date(),m=t.getHours()*60+t.getMinutes();
    return m>=18*60+30||m<6*60+30;
  }
  var manual=localStorage.getItem('fh-theme-manual')==='true';
  var saved=localStorage.getItem('fh-theme');
  var dark=manual?(saved==='dark'):isNight();
  if(dark)document.documentElement.classList.add('dark');
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable}`}>
        <ThemeProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            {/* Subtle separator */}
            <div
              style={{
                width: '1px',
                background: 'linear-gradient(to bottom, transparent, var(--shadow-d) 20%, var(--shadow-d) 80%, transparent)',
                opacity: 0.6,
                flexShrink: 0,
              }}
            />
            <main className="flex-1 min-w-0 overflow-y-auto px-8 py-7">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
