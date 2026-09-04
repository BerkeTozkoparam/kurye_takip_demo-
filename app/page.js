"use client";

export default function Test() {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>🧪 Kurye Paneli - Test Sayfası</h1>
      
      <div style={{ background: "#f0f0f0", padding: "1rem", margin: "1rem 0" }}>
        <h2>Ortam Değişkenleri:</h2>
        <p><strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || "❌ YÜKLENMEDİ"}</p>
        <p><strong>Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ YÜKLENDİ" : "❌ YÜKLENMEDİ"}</p>
      </div>

      <div style={{ margin: "2rem 0" }}>
        <a href="/giris" style={{
          display: "inline-block",
          padding: "1rem 2rem",
          background: "#2563eb",
          color: "white",
          textDecoration: "none",
          borderRadius: "6px",
          fontSize: "1.1rem"
        }}>
          🔐 Login Sayfasına Git
        </a>
      </div>

      <p style={{ color: "#666", fontSize: "0.9rem" }}>
        App yükleniyor... Eğer hala yukarıda "Panel açılıyor..." yazıyorsa, 
        Supabase bağlantısında sorun var.
      </p>
    </div>
  );
}
