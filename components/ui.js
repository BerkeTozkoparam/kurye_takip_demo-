"use client";

import { DURUM } from "@/lib/sabitler";

export function Etiket({ durum }) {
  const d = DURUM[durum];
  return (
    <span className="rozet" style={{ background: d.bg, color: d.fg }}>
      {d.etiket}
    </span>
  );
}

/** Alis noktasi -> teslim noktasi. Arayuzun tekrar eden omurgasi. */
export function Rota({ dukkan, adres, musteri }) {
  return (
    <div className="rota">
      <div className="rota-sap" aria-hidden="true">
        <span className="nokta nokta-alis" />
        <span className="cizgi" />
        <span className="nokta nokta-teslim" />
      </div>
      <div className="rota-metin">
        <div className="rota-satir">
          <div className="rota-baslik">{dukkan?.ad || "Dükkan bulunamadı"}</div>
          <div className="rota-alt">{dukkan?.adres}</div>
        </div>
        <div className="rota-satir">
          <div className="rota-baslik">{musteri}</div>
          <div className="rota-alt">{adres}</div>
        </div>
      </div>
    </div>
  );
}

export function Bos({ baslik, aciklama }) {
  return (
    <div className="bos">
      <div className="bos-baslik">{baslik}</div>
      <p>{aciklama}</p>
    </div>
  );
}

export function Alan({ etiket, ...p }) {
  return (
    <label className="alan">
      <span>{etiket}</span>
      <input {...p} />
    </label>
  );
}

export function Sekmeler({ ogeler, aktif, setAktif }) {
  return (
    <nav className="sekmeler">
      {ogeler.map(([k, e]) => (
        <button key={k} className={aktif === k ? "acik" : ""} onClick={() => setAktif(k)}>
          {e}
        </button>
      ))}
    </nav>
  );
}

export function UstBar({ baslik, kisi, cikis }) {
  return (
    <header className="ust">
      <div className="ust-ic">
        <div className="marka">
          <span className="marka-isaret" />
          <span>{baslik}</span>
        </div>
        <button className="rol-cip" onClick={cikis}>
          {kisi}
          <span>çıkış</span>
        </button>
      </div>
    </header>
  );
}
