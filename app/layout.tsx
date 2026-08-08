import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { CartProvider } from "@/components/providers/CartProvider";
import { WishlistProvider } from "@/components/providers/WishlistProvider";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

// Body sans is unspecified in the IA doc — Inter is a placeholder,
// see DESIGN_SYSTEM.md §10.5.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SILVERO.925 — 925 Sterling Silver Jewellery",
  description: "Handcrafted 925 sterling silver jewellery, made for everyday wear.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body>
        <SessionProvider>
          <WishlistProvider>
            <CartProvider>
              <Header />
              <main>{children}</main>
              <Footer />
            </CartProvider>
          </WishlistProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
