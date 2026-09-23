import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--color-border)" }}>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-10 text-sm sm:flex-row sm:justify-between"
        style={{ color: "var(--color-text-muted)" }}>
        <span>
          <span className="text-gradient font-semibold">Wanderers</span> · Find your people. Start something.
        </span>
        <div className="flex items-center gap-5">
          <Link href="/privacy" className="transition-colors hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-foreground">
            Terms
          </Link>
          <a
            href="https://github.com/Kapil-Iyer/Wanderers"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Source on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
