import { For, Show, createSignal } from "solid-js";

export type AppDockItem = {
	id: string;
	title: string;
	icon: string;
	isOpen: boolean;
	isMinimized: boolean;
	isPinned: boolean;
	onRestore: () => void;
	onMinimize: () => void;
	onPin: () => void;
	onUnpin: () => void;
};

type AppDockProps = {
	items: AppDockItem[];
};

export default function AppDock(props: AppDockProps) {
	const [contextMenuId, setContextMenuId] = createSignal<string | null>(null);
	const [contextMenuPos, setContextMenuPos] = createSignal({ x: 0, y: 0 });

	const handleContextMenu = (e: MouseEvent, itemId: string) => {
		e.preventDefault();
		e.stopPropagation();
		setContextMenuId(itemId);
		
		// Position menu with offset from cursor, accounting for screen edges
		let x = e.clientX + 5;
		let y = e.clientY + 5;
		
		// Adjust if menu would go off-screen (assuming menu is ~160px wide and ~50px tall)
		if (x + 160 > window.innerWidth) {
			x = window.innerWidth - 170;
		}
		if (y + 80 > window.innerHeight) {
			y = window.innerHeight - 90;
		}
		
		setContextMenuPos({ x, y });
	};

	const closeMenu = () => setContextMenuId(null);

	return (
		<>
			<div style={{ display: "flex", "align-items": "center", gap: "0.45rem" }}>
				<For each={props.items.filter((item) => item.isOpen || item.isPinned)}>
					{(item) => (
						<button
							type="button"
							onClick={() => {
								if (!item.isOpen) {
									// If not open, restore/open it
									item.onRestore();
								} else if (item.isMinimized) {
									// If open and minimized, restore
									item.onRestore();
								} else {
									// If open and not minimized, minimize
									item.onMinimize();
								}
							}}
							onContextMenu={(e) => handleContextMenu(e, item.id)}
							style={{
								border: item.isMinimized
									? "1px solid rgba(255,255,255,0.10)"
									: "1px solid rgba(255,255,255,0.30)",
								background: item.isMinimized
									? "rgba(255,255,255,0.04)"
									: "rgba(255,255,255,0.14)",
								color: item.isMinimized ? "rgba(229,230,255,0.45)" : "#e5e6ff",
								"border-radius": "10px",
								width: "44px",
								height: "44px",
								cursor: "pointer",
								"font-size": "1.2rem",
								transition: "background 0.15s, border 0.15s, color 0.15s",
								display: "flex",
								"align-items": "center",
								"justify-content": "center",
								opacity: !item.isOpen && item.isPinned ? "0.6" : "1",
							}}
							title={!item.isOpen && item.isPinned ? `Open ${item.title}` : (item.isMinimized ? `Restore ${item.title}` : `Minimize ${item.title}`)}
							aria-label={!item.isOpen && item.isPinned ? `Open ${item.title}` : (item.isMinimized ? `Restore ${item.title}` : `Minimize ${item.title}`)}
						>
							{item.icon}
						</button>
					)}
				</For>
			</div>

			<Show when={contextMenuId() !== null}>
				<div
					onClick={closeMenu}
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						"z-index": 998,
					}}
				/>
				<div
					style={{
						position: "fixed",
						top: contextMenuPos().y + "px",
						left: contextMenuPos().x + "px",
						"z-index": 999,
						background: "rgba(20, 20, 30, 0.95)",
						border: "1px solid rgba(255, 255, 255, 0.2)",
						"border-radius": "8px",
						"box-shadow": "0 8px 32px rgba(0, 0, 0, 0.3)",
						"backdrop-filter": "blur(8px)",
						"min-width": "160px",
						padding: "4px 0",
					}}
				>
					<For each={props.items.filter((item) => item.id === contextMenuId())}>
						{(item) => (
							<>
								<button
									type="button"
									onClick={() => {
										if (item.isPinned) {
											item.onUnpin();
										} else {
											item.onPin();
										}
										closeMenu();
									}}
									style={{
										display: "block",
										width: "100%",
										padding: "8px 16px",
										background: "transparent",
										border: "none",
										color: "#e5e6ff",
										"text-align": "left",
										cursor: "pointer",
										"font-size": "0.9rem",
										transition: "background 0.1s",
										"&:hover": { background: "rgba(255, 255, 255, 0.1)" },
									}}
									onMouseEnter={(e) => {
										(e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.1)";
									}}
									onMouseLeave={(e) => {
										(e.currentTarget as HTMLElement).style.background = "transparent";
									}}
								>
									{item.isPinned ? "Unpin from Dock" : "Pin to Dock"}
								</button>
							</>
						)}
					</For>
				</div>
			</Show>
		</>
	);
}
