import { For, createSignal } from "solid-js";
import Windows from "../components/Windows";

export type AIMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type AITerminalProps = {
  onClose: () => void;
  onMinimize: () => void;
  onFocus: () => void;
  zIndex: number;
  messages: AIMessage[];
  onSubmit: (input: string) => void;
};

export default function AITerminal(props: AITerminalProps) {
  const [prompt, setPrompt] = createSignal("");

  const submit = () => {
    const text = prompt().trim();
    if (!text) return;
    setPrompt("");
    props.onSubmit(text);
  };

  return (
    <Windows
      title="Nebula AI Terminal"
      icon="🤖"
      onClose={props.onClose}
      onMinimize={props.onMinimize}
      onFocus={props.onFocus}
      showAISideChatButton={false}
      zIndex={props.zIndex}
      top="49%"
      left="54%"
      width="min(900px, 95vw)"
      height="min(600px, 84vh)"
      background="rgba(7,14,30,0.95)"
    >
      <div style={{ display: "flex", "flex-direction": "column", height: "100%" }}>
        <div
          style={{
            padding: "0.75rem 1rem",
            border: "1px solid rgba(255,255,255,0.08)",
            "border-left": "none",
            "border-right": "none",
            "border-top": "none",
            color: "#9db3da",
            "font-size": "0.8rem",
          }}
        >
          Sandbox mode: This assistant can control only NebulaOS windows in this desktop session.
        </div>

        <div
          style={{
            flex: "1",
            overflow: "auto",
            padding: "0.9rem 1rem",
            display: "grid",
            gap: "0.65rem",
            "align-content": "start",
          }}
        >
          <For each={props.messages}>
            {(message) => (
              <div
                style={{
                  padding: "0.62rem 0.75rem",
                  "border-radius": "10px",
                  border:
                    message.role === "assistant"
                      ? "1px solid rgba(98,210,255,0.28)"
                      : "1px solid rgba(255,255,255,0.14)",
                  background:
                    message.role === "assistant"
                      ? "rgba(98,210,255,0.1)"
                      : "rgba(255,255,255,0.05)",
                  color: message.role === "assistant" ? "#d8f1ff" : "#e9ebff",
                  "font-size": "0.84rem",
                  "line-height": "1.45",
                }}
              >
                <strong style={{ "font-size": "0.74rem", color: "#95a7d4" }}>
                  {message.role === "assistant" ? "AI" : "You"}
                </strong>
                <p style={{ margin: "0.25rem 0 0" }}>{message.text}</p>
              </div>
            )}
          </For>
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.55rem",
            padding: "0.85rem 1rem",
            border: "1px solid rgba(255,255,255,0.08)",
            "border-left": "none",
            "border-right": "none",
            "border-bottom": "none",
          }}
        >
          <input
            type="text"
            value={prompt()}
            onInput={(e) => setPrompt(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Type command: open app store"
            style={{
              flex: "1",
              padding: "0.72rem 0.85rem",
              "border-radius": "10px",
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(255,255,255,0.05)",
              color: "#eff3ff",
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={submit}
            style={{
              border: "none",
              background: "linear-gradient(135deg, #62d2ff, #5f72ff)",
              color: "#0b1328",
              "border-radius": "10px",
              padding: "0.7rem 0.9rem",
              "font-weight": "700",
              cursor: "pointer",
            }}
          >
            Send
          </button>
        </div>
      </div>
    </Windows>
  );
}
