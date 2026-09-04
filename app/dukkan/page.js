"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase";
import { DURUM, ODEME, saat, sure } from "@/lib/sabitler";
import { Alan, Bos, Etiket, Rota, Sekmeler, UstBar } from "@/components/ui";

const BOS_FORM = { musteri: "", telefon: "", adres: "", not: "", tutar: "", odeme: "nakit" };

export default function DukkanPaneli() {
  const router = useRouter();
  const [profil, setProfil] = useState(null);
  const [dukkan, setDukkan] = useState(null);
  const [siparisler, setSiparisler] = useState([]);
  const [sekme, setSekme] = useState("yeni");
  const [form, setForm] = useState(BOS_FORM);
  const [mesaj, setMesaj] = useState("");
  const [hata, setHata] = useState("");
  const [hazir, setHazir] = useState(false);

  const yukle = useCallback(async (dukkanId) => {
    const { data } = await sb()
      .from("siparisler")
      .select("*")
      .eq("dukkan_id", dukkanId)
      .order("olusturuldu", { ascending: false })
      .limit(100);
    setSiparisler(data || []);
  }, []);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await sb().auth.getUser();
      if (!user) return router.replace("/giris");

      const { data: p } = await sb()
        .from("profiller")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (!p || p.rol !== "dukkan") return router.replace("/");
      setProfil(p);

      const { data: uyelik } = await sb()
        .from("dukkan_uyeleri")
        .select("dukkanlar(*)")
        .maybeSingle();
      if (!uyelik?.dukkanlar) {
        setHata("Hesabınız bir dükkana bağlı değil. Yöneticinizle görüşün.");
        setHazir(true);
        return;
      }
      setDukkan(uyelik.dukkanlar);
      await yukle(uyelik.dukkanlar.id);
      setHazir(true);

      const kanal = sb()
        .channel("dukkan-siparisleri")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "siparisler" },
          () => yukle(uyelik.dukkanlar.id)
        )
        .subscribe();
      return () => sb().removeChannel(kanal);
    })();
  }, [router, yukle]);

  const gonder = async () => {
    if (!form.musteri.trim() || !form.adres.trim()) {
      setMesaj("Müşteri adı ve adres olmadan sipariş açılamaz.");
      return;
    }
    const { error } = await sb().from("siparisler").insert({
      dukkan_id: dukkan.id,
      olusturan_id: profil.id,
      musteri_ad: form.musteri.trim(),
      musteri_telefon: form.telefon.trim(),
      adres: form.adres.trim(),
      kurye_notu: form.not.trim(),
      tutar: Number(form.tutar) || 0,
      odeme: form.odeme,
    });
    if (error) {
      setMesaj("Sipariş kaydedilemedi. İnternetinizi kontrol edip tekrar deneyin.");
      return;
    }
    setForm(BOS_FORM);
    setMesaj("Sipariş açıldı. Kuryeler listede görüyor.");
    setSekme("liste");
    yukle(dukkan.id);
  };

  const iptal = async (id) => {
    await sb().from("siparisler").update({ durum: "iptal" }).eq("id", id);
    yukle(dukkan.id);
  };

  if (!hazir) return <div className="yukleniyor">Yükleniyor…</div>;

  const acikSayi = siparisler.filter(
    (s) => s.durum !== "teslim" && s.durum !== "iptal"
  ).length;

  return (
    <>
      <UstBar
        baslik={dukkan?.ad || "Kurye Paneli"}
        kisi={profil?.ad}
        cikis={async () => {
          await sb().auth.signOut();
          router.replace("/giris");
        }}
      />
      <main className="govde">
        {hata && <div className="uyari">{hata}</div>}
        {dukkan && (
          <>
            <Sekmeler
              aktif={sekme}
              setAktif={setSekme}
              ogeler={[
                ["yeni", "Yeni sipariş"],
                ["liste", `Siparişlerim (${acikSayi})`],
              ]}
            />

            {sekme === "yeni" ? (
              <div className="kart form-kart">
                <h2>Paket nereye gidiyor?</h2>
                <Alan
                  etiket="Müşteri adı"
                  value={form.musteri}
                  onChange={(e) => setForm({ ...form, musteri: e.target.value })}
                  placeholder="Elif Y."
                />
                <Alan
                  etiket="Telefon"
                  value={form.telefon}
                  onChange={(e) => setForm({ ...form, telefon: e.target.value })}
                  inputMode="tel"
                  placeholder="0555 000 00 00"
                />
                <label className="alan">
                  <span>Teslimat adresi</span>
                  <textarea
                    rows={3}
                    value={form.adres}
                    onChange={(e) => setForm({ ...form, adres: e.target.value })}
                    placeholder="Mahalle, sokak, bina, daire, ilçe"
                  />
                </label>
                <Alan
                  etiket="Kurye notu"
                  value={form.not}
                  onChange={(e) => setForm({ ...form, not: e.target.value })}
                  placeholder="Zile basmayın, arayın"
                />
                <div className="ikili">
                  <Alan
                    etiket="Tahsil edilecek tutar (₺)"
                    value={form.tutar}
                    onChange={(e) => setForm({ ...form, tutar: e.target.value })}
                    inputMode="decimal"
                    placeholder="0"
                  />
                  <label className="alan">
                    <span>Ödeme</span>
                    <select
                      value={form.odeme}
                      onChange={(e) => setForm({ ...form, odeme: e.target.value })}
                    >
                      {Object.entries(ODEME).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <button className="btn btn-hivis" onClick={gonder}>
                  Siparişi gönder
                </button>
                {mesaj && <div className="ipucu">{mesaj}</div>}
              </div>
            ) : (
              <div className="liste">
                {siparisler.length === 0 ? (
                  <Bos
                    baslik="Henüz sipariş girmediniz"
                    aciklama="Yeni sipariş sekmesinden ilk paketi açın, kuryeler anında görsün."
                  />
                ) : (
                  siparisler.map((s) => (
                    <div
                      className="kart siparis"
                      key={s.id}
                      style={{ "--durum": DURUM[s.durum].bg }}
                    >
                      <div className="siparis-ust">
                        <span className="kod">{s.kod}</span>
                        <Etiket durum={s.durum} />
                        <span className="zaman">{saat(s.olusturuldu)}</span>
                      </div>
                      <Rota dukkan={dukkan} adres={s.adres} musteri={s.musteri_ad} />
                      {s.kurye_notu && <div className="not">{s.kurye_notu}</div>}
                      <div className="satir-bilgi">
                        <span>{ODEME[s.odeme]}</span>
                        <span>{s.tutar > 0 ? `${s.tutar} ₺` : "Tutar girilmedi"}</span>
                      </div>
                      {s.durum === "bekliyor" && (
                        <button className="btn btn-sessiz" onClick={() => iptal(s.id)}>
                          Siparişi iptal et
                        </button>
                      )}
                      {s.durum === "teslim" && (
                        <div className="ipucu">
                          {saat(s.teslim_at)} teslim edildi · kapıdan kapıya{" "}
                          {sure(s.olusturuldu, s.teslim_at)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
