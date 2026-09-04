"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Giris() {
  const router = useRouter();
  const [eposta, setEposta] = useState("admin@kuryepaneli.com");
  const [sifre, setSifre] = useState("KuryePaneli@2024!");
  const [hata, setHata] = useState("");
  const [bekliyor, setBekliyor] = useState(false);

  const girisYap = async (e) => {
    e.preventDefault();
    setHata("");
    setBekliyor(true);

    try {
      // Test: Supabase'e direkt POST yap
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            email: eposta,
            password: sifre,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        setHata("E-posta veya şifre hatalı. " + (data.error_description || ""));
        setBekliyor(false);
        return;
      }

      // Başarılı - localStorage'da token kaydet
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_id", data.user.id);

      // Dashboard'a yönlendir
      router.replace("/");
    } catch (err) {
      setHata("Bağlantı hatası: " + err.message);
      setBekliyor(false);
    }
  };

  return (
    <div className="giris-sayfa">
      <h1>Kurye Paneli</h1>
      <p className="alt">Hesabınızla giriş yapın.</p>

      <form className="form-kart" onSubmit={girisYap}>
        <label className="alan">
          <span>E-posta</span>
          <input
            type="email"
            value={eposta}
            onChange={(e) => setEposta(e.target.value)}
            required
          />
        </label>
        <label className="alan">
          <span>Şifre</span>
          <input
            type="password"
            value={sifre}
            onChange={(e) => setSifre(e.target.value)}
            required
          />
        </label>
        <button className="btn btn-hivis" disabled={bekliyor}>
          {bekliyor ? "Giriş yapılıyor…" : "Giriş yap"}
        </button>
        {hata && <div className="uyari">{hata}</div>}
      </form>
    </div>
  );
}
