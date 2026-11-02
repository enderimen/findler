# Flip Master — Yol Haritası

Konuşulan ve ileride eklenecek özellikler. Sıralama önerilen öncelik sırasıdır.

## 1. Şimdi (hesap sistemi gerektirmeyenler)

- [ ] **Tema altyapısı** — kart arkası deseni/rengi, masa teması, renk seçimi.
      Ev sahibinin (👑) teması odadaki herkese uygulanır (bilardo oyunlarındaki masa/istaka mantığı).
- [ ] **Kart desenleri ve renk çeşitleri** — temaya bağlı birden fazla kart arkası.
- [x] **Seviyeye göre arka plan rengi** — `body` arka planı, mevcut desenle aynı şekilde
      `radial-gradient(at center, <renk>, #010101)`. Zorluk arttıkça renk "ısınır";
      seviye bir oda ayarı olduğu için odadaki herkes aynı rengi görür.
      Paneller (davet, onay, mobil menü) de masa renginin koyu tonunu kullanır.
- [x] **Seviyeye göre kart arkası** — masa renginden parlak bir zemin, seviyeye özel CSS deseni
      (çizgi / zikzak / puantiye / dama / kafes) ve ortada `base-logo.svg` (`cardThemes.ts`).
      Ana sayfa yelpazesi ve lobi ikonu marka rengi olan turuncu kartta kaldı.

      | Seviye (kart) | Renk | |
      |---|---|---|
      | 3 – 5 | `#2D6607` | yeşil (mevcut, varsayılan) |
      | 7 – 9 | `#075b66` | petrol mavisi |
      | 12 | `#120766` | lacivert |
      | 15 | `#660746` | mürdüm |
      | 20 | `#660707` | koyu kırmızı |

      - Lobide, kurucu seviye seçtikçe arka plan yumuşak bir geçişle değişir; oyun dışındaki sayfalar yeşil kalır.
      - İleride tema sistemi gelince, ev sahibinin seçtiği masa teması bu rengi geçersiz kılabilir.
      - Aynı renk paleti liglerde de kullanılabilir (Bronz → yeşil … Usta → kırmızı).
- [ ] **Rövanş butonu** — sonuç ekranında aynı oyuncularla anında yeni oyun.
- [ ] **Botlar** — oda belirli sürede dolmazsa "hafızası bazen yanılan" bot katılır; boş lobi sorununu çözer.
- [ ] **Günlük meydan okuma** — herkese aynı dizilimle tek kişilik oyun, günün en hızlısı listesi.
- [ ] **Tek kişilik rekorlar** — her seviye için en iyi süre / en az hata, "Yeni rekor!" animasyonu.
- [ ] **Telefonda kurucu devri** — avatara dokununca menü (şu an "Kurucu Yap" sadece masaüstünde).
- [ ] **PWA** — "Ana Ekrana Ekle" ile uygulama gibi açılma (manifest + service worker).

- [x] **Oyun içi tepkiler** — ❤️ 👏 🧠 🎉 🔥 😮 ve hazır mesajlar; ekranın alt ortasından yükselip kaybolur.
- [x] **Sonucu paylaşma** — kazanan için 1080x1080 sonuç görseli + rekabetçi davet metni (telefonun paylaşım menüsü / X, Facebook, WhatsApp).
- [x] **Çevrimiçi oyuncular ve davet** — adını giren herkes listede görünür (Müsait / Odada / Oyunda); lobideki oyuncu müsait olanları davet eder, karşı taraf Katıl / Reddet.

## 2. Oyuncu gelmeye başlayınca (hesap + veritabanı gerekir)

- [ ] **Hesaplar** — misafir olarak hemen oyna, istersen Google/Apple ile kalıcı hesaba bağla (Supabase Auth).
      Şu an skor tablosu isme göre tutuluyor; başkasının ismiyle girilebiliyor.
- [ ] **Puan sistemi (ELO)** — güçlü rakibi yenmek daha çok puan kazandırır.
- [ ] **Açık oda listesi** — boş sunuculara girer gibi bekleyen odaları görüp katılma, seviyeye göre eşleştirme.
      (Temeli var: "Hemen Oyna" bekleyen açık odaya katıyor.)
- [ ] **İstatistik kartı** — en hızlı bitiriş, en uzun seri vb.; paylaşılabilir görsel.

## 3. Topluluk oluşunca

- [ ] **Ligler** — Bronz / Gümüş / Altın / Usta; her ligin kendi masası ve kart sayısı.
- [ ] **Sezonlar** — ay sonu sıfırlama, ilk 100'e özel rozet.
- [ ] **Turnuvalar** — kazananların birbiriyle yarıştığı eleme ağacı.
- [ ] **Takım oyunu** — her oyuncu belirli bir aralıktan sorumlu (ör. 1–10, 11–20), daha fazla kart.
      Kart boyutlandırma 20+ kart için hazır.
- [ ] **Satın alınabilir temalar** — lige göre kazanılan desenler + satın alınanlar.

## Gelir modeli (konuşulanlar)

- Web oyun portalları (CrazyGames, Poki) — trafik + reklam gelir paylaşımı.
- Ödüllü reklam sadece tek kişilik modda (çok oyunculuda avantaj vermek adaleti bozar).
- Görsel satın alımlar (avantaj vermeyen), "Flip Master Plus" tek seferlik premium.
- Eğitim (harf modu, çocuklar) ve kurumsal/markalı sürümler.

## Yayına alma (konuşulanlar)

- Arayüz: Vercel. Oyun sunucusu Vercel'de çalışmaz (kalıcı WebSocket + hafızada oda durumu);
  Railway / Render / Fly.io / VPS gibi sürekli çalışan bir sunucu gerekir.
- Gerekenler: `VITE_SERVER_URL`, sunucuda `CLIENT_ORIGIN`, `vercel.json` (SPA yönlendirmesi, davet linkleri için),
  skor tablosunu kalıcı yere taşıma (Supabase veya kalıcı disk).
- https ile yayına çıkınca telefonun yerel "Paylaş" menüsü de çalışır.

## Mobil uygulama (konuşulanlar)

- Önce PWA; mağaza istenirse React Native + Expo (mevcut TS tipleri, socket servisi, Redux ve hook'lar paylaşılır).
- Expo Go ile Xcode kurmadan gerçek telefonda test edilebilir; mağaza derlemesi EAS Build ile.
- [ ] **Ekran görüntüsü / kayıt uyarısı (sadece mobil uygulama)** — `expo-screen-capture` ile algılanır
      (iOS: ekran görüntüsü + ekran kaydı; Android 14+: ekran görüntüsü), sunucu odadaki herkese
      "X ekran görüntüsü aldı" uyarısı gönderir. Android'de istenirse tamamen engellenebilir.
      Web'de güvenilir bir yolu yok (tarayıcı API'si yok, kısayollar sayfaya ulaşmıyor);
      yanlış suçlama riski yüzünden web'de yapılmayacak.
- [ ] **Açık kalma süresini kısaltma (web için dolaylı önlem)** — yanlış açılan kart şu an 1.2 sn görünüyor;
      zor seviyelerde/liglerde kısaltılabilir, ekran görüntüsüyle hafızayı atlatmak zorlaşır.
