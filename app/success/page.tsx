import Link from "next/link";
import AgentReadyLogo from "../components/AgentReadyLogo";

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#191C1A] font-sans antialiased flex flex-col justify-between">
      {/* Header */}
      <header className="max-w-[1080px] mx-auto w-full px-8 py-[22px] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AgentReadyLogo className="w-8 h-8 text-[oklch(0.48_0.10_160)]" />
          <div className="flex items-baseline gap-2.5">
            <span className="font-serif font-semibold text-[22px] tracking-tight">AgentReady Local</span>
            <span className="text-[11px] tracking-[0.08em] uppercase text-[#5A6058] font-mono">by MetalMindTech</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[640px] mx-auto px-6 py-12 w-full flex-1 flex flex-col justify-center">
        <div className="bg-white border border-[#E3E6E1] rounded-2xl p-8 sm:p-10 shadow-sm flex flex-col gap-6 text-center items-center">
          <div className="w-16 h-16 rounded-full bg-[oklch(0.96_0.03_160)] text-[oklch(0.48_0.10_160)] flex items-center justify-center text-3xl font-bold">
            ✓
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-mono text-[12px] uppercase text-[oklch(0.48_0.10_160)] font-bold tracking-wider">
              Order Confirmed
            </span>
            <h1 className="font-serif text-[32px] sm:text-[36px] font-medium text-[#191C1A]">
              Your 100-Point Audit is Underway
            </h1>
          </div>

          <p className="text-[15px] sm:text-[16px] leading-[1.6] text-[#3D423D]">
            Thank you for ordering the Verified Audit. Our team is preparing your practice&apos;s audit and running live verification tests across supported AI answer engines.
          </p>

          <div className="bg-[#FAFAF7] border border-[#EDEFEA] rounded-xl p-5 w-full text-left flex flex-col gap-3 font-mono text-[13px]">
            <div className="font-bold text-[#191C1A] text-[13.5px]">What happens next:</div>
            <div className="flex items-start gap-2.5 text-[#3D423D]">
              <span className="text-[oklch(0.48_0.10_160)] font-bold">1.</span>
              <span>We inspect your public website, structured data markup, and execute live query tests across ChatGPT, Perplexity, and Google AI Overview.</span>
            </div>
            <div className="flex items-start gap-2.5 text-[#3D423D]">
              <span className="text-[oklch(0.48_0.10_160)] font-bold">2.</span>
              <span>Inaccessible engines are recorded and marked pending — we never invent scores or fabricate evidence.</span>
            </div>
            <div className="flex items-start gap-2.5 text-[#3D423D]">
              <span className="text-[oklch(0.48_0.10_160)] font-bold">3.</span>
              <span>Your finished report and evidence ZIP bundle will be delivered directly to your email within 24 hours.</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#191C1A] text-white text-[14px] font-semibold hover:bg-black transition-all shadow-md"
            >
              ← Return to AgentReady Local
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E3E6E1] bg-white py-6">
        <div className="max-w-[1080px] mx-auto px-8 text-center text-[12.5px] text-[#8A8F87] font-mono">
          © 2026 MetalMindTech LLC · AgentReady Local Phase 1
        </div>
      </footer>
    </div>
  );
}
