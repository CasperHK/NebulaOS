import { For, createSignal } from "solid-js";
import Windows from "../components/Windows";

type ImageViewerProps = {
	onClose: () => void;
	onMinimize: () => void;
	onFocus: () => void;
	zIndex: number;
};

type GalleryImage = {
	id: string;
	name: string;
	url: string;
};

const GALLERY: GalleryImage[] = [
	{
		id: "aurora",
		name: "Aurora Field",
		url: "https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&w=1600&q=80",
	},
	{
		id: "mountains",
		name: "Glacier Peaks",
		url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=80",
	},
	{
		id: "nebula",
		name: "Violet Nebula",
		url: "https://images.unsplash.com/photo-1447433819943-74a20887a5f1?auto=format&fit=crop&w=1600&q=80",
	},
	{
		id: "coast",
		name: "Midnight Coast",
		url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
	},
];

export default function ImageViewer(props: ImageViewerProps) {
	const [index, setIndex] = createSignal(0);
	const [fitContain, setFitContain] = createSignal(true);
	const [zoom, setZoom] = createSignal(1);
	const [offsetX, setOffsetX] = createSignal(0);
	const [offsetY, setOffsetY] = createSignal(0);
	const [isDragging, setIsDragging] = createSignal(false);
	const [dragStart, setDragStart] = createSignal({ x: 0, y: 0 });

	const current = () => GALLERY[index()];

	const previous = () => {
		setZoom(1);
		setOffsetX(0);
		setOffsetY(0);
		setIndex((i) => (i - 1 + GALLERY.length) % GALLERY.length);
	};

	const next = () => {
		setZoom(1);
		setOffsetX(0);
		setOffsetY(0);
		setIndex((i) => (i + 1) % GALLERY.length);
	};

	const handleWheel = (e: WheelEvent) => {
		e.preventDefault();
		const delta = e.deltaY < 0 ? 0.1 : -0.1;
		setZoom((z) => Math.min(5, Math.max(0.2, +(z + delta).toFixed(2))));
	};

	const handleMouseDown = (e: MouseEvent) => {
		if (zoom() === 1) return;
		setIsDragging(true);
		setDragStart({ x: e.clientX - offsetX(), y: e.clientY - offsetY() });
	};

	const handleMouseMove = (e: MouseEvent) => {
		if (!isDragging()) return;
		const newOffsetX = e.clientX - dragStart().x;
		const newOffsetY = e.clientY - dragStart().y;
		setOffsetX(newOffsetX);
		setOffsetY(newOffsetY);
	};

	const handleMouseUp = () => {
		setIsDragging(false);
	};

	return (
		<Windows
			title="Image Viewer"
			icon="🖼"
			onClose={props.onClose}
			onMinimize={props.onMinimize}
			onFocus={props.onFocus}
			zIndex={props.zIndex}
			top="48%"
			left="51%"
			width="min(980px, 96vw)"
			height="min(650px, 88vh)"
			background="rgba(6,10,24,0.96)"
		>
			<div style={{ display: "flex", "flex-direction": "column", height: "100%" }}>
				<div
					style={{
						display: "flex",
						"justify-content": "space-between",
						"align-items": "center",
						gap: "0.75rem",
						padding: "0.72rem 0.95rem",
						border: "1px solid rgba(255,255,255,0.08)",
						"border-left": "none",
						"border-right": "none",
						"border-top": "none",
					}}
				>
					<strong style={{ color: "#dce7ff", "font-size": "0.86rem" }}>{current().name}</strong>
					<div style={{ display: "flex", gap: "0.45rem" }}>
						<button
							type="button"
							onClick={previous}
							style={{
								border: "1px solid rgba(255,255,255,0.16)",
								background: "rgba(255,255,255,0.07)",
								color: "#e8ecff",
								"border-radius": "8px",
								padding: "0.35rem 0.6rem",
								cursor: "pointer",
								"font-size": "0.78rem",
							}}
						>
							Prev
						</button>
						<button
							type="button"
							onClick={next}
							style={{
								border: "1px solid rgba(255,255,255,0.16)",
								background: "rgba(255,255,255,0.07)",
								color: "#e8ecff",
								"border-radius": "8px",
								padding: "0.35rem 0.6rem",
								cursor: "pointer",
								"font-size": "0.78rem",
							}}
						>
							Next
						</button>
						<button
							type="button"
							onClick={() => setFitContain((v) => !v)}
							style={{
								border: "none",
								background: "linear-gradient(135deg, #62d2ff, #5f72ff)",
								color: "#0a1328",
								"border-radius": "8px",
								padding: "0.35rem 0.6rem",
								cursor: "pointer",
								"font-size": "0.78rem",
								"font-weight": "700",
							}}
						>
							{fitContain() ? "Contain" : "Cover"}
						</button>
						{zoom() !== 1 && (
							<button
								type="button"
								onClick={() => setZoom(1)}
								style={{
									border: "1px solid rgba(255,255,255,0.16)",
									background: "rgba(255,255,255,0.07)",
									color: "#e8ecff",
									"border-radius": "8px",
									padding: "0.35rem 0.6rem",
									cursor: "pointer",
									"font-size": "0.78rem",
								}}
							>
								{Math.round(zoom() * 100)}% ✕
							</button>
						)}
					</div>
				</div>

				<div
					onWheel={handleWheel}
					style={{
						flex: "1",
						background: "rgba(2,5,16,0.88)",
						display: "grid",
						"place-items": "center",
						padding: "0.8rem",
						overflow: "hidden",
						cursor: zoom() !== 1 ? "grab" : "default",
					}}
				>
					<img
						src={current().url}
						alt={current().name}
						style={{
							width: "100%",
							height: "100%",
							"object-fit": fitContain() ? "contain" : "cover",
							"border-radius": "10px",
							transform: `scale(${zoom()})`,
							"transform-origin": "center",
							transition: "transform 0.1s ease",
							"pointer-events": "none",
						}}
					/>
				</div>

				<div
					style={{
						display: "grid",
						"grid-template-columns": "repeat(4, minmax(0, 1fr))",
						gap: "0.5rem",
						padding: "0.7rem 0.85rem",
						border: "1px solid rgba(255,255,255,0.08)",
						"border-left": "none",
						"border-right": "none",
						"border-bottom": "none",
						background: "rgba(255,255,255,0.03)",
					}}
				>
					<For each={GALLERY}>
						{(image, i) => (
							<button
								type="button"
								onClick={() => setIndex(i())}
								style={{
									border: i() === index() ? "1px solid rgba(98,210,255,0.7)" : "1px solid rgba(255,255,255,0.14)",
									background: i() === index() ? "rgba(98,210,255,0.16)" : "rgba(255,255,255,0.04)",
									color: "#dce7ff",
									"border-radius": "8px",
									padding: "0.4rem 0.5rem",
									"font-size": "0.74rem",
									cursor: "pointer",
									"text-align": "left",
								}}
							>
								{image.name}
							</button>
						)}
					</For>
				</div>
			</div>
		</Windows>
	);
}
