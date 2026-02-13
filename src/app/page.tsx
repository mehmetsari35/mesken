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
    // Check if already installed as PWA
    const isInStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true

    setIsStandalone(isInStandaloneMode)

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
  }, [])

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

  // If already installed, redirect to app
  useEffect(() => {
    if (isStandalone) {
      router.replace('/app')
    }
  }, [isStandalone, router])

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} duration={2000} />
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-900 overflow-hidden">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 min-h-0">
        {/* Logo */}
        <div className="relative mb-6">
          <div className="absolute inset-0 h-20 w-20 rounded-2xl bg-emerald-500 blur-xl opacity-30" />
          <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 flex items-center justify-center shadow-xl shadow-emerald-500/25">
            <div className="absolute inset-0.5 rounded-[14px] bg-gradient-to-br from-white/20 to-transparent" />
            <span className="relative text-3xl font-black text-white drop-shadow-md">M</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-zinc-100 tracking-tight text-center">
          MESKEN
        </h1>
        <p className="text-base text-zinc-400 mt-2 text-center max-w-xs">
          Özel alanın. Güvenli ve özel mesajlaşma platformu.
        </p>

        {/* Features */}
        <div className="mt-8 space-y-3 w-full max-w-sm">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-800/50">
            <div className="h-10 w-10 rounded-full bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-zinc-100">Davetiye ile Giriş</h3>
              <p className="text-sm text-zinc-500">Sadece davet edilenler katılabilir</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-800/50">
            <div className="h-10 w-10 rounded-full bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
              <Lock className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-zinc-100">Gizlilik Öncelikli</h3>
              <p className="text-sm text-zinc-500">E-posta veya telefon gerekmez</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-800/50">
            <div className="h-10 w-10 rounded-full bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
              <Smartphone className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-zinc-100">Her Yerde</h3>
              <p className="text-sm text-zinc-500">Web, mobil ve masaüstü desteği</p>
            </div>
          </div>
        </div>

        {/* Actions - moved inside hero section */}
        <div className="mt-8 w-full max-w-sm space-y-3">
          {/* Install Button - Android/Desktop */}
          {isInstallable && !isIOS && (
            <Button
              onClick={handleInstall}
              variant="primary"
              size="lg"
              className="w-full"
            >
              <Download className="mr-2 h-5 w-5" />
              Uygulamayı Yükle
            </Button>
          )}

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

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            variant={isInstallable ? 'secondary' : 'primary'}
            size="lg"
            className="w-full"
          >
            Devam Et
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
