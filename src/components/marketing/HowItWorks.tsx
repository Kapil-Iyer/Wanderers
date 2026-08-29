import { ArrowRight, Compass, Users, MessagesSquare, Camera, Heart } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

const steps = [
  { icon: Compass, title: "Discover", detail: "See nearby and upcoming bubbles on a live map and in your feed." },
  { icon: Users, title: "Join", detail: "One tap to join. Chat unlocks the moment two people are in." },
  { icon: MessagesSquare, title: "Coordinate", detail: "Group chat per bubble, with AI icebreakers and meetup suggestions." },
  { icon: Camera, title: "Meet & remember", detail: "Capture a Wander Moment when it ends, post it to the shared feed." },
  { icon: Heart, title: "Connect", detail: "Send a “Wanna Wander?” request to people you met along the way." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-28">
      <Reveal>
        <span className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: "var(--color-accent-start)" }}>
          The problem
        </span>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "var(--color-text-primary)" }}>
          Plans die in group chats
        </h2>
        <p className="mt-4 max-w-2xl" style={{ color: "var(--color-text-secondary)" }}>
          &quot;Anyone down for X?&quot; gets sent to five different chats and answered by none of them.
          Wanderers is one open feed of what&apos;s happening on campus right now, so spontaneous
          plans actually happen.
        </p>
      </Reveal>

      <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((step, i) => (
          <Reveal key={step.title} delay={i * 0.06}>
            <div className="group relative flex h-full flex-col gap-3 rounded-xl p-5 glass-card">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: "rgba(224,51,158,0.12)", color: "var(--color-accent-mid)" }}
              >
                <step.icon className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{step.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{step.detail}</p>
              {i < steps.length - 1 && (
                <ArrowRight
                  className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 lg:block"
                  style={{ color: "var(--color-text-muted)" }}
                />
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
