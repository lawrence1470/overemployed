import Link from "next/link";

import SplitText from "~/app/_components/ui/split-text";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
	return (
		<HydrateClient>
			<main className="relative h-screen overflow-hidden bg-black text-white">
				{/* Minimal Background */}
				<div className="absolute inset-0">
					<div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
					<div className="absolute top-1/3 left-1/3 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl" />
					<div className="absolute right-1/3 bottom-1/3 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl" />
				</div>

				{/* Clean Navigation */}
				<nav className="relative z-50 flex items-center justify-between p-8">
					<div className="flex items-center space-x-3">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
							<div className="h-4 w-4 rounded-sm bg-black" />
						</div>
						<span className="font-medium text-lg text-white">VerifyHire</span>
					</div>

					<div className="hidden items-center space-x-8 md:flex">
						<Link
							href="/"
							className="text-white transition-colors hover:text-gray-300"
						>
							Home
						</Link>
						<Link
							href="/detection"
							className="text-gray-400 transition-colors hover:text-white"
						>
							Detection
						</Link>
						<Link
							href="/analytics"
							className="text-gray-400 transition-colors hover:text-white"
						>
							Analytics
						</Link>
						<Link
							href="/features"
							className="text-gray-400 transition-colors hover:text-white"
						>
							Features
						</Link>
						<Link
							href="/pricing"
							className="text-gray-400 transition-colors hover:text-white"
						>
							Pricing
						</Link>
					</div>

					<a
						href="/sign-in"
						className="inline-block rounded-lg bg-white px-6 py-2 font-medium text-black transition-colors hover:bg-gray-100"
					>
						Get Started
					</a>
				</nav>

				{/* Minimal Floating Elements */}
				<div className="pointer-events-none absolute inset-0">
					{/* Simple network lines */}
					<svg className="absolute inset-0 h-full w-full opacity-10">
						<line
							x1="20%"
							y1="30%"
							x2="80%"
							y2="70%"
							stroke="white"
							strokeWidth="1"
						/>
						<line
							x1="80%"
							y1="30%"
							x2="20%"
							y2="70%"
							stroke="white"
							strokeWidth="1"
						/>
					</svg>

					{/* Minimal floating cards */}
					<div className="absolute top-24 left-8 hidden rounded-xl border border-gray-800 bg-gray-900/50 p-3 backdrop-blur-sm lg:block">
						<div className="mb-1 flex items-center space-x-2">
							<div className="h-2 w-2 rounded-full bg-green-400" />
							<span className="text-gray-300 text-xs">Active</span>
						</div>
						<div className="font-semibold text-base text-white">2,847</div>
						<div className="text-gray-400 text-xs">Employees Verified</div>
					</div>

					<div className="absolute right-8 bottom-24 hidden rounded-xl border border-gray-800 bg-gray-900/50 p-3 backdrop-blur-sm lg:block">
						<div className="mb-1 flex items-center space-x-2">
							<div className="h-2 w-2 rounded-full bg-yellow-400" />
							<span className="text-gray-300 text-xs">Alert</span>
						</div>
						<div className="font-semibold text-base text-white">14</div>
						<div className="text-gray-400 text-xs">Potential Matches</div>
					</div>
				</div>

				{/* Hero Content */}
				<div
					className="relative z-10 flex flex-col items-center justify-center px-4"
					style={{ height: "calc(100vh - 112px)" }}
				>
					{/* Simple badge */}
					<div className="mb-6 flex items-center space-x-2 rounded-full border border-gray-800 bg-gray-900/50 px-6 py-2 backdrop-blur-sm">
						<div className="h-2 w-2 rounded-full bg-blue-400" />
						<span className="text-gray-300 text-sm">
							Employee Verification Platform
						</span>
					</div>

					{/* Main Heading */}
					<div className="mb-4 text-center">
						<SplitText
							text="Are We Hiring"
							className="block font-bold text-5xl text-white leading-tight md:text-7xl"
							delay={80}
							duration={1.0}
							ease="power3.out"
							splitType="chars"
							from={{ opacity: 0, y: 60, rotationX: -90 }}
							to={{ opacity: 1, y: 0, rotationX: 0 }}
							threshold={0.8}
							rootMargin="0px"
						/>
						<SplitText
							text="the Same Guy?"
							className="block font-bold text-5xl text-white leading-tight md:text-7xl"
							delay={60}
							duration={1.0}
							ease="power3.out"
							splitType="chars"
							from={{ opacity: 0, y: 60, rotationX: -90 }}
							to={{ opacity: 1, y: 0, rotationX: 0 }}
							threshold={0.8}
							rootMargin="0px"
						/>
					</div>

					{/* Simple subtitle */}
					<p className="mb-8 max-w-2xl text-center text-gray-400 text-lg leading-relaxed">
						Detect dual employment conflicts with advanced verification
						technology
					</p>

					{/* Clean CTA buttons */}
					<div className="flex flex-col items-center gap-4 sm:flex-row">
						<a
							href="/sign-in"
							className="inline-block rounded-lg bg-white px-8 py-3 font-medium text-black transition-colors hover:bg-gray-100"
						>
							Start Verification
						</a>
						<button
							type="button"
							className="rounded-lg border border-gray-600 px-8 py-3 font-medium text-white transition-colors hover:border-gray-400"
						>
							Learn More
						</button>
					</div>
				</div>

				{/* Minimal bottom elements */}
				<div className="absolute bottom-4 left-8 text-gray-500 text-xs">
					Scroll to explore
				</div>

				<div className="absolute right-8 bottom-4 text-gray-500 text-xs">
					Enterprise Solution
				</div>
			</main>
		</HydrateClient>
	);
}
