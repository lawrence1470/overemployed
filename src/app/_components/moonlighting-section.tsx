"use client";

export function MoonlightingSection() {
	return (
		<section className="relative min-h-screen bg-black text-white">
			{/* Minimal Background */}
			<div className="absolute inset-0">
				<div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
				<div className="absolute top-1/4 right-1/3 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl" />
				<div className="absolute bottom-1/3 left-1/4 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl" />
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
						<span className="text-gray-300 text-xs">Detected</span>
					</div>
					<div className="font-semibold text-base text-white">127</div>
					<div className="text-gray-400 text-xs">Dual Employment Cases</div>
				</div>

				<div className="absolute bottom-32 left-8 hidden rounded-xl border border-gray-800 bg-gray-900/50 p-3 backdrop-blur-sm lg:block">
					<div className="mb-1 flex items-center space-x-2">
						<div className="h-2 w-2 rounded-full bg-orange-400" />
						<span className="text-gray-300 text-xs">Flagged</span>
					</div>
					<div className="font-semibold text-base text-white">23</div>
					<div className="text-gray-400 text-xs">Calendar Conflicts</div>
				</div>
			</div>

			{/* Content */}
			<div className="relative z-10 flex flex-col items-center justify-center px-4 py-20">
				{/* Simple badge */}
				<div className="mb-6 flex items-center space-x-2 rounded-full border border-gray-800 bg-gray-900/50 px-6 py-2 backdrop-blur-sm">
					<div className="h-2 w-2 rounded-full bg-orange-400" />
					<span className="text-gray-300 text-sm">Detection Intelligence</span>
				</div>

				{/* Main Content */}
				<div className="max-w-3xl text-center">
					<h2 className="mb-6 font-bold text-4xl text-white md:text-5xl">
						Is Your Dev Moonlighting... or Sunsurfing? 🫣
					</h2>

					<div className="space-y-4 text-gray-400">
						<p className="text-xl">
							He's not burned out—he's just double-booked.
						</p>
						<p className="text-lg">
							If your engineer needs a calendar for his calendars, you need us.
						</p>
					</div>

					{/* Clean Stats */}
					<div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
						<div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm">
							<div className="mb-2 font-bold text-2xl text-white">47%</div>
							<div className="text-gray-400 text-sm">
								remote workers juggle multiple jobs
							</div>
						</div>
						<div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm">
							<div className="mb-2 font-bold text-2xl text-white">2.3x</div>
							<div className="text-gray-400 text-sm">
								productivity loss from context switching
							</div>
						</div>
						<div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm">
							<div className="mb-2 font-bold text-2xl text-white">$12K</div>
							<div className="text-gray-400 text-sm">
								average cost of a bad hire
							</div>
						</div>
					</div>

					{/* Clean CTA */}
					<div className="mt-12">
						<a
							href="/sign-in"
							className="inline-block rounded-lg bg-white px-8 py-3 font-medium text-black transition-colors hover:bg-gray-100"
						>
							Stop the Double-Booking
						</a>
					</div>
				</div>
			</div>
		</section>
	);
}
