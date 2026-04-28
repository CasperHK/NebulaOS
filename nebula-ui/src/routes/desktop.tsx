import { createMemo, createSignal, onCleanup, onMount } from "solid-js";
import AppStore from "../apps/AppStore";
import FileExplorer from "../apps/FileExplorer";
import ControlPanel from "../apps/ControlPanel";
import AITerminal, { type AIMessage } from "../apps/AITerminal";
import TaskManager, { type AppRuntimeRow } from "../apps/TaskManager";

export const route = {
  ssr: false,
};

type WindowId = "store" | "explorer" | "control-panel" | "ai-terminal" | "task-manager";

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
  const [installedAppIds, setInstalledAppIds] = createSignal<string[]>([]);
  const [windowStack, setWindowStack] = createSignal<WindowId[]>(["store", "explorer", "control-panel", "ai-terminal", "task-manager"]);
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
    }

    if (target === "control-panel") {
      setIsControlPanelOpen(true);
      setIsControlPanelMinimized(false);
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

  const bringWindowToFront = (windowId: WindowId) => {
    setWindowStack((prev) => [...prev.filter((id) => id !== windowId), windowId]);
  };

  const getWindowZIndex = (windowId: WindowId) => {
    const stackIndex = windowStack().indexOf(windowId);
    return stackIndex === -1 ? 10 : 20 + stackIndex;
  };

  const installApp = (id: string) => {
    setInstalledAppIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

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
              <AppStore
                onClose={() => closeAppWindow("store")}
                onMinimize={() => minimizeAppWindow("store")}
                onFocus={() => bringWindowToFront("store")}
                zIndex={getWindowZIndex("store")}
                installedAppIds={installedAppIds()}
                onInstall={installApp}
              />
            )}
        {isExplorerOpen() && !isExplorerMinimized() && (
          <FileExplorer
            onClose={() => closeAppWindow("explorer")}
            onMinimize={() => minimizeAppWindow("explorer")}
            onFocus={() => bringWindowToFront("explorer")}
            zIndex={getWindowZIndex("explorer")}
          />
        )}
        {isControlPanelOpen() && !isControlPanelMinimized() && (
          <ControlPanel
            onClose={() => closeAppWindow("control-panel")}
            onMinimize={() => minimizeAppWindow("control-panel")}
            onFocus={() => bringWindowToFront("control-panel")}
            zIndex={getWindowZIndex("control-panel")}
          />
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
