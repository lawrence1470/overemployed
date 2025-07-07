import { HeroSection } from "~/app/_components/hero-section";
import { MoonlightingSection } from "~/app/_components/moonlighting-section";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
	return (
		<HydrateClient>
			<main>
				<HeroSection />
				<MoonlightingSection />
			</main>
		</HydrateClient>
	);
}
