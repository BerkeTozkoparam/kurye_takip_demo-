export const DURUM = {
  bekliyor: { etiket: "Kurye bekliyor", bg: "#F5C518", fg: "#3A2E00" },
  atandi: { etiket: "Kurye dükkana gidiyor", bg: "#1D4ED8", fg: "#FFFFFF" },
  alindi: { etiket: "Paket kuryede", bg: "#0E7490", fg: "#FFFFFF" },
  teslim: { etiket: "Teslim edildi", bg: "#15803D", fg: "#FFFFFF" },
  iptal: { etiket: "İptal edildi", bg: "#B91C1C", fg: "#FFFFFF" },
};

export const ODEME = {
  nakit: "Kapıda nakit",
  kart: "Kapıda kart",
  odendi: "Ödemesi alındı",
};

export const saat = (t) =>
  t ? new Date(t).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : "—";

export const gecen = (t) => {
  if (!t) return "—";
  const dk = Math.floor((Date.now() - new Date(t).getTime()) / 60000);
  if (dk < 1) return "az önce";
  if (dk < 60) return `${dk} dk önce`;
  return `${Math.floor(dk / 60)} sa ${dk % 60} dk önce`;
};

export const sure = (a, b) =>
  a && b ? `${Math.max(1, Math.round((new Date(b) - new Date(a)) / 60000))} dk` : "—";

export const bugunMu = (t) =>
  !!t && new Date(t).toDateString() === new Date().toDateString();

export const yolTarifi = (nereden, nereye) =>
  `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    nereden || ""
  )}&destination=${encodeURIComponent(nereye || "")}&travelmode=driving`;
