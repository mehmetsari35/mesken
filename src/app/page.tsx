'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, ArrowRight, Smartphone, Shield, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const router = useRouter()
  const [isInstallable, setIsInstallable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

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

  return (
    <div className="min-h-screen flex flex-col bg-zinc-900">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="mb-8">
          <div className="h-20 w-20 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
            <span className="text-3xl font-bold text-white">M</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-zinc-100 tracking-tight text-center">
          MESKEN
        </h1>
        <p className="text-lg text-zinc-400 mt-2 text-center">
          Özel alanın.
        </p>

        {/* Features */}
        <div className="mt-12 space-y-4 w-full max-w-sm">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-800/50">
            <div className="h-10 w-10 rounded-full bg-emerald-600/20 flex items-center justify-center">
              <Shield className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-medium text-zinc-100">Davetiye ile Giriş</h3>
              <p className="text-sm text-zinc-500">Sadece davet edilenler katılabilir</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-800/50">
            <div className="h-10 w-10 rounded-full bg-emerald-600/20 flex items-center justify-center">
              <Lock className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-medium text-zinc-100">Gizlilik Öncelikli</h3>
              <p className="text-sm text-zinc-500">E-posta veya telefon gerekmez</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-800/50">
            <div className="h-10 w-10 rounded-full bg-emerald-600/20 flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-medium text-zinc-100">Her Yerde</h3>
              <p className="text-sm text-zinc-500">Web, mobil ve masaüstü desteği</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-8 space-y-3 safe-area-bottom">
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
  )
}
