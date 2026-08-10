"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";

const FAQS = [
  { q: "Is your jewellery real silver?", a: "Yes — every piece is 925 sterling silver (92.5% pure), hallmarked. See our Silver Guide for details." },
  { q: "Do you offer free shipping?", a: "Yes, complimentary standard shipping across India on every order. Express delivery is available for a fee." },
  { q: "Does plating wear off?", a: "Gold plating on 925 silver can wear with years of daily use — Circle members get free lifetime re-plating." },
  { q: "How do I find my ring/bracelet/necklace size?", a: "See our Size Guides — Ring Size, Bracelet Size, and Necklace Length." },
  { q: "Can I order a custom piece?", a: "Custom (one-of-one) orders are available to SILVERO Circle members." },
];

export default function FaqPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 lg:px-8">
      <h1 className="mb-8 font-display text-3xl">Frequently Asked Questions</h1>
      <div className="divide-y divide-black/10 border-t border-black/10">
        {FAQS.map((faq, i) => (
          <div key={faq.q}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between py-4 text-left text-sm font-medium"
            >
              {faq.q}
              <ChevronDownIcon
                width={16}
                height={16}
                className={`shrink-0 transition-transform duration-300 ${open === i ? "rotate-180" : ""}`}
              />
            </button>
            {open === i && <p className="pb-4 text-sm text-text-dark/60">{faq.a}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
