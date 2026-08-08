import { GuidePage } from "@/components/guides/GuidePage";
import { GUIDES } from "@/lib/guides-content";

export default function Page() {
  return <GuidePage guide={GUIDES["hallmark"]} />;
}
