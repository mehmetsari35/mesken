'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Download, ArrowRight, Smartphone, Shield, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SplashScreen } from '@/components/ui/splash-screen'

export default function HomePage() {
  const router = useRouter()
  const [showSplash, setShowSplash] = useState(true)
  const [isInstallable, setIsInstallable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false)
  }, [])

  useEffect(() => {
    // Check if already installed as PWA - skip splash and go to app
    const isInStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true

    if (isInStandaloneMode) {
      // PWA mode - skip splash, go directly to app
      router.replace('/app')
      return
    }

    setIsStandalone(false)

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(isIOSDevice)

    // Listen for install prompt (Android/Desktop)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [router])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    const promptEvent = deferredPrompt as Event & {
      prompt: () => void
      userChoice: Promise<{ outcome: string }>
    }

    promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice

    if (outcome === 'accepted') {
      setIsInstallable(false)
    }

    setDeferredPrompt(null)
  }

  const handleContinue = () => {
    router.push('/login')
  }


  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} duration={3000} />
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-900 overflow-hidden">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-4 min-h-0 overflow-y-auto">
        {/* Logo */}
        <div className="relative mb-4 flex-shrink-0">
          <div className="absolute inset-0 h-16 w-16 rounded-2xl bg-emerald-500 blur-xl opacity-30" />
          <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 flex items-center justify-center shadow-xl shadow-emerald-500/25">
            <div className="absolute inset-0.5 rounded-[12px] bg-gradient-to-br from-white/20 to-transparent" />
            <span className="relative text-2xl font-black text-white drop-shadow-md">M</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-zinc-100 tracking-tight text-center flex-shrink-0">
          MESKEN
        </h1>
        <p className="text-sm text-zinc-400 mt-1 text-center max-w-xs flex-shrink-0">
          Özel alanın. Güvenli ve özel mesajlaşma platformu.
        </p>

        {/* Features */}
        <div className="mt-5 space-y-2 w-full max-w-sm flex-shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50">
            <div className="h-9 w-9 rounded-full bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
              <Shield className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-zinc-100 text-sm">Davetiye ile Giriş</h3>
              <p className="text-xs text-zinc-500">Sadece davet edilenler katılabilir</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50">
            <div className="h-9 w-9 rounded-full bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
              <Lock className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-zinc-100 text-sm">Gizlilik Öncelikli</h3>
              <p className="text-xs text-zinc-500">E-posta veya telefon gerekmez</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50">
            <div className="h-9 w-9 rounded-full bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
              <Smartphone className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-zinc-100 text-sm">Her Yerde</h3>
              <p className="text-xs text-zinc-500">Web, mobil ve masaüstü desteği</p>
            </div>
          </div>
        </div>

        {/* Actions - moved inside hero section */}
        <div className="mt-5 w-full max-w-sm space-y-2 flex-shrink-0 pb-4">
          {/* iOS Install Instructions */}
          {isIOS && !isStandalone && (
            <div className="p-4 rounded-xl bg-zinc-800 text-center">
              <p className="text-sm text-zinc-300">
                iOS&apos;ta yüklemek için{' '}
                <span className="text-emerald-500">Paylaş</span> butonuna
                dokunun ve{' '}
                <span className="text-emerald-500">&quot;Ana Ekrana Ekle&quot;</span>{' '}
                seçin.
              </p>
            </div>
          )}

          {/* Install Button - Always show */}
          {!isIOS && (
            <Button
              onClick={isInstallable ? handleInstall : handleContinue}
              variant="primary"
              size="lg"
              className="w-full"
            >
              <Download className="mr-2 h-5 w-5" />
              Uygulamayı Yükle
            </Button>
          )}

          {/* iOS Continue Button */}
          {isIOS && (
            <Button
              onClick={handleContinue}
              variant="primary"
              size="lg"
              className="w-full"
            >
              <Download className="mr-2 h-5 w-5" />
              Uygulamayı Yükle
            </Button>
          )}

          {/* Skip link - small text */}
          <button
            onClick={handleContinue}
            className="w-full text-center text-sm text-zinc-500 hover:text-zinc-400 transition-colors py-2"
          >
            Tarayıcıda devam et
          </button>
        </div>
      </div>
    </div>
  )
}
