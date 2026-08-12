import type { Metadata } from "next";
import { Spectral, Public_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const spectral = Spectral({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-spectral",
});

const publicSans = Public_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-public-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: "AgentReady Local — AI-Readiness for Med Spas & Aesthetic Practices",
  description: "When someone asks ChatGPT for the best med spa in your city, does it know you exist? Free surface scan and 100-point Verified Audit by MetalMindTech LLC.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spectral.variable} ${publicSans.variable} ${ibmPlexMono.variable} scroll-smooth`}
    >
      <body className="min-h-screen bg-[#FAFAF7] text-[#191C1A] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

