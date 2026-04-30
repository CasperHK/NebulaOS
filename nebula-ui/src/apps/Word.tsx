import { createEffect, createMemo, createSignal, onMount } from "solid-js";
import Windows from "../components/Windows";

type WordProps = {
	onClose: () => void;
	onMinimize: () => void;
	onFocus: () => void;
	zIndex: number;
	initialTitle?: string;
	initialContent?: string;
};

type Alignment = "left" | "center" | "right" | "justify";

const FONT_SIZES = ["10", "11", "12", "14", "16", "18", "20", "24", "28", "32", "36", "48", "72"];
const FONT_FAMILIES = [
	"Arial",
	"Georgia",
	"Times New Roman",
	"Courier New",
	"Verdana",
	"Trebuchet MS",
	"Impact",
];

const TOOLBAR_BTN: Record<string, string> = {
	display: "inline-flex",
	"align-items": "center",
	"justify-content": "center",
	width: "28px",
	height: "26px",
	border: "1px solid transparent",
	"border-radius": "5px",
	background: "transparent",
	color: "#cdd6f4",
	cursor: "pointer",
	"font-size": "0.78rem",
	transition: "background 0.15s, border-color 0.15s",
};

const TOOLBAR_BTN_ACTIVE: Record<string, string> = {
	...TOOLBAR_BTN,
	background: "rgba(139,173,255,0.18)",
	"border-color": "rgba(139,173,255,0.35)",
};

const SELECT_STYLE: Record<string, string> = {
	background: "rgba(255,255,255,0.07)",
	border: "1px solid rgba(255,255,255,0.14)",
	color: "#cdd6f4",
	"border-radius": "5px",
	padding: "2px 4px",
	"font-size": "0.77rem",
	cursor: "pointer",
	outline: "none",
};

export default function Word(props: WordProps) {
	const [title, setTitle] = createSignal(props.initialTitle ?? "Untitled Document");
	let editorRef: HTMLDivElement | undefined;

	createEffect(() => {
		setTitle(props.initialTitle ?? "Untitled Document");
	});

	// ── formatting state (for active-button highlighting) ──────────────────────
	const [isBold, setIsBold] = createSignal(false);
	const [isItalic, setIsItalic] = createSignal(false);
	const [isUnderline, setIsUnderline] = createSignal(false);
	const [isStrike, setIsStrike] = createSignal(false);
	const [alignment, setAlignment] = createSignal<Alignment>("left");
	const [fontSize, setFontSize] = createSignal("12");
	const [fontFamily, setFontFamily] = createSignal("Arial");

	// ── word / char counts ──────────────────────────────────────────────────────
	const [rawText, setRawText] = createSignal("");

	const wordCount = createMemo(() => {
		const t = rawText().trim();
		if (!t) return 0;
		return t.split(/\s+/).length;
	});

	const charCount = createMemo(() => rawText().length);

	// ── helpers ─────────────────────────────────────────────────────────────────
	const exec = (command: string, value?: string) => {
		document.execCommand(command, false, value ?? "");
		editorRef?.focus();
		syncFormatState();
	};

	const syncFormatState = () => {
		setIsBold(document.queryCommandState("bold"));
		setIsItalic(document.queryCommandState("italic"));
		setIsUnderline(document.queryCommandState("underline"));
		setIsStrike(document.queryCommandState("strikeThrough"));

		const align = (["justifyLeft", "justifyCenter", "justifyRight", "justifyFull"] as const).find(
			(cmd) => document.queryCommandState(cmd),
		);
		if (align === "justifyCenter") setAlignment("center");
		else if (align === "justifyRight") setAlignment("right");
		else if (align === "justifyFull") setAlignment("justify");
		else setAlignment("left");

		const size = document.queryCommandValue("fontSize");
		// execCommand uses 1-7 scale; map back
		const sizeMap: Record<string, string> = {
			"1": "10",
			"2": "11",
			"3": "12",
			"4": "14",
			"5": "18",
			"6": "24",
			"7": "36",
		};
		if (size && sizeMap[size]) setFontSize(sizeMap[size]);

		const font = document.queryCommandValue("fontName");
		if (font) setFontFamily(font.replace(/['"]/g, "").split(",")[0].trim());
	};

	const applyFontSize = (px: string) => {
		setFontSize(px);
		// Wrap selection in a span with explicit font-size since execCommand fontSize uses 1-7
		const sel = window.getSelection();
		if (!sel || sel.rangeCount === 0) return;
		const range = sel.getRangeAt(0);
		if (range.collapsed) return;
		const span = document.createElement("span");
		span.style.fontSize = `${px}px`;
		range.surroundContents(span);
		editorRef?.focus();
	};

	const applyFontFamily = (family: string) => {
		setFontFamily(family);
		exec("fontName", family);
	};

	const applyAlignment = (align: Alignment) => {
		const cmdMap: Record<Alignment, string> = {
			left: "justifyLeft",
			center: "justifyCenter",
			right: "justifyRight",
			justify: "justifyFull",
		};
		exec(cmdMap[align]);
		setAlignment(align);
	};

	const insertLink = () => {
		const url = prompt("Enter URL:");
		if (url) exec("createLink", url);
	};

	const insertHR = () => {
		exec("insertHorizontalRule");
	};

	onMount(() => {
		if (editorRef && props.initialContent) {
			editorRef.innerHTML = props.initialContent;
			setRawText(editorRef.innerText);
		} else if (editorRef) {
			editorRef.innerHTML =
				'<p style="font-family:Arial;font-size:12px;color:#cdd6f4;">Start typing your document here…</p>';
			setRawText(editorRef.innerText);
		}
	});

	const toolbarDivider = () => (
		<div
			style={{
				width: "1px",
				height: "18px",
				background: "rgba(255,255,255,0.12)",
				margin: "0 4px",
				"align-self": "center",
			}}
		/>
	);

	return (
		<Windows
			title={`Word – ${title()}`}
			icon="📄"
			onClose={props.onClose}
			onMinimize={props.onMinimize}
			onFocus={props.onFocus}
			zIndex={props.zIndex}
			top="50%"
			left="50%"
			width="min(960px, 96vw)"
			height="min(680px, 90vh)"
			background="rgba(8,12,26,0.97)"
		>
			<div style={{ display: "flex", "flex-direction": "column", height: "100%" }}>
				{/* ── Title Bar ───────────────────────────────────────────────────── */}
				<div
					style={{
						display: "flex",
						"align-items": "center",
						gap: "0.5rem",
						padding: "0.5rem 0.85rem",
						"border-bottom": "1px solid rgba(255,255,255,0.07)",
					}}
				>
					<input
						type="text"
						value={title()}
						onInput={(e) => setTitle(e.currentTarget.value)}
						aria-label="Document title"
						style={{
							flex: "1",
							"max-width": "260px",
							padding: "0.38rem 0.55rem",
							"border-radius": "7px",
							border: "1px solid rgba(255,255,255,0.13)",
							background: "rgba(255,255,255,0.06)",
							color: "#e8ecff",
							outline: "none",
							"font-size": "0.8rem",
						}}
					/>
					<button
						type="button"
						onClick={() => {
							if (editorRef) {
								editorRef.innerHTML =
									'<p style="font-family:Arial;font-size:12px;color:#cdd6f4;"></p>';
								setTitle("Untitled Document");
								setRawText("");
							}
						}}
						style={{
							border: "1px solid rgba(255,255,255,0.14)",
							background: "rgba(255,255,255,0.07)",
							color: "#cdd6f4",
							"border-radius": "7px",
							padding: "0.35rem 0.65rem",
							"font-size": "0.78rem",
							cursor: "pointer",
						}}
					>
						New
					</button>
					<button
						type="button"
						onClick={() => {
							if (!editorRef) return;
							const blob = new Blob([editorRef.innerHTML], { type: "text/html" });
							const a = document.createElement("a");
							a.href = URL.createObjectURL(blob);
							a.download = `${title().replace(/\s+/g, "_")}.html`;
							a.click();
							URL.revokeObjectURL(a.href);
						}}
						style={{
							border: "1px solid rgba(255,255,255,0.14)",
							background: "rgba(255,255,255,0.07)",
							color: "#cdd6f4",
							"border-radius": "7px",
							padding: "0.35rem 0.65rem",
							"font-size": "0.78rem",
							cursor: "pointer",
						}}
					>
						Export
					</button>
				</div>

				{/* ── Toolbar ─────────────────────────────────────────────────────── */}
				<div
					style={{
						display: "flex",
						"flex-wrap": "wrap",
						"align-items": "center",
						gap: "2px",
						padding: "0.4rem 0.85rem",
						"border-bottom": "1px solid rgba(255,255,255,0.07)",
						"background": "rgba(255,255,255,0.025)",
					}}
				>
					{/* Font family */}
					<select
						value={fontFamily()}
						onChange={(e) => applyFontFamily(e.currentTarget.value)}
						style={{ ...SELECT_STYLE, width: "120px" }}
						aria-label="Font family"
					>
						{FONT_FAMILIES.map((f) => (
							<option value={f}>{f}</option>
						))}
					</select>

					{/* Font size */}
					<select
						value={fontSize()}
						onChange={(e) => applyFontSize(e.currentTarget.value)}
						style={{ ...SELECT_STYLE, width: "56px", "margin-left": "4px" }}
						aria-label="Font size"
					>
						{FONT_SIZES.map((s) => (
							<option value={s}>{s}</option>
						))}
					</select>

					{toolbarDivider()}

					{/* Bold */}
					<button
						type="button"
						title="Bold (Ctrl+B)"
						onClick={() => exec("bold")}
						style={isBold() ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN}
					>
						<strong>B</strong>
					</button>

					{/* Italic */}
					<button
						type="button"
						title="Italic (Ctrl+I)"
						onClick={() => exec("italic")}
						style={isItalic() ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN}
					>
						<em>I</em>
					</button>

					{/* Underline */}
					<button
						type="button"
						title="Underline (Ctrl+U)"
						onClick={() => exec("underline")}
						style={isUnderline() ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN}
					>
						<span style={{ "text-decoration": "underline" }}>U</span>
					</button>

					{/* Strikethrough */}
					<button
						type="button"
						title="Strikethrough"
						onClick={() => exec("strikeThrough")}
						style={isStrike() ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN}
					>
						<span style={{ "text-decoration": "line-through" }}>S</span>
					</button>

					{toolbarDivider()}

					{/* Alignment */}
					{(["left", "center", "right", "justify"] as Alignment[]).map((a) => {
						const icons: Record<Alignment, string> = {
							left: "≡",
							center: "≡",
							right: "≡",
							justify: "≡",
						};
						const labels: Record<Alignment, string> = {
							left: "Align Left",
							center: "Align Center",
							right: "Align Right",
							justify: "Justify",
						};
						const svgs: Record<Alignment, string> = {
							left: "▤",
							center: "☰",
							right: "▥",
							justify: "▦",
						};
						return (
							<button
								type="button"
								title={labels[a]}
								onClick={() => applyAlignment(a)}
								style={alignment() === a ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN}
							>
								{svgs[a]}
							</button>
						);
					})}

					{toolbarDivider()}

					{/* Lists */}
					<button
						type="button"
						title="Bullet list"
						onClick={() => exec("insertUnorderedList")}
						style={TOOLBAR_BTN}
					>
						•≡
					</button>
					<button
						type="button"
						title="Numbered list"
						onClick={() => exec("insertOrderedList")}
						style={TOOLBAR_BTN}
					>
						1≡
					</button>

					{toolbarDivider()}

					{/* Indent / Outdent */}
					<button
						type="button"
						title="Increase indent"
						onClick={() => exec("indent")}
						style={TOOLBAR_BTN}
					>
						→|
					</button>
					<button
						type="button"
						title="Decrease indent"
						onClick={() => exec("outdent")}
						style={TOOLBAR_BTN}
					>
						|←
					</button>

					{toolbarDivider()}

					{/* Headings */}
					{(["H1", "H2", "H3"] as const).map((h) => (
						<button
							type="button"
							title={`Heading ${h[1]}`}
							onClick={() => exec("formatBlock", h)}
							style={{ ...TOOLBAR_BTN, width: "auto", padding: "0 6px", "font-size": "0.72rem" }}
						>
							{h}
						</button>
					))}
					<button
						type="button"
						title="Paragraph"
						onClick={() => exec("formatBlock", "P")}
						style={{ ...TOOLBAR_BTN, width: "auto", padding: "0 6px", "font-size": "0.72rem" }}
					>
						¶
					</button>

					{toolbarDivider()}

					{/* Link / HR */}
					<button
						type="button"
						title="Insert link"
						onClick={insertLink}
						style={{ ...TOOLBAR_BTN, width: "auto", padding: "0 6px", "font-size": "0.72rem" }}
					>
						🔗
					</button>
					<button
						type="button"
						title="Insert horizontal rule"
						onClick={insertHR}
						style={{ ...TOOLBAR_BTN, width: "auto", padding: "0 6px", "font-size": "0.72rem" }}
					>
						—
					</button>

					{toolbarDivider()}

					{/* Undo / Redo */}
					<button
						type="button"
						title="Undo (Ctrl+Z)"
						onClick={() => exec("undo")}
						style={TOOLBAR_BTN}
					>
						↩
					</button>
					<button
						type="button"
						title="Redo (Ctrl+Y)"
						onClick={() => exec("redo")}
						style={TOOLBAR_BTN}
					>
						↪
					</button>

					{toolbarDivider()}

					{/* Remove formatting */}
					<button
						type="button"
						title="Remove formatting"
						onClick={() => exec("removeFormat")}
						style={{ ...TOOLBAR_BTN, width: "auto", padding: "0 6px", "font-size": "0.72rem" }}
					>
						Tx
					</button>
				</div>

				{/* ── Editor Canvas ────────────────────────────────────────────────── */}
				<div
					style={{
						flex: "1",
						overflow: "auto",
						background: "rgba(255,255,255,0.015)",
						padding: "0 0 0.5rem 0",
					}}
				>
					<div
						style={{
							"max-width": "780px",
							margin: "1.5rem auto",
							background: "rgba(15,20,40,0.9)",
							"border-radius": "8px",
							"box-shadow": "0 4px 32px rgba(0,0,0,0.45)",
							padding: "3rem 4rem",
							"min-height": "600px",
						}}
					>
						<div
							ref={editorRef}
							contentEditable
							spellcheck={true}
							onKeyUp={syncFormatState}
							onMouseUp={syncFormatState}
							onInput={() => {
								if (editorRef) setRawText(editorRef.innerText);
							}}
							style={{
								outline: "none",
								color: "#cdd6f4",
								"font-family": "Arial, sans-serif",
								"font-size": "12px",
								"line-height": "1.75",
								"min-height": "540px",
								"white-space": "pre-wrap",
								"word-break": "break-word",
							}}
						/>
					</div>
				</div>

				{/* ── Status Bar ──────────────────────────────────────────────────── */}
				<div
					style={{
						display: "flex",
						"align-items": "center",
						gap: "1rem",
						padding: "0.3rem 1rem",
						"border-top": "1px solid rgba(255,255,255,0.07)",
						"font-size": "0.72rem",
						color: "rgba(205,214,244,0.45)",
						"user-select": "none",
					}}
				>
					<span>{wordCount()} words</span>
					<span>{charCount()} characters</span>
					<span style={{ "margin-left": "auto" }}>Nebula Word</span>
				</div>
			</div>
		</Windows>
	);
}
