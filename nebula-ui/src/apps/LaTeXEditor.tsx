import { For, createMemo, createSignal, onMount } from "solid-js";
import Windows from "../components/Windows";

type LaTeXEditorProps = {
	onClose: () => void;
	onMinimize: () => void;
	onFocus: () => void;
	zIndex: number;
};

// ── Default document ──────────────────────────────────────────────────────────
const DEFAULT_SOURCE = `\\documentclass{article}
\\title{My Nebula Document}
\\author{Author}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}
Welcome to the \\textbf{Nebula LaTeX Editor}.
You can write \\LaTeX{} and see a live preview on the right.

\\section{Mathematics}
Inline math: $E = mc^2$ and $a^2 + b^2 = c^2$.

Display math:
$$\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}$$

The quadratic formula:
$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

\\section{Lists}
\\begin{itemize}
  \\item First item
  \\item Second item
  \\item Third item
\\end{itemize}

\\begin{enumerate}
  \\item Alpha
  \\item Beta
  \\item Gamma
\\end{enumerate}

\\section{Table}
\\begin{tabular}{|c|c|c|}
  \\hline
  \\textbf{Name} & \\textbf{Value} & \\textbf{Unit} \\\\
  \\hline
  Speed of light & $3 \\times 10^8$ & m/s \\\\
  Planck constant & $6.626 \\times 10^{-34}$ & J·s \\\\
  \\hline
\\end{tabular}

\\end{document}`;

// ── Snippet library ───────────────────────────────────────────────────────────
const SNIPPETS: { label: string; insert: string }[] = [
	{ label: "Inline math", insert: "$...$" },
	{ label: "Display math", insert: "$$\n...\n$$" },
	{ label: "Fraction", insert: "\\frac{numerator}{denominator}" },
	{ label: "Sum", insert: "\\sum_{i=0}^{n}" },
	{ label: "Integral", insert: "\\int_{a}^{b} f(x)\\,dx" },
	{ label: "Matrix", insert: "\\begin{pmatrix}\na & b \\\\\nc & d\n\\end{pmatrix}" },
	{ label: "Align", insert: "\\begin{align}\n  a &= b + c \\\\\n  d &= e - f\n\\end{align}" },
	{ label: "Itemize", insert: "\\begin{itemize}\n  \\item ...\n\\end{itemize}" },
	{ label: "Enumerate", insert: "\\begin{enumerate}\n  \\item ...\n\\end{enumerate}" },
	{ label: "Bold", insert: "\\textbf{text}" },
	{ label: "Italic", insert: "\\textit{text}" },
	{ label: "Section", insert: "\\section{Title}" },
	{ label: "Subsection", insert: "\\subsection{Title}" },
	{ label: "Greek α", insert: "\\alpha" },
	{ label: "Greek β", insert: "\\beta" },
	{ label: "Greek γ", insert: "\\gamma" },
	{ label: "Greek Σ", insert: "\\Sigma" },
	{ label: "Greek π", insert: "\\pi" },
	{ label: "√", insert: "\\sqrt{x}" },
	{ label: "Limit", insert: "\\lim_{x \\to \\infty}" },
];

// ── KaTeX srcdoc builder ──────────────────────────────────────────────────────
/**
 * Converts LaTeX source (preamble stripped) into an HTML document that uses
 * KaTeX auto-render from CDN for math, and basic CSS for structural commands.
 */
function buildPreviewHTML(source: string): string {
	// Extract body content between \begin{document} and \end{document}
	const bodyMatch = source.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
	let body = bodyMatch ? bodyMatch[1] : source;

	// Extract title/author/date from preamble
	const titleMatch = source.match(/\\title\{([^}]*)\}/);
	const authorMatch = source.match(/\\author\{([^}]*)\}/);

	// ── Structural transforms ─────────────────────────────────────────────────
	const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

	// Process tabular environments before general escaping
	body = body.replace(
		/\\begin\{tabular\}\{[^}]*\}([\s\S]*?)\\end\{tabular\}/g,
		(_, content) => {
			const rows = content
				.split("\\\\")
				.map((r: string) => r.trim())
				.filter((r: string) => r && r !== "\\hline");
			const tableRows = rows
				.map((row: string) => {
					const cols = row.split("&").map((c: string) => `<td>${c.trim()}</td>`).join("");
					return `<tr>${cols}</tr>`;
				})
				.join("");
			return `<table>${tableRows}</table>`;
		},
	);

	// Itemize
	body = body.replace(
		/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g,
		(_, content) => {
			const items = content
				.split("\\item")
				.slice(1)
				.map((s: string) => `<li>${s.trim()}</li>`)
				.join("");
			return `<ul>${items}</ul>`;
		},
	);

	// Enumerate
	body = body.replace(
		/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g,
		(_, content) => {
			const items = content
				.split("\\item")
				.slice(1)
				.map((s: string) => `<li>${s.trim()}</li>`)
				.join("");
			return `<ol>${items}</ol>`;
		},
	);

	// align / equation environments → keep as KaTeX display math
	body = body.replace(/\\begin\{(align\*?|equation\*?)\}([\s\S]*?)\\end\{\1\}/g, (_, __, content) => {
		return `$$${content}$$`;
	});

	// Strip remaining unknown environments
	body = body.replace(/\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}/g, (m) => m);

	// Inline formatting
	body = body.replace(/\\textbf\{([^}]*)\}/g, "<strong>$1</strong>");
	body = body.replace(/\\textit\{([^}]*)\}/g, "<em>$1</em>");
	body = body.replace(/\\underline\{([^}]*)\}/g, "<u>$1</u>");
	body = body.replace(/\\texttt\{([^}]*)\}/g, "<code>$1</code>");
	body = body.replace(/\\emph\{([^}]*)\}/g, "<em>$1</em>");

	// Sectioning
	body = body.replace(/\\section\{([^}]*)\}/g, "<h2>$1</h2>");
	body = body.replace(/\\subsection\{([^}]*)\}/g, "<h3>$1</h3>");
	body = body.replace(/\\subsubsection\{([^}]*)\}/g, "<h4>$1</h4>");

	// Maketitle
	const titleHtml = titleMatch
		? `<div class="title-block"><h1>${titleMatch[1]}</h1>${authorMatch ? `<p class="author">${authorMatch[1]}</p>` : ""}</div>`
		: "";
	body = body.replace(/\\maketitle/, titleHtml);

	// \\LaTeX{} / \\TeX{}
	body = body.replace(/\\LaTeX\{\}/g, "<span class='latex'>L<sup>a</sup>T<sub>e</sub>X</span>");
	body = body.replace(/\\TeX\{\}/g, "<span class='latex'>T<sub>e</sub>X</span>");

	// \\today
	body = body.replace(/\\today/g, new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));

	// Newline: \\ outside math → <br>
	body = body.replace(/(?<![\$\\])\\\\(?![\$])/g, "<br>");

	// Paragraph breaks
	body = body.replace(/\n{2,}/g, "</p><p>");
	body = `<p>${body}</p>`;

	// Strip remaining bare commands
	body = body.replace(/\\[a-zA-Z]+(\{[^}]*\})?/g, (m, arg) => (arg ? arg.slice(1, -1) : ""));

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"
  onload="renderMathInElement(document.body,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}]})"></script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Georgia', serif;
    font-size: 14px;
    line-height: 1.8;
    color: #1a1a2e;
    background: #f9f9fb;
    padding: 40px 56px;
    max-width: 780px;
    margin: 0 auto;
  }
  h1 { font-size: 1.7em; margin-bottom: 0.2em; text-align: center; }
  h2 { font-size: 1.25em; margin: 1.4em 0 0.4em; border-bottom: 1px solid #ccc; padding-bottom: 2px; }
  h3 { font-size: 1.1em; margin: 1.1em 0 0.3em; }
  h4 { font-size: 1em; margin: 0.9em 0 0.2em; font-style: italic; }
  p  { margin: 0.5em 0; }
  ul, ol { margin: 0.5em 0 0.5em 1.8em; }
  li { margin: 0.2em 0; }
  code { font-family: monospace; background: #eee; padding: 1px 4px; border-radius: 3px; font-size: 0.9em; }
  strong { font-weight: bold; }
  em { font-style: italic; }
  u { text-decoration: underline; }
  .title-block { text-align: center; margin-bottom: 1.8em; }
  .author { margin-top: 0.4em; color: #444; font-style: italic; }
  .latex sup { font-size: 0.65em; vertical-align: 0.45em; }
  .latex sub { font-size: 0.65em; vertical-align: -0.2em; }
  table { border-collapse: collapse; margin: 1em 0; }
  td, th { border: 1px solid #bbb; padding: 4px 10px; }
  .katex-display { margin: 1em 0; overflow-x: auto; }
</style>
</head>
<body>${body}</body>
</html>`;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const BTN: Record<string, string> = {
	border: "1px solid rgba(255,255,255,0.13)",
	background: "rgba(255,255,255,0.07)",
	color: "#cdd6f4",
	"border-radius": "6px",
	padding: "0.32rem 0.65rem",
	"font-size": "0.76rem",
	cursor: "pointer",
};

const BTN_ACCENT: Record<string, string> = {
	...BTN,
	background: "rgba(59,130,246,0.25)",
	border: "1px solid rgba(59,130,246,0.45)",
	color: "#93c5fd",
};

export default function LaTeXEditor(props: LaTeXEditorProps) {
	const [title, setTitle] = createSignal("document.tex");
	const [source, setSource] = createSignal(DEFAULT_SOURCE);
	const [compiled, setCompiled] = createSignal(buildPreviewHTML(DEFAULT_SOURCE));
	const [autoCompile, setAutoCompile] = createSignal(true);
	const [cursorPos, setCursorPos] = createSignal({ line: 1, col: 1 });
	const [showSnippets, setShowSnippets] = createSignal(false);

	let textareaRef: HTMLTextAreaElement | undefined;
	let iframeRef: HTMLIFrameElement | undefined;
	let compileTimer: ReturnType<typeof setTimeout> | undefined;

	// ── Compile ────────────────────────────────────────────────────────────────
	const compile = () => setCompiled(buildPreviewHTML(source()));

	const scheduleCompile = () => {
		if (!autoCompile()) return;
		clearTimeout(compileTimer);
		compileTimer = setTimeout(compile, 600);
	};

	onMount(() => compile());

	// ── Stats ─────────────────────────────────────────────────────────────────
	const lineCount = createMemo(() => source().split("\n").length);

	const updateCursor = (ta: HTMLTextAreaElement) => {
		const val = ta.value.slice(0, ta.selectionStart);
		const lines = val.split("\n");
		setCursorPos({ line: lines.length, col: lines[lines.length - 1].length + 1 });
	};

	// ── Snippet insert ────────────────────────────────────────────────────────
	const insertSnippet = (text: string) => {
		if (!textareaRef) return;
		const start = textareaRef.selectionStart;
		const end = textareaRef.selectionEnd;
		const before = source().slice(0, start);
		const after = source().slice(end);
		const newSource = before + text + after;
		setSource(newSource);
		scheduleCompile();
		setShowSnippets(false);
		// Restore focus
		requestAnimationFrame(() => {
			if (!textareaRef) return;
			textareaRef.focus();
			const cursor = start + text.length;
			textareaRef.selectionStart = cursor;
			textareaRef.selectionEnd = cursor;
		});
	};

	// ── Export .tex ───────────────────────────────────────────────────────────
	const exportTex = () => {
		const blob = new Blob([source()], { type: "text/plain" });
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = title().endsWith(".tex") ? title() : `${title()}.tex`;
		a.click();
		URL.revokeObjectURL(a.href);
	};

	// ── Tab key in textarea ───────────────────────────────────────────────────
	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Tab") {
			e.preventDefault();
			if (!textareaRef) return;
			const start = textareaRef.selectionStart;
			const end = textareaRef.selectionEnd;
			const newSource = source().slice(0, start) + "  " + source().slice(end);
			setSource(newSource);
			requestAnimationFrame(() => {
				if (!textareaRef) return;
				textareaRef.selectionStart = start + 2;
				textareaRef.selectionEnd = start + 2;
			});
		}
	};

	return (
		<Windows
			title={`LaTeX – ${title()}`}
			icon="∑"
			onClose={props.onClose}
			onMinimize={props.onMinimize}
			onFocus={props.onFocus}
			zIndex={props.zIndex}
			top="50%"
			left="50%"
			width="min(1100px, 97vw)"
			height="min(700px, 92vh)"
			background="rgba(8,12,26,0.97)"
		>
			<div style={{ display: "flex", "flex-direction": "column", height: "100%", overflow: "hidden" }}>

				{/* ── Header ──────────────────────────────────────────────────────── */}
				<div
					style={{
						display: "flex",
						"align-items": "center",
						gap: "0.5rem",
						padding: "0.45rem 0.85rem",
						"border-bottom": "1px solid rgba(255,255,255,0.07)",
						"flex-wrap": "wrap",
					}}
				>
					<input
						type="text"
						value={title()}
						onInput={(e) => setTitle(e.currentTarget.value)}
						aria-label="File name"
						style={{
							width: "160px",
							padding: "0.3rem 0.5rem",
							"border-radius": "6px",
							border: "1px solid rgba(255,255,255,0.13)",
							background: "rgba(255,255,255,0.06)",
							color: "#e8ecff",
							outline: "none",
							"font-size": "0.8rem",
						}}
					/>

					{/* Snippets dropdown */}
					<div style={{ position: "relative" }}>
						<button
							type="button"
							onClick={() => setShowSnippets((v) => !v)}
							style={BTN}
						>
							Insert ▾
						</button>
						{showSnippets() && (
							<div
								style={{
									position: "absolute",
									top: "calc(100% + 4px)",
									left: 0,
									"z-index": 9999,
									background: "rgba(15,20,42,0.98)",
									border: "1px solid rgba(255,255,255,0.14)",
									"border-radius": "8px",
									padding: "0.35rem 0",
									"min-width": "180px",
									"box-shadow": "0 8px 28px rgba(0,0,0,0.6)",
									"max-height": "280px",
									"overflow-y": "auto",
								}}
							>
								<For each={SNIPPETS}>
									{(s) => (
										<button
											type="button"
											onClick={() => insertSnippet(s.insert)}
											style={{
												display: "block",
												width: "100%",
												"text-align": "left",
												border: "none",
												background: "transparent",
												color: "#cdd6f4",
												padding: "0.32rem 0.85rem",
												"font-size": "0.78rem",
												cursor: "pointer",
											}}
											onMouseEnter={(e) =>
												(e.currentTarget.style.background = "rgba(255,255,255,0.08)")
											}
											onMouseLeave={(e) =>
												(e.currentTarget.style.background = "transparent")
											}
										>
											{s.label}
										</button>
									)}
								</For>
							</div>
						)}
					</div>

					<button type="button" onClick={compile} style={BTN_ACCENT}>
						▶ Compile
					</button>

					<label
						style={{
							display: "flex",
							"align-items": "center",
							gap: "0.35rem",
							"font-size": "0.76rem",
							color: "#a6adc8",
							cursor: "pointer",
							"user-select": "none",
						}}
					>
						<input
							type="checkbox"
							checked={autoCompile()}
							onChange={(e) => setAutoCompile(e.currentTarget.checked)}
							style={{ cursor: "pointer" }}
						/>
						Auto
					</label>

					<button
						type="button"
						onClick={() => {
							setSource(DEFAULT_SOURCE);
							setTitle("document.tex");
							scheduleCompile();
						}}
						style={BTN}
					>
						Reset
					</button>

					<button type="button" onClick={exportTex} style={{ ...BTN, "margin-left": "auto" }}>
						Export .tex
					</button>
				</div>

				{/* ── Split pane ───────────────────────────────────────────────────── */}
				<div style={{ display: "flex", flex: "1", overflow: "hidden" }}>

					{/* Editor pane */}
					<div
						style={{
							flex: "1",
							display: "flex",
							"flex-direction": "column",
							"border-right": "1px solid rgba(255,255,255,0.07)",
							overflow: "hidden",
						}}
					>
						<div
							style={{
								padding: "0.25rem 0.85rem",
								"font-size": "0.7rem",
								color: "#6c7086",
								"border-bottom": "1px solid rgba(255,255,255,0.05)",
								"user-select": "none",
							}}
						>
							Source
						</div>

						{/* Line numbers + textarea */}
						<div style={{ flex: "1", display: "flex", overflow: "hidden" }}>
							{/* Line numbers */}
							<div
								style={{
									width: "42px",
									"min-width": "42px",
									overflow: "hidden",
									"text-align": "right",
									padding: "10px 6px 10px 0",
									"font-family": "'Courier New', monospace",
									"font-size": "0.72rem",
									"line-height": "1.55",
									color: "#45475a",
									background: "rgba(255,255,255,0.02)",
									"border-right": "1px solid rgba(255,255,255,0.06)",
									"user-select": "none",
									"pointer-events": "none",
								}}
								aria-hidden="true"
							>
								{Array.from({ length: lineCount() }, (_, i) => (
									<div
										style={{
											color: cursorPos().line === i + 1 ? "#89b4fa" : "#45475a",
										}}
									>
										{i + 1}
									</div>
								))}
							</div>

							{/* Code textarea */}
							<textarea
								ref={textareaRef}
								value={source()}
								onInput={(e) => {
									setSource(e.currentTarget.value);
									updateCursor(e.currentTarget);
									scheduleCompile();
								}}
								onKeyDown={onKeyDown}
								onKeyUp={(e) => updateCursor(e.currentTarget as HTMLTextAreaElement)}
								onClick={(e) => updateCursor(e.currentTarget as HTMLTextAreaElement)}
								spellcheck={false}
								style={{
									flex: "1",
									resize: "none",
									border: "none",
									outline: "none",
									background: "transparent",
									color: "#cdd6f4",
									"font-family": "'Courier New', Courier, monospace",
									"font-size": "0.8rem",
									"line-height": "1.55",
									padding: "10px 12px",
									"white-space": "pre",
									"overflow-wrap": "normal",
									"overflow-x": "auto",
									"tab-size": 2,
								}}
							/>
						</div>
					</div>

					{/* Preview pane */}
					<div
						style={{
							flex: "1",
							display: "flex",
							"flex-direction": "column",
							overflow: "hidden",
						}}
					>
						<div
							style={{
								padding: "0.25rem 0.85rem",
								"font-size": "0.7rem",
								color: "#6c7086",
								"border-bottom": "1px solid rgba(255,255,255,0.05)",
								"user-select": "none",
							}}
						>
							Preview
						</div>
						<iframe
							ref={iframeRef}
							srcdoc={compiled()}
							sandbox="allow-scripts"
							style={{
								flex: "1",
								border: "none",
								background: "#f9f9fb",
							}}
							title="LaTeX Preview"
						/>
					</div>
				</div>

				{/* ── Status bar ───────────────────────────────────────────────────── */}
				<div
					style={{
						display: "flex",
						"align-items": "center",
						gap: "1.2rem",
						padding: "0.28rem 1rem",
						"border-top": "1px solid rgba(255,255,255,0.07)",
						"font-size": "0.72rem",
						color: "rgba(205,214,244,0.45)",
						"user-select": "none",
					}}
				>
					<span>Ln {cursorPos().line}, Col {cursorPos().col}</span>
					<span>{lineCount()} lines</span>
					<span>{source().length} chars</span>
					<span style={{ "margin-left": "auto" }}>Nebula LaTeX Editor</span>
				</div>
			</div>
		</Windows>
	);
}
