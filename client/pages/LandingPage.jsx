"use client";

/**
 * ari161-bit/app2  ·  client/pages/LandingPage.jsx
 * Aquarius OS · FeeKiller.ai · High-Conversion Landing Page
 */

import Link from "next/link";

// ─── Static data ──────────────────────────────────────────────────────────────

const PLATFORMS = ["Uber Eats", "DoorDash", "Grubhub", "Instacart", "Postmates"];

const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Screenshot Your Cart or Receipt",
    body: "Capture the checkout screen from any delivery app before or after your order. A standard phone screenshot is all AFAI needs.",
  },
  {
    n: "02",
    title: "Drop It Into FeeKiller",
    body: "Drag the image onto the upload zone. AFAI fingerprints and ingests the payload in milliseconds — no account required to start.",
  },
  {
    n: "03",
    title: "Watch the Extraction Stream",
    body: "A live telemetry feed shows every layer AFAI is parsing: OCR isolation, markup detection, channel scan, promo sweep. Real-time.",
  },
  {
    n: "04",
    title: "Claim Your Savings",
    body: "Get the direct restaurant link, copy a live promo code, or paste an AI-generated refund script straight into support chat.",
  },
];

const FEATURES = [
  {
    icon: "⬡",
    accent: "cyan",
    title: "Markup Stripping",
    body: "AFAI surgically isolates the gap between what you're paying and what the food actually costs — menu inflation, service fees, and hidden surcharges removed in one pass.",
  },
  {
    icon: "◈",
    accent: "indigo",
    title: "Direct Channel Router",
    body: "Instantly surfaces the restaurant's own ordering channel so you bypass the platform entirely. Same kitchen. Same food. 30–40% lower bill.",
  },
  {
    icon: "⬢",
    accent: "violet",
    title: "Refund Snipe Scripts",
    body: "Late order? Wrong item? AFAI parses the receipt timestamp, measures the SLA breach, and generates three escalating dispute scripts — initial claim, escalation, and chargeback anchor.",
  },
];

const TIERS = [
  {
    id:      "free",
    name:    "Free",
    price:   "$0",
    period:  "forever",
    badge:   "Start Here",
    bCls:    "border-white/[0.08] bg-white/[0.015]",
    badgeCls:"bg-zinc-800 text-zinc-400 border-zinc-700",
    ctaCls:  "bg-white/[0.06] border border-white/[0.1] text-white hover:bg-white/10",
    href:    "/app",
    cta:     "Start Free — No Card",
    perks: [
      { text: "3 AFAI scans per month",       on: true  },
      { text: "Pre-Order Savings analysis",   on: true  },
      { text: "Live telemetry dashboard",     on: true  },
      { text: "Direct channel routing",       on: true  },
      { text: "Post-Order Refund Snipe",      on: false },
      { text: "Promo code sweep",             on: false },
      { text: "Unlimited scans",              on: false },
      { text: "Savings history ledger",       on: false },
    ],
  },
  {
    id:      "premium",
    name:    "Premium",
    price:   "$4.99",
    period:  "/ month",
    badge:   "Most Popular",
    bCls:    "border-cyan-500/30 bg-cyan-500/[0.03] shadow-[0_0_80px_rgba(6,182,212,0.07)]",
    badgeCls:"bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    ctaCls:  "bg-gradient-to-r from-cyan-500 to-indigo-500 text-white hover:opacity-90 shadow-lg shadow-cyan-500/25",
    href:    "/checkout",
    cta:     "Unlock Unlimited Scans",
    perks: [
      { text: "Unlimited AFAI scans",         on: true  },
      { text: "Pre-Order Savings analysis",   on: true  },
      { text: "Post-Order Refund Snipe",      on: true  },
      { text: "Live telemetry dashboard",     on: true  },
      { text: "Direct channel routing",       on: true  },
      { text: "Promo code sweep",             on: true  },
      { text: "Priority inference queue",     on: true  },
      { text: "Savings history ledger",       on: true  },
    ],
  },
];

const SOCIAL_PROOF = [
  { quote: "Saved $13 on a single DoorDash order. Paid for a month of premium in two orders.", handle: "@mia_eats_less" },
  { quote: "The refund script got me $22 back on a 55-minute late order. Pasted it, waited 4 hours, credited.", handle: "@techfrugal_dev" },
  { quote: "I didn't realise Grubhub was inflating menu prices by 28%. FeeKiller showed me in 3 seconds.", handle: "@urbanbudget" },
];

// ─── Reusable atoms ───────────────────────────────────────────────────────────

function Pill({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 border rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${className}`}>
      {children}
    </span>
  );
}

function SectionLabel({ children }) {
  return <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-3 font-mono">{children}</p>;
}

function PerkRow({ text, on }) {
  return (
    <li className={`flex items-center gap-2.5 text-xs ${on ? "text-zinc-300" : "text-zinc-700 line-through"}`}>
      <span className={`text-sm shrink-0 ${on ? "text-cyan-400" : "text-zinc-700"}`}>{on ? "✓" : "✕"}</span>
      {text}
    </li>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <nav className="relative z-20 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto border-b border-white/[0.05]">
      <div className="font-black tracking-tight text-lg">
        FeeKiller<span className="text-cyan-400">.ai</span>
      </div>
      <div className="flex items-center gap-5">
        <a href="#how" className="text-xs text-zinc-500 hover:text-white transition-colors hidden sm:block">How It Works</a>
        <a href="#pricing" className="text-xs text-zinc-500 hover:text-white transition-colors hidden sm:block">Pricing</a>
        <Link href="/app"
          className="px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-xs font-semibold hover:bg-white/10 transition-colors">
          Open App
        </Link>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative text-center px-4 pt-24 pb-20 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[560px] w-[560px] rounded-full bg-cyan-500/[0.055] blur-[110px]" />
      </div>
      <div className="relative max-w-3xl mx-auto">
        <Pill className="border-cyan-500/30 bg-cyan-500/8 text-cyan-400 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse inline-block" />
          Powered by AFAI · Aquarius OS
        </Pill>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.04] mb-6">
          Stop Letting Food Apps{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
            Scam You.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed mb-4">
          FeeKiller.ai instantly strips corporate menu markups, service surcharges, and hidden
          fees from your delivery checkout screens.
        </p>
        <p className="text-sm text-zinc-500 max-w-lg mx-auto leading-relaxed mb-10">
          Upload a screenshot. AFAI reads the inflated prices in under a second, surfaces the
          direct ordering channel, and puts the 30–40% markup back in your pocket.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <Link href="/app"
            className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold text-sm uppercase tracking-widest shadow-xl shadow-cyan-500/25 hover:scale-[1.02] hover:shadow-cyan-500/35 active:scale-[0.98] transition-all duration-200">
            Start Killing Fees →
          </Link>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Start Free · 3 Scans Included · No Card
          </div>
        </div>

        {/* Platform tags */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-[10px] text-zinc-700 uppercase tracking-widest mr-1 font-mono">Works on</span>
          {PLATFORMS.map(p => (
            <span key={p} className="px-3 py-1 rounded-full border border-white/[0.07] bg-white/[0.03] text-xs text-zinc-500">
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const accentMap = {
    cyan:   "border-cyan-500/20 bg-cyan-500/[0.03] hover:border-cyan-500/35",
    indigo: "border-indigo-500/20 bg-indigo-500/[0.03] hover:border-indigo-500/35",
    violet: "border-violet-500/20 bg-violet-500/[0.03] hover:border-violet-500/35",
  };
  const iconMap = {
    cyan:   "border-cyan-500/20 bg-cyan-500/8",
    indigo: "border-indigo-500/20 bg-indigo-500/8",
    violet: "border-violet-500/20 bg-violet-500/8",
  };

  return (
    <section className="px-4 py-20 max-w-5xl mx-auto">
      <div className="text-center mb-14">
        <SectionLabel>Core Mechanics</SectionLabel>
        <h2 className="text-3xl font-bold tracking-tight">What AFAI Actually Does</h2>
      </div>
      <div className="grid sm:grid-cols-3 gap-5">
        {FEATURES.map(f => (
          <div key={f.title}
            className={`rounded-2xl border p-6 transition-all duration-300 ${accentMap[f.accent]}`}>
            <div className={`h-11 w-11 rounded-xl border flex items-center justify-center text-xl mb-4 ${iconMap[f.accent]}`}>
              {f.icon}
            </div>
            <h3 className="font-semibold text-sm mb-2">{f.title}</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="px-4 py-20 max-w-4xl mx-auto" id="how">
      <div className="text-center mb-14">
        <SectionLabel>Process</SectionLabel>
        <h2 className="text-3xl font-bold tracking-tight">Four Steps to Savings</h2>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {HOW_IT_WORKS.map(s => (
          <div key={s.n} className="rounded-2xl border border-white/[0.07] bg-[#0b0c10] p-6 flex gap-5 hover:border-white/[0.12] transition-colors">
            <span className="font-black text-4xl text-white/[0.06] leading-none shrink-0 select-none font-mono">
              {s.n}
            </span>
            <div>
              <h3 className="font-semibold text-sm mb-2">{s.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{s.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SavingsDemo() {
  const rows = [
    { platform: "DoorDash",   item: "Shake Shack Combo",   platform_price: 38.47, direct_price: 26.90, saved: 11.57 },
    { platform: "Uber Eats",  item: "Chipotle Burrito Bowl",platform_price: 19.82, direct_price: 13.50, saved: 6.32  },
    { platform: "Grubhub",    item: "Sweetgreen Salad",     platform_price: 24.15, direct_price: 16.75, saved: 7.40  },
    { platform: "Instacart",  item: "Grocery Run (avg)",    platform_price: 62.00, direct_price: 44.20, saved: 17.80 },
  ];

  return (
    <section className="px-4 py-20 max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <SectionLabel>Savings Calculator</SectionLabel>
        <h2 className="text-3xl font-bold tracking-tight">What AFAI Recovers Per Order</h2>
        <p className="text-sm text-zinc-500 mt-3 max-w-sm mx-auto">Representative extractions across common platforms and order types.</p>
      </div>
      <div className="rounded-2xl border border-white/[0.07] bg-[#0b0c10] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Platform", "Item", "Platform Price", "Direct Price", "You Save"].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-[10px] text-zinc-600 uppercase tracking-widest font-mono font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4 text-zinc-400 font-medium">{r.platform}</td>
                  <td className="px-5 py-4 text-zinc-500">{r.item}</td>
                  <td className="px-5 py-4 text-zinc-400 tabular-nums">${r.platform_price.toFixed(2)}</td>
                  <td className="px-5 py-4 text-zinc-400 tabular-nums">${r.direct_price.toFixed(2)}</td>
                  <td className="px-5 py-4">
                    <span className="text-emerald-400 font-bold tabular-nums">−${r.saved.toFixed(2)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-white/[0.02]">
                <td colSpan={4} className="px-5 py-4 text-xs text-zinc-600 font-mono uppercase tracking-widest">
                  Average markup extracted per order
                </td>
                <td className="px-5 py-4 text-cyan-400 font-black text-sm tabular-nums">
                  −${(rows.reduce((a, r) => a + r.saved, 0) / rows.length).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section className="px-4 py-20 max-w-4xl mx-auto" id="pricing">
      <div className="text-center mb-14">
        <SectionLabel>Pricing</SectionLabel>
        <h2 className="text-3xl font-bold tracking-tight">Simple. Transparent. Ruthless.</h2>
        <p className="text-sm text-zinc-500 mt-3 max-w-sm mx-auto">Start free. Upgrade when two orders pay for the month.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
        {TIERS.map(t => (
          <div key={t.id} className={`relative rounded-2xl border p-7 flex flex-col ${t.bCls}`}>
            <span className={`self-start border rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest mb-5 ${t.badgeCls}`}>
              {t.badge}
            </span>
            <div className="mb-6">
              <span className="text-4xl font-black">{t.price}</span>
              <span className="text-zinc-500 text-sm ml-1.5">{t.period}</span>
            </div>
            <ul className="flex flex-col gap-2.5 mb-8 flex-1">
              {t.perks.map((p, i) => <PerkRow key={i} {...p} />)}
            </ul>
            <Link href={t.href}
              className={`text-center py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200 ${t.ctaCls}`}>
              {t.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function SocialProof() {
  return (
    <section className="px-4 py-20 max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <SectionLabel>Community</SectionLabel>
        <h2 className="text-3xl font-bold tracking-tight">Early Users</h2>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {SOCIAL_PROOF.map((s, i) => (
          <div key={i} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">"{s.quote}"</p>
            <p className="text-[10px] text-zinc-600 font-mono">{s.handle}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="px-4 py-24 max-w-3xl mx-auto text-center">
      <div className="relative rounded-3xl border border-cyan-500/20 bg-cyan-500/[0.03] p-14 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-72 w-72 rounded-full bg-indigo-500/[0.07] blur-3xl" />
        </div>
        <div className="relative">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
            Your Next Order{" "}
            <span className="text-cyan-400">Pays for Itself.</span>
          </h2>
          <p className="text-sm text-zinc-400 mb-8 max-w-sm mx-auto leading-relaxed">
            Three free scans. No card required. Start saving before your next delivery arrives.
          </p>
          <Link href="/app"
            className="inline-block px-12 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold text-sm uppercase tracking-widest shadow-xl shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
            Launch FeeKiller →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060709] text-white antialiased selection:bg-cyan-500/30">
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-48 -left-48 h-96 w-96 rounded-full bg-cyan-500/[0.04] blur-3xl" />
        <div className="absolute -bottom-48 -right-48 h-96 w-96 rounded-full bg-indigo-600/[0.04] blur-3xl" />
      </div>
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <SavingsDemo />
      <Pricing />
      <SocialProof />
      <FinalCTA />
      <footer className="border-t border-white/[0.05] py-8 text-center">
        <p className="text-[10px] text-zinc-700 uppercase tracking-widest font-mono">
          FeeKiller.ai · Aquarius OS · ari161-bit/app2
        </p>
      </footer>
    </div>
  );
}
