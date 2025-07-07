import { z } from "zod";

// Sign In Schema
export const signInSchema = z.object({
	email: z
		.string()
		.min(1, "Email is required")
		.email("Please enter a valid email address")
		.refine((email) => {
			// Basic business email validation (not personal domains)
			const personalDomains = [
				"gmail.com",
				"yahoo.com",
				"hotmail.com",
				"outlook.com",
			];
			const domain = email.split("@")[1]?.toLowerCase();
			return !personalDomains.includes(domain || "");
		}, "Please use a business email address"),
	password: z
		.string()
		.min(1, "Password is required")
		.min(8, "Password must be at least 8 characters long"),
});

// Sign Up Schema
export const signUpSchema = z.object({
	companyName: z
		.string()
		.min(1, "Company name is required")
		.min(2, "Company name must be at least 2 characters long")
		.max(100, "Company name must be less than 100 characters")
		.refine(
			(name) => /^[a-zA-Z0-9\s&.-]+$/.test(name),
			"Company name contains invalid characters",
		),
	email: z
		.string()
		.min(1, "Email is required")
		.email("Please enter a valid email address")
		.refine((email) => {
			// Business email validation
			const personalDomains = [
				"gmail.com",
				"yahoo.com",
				"hotmail.com",
				"outlook.com",
			];
			const domain = email.split("@")[1]?.toLowerCase();
			return !personalDomains.includes(domain || "");
		}, "Please use a business email address"),
	password: z
		.string()
		.min(1, "Password is required")
		.min(8, "Password must be at least 8 characters long")
		.regex(
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
			"Password must contain at least one uppercase letter, one lowercase letter, and one number",
		),
});

// Type exports
export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

// Validation helper function
export function validateField(
	schema: z.ZodObject<Record<string, z.ZodTypeAny>>,
	fieldName: string,
	value: unknown,
): string | null {
	try {
		const partialSchema = schema.pick({ [fieldName]: true } as Record<
			string,
			true
		>);
		partialSchema.parse({ [fieldName]: value });
		return null;
	} catch (error) {
		if (error instanceof z.ZodError) {
			return error.errors[0]?.message || "Invalid input";
		}
		return "Validation error";
	}
}
