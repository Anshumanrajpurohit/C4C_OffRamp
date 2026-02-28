import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OffRamp Brochure",
  description: "Browse the full OffRamp brochure.",
};

export default function BrochurePage() {
  return (
    <main className="h-screen w-full overflow-hidden bg-black">
      <iframe
        src="/OffRamp.pdf#view=FitH"
        title="OffRamp brochure"
        className="h-full w-full border-0"
      />
    </main>
  );
}
