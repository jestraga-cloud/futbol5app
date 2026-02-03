import type { Metadata, Viewport } from "next";
import { Russo_One } from "next/font/google";
import ErrorBoundary from "@/components/ErrorBoundary";
import OfflineIndicator from "@/components/OfflineIndicator";
import ToastProvider from "@/components/ToastProvider";
import "./globals.css";

const russoOne = Russo_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Futbol 5 - Registro de Partidos",
  description: "App para registrar partidos de futbol 5 entre amigos",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Futbol 5",
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning className={russoOne.variable}>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('futbol5-theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="field-pattern min-h-screen">
        <OfflineIndicator />
        <ErrorBoundary>{children}</ErrorBoundary>
        <ToastProvider />
      </body>
    </html>
  );
}
