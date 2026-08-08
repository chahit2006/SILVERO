import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-32 text-center">
      <h1 className="font-display text-3xl text-text-dark">Page not found</h1>
      <p className="mt-3 text-text-dark/60">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="mt-6 inline-block text-sm uppercase tracking-wide text-olive-dark">
        Back to home
      </Link>
    </div>
  );
}
