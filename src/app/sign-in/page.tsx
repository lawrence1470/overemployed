import { BusinessSignIn } from "~/app/_components/auth/business-sign-in";

export default function SignInPage() {
	return (
		<main className="relative min-h-screen overflow-hidden bg-black text-white">
			{/* Subtle Background */}
			<div className="absolute inset-0">
				<div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
				<div className="absolute top-1/3 left-1/3 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl" />
				<div className="absolute right-1/3 bottom-1/3 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl" />
			</div>

			{/* Navigation */}
			<nav className="relative z-50 flex items-center justify-between p-8">
				<div className="flex items-center space-x-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
						<div className="h-4 w-4 rounded-sm bg-black" />
					</div>
					<span className="font-medium text-lg text-white">VerifyHire</span>
				</div>

				<div className="hidden items-center space-x-8 md:flex">
					<a
						href="/"
						className="text-gray-400 transition-colors hover:text-white"
					>
						Home
					</a>
					<a
						href="/features"
						className="text-gray-400 transition-colors hover:text-white"
					>
						Features
					</a>
					<a
						href="/pricing"
						className="text-gray-400 transition-colors hover:text-white"
					>
						Pricing
					</a>
				</div>

				<a
					href="/"
					className="text-gray-400 transition-colors hover:text-white"
				>
					← Back to Home
				</a>
			</nav>

			{/* Sign In Content */}
			<div
				className="relative z-10 flex flex-col items-center justify-center px-4 py-8"
				style={{ minHeight: "calc(100vh - 120px)" }}
			>
				<div className="w-full max-w-md">
					{/* Header */}
					<div className="mb-6 text-center">
						<h1 className="mb-3 font-bold text-3xl text-white">Welcome Back</h1>
						<p className="text-base text-gray-400">
							Sign in to your business account to continue verifying employees
						</p>
					</div>

					{/* Sign In Form */}
					<BusinessSignIn />

					{/* Additional Info */}
					<div className="mt-6 text-center">
						<p className="text-gray-500 text-xs">
							By signing in, you agree to our{" "}
							<a
								href="/terms"
								className="text-blue-400 transition-colors hover:text-blue-300"
							>
								Terms of Service
							</a>{" "}
							and{" "}
							<a
								href="/privacy"
								className="text-blue-400 transition-colors hover:text-blue-300"
							>
								Privacy Policy
							</a>
						</p>
					</div>
				</div>
			</div>

			{/* Decorative Elements */}
			<div className="pointer-events-none absolute inset-0">
				<svg className="absolute inset-0 h-full w-full opacity-5">
					<line
						x1="20%"
						y1="20%"
						x2="80%"
						y2="80%"
						stroke="white"
						strokeWidth="1"
					/>
					<line
						x1="80%"
						y1="20%"
						x2="20%"
						y2="80%"
						stroke="white"
						strokeWidth="1"
					/>
				</svg>
			</div>

			{/* Bottom Elements */}
			<div className="absolute bottom-8 left-8 text-gray-500 text-sm">
				Enterprise Security
			</div>

			<div className="absolute right-8 bottom-8 text-gray-500 text-sm">
				24/7 Support
			</div>
		</main>
	);
}
