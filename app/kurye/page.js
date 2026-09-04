"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase";
import { DURUM, ODEME, bugunMu, gecen, saat, sure, yolTarifi } from "@/lib/sabitler";
import { Bos, Etiket, Rota, Sekmeler, UstBar } from "@/components/ui";

export default function KuryePaneli() {
  const router = useRouter();
  const [profil, setProfil] = useState(null);
  const [siparisler, setSiparisler] = useState([]);
  const [dukkanlar, setDukkanlar] = useState([]);
  const [sekme, setSekme] = useState("acik");
  const [hata, setHata] = useState("");
  const [hazir, setHazir] = useState(false);

  const yukle = useCallback(async () => {
    const [{ data: s }, { data: d }] = await Promise.all([
      sb().from("siparisler").select("*").order("olusturuldu", { ascending: false }).limit(200),
      sb().from("dukkanlar").select("*"),
    ]);
    setSiparisler(s || []);
    setDukkanlar(d || []);
  }, []);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await sb().auth.getUser();
      if (!user) return router.replace("/giris");

      const { data: p } = await sb().from("profiller").select("*").eq("id", user.id).maybeSingle();
      if (!p || p.rol !== "kurye") return router.replace("/");
      setProfil(p);
      await yukle();
      setHazir(true);

      const kanal = sb()
        .channel("kurye-siparisleri")
        .on("postgres_changes", { event: "*", schema: "public", table: "siparisler" }, yukle)
        .subscribe();
      return () => sb().removeChannel(kanal);
    })();
  }, [router, yukle]);

  const dk = (id) => dukkanlar.find((d) => d.id === id);

  const ustlen = async (id) => {
    setHata("");
    const { error } = await sb().rpc("siparis_ustlen", { p_siparis: id });
    if (error) setHata("Bu siparişi başka bir kurye aldı.");
    yukle();
  };

  const ilerlet = async (id, durum) => {
    const { error } = await sb().from("siparisler").update({ durum }).eq("id", id);
    if (error) setHata("Güncellenemedi. Bağlantınızı kontrol edin.");
    yukle();
  };

  if (!hazir) return <div className="yukleniyor">Yükleniyor…</div>;

  const acik = siparisler.filter((s) => s.durum === "bekliyor");
  const uzerimde = siparisler.filter(
    (s) => s.kurye_id === profil.id && (s.durum === "atandi" || s.durum === "alindi")
  );
  const bugun = siparisler.filter(
    (s) => s.kurye_id === profil.id && s.durum === "teslim" && bugunMu(s.teslim_at)
  );

  return (
    <>
      <UstBar
        baslik="Kurye Paneli"
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
            ["acik", `Açık (${acik.length})`],
            ["uzerimde", `Üzerimde (${uzerimde.length})`],
            ["bugun", `Bugün (${bugun.length})`],
          ]}
        />

        {sekme === "acik" && (
          <div className="liste">
            {acik.length === 0 ? (
              <Bos
                baslik="Şu an bekleyen paket yok"
                aciklama="Bir dükkan sipariş girdiğinde ekranınızda anında belirir."
              />
            ) : (
              acik.map((s) => (
                <div className="kart siparis" key={s.id} style={{ "--durum": DURUM.bekliyor.bg }}>
                  <div className="siparis-ust">
                    <span className="kod">{s.kod}</span>
                    <span className="zaman">{gecen(s.olusturuldu)} açıldı</span>
                  </div>
                  <Rota dukkan={dk(s.dukkan_id)} adres={s.adres} musteri={s.musteri_ad} />
                  {s.kurye_notu && <div className="not">{s.kurye_notu}</div>}
                  <div className="satir-bilgi">
                    <span>{ODEME[s.odeme]}</span>
                    <span>{s.tutar > 0 ? `${s.tutar} ₺` : "Tutar girilmedi"}</span>
                  </div>
                  <button className="btn btn-hivis" onClick={() => ustlen(s.id)}>
                    Bu paketi ben alıyorum
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {sekme === "uzerimde" && (
          <div className="liste">
            {uzerimde.length === 0 ? (
              <Bos
                baslik="Üzerinizde paket yok"
                aciklama="Açık sekmesinden bir sipariş üstlenin, adımlar burada görünsün."
              />
            ) : (
              uzerimde.map((s) => {
                const d = dk(s.dukkan_id);
                return (
                  <div className="kart siparis" key={s.id} style={{ "--durum": DURUM[s.durum].bg }}>
                    <div className="siparis-ust">
                      <span className="kod">{s.kod}</span>
                      <Etiket durum={s.durum} />
                    </div>
                    <Rota dukkan={d} adres={s.adres} musteri={s.musteri_ad} />
                    {s.kurye_notu && <div className="not">{s.kurye_notu}</div>}
                    <div className="satir-bilgi">
                      <span>{ODEME[s.odeme]}</span>
                      <span>{s.tutar > 0 ? `${s.tutar} ₺` : "Tutar girilmedi"}</span>
                    </div>
                    <div className="baglantilar">
                      <a
                        href={yolTarifi(
                          s.durum === "atandi" ? "" : d?.adres,
                          s.durum === "atandi" ? d?.adres : s.adres
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {s.durum === "atandi" ? "Dükkana yol tarifi" : "Müşteriye yol tarifi"}
                      </a>
                      {s.musteri_telefon && <a href={`tel:${s.musteri_telefon}`}>Müşteriyi ara</a>}
                      {d?.telefon && <a href={`tel:${d.telefon}`}>Dükkanı ara</a>}
                    </div>
                    {s.durum === "atandi" ? (
                      <button className="btn btn-hivis" onClick={() => ilerlet(s.id, "alindi")}>
                        Paketi dükkandan aldım
                      </button>
                    ) : (
                      <button className="btn btn-yesil" onClick={() => ilerlet(s.id, "teslim")}>
                        Müşteriye teslim ettim
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {sekme === "bugun" && (
          <div className="liste">
            {bugun.length === 0 ? (
              <Bos
                baslik="Bugün henüz teslimat yok"
                aciklama="Teslim ettiğiniz paketler gün sonuna kadar burada birikir."
              />
            ) : (
              <>
                <div className="kart ozet-kart">
                  <div>
                    <span>{bugun.length}</span>
                    <p>teslimat</p>
                  </div>
                  <div>
                    <span>{bugun.reduce((t, s) => t + Number(s.tutar || 0), 0)} ₺</span>
                    <p>tahsilat</p>
                  </div>
                </div>
                {bugun.map((s) => (
                  <div className="kart siparis" key={s.id} style={{ "--durum": DURUM.teslim.bg }}>
                    <div className="siparis-ust">
                      <span className="kod">{s.kod}</span>
                      <span className="zaman">{saat(s.teslim_at)}</span>
                    </div>
                    <Rota dukkan={dk(s.dukkan_id)} adres={s.adres} musteri={s.musteri_ad} />
                    <div className="satir-bilgi">
                      <span>Alıştan teslime {sure(s.alindi_at, s.teslim_at)}</span>
                      <span>{s.tutar > 0 ? `${s.tutar} ₺` : "—"}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </main>
    </>
  );
}
