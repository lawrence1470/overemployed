import Link from "next/link";

import { HydrateClient } from "~/trpc/server";

export default async function Home() {
	return (
		<HydrateClient>
			<main className="min-h-screen bg-black text-white overflow-hidden relative">
				{/* Minimal Background */}
				<div className="absolute inset-0">
					<div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
					<div className="absolute top-1/3 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
					<div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
				</div>

				{/* Clean Navigation */}
				<nav className="relative z-50 flex items-center justify-between p-8">
					<div className="flex items-center space-x-3">
						<div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
							<div className="w-4 h-4 bg-black rounded-sm" />
						</div>
						<span className="text-lg font-medium text-white">VerifyHire</span>
					</div>
					
					<div className="hidden md:flex items-center space-x-8">
						<Link href="/" className="text-white hover:text-gray-300 transition-colors">Home</Link>
						<Link href="/detection" className="text-gray-400 hover:text-white transition-colors">Detection</Link>
						<Link href="/analytics" className="text-gray-400 hover:text-white transition-colors">Analytics</Link>
						<Link href="/features" className="text-gray-400 hover:text-white transition-colors">Features</Link>
						<Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link>
					</div>
					
					<button className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
						Get Started
					</button>
				</nav>

				{/* Minimal Floating Elements */}
				<div className="absolute inset-0 pointer-events-none">
					{/* Simple network lines */}
					<svg className="absolute inset-0 w-full h-full opacity-10">
						<line x1="20%" y1="30%" x2="80%" y2="70%" stroke="white" strokeWidth="1" />
						<line x1="80%" y1="30%" x2="20%" y2="70%" stroke="white" strokeWidth="1" />
					</svg>

					{/* Minimal floating cards */}
					<div className="absolute top-1/4 left-12 bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
						<div className="flex items-center space-x-2 mb-2">
							<div className="w-2 h-2 bg-green-400 rounded-full" />
							<span className="text-sm text-gray-300">Active</span>
						</div>
						<div className="text-lg font-semibold text-white">2,847</div>
						<div className="text-xs text-gray-400">Employees Verified</div>
					</div>

					<div className="absolute bottom-1/4 right-12 bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
						<div className="flex items-center space-x-2 mb-2">
							<div className="w-2 h-2 bg-yellow-400 rounded-full" />
							<span className="text-sm text-gray-300">Alert</span>
						</div>
						<div className="text-lg font-semibold text-white">14</div>
						<div className="text-xs text-gray-400">Potential Matches</div>
					</div>
				</div>

				{/* Hero Content */}
				<div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
					{/* Simple badge */}
					<div className="mb-8 flex items-center space-x-2 bg-gray-900/50 backdrop-blur-sm rounded-full px-6 py-2 border border-gray-800">
						<div className="w-2 h-2 bg-blue-400 rounded-full" />
						<span className="text-sm text-gray-300">Employee Verification Platform</span>
					</div>

					{/* Main Heading */}
					<h1 className="text-6xl md:text-8xl font-bold text-center mb-6 leading-tight">
						<span className="block text-white">Are We Hiring</span>
						<span className="block text-white">the Same Guy?</span>
					</h1>

					{/* Simple subtitle */}
					<p className="text-xl text-gray-400 text-center mb-12 max-w-2xl leading-relaxed">
						Detect dual employment conflicts with advanced verification technology
					</p>

					{/* Clean CTA buttons */}
					<div className="flex flex-col sm:flex-row gap-4 items-center">
						<button className="bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
							Start Verification
						</button>
						<button className="border border-gray-600 text-white px-8 py-3 rounded-lg font-medium hover:border-gray-400 transition-colors">
							Learn More
						</button>
					</div>
				</div>

				{/* Minimal bottom elements */}
				<div className="absolute bottom-8 left-8 text-gray-500 text-sm">
					Scroll to explore
				</div>

				<div className="absolute bottom-8 right-8 text-gray-500 text-sm">
					Enterprise Solution
				</div>
			</main>
		</HydrateClient>
	);
}