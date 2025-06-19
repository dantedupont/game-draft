import './globals.css'
import { TRPCProvider } from '@/trpc/provider'

export const metadata = {
  title: "Game Drafter",
  description: "Web app to help you choose a game for game night"
}

export const viewport = {
  width: 'device-width'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <TRPCProvider>
          {children}
        </TRPCProvider>
      </body>
    </html>
  )
}