import { For, createMemo, createSignal } from "solid-js";
import Windows from "../components/Windows";

type StoreApp = {
  id: string;
  name: string;
  category: string;
  rating: number;
  size: string;
  description: string;
};

const STORE_APPS: StoreApp[] = [
  {
    id: "notes-pro",
    name: "Notes Pro",
    category: "Productivity",
    rating: 4.8,
    size: "12 MB",
    description: "Fast markdown notes with cloud sync and AI summaries.",
  },
  {
    id: "nova-mail",
    name: "Nova Mail",
    category: "Communication",
    rating: 4.6,
    size: "48 MB",
    description: "Unified inbox for email, calendar, and team messages.",
  },
  {
    id: "pixel-lab",
    name: "Pixel Lab",
    category: "Design",
    rating: 4.9,
    size: "86 MB",
    description: "Vector and raster editor optimized for browser workflows.",
  },
  {
    id: "focus-flow",
    name: "Focus Flow",
    category: "Wellness",
    rating: 4.5,
    size: "9 MB",
    description: "Pomodoro timer, ambient audio, and deep-work analytics.",
  },
  {
    id: "terminal-x",
    name: "Terminal X",
    category: "Developer Tools",
    rating: 4.7,
    size: "22 MB",
    description: "Developer terminal with tab sessions and snippets.",
  },
];

type AppStoreProps = {
  onClose: () => void;
  onMinimize: () => void;
  onFocus: () => void;
  zIndex: number;
  installedAppIds: string[];
  onInstall: (id: string) => void;
};

export default function AppStore(props: AppStoreProps) {
  const [searchText, setSearchText] = createSignal("");

  const visibleApps = createMemo(() => {
    const keyword = searchText().trim().toLowerCase();
    if (!keyword) return STORE_APPS;
    return STORE_APPS.filter(
      (app) =>
        app.name.toLowerCase().includes(keyword) ||
        app.category.toLowerCase().includes(keyword) ||
        app.description.toLowerCase().includes(keyword),
    );
  });

  return (
    <Windows
      title="Nebula App Store"
      icon="🛍"
      onClose={props.onClose}
      onMinimize={props.onMinimize}
      onFocus={props.onFocus}
      zIndex={props.zIndex}
      width="min(920px, 95vw)"
      height="min(610px, 84vh)"
      background="rgba(10,12,32,0.92)"
    >
      <div style={{ padding: "1rem" }}>
        <input
          type="text"
          value={searchText()}
          onInput={(e) => setSearchText(e.currentTarget.value)}
          placeholder="Search apps, categories, keywords..."
          style={{
            width: "100%",
            padding: "0.72rem 0.85rem",
            "border-radius": "10px",
            border: "1px solid rgba(255,255,255,0.13)",
            background: "rgba(255,255,255,0.05)",
            color: "#ecedff",
            outline: "none",
          }}
        />
      </div>

      <div
        style={{
          padding: "0 1rem 1rem",
          display: "grid",
          "grid-template-columns": "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "0.85rem",
          overflow: "auto",
        }}
      >
        <For each={visibleApps()}>
          {(app) => {
            const installed = () => props.installedAppIds.includes(app.id);

            return (
              <article
                style={{
                  padding: "0.9rem",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.03)",
                  "border-radius": "12px",
                  display: "flex",
                  "flex-direction": "column",
                  gap: "0.55rem",
                }}
              >
                <div style={{ display: "flex", "justify-content": "space-between", gap: "0.65rem" }}>
                  <strong style={{ color: "#f1f1ff", "font-size": "0.95rem" }}>{app.name}</strong>
                  <span style={{ color: "#b7b8da", "font-size": "0.8rem" }}>★ {app.rating.toFixed(1)}</span>
                </div>

                <span
                  style={{
                    width: "fit-content",
                    padding: "0.16rem 0.45rem",
                    "border-radius": "999px",
                    background: "rgba(123,140,222,0.2)",
                    color: "#c7d0ff",
                    "font-size": "0.72rem",
                  }}
                >
                  {app.category}
                </span>

                <p style={{ color: "#aeb0cf", "font-size": "0.82rem", "line-height": "1.4" }}>
                  {app.description}
                </p>

                <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", "margin-top": "auto" }}>
                  <span style={{ color: "#9396b8", "font-size": "0.77rem" }}>{app.size}</span>
                  <button
                    type="button"
                    onClick={() => props.onInstall(app.id)}
                    disabled={installed()}
                    style={{
                      border: "none",
                      background: installed()
                        ? "rgba(70,170,110,0.35)"
                        : "linear-gradient(135deg, #5f72ff, #8f7bff)",
                      color: "#fff",
                      "border-radius": "8px",
                      padding: "0.42rem 0.62rem",
                      "font-size": "0.78rem",
                      cursor: installed() ? "default" : "pointer",
                      opacity: installed() ? "0.75" : "1",
                    }}
                  >
                    {installed() ? "Installed" : "Install"}
                  </button>
                </div>
              </article>
            );
          }}
        </For>
      </div>
    </Windows>
  );
}
