"use client";

import { useState } from "react";

// No ContactMessage model exists in DATA_MODEL.md and this isn't in
// API_SPEC.md, so there's nowhere server-side to persist a submission yet.
// Rather than fake an AJAX "message sent" success that silently discards
// the input, this opens the visitor's own email client via mailto: — an
// honest fallback that actually delivers the message. Replace with a real
// endpoint (and a ContactMessage table) if the team wants it stored/tracked.
const SUPPORT_EMAIL = "hello@silvero925.com"; // placeholder — confirm real inbox

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`Website enquiry from ${form.name || "a customer"}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 lg:px-8">
      <h1 className="mb-3 font-display text-3xl">Contact Us</h1>
      <p className="mb-8 text-sm text-text-dark/60">
        Email us directly at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-olive-dark underline">
          {SUPPORT_EMAIL}
        </a>
        , or use the form below.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-olive-dark"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-olive-dark"
        />
        <textarea
          required
          rows={5}
          placeholder="How can we help?"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-olive-dark"
        />
        <button type="submit" className="rounded-full bg-olive-dark px-6 py-3 text-sm uppercase tracking-wide text-ivory">
          Send Message
        </button>
      </form>
    </div>
  );
}
