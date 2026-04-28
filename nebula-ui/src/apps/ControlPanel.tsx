import { createSignal } from "solid-js";
import Windows from "../components/Windows";

type ControlPanelProps = {
  onClose: () => void;
  onMinimize: () => void;
  onFocus: () => void;
  zIndex: number;
};

export default function ControlPanel(props: ControlPanelProps) {
  const [activeTab, setActiveTab] = createSignal<"appearance" | "system" | "about">("appearance");
  const [selectedTheme, setSelectedTheme] = createSignal("Nebula Dark");
  const [selectedWallpaper, setSelectedWallpaper] = createSignal("Deep Space");
  const [selectedLanguage, setSelectedLanguage] = createSignal("English");
  const [selectedTimeFormat, setSelectedTimeFormat] = createSignal("24-hour");

  const resetSettings = () => {
    setSelectedTheme("Nebula Dark");
    setSelectedWallpaper("Deep Space");
    setSelectedLanguage("English");
    setSelectedTimeFormat("24-hour");
  };

  return (
    <Windows
      title="Nebula Control Panel"
      icon="⚙"
      onClose={props.onClose}
      onMinimize={props.onMinimize}
      onFocus={props.onFocus}
      zIndex={props.zIndex}
      width="min(860px, 95vw)"
      height="min(590px, 84vh)"
      background="rgba(10,12,32,0.93)"
    >
      <div
        style={{
          display: "flex",
          gap: "0.45rem",
          padding: "0.9rem 1rem",
          border: "1px solid rgba(255,255,255,0.08)",
          "border-left": "none",
          "border-right": "none",
          "border-top": "none",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("appearance")}
          style={{
            border: "none",
            padding: "0.45rem 0.75rem",
            "border-radius": "8px",
            background: activeTab() === "appearance" ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.07)",
            color: "#dde0ff",
            cursor: "pointer",
            "font-size": "0.82rem",
          }}
        >
          Appearance
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("system")}
          style={{
            border: "none",
            padding: "0.45rem 0.75rem",
            "border-radius": "8px",
            background: activeTab() === "system" ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.07)",
            color: "#dde0ff",
            cursor: "pointer",
            "font-size": "0.82rem",
          }}
        >
          System
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("about")}
          style={{
            border: "none",
            padding: "0.45rem 0.75rem",
            "border-radius": "8px",
            background: activeTab() === "about" ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.07)",
            color: "#dde0ff",
            cursor: "pointer",
            "font-size": "0.82rem",
          }}
        >
          About
        </button>
      </div>

      <div style={{ padding: "1rem", overflow: "auto", display: "grid", gap: "1rem" }}>
        {activeTab() === "appearance" && (
          <>
            <h3 style={{ color: "#edf0ff", "font-size": "1rem" }}>Appearance</h3>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span style={{ color: "#aeb4d7", "font-size": "0.84rem" }}>Theme</span>
              <select
                value={selectedTheme()}
                onChange={(e) => setSelectedTheme(e.currentTarget.value)}
                style={{
                  padding: "0.6rem 0.7rem",
                  "border-radius": "9px",
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#edf0ff",
                  outline: "none",
                }}
              >
                <option>Nebula Dark</option>
                <option>Oceanic Blue</option>
                <option>Aurora Glow</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span style={{ color: "#aeb4d7", "font-size": "0.84rem" }}>Wallpaper</span>
              <select
                value={selectedWallpaper()}
                onChange={(e) => setSelectedWallpaper(e.currentTarget.value)}
                style={{
                  padding: "0.6rem 0.7rem",
                  "border-radius": "9px",
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#edf0ff",
                  outline: "none",
                }}
              >
                <option>Deep Space</option>
                <option>Gradient Blue</option>
                <option>Aurora Mist</option>
              </select>
            </label>
            <p style={{ color: "#9ea7cf", "font-size": "0.8rem" }}>
              Changes apply instantly and are kept for this session only.
            </p>
          </>
        )}

        {activeTab() === "system" && (
          <>
            <h3 style={{ color: "#edf0ff", "font-size": "1rem" }}>System</h3>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span style={{ color: "#aeb4d7", "font-size": "0.84rem" }}>Language</span>
              <select
                value={selectedLanguage()}
                onChange={(e) => setSelectedLanguage(e.currentTarget.value)}
                style={{
                  padding: "0.6rem 0.7rem",
                  "border-radius": "9px",
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#edf0ff",
                  outline: "none",
                }}
              >
                <option>English</option>
                <option>Traditional Chinese</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span style={{ color: "#aeb4d7", "font-size": "0.84rem" }}>Time Format</span>
              <select
                value={selectedTimeFormat()}
                onChange={(e) => setSelectedTimeFormat(e.currentTarget.value)}
                style={{
                  padding: "0.6rem 0.7rem",
                  "border-radius": "9px",
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#edf0ff",
                  outline: "none",
                }}
              >
                <option>24-hour</option>
                <option>12-hour</option>
              </select>
            </label>
            <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", gap: "0.7rem" }}>
              <p style={{ color: "#9ea7cf", "font-size": "0.8rem" }}>
                Settings are temporary and will reset on refresh.
              </p>
              <button
                type="button"
                onClick={resetSettings}
                style={{
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.08)",
                  color: "#edf0ff",
                  "border-radius": "8px",
                  padding: "0.45rem 0.7rem",
                  cursor: "pointer",
                  "font-size": "0.78rem",
                }}
              >
                Reset to Defaults
              </button>
            </div>
          </>
        )}

        {activeTab() === "about" && (
          <>
            <h3 style={{ color: "#edf0ff", "font-size": "1rem" }}>About</h3>
            <div
              style={{
                display: "grid",
                gap: "0.6rem",
                padding: "0.85rem",
                border: "1px solid rgba(255,255,255,0.12)",
                "border-radius": "12px",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <p style={{ color: "#d9ddff", "font-size": "0.88rem" }}>Product: NebulaOS</p>
              <p style={{ color: "#aeb4d7", "font-size": "0.84rem" }}>UI Module: nebula-ui</p>
              <p style={{ color: "#aeb4d7", "font-size": "0.84rem" }}>Version: 0.1.0-dev</p>
              <p style={{ color: "#aeb4d7", "font-size": "0.84rem" }}>Runtime: SolidStart Desktop Shell (Mock)</p>
            </div>
          </>
        )}
      </div>
    </Windows>
  );
}
