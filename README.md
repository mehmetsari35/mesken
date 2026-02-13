# MESKEN — Özel alanın.

Telegram benzeri, gizlilik odaklı, davetiye ile katılımlı mesajlaşma uygulaması.

## Özellikler

- **Davetiye Sistemi**: Sadece davet edilenler katılabilir
- **Gizlilik Öncelikli**: E-posta veya telefon gerekmez, sadece kullanıcı adı + şifre
- **1:1 Sohbetler**: Birebir mesajlaşma
- **Grup Sohbetleri**: Grup oluşturma ve davet kodları ile katılım
- **Sesli Mesajlar**: Sesli mesaj kaydetme ve gönderme (max 60 saniye)
- **Gerçek Zamanlı**: Anlık mesaj güncellemeleri
- **PWA Desteği**: Uygulama olarak yüklenebilir (iOS, Android, Desktop)
- **Rol Yönetimi**: Grup içi owner/admin/member rolleri

## Teknolojiler

- **Frontend**: Next.js 15 (TypeScript, App Router)
- **Styling**: Tailwind CSS 4
- **State**: Zustand
- **Backend**: Supabase (Auth, Database, Realtime, Storage)
- **Deployment**: Vercel

## Kurulum

### 1. Supabase Projesi Oluşturma

1. [supabase.com](https://supabase.com) adresine gidin
2. Yeni bir proje oluşturun
3. SQL Editor'a gidin
4. `supabase/schema.sql` dosyasının içeriğini yapıştırın ve çalıştırın

### 2. Supabase Auth Ayarları

1. Authentication > Providers > Email sekmesine gidin
2. "Confirm email" seçeneğini **kapatın**
3. "Secure email change" seçeneğini **kapatın**

### 3. Supabase Storage Ayarları

1. Storage sekmesine gidin
2. "voice" adında yeni bir bucket oluşturun:
   - Public: **Kapalı**
   - Allowed MIME types: `audio/webm, audio/ogg, audio/mp4, audio/mpeg`
   - Max file size: `5MB`

3. Bucket policies ekleyin:
   ```sql
   -- Upload policy
   CREATE POLICY "Users can upload voice messages"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'voice' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );

   -- Read policy
   CREATE POLICY "Users can read voice messages in their conversations"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'voice');
   ```

### 4. Ortam Değişkenleri

`.env.local` dosyası oluşturun:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Uygulama Başlatma

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

### 6. İlk Kullanıcı Oluşturma

İlk kullanıcıyı oluşturmak için Supabase SQL Editor'da bir davet kodu oluşturun:

```sql
INSERT INTO public.invites (code, max_uses, expires_at)
VALUES ('ILKDAVET', 10, NOW() + INTERVAL '30 days');
```

Ardından `/invite` sayfasına gidin ve `ILKDAVET` kodunu kullanarak kayıt olun.

## Vercel'e Deploy

1. GitHub'a push yapın:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/mesken.git
   git push -u origin main
   ```

2. [vercel.com](https://vercel.com) adresine gidin
3. GitHub reposunu bağlayın
4. Environment variables ekleyin:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (örn: `https://mesken.vercel.app`)
5. Deploy edin

## PWA İconları

Gerçek uygulama iconları için `/public/icons/` dizinine aşağıdaki boyutlarda PNG dosyaları ekleyin:
- icon-72.png, icon-96.png, icon-128.png, icon-144.png
- icon-152.png, icon-192.png, icon-384.png, icon-512.png

SVG'den PNG oluşturmak için: [realfavicongenerator.net](https://realfavicongenerator.net)

## MVP Checklist

- [x] Kullanıcı adı + şifre ile kayıt/giriş
- [x] Davetiye sistemi
- [x] 1:1 sohbetler
- [x] Grup sohbetleri
- [x] Gerçek zamanlı mesajlaşma
- [x] Sesli mesajlar
- [x] Rol yönetimi (owner/admin/member)
- [x] PWA desteği
- [x] RLS güvenlik politikaları

## Gelecek Özellikler (V2)

- [ ] WebRTC ile sesli/görüntülü arama
- [ ] QR kod ile giriş
- [ ] Kaybolan mesajlar
- [ ] Ekran görüntüsü uyarısı
- [ ] Çoklu cihaz desteği
- [ ] Mesaj arama
- [ ] Medya paylaşımı (resim, video)
- [ ] Mesaj reaksiyonları
- [ ] Typing indicators
- [ ] Online durum göstergesi

## Güvenlik Notları

- Tüm tablolarda Row Level Security (RLS) aktif
- Kullanıcılar sadece üyesi oldukları sohbetleri görebilir
- Sesli mesajlar signed URL ile korunuyor
- Davet kodları atomic transaction ile tüketiliyor
- Brute force koruması için Supabase rate limiting kullanılıyor

## Lisans

MIT

---

**MESKEN** — Özel alanın.
