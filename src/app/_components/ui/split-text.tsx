"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

// Register GSAP plugins
if (typeof window !== "undefined") {
	gsap.registerPlugin(ScrollTrigger);
}

interface SplitTextProps {
	text: string;
	className?: string;
	delay?: number;
	duration?: number;
	ease?: string;
	splitType?: "chars" | "words" | "lines";
	from?: Record<string, any>;
	to?: Record<string, any>;
	threshold?: number;
	rootMargin?: string;
	textAlign?: "left" | "center" | "right";
	onLetterAnimationComplete?: () => void;
}

const SplitText = ({
	text,
	className = "",
	delay = 100,
	duration = 0.6,
	ease = "power3.out",
	splitType = "chars",
	from = { opacity: 0, y: 40 },
	to = { opacity: 1, y: 0 },
	threshold = 0.3,
	rootMargin = "0px",
	textAlign = "center",
	onLetterAnimationComplete,
}: SplitTextProps) => {
	const ref = useRef<HTMLParagraphElement>(null);
	const animationCompletedRef = useRef(false);
	const scrollTriggerRef = useRef<ScrollTrigger | null>(null);

	useEffect(() => {
		if (typeof window === "undefined" || !ref.current || !text) return;

		const el = ref.current;

		animationCompletedRef.current = false;

		// Simple text splitting without SplitText plugin
		const splitText = (element: HTMLElement, type: string) => {
			const textContent = element.textContent || "";
			const splitElements: HTMLElement[] = [];

			if (type === "chars") {
				// Split by characters
				const chars = textContent.split("");
				element.innerHTML = "";

				chars.forEach((char, index) => {
					const span = document.createElement("span");
					span.textContent = char === " " ? "\u00A0" : char; // Non-breaking space
					span.style.display = "inline-block";
					span.style.position = "relative";
					span.setAttribute("data-char", index.toString());
					element.appendChild(span);
					splitElements.push(span);
				});
			} else if (type === "words") {
				// Split by words
				const words = textContent.split(" ");
				element.innerHTML = "";

				words.forEach((word, index) => {
					const span = document.createElement("span");
					span.textContent = word;
					span.style.display = "inline-block";
					span.style.position = "relative";
					span.setAttribute("data-word", index.toString());
					element.appendChild(span);

					if (index < words.length - 1) {
						element.appendChild(document.createTextNode(" "));
					}

					splitElements.push(span);
				});
			}

			return splitElements;
		};

		let targets: HTMLElement[] = [];

		try {
			targets = splitText(el, splitType);
		} catch (error) {
			console.error("Failed to create SplitText:", error);
			return;
		}

		if (!targets || targets.length === 0) {
			console.warn("No targets found for SplitText animation");
			return;
		}

		// Set will-change for performance
		targets.forEach((t) => {
			t.style.willChange = "transform, opacity";
		});

		const startPct = (1 - threshold) * 100;
		const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
		const marginValue = marginMatch
			? Number.parseFloat(marginMatch[1] || "0")
			: 0;
		const marginUnit = marginMatch ? marginMatch[2] || "px" : "px";
		const sign =
			marginValue < 0
				? `-=${Math.abs(marginValue)}${marginUnit}`
				: `+=${marginValue}${marginUnit}`;
		const start = `top ${startPct}%${sign}`;

		const tl = gsap.timeline({
			scrollTrigger: {
				trigger: el,
				start,
				toggleActions: "play none none none",
				once: true,
				onToggle: (self) => {
					scrollTriggerRef.current = self;
				},
			},
			smoothChildTiming: true,
			onComplete: () => {
				animationCompletedRef.current = true;
				gsap.set(targets, {
					...to,
					clearProps: "willChange",
					immediateRender: true,
				});
				onLetterAnimationComplete?.();
			},
		});

		tl.set(targets, { ...from, immediateRender: false, force3D: true });
		tl.to(targets, {
			...to,
			duration,
			ease,
			stagger: delay / 1000,
			force3D: true,
		});

		return () => {
			tl.kill();
			if (scrollTriggerRef.current) {
				scrollTriggerRef.current.kill();
				scrollTriggerRef.current = null;
			}
			gsap.killTweensOf(targets);

			// Restore original text
			if (el) {
				el.innerHTML = text || "";
			}
		};
	}, [
		text,
		delay,
		duration,
		ease,
		splitType,
		from,
		to,
		threshold,
		rootMargin,
		onLetterAnimationComplete,
	]);

	return (
		<p
			ref={ref}
			className={`split-parent inline-block overflow-hidden whitespace-normal ${className}`}
			style={{
				textAlign,
				wordWrap: "break-word",
			}}
		>
			{text}
		</p>
	);
};

export default SplitText;
