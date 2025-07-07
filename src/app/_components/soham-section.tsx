"use client";

export function SohamSection() {
	return (
		<section className="relative min-h-screen bg-black text-white">
			{/* Minimal Background */}
			<div className="absolute inset-0">
				<div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
				<div className="absolute top-1/4 right-1/3 h-96 w-96 rounded-full bg-red-500/5 blur-3xl" />
				<div className="absolute bottom-1/3 left-1/4 h-96 w-96 rounded-full bg-orange-500/5 blur-3xl" />
			</div>

			{/* Minimal Floating Elements */}
			<div className="pointer-events-none absolute inset-0">
				{/* Simple network lines */}
				<svg className="absolute inset-0 h-full w-full opacity-10">
					<line
						x1="10%"
						y1="20%"
						x2="90%"
						y2="80%"
						stroke="white"
						strokeWidth="1"
					/>
					<line
						x1="90%"
						y1="20%"
						x2="10%"
						y2="80%"
						stroke="white"
						strokeWidth="1"
					/>
				</svg>

				{/* Minimal floating cards */}
				<div className="absolute top-32 right-8 hidden rounded-xl border border-gray-800 bg-gray-900/50 p-3 backdrop-blur-sm lg:block">
					<div className="mb-1 flex items-center space-x-2">
						<div className="h-2 w-2 rounded-full bg-red-400" />
						<span className="text-gray-300 text-xs">Portfolio Alert</span>
					</div>
					<div className="font-semibold text-base text-white">4</div>
					<div className="text-gray-400 text-xs">Companies Funded</div>
				</div>

				<div className="absolute bottom-32 left-8 hidden rounded-xl border border-gray-800 bg-gray-900/50 p-3 backdrop-blur-sm lg:block">
					<div className="mb-1 flex items-center space-x-2">
						<div className="h-2 w-2 rounded-full bg-orange-400" />
						<span className="text-gray-300 text-xs">Efficiency Drop</span>
					</div>
					<div className="font-semibold text-base text-white">90%</div>
					<div className="text-gray-400 text-xs">Per Employee</div>
				</div>
			</div>

			{/* Content */}
			<div className="relative z-10 flex flex-col items-center justify-center px-4 py-20">
				{/* Simple badge */}
				<div className="mb-6 flex items-center space-x-2 rounded-full border border-gray-800 bg-gray-900/50 px-6 py-2 backdrop-blur-sm">
					<div className="h-2 w-2 rounded-full bg-red-400" />
					<span className="text-gray-300 text-sm">
						🧠 Serial Optimization Alert
					</span>
				</div>

				{/* Main Content */}
				<div className="max-w-3xl text-center">
					<h2 className="mb-6 font-bold text-4xl text-white md:text-5xl">
						Don't Hire Another Soham Parekh
					</h2>

					<p className="mb-8 text-gray-400 text-xl">
						He's smart. Too smart. For all four of your competitors.
					</p>

					<div className="mb-8 flex items-center justify-center space-x-4 text-4xl">
						<span>🧢</span>
						<span className="text-gray-400">→</span>
						<span>🧑‍💻</span>
						<span className="text-gray-400">→</span>
						<span>👻</span>
					</div>

					<div className="space-y-4 text-gray-400">
						<p className="text-xl">You thought you hired a 10x engineer.</p>
						<p className="text-xl">
							Turns out you hired 10% of a 10x engineer.
						</p>
						<p className="text-lg">
							Stop funding a man's entire Series A portfolio with your payroll.
						</p>
					</div>

					{/* Clean Stats */}
					<div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
						<div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm">
							<div className="mb-2 font-bold text-2xl text-white">10%</div>
							<div className="text-gray-400 text-sm">
								of attention per employer
							</div>
						</div>
						<div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm">
							<div className="mb-2 font-bold text-2xl text-white">4x</div>
							<div className="text-gray-400 text-sm">
								salary dilution factor
							</div>
						</div>
						<div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm">
							<div className="mb-2 font-bold text-2xl text-white">$250K</div>
							<div className="text-gray-400 text-sm">
								wasted on ghost productivity
							</div>
						</div>
					</div>

					{/* Clean CTA */}
					<div className="mt-12">
						<a
							href="/sign-in"
							className="inline-block rounded-lg bg-white px-8 py-3 font-medium text-black transition-colors hover:bg-gray-100"
						>
							Detect the Next Soham
						</a>
					</div>
				</div>
			</div>
		</section>
	);
}
