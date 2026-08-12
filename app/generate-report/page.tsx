"use client";

import { useState } from "react";
import Link from "next/link";
import AgentReadyLogo from "../components/AgentReadyLogo";
import { useRouter } from "next/navigation";

export default function GenerateReportPage() {
  const router = useRouter();

  const [clinicName, setClinicName] = useState("Miami Glow Aesthetics & Laser");
  const [domain, setDomain] = useState("miamiglowaesthetics.com");
  const [location, setLocation] = useState("Miami, FL · multi-location");
  const [score, setScore] = useState(36);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = domain.trim().toLowerCase().replace(/^https?:\/\//i, "").replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    const params = new URLSearchParams({
      name: clinicName.trim(),
      domain: domain.trim().toLowerCase().replace(/^https?:\/\//i, "").replace(/\/.*$/, ""),
      location: location.trim(),
      score: score.toString(),
    });

    router.push(`/report/${slug}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#191C1A] font-sans antialiased">
      {/* Backbar Header */}
      <header className="max-w-[920px] mx-auto px-6 py-6 flex items-center justify-between border-b border-[#E3E6E1]">
        <div className="flex items-center gap-3">
          <AgentReadyLogo className="w-7 h-7 text-[oklch(0.48_0.10_160)]" />
          <span className="font-serif font-semibold text-[20px]">AgentReady Local</span>
          <span className="text-[11px] font-mono text-[#5A6058] uppercase">Internal Audit Generator</span>
        </div>
        <Link href="/" className="text-[13px] text-[oklch(0.48_0.10_160)] font-semibold hover:underline">
          ← Back to Site
        </Link>
      </header>

      {/* Main Form Container */}
      <main className="max-w-[680px] mx-auto my-10 px-6">
        <div className="bg-white border border-[#E3E6E1] rounded-2xl p-8 shadow-sm flex flex-col gap-6">
          <div className="flex flex-col gap-1 border-b border-[#EDEFEA] pb-4">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[oklch(0.48_0.10_160)] font-bold">
              Post-Payment Fulfillment Tool
            </span>
            <h1 className="font-serif text-[28px] font-medium text-[#191C1A]">
              Generate Client Audit Report ($297 Delivery)
            </h1>
            <p className="text-[14px] text-[#5A6058] leading-[1.5]">
              Enter the practice details below to instantly generate their full 100-point Verified Audit report, scores, gap breakdown, and PDF export tool.
            </p>
          </div>

          <form onSubmit={handleGenerate} className="flex flex-col gap-5">
            <label className="flex flex-col gap-1.5 text-[13.5px] font-semibold text-[#191C1A]">
              Clinic / Practice Name:
              <input
                type="text"
                required
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="e.g. Miami Glow Aesthetics"
                className="px-3.5 py-2.5 border border-[#D4D8D2] rounded-lg font-sans text-[14px] bg-[#FAFAF7] outline-none focus:border-[oklch(0.48_0.10_160)] text-[#191C1A]"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-[13.5px] font-semibold text-[#191C1A]">
              Practice Website Domain:
              <input
                type="text"
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. miamiglowaesthetics.com"
                className="px-3.5 py-2.5 border border-[#D4D8D2] rounded-lg font-mono text-[14px] bg-[#FAFAF7] outline-none focus:border-[oklch(0.48_0.10_160)] text-[#191C1A]"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-[13.5px] font-semibold text-[#191C1A]">
              City &amp; Location Market:
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Miami, FL · multi-location"
                className="px-3.5 py-2.5 border border-[#D4D8D2] rounded-lg font-sans text-[14px] bg-[#FAFAF7] outline-none focus:border-[oklch(0.48_0.10_160)] text-[#191C1A]"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-[13.5px] font-semibold text-[#191C1A]">
              Audited Score (Out of 100):
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min={10}
                  max={80}
                  value={score}
                  onChange={(e) => setScore(parseInt(e.target.value, 10) || 30)}
                  className="w-28 px-3.5 py-2.5 border border-[#D4D8D2] rounded-lg font-mono text-[16px] bg-[#FAFAF7] outline-none focus:border-[oklch(0.48_0.10_160)] text-[#191C1A] font-bold text-center"
                />
                <span className="text-[12.5px] text-[#5A6058] font-mono">
                  Default pre-install range: 24 to 48 points
                </span>
              </div>
            </label>

            <div className="pt-3 border-t border-[#EDEFEA] flex flex-col gap-3">
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-lg bg-[oklch(0.48_0.10_160)] text-white text-[15px] font-semibold hover:bg-[oklch(0.42_0.10_160)] transition-all shadow-md text-center cursor-pointer"
              >
                Generate Client Audit Report →
              </button>
              <div className="text-[11.5px] text-[#8A8F87] text-center font-mono">
                Generates instant printable report with 100-point rubric, gap analysis &amp; PDF export button.
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
