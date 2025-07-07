import "~/styles/globals.css";

import type { Metadata } from "next";
import { Playfair_Display, Poppins, Dancing_Script, Cormorant_Garamond } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
	title: "Are We Hiring the Same Guy?",
	description: "Advanced employment verification to detect dual employment conflicts across organizations.",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const playfairDisplay = Playfair_Display({
	subsets: ["latin"],
	variable: "--font-display",
});

const poppins = Poppins({
	subsets: ["latin"],
	weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
	variable: "--font-body",
});

const dancingScript = Dancing_Script({
	subsets: ["latin"],
	variable: "--font-script",
});

const cormorantGaramond = Cormorant_Garamond({
	subsets: ["latin"],
	weight: ["300", "400", "500", "600", "700"],
	variable: "--font-serif",
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className={`${playfairDisplay.variable} ${poppins.variable} ${dancingScript.variable} ${cormorantGaramond.variable}`}>
			<body className="font-body">
				<TRPCReactProvider>{children}</TRPCReactProvider>
			</body>
		</html>
	);
}
