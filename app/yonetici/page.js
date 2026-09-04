"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase";
import { DURUM, ODEME, bugunMu, gecen, saat } from "@/lib/sabitler";
import { Alan, Bos, Etiket, Rota, Sekmeler, UstBar } from "@/components/ui";

export default function YoneticiPaneli() {
  const router = useRouter();
  const [profil, setProfil] = useState(null);
  const [siparisler, setSiparisler] = useState([]);
  const [dukkanlar, setDukkanlar] = useState([]);
  const [kuryeler, setKuryeler] = useState([]);
  const [sekme, setSekme] = useState("takip");
  const [hata, setHata] = useState("");
  const [hazir, setHazir] = useState(false);

  const yukle = useCallback(async () => {
    const [s, d, k] = await Promise.all([
      sb().from("siparisler").select("*").order("olusturuldu", { ascending: false }).limit(300),
      sb().from("dukkanlar").select("*").order("ad"),
      sb().from("kuryeler").select("*, profiller(ad, telefon)"),
    ]);
    setSiparisler(s.data || []);
    setDukkanlar(d.data || []);
    setKuryeler(k.data || []);
  }, []);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await sb().auth.getUser();
      if (!user) return router.replace("/giris");
      const { data: p } = await sb().from("profiller").select("*").eq("id", user.id).maybeSingle();
      if (!p || p.rol !== "yonetici") return router.replace("/");
      setProfil(p);
      await yukle();
      setHazir(true);

      const kanal = sb()
        .channel("yonetici-siparisleri")
        .on("postgres_changes", { event: "*", schema: "public", table: "siparisler" }, yukle)
        .subscribe();
      return () => sb().removeChannel(kanal);
    })();
  }, [router, yukle]);

  if (!hazir) return <div className="yukleniyor">Yükleniyor…</div>;

  const dk = (id) => dukkanlar.find((d) => d.id === id);
  const ky = (id) => kuryeler.find((k) => k.id === id);
  const acik = siparisler.filter((s) => s.durum !== "teslim" && s.durum !== "iptal");
  const bugunku = siparisler.filter((s) => bugunMu(s.olusturuldu));
  const teslimler = bugunku.filter((s) => s.durum === "teslim");
  const ortalama = teslimler.length
    ? Math.round(
        teslimler.reduce(
          (t, s) => t + (new Date(s.teslim_at) - new Date(s.olusturuldu)),
          0
        ) / teslimler.length / 60000
      )
    : 0;

  const iptal = async (id) => {
    await sb().from("siparisler").update({ durum: "iptal" }).eq("id", id);
    yukle();
  };

  return (
    <>
      <UstBar
        baslik="Yönetici"
        kisi={profil.ad}
        cikis={async () => {
          await sb().auth.signOut();
          router.replace("/giris");
        }}
      />
      <main className="govde">
        {hata && <div className="uyari">{hata}</div>}
        <Sekmeler
          aktif={sekme}
          setAktif={setSekme}
          ogeler={[
            ["takip", "Canlı takip"],
            ["kayit", "Dükkan ve kurye"],
            ["ozet", "Gün özeti"],
          ]}
        />

        {sekme === "takip" && (
          <div className="liste">
            <div className="kurye-serit">
              {kuryeler.length === 0 && <div className="ipucu">Kayıtlı kurye yok.</div>}
              {kuryeler.map((k) => {
                const isi = acik.find((s) => s.kurye_id === k.id);
                return (
                  <div className="kurye-kart" key={k.id}>
                    <div className="kurye-ad">
                      <span className={`lamba ${isi ? "mesgul" : "musait"}`} />
                      {k.profiller?.ad}
                    </div>
                    <div className="kurye-alt">
                      {isi ? `${isi.kod} · ${DURUM[isi.durum].etiket}` : "Boşta"}
                    </div>
                    <div className="kurye-alt">{k.arac || k.plaka || ""}</div>
                  </div>
                );
              })}
            </div>

            {acik.length === 0 ? (
              <Bos
                baslik="Yolda paket yok"
                aciklama="Açık siparişler ve kuryelerin adımları burada sıralanır."
              />
            ) : (
              acik.map((s) => (
                <div className="kart siparis" key={s.id} style={{ "--durum": DURUM[s.durum].bg }}>
                  <div className="siparis-ust">
                    <span className="kod">{s.kod}</span>
                    <Etiket durum={s.durum} />
                    <span className="zaman">{gecen(s.olusturuldu)} açıldı</span>
                  </div>
                  <Rota dukkan={dk(s.dukkan_id)} adres={s.adres} musteri={s.musteri_ad} />
                  <div className="adimlar">
                    <span>Açıldı {saat(s.olusturuldu)}</span>
                    <span>Üstlenildi {saat(s.atandi_at)}</span>
                    <span>Alındı {saat(s.alindi_at)}</span>
                  </div>
                  <div className="satir-bilgi">
                    <span>
                      {s.kurye_id ? `Kurye: ${ky(s.kurye_id)?.profiller?.ad}` : "Kurye atanmadı"}
                    </span>
                    <span>
                      {s.tutar > 0 ? `${s.tutar} ₺ · ${ODEME[s.odeme]}` : ODEME[s.odeme]}
                    </span>
                  </div>
                  <button className="btn btn-sessiz" onClick={() => iptal(s.id)}>
                    Siparişi iptal et
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {sekme === "kayit" && <Kayitlar dukkanlar={dukkanlar} kuryeler={kuryeler} yenile={yukle} />}

        {sekme === "ozet" && (
          <div className="liste">
            <div className="kart ozet-kart">
              <div>
                <span>{bugunku.length}</span>
                <p>bugün açılan</p>
              </div>
              <div>
                <span>{teslimler.length}</span>
                <p>teslim edilen</p>
              </div>
              <div>
                <span>{ortalama || "—"}</span>
                <p>ortalama dakika</p>
              </div>
            </div>

            <div className="kart form-kart">
              <h2>Kurye başına</h2>
              <div className="mini-liste">
                {kuryeler.map((k) => {
                  const t = teslimler.filter((s) => s.kurye_id === k.id);
                  return (
                    <div key={k.id}>
                      <div>
                        <b>{k.profiller?.ad}</b>
                        <span>{t.length} teslimat</span>
                      </div>
                      <span className="tutar">
                        {t.reduce((a, s) => a + Number(s.tutar || 0), 0)} ₺
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="kart form-kart">
              <h2>Dükkan başına</h2>
              <div className="mini-liste">
                {dukkanlar.map((d) => {
                  const t = bugunku.filter((s) => s.dukkan_id === d.id);
                  return (
                    <div key={d.id}>
                      <div>
                        <b>{d.ad}</b>
                        <span>{t.length} sipariş</span>
                      </div>
                      <span className="tutar">
                        {t.filter((s) => s.durum === "teslim").length} teslim
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function Kayitlar({ dukkanlar, kuryeler, yenile }) {
  const [d, setD] = useState({ ad: "", adres: "", telefon: "" });
  const [davet, setDavet] = useState({ eposta: "", ad: "", rol: "dukkan", dukkan_id: "" });
  const [mesaj, setMesaj] = useState("");

  const dukkanEkle = async () => {
    if (!d.ad.trim() || !d.adres.trim()) {
      setMesaj("Dükkan adı ve adres gerekli.");
      return;
    }
    const { error } = await sb().from("dukkanlar").insert(d);
    setMesaj(error ? "Kaydedilemedi." : `${d.ad} eklendi.`);
    if (!error) setD({ ad: "", adres: "", telefon: "" });
    yenile();
  };

  const davetEkle = async () => {
    if (!davet.eposta.trim() || !davet.ad.trim()) {
      setMesaj("E-posta ve ad gerekli.");
      return;
    }
    const { error } = await sb().from("davetler").insert({
      eposta: davet.eposta.trim().toLowerCase(),
      ad: davet.ad.trim(),
      rol: davet.rol,
      dukkan_id: davet.rol === "dukkan" ? davet.dukkan_id || null : null,
    });
    setMesaj(
      error
        ? "Kaydedilemedi. Bu e-posta zaten davet edilmiş olabilir."
        : "Davet kaydedildi. Kişi bu e-postayla kayıt olunca hesabı hazır olacak."
    );
    if (!error) setDavet({ eposta: "", ad: "", rol: "dukkan", dukkan_id: "" });
  };

  return (
    <div className="liste">
      <div className="kart form-kart">
        <h2>Dükkan ekle</h2>
        <Alan etiket="Dükkan adı" value={d.ad} onChange={(e) => setD({ ...d, ad: e.target.value })} />
        <Alan etiket="Adres" value={d.adres} onChange={(e) => setD({ ...d, adres: e.target.value })} />
        <Alan etiket="Telefon" value={d.telefon} onChange={(e) => setD({ ...d, telefon: e.target.value })} inputMode="tel" />
        <button className="btn" onClick={dukkanEkle}>Dükkanı kaydet</button>
        <div className="mini-liste">
          {dukkanlar.map((o) => (
            <div key={o.id}>
              <div>
                <b>{o.ad}</b>
                <span>{o.adres}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="kart form-kart">
        <h2>Hesap daveti</h2>
        <p className="ipucu">
          Kişi bu e-postayla kayıt olduğunda rolü ve dükkan bağı otomatik kurulur.
        </p>
        <Alan etiket="E-posta" value={davet.eposta} onChange={(e) => setDavet({ ...davet, eposta: e.target.value })} type="email" />
        <Alan etiket="Ad soyad" value={davet.ad} onChange={(e) => setDavet({ ...davet, ad: e.target.value })} />
        <div className="ikili">
          <label className="alan">
            <span>Rol</span>
            <select value={davet.rol} onChange={(e) => setDavet({ ...davet, rol: e.target.value })}>
              <option value="dukkan">Dükkan</option>
              <option value="kurye">Kurye</option>
              <option value="yonetici">Yönetici</option>
            </select>
          </label>
          {davet.rol === "dukkan" && (
            <label className="alan">
              <span>Hangi dükkan</span>
              <select
                value={davet.dukkan_id}
                onChange={(e) => setDavet({ ...davet, dukkan_id: e.target.value })}
              >
                <option value="">Seçin</option>
                {dukkanlar.map((o) => (
                  <option key={o.id} value={o.id}>{o.ad}</option>
                ))}
              </select>
            </label>
          )}
        </div>
        <button className="btn" onClick={davetEkle}>Daveti kaydet</button>
        {mesaj && <div className="ipucu">{mesaj}</div>}
      </div>

      <div className="kart form-kart">
        <h2>Kuryeler</h2>
        <div className="mini-liste">
          {kuryeler.length === 0 && <div className="ipucu">Henüz kurye kaydı yok.</div>}
          {kuryeler.map((k) => (
            <div key={k.id}>
              <div>
                <b>{k.profiller?.ad}</b>
                <span>{k.arac || k.profiller?.telefon || "—"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
