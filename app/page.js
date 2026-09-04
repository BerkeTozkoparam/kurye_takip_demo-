"use client";

export default function Home() {
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      flexDirection: "column",
      fontFamily: "sans-serif",
      backgroundColor: "#f0f0f0"
    }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🚚 Kurye Paneli</h1>
        
        <div style={{
          background: "white",
          padding: "2rem",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <p style={{ fontSize: "1.1rem", marginBottom: "2rem", color: "#666" }}>
            Hoşgeldiniz!
          </p>
          
          <a href="/giris" style={{
            display: "inline-block",
            padding: "1rem 2rem",
            background: "#2563eb",
            color: "white",
            textDecoration: "none",
            borderRadius: "6px",
            fontSize: "1.1rem",
            fontWeight: "500"
          }}>
            🔐 Giriş Yap
          </a>
        </div>
      </div>
    </div>
  );
}
