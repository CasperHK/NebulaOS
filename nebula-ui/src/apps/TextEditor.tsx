import { createMemo, createSignal } from "solid-js";
import Windows from "../components/Windows";

type TextEditorProps = {
	onClose: () => void;
	onMinimize: () => void;
	onFocus: () => void;
	zIndex: number;
};

const SAMPLE_TEXT = `# Nebula Notes\n\nWelcome to Text Editor.\n\n- This is an in-memory document.\n- Use New to start over.\n- Use Insert Sample to restore this text.\n`;

export default function TextEditor(props: TextEditorProps) {
	const [title, setTitle] = createSignal("Untitled.txt");
	const [content, setContent] = createSignal(SAMPLE_TEXT);

	const lineCount = createMemo(() => {
		const text = content();
		if (!text) return 1;
		return text.split("\n").length;
	});

	const characterCount = createMemo(() => content().length);

	const isDirty = createMemo(() => content() !== SAMPLE_TEXT || title() !== "Untitled.txt");

	const newDocument = () => {
		setTitle("Untitled.txt");
		setContent("");
	};

	const insertSample = () => {
		setTitle("Nebula-Notes.md");
		setContent(SAMPLE_TEXT);
	};

	return (
		<Windows
			title={`Text Editor${isDirty() ? " *" : ""}`}
			icon="📝"
			onClose={props.onClose}
			onMinimize={props.onMinimize}
			onFocus={props.onFocus}
			zIndex={props.zIndex}
			top="50%"
			left="53%"
			width="min(900px, 95vw)"
			height="min(620px, 86vh)"
			background="rgba(9,14,30,0.95)"
		>
			<div style={{ display: "flex", "flex-direction": "column", height: "100%" }}>
				<div
					style={{
						display: "flex",
						gap: "0.55rem",
						padding: "0.75rem 0.95rem",
						border: "1px solid rgba(255,255,255,0.08)",
						"border-left": "none",
						"border-right": "none",
						"border-top": "none",
						"align-items": "center",
					}}
				>
					<input
						type="text"
						value={title()}
						onInput={(e) => setTitle(e.currentTarget.value)}
						aria-label="Document title"
						style={{
							width: "220px",
							padding: "0.45rem 0.55rem",
							"border-radius": "8px",
							border: "1px solid rgba(255,255,255,0.14)",
							background: "rgba(255,255,255,0.06)",
							color: "#e8ecff",
							outline: "none",
							"font-size": "0.8rem",
						}}
					/>
					<button
						type="button"
						onClick={newDocument}
						style={{
							border: "1px solid rgba(255,255,255,0.16)",
							background: "rgba(255,255,255,0.08)",
							color: "#e8ecff",
							"border-radius": "8px",
							padding: "0.4rem 0.6rem",
							"font-size": "0.78rem",
							cursor: "pointer",
						}}
					>
						New
					</button>
					<button
						type="button"
						onClick={() => setContent("")}
						style={{
							border: "1px solid rgba(255,255,255,0.16)",
							background: "rgba(255,255,255,0.08)",
							color: "#e8ecff",
							"border-radius": "8px",
							padding: "0.4rem 0.6rem",
							"font-size": "0.78rem",
							cursor: "pointer",
						}}
					>
						Clear
					</button>
					<button
						type="button"
						onClick={insertSample}
						style={{
							border: "none",
							background: "linear-gradient(135deg, #62d2ff, #5f72ff)",
							color: "#0a1328",
							"border-radius": "8px",
							padding: "0.4rem 0.65rem",
							"font-size": "0.78rem",
							"font-weight": "700",
							cursor: "pointer",
						}}
					>
						Insert Sample
					</button>
				</div>

				<textarea
					value={content()}
					onInput={(e) => setContent(e.currentTarget.value)}
					spellcheck={false}
					aria-label="Editor content"
					style={{
						flex: "1",
						border: "none",
						outline: "none",
						resize: "none",
						background: "rgba(6,10,22,0.95)",
						color: "#cfe4ff",
						padding: "1rem",
						"font-size": "0.9rem",
						"line-height": "1.5",
						"font-family": "Consolas, 'Courier New', monospace",
					}}
				/>

				<div
					style={{
						display: "flex",
						"justify-content": "space-between",
						"align-items": "center",
						gap: "0.65rem",
						padding: "0.55rem 0.95rem",
						border: "1px solid rgba(255,255,255,0.08)",
						"border-left": "none",
						"border-right": "none",
						"border-bottom": "none",
						color: "#91a8cf",
						"font-size": "0.76rem",
					}}
				>
					<span>{title() || "Untitled.txt"}</span>
					<span>{lineCount()} lines • {characterCount()} chars</span>
				</div>
			</div>
		</Windows>
	);
}
