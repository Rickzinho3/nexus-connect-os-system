import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
    title: "Nexus OS",
    description: "Sistema de Gestão para Assistência Técnica",
    icons: {
        icon: "/android-chrome-512x512.png",
    },

    openGraph: {
        title: "Nexus OS",
        description: "Sistema de Gestão para Assistência Técnica",
        images: [
          {
            url: "/og-nexus.png",
            width: 1200,
            height: 630,
            alt: "Nexus OS"
          },
        ],
        type: "website",
    },

    twitter: {
      card: "summary_large_image",
      images: ["/og-nexus.png"]
    }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          {children}
          <Toaster position="top-center" richColors />
        </SessionProvider>
      </body>
    </html>
  );
}
