import { For, createSignal } from "solid-js";
import Windows from "../components/Windows";

type BrowserProps = {
	onClose: () => void;
	onMinimize: () => void;
	onFocus: () => void;
	zIndex: number;
};

type BrowserTab = {
	id: string;
	title: string;
	url: string;
};

const QUICK_LINKS = [
	{ label: "Example", url: "https://example.com" },
	{ label: "Wikipedia", url: "https://www.wikipedia.org" },
	{ label: "MDN", url: "https://developer.mozilla.org" },
	{ label: "GitHub", url: "https://github.com" },
];

const normalizeUrl = (value: string) => {
	const raw = value.trim();
	if (!raw) return "https://example.com";

	if (/^https?:\/\//i.test(raw)) {
		return raw;
	}

	if (raw.includes(" ")) {
		return `https://duckduckgo.com/?q=${encodeURIComponent(raw)}`;
	}

	if (/^[\w.-]+\.[a-z]{2,}$/i.test(raw)) {
		return `https://${raw}`;
	}

	return `https://duckduckgo.com/?q=${encodeURIComponent(raw)}`;
};

export default function Browser(props: BrowserProps) {
	const initialTab: BrowserTab = {
		id: "tab-home",
		title: "Example",
		url: "https://example.com",
	};

	const [tabs, setTabs] = createSignal<BrowserTab[]>([initialTab]);
	const [activeTabId, setActiveTabId] = createSignal(initialTab.id);
	const [addressInput, setAddressInput] = createSignal(initialTab.url);
	const [isLoading, setIsLoading] = createSignal(false);

	const activeTab = () => tabs().find((tab) => tab.id === activeTabId()) ?? tabs()[0];

	const syncAddressWithActive = () => {
		const tab = activeTab();
		if (tab) setAddressInput(tab.url);
	};

	const navigateTo = (raw: string) => {
		const nextUrl = normalizeUrl(raw);
		const currentId = activeTabId();

		setTabs((prev) =>
			prev.map((tab) =>
				tab.id === currentId
					? {
							...tab,
							url: nextUrl,
							title: new URL(nextUrl).hostname.replace(/^www\./, ""),
						}
					: tab,
			),
		);

		setAddressInput(nextUrl);
		setIsLoading(true);
	};

	const openQuickLink = (url: string) => {
		navigateTo(url);
	};

	const addTab = () => {
		const id = `tab-${Date.now()}`;
		const next: BrowserTab = {
			id,
			title: "New Tab",
			url: "https://example.com",
		};

		setTabs((prev) => [...prev, next]);
		setActiveTabId(id);
		setAddressInput(next.url);
		setIsLoading(true);
	};

	const closeTab = (id: string) => {
		const current = tabs();
		if (current.length === 1) return;

		const nextTabs = current.filter((tab) => tab.id !== id);
		setTabs(nextTabs);

		if (activeTabId() === id) {
			setActiveTabId(nextTabs[nextTabs.length - 1].id);
			setAddressInput(nextTabs[nextTabs.length - 1].url);
		}
	};

	return (
		<Windows
			title="Nebula Browser"
			icon="🌐"
			onClose={props.onClose}
			onMinimize={props.onMinimize}
			onFocus={props.onFocus}
			zIndex={props.zIndex}
			width="min(1150px, 97vw)"
			height="min(700px, 88vh)"
			top="50%"
			left="50%"
			background="rgba(8,12,24,0.97)"
		>
			<div style={{ display: "flex", "flex-direction": "column", height: "100%", padding: "0.65rem", gap: "0.6rem" }}>
				<div style={{ display: "flex", gap: "0.42rem", "align-items": "center", "flex-wrap": "wrap" }}>
					<button
						type="button"
						onClick={() => navigateTo(activeTab().url)}
						style={{
							border: "1px solid rgba(255,255,255,0.18)",
							background: "rgba(255,255,255,0.05)",
							color: "#dce7ff",
							"border-radius": "8px",
							padding: "0.35rem 0.55rem",
							cursor: "pointer",
						}}
					>
						⟳
					</button>

					<input
						type="text"
						value={addressInput()}
						onInput={(event) => setAddressInput(event.currentTarget.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								navigateTo(addressInput());
							}
						}}
						placeholder="Enter URL or search"
						style={{
							flex: "1",
							padding: "0.48rem 0.65rem",
							"border-radius": "9px",
							border: "1px solid rgba(255,255,255,0.16)",
							background: "rgba(255,255,255,0.04)",
							color: "#eaf1ff",
							"min-width": "220px",
						}}
					/>

					<button
						type="button"
						onClick={() => navigateTo(addressInput())}
						style={{
							border: "none",
							background: "linear-gradient(135deg, #2563eb, #06b6d4)",
							color: "#fff",
							"border-radius": "8px",
							padding: "0.42rem 0.7rem",
							cursor: "pointer",
							"font-weight": "700",
							"font-size": "0.78rem",
						}}
					>
						Go
					</button>

					<button
						type="button"
						onClick={() => window.open(activeTab().url, "_blank", "noopener,noreferrer")}
						style={{
							border: "1px solid rgba(255,255,255,0.18)",
							background: "rgba(255,255,255,0.05)",
							color: "#dce7ff",
							"border-radius": "8px",
							padding: "0.4rem 0.58rem",
							cursor: "pointer",
							"font-size": "0.77rem",
						}}
					>
						Open New Tab
					</button>
				</div>

				<div style={{ display: "flex", gap: "0.42rem", "align-items": "center", "flex-wrap": "wrap" }}>
					<For each={tabs()}>
						{(tab) => (
							<div
								style={{
									display: "flex",
									"align-items": "center",
									gap: "0.3rem",
									border: "1px solid rgba(255,255,255,0.16)",
									background: activeTabId() === tab.id ? "rgba(59,130,246,0.22)" : "rgba(255,255,255,0.03)",
									"border-radius": "999px",
									padding: "0.24rem 0.36rem 0.24rem 0.52rem",
								}}
							>
								<button
									type="button"
									onClick={() => {
										setActiveTabId(tab.id);
										setAddressInput(tab.url);
										setIsLoading(true);
									}}
									style={{
										border: "none",
										background: "transparent",
										color: "#d9e8ff",
										cursor: "pointer",
										"font-size": "0.73rem",
										"max-width": "150px",
										overflow: "hidden",
										"text-overflow": "ellipsis",
										"white-space": "nowrap",
									}}
								>
									{tab.title}
								</button>
								<button
									type="button"
									onClick={() => closeTab(tab.id)}
									style={{
										border: "none",
										background: "transparent",
										color: "#9fb4d8",
										cursor: "pointer",
										"font-size": "0.8rem",
										"line-height": "1",
									}}
								>
									×
								</button>
							</div>
						)}
					</For>

					<button
						type="button"
						onClick={addTab}
						style={{
							border: "1px dashed rgba(255,255,255,0.24)",
							background: "transparent",
							color: "#c4d6f3",
							"border-radius": "999px",
							padding: "0.2rem 0.5rem",
							cursor: "pointer",
						}}
					>
						+ Tab
					</button>
				</div>

				<div style={{ display: "flex", gap: "0.45rem", "flex-wrap": "wrap" }}>
					<For each={QUICK_LINKS}>
						{(link) => (
							<button
								type="button"
								onClick={() => openQuickLink(link.url)}
								style={{
									border: "1px solid rgba(125,211,252,0.35)",
									background: "rgba(14,165,233,0.12)",
									color: "#bfe7ff",
									"border-radius": "999px",
									padding: "0.25rem 0.56rem",
									"font-size": "0.72rem",
									cursor: "pointer",
								}}
							>
								{link.label}
							</button>
						)}
					</For>
					<span style={{ "margin-left": "auto", color: "#8ca4cb", "font-size": "0.74rem" }}>
						{isLoading() ? "Loading..." : "Ready"}
					</span>
				</div>

				<div style={{ flex: "1", border: "1px solid rgba(255,255,255,0.14)", "border-radius": "10px", overflow: "hidden", background: "#0a1224" }}>
					<iframe
						src={activeTab().url}
						title={activeTab().title}
						style={{ width: "100%", height: "100%", border: "none", background: "#fff" }}
						onLoad={() => {
							setIsLoading(false);
							syncAddressWithActive();
						}}
					/>
				</div>

				<p style={{ color: "#7188ac", "font-size": "0.72rem" }}>
					Note: Some websites block iframe embedding for security and may appear blank. Use Open New Tab for those sites.
				</p>
			</div>
		</Windows>
	);
}
