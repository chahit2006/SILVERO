# UNUSED_IMAGES.md — photos from `photos_Silvero/` not placed, and why

Companion to `IMAGES.md` (which logs what *was* placed). These 17 files
remain untouched in `photos_Silvero/` — nothing was copied into
`public/placeholders/` or wired into any component for them.

| Image | Reason not used |
|---|---|
| `Nar-category-placeholder-(2).png` | `GenderCards.tsx` has exactly one "Nar" image slot, already filled by `Nar-category-placeholder-(1).png` (client's choice). No second slot exists for it. |
| `Festive-hero.png` | No "Festive" section exists anywhere in the code. Held per client instruction — would require adding a new homepage section outside `DESIGN_SYSTEM.md`'s spec'd 12. |
| `Our-promise-(1).png` | No "Our Promise" section exists. Client confirmed it should eventually be a 4-image carousel, but building it is a new section outside the spec'd 12 — held pending a spec update / team lead sign-off. |
| `Our-promise-(2).png` | Same as above. |
| `Our-promise-(3).png` | Same as above. |
| `Our-promise-(4).png` | Same as above. |
| `Collection .png` (note: actual filename has a space before `.png`) | No general "Collections" page or banner exists anywhere in the code. |
| `Virasat-(1)-collection.png` | "Virasat" isn't a category, product, or any other entity in the code — there's no "collection" concept in the data model at all. Needs a real feature decision before anything can be placed. |
| `Virasat-(2).png` | Same as above. |
| `Meera-(1)-collection.png` | "Meera" doesn't exist anywhere in the code — same gap as Virasat. |
| `Shaan-(1)-collection.png` | "Shaan" doesn't exist anywhere in the code — same gap as Virasat. |
| `Rang-(1).png` | No "Rang" category slug exists in `lib/nav-data.ts` or `prisma/seed.ts`. Needs a new category created — a schema/seed change, out of scope for a trial-images-only pass (`prisma/schema.prisma` and `seed.ts` were off-limits this pass). |
| `Rang-(2).png` | Same as above. |
| `Rang-(3).png` | Same as above. |
| `Rang-(4).png` | Same as above. |
| `Nazar-(1).png` | Same gap as Rang — no category or product identity named "Nazar" exists anywhere. |
| `Braclet-Nar-(1).png` | The NAR bracelet category *does* exist (`sitara`, "Tennis Bracelets"), so this one could be wired into `lib/trialImages.ts` with the same 2-line pattern used for Zanjeer/Sankalp/Nishaan/Resham/Vaada. Not added because it wasn't on the explicit trial-images list approved for this pass — ask and it's a quick addition, not a blocker like the others above. |
