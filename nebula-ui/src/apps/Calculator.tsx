import { For, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import Windows from "../components/Windows";

type CalculatorProps = {
	onClose: () => void;
	onMinimize: () => void;
	onFocus: () => void;
	zIndex: number;
};

type ButtonSpec = {
	label: string;
	value?: string;
	action?: "clear" | "delete" | "percent" | "toggle-sign" | "equals";
	tone?: "default" | "operator" | "utility" | "accent";
	wide?: boolean;
};

const BUTTONS: ButtonSpec[] = [
	{ label: "C", action: "clear", tone: "utility" },
	{ label: "+/-", action: "toggle-sign", tone: "utility" },
	{ label: "%", action: "percent", tone: "utility" },
	{ label: "÷", value: "/", tone: "operator" },
	{ label: "7", value: "7" },
	{ label: "8", value: "8" },
	{ label: "9", value: "9" },
	{ label: "×", value: "*", tone: "operator" },
	{ label: "4", value: "4" },
	{ label: "5", value: "5" },
	{ label: "6", value: "6" },
	{ label: "-", value: "-", tone: "operator" },
	{ label: "1", value: "1" },
	{ label: "2", value: "2" },
	{ label: "3", value: "3" },
	{ label: "+", value: "+", tone: "operator" },
	{ label: "0", value: "0", wide: true },
	{ label: ".", value: "." },
	{ label: "=", action: "equals", tone: "accent" },
];

const MAX_LEN = 28;

const sanitizeExpression = (expr: string) => expr.replace(/[^0-9+\-*/().]/g, "");

const tryEvaluate = (expr: string): { ok: true; value: number } | { ok: false } => {
	const cleaned = sanitizeExpression(expr);
	if (!cleaned) return { ok: false };

	try {
		const fn = new Function(`return (${cleaned});`);
		const raw = fn();
		if (typeof raw !== "number" || !Number.isFinite(raw)) {
			return { ok: false };
		}
		return { ok: true, value: raw };
	} catch {
		return { ok: false };
	}
};

const formatResult = (value: number) => {
	if (Number.isInteger(value)) {
		return value.toString();
	}
	return parseFloat(value.toFixed(10)).toString();
};

export default function Calculator(props: CalculatorProps) {
	const [expression, setExpression] = createSignal("0");
	const [displayValue, setDisplayValue] = createSignal("0");
	const [history, setHistory] = createSignal<string[]>([]);
	const [justEvaluated, setJustEvaluated] = createSignal(false);

	const preview = createMemo(() => {
		const current = expression();
		if (!current || current === "0") {
			return "";
		}
		const result = tryEvaluate(current);
		return result.ok ? formatResult(result.value) : "";
	});

	const pushHistory = (entry: string) => {
		setHistory((prev) => [entry, ...prev].slice(0, 8));
	};

	const clearAll = () => {
		setExpression("0");
		setDisplayValue("0");
		setJustEvaluated(false);
	};

	const appendValue = (value: string) => {
		const current = expression();

		if (justEvaluated() && /[0-9.]/.test(value)) {
			setExpression(value === "." ? "0." : value);
			setDisplayValue(value === "." ? "0." : value);
			setJustEvaluated(false);
			return;
		}

		setJustEvaluated(false);

		if (/[+\-*/]/.test(value)) {
			if (/[+\-*/]$/.test(current)) {
				const next = `${current.slice(0, -1)}${value}`;
				setExpression(next);
				setDisplayValue(next);
				return;
			}

			const next = `${current}${value}`;
			setExpression(next);
			setDisplayValue(next);
			return;
		}

		if (value === ".") {
			const lastSegment = current.split(/[+\-*/]/).pop() || "";
			if (lastSegment.includes(".")) {
				return;
			}
		}

		const base = current === "0" ? "" : current;
		const next = `${base}${value}`.slice(0, MAX_LEN);
		setExpression(next || "0");
		setDisplayValue(next || "0");
	};

	const deleteLast = () => {
		const current = expression();
		if (current.length <= 1) {
			clearAll();
			return;
		}

		const next = current.slice(0, -1);
		setExpression(next);
		setDisplayValue(next);
		setJustEvaluated(false);
	};

	const toggleSign = () => {
		const current = expression();
		const result = tryEvaluate(current);
		if (!result.ok) return;
		const next = formatResult(result.value * -1);
		setExpression(next);
		setDisplayValue(next);
		setJustEvaluated(false);
	};

	const convertPercent = () => {
		const current = expression();
		const result = tryEvaluate(current);
		if (!result.ok) return;
		const next = formatResult(result.value / 100);
		setExpression(next);
		setDisplayValue(next);
		setJustEvaluated(false);
	};

	const calculate = () => {
		const current = expression();
		const result = tryEvaluate(current);
		if (!result.ok) {
			setDisplayValue("Error");
			setJustEvaluated(true);
			return;
		}

		const next = formatResult(result.value);
		pushHistory(`${current.replace(/\*/g, "×").replace(/\//g, "÷")} = ${next}`);
		setExpression(next);
		setDisplayValue(next);
		setJustEvaluated(true);
	};

	const handleButton = (button: ButtonSpec) => {
		if (button.value) {
			appendValue(button.value);
			return;
		}

		if (button.action === "clear") clearAll();
		if (button.action === "delete") deleteLast();
		if (button.action === "toggle-sign") toggleSign();
		if (button.action === "percent") convertPercent();
		if (button.action === "equals") calculate();
	};

	onMount(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key >= "0" && event.key <= "9") {
				appendValue(event.key);
				return;
			}

			if (["+", "-", "*", "/", "."].includes(event.key)) {
				appendValue(event.key);
				return;
			}

			if (event.key === "Enter" || event.key === "=") {
				event.preventDefault();
				calculate();
			}

			if (event.key === "Backspace") {
				deleteLast();
			}

			if (event.key === "Escape") {
				clearAll();
			}

			if (event.key === "%") {
				convertPercent();
			}
		};

		window.addEventListener("keydown", onKeyDown);
		onCleanup(() => window.removeEventListener("keydown", onKeyDown));
	});

	return (
		<Windows
			title="Calculator"
			icon="🧮"
			defaultMaximized={false}
			onClose={props.onClose}
			onMinimize={props.onMinimize}
			onFocus={props.onFocus}
			zIndex={props.zIndex}
			top="52%"
			left="50%"
			width="min(900px, 95vw)"
			height="min(560px, 82vh)"
			background="rgba(8,14,24,0.96)"
		>
			<style>{`
				.nebula-calc {
					display: grid;
					grid-template-columns: 1.25fr 0.95fr;
					height: 100%;
					color: #edf5ff;
					font-family: "Space Grotesk", "Segoe UI", sans-serif;
					background: radial-gradient(circle at 15% 12%, rgba(87, 225, 255, 0.2), transparent 36%),
						linear-gradient(145deg, #0c1628 0%, #0d1b2f 48%, #0b1320 100%);
				}

				.nebula-calc-left {
					padding: 1rem;
					display: flex;
					flex-direction: column;
					gap: 0.8rem;
					border-right: 1px solid rgba(255,255,255,0.08);
				}

				.nebula-calc-display {
					border-radius: 16px;
					border: 1px solid rgba(255,255,255,0.12);
					background: linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
					padding: 0.85rem;
					min-height: 120px;
					display: flex;
					flex-direction: column;
					justify-content: flex-end;
					gap: 0.4rem;
					box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 12px 30px rgba(0,0,0,0.25);
				}

				.nebula-calc-expression {
					text-align: right;
					font-size: 0.9rem;
					color: #96accb;
					min-height: 1.2rem;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}

				.nebula-calc-value {
					text-align: right;
					font-size: clamp(1.8rem, 4vw, 2.6rem);
					font-weight: 700;
					letter-spacing: 0.02em;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}

				.nebula-calc-preview {
					text-align: right;
					font-size: 0.78rem;
					color: #74d9ff;
					min-height: 1rem;
				}

				.nebula-calc-grid {
					display: grid;
					grid-template-columns: repeat(4, minmax(0, 1fr));
					gap: 0.58rem;
				}

				.nebula-calc-btn {
					border: 1px solid rgba(255,255,255,0.12);
					background: rgba(255,255,255,0.06);
					color: #ecf6ff;
					border-radius: 12px;
					min-height: 52px;
					font-size: 1rem;
					font-weight: 700;
					cursor: pointer;
					transition: transform 0.12s ease, background 0.12s ease, border-color 0.12s ease;
				}

				.nebula-calc-btn:hover {
					transform: translateY(-1px);
					background: rgba(255,255,255,0.12);
					border-color: rgba(255,255,255,0.22);
				}

				.nebula-calc-btn.utility {
					background: rgba(255, 207, 92, 0.16);
					border-color: rgba(255, 207, 92, 0.35);
					color: #ffe39a;
				}

				.nebula-calc-btn.operator {
					background: rgba(79, 163, 255, 0.18);
					border-color: rgba(79, 163, 255, 0.4);
					color: #cde6ff;
				}

				.nebula-calc-btn.accent {
					background: linear-gradient(135deg, #67f0c7, #33b5ff);
					border: none;
					color: #022c38;
					font-weight: 800;
				}

				.nebula-calc-btn.wide {
					grid-column: span 2;
				}

				.nebula-calc-right {
					display: flex;
					flex-direction: column;
					padding: 0.9rem;
					gap: 0.7rem;
				}

				.nebula-calc-history-head {
					display: flex;
					justify-content: space-between;
					align-items: center;
					font-size: 0.8rem;
					text-transform: uppercase;
					letter-spacing: 0.08em;
					color: #8ea8cb;
				}

				.nebula-calc-clear {
					border: 1px solid rgba(255,255,255,0.13);
					background: rgba(255,255,255,0.05);
					color: #bed0e8;
					border-radius: 999px;
					padding: 0.2rem 0.55rem;
					cursor: pointer;
					font-size: 0.74rem;
				}

				.nebula-calc-history {
					flex: 1;
					overflow: auto;
					border-radius: 14px;
					border: 1px solid rgba(255,255,255,0.08);
					background: rgba(255,255,255,0.02);
					padding: 0.6rem;
					display: flex;
					flex-direction: column;
					gap: 0.45rem;
				}

				.nebula-calc-entry {
					border: 1px solid rgba(255,255,255,0.07);
					border-radius: 10px;
					background: rgba(255,255,255,0.03);
					color: #d4e4f8;
					font-size: 0.86rem;
					padding: 0.52rem 0.58rem;
					text-align: right;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
					cursor: pointer;
				}

				.nebula-calc-empty {
					margin: auto;
					color: #5f7291;
					font-size: 0.86rem;
				}

				@media (max-width: 840px) {
					.nebula-calc {
						grid-template-columns: 1fr;
					}

					.nebula-calc-left {
						border-right: none;
						border-bottom: 1px solid rgba(255,255,255,0.08);
					}
				}
			`}</style>

			<section class="nebula-calc">
				<div class="nebula-calc-left">
					<div class="nebula-calc-display">
						<div class="nebula-calc-expression">{expression().replace(/\*/g, "×").replace(/\//g, "÷")}</div>
						<div class="nebula-calc-value">{displayValue()}</div>
						<div class="nebula-calc-preview">{preview() ? `Preview: ${preview()}` : ""}</div>
					</div>

					<div class="nebula-calc-grid">
						<For each={BUTTONS}>
							{(button) => (
								<button
									type="button"
									class={`nebula-calc-btn ${button.tone ?? "default"} ${button.wide ? "wide" : ""}`}
									onClick={() => handleButton(button)}
								>
									{button.label}
								</button>
							)}
						</For>

						<button
							type="button"
							class="nebula-calc-btn utility"
							onClick={deleteLast}
						>
							DEL
						</button>
					</div>
				</div>

				<aside class="nebula-calc-right">
					<div class="nebula-calc-history-head">
						<span>History</span>
						<button
							type="button"
							class="nebula-calc-clear"
							onClick={() => setHistory([])}
						>
							Clear
						</button>
					</div>

					<div class="nebula-calc-history">
						{history().length === 0 ? (
							<div class="nebula-calc-empty">No calculations yet.</div>
						) : (
							<For each={history()}>
								{(entry) => (
									<button
										type="button"
										class="nebula-calc-entry"
										onClick={() => {
											const expressionPart = entry.split("=")[0]?.trim() || "0";
											const normalized = expressionPart.replace(/×/g, "*").replace(/÷/g, "/");
											setExpression(normalized);
											setDisplayValue(normalized);
											setJustEvaluated(false);
										}}
									>
										{entry}
									</button>
								)}
							</For>
						)}
					</div>
				</aside>
			</section>
		</Windows>
	);
}
