import { For, createSignal } from "solid-js";
import Windows from "../components/Windows";

type MapProps = {
	onClose: () => void;
	onMinimize: () => void;
	onFocus: () => void;
	zIndex: number;
};

type CityPreset = {
	name: string;
	lat: number;
	lon: number;
	zoom: number;
};

const PRESETS: CityPreset[] = [
	{ name: "New York", lat: 40.7128, lon: -74.006, zoom: 11 },
	{ name: "London", lat: 51.5072, lon: -0.1276, zoom: 11 },
	{ name: "Tokyo", lat: 35.6762, lon: 139.6503, zoom: 11 },
	{ name: "Singapore", lat: 1.3521, lon: 103.8198, zoom: 12 },
	{ name: "Paris", lat: 48.8566, lon: 2.3522, zoom: 12 },
];

const mapUrl = (lat: number, lon: number, zoom: number) =>
	`https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.08}%2C${lat - 0.05}%2C${lon + 0.08}%2C${lat + 0.05}&layer=mapnik&marker=${lat}%2C${lon}`;

const normalizeQuery = (value: string) => value.trim().replace(/\s+/g, " ");

export default function Map(props: MapProps) {
	const [lat, setLat] = createSignal(37.7749);
	const [lon, setLon] = createSignal(-122.4194);
	const [zoom, setZoom] = createSignal(11);
	const [query, setQuery] = createSignal("San Francisco");
	const [statusText, setStatusText] = createSignal("Ready");

	const [embedUrl, setEmbedUrl] = createSignal(mapUrl(lat(), lon(), zoom()));

	const applyPosition = (nextLat: number, nextLon: number, nextZoom: number) => {
		setLat(nextLat);
		setLon(nextLon);
		setZoom(nextZoom);
		setEmbedUrl(mapUrl(nextLat, nextLon, nextZoom));
	};

	const openSearch = () => {
		const keyword = normalizeQuery(query());
		if (!keyword) {
			return;
		}

		setStatusText(`Searching for ${keyword}...`);
		const url = `https://www.openstreetmap.org/search?query=${encodeURIComponent(keyword)}`;
		window.open(url, "_blank", "noopener,noreferrer");
		setStatusText(`Opened search for ${keyword}`);
	};

	const locateMe = () => {
		if (!navigator.geolocation) {
			setStatusText("Geolocation is not available in this browser.");
			return;
		}

		setStatusText("Locating...");
		navigator.geolocation.getCurrentPosition(
			(position) => {
				const nextLat = position.coords.latitude;
				const nextLon = position.coords.longitude;
				applyPosition(nextLat, nextLon, 13);
				setStatusText("Showing your current location.");
			},
			() => {
				setStatusText("Could not access your location.");
			},
			{ enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
		);
	};

	return (
		<Windows
			title="Map"
			icon="🗺"
			onClose={props.onClose}
			onMinimize={props.onMinimize}
			onFocus={props.onFocus}
			zIndex={props.zIndex}
			width="min(1080px, 96vw)"
			height="min(680px, 86vh)"
			top="50%"
			left="50%"
			background="rgba(8,12,24,0.96)"
		>
			<div style={{ display: "grid", "grid-template-columns": "1fr 300px", gap: "0.85rem", padding: "0.8rem", height: "100%" }}>
				<div style={{ border: "1px solid rgba(255,255,255,0.14)", "border-radius": "11px", overflow: "hidden" }}>
					<iframe
						src={embedUrl()}
						title="Map view"
						style={{ width: "100%", height: "100%", border: "none", background: "#fff" }}
						loading="lazy"
					/>
				</div>

				<aside
					style={{
						border: "1px solid rgba(255,255,255,0.12)",
						"border-radius": "12px",
						background: "rgba(255,255,255,0.03)",
						padding: "0.75rem",
						display: "flex",
						"flex-direction": "column",
						gap: "0.7rem",
						overflow: "auto",
					}}
				>
					<h3 style={{ color: "#e8efff", "font-size": "0.95rem" }}>Map Controls</h3>

					<input
						type="text"
						value={query()}
						onInput={(event) => setQuery(event.currentTarget.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter") openSearch();
						}}
						placeholder="Search place, address..."
						style={{
							width: "100%",
							padding: "0.5rem 0.65rem",
							border: "1px solid rgba(255,255,255,0.16)",
							"border-radius": "9px",
							background: "rgba(255,255,255,0.04)",
							color: "#eaf1ff",
						}}
					/>

					<button
						type="button"
						onClick={openSearch}
						style={{
							border: "none",
							background: "linear-gradient(135deg, #2563eb, #06b6d4)",
							color: "#fff",
							"border-radius": "9px",
							padding: "0.45rem 0.64rem",
							cursor: "pointer",
							"font-weight": "700",
							"font-size": "0.78rem",
						}}
					>
						Search in OSM
					</button>

					<button
						type="button"
						onClick={locateMe}
						style={{
							border: "1px solid rgba(125,211,252,0.35)",
							background: "rgba(14,165,233,0.13)",
							color: "#bfe8ff",
							"border-radius": "9px",
							padding: "0.42rem 0.64rem",
							cursor: "pointer",
							"font-size": "0.78rem",
						}}
					>
						Use My Location
					</button>

					<div style={{ display: "flex", "flex-direction": "column", gap: "0.45rem" }}>
						<span style={{ color: "#90a6c8", "font-size": "0.74rem", "text-transform": "uppercase", "letter-spacing": "0.06em" }}>
							Quick Cities
						</span>
						<For each={PRESETS}>
							{(city) => (
								<button
									type="button"
									onClick={() => {
										applyPosition(city.lat, city.lon, city.zoom);
										setQuery(city.name);
										setStatusText(`Centered on ${city.name}`);
									}}
									style={{
										border: "1px solid rgba(255,255,255,0.14)",
										background: "rgba(255,255,255,0.04)",
										color: "#d8e6ff",
										"border-radius": "8px",
										padding: "0.38rem 0.54rem",
										cursor: "pointer",
										"font-size": "0.76rem",
										"text-align": "left",
									}}
								>
									{city.name}
								</button>
							)}
						</For>
					</div>

					<div
						style={{
							border: "1px solid rgba(255,255,255,0.12)",
							"border-radius": "10px",
							background: "rgba(2,8,20,0.55)",
							padding: "0.58rem",
							display: "flex",
							"flex-direction": "column",
							gap: "0.25rem",
						}}
					>
						<span style={{ color: "#8ca3c5", "font-size": "0.72rem" }}>Coordinates</span>
						<strong style={{ color: "#e9f2ff", "font-size": "0.84rem" }}>
							{lat().toFixed(4)}, {lon().toFixed(4)}
						</strong>
						<span style={{ color: "#9eb6d7", "font-size": "0.76rem" }}>{statusText()}</span>
					</div>

					<p style={{ color: "#6f85a8", "font-size": "0.72rem", "line-height": "1.35" }}>
						Map tiles by OpenStreetMap. Some searches open in a new tab to preserve full results and routing capabilities.
					</p>
				</aside>
			</div>
		</Windows>
	);
}
