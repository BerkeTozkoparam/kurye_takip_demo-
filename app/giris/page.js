"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase";

export default function Giris() {
  const router = useRouter();
  const [eposta, setEposta] = useState("");
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState("");
  const [bekliyor, setBekliyor] = useState(false);

  const girisYap = async (e) => {
    e.preventDefault();
    setHata("");
    setBekliyor(true);
    const { error } = await sb().auth.signInWithPassword({ email: eposta, password: sifre });
    setBekliyor(false);
    if (error) {
      setHata("E-posta veya şifre hatalı. Tekrar deneyin.");
      return;
    }
    router.replace("/");
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
            autoComplete="username"
            required
          />
        </label>
        <label className="alan">
          <span>Şifre</span>
          <input
            type="password"
            value={sifre}
            onChange={(e) => setSifre(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <button className="btn btn-hivis" disabled={bekliyor}>
          {bekliyor ? "Giriş yapılıyor…" : "Giriş yap"}
        </button>
        {hata && <div className="uyari">{hata}</div>}
        <p className="ipucu">
          Hesabınız yoksa işletme yöneticisi sizin için açar. Şifrenizi unuttuysanız ona haber verin.
        </p>
      </form>
    </div>
  );
}
