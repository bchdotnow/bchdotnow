import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import VisitBeacon from "@/components/VisitBeacon";
import SiteFooter from "@/components/SiteFooter";
import "./globals.css";
import { ldJson } from "@/lib/site";

const brico = Plus_Jakarta_Sans({ variable: "--font-brico", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

const title = "Get Bitcoin Cash Now: Swap BTC, ETH, USDT to BCH | bch.now";
const description =
  "Swap Bitcoin, Ethereum, USDT, USDC and more for Bitcoin Cash (BCH), or back again. Live BCH price, no sign-up, paid straight to your own wallet.";

export const metadata: Metadata = {
  metadataBase: new URL("https://bch.now"),
  title: { default: title, template: "%s | bch.now" },
  description,
  applicationName: "bch.now",
  category: "finance",
  keywords: [
    "Bitcoin Cash",
    "BCH",
    "buy Bitcoin Cash",
    "get BCH",
    "BTC to BCH",
    "ETH to BCH",
    "USDT to BCH",
    "swap to BCH",
    "sell BCH",
    "BCH price",
    "Bitcoin Cash exchange",
    "peer-to-peer electronic cash",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://bch.now",
    siteName: "bch.now",
    locale: "en_US",
    title: "I want BCH.now",
    description: "Swap BTC, ETH, USDT and more for Bitcoin Cash, straight to your own wallet. Live price, no sign-up.",
  },
  twitter: {
    card: "summary_large_image",
    site: "@bchdotnow",
    creator: "@bchdotnow",
    title: "I want BCH.now",
    description: "Swap BTC, ETH, USDT and more for Bitcoin Cash, straight to your own wallet.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  formatDetection: { telephone: false, email: false, address: false },
  appleWebApp: { title: "bch.now", capable: true, statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#0ac18e", colorScheme: "light" };

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://bch.now/#website",
      name: "bch.now",
      url: "https://bch.now",
      description,
      inLanguage: "en",
      publisher: { "@id": "https://bch.now/#org" },
    },
    {
      "@type": "Organization",
      "@id": "https://bch.now/#org",
      name: "bch.now",
      url: "https://bch.now",
      logo: "https://bch.now/icon.png",
      email: "sponsor@bch.now",
      sameAs: ["https://x.com/bchdotnow", "https://github.com/bchdotnow/bchdotnow"],
    },
    {
      "@type": "WebApplication",
      name: "bch.now swap",
      url: "https://bch.now",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Any",
      description: "Swap Bitcoin, Ethereum, USDT, USDC, Solana, Litecoin, Dogecoin and XRP for Bitcoin Cash, or Bitcoin Cash back to them.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      isAccessibleForFree: true,
      provider: { "@id": "https://bch.now/#org" },
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${brico.variable}`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(jsonLd) }} />
        {children}
        <SiteFooter />
        <Analytics />
        <VisitBeacon />
      </body>
    </html>
  );
}
