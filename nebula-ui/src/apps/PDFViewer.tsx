import { createMemo, createSignal, onCleanup } from "solid-js";
import Windows from "../components/Windows";

type PDFViewerProps = {
	onClose: () => void;
	onMinimize: () => void;
	onFocus: () => void;
	zIndex: number;
};

const SAMPLE_DOCS = [
	{
		title: "Tracemonkey Paper",
		url: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
	},
	{
		title: "Dummy PDF",
		url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
	},
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function PDFViewer(props: PDFViewerProps) {
	const [title, setTitle] = createSignal("Document.pdf");
	const [pdfUrl, setPdfUrl] = createSignal(SAMPLE_DOCS[0].url);
	const [urlInput, setUrlInput] = createSignal(SAMPLE_DOCS[0].url);
	const [page, setPage] = createSignal(1);
	const [zoom, setZoom] = createSignal(1.1);
	const [errorText, setErrorText] = createSignal("");

	let localObjectUrl: string | null = null;

	const viewerSrc = createMemo(() => {
		const pageValue = Math.max(1, page());
		const zoomPercent = Math.round(zoom() * 100);
		return `${pdfUrl()}#page=${pageValue}&zoom=${zoomPercent}`;
	});

	const setDocument = (nextUrl: string, nextTitle?: string) => {
		setPdfUrl(nextUrl);
		setUrlInput(nextUrl);
		setPage(1);
		setErrorText("");
		if (nextTitle) setTitle(nextTitle);
	};

	const applyTypedUrl = () => {
		const typed = urlInput().trim();
		if (!typed) {
			setErrorText("Please enter a PDF URL.");
			return;
		}

		if (!/^https?:\/\//i.test(typed) && !typed.startsWith("blob:")) {
			setErrorText("Only http(s) and local blob URLs are supported.");
			return;
		}

		setDocument(typed, typed.split("/").pop() || "Document.pdf");
	};

	const loadLocalFile = (event: Event) => {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		if (localObjectUrl) {
			URL.revokeObjectURL(localObjectUrl);
			localObjectUrl = null;
		}

		const objectUrl = URL.createObjectURL(file);
		localObjectUrl = objectUrl;
		setDocument(objectUrl, file.name);
		input.value = "";
	};

	onCleanup(() => {
		if (localObjectUrl) URL.revokeObjectURL(localObjectUrl);
	});

	return (
		<Windows
			title={`PDF Viewer - ${title()}`}
			icon="📕"
			onClose={props.onClose}
			onMinimize={props.onMinimize}
			onFocus={props.onFocus}
			zIndex={props.zIndex}
			top="50%"
			left="51%"
			width="min(1100px, 97vw)"
			height="min(720px, 92vh)"
			background="rgba(8,12,24,0.97)"
		>
			<div style={{ display: "flex", "flex-direction": "column", height: "100%" }}>
				<div
					style={{
						display: "flex",
						"align-items": "center",
						gap: "0.5rem",
						padding: "0.55rem 0.8rem",
						"border-bottom": "1px solid rgba(255,255,255,0.08)",
						"flex-wrap": "wrap",
					}}
				>
					<label
						style={{
							border: "1px solid rgba(255,255,255,0.14)",
							background: "rgba(255,255,255,0.07)",
							color: "#dbe5ff",
							"border-radius": "7px",
							padding: "0.35rem 0.55rem",
							cursor: "pointer",
							"font-size": "0.78rem",
						}}
					>
						Open Local PDF
						<input type="file" accept="application/pdf" onChange={loadLocalFile} style={{ display: "none" }} />
					</label>

					<input
						type="text"
						value={urlInput()}
						onInput={(e) => setUrlInput(e.currentTarget.value)}
						placeholder="Paste PDF URL..."
						style={{
							flex: "1",
							"min-width": "260px",
							padding: "0.35rem 0.5rem",
							"border-radius": "7px",
							border: "1px solid rgba(255,255,255,0.14)",
							background: "rgba(255,255,255,0.06)",
							color: "#dbe5ff",
							outline: "none",
							"font-size": "0.78rem",
						}}
					/>

					<button
						type="button"
						onClick={applyTypedUrl}
						style={{
							border: "1px solid rgba(255,255,255,0.14)",
							background: "rgba(99,102,241,0.24)",
							color: "#dbe5ff",
							"border-radius": "7px",
							padding: "0.34rem 0.6rem",
							"font-size": "0.78rem",
							cursor: "pointer",
						}}
					>
						Load URL
					</button>

					<select
						onChange={(e) => {
							const pick = SAMPLE_DOCS.find((d) => d.url === e.currentTarget.value);
							if (pick) setDocument(pick.url, `${pick.title}.pdf`);
						}}
						style={{
							background: "rgba(255,255,255,0.06)",
							border: "1px solid rgba(255,255,255,0.14)",
							color: "#dbe5ff",
							"border-radius": "7px",
							padding: "0.32rem 0.5rem",
							"font-size": "0.78rem",
						}}
					>
						<option value="">Samples</option>
						{SAMPLE_DOCS.map((doc) => (
							<option value={doc.url}>{doc.title}</option>
						))}
					</select>
				</div>

				<div
					style={{
						display: "flex",
						"align-items": "center",
						gap: "0.45rem",
						padding: "0.4rem 0.8rem",
						"border-bottom": "1px solid rgba(255,255,255,0.08)",
						color: "#c4cde7",
						"font-size": "0.78rem",
					}}
				>
					<button
						type="button"
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						style={{ border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.07)", color: "#dbe5ff", "border-radius": "7px", padding: "0.28rem 0.5rem", cursor: "pointer" }}
					>
						Prev
					</button>
					<span>Page</span>
					<input
						type="number"
						min="1"
						value={page()}
						onInput={(e) => setPage(Math.max(1, Number(e.currentTarget.value || 1)))}
						style={{ width: "68px", padding: "0.24rem 0.35rem", "border-radius": "6px", border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)", color: "#dbe5ff" }}
					/>
					<button
						type="button"
						onClick={() => setPage((p) => p + 1)}
						style={{ border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.07)", color: "#dbe5ff", "border-radius": "7px", padding: "0.28rem 0.5rem", cursor: "pointer" }}
					>
						Next
					</button>

					<div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.1)", margin: "0 0.2rem" }} />

					<button
						type="button"
						onClick={() => setZoom((z) => clamp(z - 0.1, 0.5, 3))}
						style={{ border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.07)", color: "#dbe5ff", "border-radius": "7px", padding: "0.28rem 0.5rem", cursor: "pointer" }}
					>
						-
					</button>
					<span>{Math.round(zoom() * 100)}%</span>
					<button
						type="button"
						onClick={() => setZoom((z) => clamp(z + 0.1, 0.5, 3))}
						style={{ border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.07)", color: "#dbe5ff", "border-radius": "7px", padding: "0.28rem 0.5rem", cursor: "pointer" }}
					>
						+
					</button>
					<button
						type="button"
						onClick={() => setZoom(1.1)}
						style={{ border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.07)", color: "#dbe5ff", "border-radius": "7px", padding: "0.28rem 0.5rem", cursor: "pointer" }}
					>
						Reset
					</button>
					<span style={{ "margin-left": "auto", color: "#8f98b5" }}>{title()}</span>
				</div>

				{errorText() && (
					<div
						style={{
							margin: "0.5rem 0.8rem 0",
							color: "#f38ba8",
							border: "1px solid rgba(243,139,168,0.35)",
							background: "rgba(243,139,168,0.08)",
							"border-radius": "8px",
							padding: "0.45rem 0.55rem",
							"font-size": "0.78rem",
						}}
					>
						{errorText()}
					</div>
				)}

				<div style={{ flex: "1", padding: "0.65rem 0.8rem 0.8rem" }}>
					<iframe
						src={viewerSrc()}
						title="PDF Viewer"
						style={{
							width: "100%",
							height: "100%",
							border: "1px solid rgba(255,255,255,0.08)",
							"border-radius": "10px",
							background: "#0b1020",
						}}
					/>
				</div>
			</div>
		</Windows>
	);
}
