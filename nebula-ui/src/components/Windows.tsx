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
	const MIN_WIDTH = 420;
	const MIN_HEIGHT = 280;
	const [position, setPosition] = createSignal<{ x: number; y: number } | null>(null);
	const [size, setSize] = createSignal<{ width: number; height: number } | null>(null);
	const [isMaximized, setIsMaximized] = createSignal(false);
	const [isDragging, setIsDragging] = createSignal(false);
	const [isResizing, setIsResizing] = createSignal(false);
	const [isVisible, setIsVisible] = createSignal(false);
	const [isClosing, setIsClosing] = createSignal(false);
	const [isMinimizing, setIsMinimizing] = createSignal(false);
	let sectionRef: HTMLElement | undefined;
	let closeTimer: number | null = null;
	let minimizeTimer: number | null = null;

	let dragMoveListener: ((event: PointerEvent) => void) | null = null;
	let dragEndListener: ((event: PointerEvent) => void) | null = null;
	let resizeMoveListener: ((event: PointerEvent) => void) | null = null;
	let resizeEndListener: ((event: PointerEvent) => void) | null = null;

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

		setIsDragging(false);
	};

	const clearResizeListeners = () => {
		if (resizeMoveListener) {
			window.removeEventListener("pointermove", resizeMoveListener);
			resizeMoveListener = null;
		}

		if (resizeEndListener) {
			window.removeEventListener("pointerup", resizeEndListener);
			window.removeEventListener("pointercancel", resizeEndListener);
			resizeEndListener = null;
		}

		setIsResizing(false);
	};

	onCleanup(() => {
		clearDragListeners();
		clearResizeListeners();

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
		setPosition({ x: rect.left, y: rect.top });
		setSize({ width: rect.width, height: rect.height });
		const pointerOffsetX = event.clientX - rect.left;
		const pointerOffsetY = event.clientY - rect.top;

		clearDragListeners();
		clearResizeListeners();
		setIsDragging(true);
		event.preventDefault();

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

	const handleResizePointerDown = (
		event: PointerEvent,
		edges: { top?: boolean; right?: boolean; bottom?: boolean; left?: boolean },
	) => {
		props.onFocus?.();

		if (!sectionRef || isMaximized() || isClosing() || isMinimizing()) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();

		const startRect = sectionRef.getBoundingClientRect();
		const startX = event.clientX;
		const startY = event.clientY;

		setPosition({ x: startRect.left, y: startRect.top });
		setSize({ width: startRect.width, height: startRect.height });

		clearDragListeners();
		clearResizeListeners();
		setIsResizing(true);

		resizeMoveListener = (moveEvent: PointerEvent) => {
			const deltaX = moveEvent.clientX - startX;
			const deltaY = moveEvent.clientY - startY;

			let nextX = startRect.left;
			let nextY = startRect.top;
			let nextWidth = startRect.width;
			let nextHeight = startRect.height;

			if (edges.right) {
				nextWidth = Math.max(MIN_WIDTH, startRect.width + deltaX);
			}

			if (edges.bottom) {
				nextHeight = Math.max(MIN_HEIGHT, startRect.height + deltaY);
			}

			if (edges.left) {
				const rawWidth = startRect.width - deltaX;
				nextWidth = Math.max(MIN_WIDTH, rawWidth);
				nextX = startRect.right - nextWidth;
			}

			if (edges.top) {
				const rawHeight = startRect.height - deltaY;
				nextHeight = Math.max(MIN_HEIGHT, rawHeight);
				nextY = startRect.bottom - nextHeight;
			}

			setPosition({ x: nextX, y: nextY });
			setSize({ width: nextWidth, height: nextHeight });
		};

		resizeEndListener = () => {
			clearResizeListeners();
		};

		window.addEventListener("pointermove", resizeMoveListener);
		window.addEventListener("pointerup", resizeEndListener);
		window.addEventListener("pointercancel", resizeEndListener);
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

	const getWindowTransform = () => {
		const transforms: string[] = [];

		if (!isMaximized() && !position()) {
			transforms.push("translate(-50%, -50%)");
		}

		if (!isVisible()) {
			if (isMinimizing()) {
				transforms.push("translateY(18px)", "scale(0.92)");
			} else {
				transforms.push("scale(0.94)");
			}
		} else {
			transforms.push("scale(1)");
		}

		return transforms.join(" ");
	};

	return (
		<section
			ref={sectionRef}
			style={{
				opacity: isVisible() ? "1" : "0",
				position: "absolute",
				top: isMaximized() ? "0" : position() ? `${position()!.y}px` : props.top ?? "50%",
				left: isMaximized() ? "0" : position() ? `${position()!.x}px` : props.left ?? "50%",
				transform: getWindowTransform(),
				width: isMaximized()
					? "100%"
					: size()
						? `${size()!.width}px`
						: props.width ?? "min(900px, 95vw)",
				height: isMaximized()
					? "100%"
					: size()
						? `${size()!.height}px`
						: props.height ?? "min(600px, 84vh)",
				background: props.background ?? "rgba(10,12,32,0.92)",
				"z-index": props.zIndex?.toString() ?? "10",
				border: "1px solid rgba(255,255,255,0.12)",
				"border-radius": isMaximized() ? "0" : "16px",
				"backdrop-filter": "blur(18px)",
				"box-shadow": "0 24px 70px rgba(0,0,0,0.45)",
				transition: isDragging() || isResizing()
					? "opacity 120ms linear"
					: "top 220ms ease, left 220ms ease, width 220ms ease, height 220ms ease, transform 220ms ease, border-radius 220ms ease, opacity 220ms ease",
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

			{!isMaximized() && (
				<>
					<div
						onPointerDown={(event) => handleResizePointerDown(event, { top: true })}
						style={{
							position: "absolute",
							top: "-4px",
							left: "8px",
							right: "8px",
							height: "8px",
							cursor: "ns-resize",
							"z-index": "2",
						}}
					/>
					<div
						onPointerDown={(event) => handleResizePointerDown(event, { right: true })}
						style={{
							position: "absolute",
							top: "8px",
							right: "-4px",
							bottom: "8px",
							width: "8px",
							cursor: "ew-resize",
							"z-index": "2",
						}}
					/>
					<div
						onPointerDown={(event) => handleResizePointerDown(event, { bottom: true })}
						style={{
							position: "absolute",
							left: "8px",
							right: "8px",
							bottom: "-4px",
							height: "8px",
							cursor: "ns-resize",
							"z-index": "2",
						}}
					/>
					<div
						onPointerDown={(event) => handleResizePointerDown(event, { left: true })}
						style={{
							position: "absolute",
							top: "8px",
							left: "-4px",
							bottom: "8px",
							width: "8px",
							cursor: "ew-resize",
							"z-index": "2",
						}}
					/>
					<div
						onPointerDown={(event) => handleResizePointerDown(event, { top: true, left: true })}
						style={{
							position: "absolute",
							top: "-5px",
							left: "-5px",
							width: "11px",
							height: "11px",
							cursor: "nwse-resize",
							"z-index": "3",
						}}
					/>
					<div
						onPointerDown={(event) => handleResizePointerDown(event, { top: true, right: true })}
						style={{
							position: "absolute",
							top: "-5px",
							right: "-5px",
							width: "11px",
							height: "11px",
							cursor: "nesw-resize",
							"z-index": "3",
						}}
					/>
					<div
						onPointerDown={(event) => handleResizePointerDown(event, { bottom: true, right: true })}
						style={{
							position: "absolute",
							bottom: "-5px",
							right: "-5px",
							width: "11px",
							height: "11px",
							cursor: "nwse-resize",
							"z-index": "3",
						}}
					/>
					<div
						onPointerDown={(event) => handleResizePointerDown(event, { bottom: true, left: true })}
						style={{
							position: "absolute",
							bottom: "-5px",
							left: "-5px",
							width: "11px",
							height: "11px",
							cursor: "nesw-resize",
							"z-index": "3",
						}}
					/>
				</>
			)}
		</section>
	);
}
