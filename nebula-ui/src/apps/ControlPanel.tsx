import { createSignal } from "solid-js";
import Windows from "../components/Windows";

type ControlPanelProps = {
  onClose: () => void;
  onMinimize: () => void;
  onFocus: () => void;
  zIndex: number;
};

export default function ControlPanel(props: ControlPanelProps) {
  const [activeTab, setActiveTab] = createSignal<"main" | "appearance" | "system" | "about" | "storage" | "default-apps">("main");
  const [selectedTheme, setSelectedTheme] = createSignal("Nebula Dark");
  const [selectedWallpaper, setSelectedWallpaper] = createSignal("Deep Space");
  const [selectedLanguage, setSelectedLanguage] = createSignal("English");
  const [selectedTimeFormat, setSelectedTimeFormat] = createSignal("24-hour");
  const initialDefaultApps = {
    ".txt": "Text Editor",
    ".md": "Text Editor",
    ".json": "Text Editor",
    ".png": "Image Viewer",
    ".jpg": "Image Viewer",
    ".zip": "File Explorer",
  } as const;
  const [defaultApps, setDefaultApps] = createSignal<Record<string, string>>({ ...initialDefaultApps });
  const totalStorageGb = 256;
  const usedStorageGb = 93;
  const freeStorageGb = totalStorageGb - usedStorageGb;
  const usedPct = Math.round((usedStorageGb / totalStorageGb) * 100);

  const resetSettings = () => {
    setSelectedTheme("Nebula Dark");
    setSelectedWallpaper("Deep Space");
    setSelectedLanguage("English");
    setSelectedTimeFormat("24-hour");
  };

  const updateDefaultApp = (fileType: string, appName: string) => {
    setDefaultApps((prev) => ({ ...prev, [fileType]: appName }));
  };

  const resetDefaultApps = () => {
    setDefaultApps({ ...initialDefaultApps });
  };

  const appOptions = ["Text Editor", "Image Viewer", "File Explorer", "AI Terminal"];

  return (
    <Windows
      title="Nebula Control Panel"
      icon="⚙"
      defaultMaximized={false}
      onClose={props.onClose}
      onMinimize={props.onMinimize}
      onFocus={props.onFocus}
      zIndex={props.zIndex}
      width="min(860px, 95vw)"
      height="min(590px, 84vh)"
      background="rgba(10,12,32,0.93)"
    >
      <div style={{ padding: "1rem", overflow: "auto", display: "grid", gap: "1rem" }}>
        {activeTab() !== "main" && (
          <button
            type="button"
            onClick={() => setActiveTab("main")}
            style={{
              width: "fit-content",
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.07)",
              color: "#e4e8ff",
              "border-radius": "8px",
              padding: "0.38rem 0.65rem",
              "font-size": "0.78rem",
              cursor: "pointer",
            }}
          >
            ← Back to Main
          </button>
        )}

        {activeTab() === "main" && (
          <>
            <h3 style={{ color: "#edf0ff", "font-size": "1rem" }}>Control Panel</h3>
            <p style={{ color: "#9ea7cf", "font-size": "0.82rem" }}>
              Choose a category to manage NebulaOS settings.
            </p>

            <div
              style={{
                display: "grid",
                "grid-template-columns": "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "0.75rem",
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab("appearance")}
                style={{
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.04)",
                  "border-radius": "12px",
                  padding: "0.85rem",
                  color: "#edf0ff",
                  display: "grid",
                  gap: "0.45rem",
                  "justify-items": "start",
                  cursor: "pointer",
                }}
              >
                <span style={{ "font-size": "1.35rem" }}>🎨</span>
                <strong style={{ "font-size": "0.9rem" }}>Appearance</strong>
                <span style={{ color: "#aeb4d7", "font-size": "0.78rem" }}>Theme and wallpaper</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("system")}
                style={{
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.04)",
                  "border-radius": "12px",
                  padding: "0.85rem",
                  color: "#edf0ff",
                  display: "grid",
                  gap: "0.45rem",
                  "justify-items": "start",
                  cursor: "pointer",
                }}
              >
                <span style={{ "font-size": "1.35rem" }}>🛠</span>
                <strong style={{ "font-size": "0.9rem" }}>System</strong>
                <span style={{ color: "#aeb4d7", "font-size": "0.78rem" }}>Language and time format</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("about")}
                style={{
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.04)",
                  "border-radius": "12px",
                  padding: "0.85rem",
                  color: "#edf0ff",
                  display: "grid",
                  gap: "0.45rem",
                  "justify-items": "start",
                  cursor: "pointer",
                }}
              >
                <span style={{ "font-size": "1.35rem" }}>ℹ</span>
                <strong style={{ "font-size": "0.9rem" }}>About</strong>
                <span style={{ color: "#aeb4d7", "font-size": "0.78rem" }}>Build and product details</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("storage")}
                style={{
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.04)",
                  "border-radius": "12px",
                  padding: "0.85rem",
                  color: "#edf0ff",
                  display: "grid",
                  gap: "0.45rem",
                  "justify-items": "start",
                  cursor: "pointer",
                }}
              >
                <span style={{ "font-size": "1.35rem" }}>💾</span>
                <strong style={{ "font-size": "0.9rem" }}>Storage</strong>
                <span style={{ color: "#aeb4d7", "font-size": "0.78rem" }}>Used and free account space</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("default-apps")}
                style={{
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.04)",
                  "border-radius": "12px",
                  padding: "0.85rem",
                  color: "#edf0ff",
                  display: "grid",
                  gap: "0.45rem",
                  "justify-items": "start",
                  cursor: "pointer",
                }}
              >
                <span style={{ "font-size": "1.35rem" }}>🧩</span>
                <strong style={{ "font-size": "0.9rem" }}>Default Apps</strong>
                <span style={{ color: "#aeb4d7", "font-size": "0.78rem" }}>Choose app by file type</span>
              </button>
            </div>
          </>
        )}

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

        {activeTab() === "storage" && (
          <>
            <h3 style={{ color: "#edf0ff", "font-size": "1rem" }}>Storage</h3>
            <p style={{ color: "#9ea7cf", "font-size": "0.8rem" }}>
              Review your account storage usage and available free space.
            </p>

            <div
              style={{
                display: "grid",
                "grid-template-columns": "repeat(auto-fit, minmax(170px, 1fr))",
                gap: "0.65rem",
              }}
            >
              <div
                style={{
                  padding: "0.75rem",
                  border: "1px solid rgba(255,255,255,0.12)",
                  "border-radius": "10px",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <p style={{ color: "#9ea7cf", "font-size": "0.78rem" }}>Total</p>
                <strong style={{ color: "#e6ebff", "font-size": "1rem" }}>{totalStorageGb} GB</strong>
              </div>

              <div
                style={{
                  padding: "0.75rem",
                  border: "1px solid rgba(255,255,255,0.12)",
                  "border-radius": "10px",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <p style={{ color: "#9ea7cf", "font-size": "0.78rem" }}>Used</p>
                <strong style={{ color: "#fca5a5", "font-size": "1rem" }}>{usedStorageGb} GB</strong>
              </div>

              <div
                style={{
                  padding: "0.75rem",
                  border: "1px solid rgba(255,255,255,0.12)",
                  "border-radius": "10px",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <p style={{ color: "#9ea7cf", "font-size": "0.78rem" }}>Free</p>
                <strong style={{ color: "#86efac", "font-size": "1rem" }}>{freeStorageGb} GB</strong>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: "0.45rem",
                padding: "0.75rem",
                border: "1px solid rgba(255,255,255,0.12)",
                "border-radius": "10px",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div style={{ display: "flex", "justify-content": "space-between", color: "#c9d2f3", "font-size": "0.8rem" }}>
                <span>Usage</span>
                <span>{usedPct}% used</span>
              </div>
              <div
                style={{
                  height: "10px",
                  background: "rgba(255,255,255,0.1)",
                  "border-radius": "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${usedPct}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #fb7185, #f59e0b)",
                  }}
                />
              </div>
              <p style={{ color: "#9ea7cf", "font-size": "0.76rem" }}>
                Upgrade storage plan when free space becomes limited.
              </p>
            </div>
          </>
        )}

        {activeTab() === "default-apps" && (
          <>
            <h3 style={{ color: "#edf0ff", "font-size": "1rem" }}>Default Apps</h3>
            <p style={{ color: "#9ea7cf", "font-size": "0.8rem" }}>
              Set which app opens when a file type is opened from File Explorer.
            </p>

            <div
              style={{
                display: "grid",
                gap: "0.6rem",
                padding: "0.8rem",
                border: "1px solid rgba(255,255,255,0.12)",
                "border-radius": "12px",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              {Object.entries(defaultApps()).map(([fileType, appName]) => (
                <label
                  style={{
                    display: "grid",
                    "grid-template-columns": "120px minmax(180px, 1fr)",
                    "align-items": "center",
                    gap: "0.65rem",
                  }}
                >
                  <span style={{ color: "#d9ddff", "font-size": "0.84rem" }}>{fileType}</span>
                  <select
                    value={appName}
                    onChange={(e) => updateDefaultApp(fileType, e.currentTarget.value)}
                    style={{
                      padding: "0.5rem 0.6rem",
                      "border-radius": "8px",
                      border: "1px solid rgba(255,255,255,0.14)",
                      background: "rgba(255,255,255,0.05)",
                      color: "#edf0ff",
                      outline: "none",
                    }}
                  >
                    {appOptions.map((option) => (
                      <option>{option}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", gap: "0.7rem" }}>
              <p style={{ color: "#9ea7cf", "font-size": "0.78rem" }}>
                These preferences are session-only and will reset on refresh.
              </p>
              <button
                type="button"
                onClick={resetDefaultApps}
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
                Reset Mappings
              </button>
            </div>
          </>
        )}
      </div>
    </Windows>
  );
}
