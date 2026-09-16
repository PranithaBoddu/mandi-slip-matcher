import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mandi Gate Pass & Weighbridge Slip Matcher",
  description: "Verify farmer payouts by cross-checking gate passes against weighbridge slips.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <nav className="border-b border-gray-200 bg-white px-6 py-3 print:hidden">
          <span className="text-sm font-semibold">🌾 Mandi Slip Matcher</span>
        </nav>
        {children}
      </body>
    </html>
  );
}