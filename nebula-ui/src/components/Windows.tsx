import { createSignal, onCleanup, onMount } from "solid-js";
import type { JSX } from "solid-js";

type WindowsProps = {
	title: string;
	icon?: string;
	onClose: () => void;
	onMinimize?: () => void;
	children: JSX.Element;
	width?: string;
	height?: string;
	top?: string;
	left?: string;
	background?: string;
	zIndex?: number;
	onFocus?: () => void;
};

export default function Windows(props: WindowsProps) {
	const ANIMATION_MS = 220;
	const [position, setPosition] = createSignal<{ x: number; y: number } | null>(null);
	const [isMaximized, setIsMaximized] = createSignal(false);
	const [isVisible, setIsVisible] = createSignal(false);
	const [isClosing, setIsClosing] = createSignal(false);
	const [isMinimizing, setIsMinimizing] = createSignal(false);
	let sectionRef: HTMLElement | undefined;
	let closeTimer: number | null = null;
	let minimizeTimer: number | null = null;

	let dragMoveListener: ((event: PointerEvent) => void) | null = null;
	let dragEndListener: ((event: PointerEvent) => void) | null = null;

	const clearDragListeners = () => {
		if (dragMoveListener) {
			window.removeEventListener("pointermove", dragMoveListener);
			dragMoveListener = null;
		}

		if (dragEndListener) {
			window.removeEventListener("pointerup", dragEndListener);
			window.removeEventListener("pointercancel", dragEndListener);
			dragEndListener = null;
		}
	};

	onCleanup(() => {
		clearDragListeners();

		if (closeTimer !== null) {
			window.clearTimeout(closeTimer);
		}

		if (minimizeTimer !== null) {
			window.clearTimeout(minimizeTimer);
		}
	});

	onMount(() => {
		window.requestAnimationFrame(() => {
			setIsVisible(true);
		});
	});

	const handleHeaderPointerDown: JSX.EventHandlerUnion<HTMLElement, PointerEvent> = (event) => {
		props.onFocus?.();

		if (isClosing() || isMinimizing()) {
			return;
		}

		if (isMaximized()) {
			return;
		}

		const target = event.target as HTMLElement | null;
		if (target?.closest("button")) {
			return;
		}

		if (!sectionRef) {
			return;
		}

		const rect = sectionRef.getBoundingClientRect();
		const pointerOffsetX = event.clientX - rect.left;
		const pointerOffsetY = event.clientY - rect.top;

		clearDragListeners();

		dragMoveListener = (moveEvent: PointerEvent) => {
			setPosition({
				x: moveEvent.clientX - pointerOffsetX,
				y: moveEvent.clientY - pointerOffsetY,
			});
		};

		dragEndListener = () => {
			clearDragListeners();
		};

		window.addEventListener("pointermove", dragMoveListener);
		window.addEventListener("pointerup", dragEndListener);
		window.addEventListener("pointercancel", dragEndListener);
	};

	const startExitAnimation = (type: "close" | "minimize") => {
		if (isClosing() || isMinimizing()) {
			return;
		}

		setIsVisible(false);

		if (type === "close") {
			setIsClosing(true);
			closeTimer = window.setTimeout(() => {
				props.onClose();
			}, ANIMATION_MS);
			return;
		}

		setIsMinimizing(true);
		minimizeTimer = window.setTimeout(() => {
			props.onMinimize?.();
		}, ANIMATION_MS);
	};

	const handleMinimize = () => {
		setIsMaximized(false);
		startExitAnimation("minimize");
	};

	const handleClose = () => {
		startExitAnimation("close");
	};

	const handleMaximize = () => {
		setIsMaximized((value) => !value);
	};

	return (
		<section
			ref={sectionRef}
			style={{
				opacity: isVisible() ? "1" : "0",
				position: "absolute",
				top: isMaximized() ? "0" : position() ? `${position()!.y}px` : props.top ?? "50%",
				left: isMaximized() ? "0" : position() ? `${position()!.x}px` : props.left ?? "50%",
				transform: `${isMaximized() ? "none" : position() ? "none" : "translate(-50%, -50%)"} ${
					isVisible() ? "scale(1)" : isMinimizing() ? "translateY(18px) scale(0.92)" : "scale(0.94)"
				}`,
				width: isMaximized() ? "100%" : props.width ?? "min(900px, 95vw)",
				height: isMaximized()
						? "100%"
						: props.height ?? "min(600px, 84vh)",
				background: props.background ?? "rgba(10,12,32,0.92)",
				"z-index": props.zIndex?.toString() ?? "10",
				border: "1px solid rgba(255,255,255,0.12)",
				"border-radius": isMaximized() ? "0" : "16px",
				"backdrop-filter": "blur(18px)",
				"box-shadow": "0 24px 70px rgba(0,0,0,0.45)",
				transition:
					"top 220ms ease, left 220ms ease, width 220ms ease, height 220ms ease, transform 220ms ease, border-radius 220ms ease, opacity 220ms ease",
				display: "flex",
				"flex-direction": "column",
				overflow: "hidden",
				"pointer-events": isClosing() || isMinimizing() ? "none" : "auto",
			}}
			onPointerDown={() => props.onFocus?.()}
		>
			<header
				onPointerDown={handleHeaderPointerDown}
				style={{
					padding: "0.85rem 1rem",
					border: "1px solid rgba(255,255,255,0.08)",
					"border-left": "none",
					"border-right": "none",
					"border-top": "none",
					display: "flex",
					"align-items": "center",
					"justify-content": "space-between",
					gap: "0.75rem",
					cursor: "move",
					"user-select": "none",
				}}
			>
				<div style={{ display: "flex", "align-items": "center", gap: "0.55rem" }}>
					{props.icon && <span style={{ "font-size": "1.15rem" }}>{props.icon}</span>}
					<strong style={{ color: "#ececff", "font-size": "0.98rem" }}>{props.title}</strong>
				</div>
				<div style={{ display: "flex", "align-items": "center", gap: "0.4rem" }}>
					<button
						type="button"
						onClick={handleMinimize}
						disabled={isClosing() || isMinimizing()}
						style={{
							border: "1px solid rgba(255,255,255,0.2)",
							background: "rgba(255,255,255,0.06)",
							color: "#d0d0ff",
							"border-radius": "8px",
							padding: "0.32rem 0.55rem",
							cursor: "pointer",
						}}
						aria-label={`Minimize ${props.title}`}
					>
						−
					</button>
					<button
						type="button"
						onClick={handleMaximize}
						disabled={isClosing() || isMinimizing()}
						style={{
							border: "1px solid rgba(255,255,255,0.2)",
							background: "rgba(255,255,255,0.06)",
							color: "#d0d0ff",
							"border-radius": "8px",
							padding: "0.32rem 0.55rem",
							cursor: "pointer",
						}}
						aria-label={`${isMaximized() ? "Restore" : "Maximize"} ${props.title}`}
					>
						{isMaximized() ? "❐" : "□"}
					</button>
					<button
						type="button"
						onClick={handleClose}
						disabled={isClosing() || isMinimizing()}
						style={{
							border: "1px solid rgba(255,255,255,0.2)",
							background: "rgba(255,255,255,0.06)",
							color: "#d0d0ff",
							"border-radius": "8px",
							padding: "0.32rem 0.55rem",
							cursor: "pointer",
						}}
						aria-label={`Close ${props.title}`}
					>
						✕
					</button>
				</div>
			</header>

			{props.children}
		</section>
	);
}
