# 🚀 KURYE PANELI - ONE COMMAND DEPLOY

## NEDİR?

Bu 3 komut ve bitti. GitHub → Vercel'e otomatik deploy!

---

## ADIM 1: Supabase'i Kur (5 dakika)

```bash
# 1. supabase.com → Sign Up
# 2. Create Project → Frankfurt region seç
# 3. SQL Editor → New Query → Tümünü kopyala:
```

```sql
-- DOSYA: sema.sql içeriğini buraya yapıştır
-- Tamamen kopyala ve Run'a tıkla
```

✅ Başarılı mesajını gördükten sonra devam et.

---

## ADIM 2: Credentials Al (2 dakika)

Supabase'de:
```
Project Settings → API
```

Kopyala:
- `NEXT_PUBLIC_SUPABASE_URL` → `https://xxxxx.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `eyJ...`

---

## ADIM 3: Admin User Oluştur (2 dakika)

Supabase'de:
```
Authentication → Users → Add user
- Email: admin@yourdomain.com
- Password: Güçlü bir şifre
- ✅ Auto Confirm User (işaretle)
- Create user
```

Sonra SQL Editor'de:
```sql
insert into profiller (id, ad, rol)
values ('KOPYALADIGIN_USER_ID', 'Your Name', 'yonetici');
```

✅ Admin oluşturuldu.

---

## ADIM 4: GitHub'a Push Et (1 dakika)

```bash
# Eğer henüz yapmadıysan:
cd /Users/berkebarantozkoparan/Downloads/files-4/kurye-paneli

# Sonra çalıştır:
bash setup.sh 'https://xxxxx.supabase.co' 'eyJ...' 'https://github.com/YourUsername/kurye-paneli.git'
```

**VEYA Manuel:**
```bash
git remote add origin https://github.com/YourUsername/kurye-paneli.git
git push -u origin main
```

✅ GitHub'da görünsün.

---

## ADIM 5: Vercel'e Deploy Et (2 dakika)

1. **vercel.com** → Sign Up/Login
2. **Add New** → **Project**
3. **GitHub**'dan repository seç
4. **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://xxxxx.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJ...`
5. **Deploy** butonuna tıkla
6. **3-5 dakika bekle** ⏳

✅ **BITTI!** 🎉

---

## SONUÇ

Artık live uygulamanız var:
```
https://your-app.vercel.app
https://your-app.vercel.app/giris (Login sayfası)
```

---

## TOPLAM SÜRE: ~15 DAKIKA ⚡

| Adım | Süre |
|------|------|
| Supabase Setup | 5 min |
| Database Schema | 1 min |
| Credentials | 2 min |
| Admin User | 2 min |
| GitHub Push | 1 min |
| Vercel Deploy | 5 min |
| **TOPLAM** | **~15 min** |

---

## HELP

**Hata alırsan:**
- SUPABASE_URL doğru mu?
- ANON_KEY doğru mu?
- sema.sql çalıştırıldı mı?
- Admin profile oluşturuldu mu?

Kontrol et → Tekrar dene!

---

## HEMEN BAŞLA! 🚀

Yukarıdaki 5 adımı takip et. O kadar!
