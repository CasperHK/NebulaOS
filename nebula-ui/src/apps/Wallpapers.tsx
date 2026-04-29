import { For, createSignal } from "solid-js";
import Windows from "../components/Windows";

type WallpaperPreset = {
	id: string;
	name: string;
	preview: string;
	background: string;
	subtitle: string;
};

type WallpapersProps = {
	onClose: () => void;
	onMinimize: () => void;
	onFocus: () => void;
	zIndex: number;
	currentBackground: string;
	onApply: (background: string) => void;
};

const PRESETS: WallpaperPreset[] = [
	{
		id: "nebula-default",
		name: "Nebula Default",
		preview: "linear-gradient(135deg, #0a0a1a 0%, #0d1b3e 60%, #1a0a2e 100%)",
		background: "linear-gradient(135deg, #0a0a1a 0%, #0d1b3e 60%, #1a0a2e 100%)",
		subtitle: "Classic cosmic gradient",
	},
	{
		id: "sunset-noise",
		name: "Solar Drift",
		preview: "linear-gradient(140deg, #271033 0%, #79315e 45%, #fb8b24 100%)",
		background: "linear-gradient(140deg, #271033 0%, #79315e 45%, #fb8b24 100%)",
		subtitle: "Warm sci-fi sunset",
	},
	{
		id: "emerald-grid",
		name: "Emerald Grid",
		preview: "linear-gradient(135deg, #02110e 0%, #103c31 55%, #1f7a64 100%)",
		background: "linear-gradient(135deg, #02110e 0%, #103c31 55%, #1f7a64 100%)",
		subtitle: "Dark terminal energy",
	},
	{
		id: "aurora-image",
		name: "Aurora Coast",
		preview: "url('https://images.unsplash.com/photo-1499346030926-9a72daac6c63?auto=format&fit=crop&w=1000&q=80') center/cover",
		background:
			"linear-gradient(rgba(4,8,20,0.35), rgba(4,8,20,0.35)), url('https://images.unsplash.com/photo-1499346030926-9a72daac6c63?auto=format&fit=crop&w=2000&q=80') center/cover no-repeat fixed",
		subtitle: "Photographic aurora",
	},
	{
		id: "city-night-image",
		name: "Neon City",
		preview: "url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1000&q=80') center/cover",
		background:
			"linear-gradient(rgba(8,10,20,0.42), rgba(8,10,20,0.42)), url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2000&q=80') center/cover no-repeat fixed",
		subtitle: "Cinematic skyline",
	},
];

export default function Wallpapers(props: WallpapersProps) {
	const [uploadError, setUploadError] = createSignal("");
	const [uploadedPreview, setUploadedPreview] = createSignal<string | null>(null);

	const applyBackground = (background: string) => {
		props.onApply(background);
	};

	const handleUpload = (event: Event) => {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		setUploadError("");

		if (!file) {
			return;
		}

		if (!file.type.startsWith("image/")) {
			setUploadError("Please choose a valid image file.");
			return;
		}

		if (file.size > 10 * 1024 * 1024) {
			setUploadError("Please choose an image smaller than 10 MB.");
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result !== "string") {
				setUploadError("Could not read this image.");
				return;
			}

			setUploadedPreview(reader.result);
			applyBackground(`url('${reader.result}') center/cover no-repeat fixed`);
		};

		reader.onerror = () => {
			setUploadError("Could not read this image.");
		};

		reader.readAsDataURL(file);
	};

	return (
		<Windows
			title="Wallpapers"
			icon="🖼"
			onClose={props.onClose}
			onMinimize={props.onMinimize}
			onFocus={props.onFocus}
			zIndex={props.zIndex}
			width="min(980px, 95vw)"
			height="min(640px, 86vh)"
			top="50%"
			left="50%"
			background="rgba(6,10,22,0.95)"
		>
			<div
				style={{
					display: "grid",
					"grid-template-columns": "1.35fr 0.9fr",
					gap: "1rem",
					padding: "1rem",
					height: "100%",
				}}
			>
				<section style={{ display: "flex", "flex-direction": "column", gap: "0.8rem", overflow: "hidden" }}>
					<h3 style={{ color: "#e8eeff", "font-size": "1.05rem" }}>Choose a Wallpaper</h3>
					<div
						style={{
							display: "grid",
							"grid-template-columns": "repeat(auto-fill, minmax(190px, 1fr))",
							gap: "0.75rem",
							overflow: "auto",
							padding: "0.15rem",
						}}
					>
						<For each={PRESETS}>
							{(preset) => {
								const selected = () => props.currentBackground === preset.background;
								return (
									<article
										style={{
											border: selected() ? "1px solid rgba(125,211,252,0.9)" : "1px solid rgba(255,255,255,0.14)",
											"border-radius": "12px",
											background: "rgba(255,255,255,0.03)",
											padding: "0.52rem",
											display: "flex",
											"flex-direction": "column",
											gap: "0.5rem",
										}}
									>
										<div
											style={{
												height: "108px",
												"border-radius": "10px",
												background: preset.preview,
												border: "1px solid rgba(255,255,255,0.1)",
												"background-size": "cover",
												"background-position": "center",
											}}
										/>
										<div>
											<strong style={{ color: "#eef4ff", "font-size": "0.9rem" }}>{preset.name}</strong>
											<p style={{ color: "#9eb0d2", "font-size": "0.76rem", "margin-top": "0.15rem" }}>{preset.subtitle}</p>
										</div>
										<button
											type="button"
											onClick={() => applyBackground(preset.background)}
											style={{
												border: "none",
												background: selected()
													? "linear-gradient(135deg, #16a34a, #10b981)"
													: "linear-gradient(135deg, #5f72ff, #33b5ff)",
												color: "#fff",
												"font-size": "0.78rem",
												"font-weight": "700",
												padding: "0.45rem 0.65rem",
												"border-radius": "8px",
												cursor: "pointer",
											}}
										>
											{selected() ? "Applied" : "Apply"}
										</button>
									</article>
								);
							}}
						</For>
					</div>
				</section>

				<section
					style={{
						border: "1px solid rgba(255,255,255,0.13)",
						"border-radius": "12px",
						background: "rgba(255,255,255,0.03)",
						padding: "0.85rem",
						display: "flex",
						"flex-direction": "column",
						gap: "0.75rem",
					}}
				>
					<h3 style={{ color: "#e8eeff", "font-size": "0.98rem" }}>Upload Your Favorite</h3>
					<p style={{ color: "#9eb0d2", "font-size": "0.8rem", "line-height": "1.4" }}>
						Select a JPG, PNG, or WEBP image and apply it as your desktop wallpaper.
					</p>

					<label
						style={{
							border: "1px dashed rgba(148,163,184,0.7)",
							"border-radius": "11px",
							padding: "0.75rem",
							color: "#d7e3ff",
							"font-size": "0.82rem",
							cursor: "pointer",
							"text-align": "center",
							background: "rgba(255,255,255,0.02)",
						}}
					>
						Choose Image File
						<input type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
					</label>

					{uploadError() && <p style={{ color: "#fda4af", "font-size": "0.78rem" }}>{uploadError()}</p>}

					<div
						style={{
							"margin-top": "0.2rem",
							height: "210px",
							border: "1px solid rgba(255,255,255,0.12)",
							"border-radius": "10px",
							background: uploadedPreview()
								? `url('${uploadedPreview()}') center/cover no-repeat`
								: "linear-gradient(145deg, #0f172a, #0f2c45)",
							display: "grid",
							"place-items": "center",
							color: "#7f92b4",
							"font-size": "0.82rem",
						}}
					>
						{!uploadedPreview() && "Uploaded image preview"}
					</div>
				</section>
			</div>
		</Windows>
	);
}
