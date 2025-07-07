"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn, signUp } from "~/lib/auth-client";
import {
	type SignInInput,
	type SignUpInput,
	signInSchema,
	signUpSchema,
	validateField,
} from "~/lib/validation";

export function BusinessSignIn() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [companyName, setCompanyName] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [isSignUp, setIsSignUp] = useState(false);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const router = useRouter();

	const validateForm = () => {
		const schema = isSignUp ? signUpSchema : signInSchema;
		const data = isSignUp
			? { companyName, email, password }
			: { email, password };

		try {
			schema.parse(data);
			setFieldErrors({});
			return true;
		} catch (error) {
			if (error instanceof Error && "errors" in error) {
				const zodError = error as {
					errors: Array<{ path: string[]; message: string }>;
				};
				const errors: Record<string, string> = {};
				for (const err of zodError.errors) {
					const field = err.path[0];
					if (field) {
						errors[field] = err.message;
					}
				}
				setFieldErrors(errors);
			}
			return false;
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		// Validate form before submission
		if (!validateForm()) {
			setLoading(false);
			return;
		}

		try {
			if (isSignUp) {
				await signUp.email({
					email,
					password,
					name: companyName,
				});
			} else {
				await signIn.email({
					email,
					password,
				});
			}
			router.push("/dashboard");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Authentication failed");
		} finally {
			setLoading(false);
		}
	};

	const handleFieldBlur = (fieldName: string, value: string) => {
		const schema = isSignUp ? signUpSchema : signInSchema;
		const error = validateField(schema, fieldName, value);

		setFieldErrors((prev) => ({
			...prev,
			[fieldName]: error || "",
		}));
	};

	const handleFieldChange = (fieldName: string, value: string) => {
		// Clear error when user starts typing
		if (fieldErrors[fieldName]) {
			setFieldErrors((prev) => ({
				...prev,
				[fieldName]: "",
			}));
		}
	};

	const handleGoogleSignIn = async () => {
		try {
			setLoading(true);
			await signIn.social({
				provider: "google",
				callbackURL: "/dashboard",
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Google sign-in failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="mx-auto w-full max-w-md">
			<div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm">
				<div className="mb-6 text-center">
					<h2 className="mb-2 font-bold text-2xl text-white">
						{isSignUp ? "Create Business Account" : "Business Sign In"}
					</h2>
					<p className="text-gray-400">
						{isSignUp
							? "Start verifying employees with advanced detection"
							: "Access your employment verification dashboard"}
					</p>
				</div>

				{error && (
					<div className="mb-6 rounded-lg border border-red-500/30 bg-red-900/20 p-4">
						<p className="text-red-400 text-sm">{error}</p>
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					{isSignUp && (
						<div>
							<label
								htmlFor="companyName"
								className="mb-2 block font-medium text-gray-300 text-sm"
							>
								Company Name
							</label>
							<input
								type="text"
								id="companyName"
								value={companyName}
								onChange={(e) => {
									setCompanyName(e.target.value);
									handleFieldChange("companyName", e.target.value);
								}}
								onBlur={(e) => handleFieldBlur("companyName", e.target.value)}
								className={`w-full rounded-lg border px-4 py-2.5 text-white placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 ${
									fieldErrors.companyName
										? "border-red-500 bg-red-900/20 focus:ring-red-500"
										: "border-gray-700 bg-gray-800/50 focus:ring-blue-500"
								}`}
								placeholder="Enter your company name"
								required={isSignUp}
							/>
							{fieldErrors.companyName && (
								<p className="mt-1 text-red-400 text-sm">
									{fieldErrors.companyName}
								</p>
							)}
						</div>
					)}

					<div>
						<label
							htmlFor="email"
							className="mb-2 block font-medium text-gray-300 text-sm"
						>
							Business Email
						</label>
						<input
							type="email"
							id="email"
							value={email}
							onChange={(e) => {
								setEmail(e.target.value);
								handleFieldChange("email", e.target.value);
							}}
							onBlur={(e) => handleFieldBlur("email", e.target.value)}
							className={`w-full rounded-lg border px-4 py-2.5 text-white placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 ${
								fieldErrors.email
									? "border-red-500 bg-red-900/20 focus:ring-red-500"
									: "border-gray-700 bg-gray-800/50 focus:ring-blue-500"
							}`}
							placeholder="Enter your business email"
							required
						/>
						{fieldErrors.email && (
							<p className="mt-1 text-red-400 text-sm">{fieldErrors.email}</p>
						)}
					</div>

					<div>
						<label
							htmlFor="password"
							className="mb-2 block font-medium text-gray-300 text-sm"
						>
							Password
						</label>
						<input
							type="password"
							id="password"
							value={password}
							onChange={(e) => {
								setPassword(e.target.value);
								handleFieldChange("password", e.target.value);
							}}
							onBlur={(e) => handleFieldBlur("password", e.target.value)}
							className={`w-full rounded-lg border px-4 py-2.5 text-white placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 ${
								fieldErrors.password
									? "border-red-500 bg-red-900/20 focus:ring-red-500"
									: "border-gray-700 bg-gray-800/50 focus:ring-blue-500"
							}`}
							placeholder="Enter your password"
							required
						/>
						{fieldErrors.password && (
							<p className="mt-1 text-red-400 text-sm">
								{fieldErrors.password}
							</p>
						)}
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full rounded-lg bg-white px-6 py-2.5 font-medium text-black transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{loading
							? "Please wait..."
							: isSignUp
								? "Create Account"
								: "Sign In"}
					</button>
				</form>

				<div className="mt-4">
					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-gray-700 border-t"></div>
						</div>
						<div className="relative flex justify-center text-sm">
							<span className="bg-gray-900 px-2 text-gray-400">
								Or continue with
							</span>
						</div>
					</div>

					<button
						type="button"
						onClick={handleGoogleSignIn}
						disabled={loading}
						className="mt-3 flex w-full items-center justify-center space-x-2 rounded-lg bg-gray-800 px-6 py-2.5 font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<svg className="h-5 w-5" viewBox="0 0 24 24">
							<path
								fill="currentColor"
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
							/>
							<path
								fill="currentColor"
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
							/>
							<path
								fill="currentColor"
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
							/>
							<path
								fill="currentColor"
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
							/>
						</svg>
						<span>Google</span>
					</button>
				</div>

				<div className="mt-6 text-center">
					<button
						type="button"
						onClick={() => {
							setIsSignUp(!isSignUp);
							setFieldErrors({});
							setError("");
						}}
						className="text-blue-400 transition-colors hover:text-blue-300"
					>
						{isSignUp
							? "Already have an account? Sign in"
							: "Don't have an account? Create one"}
					</button>
				</div>
			</div>
		</div>
	);
}
