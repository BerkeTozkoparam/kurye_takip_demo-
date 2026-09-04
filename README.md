# Kurye Paneli

Dükkanların sipariş girdiği, kuryelerin paketleri üstlenip teslim ettiği,
yöneticinin gün boyu takip ettiği panel.

Next.js 14 (App Router) + Supabase (Postgres, Auth, Realtime).
Her ikisinin de ücretsiz katmanında çalışır.

---

## Kurulum

### 1. Supabase projesi

1. supabase.com > New project. Bölge olarak Frankfurt seçin (Türkiye'ye en yakını).
2. Veritabanı şifresini bir yere not edin.
3. SQL Editor > New query > `sema.sql` dosyasının tamamını yapıştırın > Run.
4. Project Settings > API sayfasından `Project URL` ve `anon public` anahtarını kopyalayın.

### 2. İlk yönetici hesabı

E-posta gönderimine bağımlı kalmamak için hesapları panelden siz açın:

1. Authentication > Users > Add user. E-posta ve şifre girin,
   "Auto Confirm User" işaretli olsun.
2. Oluşan kullanıcının ID'sini kopyalayın.
3. SQL Editor'de çalıştırın:

```sql
insert into profiller (id, ad, rol)
values ('KOPYALADIGINIZ-ID', 'Berke', 'yonetici');
```

Bundan sonra dükkanları ve davetleri panel içinden yönetirsiniz.
Yeni bir dükkan sahibi eklerken: önce panelden davet kaydını girin,
sonra Authentication > Add user ile aynı e-postaya hesap açın.
Şifreyi kendisine iletin; kayıt anında rolü ve dükkanı otomatik bağlanır.

### 3. Yerelde çalıştırma

```bash
npm install
cp .env.example .env.local     # icini Supabase bilgileriyle doldurun
npm run dev
```

http://localhost:3000

### 4. Vercel'e alma

```bash
git init && git add -A && git commit -m "ilk surum"
gh repo create kurye-paneli --private --source=. --push
```

vercel.com > Add New > Project > deponuzu seçin. Environment Variables kısmına
`NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` ekleyin > Deploy.

---

## Bilinmesi gerekenler

- **anon anahtarı gizli değildir**, tarayıcıya gider. Güvenlik veritabanındaki
  RLS kurallarından gelir. `service_role` anahtarını hiçbir yerde kullanmayın.
- **Ücretsiz Supabase projesi** bir hafta hiç istek almazsa uykuya geçer.
  Günlük kullanılan bir işte bu tetiklenmez.
- **Telefonda uygulama gibi durması için**: kurye siteyi açıp tarayıcı
  menüsünden "Ana ekrana ekle" desin. Ayrı uygulama yazmaya gerek yok.
- **Canlı konum** için tablo sütunları hazır (`kuryeler.son_lat/son_lng`).
  Eklerken kuryenin ekranında periyodik `navigator.geolocation` çağrısı ve
  yönetici tarafında bir harita bileşeni gerekecek.

## Dosya düzeni

```
app/giris      giris ekrani
app/dukkan     siparis girisi ve dukkanin kendi listesi
app/kurye      acik havuz, uzerindekiler, bugun teslim ettikleri
app/yonetici   canli takip, dukkan/davet kayitlari, gun ozeti
lib/           supabase baglantisi ve ortak yardimcilar
components/    ortak arayuz parcalari
sema.sql       veritabani semasi (bir kez calistirilir)
```
