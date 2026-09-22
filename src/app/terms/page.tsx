import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service · Wanderers",
  description: "The rules for using Wanderers.",
};

const CONTACT_EMAIL = "wanderers.spaces@gmail.com";

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
          Last updated {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long" })}
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          <section>
            <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Who can use Wanderers
            </h2>
            <p className="mt-2">
              Wanderers is for current University of Waterloo students with a valid
              @uwaterloo.ca email. Visitors without an account can browse a read-only demo
              (Guest Mode) that never touches real student data.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Meeting up in person
            </h2>
            <p className="mt-2">
              Wanderers helps you find and organize real, in-person meetups with other students.
              Use the same judgment you would meeting anyone new: meet in public, tell a friend
              where you&apos;re going, and trust your instincts. We don&apos;t run background
              checks on members and can&apos;t guarantee anyone&apos;s identity or behavior.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Acceptable use
            </h2>
            <p className="mt-2">
              Don&apos;t use Wanderers to harass, threaten, impersonate, or share content that is
              illegal, hateful, sexually explicit, or violates someone else&apos;s privacy. Don&apos;t
              post content you don&apos;t have the right to share. We may remove content, block
              access, or delete an account that violates these terms, based on reports or our own
              review.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Reporting &amp; blocking
            </h2>
            <p className="mt-2">
              If someone&apos;s behavior or content is a problem, report it in the app or email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline" style={{ color: "var(--color-text-primary)" }}>
                {CONTACT_EMAIL}
              </a>
              . You can also block anyone directly - blocking hides their messages, photos, and
              connection requests from you. We review reports and aim to respond within 24 hours.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Your content
            </h2>
            <p className="mt-2">
              You own what you post. By posting, you allow other Wanderers members in the same
              bubble or feed to see it as part of normal app use. See our{" "}
              <Link href="/privacy" className="underline" style={{ color: "var(--color-text-primary)" }}>
                Privacy Policy
              </Link>{" "}
              for how photos and messages are handled if you delete your account.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Account deletion
            </h2>
            <p className="mt-2">
              You can delete your account at any time from Profile → Delete Account. This is
              permanent and cannot be undone.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
              No warranty
            </h2>
            <p className="mt-2">
              Wanderers is provided as-is, built and maintained by a small student team. We do our
              best to keep it working and your data safe, but we don&apos;t guarantee
              uninterrupted service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Contact
            </h2>
            <p className="mt-2">
              Questions about these terms:{" "}
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
