"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase";

/** Giris yapan kisiyi rolune gore dogru panele yollar. */
export default function Yonlendirme() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await sb().auth.getUser();
      if (!user) return router.replace("/giris");

      const { data: profil } = await sb()
        .from("profiller")
        .select("rol")
        .eq("id", user.id)
        .maybeSingle();

      if (!profil) {
        await sb().auth.signOut();
        return router.replace("/giris?hata=profil");
      }
      router.replace(`/${profil.rol}`);
    })();
  }, [router]);

  return <div className="yukleniyor">Panel açılıyor…</div>;
}
