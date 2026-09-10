import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import AgentReadyLogo from "../components/AgentReadyLogo";
import audit from "../../public/evidence/ARL-20260910-GR8SKIN-001/manifest.json";

export const metadata: Metadata = {
  title: "Live Evidence Sample — Gr8Skin MedSpa | AgentReady Local",
  description: "A documented public evidence sample for Gr8Skin MedSpa: an actual Google AI Overview, source captures, markup checks, and clearly identified pending tests.",
};

const evidenceRoot = `/evidence/${audit.audit_id}`;
const downloadPath = `/downloads/${audit.audit_id}.zip`;
const statusLabels: Record<string, string> = {
  captured: "Response captured",
  pending_sign_in: "Pending — sign-in required",
  blocked_browser_verification: "Pending — browser verification",
};

function EvidenceLink({ file }: { file: string }) {
  return <a href={`${evidenceRoot}/${file}`} className="break-all underline underline-offset-4">{file}</a>;
}

export default function SampleReportPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#191C1A]">
      <nav id="backbar" aria-label="Report navigation" className="flex items-center justify-between gap-4 border-b border-[#E3E6E1] bg-white px-5 py-4 text-sm sm:px-8">
        <Link href="/">← Back to AgentReady Local</Link>
        <span className="hidden text-xs text-[#5A6058] sm:block">MetalMindTech LLC</span>
      </nav>

      <main className="mx-auto my-6 max-w-[1040px] space-y-10 border border-[#E3E6E1] bg-white px-5 py-8 shadow-sm sm:rounded-xl sm:px-10 sm:py-12 print:m-0 print:max-w-none print:border-0 print:p-0 print:shadow-none">
        <header className="border-b-2 border-[#191C1A] pb-7">
          <p className="mb-5 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-[#35634C]">
            <AgentReadyLogo className="h-5 w-5" />AgentReady Local · Live evidence sample
          </p>
          <h1 className="font-serif text-3xl leading-tight sm:text-5xl">{audit.practice.name}</h1>
          <p className="mt-3 text-[#5A6058]">{audit.practice.city} · <a href={audit.practice.website}>Official website ↗</a></p>
          <p className="mt-4 break-words font-mono text-xs text-[#5A6058]">{audit.audit_id} · Evidence captured {audit.audit_date} · UTC timestamps</p>
          <div className="mt-6 flex flex-wrap gap-3 print:hidden">
            <a href={downloadPath} download className="rounded-lg bg-[#35634C] px-5 py-3 text-sm font-semibold !text-white hover:bg-[#284B3A]">Download evidence ZIP</a>
            <a href={`${evidenceRoot}/manifest.json`} className="rounded-lg border border-[#D4D8D2] px-5 py-3 text-sm font-semibold">View evidence manifest</a>
          </div>
        </header>

        <section aria-labelledby="coverage-title" className="rounded-xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="coverage-title" className="text-lg font-semibold">Collection in progress</h2>
            <span className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-900">No audit score assigned</span>
          </div>
          <p className="mt-3 text-sm leading-7">{audit.scope}</p>
          <p className="mt-2 text-sm leading-7">Pending tests do not count as failures. The captured Google response identifies this practice; this sample does not support a claim that it is invisible to AI.</p>
        </section>

        <section aria-labelledby="finding-title">
          <p className="font-mono text-xs uppercase tracking-widest text-[#35634C]">The documented finding</p>
          <h2 id="finding-title" className="mt-2 font-serif text-2xl sm:text-3xl">One contact page. Two street numbers.</h2>
          <p className="mt-4 leading-7 text-[#3D423D]">The clinic’s visible contact page says <strong>2805 Campus Drive</strong>. Its page description and directions link use <strong>2855 Campus Drive</strong>. The captured Google AI Overview shows 2805. The first action is to confirm the current address with the owner and make the website’s fields consistent.</p>
          <div className="mt-5 overflow-x-auto rounded-lg border border-[#E3E6E1]">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Observed address values by source</caption>
              <thead className="bg-[#F2F4F0]"><tr><th scope="col" className="p-3">Observed source</th><th scope="col" className="p-3">Street number</th></tr></thead>
              <tbody className="divide-y divide-[#E3E6E1]">
                <tr><th scope="row" className="p-3 font-normal">Visible contact page</th><td className="p-3 font-mono">2805</td></tr>
                <tr><th scope="row" className="p-3 font-normal">Contact-page description and map link</th><td className="p-3 font-mono">2855</td></tr>
                <tr><th scope="row" className="p-3 font-normal">Captured Google AI Overview</th><td className="p-3 font-mono">2805</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-[#5A6058]">The inconsistency is verified. The current operational address and the cause of Google’s selection are not established by this sample.</p>
        </section>

        <section aria-labelledby="screenshots-title" className="space-y-6">
          <h2 id="screenshots-title" className="font-serif text-2xl">Actual source captures</h2>
          {audit.images.map((capture) => (
            <figure key={capture.file} className="evd overflow-hidden rounded-xl border border-[#E3E6E1]">
              <div className="border-b border-[#E3E6E1] bg-[#F2F4F0] px-4 py-3">
                <h3 className="font-semibold">{capture.title}</h3>
                <p className="mt-1 break-all font-mono text-xs text-[#5A6058]">Observed {capture.observed_at}</p>
              </div>
              <a href={`${evidenceRoot}/${capture.file}`} aria-label={`Open full PNG: ${capture.title}`}>
                <Image src={`${evidenceRoot}/${capture.file}`} alt={`${capture.title}, captured ${capture.observed_at}. ${capture.caption}`} width={capture.width} height={capture.height} unoptimized sizes="(max-width: 1040px) 100vw, 960px" className="h-auto w-full" />
              </a>
              <figcaption className="space-y-2 border-t border-[#E3E6E1] p-4 text-sm leading-6 text-[#5A6058]">
                <p>{capture.caption}</p>
                <p><a href={capture.source_url} className="break-all underline underline-offset-4">View source ↗</a> · <EvidenceLink file={capture.file} /></p>
              </figcaption>
            </figure>
          ))}
        </section>

        <section aria-labelledby="engines-title">
          <h2 id="engines-title" className="font-serif text-2xl">Engine test coverage</h2>
          <div className="mt-5 space-y-4">
            {audit.engine_tests.map((test) => (
              <article key={test.id} className="evd rounded-lg border border-[#E3E6E1] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-semibold">{test.engine}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${test.status === "captured" ? "bg-green-50 text-green-900" : "bg-amber-50 text-amber-900"}`}>{statusLabels[test.status] ?? test.status}</span>
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#5A6058]">{test.query_submitted ? "Submitted query" : "Planned query — not submitted"}</p>
                <p className="mt-2 break-words rounded-md bg-[#FAFAF7] p-3 font-mono text-xs leading-6">{test.query}</p>
                <p className="mt-3 text-sm leading-6 text-[#3D423D]">{test.note}</p>
                {test.response_file && <p className="mt-3 text-sm"><EvidenceLink file={test.response_file} /></p>}
              </article>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-[#5A6058]">{audit.observation_context}</p>
        </section>

        <section aria-labelledby="records-title">
          <h2 id="records-title" className="font-serif text-2xl">Findings and next actions</h2>
          <p className="mt-3 text-sm leading-6 text-[#5A6058]">“Verified” means the stated observation matches the captured source. It does not certify the business facts, establish causation, or predict an engine’s future response.</p>
          <div className="mt-5 space-y-5">
            {audit.findings.map((finding) => (
              <article key={finding.id} className="evd rounded-lg border border-[#E3E6E1] p-5">
                <p className="font-mono text-xs text-[#35634C]">{finding.id} · {finding.verification_status} · confidence {finding.confidence}</p>
                <h3 className="mt-2 text-lg font-semibold">{finding.title}</h3>
                <p className="mt-3 text-sm leading-7">{finding.observation}</p>
                <p className="mt-3 text-sm leading-7 text-[#5A6058]"><strong>Limit:</strong> {finding.limitation}</p>
                <p className="mt-3 text-sm leading-7"><strong>Next action:</strong> {finding.next_action}</p>
                <p className="mt-4 text-xs leading-6 text-[#5A6058]">Source: {finding.source}<br />Observed: {finding.observed_at}</p>
                <ul className="mt-3 space-y-2 text-xs">{finding.evidence_files.map((file) => <li key={file}><EvidenceLink file={file} /></li>)}</ul>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="remaining-title" className="rounded-lg bg-[#F2F4F0] p-5 sm:p-6">
          <h2 id="remaining-title" className="text-lg font-semibold">What remains before the full audit is complete</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6">{audit.remaining_checks.map((check) => <li key={check}>{check}</li>)}</ol>
        </section>

        <section aria-labelledby="bundle-title">
          <h2 id="bundle-title" className="font-serif text-2xl">Inspect the evidence</h2>
          <p className="mt-3 text-sm leading-7 text-[#3D423D]">The ZIP contains PNG captures, extracted response text, source metadata, local markup checks, and a manifest with file sizes and SHA-256 hashes. A separate ZIP checksum avoids a circular hash.</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold">
            <a href={downloadPath} download className="underline underline-offset-4">Download ZIP</a>
            <a href={`${downloadPath}.sha256`} className="underline underline-offset-4">ZIP checksum</a>
            <EvidenceLink file="manifest.json" /><EvidenceLink file="schema-check.json" />
          </div>
          <p className="mt-4 text-xs leading-6 text-[#5A6058]">{audit.timestamp_method} Screenshot conversion and cropping are recorded in the manifest.</p>
        </section>

        <footer className="space-y-4 border-t border-[#E3E6E1] pt-6 text-sm leading-6 text-[#5A6058]">
          <p>{audit.relationship}</p>
          <p>The previous Lakeshore report (ARL-2026-0114) was a layout prototype. Its score and example findings have been withdrawn from this page.</p>
          <p>AgentReady Local · MetalMindTech LLC<br />Verified Audit: $297 for one location. <Link href="/#pricing" className="underline underline-offset-4">View the full audit scope</Link>.</p>
        </footer>
      </main>
    </div>
  );
}
