type AppLauncherIconProps = {
	title: string;
	label: string;
	icon: string;
	background: string;
	boxShadow: string;
	onOpen: () => void;
	iconFontSize?: string;
	iconColor?: string;
	iconFontWeight?: string;
	iconFontFamily?: string;
};

export default function AppLauncherIcon(props: AppLauncherIconProps) {
	return (
		<button
			type="button"
			onClick={props.onOpen}
			style={{
				border: "none",
				background: "transparent",
				display: "flex",
				"flex-direction": "column",
				"align-items": "center",
				gap: "0.4rem",
				color: "#d6d6ff",
				cursor: "pointer",
				width: "84px",
				"pointer-events": "auto",
			}}
			aria-label={`Open ${props.title}`}
			title={props.title}
		>
			<span
				style={{
					width: "56px",
					height: "56px",
					"border-radius": "14px",
					background: props.background,
					display: "grid",
					"place-items": "center",
					"box-shadow": props.boxShadow,
					"font-size": props.iconFontSize ?? "1.45rem",
					color: props.iconColor,
					"font-weight": props.iconFontWeight,
					"font-family": props.iconFontFamily,
				}}
			>
				{props.icon}
			</span>
			<span style={{ "font-size": "0.82rem" }}>{props.label}</span>
		</button>
	);
}
