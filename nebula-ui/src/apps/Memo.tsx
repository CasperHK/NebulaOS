import { For, createSignal } from "solid-js";
import Windows from "../components/Windows";

type MemoProps = {
	onClose: () => void;
	onMinimize: () => void;
	onFocus: () => void;
	zIndex: number;
};

type MemoNote = {
	id: number;
	title: string;
	body: string;
	color: string;
	createdAt: number;
};

const COLORS = [
	"rgba(124,58,237,0.22)",
	"rgba(6,182,212,0.18)",
	"rgba(245,158,11,0.18)",
	"rgba(239,68,68,0.18)",
	"rgba(34,197,94,0.18)",
	"rgba(236,72,153,0.18)",
];

let nextId = 1;

export default function Memo(props: MemoProps) {
	const [memos, setMemos] = createSignal<MemoNote[]>([]);
	const [selected, setSelected] = createSignal<number | null>(null);
	const [editTitle, setEditTitle] = createSignal("");
	const [editBody, setEditBody] = createSignal("");
	const [search, setSearch] = createSignal("");

	const filtered = () => {
		const q = search().toLowerCase();
		if (!q) return memos();
		return memos().filter(
			(m) => m.title.toLowerCase().includes(q) || m.body.toLowerCase().includes(q),
		);
	};

	const selectedMemo = () => memos().find((m) => m.id === selected()) ?? null;

	const newMemo = () => {
		const id = nextId++;
		const memo: MemoNote = {
			id,
			title: "Untitled",
			body: "",
			color: COLORS[id % COLORS.length],
			createdAt: Date.now(),
		};
		setMemos((prev) => [memo, ...prev]);
		openMemo(memo);
	};

	const openMemo = (memo: MemoNote) => {
		setSelected(memo.id);
		setEditTitle(memo.title);
		setEditBody(memo.body);
	};

	const saveEdit = () => {
		const id = selected();
		if (id === null) return;
		setMemos((prev) =>
			prev.map((m) =>
				m.id === id ? { ...m, title: editTitle() || "Untitled", body: editBody() } : m,
			),
		);
	};

	const deleteMemo = (id: number) => {
		setMemos((prev) => prev.filter((m) => m.id !== id));
		if (selected() === id) setSelected(null);
	};

	const formatDate = (ts: number) =>
		new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

	const sidebarBtn: Record<string, string> = {
		background: "none",
		border: "none",
		cursor: "pointer",
		color: "rgba(255,255,255,0.5)",
		"font-size": "0.9rem",
		padding: "0.2rem 0.3rem",
		"border-radius": "6px",
		"line-height": "1",
	};

	return (
		<Windows
			title="Memo"
			icon="📒"
			defaultMaximized={false}
			onClose={props.onClose}
			onMinimize={props.onMinimize}
			onFocus={props.onFocus}
			zIndex={props.zIndex}
			top="50%"
			left="50%"
			width="min(720px, 95vw)"
			height="min(560px, 86vh)"
			background="rgba(9,14,30,0.95)"
		>
			<div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
				{/* Sidebar */}
				<div
					style={{
						width: "220px",
						"min-width": "160px",
						"border-right": "1px solid rgba(255,255,255,0.08)",
						display: "flex",
						"flex-direction": "column",
						"flex-shrink": "0",
					}}
				>
					{/* Search + New */}
					<div
						style={{
							padding: "0.75rem 0.7rem 0.55rem",
							display: "flex",
							"flex-direction": "column",
							gap: "0.5rem",
							"border-bottom": "1px solid rgba(255,255,255,0.07)",
						}}
					>
						<input
							type="text"
							placeholder="Search…"
							value={search()}
							onInput={(e) => setSearch(e.currentTarget.value)}
							style={{
								padding: "0.4rem 0.6rem",
								"border-radius": "8px",
								border: "1px solid rgba(255,255,255,0.12)",
								background: "rgba(255,255,255,0.06)",
								color: "#e8ecff",
								outline: "none",
								"font-size": "0.8rem",
							}}
						/>
						<button
							type="button"
							onClick={newMemo}
							style={{
								padding: "0.4rem",
								"border-radius": "8px",
								border: "1px solid rgba(120,100,255,0.45)",
								background: "rgba(120,100,255,0.25)",
								color: "#e8ecff",
								"font-size": "0.8rem",
								cursor: "pointer",
							}}
						>
							+ New Memo
						</button>
					</div>

					{/* List */}
					<div style={{ flex: "1", "overflow-y": "auto" }}>
						{filtered().length === 0 && (
							<p
								style={{
									color: "rgba(255,255,255,0.22)",
									"font-size": "0.78rem",
									"text-align": "center",
									"margin-top": "1.5rem",
									padding: "0 0.5rem",
								}}
							>
								{search() ? "No results." : "No memos yet."}
							</p>
						)}
						<For each={filtered()}>
							{(memo) => (
								<div
									onClick={() => openMemo(memo)}
									style={{
										padding: "0.65rem 0.75rem",
										cursor: "pointer",
										"border-left": `3px solid ${selected() === memo.id ? "#9b87f5" : "transparent"}`,
										background:
											selected() === memo.id
												? "rgba(120,100,255,0.12)"
												: "transparent",
										display: "flex",
										"align-items": "flex-start",
										gap: "0.4rem",
										"border-bottom": "1px solid rgba(255,255,255,0.05)",
									}}
								>
									<div style={{ flex: "1", overflow: "hidden" }}>
										<div
											style={{
												"font-size": "0.82rem",
												color: "#e8ecff",
												"white-space": "nowrap",
												overflow: "hidden",
												"text-overflow": "ellipsis",
												"font-weight": "600",
											}}
										>
											{memo.title}
										</div>
										<div
											style={{
												"font-size": "0.73rem",
												color: "rgba(255,255,255,0.35)",
												"white-space": "nowrap",
												overflow: "hidden",
												"text-overflow": "ellipsis",
												"margin-top": "0.15rem",
											}}
										>
											{memo.body || "No content"}
										</div>
									</div>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											deleteMemo(memo.id);
										}}
										aria-label="Delete memo"
										style={sidebarBtn}
									>
										✕
									</button>
								</div>
							)}
						</For>
					</div>

					{/* Footer count */}
					<div
						style={{
							padding: "0.5rem 0.75rem",
							"border-top": "1px solid rgba(255,255,255,0.07)",
							color: "rgba(255,255,255,0.3)",
							"font-size": "0.73rem",
						}}
					>
						{memos().length} memo{memos().length !== 1 ? "s" : ""}
					</div>
				</div>

				{/* Editor pane */}
				<div style={{ flex: "1", display: "flex", "flex-direction": "column", overflow: "hidden" }}>
					{selectedMemo() ? (
						<>
							{/* Color picker strip */}
							<div
								style={{
									display: "flex",
									gap: "0.4rem",
									padding: "0.6rem 1rem",
									"border-bottom": "1px solid rgba(255,255,255,0.07)",
									"align-items": "center",
								}}
							>
								<span style={{ color: "rgba(255,255,255,0.3)", "font-size": "0.72rem", "margin-right": "0.2rem" }}>
									Color
								</span>
								<For each={COLORS}>
									{(c) => (
										<button
											type="button"
											aria-label="Pick color"
											onClick={() => {
												saveEdit();
												setMemos((prev) =>
													prev.map((m) =>
														m.id === selected() ? { ...m, color: c } : m,
													),
												);
											}}
											style={{
												width: "18px",
												height: "18px",
												"border-radius": "50%",
												border:
													selectedMemo()?.color === c
														? "2px solid #e8ecff"
														: "2px solid transparent",
												background: c.replace("0.18", "0.7").replace("0.22", "0.7"),
												cursor: "pointer",
												padding: "0",
												"flex-shrink": "0",
											}}
										/>
									)}
								</For>
								<span
									style={{
										"margin-left": "auto",
										color: "rgba(255,255,255,0.25)",
										"font-size": "0.7rem",
									}}
								>
									{formatDate(selectedMemo()!.createdAt)}
								</span>
							</div>

							{/* Title */}
							<input
								type="text"
								value={editTitle()}
								onInput={(e) => setEditTitle(e.currentTarget.value)}
								onBlur={saveEdit}
								placeholder="Title"
								style={{
									padding: "0.75rem 1rem 0.4rem",
									background: "transparent",
									border: "none",
									outline: "none",
									color: "#e8ecff",
									"font-size": "1.1rem",
									"font-weight": "700",
								}}
							/>

							{/* Body */}
							<textarea
								value={editBody()}
								onInput={(e) => setEditBody(e.currentTarget.value)}
								onBlur={saveEdit}
								placeholder="Write your memo here…"
								style={{
									flex: "1",
									padding: "0.4rem 1rem 1rem",
									background: selectedMemo()!.color,
									border: "none",
									outline: "none",
									resize: "none",
									color: "#dde3ff",
									"font-size": "0.9rem",
									"line-height": "1.6",
									"font-family": "inherit",
								}}
							/>
						</>
					) : (
						<div
							style={{
								flex: "1",
								display: "flex",
								"align-items": "center",
								"justify-content": "center",
								"flex-direction": "column",
								gap: "0.75rem",
								color: "rgba(255,255,255,0.2)",
							}}
						>
							<span style={{ "font-size": "2.5rem" }}>📒</span>
							<p style={{ "font-size": "0.88rem" }}>Select a memo or create a new one.</p>
						</div>
					)}
				</div>
			</div>
		</Windows>
	);
}
