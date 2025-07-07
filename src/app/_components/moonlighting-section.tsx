"use client";

import { useEffect, useRef } from "react";

export function MoonlightingSection() {
	const sectionRef = useRef<HTMLElement>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						entry.target.classList.add("animate-in");
					}
				}
			},
			{ threshold: 0.1 },
		);

		const elements = sectionRef.current?.querySelectorAll(".fade-in");
		if (elements) {
			for (const el of elements) {
				observer.observe(el);
			}
		}

		return () => observer.disconnect();
	}, []);

	return (
		<section
			ref={sectionRef}
			className="relative min-h-screen overflow-hidden bg-black text-white"
		>
			{/* Enhanced Background with animations */}
			<div className="absolute inset-0">
				<div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
				<div className="absolute top-1/4 right-1/3 h-96 w-96 animate-pulse rounded-full bg-blue-500/10 blur-3xl" />
				<div
					className="absolute bottom-1/3 left-1/4 h-96 w-96 animate-pulse rounded-full bg-purple-500/10 blur-3xl"
					style={{ animationDelay: "1s" }}
				/>
				<div
					className="absolute top-1/2 left-1/2 h-64 w-64 animate-pulse rounded-full bg-cyan-500/5 blur-2xl"
					style={{ animationDelay: "2s" }}
				/>
			</div>

			{/* Animated Floating Elements */}
			<div className="pointer-events-none absolute inset-0">
				{/* Animated network lines */}
				<svg className="absolute inset-0 h-full w-full opacity-20" aria-hidden="true">
					<defs>
						<linearGradient
							id="lineGradient"
							x1="0%"
							y1="0%"
							x2="100%"
							y2="100%"
						>
							<stop
								offset="0%"
								stopColor="rgb(59, 130, 246)"
								stopOpacity="0.5"
							/>
							<stop
								offset="50%"
								stopColor="rgb(147, 51, 234)"
								stopOpacity="0.8"
							/>
							<stop
								offset="100%"
								stopColor="rgb(59, 130, 246)"
								stopOpacity="0.5"
							/>
						</linearGradient>
					</defs>
					<line
						x1="10%"
						y1="20%"
						x2="90%"
						y2="80%"
						stroke="url(#lineGradient)"
						strokeWidth="2"
						className="animate-pulse"
					/>
					<line
						x1="90%"
						y1="20%"
						x2="10%"
						y2="80%"
						stroke="url(#lineGradient)"
						strokeWidth="2"
						className="animate-pulse"
						style={{ animationDelay: "0.5s" }}
					/>
					<circle
						cx="10%"
						cy="20%"
						r="4"
						fill="rgb(59, 130, 246)"
						className="animate-ping"
					/>
					<circle
						cx="90%"
						cy="80%"
						r="4"
						fill="rgb(147, 51, 234)"
						className="animate-ping"
						style={{ animationDelay: "1s" }}
					/>
					<circle
						cx="90%"
						cy="20%"
						r="4"
						fill="rgb(6, 182, 212)"
						className="animate-ping"
						style={{ animationDelay: "1.5s" }}
					/>
					<circle
						cx="10%"
						cy="80%"
						r="4"
						fill="rgb(59, 130, 246)"
						className="animate-ping"
						style={{ animationDelay: "2s" }}
					/>
				</svg>

				{/* Enhanced floating cards with animations */}
				<div className="absolute top-32 right-8 hidden transform animate-float rounded-xl border border-gray-800 bg-gray-900/70 p-3 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-red-500/50 lg:block">
					<div className="mb-1 flex items-center space-x-2">
						<div className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
						<span className="text-gray-300 text-xs">Detected</span>
					</div>
					<div className="font-semibold text-base text-white">127</div>
					<div className="text-gray-400 text-xs">Dual Employment Cases</div>
				</div>

				<div className="absolute bottom-32 left-8 hidden transform animate-float-delayed rounded-xl border border-gray-800 bg-gray-900/70 p-3 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-orange-500/50 lg:block">
					<div className="mb-1 flex items-center space-x-2">
						<div className="h-2 w-2 animate-pulse rounded-full bg-orange-400" />
						<span className="text-gray-300 text-xs">Flagged</span>
					</div>
					<div className="font-semibold text-base text-white">23</div>
					<div className="text-gray-400 text-xs">Calendar Conflicts</div>
				</div>

				{/* Additional floating elements */}
				<div className="absolute top-1/2 right-16 hidden animate-float-slow rounded-lg border border-gray-800 bg-gray-900/60 p-2 backdrop-blur-sm xl:block">
					<div className="flex items-center space-x-1">
						<div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
						<span className="text-gray-300 text-xs">Active</span>
					</div>
				</div>
			</div>

			{/* Content with enhanced animations */}
			<div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-20">
				{/* Enhanced badge */}
				<div className="fade-in mb-6 flex items-center space-x-2 rounded-full border border-gray-800 bg-gray-900/70 px-6 py-2 backdrop-blur-sm transition-all duration-300 hover:border-orange-500/50 hover:bg-gray-900/90">
					<div className="h-2 w-2 animate-pulse rounded-full bg-orange-400" />
					<span className="text-gray-300 text-sm">Detection Intelligence</span>
				</div>

				{/* Main Content */}
				<div className="max-w-3xl text-center">
					<h2 className="fade-in mb-6 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text font-bold text-4xl text-transparent text-white md:text-5xl">
						Is Your Dev Moonlighting... or Sunsurfing? 🫣
					</h2>

					<div className="fade-in space-y-4 text-gray-400">
						<p className="transform text-xl transition-all duration-300 hover:text-gray-300">
							He's not burned out—he's just double-booked.
						</p>
						<p className="transform text-lg transition-all duration-300 hover:text-gray-300">
							If your engineer needs a calendar for his calendars, you need us.
						</p>
					</div>

					{/* Enhanced Stats with staggered animations */}
					<div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
						<div className="fade-in group transform rounded-xl border border-gray-800 bg-gray-900/70 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-blue-500/50 hover:bg-gray-900/90">
							<div className="mb-2 font-bold text-2xl text-white transition-colors group-hover:text-blue-400">
								47%
							</div>
							<div className="text-gray-400 text-sm transition-colors group-hover:text-gray-300">
								remote workers juggle multiple jobs
							</div>
						</div>
						<div
							className="fade-in group transform rounded-xl border border-gray-800 bg-gray-900/70 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-purple-500/50 hover:bg-gray-900/90"
							style={{ animationDelay: "0.1s" }}
						>
							<div className="mb-2 font-bold text-2xl text-white transition-colors group-hover:text-purple-400">
								2.3x
							</div>
							<div className="text-gray-400 text-sm transition-colors group-hover:text-gray-300">
								productivity loss from context switching
							</div>
						</div>
						<div
							className="fade-in group transform rounded-xl border border-gray-800 bg-gray-900/70 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-cyan-500/50 hover:bg-gray-900/90"
							style={{ animationDelay: "0.2s" }}
						>
							<div className="mb-2 font-bold text-2xl text-white transition-colors group-hover:text-cyan-400">
								$12K
							</div>
							<div className="text-gray-400 text-sm transition-colors group-hover:text-gray-300">
								average cost of a bad hire
							</div>
						</div>
					</div>

					{/* Enhanced CTA */}
					<div className="fade-in mt-12">
						<a
							href="/sign-in"
							className="inline-block transform rounded-lg bg-white px-8 py-3 font-medium text-black transition-all duration-300 hover:scale-105 hover:bg-gray-100 hover:shadow-lg hover:shadow-white/20 active:scale-95"
						>
							Stop the Double-Booking
						</a>
					</div>
				</div>
			</div>

			<style jsx>{`
				@keyframes float {
					0%, 100% { transform: translateY(0px); }
					50% { transform: translateY(-10px); }
				}
				
				@keyframes float-delayed {
					0%, 100% { transform: translateY(0px); }
					50% { transform: translateY(-15px); }
				}
				
				@keyframes float-slow {
					0%, 100% { transform: translateY(0px); }
					50% { transform: translateY(-5px); }
				}
				
				.animate-float {
					animation: float 3s ease-in-out infinite;
				}
				
				.animate-float-delayed {
					animation: float-delayed 4s ease-in-out infinite;
					animation-delay: 1s;
				}
				
				.animate-float-slow {
					animation: float-slow 5s ease-in-out infinite;
					animation-delay: 2s;
				}
				
				.fade-in {
					opacity: 0;
					transform: translateY(20px);
					transition: all 0.6s ease-out;
				}
				
				.fade-in.animate-in {
					opacity: 1;
					transform: translateY(0);
				}
			`}</style>
		</section>
	);
}
