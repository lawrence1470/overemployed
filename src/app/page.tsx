import { HeroSection } from "~/app/_components/hero-section";
import { MoonlightingSection } from "~/app/_components/moonlighting-section";
import { SohamSection } from "./_components/soham-section";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <MoonlightingSection />
      <SohamSection />
    </main>
  );
}
