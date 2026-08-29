import { Reveal } from "@/components/marketing/Reveal";

const techStack = [
  "Next.js 15", "React 18", "TypeScript", "Tailwind CSS", "shadcn/ui", "Framer Motion",
  "GSAP", "Vanta.js", "Supabase (Postgres · Auth · Realtime)", "Google Gemini",
  "Google Maps Platform", "FastAPI",
];

const builtWithCare = [
  "@uwaterloo.ca-only campus gate on every account",
  "Realtime chat & presence, backed by Supabase",
  "Natural-language bubble creation via Gemini intent parsing",
  "Optional K-means recommender service for “For You” picks",
  "A brand-matched GSAP + Vanta.js motion system, not stock templates",
];

export function TechStackSection() {
  return (
    <section id="stack" className="mx-auto max-w-6xl px-6 py-28">
      <div className="grid gap-16 lg:grid-cols-2">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: "var(--color-accent-start)" }}>
            Tech stack
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "var(--color-text-primary)" }}>
            Built end to end
          </h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {techStack.map((t) => (
              <span key={t} className="chip">{t}</span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <span className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: "var(--color-accent-start)" }}>
            Built with care
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "var(--color-text-primary)" }}>
            Made for real campus use
          </h2>
          <ul className="mt-6 space-y-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {builtWithCare.map((l) => (
              <li key={l} className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--color-accent-mid)" }} />
                {l}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
