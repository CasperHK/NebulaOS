import { createMemo, createSignal, onCleanup, onMount } from "solid-js";
import AppStore from "../apps/AppStore";
import FileExplorer from "../apps/FileExplorer";
import ControlPanel from "../apps/ControlPanel";
import AITerminal, { type AIMessage } from "../apps/AITerminal";
import TaskManager, { type AppRuntimeRow } from "../apps/TaskManager";
import TextEditor from "../apps/TextEditor";
import ImageViewer from "../apps/ImageViewer";
import Mail from "../apps/Mail";
import AppDock from "../components/AppDock";

export const route = {
  ssr: false,
};

type WindowId =
  | "store"
  | "explorer"
  | "control-panel"
  | "ai-terminal"
  | "task-manager"
  | "text-editor"
  | "image-viewer"
  | "mail";

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
  const [isTextEditorOpen, setIsTextEditorOpen] = createSignal(false);
  const [isTextEditorMinimized, setIsTextEditorMinimized] = createSignal(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = createSignal(false);
  const [isImageViewerMinimized, setIsImageViewerMinimized] = createSignal(false);
  const [isMailOpen, setIsMailOpen] = createSignal(false);
  const [isMailMinimized, setIsMailMinimized] = createSignal(false);
  const [usagePulse, setUsagePulse] = createSignal(0);
  const [installedAppIds, setInstalledAppIds] = createSignal<string[]>([]);
  const [windowStack, setWindowStack] = createSignal<WindowId[]>([
    "store",
    "explorer",
    "control-panel",
    "ai-terminal",
    "task-manager",
    "text-editor",
    "image-viewer",
    "mail",
  ]);
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
    if (["text editor", "editor", "notes", "text"].includes(key)) return "text-editor";
    if (["image viewer", "viewer", "images", "gallery", "photos"].includes(key)) return "image-viewer";
    if (["mail", "email", "inbox", "messages"].includes(key)) return "mail";
    return null;
  };

  const appLabel = (target: WindowId) => {
    if (target === "store") return "App Store";
    if (target === "explorer") return "File Explorer";
    if (target === "control-panel") return "Control Panel";
    if (target === "task-manager") return "Task Manager";
    if (target === "text-editor") return "Text Editor";
    if (target === "image-viewer") return "Image Viewer";
    if (target === "mail") return "Mail";
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

    if (target === "text-editor") {
      setIsTextEditorOpen(true);
      setIsTextEditorMinimized(false);
    }

    if (target === "image-viewer") {
      setIsImageViewerOpen(true);
      setIsImageViewerMinimized(false);
    }

    if (target === "mail") {
      setIsMailOpen(true);
      setIsMailMinimized(false);
    }

    bringWindowToFront(target);
  };

  const minimizeAppWindow = (target: WindowId) => {
    if (target === "store") setIsStoreMinimized(true);
    if (target === "explorer") setIsExplorerMinimized(true);
    if (target === "control-panel") setIsControlPanelMinimized(true);
    if (target === "ai-terminal") setIsAITerminalMinimized(true);
    if (target === "task-manager") setIsTaskManagerMinimized(true);
    if (target === "text-editor") setIsTextEditorMinimized(true);
    if (target === "image-viewer") setIsImageViewerMinimized(true);
    if (target === "mail") setIsMailMinimized(true);
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

    if (target === "text-editor") {
      setIsTextEditorOpen(false);
      setIsTextEditorMinimized(false);
    }

    if (target === "image-viewer") {
      setIsImageViewerOpen(false);
      setIsImageViewerMinimized(false);
    }

    if (target === "mail") {
      setIsMailOpen(false);
      setIsMailMinimized(false);
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
        "Commands: open <app>, minimize <app>, close <app>, focus <app>, show time. Apps: app store, explorer, control panel, ai terminal, task manager, text editor, image viewer, mail.",
      );
      return;
    }

    if (/(show|what is|current)\s+time/.test(lowered)) {
      appendAIMessage("assistant", `Current desktop time: ${timeText()}.`);
      return;
    }

    const actionMatch = lowered.match(/(open|launch|start|minimize|close|focus|show)\s+(app store|store|market|file explorer|explorer|files|control panel|settings|control|ai terminal|terminal|ai|task manager|tasks|processes|text editor|editor|notes|text|image viewer|viewer|images|gallery|photos|mail|email|inbox|messages)/);

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
      "I can only control NebulaOS windows here. Try: open app store, focus explorer, minimize control panel, close ai terminal, open task manager, open text editor, open image viewer, open mail, show time, help.",
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
    if (isTextEditorOpen()) rows.push({ appName: "Text Editor", icon: "📝", status: "Running", memoryMb: rand(11, 24, 58), cpuPercent: rand(12, 0, 5) });
    if (isImageViewerOpen()) rows.push({ appName: "Image Viewer", icon: "🖼", status: "Running", memoryMb: rand(13, 62, 130), cpuPercent: rand(14, 1, 9) });
    if (isMailOpen()) rows.push({ appName: "Mail", icon: "📧", status: "Running", memoryMb: rand(15, 45, 98), cpuPercent: rand(16, 0, 6) });
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
          onClick={() => openAppWindow("store")}
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
          onClick={() => openAppWindow("explorer")}
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
          onClick={() => openAppWindow("control-panel")}
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

        <button
          type="button"
          onClick={() => openAppWindow("text-editor")}
          style={{
            position: "absolute",
            top: "30rem",
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
          aria-label="Open Text Editor"
          title="Text Editor"
        >
          <span
            style={{
              width: "56px",
              height: "56px",
              "border-radius": "14px",
              background: "linear-gradient(135deg, #f59e0b, #ef4444)",
              display: "grid",
              "place-items": "center",
              "box-shadow": "0 8px 24px rgba(245,158,11,0.35)",
              "font-size": "1.45rem",
            }}
          >
            📝
          </span>
          <span style={{ "font-size": "0.82rem" }}>Text Editor</span>
        </button>

        <button
          type="button"
          onClick={() => openAppWindow("image-viewer")}
          style={{
            position: "absolute",
            top: "35.75rem",
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
          aria-label="Open Image Viewer"
          title="Image Viewer"
        >
          <span
            style={{
              width: "56px",
              height: "56px",
              "border-radius": "14px",
              background: "linear-gradient(135deg, #22c55e, #14b8a6)",
              display: "grid",
              "place-items": "center",
              "box-shadow": "0 8px 24px rgba(34,197,94,0.35)",
              "font-size": "1.45rem",
            }}
          >
            🖼
          </span>
          <span style={{ "font-size": "0.82rem" }}>Image Viewer</span>
        </button>

        <button
          type="button"
          onClick={() => openAppWindow("mail")}
          style={{
            position: "absolute",
            top: "41.5rem",
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
          aria-label="Open Mail"
          title="Mail"
        >
          <span
            style={{
              width: "56px",
              height: "56px",
              "border-radius": "14px",
              background: "linear-gradient(135deg, #6366f1, #06b6d4)",
              display: "grid",
              "place-items": "center",
              "box-shadow": "0 8px 24px rgba(99,102,241,0.35)",
              "font-size": "1.45rem",
            }}
          >
            📧
          </span>
          <span style={{ "font-size": "0.82rem" }}>Mail</span>
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
          <AITerminal
            onClose={() => closeAppWindow("ai-terminal")}
            onMinimize={() => minimizeAppWindow("ai-terminal")}
            onFocus={() => bringWindowToFront("ai-terminal")}
            zIndex={getWindowZIndex("ai-terminal")}
            messages={aiMessages()}
            onSubmit={runAITerminalCommand}
          />
        )}

        {isTaskManagerOpen() && !isTaskManagerMinimized() && (
          <TaskManager
            onClose={() => closeAppWindow("task-manager")}
            onMinimize={() => minimizeAppWindow("task-manager")}
            onFocus={() => bringWindowToFront("task-manager")}
            zIndex={getWindowZIndex("task-manager")}
            runtimeRows={runtimeRows()}
            totalMemoryMb={totalMemoryMb()}
            totalCpuPct={totalCpuPct()}
            onEndApp={(appName) => {
              const target = resolveTargetApp(appName.toLowerCase());
              if (target) closeAppWindow(target);
            }}
          />
        )}

        {isTextEditorOpen() && !isTextEditorMinimized() && (
          <TextEditor
            onClose={() => closeAppWindow("text-editor")}
            onMinimize={() => minimizeAppWindow("text-editor")}
            onFocus={() => bringWindowToFront("text-editor")}
            zIndex={getWindowZIndex("text-editor")}
          />
        )}

        {isImageViewerOpen() && !isImageViewerMinimized() && (
          <ImageViewer
            onClose={() => closeAppWindow("image-viewer")}
            onMinimize={() => minimizeAppWindow("image-viewer")}
            onFocus={() => bringWindowToFront("image-viewer")}
            zIndex={getWindowZIndex("image-viewer")}
          />
        )}

        {isMailOpen() && !isMailMinimized() && (
          <Mail
            onClose={() => closeAppWindow("mail")}
            onMinimize={() => minimizeAppWindow("mail")}
            onFocus={() => bringWindowToFront("mail")}
            zIndex={getWindowZIndex("mail")}
          />
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
        <AppDock
          items={[
            {
              id: "store",
              title: "App Store",
              icon: "🛍",
              isOpen: isStoreOpen(),
              isMinimized: isStoreMinimized(),
              onRestore: () => { setIsStoreMinimized(false); bringWindowToFront("store"); },
              onMinimize: () => setIsStoreMinimized(true),
            },
            {
              id: "explorer",
              title: "File Explorer",
              icon: "📁",
              isOpen: isExplorerOpen(),
              isMinimized: isExplorerMinimized(),
              onRestore: () => { setIsExplorerMinimized(false); bringWindowToFront("explorer"); },
              onMinimize: () => setIsExplorerMinimized(true),
            },
            {
              id: "control-panel",
              title: "Control Panel",
              icon: "⚙",
              isOpen: isControlPanelOpen(),
              isMinimized: isControlPanelMinimized(),
              onRestore: () => { setIsControlPanelMinimized(false); bringWindowToFront("control-panel"); },
              onMinimize: () => setIsControlPanelMinimized(true),
            },
            {
              id: "ai-terminal",
              title: "AI Terminal",
              icon: "🤖",
              isOpen: isAITerminalOpen(),
              isMinimized: isAITerminalMinimized(),
              onRestore: () => { setIsAITerminalMinimized(false); bringWindowToFront("ai-terminal"); },
              onMinimize: () => setIsAITerminalMinimized(true),
            },
            {
              id: "task-manager",
              title: "Task Manager",
              icon: "📊",
              isOpen: isTaskManagerOpen(),
              isMinimized: isTaskManagerMinimized(),
              onRestore: () => { setIsTaskManagerMinimized(false); bringWindowToFront("task-manager"); },
              onMinimize: () => setIsTaskManagerMinimized(true),
            },
            {
              id: "text-editor",
              title: "Text Editor",
              icon: "📝",
              isOpen: isTextEditorOpen(),
              isMinimized: isTextEditorMinimized(),
              onRestore: () => { setIsTextEditorMinimized(false); bringWindowToFront("text-editor"); },
              onMinimize: () => setIsTextEditorMinimized(true),
            },
            {
              id: "image-viewer",
              title: "Image Viewer",
              icon: "🖼",
              isOpen: isImageViewerOpen(),
              isMinimized: isImageViewerMinimized(),
              onRestore: () => { setIsImageViewerMinimized(false); bringWindowToFront("image-viewer"); },
              onMinimize: () => setIsImageViewerMinimized(true),
            },
            {
              id: "mail",
              title: "Mail",
              icon: "📧",
              isOpen: isMailOpen(),
              isMinimized: isMailMinimized(),
              onRestore: () => { setIsMailMinimized(false); bringWindowToFront("mail"); },
              onMinimize: () => setIsMailMinimized(true),
            },
          ]}
        />
        <span style={{ "font-size": "0.8rem", color: "#6060a0" }}>
          {timeText()}
        </span>
      </nav>
    </div>
  );
}
