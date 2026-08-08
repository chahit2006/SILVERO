import { GiftingGuidePage } from "@/components/gifting/GiftingGuidePage";
import { GIFTING_GUIDES } from "@/lib/gifting-guides-content";

export default function Page() {
  return <GiftingGuidePage guide={GIFTING_GUIDES["occasions"]} />;
}
