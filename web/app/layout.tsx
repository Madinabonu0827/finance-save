import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Toaster } from "@/components/ui/sonner";

// globals.css'dagi `@theme inline` bloki `--font-sans: var(--font-sans)` deb kutadi —
// shuning uchun shrift o'zgaruvchisi aynan shu nom bilan e'lon qilinishi shart, aks holda
// brauzer standart (odatda serif) shriftga qaytib ketadi.
const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finance AI",
  description: "Shaxsiy moliya ekotizimi — Web va Telegram orqali boshqaring",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="uz"
      className={`${fontSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Telegram Mini App SDK — window.Telegram.WebApp ni ta'minlaydi */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>{children}</AuthProvider>
            <Toaster richColors position="top-center" />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
