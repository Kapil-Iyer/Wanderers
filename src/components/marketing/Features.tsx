import { CircleDot, MapPin, MessageCircle, Sparkles, Camera, UserPlus } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

const features = [
  {
    icon: CircleDot,
    title: "Bubbles",
    detail: "Open, time-boxed invites for whatever's happening right now: pickup basketball, a study grind at DC, coffee before an 8:30.",
  },
  {
    icon: MapPin,
    title: "Live campus map",
    detail: "See what's happening around you in real time, with an on-campus / off-campus mode for wherever you live.",
  },
  {
    icon: MessageCircle,
    title: "Group chat",
    detail: "Chat unlocks the moment a bubble has two people in it. Coordinate the meetup, then go.",
  },
  {
    icon: Sparkles,
    title: "AI intent parsing",
    detail: "Type “coffee near SLC tonight” and Gemini turns it into a structured bubble: time, place, vibe.",
  },
  {
    icon: Camera,
    title: "Wander Moments",
    detail: "Capture a photo when a bubble ends and it lands in the shared campus feed for everyone to see.",
  },
  {
    icon: UserPlus,
    title: "Wanna Wander?",
    detail: "Send a connection request to someone you met in a bubble. No chat history required.",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-28">
      <Reveal>
        <span className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: "var(--color-accent-start)" }}>
          What's inside
        </span>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "var(--color-text-primary)" }}>
          Everything to find your people
        </h2>
      </Reveal>

      <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.05}>
            <div className="h-full rounded-2xl p-6 glass-card">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "rgba(139,92,246,0.14)", color: "var(--color-accent-end)" }}
              >
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{f.detail}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
