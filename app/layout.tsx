import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

const title = "Daniel De Lauretis · Solutions Engineer";
const description =
  "Reviewing my resume? Request a short, personalized video introduction from Daniel De Lauretis.";

export const metadata: Metadata = {
  metadataBase: new URL("https://shinyflows.com"),
  title,
  description,
  openGraph: { title, description, url: "/", siteName: "Daniel De Lauretis", type: "website" },
  twitter: { card: "summary", title, description },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>
        {children}
        {/* Vercel Web Analytics via its built-in endpoint: no npm dependency.
            Only active on Vercel deployments with Web Analytics enabled. */}
        {process.env.VERCEL && (
          <>
            <Script id="va-queue" strategy="afterInteractive">
              {"window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };"}
            </Script>
            <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />
          </>
        )}
      </body>
    </html>
  );
}
