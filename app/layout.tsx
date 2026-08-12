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
  icons: {
    icon: "/logo.svg",
  },
};

const jsonLdSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "https://agentreadylocal-pi.vercel.app/#software",
      "name": "AgentReady Local",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All",
      "description": "AI-Readiness surface scanner, 100-point verified audit, and machine-readable business fact implementation for medical spas and aesthetic practices.",
      "url": "https://agentreadylocal-pi.vercel.app",
      "author": {
        "@type": "Organization",
        "name": "MetalMindTech LLC",
        "url": "https://agentreadylocal-pi.vercel.app"
      },
      "offers": [
        {
          "@type": "Offer",
          "name": "Surface Scan",
          "price": "0",
          "priceCurrency": "USD"
        },
        {
          "@type": "Offer",
          "name": "Verified Audit",
          "price": "297",
          "priceCurrency": "USD",
          "url": "https://buy.stripe.com/7sY7sL9gL6gQ3Ft6qt3840n"
        },
        {
          "@type": "Offer",
          "name": "Starter Install",
          "price": "1500",
          "priceCurrency": "USD"
        },
        {
          "@type": "Offer",
          "name": "Professional Install",
          "price": "3500",
          "priceCurrency": "USD"
        }
      ]
    },
    {
      "@type": "Organization",
      "@id": "https://agentreadylocal-pi.vercel.app/#organization",
      "name": "MetalMindTech LLC",
      "url": "https://agentreadylocal-pi.vercel.app",
      "knowsAbout": ["AI Readiness", "GEO Search", "Schema Markup", "llms.txt", "Med Spa Optimization"]
    }
  ]
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />
      </head>
      <body className="min-h-screen bg-[#FAFAF7] text-[#191C1A] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

