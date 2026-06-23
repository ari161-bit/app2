import "./globals.css";

export const metadata = {
  title: "FeeKiller.ai — Stop Letting Food Apps Scam You",
  description:
    "FeeKiller.ai instantly strips corporate menu markups, service surcharges, and hidden fees from your delivery checkout screens. Upload a screenshot, save 30%–40% instantly.",
  keywords: "delivery fees, DoorDash, Uber Eats, Grubhub, save money, food delivery",
  openGraph: {
    title: "FeeKiller.ai — Stop Letting Food Apps Scam You",
    description: "Upload a screenshot. Save 30–40% instantly.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
