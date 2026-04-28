import { For } from "solid-js";
import Windows from "../components/Windows";

export type AppRuntimeRow = {
	appName: string;
	icon: string;
	status: string;
	memoryMb: number;
	cpuPercent: number;
};

type TaskManagerProps = {
	onClose: () => void;
	onMinimize: () => void;
	onFocus: () => void;
	zIndex: number;
	runtimeRows: AppRuntimeRow[];
	totalMemoryMb: number;
	totalCpuPct: number;
	onEndApp: (appName: string) => void;
};

export default function TaskManager(props: TaskManagerProps) {
	return (
		<Windows
			title="Task Manager"
			icon="📊"
			onClose={props.onClose}
			onMinimize={props.onMinimize}
			onFocus={props.onFocus}
			zIndex={props.zIndex}
			top="46%"
			left="50%"
			width="min(780px, 95vw)"
			height="min(520px, 84vh)"
			background="rgba(6,12,28,0.96)"
		>
			<div style={{ display: "flex", "flex-direction": "column", height: "100%" }}>
				{/* Summary bar */}
				<div
					style={{
						display: "flex",
						gap: "1.5rem",
						padding: "0.75rem 1rem",
						border: "1px solid rgba(255,255,255,0.08)",
						"border-left": "none",
						"border-right": "none",
						"border-top": "none",
						"font-size": "0.8rem",
						color: "#9db3da",
					}}
				>
					<span>Processes: <strong style={{ color: "#c8d8ff" }}>{props.runtimeRows.length}</strong></span>
					<span>Total Memory: <strong style={{ color: "#34d399" }}>{props.totalMemoryMb} MB</strong></span>
					<span>Total CPU: <strong style={{ color: props.totalCpuPct > 30 ? "#fb923c" : "#34d399" }}>{props.totalCpuPct}%</strong></span>
				</div>

				{/* Table header */}
				<div
					style={{
						display: "grid",
						"grid-template-columns": "2fr 1fr 1fr 1fr 100px",
						padding: "0.55rem 1rem",
						"font-size": "0.75rem",
						color: "#6272a4",
						"text-transform": "uppercase",
						"letter-spacing": "0.05em",
						border: "1px solid rgba(255,255,255,0.06)",
						"border-left": "none",
						"border-right": "none",
						"border-top": "none",
					}}
				>
					<span>App</span>
					<span>Status</span>
					<span>Memory</span>
					<span>CPU</span>
					<span>Action</span>
				</div>

				{/* Rows */}
				<div style={{ flex: "1", overflow: "auto" }}>
					{props.runtimeRows.length === 0 ? (
						<p
							style={{
								"text-align": "center",
								color: "#4a5280",
								"font-size": "0.88rem",
								"margin-top": "3rem",
							}}
						>
							No apps are currently open.
						</p>
					) : (
						<For each={props.runtimeRows}>
							{(row) => (
								<div
									style={{
										display: "grid",
										"grid-template-columns": "2fr 1fr 1fr 1fr 100px",
										padding: "0.65rem 1rem",
										"align-items": "center",
										"font-size": "0.84rem",
										color: "#c8d4f0",
										border: "1px solid rgba(255,255,255,0.05)",
										"border-left": "none",
										"border-right": "none",
										"border-top": "none",
									}}
								>
									<span style={{ display: "flex", "align-items": "center", gap: "0.5rem" }}>
										<span>{row.icon}</span>
										<span>{row.appName}</span>
									</span>
									<span>
										<span
											style={{
												display: "inline-block",
												padding: "0.15rem 0.4rem",
												"border-radius": "999px",
												background: "rgba(52,211,153,0.2)",
												color: "#34d399",
												"font-size": "0.72rem",
											}}
										>
											{row.status}
										</span>
									</span>
									<span style={{ color: "#a7f3d0" }}>{row.memoryMb} MB</span>
									<span style={{ color: row.cpuPercent > 10 ? "#fb923c" : "#a7f3d0" }}>
										{row.cpuPercent}%
									</span>
									<button
										type="button"
										onClick={() => props.onEndApp(row.appName)}
										style={{
											border: "1px solid rgba(248,113,113,0.4)",
											background: "rgba(248,113,113,0.12)",
											color: "#fca5a5",
											"border-radius": "7px",
											padding: "0.32rem 0.55rem",
											"font-size": "0.74rem",
											cursor: "pointer",
										}}
									>
										End
									</button>
								</div>
							)}
						</For>
					)}
				</div>
			</div>
		</Windows>
	);
}

