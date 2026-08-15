import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import { getBrand } from "@/lib/brand";
import { ensureImported } from "@/lib/boot";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

const serif = IBM_Plex_Serif({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  variable: "--font-serif",
});

export async function generateMetadata(): Promise<Metadata> {
  const brand = getBrand();
  return { title: brand.name, description: brand.description };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  ensureImported();
  return (
    <html lang="ru" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('mz-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}`,
          }}
        />
      </head>
      <body className={`${sans.variable} ${serif.variable}`}>{children}</body>
    </html>
  );
}
