export function MarketingFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--color-border)" }}>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-10 text-sm sm:flex-row sm:justify-between"
        style={{ color: "var(--color-text-muted)" }}>
        <span>
          <span className="text-gradient font-semibold">Wanderers</span> · Find your people. Start something.
        </span>
        <a
          href="https://github.com/Kapil-Iyer/Wanderers"
          target="_blank"
          rel="noreferrer"
          className="transition-colors"
        >
          Source on GitHub
        </a>
      </div>
    </footer>
  );
}
