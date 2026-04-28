import { For } from "solid-js";

export type AppDockItem = {
	id: string;
	title: string;
	icon: string;
	isOpen: boolean;
	isMinimized: boolean;
	onRestore: () => void;
	onMinimize: () => void;
};

type AppDockProps = {
	items: AppDockItem[];
};

export default function AppDock(props: AppDockProps) {
	return (
		<div style={{ display: "flex", "align-items": "center", gap: "0.45rem" }}>
			<For each={props.items.filter((item) => item.isOpen)}>
				{(item) => (
					<button
						type="button"
						onClick={() => {
							if (item.isMinimized) {
								item.onRestore();
							} else {
								item.onMinimize();
							}
						}}
						style={{
							border: item.isMinimized
								? "1px solid rgba(255,255,255,0.10)"
								: "1px solid rgba(255,255,255,0.30)",
							background: item.isMinimized
								? "rgba(255,255,255,0.04)"
								: "rgba(255,255,255,0.14)",
							color: item.isMinimized ? "rgba(229,230,255,0.45)" : "#e5e6ff",
							"border-radius": "10px",
							width: "34px",
							height: "30px",
							cursor: "pointer",
							"font-size": "1rem",
							transition: "background 0.15s, border 0.15s, color 0.15s",
						}}
						title={item.isMinimized ? `Restore ${item.title}` : `Minimize ${item.title}`}
						aria-label={item.isMinimized ? `Restore ${item.title}` : `Minimize ${item.title}`}
					>
						{item.icon}
					</button>
				)}
			</For>
		</div>
	);
}
