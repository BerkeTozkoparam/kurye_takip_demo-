import "./globals.css";

export const metadata = {
  title: "Kurye Paneli",
  description: "Dükkan siparişleri ve kurye takibi",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
