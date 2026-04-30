import { For, createMemo, createSignal } from "solid-js";
import Windows from "../components/Windows";

type ExcelProps = {
	onClose: () => void;
	onMinimize: () => void;
	onFocus: () => void;
	zIndex: number;
};

// ── Grid constants ────────────────────────────────────────────────────────────
const DEFAULT_COLS = 26; // A–Z
const DEFAULT_ROWS = 50;
const COL_WIDTH = 96;
const ROW_HEIGHT = 26;
const HEADER_COL_WIDTH = 44;

const colLabel = (i: number) => String.fromCharCode(65 + i); // 0→A, 1→B …
const cellId = (r: number, c: number) => `${colLabel(c)}${r + 1}`;

type CellKey = string; // e.g. "A1"
type CellData = { raw: string };

// ── Minimal formula evaluator ─────────────────────────────────────────────────
/**
 * Resolves a cell value (handles =SUM, =AVG, =MAX, =MIN, =COUNT, arithmetic).
 * Returns the display string or an error marker.
 */
function evaluate(
	raw: string,
	cells: Map<CellKey, CellData>,
	visited = new Set<CellKey>(),
): string {
	if (!raw.startsWith("=")) return raw;
	const expr = raw.slice(1).trim().toUpperCase();

	const resolveRef = (ref: string): number => {
		ref = ref.trim();
		if (visited.has(ref)) return 0; // circular guard
		const cellRaw = cells.get(ref)?.raw ?? "";
		const val = parseFloat(evaluate(cellRaw, cells, new Set([...visited, ref])));
		return isNaN(val) ? 0 : val;
	};

	// Range helper: A1:B3 → array of numbers
	const rangeValues = (rangeStr: string): number[] => {
		const [start, end] = rangeStr.split(":").map((s) => s.trim());
		if (!start || !end) return [];
		const startCol = start.charCodeAt(0) - 65;
		const startRow = parseInt(start.slice(1)) - 1;
		const endCol = end.charCodeAt(0) - 65;
		const endRow = parseInt(end.slice(1)) - 1;
		const vals: number[] = [];
		for (let r = startRow; r <= endRow; r++) {
			for (let c = startCol; c <= endCol; c++) {
				vals.push(resolveRef(cellId(r, c)));
			}
		}
		return vals;
	};

	try {
		// SUM(A1:B3) or SUM(A1,B2,C3)
		const fnMatch = expr.match(/^(SUM|AVG|AVERAGE|MAX|MIN|COUNT)\((.+)\)$/);
		if (fnMatch) {
			const fn = fnMatch[1];
			const arg = fnMatch[2];
			const nums = arg.includes(":")
				? rangeValues(arg)
				: arg.split(",").map((a) => resolveRef(a.trim()));
			if (fn === "SUM") return String(nums.reduce((a, b) => a + b, 0));
			if (fn === "AVG" || fn === "AVERAGE")
				return String(nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);
			if (fn === "MAX") return String(nums.length ? Math.max(...nums) : 0);
			if (fn === "MIN") return String(nums.length ? Math.min(...nums) : 0);
			if (fn === "COUNT") return String(nums.length);
		}

		// Plain arithmetic with cell references substituted
		const substituted = expr.replace(/[A-Z]+\d+/g, (ref) => String(resolveRef(ref)));
		// Only allow safe characters
		if (!/^[0-9+\-*/().% ]+$/.test(substituted)) return "#ERR";
		// eslint-disable-next-line no-new-func
		const result = new Function(`return (${substituted});`)();
		if (typeof result !== "number" || !isFinite(result)) return "#ERR";
		// Round to avoid floating-point noise
		return String(Math.round(result * 1e10) / 1e10);
	} catch {
		return "#ERR";
	}
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const BTN: Record<string, string> = {
	border: "1px solid rgba(255,255,255,0.13)",
	background: "rgba(255,255,255,0.07)",
	color: "#cdd6f4",
	"border-radius": "6px",
	padding: "0.32rem 0.65rem",
	"font-size": "0.76rem",
	cursor: "pointer",
};

export default function Excel(props: ExcelProps) {
	const [title, setTitle] = createSignal("Book1");
	const [cells, setCells] = createSignal<Map<CellKey, CellData>>(new Map());
	const [selected, setSelected] = createSignal<CellKey>("A1");
	const [editingKey, setEditingKey] = createSignal<CellKey | null>(null);
	const [editValue, setEditValue] = createSignal("");
	const [selStart, setSelStart] = createSignal<{ r: number; c: number } | null>(null);
	const [selEnd, setSelEnd] = createSignal<{ r: number; c: number } | null>(null);
	const [colWidths, setColWidths] = createSignal<number[]>(
		Array(DEFAULT_COLS).fill(COL_WIDTH),
	);
	const [numCols] = createSignal(DEFAULT_COLS);
	const [numRows] = createSignal(DEFAULT_ROWS);

	let formulaBarRef: HTMLInputElement | undefined;

	// ── Helpers ────────────────────────────────────────────────────────────────
	const getCellRaw = (key: CellKey) => cells().get(key)?.raw ?? "";
	const getCellDisplay = (key: CellKey) =>
		evaluate(getCellRaw(key), cells());

	const setCell = (key: CellKey, raw: string) => {
		setCells((prev) => {
			const next = new Map(prev);
			if (raw === "") {
				next.delete(key);
			} else {
				next.set(key, { raw });
			}
			return next;
		});
	};

	const parseKey = (key: CellKey) => {
		const col = key.charCodeAt(0) - 65;
		const row = parseInt(key.slice(1)) - 1;
		return { r: row, c: col };
	};

	// ── Selection helpers ──────────────────────────────────────────────────────
	const isInSelection = (r: number, c: number) => {
		const s = selStart();
		const e = selEnd();
		if (!s || !e) {
			const sel = parseKey(selected());
			return sel.r === r && sel.c === c;
		}
		const minR = Math.min(s.r, e.r);
		const maxR = Math.max(s.r, e.r);
		const minC = Math.min(s.c, e.c);
		const maxC = Math.max(s.c, e.c);
		return r >= minR && r <= maxR && c >= minC && c <= maxC;
	};

	// ── Cell interaction ───────────────────────────────────────────────────────
	const commitEdit = () => {
		const key = editingKey();
		if (key !== null) {
			setCell(key, editValue());
		}
		setEditingKey(null);
	};

	const startEdit = (key: CellKey) => {
		commitEdit();
		setEditingKey(key);
		setEditValue(getCellRaw(key));
		setSelected(key);
		setSelStart(null);
		setSelEnd(null);
	};

	const selectCell = (r: number, c: number) => {
		commitEdit();
		const key = cellId(r, c);
		setSelected(key);
		setSelStart(null);
		setSelEnd(null);
	};

	const navigate = (dr: number, dc: number) => {
		const { r, c } = parseKey(selected());
		const nr = Math.max(0, Math.min(numRows() - 1, r + dr));
		const nc = Math.max(0, Math.min(numCols() - 1, c + dc));
		selectCell(nr, nc);
	};

	const onCellKeyDown = (e: KeyboardEvent, r: number, c: number) => {
		if (e.key === "Enter") { commitEdit(); navigate(1, 0); e.preventDefault(); }
		else if (e.key === "Tab") { commitEdit(); navigate(0, e.shiftKey ? -1 : 1); e.preventDefault(); }
		else if (e.key === "Escape") { setEditingKey(null); e.preventDefault(); }
		else if (e.key === "ArrowUp" && editingKey() === null) { navigate(-1, 0); e.preventDefault(); }
		else if (e.key === "ArrowDown" && editingKey() === null) { navigate(1, 0); e.preventDefault(); }
		else if (e.key === "ArrowLeft" && editingKey() === null) { navigate(0, -1); e.preventDefault(); }
		else if (e.key === "ArrowRight" && editingKey() === null) { navigate(0, 1); e.preventDefault(); }
		else if (e.key === "Delete" || e.key === "Backspace") {
			if (editingKey() === null) { setCell(cellId(r, c), ""); e.preventDefault(); }
		}
	};

	// ── Formula bar ────────────────────────────────────────────────────────────
	const formulaBarValue = createMemo(() =>
		editingKey() !== null ? editValue() : getCellRaw(selected()),
	);

	const onFormulaBarInput = (v: string) => {
		if (editingKey() === null) startEdit(selected());
		setEditValue(v);
	};

	const onFormulaBarKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Enter") { commitEdit(); e.preventDefault(); }
		else if (e.key === "Escape") { setEditingKey(null); e.preventDefault(); }
	};

	// ── Column resize ──────────────────────────────────────────────────────────
	const startColResize = (colIdx: number, startX: number) => {
		const origWidth = colWidths()[colIdx];
		const onMove = (e: PointerEvent) => {
			const delta = e.clientX - startX;
			setColWidths((prev) => {
				const next = [...prev];
				next[colIdx] = Math.max(40, origWidth + delta);
				return next;
			});
		};
		const onUp = () => {
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
		};
		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
	};

	// ── Export CSV ─────────────────────────────────────────────────────────────
	const exportCSV = () => {
		const rows: string[][] = [];
		for (let r = 0; r < numRows(); r++) {
			const row: string[] = [];
			for (let c = 0; c < numCols(); c++) {
				const v = getCellRaw(cellId(r, c));
				row.push(v.includes(",") ? `"${v}"` : v);
			}
			rows.push(row);
		}
		// Trim trailing empty rows
		while (rows.length > 0 && rows[rows.length - 1].every((v) => v === "")) rows.pop();
		const csv = rows.map((r) => r.join(",")).join("\n");
		const blob = new Blob([csv], { type: "text/csv" });
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = `${title().replace(/\s+/g, "_")}.csv`;
		a.click();
		URL.revokeObjectURL(a.href);
	};

	// ── Stats for status bar ───────────────────────────────────────────────────
	const selectionStats = createMemo(() => {
		const s = selStart();
		const e = selEnd();
		if (!s || !e) {
			const v = getCellDisplay(selected());
			const n = parseFloat(v);
			return isNaN(n) ? null : { sum: n, count: 1, avg: n };
		}
		const minR = Math.min(s.r, e.r);
		const maxR = Math.max(s.r, e.r);
		const minC = Math.min(s.c, e.c);
		const maxC = Math.max(s.c, e.c);
		const nums: number[] = [];
		for (let r = minR; r <= maxR; r++) {
			for (let c = minC; c <= maxC; c++) {
				const v = getCellDisplay(cellId(r, c));
				const n = parseFloat(v);
				if (!isNaN(n)) nums.push(n);
			}
		}
		if (nums.length === 0) return null;
		const sum = nums.reduce((a, b) => a + b, 0);
		return { sum: Math.round(sum * 1e10) / 1e10, count: nums.length, avg: Math.round((sum / nums.length) * 1e10) / 1e10 };
	});

	return (
		<Windows
			title={`Excel – ${title()}`}
			icon="📊"
			onClose={props.onClose}
			onMinimize={props.onMinimize}
			onFocus={props.onFocus}
			zIndex={props.zIndex}
			top="50%"
			left="50%"
			width="min(1080px, 97vw)"
			height="min(680px, 90vh)"
			background="rgba(8,12,26,0.97)"
		>
			<div style={{ display: "flex", "flex-direction": "column", height: "100%", overflow: "hidden" }}>

				{/* ── Title + actions ─────────────────────────────────────────────── */}
				<div
					style={{
						display: "flex",
						"align-items": "center",
						gap: "0.5rem",
						padding: "0.45rem 0.85rem",
						"border-bottom": "1px solid rgba(255,255,255,0.07)",
					}}
				>
					<input
						type="text"
						value={title()}
						onInput={(e) => setTitle(e.currentTarget.value)}
						aria-label="Spreadsheet title"
						style={{
							"max-width": "200px",
							padding: "0.32rem 0.5rem",
							"border-radius": "6px",
							border: "1px solid rgba(255,255,255,0.13)",
							background: "rgba(255,255,255,0.06)",
							color: "#e8ecff",
							outline: "none",
							"font-size": "0.8rem",
						}}
					/>
					<button
						type="button"
						onClick={() => { setCells(new Map()); setSelected("A1"); setTitle("Book1"); }}
						style={BTN}
					>
						New
					</button>
					<button type="button" onClick={exportCSV} style={BTN}>
						Export CSV
					</button>
				</div>

				{/* ── Formula bar ─────────────────────────────────────────────────── */}
				<div
					style={{
						display: "flex",
						"align-items": "center",
						gap: "0.5rem",
						padding: "0.3rem 0.85rem",
						"border-bottom": "1px solid rgba(255,255,255,0.07)",
						background: "rgba(255,255,255,0.02)",
					}}
				>
					<span
						style={{
							"min-width": "52px",
							"text-align": "center",
							padding: "0.22rem 0.5rem",
							background: "rgba(255,255,255,0.07)",
							border: "1px solid rgba(255,255,255,0.12)",
							"border-radius": "5px",
							color: "#a6adc8",
							"font-size": "0.8rem",
							"font-family": "monospace",
						}}
					>
						{selected()}
					</span>
					<span style={{ color: "rgba(255,255,255,0.3)", "font-size": "0.9rem" }}>fx</span>
					<input
						ref={formulaBarRef}
						type="text"
						value={formulaBarValue()}
						onInput={(e) => onFormulaBarInput(e.currentTarget.value)}
						onKeyDown={onFormulaBarKeyDown}
						placeholder="Enter value or formula (=SUM, =AVG, =MAX, =MIN…)"
						style={{
							flex: "1",
							padding: "0.28rem 0.55rem",
							"border-radius": "5px",
							border: "1px solid rgba(255,255,255,0.12)",
							background: "rgba(255,255,255,0.06)",
							color: "#e8ecff",
							outline: "none",
							"font-size": "0.8rem",
							"font-family": "monospace",
						}}
					/>
				</div>

				{/* ── Spreadsheet grid ─────────────────────────────────────────────── */}
				<div
					style={{
						flex: "1",
						overflow: "auto",
						position: "relative",
					}}
				>
					<table
						style={{
							"border-collapse": "collapse",
							"table-layout": "fixed",
							"min-width": "max-content",
							"font-size": "0.78rem",
							"font-family": "monospace",
						}}
					>
						{/* ── Column headers ─── */}
						<thead>
							<tr>
								{/* corner */}
								<th
									style={{
										width: `${HEADER_COL_WIDTH}px`,
										"min-width": `${HEADER_COL_WIDTH}px`,
										height: `${ROW_HEIGHT}px`,
										background: "rgba(255,255,255,0.05)",
										border: "1px solid rgba(255,255,255,0.1)",
										position: "sticky",
										top: 0,
										left: 0,
										"z-index": 3,
									}}
								/>
								<For each={Array.from({ length: numCols() }, (_, i) => i)}>
									{(ci) => (
										<th
											style={{
												width: `${colWidths()[ci]}px`,
												"min-width": `${colWidths()[ci]}px`,
												height: `${ROW_HEIGHT}px`,
												background: "rgba(255,255,255,0.05)",
												border: "1px solid rgba(255,255,255,0.1)",
												color: "#a6adc8",
												"font-weight": "500",
												"text-align": "center",
												"user-select": "none",
												position: "sticky",
												top: 0,
												"z-index": 2,
												padding: 0,
											}}
										>
											<div
												style={{
													display: "flex",
													"align-items": "center",
													"justify-content": "center",
													height: "100%",
													position: "relative",
												}}
											>
												{colLabel(ci)}
												{/* resize handle */}
												<div
													onPointerDown={(e) => {
														e.preventDefault();
														startColResize(ci, e.clientX);
													}}
													style={{
														position: "absolute",
														right: 0,
														top: 0,
														width: "5px",
														height: "100%",
														cursor: "col-resize",
														"z-index": 1,
													}}
												/>
											</div>
										</th>
									)}
								</For>
							</tr>
						</thead>

						{/* ── Rows ─── */}
						<tbody>
							<For each={Array.from({ length: numRows() }, (_, i) => i)}>
								{(ri) => (
									<tr>
										{/* row number */}
										<td
											style={{
												width: `${HEADER_COL_WIDTH}px`,
												"min-width": `${HEADER_COL_WIDTH}px`,
												height: `${ROW_HEIGHT}px`,
												background: "rgba(255,255,255,0.03)",
												border: "1px solid rgba(255,255,255,0.08)",
												color: "#6c7086",
												"text-align": "center",
												"user-select": "none",
												position: "sticky",
												left: 0,
												"z-index": 1,
												"font-size": "0.72rem",
											}}
										>
											{ri + 1}
										</td>
										<For each={Array.from({ length: numCols() }, (_, i) => i)}>
											{(ci) => {
												const key = cellId(ri, ci);
												const isSelected = () => selected() === key && !selStart();
												const inRange = () => isInSelection(ri, ci);
												const isEditing = () => editingKey() === key;

												return (
													<td
														style={{
															width: `${colWidths()[ci]}px`,
															"min-width": `${colWidths()[ci]}px`,
															height: `${ROW_HEIGHT}px`,
															border: isSelected()
																? "2px solid #3b82f6"
																: inRange()
																	? "1px solid rgba(59,130,246,0.5)"
																	: "1px solid rgba(255,255,255,0.07)",
															background: isSelected()
																? "rgba(59,130,246,0.12)"
																: inRange()
																	? "rgba(59,130,246,0.06)"
																	: "transparent",
															padding: 0,
															overflow: "hidden",
															"white-space": "nowrap",
															cursor: "default",
															position: "relative",
														}}
														onClick={() => selectCell(ri, ci)}
														onDblClick={() => startEdit(key)}
														onPointerDown={(e) => {
															if (e.shiftKey) {
																const s = parseKey(selected());
																setSelStart(s);
																setSelEnd({ r: ri, c: ci });
																e.preventDefault();
															} else {
																setSelStart(null);
																setSelEnd(null);
															}
														}}
														onPointerEnter={(e) => {
															if (e.buttons === 1 && !editingKey()) {
																if (!selStart()) {
																	setSelStart(parseKey(selected()));
																}
																setSelEnd({ r: ri, c: ci });
															}
														}}
														onKeyDown={(e) => onCellKeyDown(e, ri, ci)}
													>
														{isEditing() ? (
															<input
																type="text"
																value={editValue()}
																onInput={(e) => setEditValue(e.currentTarget.value)}
																onKeyDown={(e) => onCellKeyDown(e, ri, ci)}
																onBlur={commitEdit}
																autofocus
																style={{
																	width: "100%",
																	height: "100%",
																	border: "none",
																	outline: "none",
																	background: "rgba(30,40,80,0.95)",
																	color: "#e8ecff",
																	padding: "0 4px",
																	"font-size": "0.78rem",
																	"font-family": "monospace",
																	"box-sizing": "border-box",
																}}
															/>
														) : (
															<span
																style={{
																	display: "block",
																	padding: "0 4px",
																	overflow: "hidden",
																	"text-overflow": "ellipsis",
																	color: getCellDisplay(key).startsWith("#ERR")
																		? "#f38ba8"
																		: "#cdd6f4",
																	"line-height": `${ROW_HEIGHT}px`,
																}}
															>
																{getCellDisplay(key)}
															</span>
														)}
													</td>
												);
											}}
										</For>
									</tr>
								)}
							</For>
						</tbody>
					</table>
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
					{selectionStats() ? (
						<>
							<span>Sum: {selectionStats()!.sum}</span>
							<span>Avg: {selectionStats()!.avg}</span>
							<span>Count: {selectionStats()!.count}</span>
						</>
					) : (
						<span>Select cells to see stats</span>
					)}
					<span style={{ "margin-left": "auto" }}>
						{numRows()} × {numCols()} · Nebula Excel
					</span>
				</div>
			</div>
		</Windows>
	);
}
