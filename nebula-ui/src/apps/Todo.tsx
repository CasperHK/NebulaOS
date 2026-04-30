import { For, createSignal } from "solid-js";
import Windows from "../components/Windows";

type TodoProps = {
	onClose: () => void;
	onMinimize: () => void;
	onFocus: () => void;
	zIndex: number;
};

type Filter = "all" | "active" | "completed";

type TodoItem = {
	id: number;
	text: string;
	completed: boolean;
};

let nextId = 1;

export default function Todo(props: TodoProps) {
	const [todos, setTodos] = createSignal<TodoItem[]>([]);
	const [input, setInput] = createSignal("");
	const [filter, setFilter] = createSignal<Filter>("all");

	const filtered = () => {
		const f = filter();
		return todos().filter((t) =>
			f === "all" ? true : f === "active" ? !t.completed : t.completed,
		);
	};

	const activeCount = () => todos().filter((t) => !t.completed).length;

	const addTodo = () => {
		const text = input().trim();
		if (!text) return;
		setTodos((prev) => [...prev, { id: nextId++, text, completed: false }]);
		setInput("");
	};

	const toggleTodo = (id: number) => {
		setTodos((prev) =>
			prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
		);
	};

	const deleteTodo = (id: number) => {
		setTodos((prev) => prev.filter((t) => t.id !== id));
	};

	const clearCompleted = () => {
		setTodos((prev) => prev.filter((t) => !t.completed));
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Enter") addTodo();
	};

	const btnBase: Record<string, string> = {
		border: "1px solid rgba(255,255,255,0.14)",
		background: "rgba(255,255,255,0.07)",
		color: "#e8ecff",
		"border-radius": "8px",
		padding: "0.35rem 0.7rem",
		"font-size": "0.78rem",
		cursor: "pointer",
	};

	const activeStyle = (f: Filter) =>
		filter() === f
			? {
					...btnBase,
					background: "rgba(120,100,255,0.35)",
					border: "1px solid rgba(120,100,255,0.6)",
				}
			: btnBase;

	return (
		<Windows
			title="Todo"
			icon="✅"
			onClose={props.onClose}
			onMinimize={props.onMinimize}
			onFocus={props.onFocus}
			zIndex={props.zIndex}
			top="50%"
			left="50%"
			width="min(480px, 95vw)"
			height="min(580px, 86vh)"
			background="rgba(9,14,30,0.95)"
		>
			<div
				style={{
					display: "flex",
					"flex-direction": "column",
					height: "100%",
					padding: "1rem",
					gap: "0.75rem",
					"box-sizing": "border-box",
				}}
			>
				{/* Input row */}
				<div style={{ display: "flex", gap: "0.5rem" }}>
					<input
						type="text"
						placeholder="Add a task…"
						value={input()}
						onInput={(e) => setInput(e.currentTarget.value)}
						onKeyDown={handleKeyDown}
						style={{
							flex: "1",
							padding: "0.55rem 0.75rem",
							"border-radius": "10px",
							border: "1px solid rgba(255,255,255,0.14)",
							background: "rgba(255,255,255,0.06)",
							color: "#e8ecff",
							outline: "none",
							"font-size": "0.9rem",
						}}
					/>
					<button
						type="button"
						onClick={addTodo}
						style={{
							padding: "0.55rem 1rem",
							"border-radius": "10px",
							border: "1px solid rgba(120,100,255,0.5)",
							background: "rgba(120,100,255,0.3)",
							color: "#e8ecff",
							"font-size": "0.9rem",
							cursor: "pointer",
							"white-space": "nowrap",
						}}
					>
						Add
					</button>
				</div>

				{/* Filter tabs */}
				<div style={{ display: "flex", gap: "0.4rem" }}>
					<For each={["all", "active", "completed"] as Filter[]}>
						{(f) => (
							<button type="button" onClick={() => setFilter(f)} style={activeStyle(f)}>
								{f.charAt(0).toUpperCase() + f.slice(1)}
							</button>
						)}
					</For>
				</div>

				{/* Todo list */}
				<div
					style={{
						flex: "1",
						"overflow-y": "auto",
						display: "flex",
						"flex-direction": "column",
						gap: "0.4rem",
					}}
				>
					<For each={filtered()}>
						{(todo) => (
							<div
								style={{
									display: "flex",
									"align-items": "center",
									gap: "0.6rem",
									padding: "0.6rem 0.75rem",
									"border-radius": "10px",
									background: "rgba(255,255,255,0.05)",
									border: "1px solid rgba(255,255,255,0.08)",
								}}
							>
								<input
									type="checkbox"
									checked={todo.completed}
									onChange={() => toggleTodo(todo.id)}
									style={{ cursor: "pointer", "accent-color": "#9b87f5", width: "16px", height: "16px" }}
								/>
								<span
									style={{
										flex: "1",
										color: todo.completed ? "rgba(255,255,255,0.35)" : "#e8ecff",
										"text-decoration": todo.completed ? "line-through" : "none",
										"font-size": "0.9rem",
										"word-break": "break-word",
									}}
								>
									{todo.text}
								</span>
								<button
									type="button"
									onClick={() => deleteTodo(todo.id)}
									aria-label="Delete task"
									style={{
										background: "none",
										border: "none",
										color: "rgba(255,100,100,0.7)",
										cursor: "pointer",
										"font-size": "1rem",
										padding: "0 0.2rem",
										"line-height": "1",
									}}
								>
									✕
								</button>
							</div>
						)}
					</For>
					{filtered().length === 0 && (
						<div
							style={{
								color: "rgba(255,255,255,0.25)",
								"text-align": "center",
								"margin-top": "2rem",
								"font-size": "0.88rem",
							}}
						>
							{filter() === "completed" ? "No completed tasks." : "Nothing to do — add a task above."}
						</div>
					)}
				</div>

				{/* Footer */}
				<div
					style={{
						display: "flex",
						"justify-content": "space-between",
						"align-items": "center",
						"border-top": "1px solid rgba(255,255,255,0.08)",
						"padding-top": "0.6rem",
					}}
				>
					<span style={{ color: "rgba(255,255,255,0.4)", "font-size": "0.8rem" }}>
						{activeCount()} item{activeCount() !== 1 ? "s" : ""} left
					</span>
					<button
						type="button"
						onClick={clearCompleted}
						style={{
							...btnBase,
							display: todos().some((t) => t.completed) ? "block" : "none",
						}}
					>
						Clear completed
					</button>
				</div>
			</div>
		</Windows>
	);
}
