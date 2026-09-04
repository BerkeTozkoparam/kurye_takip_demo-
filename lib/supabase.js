"use client";

import { createBrowserClient } from "@supabase/ssr";

let istemci;

/** Tarayici tarafi Supabase baglantisi. Tek ornek yeterli. */
export function sb() {
  if (!istemci) {
    istemci = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return istemci;
}
