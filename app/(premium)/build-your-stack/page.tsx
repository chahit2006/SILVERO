import { BuildYourStack } from "@/components/shop/BuildYourStack";

export default function BuildYourStackPage() {
  return (
    <div className="mx-auto max-w-screen-md px-4 py-16 lg:px-8">
      <h1 className="mb-2 font-display text-3xl">Build Your Own Stack</h1>
      <p className="mb-8 text-sm text-text-dark/60">Start from a curated set, swap any piece for another in the same category.</p>
      <BuildYourStack />
    </div>
  );
}
