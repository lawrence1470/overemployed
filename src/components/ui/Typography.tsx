import { cn } from "~/lib/utils";
import { type ReactNode } from "react";

interface TypographyProps {
  children: ReactNode;
  className?: string;
}

export function H1({ children, className }: TypographyProps) {
  return (
    <h1 className={cn(
      "font-display text-6xl sm:text-7xl lg:text-8xl font-bold text-gradient leading-tight tracking-tight",
      className
    )}>
      {children}
    </h1>
  );
}

export function H2({ children, className }: TypographyProps) {
  return (
    <h2 className={cn(
      "font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-secondary-900 leading-tight tracking-tight",
      className
    )}>
      {children}
    </h2>
  );
}

export function H3({ children, className }: TypographyProps) {
  return (
    <h3 className={cn(
      "font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-secondary-900 leading-tight",
      className
    )}>
      {children}
    </h3>
  );
}

export function H4({ children, className }: TypographyProps) {
  return (
    <h4 className={cn(
      "font-display text-xl sm:text-2xl font-medium text-secondary-900 leading-tight",
      className
    )}>
      {children}
    </h4>
  );
}

export function H5({ children, className }: TypographyProps) {
  return (
    <h5 className={cn(
      "font-display text-lg sm:text-xl font-medium text-secondary-900 leading-tight",
      className
    )}>
      {children}
    </h5>
  );
}

export function H6({ children, className }: TypographyProps) {
  return (
    <h6 className={cn(
      "font-display text-base sm:text-lg font-medium text-secondary-900 leading-tight",
      className
    )}>
      {children}
    </h6>
  );
}

export function Subtitle({ children, className }: TypographyProps) {
  return (
    <p className={cn(
      "font-body text-xl sm:text-2xl text-secondary-600 leading-relaxed",
      className
    )}>
      {children}
    </p>
  );
}

export function Body({ children, className }: TypographyProps) {
  return (
    <p className={cn(
      "font-body text-base sm:text-lg text-secondary-700 leading-relaxed",
      className
    )}>
      {children}
    </p>
  );
}

export function BodySmall({ children, className }: TypographyProps) {
  return (
    <p className={cn(
      "font-body text-sm sm:text-base text-secondary-600 leading-relaxed",
      className
    )}>
      {children}
    </p>
  );
}

export function Caption({ children, className }: TypographyProps) {
  return (
    <p className={cn(
      "font-body text-xs sm:text-sm text-secondary-500 leading-normal",
      className
    )}>
      {children}
    </p>
  );
}

export function Quote({ children, className }: TypographyProps) {
  return (
    <blockquote className={cn(
      "font-serif text-xl sm:text-2xl text-secondary-800 italic leading-relaxed border-l-4 border-primary-400 pl-6 my-6",
      className
    )}>
      {children}
    </blockquote>
  );
}

export function Script({ children, className }: TypographyProps) {
  return (
    <span className={cn(
      "font-script text-2xl sm:text-3xl text-primary-600 leading-normal",
      className
    )}>
      {children}
    </span>
  );
}

export function Lead({ children, className }: TypographyProps) {
  return (
    <p className={cn(
      "font-body text-lg sm:text-xl text-secondary-600 leading-relaxed font-light",
      className
    )}>
      {children}
    </p>
  );
}

export function Muted({ children, className }: TypographyProps) {
  return (
    <p className={cn(
      "font-body text-sm text-secondary-400 leading-normal",
      className
    )}>
      {children}
    </p>
  );
}

export function Large({ children, className }: TypographyProps) {
  return (
    <div className={cn(
      "font-body text-lg font-semibold text-secondary-900 leading-normal",
      className
    )}>
      {children}
    </div>
  );
}

export function Small({ children, className }: TypographyProps) {
  return (
    <small className={cn(
      "font-body text-sm font-medium text-secondary-500 leading-normal",
      className
    )}>
      {children}
    </small>
  );
}

// Gradient text variants
export function GradientText({ children, className }: TypographyProps) {
  return (
    <span className={cn(
      "text-gradient font-semibold",
      className
    )}>
      {children}
    </span>
  );
}

// Special display text for hero sections
export function HeroTitle({ children, className }: TypographyProps) {
  return (
    <h1 className={cn(
      "font-display text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-bold text-gradient leading-none tracking-tight animate-fade-in",
      className
    )}>
      {children}
    </h1>
  );
}

export function HeroSubtitle({ children, className }: TypographyProps) {
  return (
    <p className={cn(
      "font-body text-xl sm:text-2xl lg:text-3xl text-secondary-600 leading-relaxed font-light animate-slide-up",
      className
    )}>
      {children}
    </p>
  );
}