#!/bin/bash

# Kurye Paneli - Complete Setup Script
# Usage: ./setup.sh <SUPABASE_URL> <SUPABASE_ANON_KEY> <GITHUB_REPO_URL>

set -e

echo "🚀 Kurye Paneli - Otomatik Kurulum Başladı"
echo "==========================================="

# Check arguments
if [ $# -lt 3 ]; then
    echo "❌ Eksik parametreler!"
    echo ""
    echo "Kullanım:"
    echo "  ./setup.sh <SUPABASE_URL> <SUPABASE_ANON_KEY> <GITHUB_REPO_URL>"
    echo ""
    echo "Örnek:"
    echo "  ./setup.sh 'https://xxxxx.supabase.co' 'eyJ...' 'https://github.com/kullanici/kurye-paneli.git'"
    exit 1
fi

SUPABASE_URL=$1
SUPABASE_KEY=$2
GITHUB_URL=$3

echo "✓ Parametreler alındı"

# 1. Create .env.local
echo ""
echo "📝 .env.local dosyası oluşturuluyor..."
cat > .env.local << ENVEOF
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_KEY
ENVEOF
echo "✓ .env.local oluşturuldu"

# 2. Configure git
echo ""
echo "🔧 Git yapılandırılıyor..."
git config --global user.name "Kurye Paneli" 2>/dev/null || true
git config user.name "Kurye Paneli"
git config user.email "kurye@paneli.local"
echo "✓ Git yapılandırıldı"

# 3. Add remote
echo ""
echo "🌐 GitHub remote ekleniyor..."
git remote remove origin 2>/dev/null || true
git remote add origin "$GITHUB_URL"
echo "✓ GitHub remote eklendi: $GITHUB_URL"

# 4. Test build
echo ""
echo "🏗️ Production build test ediliyor..."
npm run build > /dev/null 2>&1
echo "✓ Build başarılı!"

# 5. Push to GitHub
echo ""
echo "📤 GitHub'a push ediliyor..."
git push -u origin main --force 2>/dev/null || git push -u origin main
echo "✓ GitHub'a pushed!"

# 6. Show Vercel instructions
echo ""
echo "=========================================="
echo "✅ KURULUM TAMAMLANDI!"
echo "=========================================="
echo ""
echo "📊 Sonraki Adımlar:"
echo ""
echo "1️⃣  Supabase'e git ve sema.sql dosyasını çalıştır:"
echo "   SQL Editor > New Query > sema.sql'i kopyala > Run"
echo ""
echo "2️⃣  Supabase'de admin user oluştur:"
echo "   Authentication > Add user > Password ile > Auto Confirm"
echo ""
echo "3️⃣  Admin profile'ı oluştur (SQL):"
echo "   insert into profiller (id, ad, rol) values ('USER_ID', 'Name', 'yonetici');"
echo ""
echo "4️⃣  Vercel'e deploy et:"
echo "   1. vercel.com'a git"
echo "   2. Add New > Project"
echo "   3. GitHub repository seç"
echo "   4. Environment Variables ekle:"
echo "      - NEXT_PUBLIC_SUPABASE_URL"
echo "      - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   5. Deploy butonuna tıkla"
echo ""
echo "🎉 Bitti!"
