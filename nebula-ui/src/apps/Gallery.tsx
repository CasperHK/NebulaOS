import { For, Show, createMemo, createSignal } from "solid-js";
import Windows from "../components/Windows";

type GalleryItem = {
	id: string;
	title: string;
	src: string;
	category: "Nature" | "City" | "Space" | "Abstract" | "Personal";
	isUploaded?: boolean;
};

type GalleryProps = {
	onClose: () => void;
	onMinimize: () => void;
	onFocus: () => void;
	zIndex: number;
};

const BUILTIN_IMAGES: GalleryItem[] = [
	{
		id: "aurora-lake",
		title: "Aurora Lake",
		src: "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=80",
		category: "Nature",
	},
	{
		id: "city-neon",
		title: "Neon Streets",
		src: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80",
		category: "City",
	},
	{
		id: "planet-horizon",
		title: "Planet Horizon",
		src: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80",
		category: "Space",
	},
	{
		id: "waves-abstract",
		title: "Color Waves",
		src: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80",
		category: "Abstract",
	},
	{
		id: "forest-mist",
		title: "Forest Mist",
		src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
		category: "Nature",
	},
	{
		id: "skyline",
		title: "Metropolitan View",
		src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=80",
		category: "City",
	},
];

export default function Gallery(props: GalleryProps) {
	const [uploadedImages, setUploadedImages] = createSignal<GalleryItem[]>([]);
	const [activeCategory, setActiveCategory] = createSignal<"All" | GalleryItem["category"]>("All");
	const [searchText, setSearchText] = createSignal("");
	const [favoriteIds, setFavoriteIds] = createSignal<string[]>([]);
	const [selectedId, setSelectedId] = createSignal<string | null>(null);
	const [uploadError, setUploadError] = createSignal("");

	const allImages = createMemo(() => [...uploadedImages(), ...BUILTIN_IMAGES]);

	const filteredImages = createMemo(() => {
		const keyword = searchText().trim().toLowerCase();

		return allImages().filter((item) => {
			const categoryMatch = activeCategory() === "All" || item.category === activeCategory();
			const searchMatch =
				!keyword ||
				item.title.toLowerCase().includes(keyword) ||
				item.category.toLowerCase().includes(keyword);

			return categoryMatch && searchMatch;
		});
	});

	const selectedImage = createMemo(() =>
		selectedId() ? allImages().find((item) => item.id === selectedId()) ?? null : null,
	);

	const toggleFavorite = (id: string) => {
		setFavoriteIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
	};

	const handleUpload = (event: Event) => {
		const input = event.currentTarget as HTMLInputElement;
		const files = input.files;
		setUploadError("");

		if (!files || files.length === 0) return;

		const nextItems: GalleryItem[] = [];
		let remaining = files.length;

		const complete = () => {
			remaining -= 1;
			if (remaining === 0 && nextItems.length > 0) {
				setUploadedImages((prev) => [...nextItems, ...prev]);
			}
		};

		Array.from(files).forEach((file, index) => {
			if (!file.type.startsWith("image/")) {
				setUploadError("Some files were skipped because they are not images.");
				complete();
				return;
			}

			if (file.size > 12 * 1024 * 1024) {
				setUploadError("Some files were skipped because they exceed 12 MB.");
				complete();
				return;
			}

			const reader = new FileReader();
			reader.onload = () => {
				if (typeof reader.result === "string") {
					nextItems.push({
						id: `upload-${Date.now()}-${index}`,
						title: file.name.replace(/\.[^.]+$/, ""),
						src: reader.result,
						category: "Personal",
						isUploaded: true,
					});
				}
				complete();
			};
			reader.onerror = () => {
				setUploadError("Some files could not be read.");
				complete();
			};

			reader.readAsDataURL(file);
		});

		input.value = "";
	};

	const removeUploaded = (id: string) => {
		setUploadedImages((prev) => prev.filter((item) => item.id !== id));
		setFavoriteIds((prev) => prev.filter((value) => value !== id));
		if (selectedId() === id) setSelectedId(null);
	};

	return (
		<Windows
			title="Gallery"
			icon="🖼"
			onClose={props.onClose}
			onMinimize={props.onMinimize}
			onFocus={props.onFocus}
			zIndex={props.zIndex}
			width="min(1080px, 96vw)"
			height="min(680px, 86vh)"
			top="50%"
			left="50%"
			background="rgba(7,10,22,0.96)"
		>
			<div
				style={{
					display: "grid",
					"grid-template-columns": "1fr 320px",
					gap: "0.95rem",
					padding: "0.9rem",
					height: "100%",
				}}
			>
				<section style={{ display: "flex", "flex-direction": "column", gap: "0.7rem", overflow: "hidden" }}>
					<div style={{ display: "flex", gap: "0.6rem", "align-items": "center" }}>
						<input
							type="text"
							value={searchText()}
							onInput={(event) => setSearchText(event.currentTarget.value)}
							placeholder="Search photos, categories..."
							style={{
								flex: "1",
								padding: "0.55rem 0.7rem",
								"border-radius": "9px",
								border: "1px solid rgba(255,255,255,0.15)",
								background: "rgba(255,255,255,0.04)",
								color: "#e9efff",
							}}
						/>
						<label
							style={{
								border: "none",
								background: "linear-gradient(135deg, #22d3ee, #3b82f6)",
								color: "#fff",
								"font-size": "0.8rem",
								"font-weight": "700",
								padding: "0.5rem 0.72rem",
								"border-radius": "9px",
								cursor: "pointer",
							}}
						>
							Upload
							<input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleUpload} />
						</label>
					</div>

					<div style={{ display: "flex", gap: "0.45rem", "flex-wrap": "wrap" }}>
						<For each={["All", "Nature", "City", "Space", "Abstract", "Personal"] as const}>
							{(category) => (
								<button
									type="button"
									onClick={() => setActiveCategory(category)}
									style={{
										border: "1px solid rgba(255,255,255,0.16)",
										background:
											activeCategory() === category
												? "linear-gradient(135deg, #4f46e5, #0ea5e9)"
												: "rgba(255,255,255,0.05)",
										color: "#e7efff",
										"border-radius": "999px",
										padding: "0.35rem 0.62rem",
										"font-size": "0.74rem",
										cursor: "pointer",
									}}
								>
									{category}
								</button>
							)}
						</For>
					</div>

					{uploadError() && (
						<p style={{ color: "#fda4af", "font-size": "0.78rem", "margin-left": "0.1rem" }}>{uploadError()}</p>
					)}

					<div
						style={{
							display: "grid",
							"grid-template-columns": "repeat(auto-fill, minmax(160px, 1fr))",
							gap: "0.65rem",
							overflow: "auto",
							padding: "0.08rem",
						}}
					>
						<For each={filteredImages()}>
							{(item) => {
								const isFavorite = () => favoriteIds().includes(item.id);
								return (
									<article
										style={{
											border: "1px solid rgba(255,255,255,0.12)",
											"border-radius": "10px",
											background: "rgba(255,255,255,0.03)",
											overflow: "hidden",
										}}
									>
										<button
											type="button"
											onClick={() => setSelectedId(item.id)}
											style={{
												border: "none",
												width: "100%",
												height: "115px",
												background: `url('${item.src}') center/cover no-repeat`,
												cursor: "pointer",
											}}
											aria-label={`Open ${item.title}`}
										/>
										<div style={{ padding: "0.5rem", display: "flex", "flex-direction": "column", gap: "0.35rem" }}>
											<strong
												style={{
													color: "#eaf2ff",
													"font-size": "0.8rem",
													"white-space": "nowrap",
													overflow: "hidden",
													"text-overflow": "ellipsis",
												}}
											>
												{item.title}
											</strong>
											<div style={{ display: "flex", "justify-content": "space-between", gap: "0.35rem" }}>
												<span style={{ color: "#8fa6c8", "font-size": "0.7rem" }}>{item.category}</span>
												<button
													type="button"
													onClick={() => toggleFavorite(item.id)}
													style={{
														border: "none",
														background: "transparent",
														color: isFavorite() ? "#fbbf24" : "#7f92b4",
														cursor: "pointer",
														"font-size": "0.86rem",
													}}
												>
													{isFavorite() ? "★" : "☆"}
												</button>
											</div>

											<Show when={item.isUploaded}>
												<button
													type="button"
													onClick={() => removeUploaded(item.id)}
													style={{
														border: "1px solid rgba(248,113,113,0.45)",
														background: "rgba(248,113,113,0.14)",
														color: "#fca5a5",
														"font-size": "0.68rem",
														padding: "0.2rem 0.42rem",
														"border-radius": "7px",
														cursor: "pointer",
													}}
												>
													Remove
												</button>
											</Show>
										</div>
									</article>
								);
							}}
						</For>
					</div>
				</section>

				<aside
					style={{
						border: "1px solid rgba(255,255,255,0.12)",
						"border-radius": "12px",
						background: "rgba(255,255,255,0.03)",
						padding: "0.75rem",
						display: "flex",
						"flex-direction": "column",
						gap: "0.7rem",
						overflow: "hidden",
					}}
				>
					<h3 style={{ color: "#e9f1ff", "font-size": "0.95rem" }}>Preview</h3>

					<Show
						when={selectedImage()}
						fallback={<p style={{ color: "#7f92b4", "font-size": "0.82rem" }}>Select a photo to preview it here.</p>}
					>
						{(image) => (
							<>
								<div
									style={{
										height: "320px",
										"border-radius": "10px",
										background: `url('${image().src}') center/cover no-repeat`,
										border: "1px solid rgba(255,255,255,0.13)",
									}}
								/>
								<strong style={{ color: "#e9f1ff", "font-size": "0.9rem" }}>{image().title}</strong>
								<span style={{ color: "#8ea6c9", "font-size": "0.77rem" }}>{image().category}</span>
								<button
									type="button"
									onClick={() => toggleFavorite(image().id)}
									style={{
										border: "none",
										background: favoriteIds().includes(image().id)
											? "linear-gradient(135deg, #f59e0b, #fbbf24)"
											: "linear-gradient(135deg, #4f46e5, #0ea5e9)",
										color: "#fff",
										"font-size": "0.78rem",
										"font-weight": "700",
										padding: "0.45rem 0.62rem",
										"border-radius": "8px",
										cursor: "pointer",
									}}
								>
									{favoriteIds().includes(image().id) ? "Favorited" : "Add to Favorites"}
								</button>
							</>
						)}
					</Show>
				</aside>
			</div>
		</Windows>
	);
}
