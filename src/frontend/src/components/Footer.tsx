export default function Footer() {
  const year = new Date().getFullYear();
  const utm = encodeURIComponent(window.location.hostname);
  return (
    <footer className="border-t border-border bg-muted/30 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          © {year}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${utm}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </footer>
  );
}
