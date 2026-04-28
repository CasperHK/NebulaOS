import { For, createMemo, createSignal } from "solid-js";
import Windows from "../components/Windows";

type MailProps = {
	onClose: () => void;
	onMinimize: () => void;
	onFocus: () => void;
	zIndex: number;
};

type MailItem = {
	id: string;
	from: string;
	subject: string;
	preview: string;
	body: string;
	unread: boolean;
};

const SEED_MAILS: MailItem[] = [
	{
		id: "m-1",
		from: "Nova Team",
		subject: "Sprint Review Notes",
		preview: "The sprint review went well. Please check action items for next week.",
		body: "Hi team,\n\nThe sprint review went well today. Key action items:\n- Finalize desktop app icon set\n- Validate AI Terminal command aliases\n- Prepare release notes for v0.1.0\n\nPlease confirm your owner areas by EOD.\n\nThanks,\nNova Team",
		unread: true,
	},
	{
		id: "m-2",
		from: "Cloud Billing",
		subject: "Storage Usage Alert",
		preview: "Your account reached 72% usage. Review cleanup suggestions.",
		body: "Hello,\n\nYour Nebula account has reached 72% storage usage. You can archive old attachments or upgrade your plan.\n\nRegards,\nCloud Billing",
		unread: false,
	},
	{
		id: "m-3",
		from: "Design Ops",
		subject: "Updated icon pack",
		preview: "Attached are revised icons for Mail, Tasks, and Viewer apps.",
		body: "Hi,\n\nAttached are revised icons for Mail, Tasks, and Viewer apps. Let us know if we should prepare monochrome variants too.\n\nBest,\nDesign Ops",
		unread: true,
	},
];

export default function Mail(props: MailProps) {
	const [mails, setMails] = createSignal<MailItem[]>(SEED_MAILS);
	const [selectedMailId, setSelectedMailId] = createSignal<string>(SEED_MAILS[0].id);
	const [search, setSearch] = createSignal("");
	const [isComposing, setIsComposing] = createSignal(false);
	const [to, setTo] = createSignal("team@nebula.dev");
	const [subject, setSubject] = createSignal("Quick update");
	const [draft, setDraft] = createSignal("Hi team,\n\n");
	const [aiOutput, setAiOutput] = createSignal("AI Mail Assistant ready. Select an email or open compose.");

	const filteredMails = createMemo(() => {
		const key = search().trim().toLowerCase();
		if (!key) return mails();
		return mails().filter(
			(m) =>
				m.from.toLowerCase().includes(key) ||
				m.subject.toLowerCase().includes(key) ||
				m.preview.toLowerCase().includes(key),
		);
	});

	const selectedMail = createMemo(() => mails().find((m) => m.id === selectedMailId()) ?? null);
	const unreadCount = createMemo(() => mails().filter((m) => m.unread).length);

	const openMail = (id: string) => {
		setSelectedMailId(id);
		setIsComposing(false);
		setMails((prev) => prev.map((m) => (m.id === id ? { ...m, unread: false } : m)));
	};

	const summarizeSelected = () => {
		const mail = selectedMail();
		if (!mail) {
			setAiOutput("No message selected to summarize.");
			return;
		}
		setAiOutput(
			`Summary: ${mail.from} asks about \"${mail.subject}\". Key point: ${mail.preview}`,
		);
	};

	const draftReply = () => {
		const mail = selectedMail();
		if (!mail) {
			setAiOutput("No message selected to draft a reply.");
			return;
		}
		setIsComposing(true);
		setTo(`${mail.from.toLowerCase().replace(/\s+/g, ".")}@nebula.dev`);
		setSubject(`Re: ${mail.subject}`);
		setDraft(
			`Hi ${mail.from},\n\nThanks for the update on \"${mail.subject}\". I reviewed the details and will follow up with next steps shortly.\n\nBest regards,\nNebulaOS User`,
		);
		setAiOutput("Draft reply generated in Compose.");
	};

	const polishSubject = () => {
		const clean = subject().trim();
		if (!clean) {
			setAiOutput("Type a subject first, then use AI polish.");
			return;
		}
		const polished = clean
			.replace(/\s+/g, " ")
			.replace(/^quick update$/i, "Project Update and Next Actions")
			.replace(/^re:/i, "Re:")
			.trim();
		setSubject(polished);
		setAiOutput(`Subject polished: \"${polished}\"`);
	};

	const sendDraft = () => {
		if (!to().trim() || !subject().trim() || !draft().trim()) {
			setAiOutput("To, Subject, and Body are required before sending.");
			return;
		}
		setAiOutput(`Sent to ${to().trim()} with subject \"${subject().trim()}\".`);
		setIsComposing(false);
	};

	return (
		<Windows
			title={`Nebula Mail${unreadCount() > 0 ? ` (${unreadCount()})` : ""}`}
			icon="📧"
			onClose={props.onClose}
			onMinimize={props.onMinimize}
			onFocus={props.onFocus}
			zIndex={props.zIndex}
			top="50%"
			left="52%"
			width="min(1080px, 97vw)"
			height="min(680px, 90vh)"
			background="rgba(8,12,28,0.95)"
		>
			<div style={{ display: "flex", height: "100%" }}>
				<aside
					style={{
						width: "290px",
						display: "flex",
						"flex-direction": "column",
						border: "1px solid rgba(255,255,255,0.08)",
						"border-left": "none",
						"border-top": "none",
						"border-bottom": "none",
					}}
				>
					<div style={{ padding: "0.8rem", display: "grid", gap: "0.55rem" }}>
						<button
							type="button"
							onClick={() => setIsComposing(true)}
							style={{
								border: "none",
								background: "linear-gradient(135deg, #62d2ff, #5f72ff)",
								color: "#0b1328",
								"border-radius": "9px",
								padding: "0.55rem 0.7rem",
								"font-weight": "700",
								cursor: "pointer",
							}}
						>
							Compose
						</button>
						<input
							type="text"
							value={search()}
							onInput={(e) => setSearch(e.currentTarget.value)}
							placeholder="Search mail"
							style={{
								padding: "0.5rem 0.6rem",
								"border-radius": "8px",
								border: "1px solid rgba(255,255,255,0.14)",
								background: "rgba(255,255,255,0.06)",
								color: "#dfe7ff",
								outline: "none",
								"font-size": "0.82rem",
							}}
						/>
					</div>

					<div style={{ overflow: "auto", flex: "1", display: "grid", gap: "0.4rem", padding: "0.5rem 0.8rem 0.8rem" }}>
						<For each={filteredMails()}>
							{(mail) => (
								<button
									type="button"
									onClick={() => openMail(mail.id)}
									style={{
										border: selectedMailId() === mail.id ? "1px solid rgba(98,210,255,0.5)" : "1px solid rgba(255,255,255,0.12)",
										background: selectedMailId() === mail.id ? "rgba(98,210,255,0.12)" : "rgba(255,255,255,0.03)",
										"border-radius": "10px",
										padding: "0.58rem",
										display: "grid",
										gap: "0.25rem",
										"text-align": "left",
										color: "#dde5ff",
										cursor: "pointer",
									}}
								>
									<strong style={{ "font-size": "0.82rem" }}>
										{mail.unread ? "● " : ""}
										{mail.from}
									</strong>
									<span style={{ "font-size": "0.78rem", color: "#bcc7eb" }}>{mail.subject}</span>
									<span style={{ "font-size": "0.74rem", color: "#91a0cc" }}>{mail.preview}</span>
								</button>
							)}
						</For>
					</div>
				</aside>

				<section style={{ flex: "1", display: "flex", "flex-direction": "column" }}>
					{!isComposing() ? (
						<>
							<div style={{ padding: "0.9rem 1rem", border: "1px solid rgba(255,255,255,0.08)", "border-left": "none", "border-top": "none", "border-right": "none" }}>
								<h3 style={{ margin: 0, color: "#e9efff", "font-size": "1rem" }}>{selectedMail()?.subject ?? "No mail selected"}</h3>
								<p style={{ margin: "0.2rem 0 0", color: "#a8b7e0", "font-size": "0.8rem" }}>From: {selectedMail()?.from ?? "-"}</p>
							</div>
							<div style={{ padding: "1rem", overflow: "auto", color: "#d7e2ff", "white-space": "pre-wrap", "line-height": "1.5", "font-size": "0.86rem", flex: "1" }}>
								{selectedMail()?.body ?? "Select a message to read."}
							</div>
						</>
					) : (
						<div style={{ padding: "1rem", overflow: "auto", display: "grid", gap: "0.7rem", flex: "1" }}>
							<h3 style={{ margin: 0, color: "#e9efff", "font-size": "1rem" }}>Compose</h3>
							<label style={{ display: "grid", gap: "0.3rem", color: "#a8b7e0", "font-size": "0.78rem" }}>
								To
								<input
									type="text"
									value={to()}
									onInput={(e) => setTo(e.currentTarget.value)}
									style={{ padding: "0.55rem", "border-radius": "8px", border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.05)", color: "#dfe7ff", outline: "none" }}
								/>
							</label>
							<label style={{ display: "grid", gap: "0.3rem", color: "#a8b7e0", "font-size": "0.78rem" }}>
								Subject
								<input
									type="text"
									value={subject()}
									onInput={(e) => setSubject(e.currentTarget.value)}
									style={{ padding: "0.55rem", "border-radius": "8px", border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.05)", color: "#dfe7ff", outline: "none" }}
								/>
							</label>
							<textarea
								value={draft()}
								onInput={(e) => setDraft(e.currentTarget.value)}
								style={{
									flex: "1",
									height: "240px",
									padding: "0.7rem",
									"border-radius": "8px",
									border: "1px solid rgba(255,255,255,0.14)",
									background: "rgba(255,255,255,0.05)",
									color: "#dfe7ff",
									outline: "none",
									resize: "vertical",
									"line-height": "1.45",
								}}
							/>
							<div style={{ display: "flex", gap: "0.5rem", "justify-content": "flex-end" }}>
								<button
									type="button"
									onClick={() => setIsComposing(false)}
									style={{ border: "1px solid rgba(255,255,255,0.16)", background: "rgba(255,255,255,0.08)", color: "#dfe7ff", "border-radius": "8px", padding: "0.45rem 0.7rem", cursor: "pointer" }}
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={sendDraft}
									style={{ border: "none", background: "linear-gradient(135deg, #62d2ff, #5f72ff)", color: "#0b1328", "border-radius": "8px", padding: "0.45rem 0.7rem", "font-weight": "700", cursor: "pointer" }}
								>
									Send
								</button>
							</div>
						</div>
					)}
				</section>

				<aside
					style={{
						width: "250px",
						display: "grid",
						"align-content": "start",
						gap: "0.55rem",
						padding: "0.8rem",
						border: "1px solid rgba(255,255,255,0.08)",
						"border-right": "none",
						"border-top": "none",
						"border-bottom": "none",
					}}
				>
					<h4 style={{ margin: 0, color: "#d9e5ff", "font-size": "0.88rem" }}>AI Mail Assistant</h4>
					<button
						type="button"
						onClick={summarizeSelected}
						style={{ border: "1px solid rgba(255,255,255,0.16)", background: "rgba(255,255,255,0.07)", color: "#dfe7ff", "border-radius": "8px", padding: "0.45rem 0.6rem", "font-size": "0.78rem", cursor: "pointer", "text-align": "left" }}
					>
						Summarize selected email
					</button>
					<button
						type="button"
						onClick={draftReply}
						style={{ border: "1px solid rgba(255,255,255,0.16)", background: "rgba(255,255,255,0.07)", color: "#dfe7ff", "border-radius": "8px", padding: "0.45rem 0.6rem", "font-size": "0.78rem", cursor: "pointer", "text-align": "left" }}
					>
						Draft reply from selected email
					</button>
					<button
						type="button"
						onClick={polishSubject}
						style={{ border: "1px solid rgba(255,255,255,0.16)", background: "rgba(255,255,255,0.07)", color: "#dfe7ff", "border-radius": "8px", padding: "0.45rem 0.6rem", "font-size": "0.78rem", cursor: "pointer", "text-align": "left" }}
					>
						Polish compose subject
					</button>
					<div style={{ margin: "0.2rem 0 0", border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.04)", "border-radius": "10px", padding: "0.6rem", color: "#bcd0f6", "font-size": "0.78rem", "line-height": "1.45", "white-space": "pre-wrap" }}>
						{aiOutput()}
					</div>
				</aside>
			</div>
		</Windows>
	);
}
