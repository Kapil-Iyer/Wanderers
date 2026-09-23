import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy · Wanderers",
  description: "How Wanderers collects, uses, and lets you delete your data.",
};

const CONTACT_EMAIL = "wanderers.spaces@gmail.com";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="text-sm font-medium"
          style={{ color: "var(--color-text-muted)" }}
        >
          ← Wanderers
        </Link>

        <h1
          className="font-display mt-6 text-3xl font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
          Last updated {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long" })}
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          <section>
            <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
              What we collect
            </h2>
            <p className="mt-2">
              To sign up, we collect your @uwaterloo.ca campus email and, optionally, your name.
              Once you&apos;re using Wanderers, we also collect: content you post (bubble
              descriptions, chat messages, Wander Moment photos and captions), your interests and
              profile details you choose to add, and your approximate location when you use the
              map to find nearby activities (only while the app is open - we don&apos;t track you
              in the background).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
              How we use it
            </h2>
            <p className="mt-2">
              Your campus email verifies you&apos;re a UWaterloo student and lets you sign back in.
              Your location powers the map and nearby-activity features. Photos and messages are
              shown to other members of the bubbles you&apos;re part of, or on the shared Wander
              Moments feed. We don&apos;t sell your data or share it with advertisers.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Reporting and blocking
            </h2>
            <p className="mt-2">
              You can report a message, photo, or user directly in the app, and block anyone you
              don&apos;t want to see content from or hear from again. Reports are reviewed by our
              team; we aim to respond within 24 hours. To report something or reach us about a
              safety concern, email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline" style={{ color: "var(--color-text-primary)" }}>
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Deleting your data
            </h2>
            <p className="mt-2">
              You can permanently delete your account at any time from Profile → Delete Account.
              This removes your account, profile, and any bubbles you created. Messages and Wander
              Moments you posted stay visible to other members (so group conversations and shared
              memories aren&apos;t broken for everyone else) but are no longer linked to your name
              or account. If you&apos;d rather we handle this for you, email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline" style={{ color: "var(--color-text-primary)" }}>
                {CONTACT_EMAIL}
              </a>
              {" "}and we&apos;ll delete it within a reasonable time.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Where your data lives
            </h2>
            <p className="mt-2">
              Wanderers is built on Supabase (database, authentication, and photo storage). We use
              Google Maps for location display and Google Gemini to help parse plain-language
              event descriptions into structured event details - the text you type when creating a
              bubble may be sent to Gemini for that purpose only.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Contact
            </h2>
            <p className="mt-2">
              Questions, concerns, or requests about your data:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline" style={{ color: "var(--color-text-primary)" }}>
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
