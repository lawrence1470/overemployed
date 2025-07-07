import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

interface TypographyProps {
	children: ReactNode;
	className?: string;
}

export function H1({ children, className }: TypographyProps) {
	return (
		<h1
			className={cn(
				"font-bold font-display text-6xl text-gradient leading-tight tracking-tight sm:text-7xl lg:text-8xl",
				className,
			)}
		>
			{children}
		</h1>
	);
}

export function H2({ children, className }: TypographyProps) {
	return (
		<h2
			className={cn(
				"font-display font-semibold text-4xl text-secondary-900 leading-tight tracking-tight sm:text-5xl lg:text-6xl",
				className,
			)}
		>
			{children}
		</h2>
	);
}

export function H3({ children, className }: TypographyProps) {
	return (
		<h3
			className={cn(
				"font-display font-semibold text-2xl text-secondary-900 leading-tight sm:text-3xl lg:text-4xl",
				className,
			)}
		>
			{children}
		</h3>
	);
}

export function H4({ children, className }: TypographyProps) {
	return (
		<h4
			className={cn(
				"font-display font-medium text-secondary-900 text-xl leading-tight sm:text-2xl",
				className,
			)}
		>
			{children}
		</h4>
	);
}

export function H5({ children, className }: TypographyProps) {
	return (
		<h5
			className={cn(
				"font-display font-medium text-lg text-secondary-900 leading-tight sm:text-xl",
				className,
			)}
		>
			{children}
		</h5>
	);
}

export function H6({ children, className }: TypographyProps) {
	return (
		<h6
			className={cn(
				"font-display font-medium text-base text-secondary-900 leading-tight sm:text-lg",
				className,
			)}
		>
			{children}
		</h6>
	);
}

export function Subtitle({ children, className }: TypographyProps) {
	return (
		<p
			className={cn(
				"font-body text-secondary-600 text-xl leading-relaxed sm:text-2xl",
				className,
			)}
		>
			{children}
		</p>
	);
}

export function Body({ children, className }: TypographyProps) {
	return (
		<p
			className={cn(
				"font-body text-base text-secondary-700 leading-relaxed sm:text-lg",
				className,
			)}
		>
			{children}
		</p>
	);
}

export function BodySmall({ children, className }: TypographyProps) {
	return (
		<p
			className={cn(
				"font-body text-secondary-600 text-sm leading-relaxed sm:text-base",
				className,
			)}
		>
			{children}
		</p>
	);
}

export function Caption({ children, className }: TypographyProps) {
	return (
		<p
			className={cn(
				"font-body text-secondary-500 text-xs leading-normal sm:text-sm",
				className,
			)}
		>
			{children}
		</p>
	);
}

export function Quote({ children, className }: TypographyProps) {
	return (
		<blockquote
			className={cn(
				"my-6 border-primary-400 border-l-4 pl-6 font-serif text-secondary-800 text-xl italic leading-relaxed sm:text-2xl",
				className,
			)}
		>
			{children}
		</blockquote>
	);
}

export function Script({ children, className }: TypographyProps) {
	return (
		<span
			className={cn(
				"font-script text-2xl text-primary-600 leading-normal sm:text-3xl",
				className,
			)}
		>
			{children}
		</span>
	);
}

export function Lead({ children, className }: TypographyProps) {
	return (
		<p
			className={cn(
				"font-body font-light text-lg text-secondary-600 leading-relaxed sm:text-xl",
				className,
			)}
		>
			{children}
		</p>
	);
}

export function Muted({ children, className }: TypographyProps) {
	return (
		<p
			className={cn(
				"font-body text-secondary-400 text-sm leading-normal",
				className,
			)}
		>
			{children}
		</p>
	);
}

export function Large({ children, className }: TypographyProps) {
	return (
		<div
			className={cn(
				"font-body font-semibold text-lg text-secondary-900 leading-normal",
				className,
			)}
		>
			{children}
		</div>
	);
}

export function Small({ children, className }: TypographyProps) {
	return (
		<small
			className={cn(
				"font-body font-medium text-secondary-500 text-sm leading-normal",
				className,
			)}
		>
			{children}
		</small>
	);
}

// Gradient text variants
export function GradientText({ children, className }: TypographyProps) {
	return (
		<span className={cn("font-semibold text-gradient", className)}>
			{children}
		</span>
	);
}

// Special display text for hero sections
export function HeroTitle({ children, className }: TypographyProps) {
	return (
		<h1
			className={cn(
				"animate-fade-in font-bold font-display text-6xl text-gradient leading-none tracking-tight sm:text-7xl lg:text-8xl xl:text-9xl",
				className,
			)}
		>
			{children}
		</h1>
	);
}

export function HeroSubtitle({ children, className }: TypographyProps) {
	return (
		<p
			className={cn(
				"animate-slide-up font-body font-light text-secondary-600 text-xl leading-relaxed sm:text-2xl lg:text-3xl",
				className,
			)}
		>
			{children}
		</p>
	);
}
