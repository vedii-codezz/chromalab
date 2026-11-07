import Link from "next/link";

export function Wordmark() {
  return (
    <Link href="/" className="wordmark" aria-label="CHROMA LAB home">
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>
        CHROMA <strong>LAB</strong>
        <span className="brand-period">®</span>
      </span>
    </Link>
  );
}
