import { NextResponse } from "next/server";

/**
 * Basit middleware - authentication için şimdilik skip
 * Production'da proper auth yapılacak
 */
export async function middleware(request) {
  // Şimdilik tüm requestleri pass et
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
