import { For, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import Windows from "../components/Windows";

export const route = {
  ssr: false,
};

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

type FileNode = {
  id: string;
  name: string;
  type: "folder" | "file";
  size?: string;
  children?: FileNode[];
};

type WindowId = "store" | "explorer" | "control-panel" | "ai-terminal" | "task-manager";

type AIMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type AppRuntimeRow = {
  appName: string;
  icon: string;
  status: string;
  memoryMb: number;
  cpuPercent: number;
};

const FILE_TREE: FileNode = {
  id: "root",
  name: "Home",
  type: "folder",
  children: [
    {
      id: "documents",
      name: "Documents",
      type: "folder",
      children: [
        { id: "roadmap", name: "Nebula-Roadmap.md", type: "file", size: "128 KB" },
        { id: "meeting-notes", name: "Meeting-Notes.txt", type: "file", size: "42 KB" },
      ],
    },
    {
      id: "projects",
      name: "Projects",
      type: "folder",
      children: [
        { id: "kernel-go", name: "nebula-kernel", type: "folder", children: [] },
        { id: "ui-src", name: "nebula-ui", type: "folder", children: [] },
      ],
    },
    {
      id: "downloads",
      name: "Downloads",
      type: "folder",
      children: [
        { id: "release-zip", name: "release-candidate.zip", type: "file", size: "38 MB" },
      ],
    },
    {
      id: "pictures",
      name: "Pictures",
      type: "folder",
      children: [
        { id: "nebula-wall", name: "nebula-wallpaper.png", type: "file", size: "5.4 MB" },
      ],
    },
  ],
};

function findNode(node: FileNode, targetId: string): FileNode | null {
  if (node.id === targetId) return node;
  if (!node.children) return null;

  for (const child of node.children) {
    const found = findNode(child, targetId);
    if (found) return found;
  }

  return null;
}

function findPath(node: FileNode, targetId: string, chain: FileNode[] = []): FileNode[] | null {
  const nextChain = [...chain, node];
  if (node.id === targetId) return nextChain;
  if (!node.children) return null;

  for (const child of node.children) {
    const foundChain = findPath(child, targetId, nextChain);
    if (foundChain) return foundChain;
  }

  return null;
}

export default function Desktop() {
  const [timeText, setTimeText] = createSignal("--:--");
  const [isStoreOpen, setIsStoreOpen] = createSignal(false);
  const [isExplorerOpen, setIsExplorerOpen] = createSignal(false);
  const [isControlPanelOpen, setIsControlPanelOpen] = createSignal(false);
  const [isAITerminalOpen, setIsAITerminalOpen] = createSignal(false);
  const [isStoreMinimized, setIsStoreMinimized] = createSignal(false);
  const [isExplorerMinimized, setIsExplorerMinimized] = createSignal(false);
  const [isControlPanelMinimized, setIsControlPanelMinimized] = createSignal(false);
  const [isAITerminalMinimized, setIsAITerminalMinimized] = createSignal(false);
  const [isTaskManagerOpen, setIsTaskManagerOpen] = createSignal(false);
  const [isTaskManagerMinimized, setIsTaskManagerMinimized] = createSignal(false);
  const [usagePulse, setUsagePulse] = createSignal(0);
  const [activeControlTab, setActiveControlTab] = createSignal<"appearance" | "system" | "about">("appearance");
  const [selectedTheme, setSelectedTheme] = createSignal("Nebula Dark");
  const [selectedWallpaper, setSelectedWallpaper] = createSignal("Deep Space");
  const [selectedLanguage, setSelectedLanguage] = createSignal("English");
  const [selectedTimeFormat, setSelectedTimeFormat] = createSignal("24-hour");
  const [searchText, setSearchText] = createSignal("");
  const [installedAppIds, setInstalledAppIds] = createSignal<string[]>([]);
  const [currentFolderId, setCurrentFolderId] = createSignal("root");
  const [windowStack, setWindowStack] = createSignal<WindowId[]>(["store", "explorer", "control-panel", "ai-terminal", "task-manager"]);
  const [aiPrompt, setAiPrompt] = createSignal("");
  const [aiMessages, setAiMessages] = createSignal<AIMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text:
        "AI Terminal ready. I can control NebulaOS apps inside this desktop only. Try: open app store, minimize explorer, close control panel, focus ai terminal, show time, help.",
    },
  ]);

  const appendAIMessage = (role: AIMessage["role"], text: string) => {
    setAiMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        role,
        text,
      },
    ]);
  };

  const resolveTargetApp = (raw: string): WindowId | null => {
    const key = raw.trim().toLowerCase();
    if (["app store", "store", "market"].includes(key)) return "store";
    if (["file explorer", "explorer", "files"].includes(key)) return "explorer";
    if (["control panel", "settings", "control"].includes(key)) return "control-panel";
    if (["ai terminal", "terminal", "ai"].includes(key)) return "ai-terminal";
    if (["task manager", "tasks", "processes", "task-manager"].includes(key)) return "task-manager";
    return null;
  };

  const appLabel = (target: WindowId) => {
    if (target === "store") return "App Store";
    if (target === "explorer") return "File Explorer";
    if (target === "control-panel") return "Control Panel";
    if (target === "task-manager") return "Task Manager";
    return "AI Terminal";
  };

  const openAppWindow = (target: WindowId) => {
    if (target === "store") {
      setIsStoreOpen(true);
      setIsStoreMinimized(false);
    }

    if (target === "explorer") {
      setIsExplorerOpen(true);
      setIsExplorerMinimized(false);
      setCurrentFolderId("root");
    }

    if (target === "control-panel") {
      setIsControlPanelOpen(true);
      setIsControlPanelMinimized(false);
      setActiveControlTab("appearance");
    }

    if (target === "ai-terminal") {
      setIsAITerminalOpen(true);
      setIsAITerminalMinimized(false);
    }

    if (target === "task-manager") {
      setIsTaskManagerOpen(true);
      setIsTaskManagerMinimized(false);
    }

    bringWindowToFront(target);
  };

  const minimizeAppWindow = (target: WindowId) => {
    if (target === "store") setIsStoreMinimized(true);
    if (target === "explorer") setIsExplorerMinimized(true);
    if (target === "control-panel") setIsControlPanelMinimized(true);
    if (target === "ai-terminal") setIsAITerminalMinimized(true);
    if (target === "task-manager") setIsTaskManagerMinimized(true);
  };

  const closeAppWindow = (target: WindowId) => {
    if (target === "store") {
      setIsStoreOpen(false);
      setIsStoreMinimized(false);
    }

    if (target === "explorer") {
      setIsExplorerOpen(false);
      setIsExplorerMinimized(false);
    }

    if (target === "control-panel") {
      setIsControlPanelOpen(false);
      setIsControlPanelMinimized(false);
    }

    if (target === "ai-terminal") {
      setIsAITerminalOpen(false);
      setIsAITerminalMinimized(false);
    }

    if (target === "task-manager") {
      setIsTaskManagerOpen(false);
      setIsTaskManagerMinimized(false);
    }
  };

  const runAITerminalCommand = (input: string) => {
    const query = input.trim();
    if (!query) return;

    appendAIMessage("user", query);

    const lowered = query.toLowerCase();

    if (
      /(shutdown|reboot|restart pc|delete|format|powershell|cmd|registry|install|uninstall|open chrome|open notepad|system32)/i.test(lowered)
    ) {
      appendAIMessage(
        "assistant",
        "Blocked: AI Terminal is sandboxed to NebulaOS app controls only. I cannot execute real OS/system commands.",
      );
      return;
    }

    if (/^help$|^commands$|what can you do|capabilities/.test(lowered)) {
      appendAIMessage(
        "assistant",
        "Commands: open <app>, minimize <app>, close <app>, focus <app>, show time. Apps: app store, explorer, control panel, ai terminal, task manager.",
      );
      return;
    }

    if (/(show|what is|current)\s+time/.test(lowered)) {
      appendAIMessage("assistant", `Current desktop time: ${timeText()}.`);
      return;
    }

    const actionMatch = lowered.match(/(open|launch|start|minimize|close|focus|show)\s+(app store|store|market|file explorer|explorer|files|control panel|settings|control|ai terminal|terminal|ai|task manager|tasks|processes)/);

    if (actionMatch) {
      const action = actionMatch[1];
      const target = resolveTargetApp(actionMatch[2]);

      if (!target) {
        appendAIMessage("assistant", "I could not resolve that app target.");
        return;
      }

      if (action === "open" || action === "launch" || action === "start" || action === "show") {
        openAppWindow(target);
        appendAIMessage("assistant", `${appLabel(target)} opened.`);
        return;
      }

      if (action === "focus") {
        openAppWindow(target);
        appendAIMessage("assistant", `${appLabel(target)} focused.`);
        return;
      }

      if (action === "minimize") {
        minimizeAppWindow(target);
        appendAIMessage("assistant", `${appLabel(target)} minimized to dock.`);
        return;
      }

      if (action === "close") {
        closeAppWindow(target);
        appendAIMessage("assistant", `${appLabel(target)} closed.`);
        return;
      }
    }

    appendAIMessage(
      "assistant",
      "I can only control NebulaOS windows here. Try: open app store, focus explorer, minimize control panel, close ai terminal, open task manager, show time, help.",
    );
  };

  const submitAIPrompt = () => {
    const prompt = aiPrompt().trim();
    if (!prompt) return;

    setAiPrompt("");
    runAITerminalCommand(prompt);
  };

  const bringWindowToFront = (windowId: WindowId) => {
    setWindowStack((prev) => [...prev.filter((id) => id !== windowId), windowId]);
  };

  const getWindowZIndex = (windowId: WindowId) => {
    const stackIndex = windowStack().indexOf(windowId);
    return stackIndex === -1 ? 10 : 20 + stackIndex;
  };

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

  const installApp = (id: string) => {
    setInstalledAppIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const resetControlSettings = () => {
    setSelectedTheme("Nebula Dark");
    setSelectedWallpaper("Deep Space");
    setSelectedLanguage("English");
    setSelectedTimeFormat("24-hour");
  };

  const currentFolder = createMemo(() => {
    const folder = findNode(FILE_TREE, currentFolderId());
    if (folder && folder.type === "folder") return folder;
    return FILE_TREE;
  });

  const currentPath = createMemo(() => findPath(FILE_TREE, currentFolderId()) ?? [FILE_TREE]);

  const folderItems = createMemo(() =>
    (currentFolder().children ?? []).filter((item) => item.type === "folder"),
  );

  const fileItems = createMemo(() =>
    (currentFolder().children ?? []).filter((item) => item.type === "file"),
  );

  const runtimeRows = createMemo<AppRuntimeRow[]>(() => {
    // usagePulse() is read to make this reactive on each tick
    const pulse = usagePulse();
    const seed = (pulse * 9301 + 49297) % 233280;
    const rand = (offset: number, min: number, max: number) =>
      min + Math.floor(((seed + offset * 7919) % (max - min + 1)));

    const rows: AppRuntimeRow[] = [];
    if (isStoreOpen()) rows.push({ appName: "App Store", icon: "🛍", status: "Running", memoryMb: rand(1, 42, 88), cpuPercent: rand(2, 0, 8) });
    if (isExplorerOpen()) rows.push({ appName: "File Explorer", icon: "📁", status: "Running", memoryMb: rand(3, 28, 64), cpuPercent: rand(4, 0, 5) });
    if (isControlPanelOpen()) rows.push({ appName: "Control Panel", icon: "⚙", status: "Running", memoryMb: rand(5, 18, 48), cpuPercent: rand(6, 0, 4) });
    if (isAITerminalOpen()) rows.push({ appName: "AI Terminal", icon: "🤖", status: "Running", memoryMb: rand(7, 56, 120), cpuPercent: rand(8, 1, 12) });
    if (isTaskManagerOpen()) rows.push({ appName: "Task Manager", icon: "📊", status: "Running", memoryMb: rand(9, 22, 44), cpuPercent: rand(10, 0, 3) });
    return rows;
  });

  const totalMemoryMb = createMemo(() => runtimeRows().reduce((sum, r) => sum + r.memoryMb, 0));
  const totalCpuPct = createMemo(() => runtimeRows().reduce((sum, r) => sum + r.cpuPercent, 0));

  onMount(() => {
    const formatTime = () =>
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setTimeText(formatTime());
    const timer = setInterval(() => setTimeText(formatTime()), 30_000);
    const usageTimer = setInterval(() => setUsagePulse((p) => (p + 1) % 1_000_000), 2500);
    onCleanup(() => {
      clearInterval(timer);
      clearInterval(usageTimer);
    });
  });

  return (
    <div
      style={{
        "min-height": "100vh",
        background: "linear-gradient(135deg, #0a0a1a 0%, #0d1b3e 60%, #1a0a2e 100%)",
        display: "flex",
        "flex-direction": "column",
      }}
    >
      {/* Desktop workspace */}
      <main
        style={{
          flex: "1",
          display: "flex",
          padding: "1rem",
          position: "relative",
        }}
      >
        <button
          type="button"
          onClick={() => {
            setIsStoreOpen(true);
            setIsStoreMinimized(false);
            bringWindowToFront("store");
          }}
          style={{
            position: "absolute",
            top: "1.25rem",
            left: "1.25rem",
            border: "none",
            background: "transparent",
            display: "flex",
            "flex-direction": "column",
            "align-items": "center",
            gap: "0.4rem",
            color: "#d6d6ff",
            cursor: "pointer",
            width: "84px",
          }}
          aria-label="Open App Store"
          title="App Store"
        >
          <span
            style={{
              width: "56px",
              height: "56px",
              "border-radius": "14px",
              background: "linear-gradient(135deg, #5f72ff, #8f7bff)",
              display: "grid",
              "place-items": "center",
              "box-shadow": "0 8px 24px rgba(95,114,255,0.45)",
              "font-size": "1.45rem",
            }}
          >
            🛍
          </span>
          <span style={{ "font-size": "0.82rem" }}>App Store</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setIsExplorerOpen(true);
            setIsExplorerMinimized(false);
            setCurrentFolderId("root");
            bringWindowToFront("explorer");
          }}
          style={{
            position: "absolute",
            top: "7rem",
            left: "1.25rem",
            border: "none",
            background: "transparent",
            display: "flex",
            "flex-direction": "column",
            "align-items": "center",
            gap: "0.4rem",
            color: "#d6d6ff",
            cursor: "pointer",
            width: "84px",
          }}
          aria-label="Open File Explorer"
          title="File Explorer"
        >
          <span
            style={{
              width: "56px",
              height: "56px",
              "border-radius": "14px",
              background: "linear-gradient(135deg, #54a4ff, #38d4b8)",
              display: "grid",
              "place-items": "center",
              "box-shadow": "0 8px 24px rgba(56,212,184,0.35)",
              "font-size": "1.45rem",
            }}
          >
            📁
          </span>
          <span style={{ "font-size": "0.82rem" }}>Explorer</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setIsControlPanelOpen(true);
            setIsControlPanelMinimized(false);
            setActiveControlTab("appearance");
            bringWindowToFront("control-panel");
          }}
          style={{
            position: "absolute",
            top: "12.75rem",
            left: "1.25rem",
            border: "none",
            background: "transparent",
            display: "flex",
            "flex-direction": "column",
            "align-items": "center",
            gap: "0.4rem",
            color: "#d6d6ff",
            cursor: "pointer",
            width: "84px",
          }}
          aria-label="Open Control Panel"
          title="Control Panel"
        >
          <span
            style={{
              width: "56px",
              height: "56px",
              "border-radius": "14px",
              background: "linear-gradient(135deg, #ff8b6b, #ffb25b)",
              display: "grid",
              "place-items": "center",
              "box-shadow": "0 8px 24px rgba(255,139,107,0.35)",
              "font-size": "1.45rem",
            }}
          >
            ⚙
          </span>
          <span style={{ "font-size": "0.82rem" }}>Control Panel</span>
        </button>

        <button
          type="button"
          onClick={() => openAppWindow("ai-terminal")}
          style={{
            position: "absolute",
            top: "18.5rem",
            left: "1.25rem",
            border: "none",
            background: "transparent",
            display: "flex",
            "flex-direction": "column",
            "align-items": "center",
            gap: "0.4rem",
            color: "#d6d6ff",
            cursor: "pointer",
            width: "84px",
          }}
          aria-label="Open AI Terminal"
          title="AI Terminal"
        >
          <span
            style={{
              width: "56px",
              height: "56px",
              "border-radius": "14px",
              background: "linear-gradient(135deg, #62d2ff, #5f72ff)",
              display: "grid",
              "place-items": "center",
              "box-shadow": "0 8px 24px rgba(98,210,255,0.35)",
              "font-size": "1.45rem",
            }}
          >
            🤖
          </span>
          <span style={{ "font-size": "0.82rem" }}>AI Terminal</span>
        </button>

        <button
          type="button"
          onClick={() => openAppWindow("task-manager")}
          style={{
            position: "absolute",
            top: "24.25rem",
            left: "1.25rem",
            border: "none",
            background: "transparent",
            display: "flex",
            "flex-direction": "column",
            "align-items": "center",
            gap: "0.4rem",
            color: "#d6d6ff",
            cursor: "pointer",
            width: "84px",
          }}
          aria-label="Open Task Manager"
          title="Task Manager"
        >
          <span
            style={{
              width: "56px",
              height: "56px",
              "border-radius": "14px",
              background: "linear-gradient(135deg, #34d399, #3b82f6)",
              display: "grid",
              "place-items": "center",
              "box-shadow": "0 8px 24px rgba(52,211,153,0.35)",
              "font-size": "1.45rem",
            }}
          >
            📊
          </span>
          <span style={{ "font-size": "0.82rem" }}>Task Manager</span>
        </button>

        <div style={{ margin: "auto", "text-align": "center" }}>
          <p
            style={{
              "font-size": "1rem",
              color: "#6060a0",
              "margin-bottom": "0.5rem",
            }}
          >
            Welcome to
          </p>
          <h1
            style={{
              "font-size": "clamp(2rem, 6vw, 4rem)",
              "font-weight": "700",
              background: "linear-gradient(90deg, #7b8cde, #a78bfa, #7b8cde)",
              "-webkit-background-clip": "text",
              "-webkit-text-fill-color": "transparent",
              "background-clip": "text",
            }}
          >
            NebulaOS Desktop
          </h1>
          <p style={{ color: "#7070a0", "margin-top": "0.75rem", "font-size": "0.95rem" }}>
            Your cloud workspace is ready.
          </p>
        </div>

        {isStoreOpen() && !isStoreMinimized() && (
          <Windows
            title="Nebula App Store"
            icon="🛍"
            onClose={() => {
              setIsStoreOpen(false);
              setIsStoreMinimized(false);
            }}
            onMinimize={() => setIsStoreMinimized(true)}
            onFocus={() => bringWindowToFront("store")}
            zIndex={getWindowZIndex("store")}
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
                  const installed = () => installedAppIds().includes(app.id);

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
                          onClick={() => installApp(app.id)}
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
        )}

        {isExplorerOpen() && !isExplorerMinimized() && (
          <Windows
            title="Nebula File Explorer"
            icon="📁"
            onClose={() => {
              setIsExplorerOpen(false);
              setIsExplorerMinimized(false);
            }}
            onMinimize={() => setIsExplorerMinimized(true)}
            onFocus={() => bringWindowToFront("explorer")}
            zIndex={getWindowZIndex("explorer")}
            top="52%"
            left="52%"
            width="min(940px, 96vw)"
            height="min(620px, 86vh)"
            background="rgba(8,18,34,0.94)"
          >
            <div style={{ display: "flex", flex: "1", overflow: "hidden" }}>
              <aside
                style={{
                  width: "220px",
                  padding: "0.8rem",
                  border: "1px solid rgba(255,255,255,0.08)",
                  "border-top": "none",
                  "border-bottom": "none",
                  "border-left": "none",
                  display: "flex",
                  "flex-direction": "column",
                  gap: "0.4rem",
                }}
              >
                <button
                  type="button"
                  onClick={() => setCurrentFolderId("root")}
                  style={{
                    border: "none",
                    padding: "0.48rem 0.55rem",
                    "border-radius": "8px",
                    background: currentFolderId() === "root" ? "rgba(84,164,255,0.24)" : "transparent",
                    color: "#d6ecff",
                    cursor: "pointer",
                    "text-align": "left",
                  }}
                >
                  Home
                </button>
                <For each={FILE_TREE.children ?? []}>
                  {(item) => (
                    <button
                      type="button"
                      onClick={() => setCurrentFolderId(item.id)}
                      style={{
                        border: "none",
                        padding: "0.48rem 0.55rem",
                        "border-radius": "8px",
                        background: currentFolderId() === item.id ? "rgba(84,164,255,0.24)" : "transparent",
                        color: "#d6ecff",
                        cursor: "pointer",
                        "text-align": "left",
                      }}
                    >
                      {item.name}
                    </button>
                  )}
                </For>
              </aside>

              <section style={{ flex: "1", display: "flex", "flex-direction": "column", overflow: "hidden" }}>
                <div
                  style={{
                    padding: "0.72rem 0.9rem",
                    border: "1px solid rgba(255,255,255,0.08)",
                    "border-top": "none",
                    "border-left": "none",
                    "border-right": "none",
                    display: "flex",
                    "flex-wrap": "wrap",
                    gap: "0.35rem",
                  }}
                >
                  <For each={currentPath()}>
                    {(segment, index) => (
                      <button
                        type="button"
                        onClick={() => setCurrentFolderId(segment.id)}
                        style={{
                          border: "none",
                          background: "rgba(255,255,255,0.08)",
                          color: "#d4ebff",
                          "border-radius": "999px",
                          padding: "0.3rem 0.55rem",
                          "font-size": "0.78rem",
                          cursor: "pointer",
                        }}
                      >
                        {segment.name}{index() < currentPath().length - 1 ? " /" : ""}
                      </button>
                    )}
                  </For>
                </div>

                <div style={{ padding: "0.9rem", overflow: "auto", display: "grid", gap: "0.55rem" }}>
                  <For each={folderItems()}>
                    {(folder) => (
                      <button
                        type="button"
                        onClick={() => setCurrentFolderId(folder.id)}
                        style={{
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.03)",
                          "border-radius": "10px",
                          padding: "0.65rem 0.75rem",
                          display: "flex",
                          "align-items": "center",
                          "justify-content": "space-between",
                          color: "#ecf6ff",
                          cursor: "pointer",
                        }}
                        title={`Open ${folder.name}`}
                      >
                        <span>📁 {folder.name}</span>
                        <span style={{ color: "#8eb8d8", "font-size": "0.78rem" }}>Folder</span>
                      </button>
                    )}
                  </For>

                  <For each={fileItems()}>
                    {(file) => (
                      <div
                        style={{
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.03)",
                          "border-radius": "10px",
                          padding: "0.65rem 0.75rem",
                          display: "flex",
                          "align-items": "center",
                          "justify-content": "space-between",
                          color: "#ecf6ff",
                        }}
                      >
                        <span>📄 {file.name}</span>
                        <span style={{ color: "#8eb8d8", "font-size": "0.78rem" }}>{file.size ?? "-"}</span>
                      </div>
                    )}
                  </For>

                  {folderItems().length === 0 && fileItems().length === 0 && (
                    <p style={{ color: "#7fa6c4", "font-size": "0.86rem" }}>This folder is empty.</p>
                  )}
                </div>
              </section>
            </div>
          </Windows>
        )}

        {isControlPanelOpen() && !isControlPanelMinimized() && (
          <Windows
            title="Nebula Control Panel"
            icon="⚙"
            onClose={() => {
              setIsControlPanelOpen(false);
              setIsControlPanelMinimized(false);
            }}
            onMinimize={() => setIsControlPanelMinimized(true)}
            onFocus={() => bringWindowToFront("control-panel")}
            zIndex={getWindowZIndex("control-panel")}
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
                onClick={() => setActiveControlTab("appearance")}
                style={{
                  border: "none",
                  padding: "0.45rem 0.75rem",
                  "border-radius": "8px",
                  background: activeControlTab() === "appearance" ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.07)",
                  color: "#dde0ff",
                  cursor: "pointer",
                  "font-size": "0.82rem",
                }}
              >
                Appearance
              </button>
              <button
                type="button"
                onClick={() => setActiveControlTab("system")}
                style={{
                  border: "none",
                  padding: "0.45rem 0.75rem",
                  "border-radius": "8px",
                  background: activeControlTab() === "system" ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.07)",
                  color: "#dde0ff",
                  cursor: "pointer",
                  "font-size": "0.82rem",
                }}
              >
                System
              </button>
              <button
                type="button"
                onClick={() => setActiveControlTab("about")}
                style={{
                  border: "none",
                  padding: "0.45rem 0.75rem",
                  "border-radius": "8px",
                  background: activeControlTab() === "about" ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.07)",
                  color: "#dde0ff",
                  cursor: "pointer",
                  "font-size": "0.82rem",
                }}
              >
                About
              </button>
            </div>

            <div style={{ padding: "1rem", overflow: "auto", display: "grid", gap: "1rem" }}>
              {activeControlTab() === "appearance" && (
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

              {activeControlTab() === "system" && (
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
                      onClick={resetControlSettings}
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

              {activeControlTab() === "about" && (
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
        )}

        {isAITerminalOpen() && !isAITerminalMinimized() && (
          <Windows
            title="Nebula AI Terminal"
            icon="🤖"
            onClose={() => {
              setIsAITerminalOpen(false);
              setIsAITerminalMinimized(false);
            }}
            onMinimize={() => setIsAITerminalMinimized(true)}
            onFocus={() => bringWindowToFront("ai-terminal")}
            zIndex={getWindowZIndex("ai-terminal")}
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
                <For each={aiMessages()}>
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
                  value={aiPrompt()}
                  onInput={(event) => setAiPrompt(event.currentTarget.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      submitAIPrompt();
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
                  onClick={submitAIPrompt}
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
        )}

        {isTaskManagerOpen() && !isTaskManagerMinimized() && (
          <Windows
            title="Task Manager"
            icon="📊"
            onClose={() => {
              setIsTaskManagerOpen(false);
              setIsTaskManagerMinimized(false);
            }}
            onMinimize={() => setIsTaskManagerMinimized(true)}
            onFocus={() => bringWindowToFront("task-manager")}
            zIndex={getWindowZIndex("task-manager")}
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
                <span>Processes: <strong style={{ color: "#c8d8ff" }}>{runtimeRows().length}</strong></span>
                <span>Total Memory: <strong style={{ color: "#34d399" }}>{totalMemoryMb()} MB</strong></span>
                <span>Total CPU: <strong style={{ color: totalCpuPct() > 30 ? "#fb923c" : "#34d399" }}>{totalCpuPct()}%</strong></span>
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
                {runtimeRows().length === 0 ? (
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
                  <For each={runtimeRows()}>
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
                          onClick={() => closeAppWindow(resolveTargetApp(row.appName.toLowerCase()) ?? "store")}
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
        )}
      </main>

      {/* Taskbar */}
      <nav
        style={{
          height: "48px",
          background: "rgba(10,10,30,0.85)",
          "backdrop-filter": "blur(16px)",
          "border-top": "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          "align-items": "center",
          "justify-content": "space-between",
          padding: "0 1.5rem",
        }}
      >
        <span
          style={{
            "font-weight": "700",
            "font-size": "0.9rem",
            background: "linear-gradient(90deg, #7b8cde, #a78bfa)",
            "-webkit-background-clip": "text",
            "-webkit-text-fill-color": "transparent",
            "background-clip": "text",
          }}
        >
          NebulaOS{installedAppIds().length > 0 ? ` • ${installedAppIds().length} apps installed` : ""}
        </span>
        <div style={{ display: "flex", "align-items": "center", gap: "0.45rem" }}>
          {isStoreOpen() && (
            <button
              type="button"
              onClick={() => {
                setIsStoreMinimized(false);
                bringWindowToFront("store");
              }}
              style={{
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.08)",
                color: "#e5e6ff",
                "border-radius": "10px",
                width: "34px",
                height: "30px",
                cursor: "pointer",
                "font-size": "1rem",
              }}
              title="Restore App Store"
              aria-label="Restore App Store"
            >
              🛍
            </button>
          )}
          {isExplorerOpen() && (
            <button
              type="button"
              onClick={() => {
                setIsExplorerMinimized(false);
                bringWindowToFront("explorer");
              }}
              style={{
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.08)",
                color: "#e5e6ff",
                "border-radius": "10px",
                width: "34px",
                height: "30px",
                cursor: "pointer",
                "font-size": "1rem",
              }}
              title="Restore File Explorer"
              aria-label="Restore File Explorer"
            >
              📁
            </button>
          )}
          {isControlPanelOpen() && (
            <button
              type="button"
              onClick={() => {
                setIsControlPanelMinimized(false);
                bringWindowToFront("control-panel");
              }}
              style={{
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.08)",
                color: "#e5e6ff",
                "border-radius": "10px",
                width: "34px",
                height: "30px",
                cursor: "pointer",
                "font-size": "1rem",
              }}
              title="Restore Control Panel"
              aria-label="Restore Control Panel"
            >
              ⚙
            </button>
          )}
          {isAITerminalOpen() && (
            <button
              type="button"
              onClick={() => {
                setIsAITerminalMinimized(false);
                bringWindowToFront("ai-terminal");
              }}
              style={{
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.08)",
                color: "#e5e6ff",
                "border-radius": "10px",
                width: "34px",
                height: "30px",
                cursor: "pointer",
                "font-size": "1rem",
              }}
              title="Restore AI Terminal"
              aria-label="Restore AI Terminal"
            >
              🤖
            </button>
          )}
          {isTaskManagerOpen() && (
            <button
              type="button"
              onClick={() => {
                setIsTaskManagerMinimized(false);
                bringWindowToFront("task-manager");
              }}
              style={{
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.08)",
                color: "#e5e6ff",
                "border-radius": "10px",
                width: "34px",
                height: "30px",
                cursor: "pointer",
                "font-size": "1rem",
              }}
              title="Restore Task Manager"
              aria-label="Restore Task Manager"
            >
              📊
            </button>
          )}
        </div>
        <span style={{ "font-size": "0.8rem", color: "#6060a0" }}>
          {timeText()}
        </span>
      </nav>
    </div>
  );
}
