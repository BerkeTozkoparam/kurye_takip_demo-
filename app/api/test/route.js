export async function GET() {
  return Response.json({
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL || "EKSIK",
    anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "YÜKLÜ" : "EKSIK",
  });
}
