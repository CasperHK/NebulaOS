import { For, createSignal } from "solid-js";
import Windows from "../components/Windows";

type TerminalProps = {
	onClose: () => void;
	onMinimize: () => void;
	onFocus: () => void;
	zIndex: number;
};

type Entry = {
	id: string;
	type: "input" | "output" | "error" | "info";
	text: string;
};

const STARTUP_LINES = [
	"NebulaOS Terminal v1.0.0",
	"Type 'help' to list available commands.",
	"",
] as const;

const FILES: Record<string, string> = {
	"readme.txt": "Welcome to NebulaOS traditional terminal.",
	"notes.md": "- Build features\n- Test desktop apps\n- Ship NebulaOS",
	"todo.txt": "1. polish ui\n2. optimize startup\n3. demo app suite",
	"math.tex": "\\int_0^1 x^2 dx = 1/3",
};

export default function Terminal(props: TerminalProps) {
	const [cwd, setCwd] = createSignal("~");
	const [entries, setEntries] = createSignal<Entry[]>(
		STARTUP_LINES.map((line, idx) => ({
			id: `boot-${idx}`,
			type: "info",
			text: line,
		})),
	);
	const [input, setInput] = createSignal("");
	const [history, setHistory] = createSignal<string[]>([]);
	const [historyIndex, setHistoryIndex] = createSignal<number>(-1);
	const [theme, setTheme] = createSignal<"green" | "amber" | "ice">("green");

	let inputRef: HTMLInputElement | undefined;

	const prompt = () => `guest@nebula:${cwd()}$`;

	const push = (type: Entry["type"], text: string) => {
		setEntries((prev) => [
			...prev,
			{ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, type, text },
		]);
	};

	const clear = () => setEntries([]);

	const runCommand = (raw: string) => {
		const cmd = raw.trim();
		if (!cmd) return;

		push("input", `${prompt()} ${cmd}`);
		setHistory((prev) => [...prev, cmd]);
		setHistoryIndex(-1);

		const [name, ...args] = cmd.split(/\s+/);
		const lowered = name.toLowerCase();

		if (lowered === "help") {
			push(
				"output",
				[
					"Available commands:",
					"  help              Show this help",
					"  clear             Clear terminal output",
					"  echo <text>       Print text",
					"  date              Show current date/time",
					"  whoami            Show current user",
					"  pwd               Show current path",
					"  ls                List sample files",
					"  cat <file>        Print file content",
					"  cd <path>         Change pseudo directory",
					"  mkdir <name>      Create pseudo directory",
					"  touch <name>      Create pseudo file",
					"  history           Show command history",
					"  neofetch          Show system summary",
					"  theme <name>      Change theme: green|amber|ice",
				].join("\n"),
			);
			return;
		}

		if (lowered === "clear") {
			clear();
			return;
		}

		if (lowered === "echo") {
			push("output", args.join(" "));
			return;
		}

		if (lowered === "date") {
			push("output", new Date().toString());
			return;
		}

		if (lowered === "whoami") {
			push("output", "guest");
			return;
		}

		if (lowered === "pwd") {
			push("output", cwd());
			return;
		}

		if (lowered === "ls") {
			push("output", Object.keys(FILES).join("  "));
			return;
		}

		if (lowered === "cat") {
			const file = args[0];
			if (!file) {
				push("error", "cat: missing file operand");
				return;
			}
			if (!FILES[file]) {
				push("error", `cat: ${file}: No such file`);
				return;
			}
			push("output", FILES[file]);
			return;
		}

		if (lowered === "cd") {
			const target = args[0] ?? "~";
			if (target === "~") {
				setCwd("~");
			} else if (target.startsWith("/")) {
				setCwd(target);
			} else if (target === "..") {
				const parts = cwd().split("/").filter(Boolean);
				parts.pop();
				setCwd(parts.length ? `/${parts.join("/")}` : "~");
			} else {
				const base = cwd() === "~" ? "/home/guest" : cwd();
				setCwd(`${base}/${target}`.replace(/\/+/g, "/"));
			}
			return;
		}

		if (lowered === "mkdir") {
			if (!args[0]) {
				push("error", "mkdir: missing operand");
				return;
			}
			push("output", `created directory '${args[0]}'`);
			return;
		}

		if (lowered === "touch") {
			if (!args[0]) {
				push("error", "touch: missing file operand");
				return;
			}
			push("output", `created file '${args[0]}'`);
			return;
		}

		if (lowered === "history") {
			const lines = history()
				.map((h, idx) => `${idx + 1}  ${h}`)
				.join("\n");
			push("output", lines || "(empty)");
			return;
		}

		if (lowered === "neofetch") {
			push(
				"output",
				[
					"NebulaOS",
					"  Host: Browser Sandbox",
					"  Shell: nebula-sh 1.0",
					"  Terminal: Nebula Terminal",
					"  Uptime: active session",
					"  Theme: aurora",
				].join("\n"),
			);
			return;
		}

		if (lowered === "theme") {
			const next = (args[0] ?? "").toLowerCase();
			if (next === "green" || next === "amber" || next === "ice") {
				setTheme(next);
				push("info", `theme changed to ${next}`);
			} else {
				push("error", "theme: expected green|amber|ice");
			}
			return;
		}

		push("error", `${name}: command not found`);
	};

	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			runCommand(input());
			setInput("");
			return;
		}

		if (e.key === "ArrowUp") {
			e.preventDefault();
			const h = history();
			if (!h.length) return;
			const idx = historyIndex() === -1 ? h.length - 1 : Math.max(0, historyIndex() - 1);
			setHistoryIndex(idx);
			setInput(h[idx]);
			return;
		}

		if (e.key === "ArrowDown") {
			e.preventDefault();
			const h = history();
			if (!h.length) return;
			if (historyIndex() <= -1) return;
			const idx = historyIndex() + 1;
			if (idx >= h.length) {
				setHistoryIndex(-1);
				setInput("");
			} else {
				setHistoryIndex(idx);
				setInput(h[idx]);
			}
		}
	};

	const tone = () => {
		if (theme() === "amber") {
			return {
				text: "#ffd699",
				muted: "#d7a35d",
				border: "rgba(255,214,153,0.25)",
			};
		}
		if (theme() === "ice") {
			return {
				text: "#bfe8ff",
				muted: "#7ab9dc",
				border: "rgba(191,232,255,0.28)",
			};
		}
		return {
			text: "#8bff8b",
			muted: "#68b968",
			border: "rgba(139,255,139,0.25)",
		};
	};

	return (
		<Windows
			title="Terminal"
			icon=">_"
			onClose={props.onClose}
			onMinimize={props.onMinimize}
			onFocus={props.onFocus}
			zIndex={props.zIndex}
			top="50%"
			left="52%"
			width="min(920px, 96vw)"
			height="min(620px, 88vh)"
			background="rgba(5,8,16,0.98)"
		>
			<div
				style={{
					display: "flex",
					"flex-direction": "column",
					height: "100%",
					color: tone().text,
					"font-family": "Consolas, 'Courier New', monospace",
				}}
				onClick={() => inputRef?.focus()}
			>
				<div
					style={{
						padding: "0.45rem 0.75rem",
						"border-bottom": `1px solid ${tone().border}`,
						color: tone().muted,
						"font-size": "0.75rem",
						"user-select": "none",
					}}
				>
					Traditional shell mode. No AI execution.
				</div>

				<div
					style={{
						flex: "1",
						overflow: "auto",
						padding: "0.7rem 0.8rem",
						display: "grid",
						gap: "0.35rem",
						"align-content": "start",
						"font-size": "0.82rem",
						"line-height": "1.45",
					}}
				>
					<For each={entries()}>
						{(entry) => (
							<pre
								style={{
									margin: 0,
									"white-space": "pre-wrap",
									color:
										entry.type === "error"
											? "#ff8b8b"
											: entry.type === "info"
												? tone().muted
												: tone().text,
								}}
							>
								{entry.text}
							</pre>
						)}
					</For>
				</div>

				<div
					style={{
						display: "flex",
						gap: "0.5rem",
						"align-items": "center",
						padding: "0.58rem 0.75rem",
						"border-top": `1px solid ${tone().border}`,
						"font-size": "0.82rem",
					}}
				>
					<span style={{ color: tone().muted, "user-select": "none" }}>{prompt()}</span>
					<input
						ref={inputRef}
						type="text"
						value={input()}
						onInput={(e) => setInput(e.currentTarget.value)}
						onKeyDown={onKeyDown}
						spellcheck={false}
						style={{
							flex: "1",
							border: "none",
							outline: "none",
							background: "transparent",
							color: tone().text,
							"font-family": "inherit",
							"font-size": "0.82rem",
						}}
					/>
				</div>
			</div>
		</Windows>
	);
}
