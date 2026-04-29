import { createMemo, createSignal, onCleanup, onMount } from "solid-js";
import AppStore from "../apps/AppStore";
import FileExplorer from "../apps/FileExplorer";
import ControlPanel from "../apps/ControlPanel";
import AITerminal, { type AIMessage } from "../apps/AITerminal";
import TaskManager, { type AppRuntimeRow } from "../apps/TaskManager";
import TextEditor from "../apps/TextEditor";
import ImageViewer from "../apps/ImageViewer";
import Mail from "../apps/Mail";
import MusicPlayer from "../apps/MusicPlayer";
import Calculator from "../apps/Calculator";
import Wallpapers from "../apps/Wallpapers";
import Model3DViewer from "../apps/3DModelViewer";
import Gallery from "../apps/Gallery";
import Browser from "../apps/Browser";
import Map from "../apps/Map";
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
  | "mail"
  | "music"
  | "calculator"
  | "wallpapers"
  | "model-3d"
  | "gallery"
  | "browser"
  | "map";

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
  const [textEditorTitle, setTextEditorTitle] = createSignal("Untitled.txt");
  const [textEditorContent, setTextEditorContent] = createSignal(
    "# Nebula Notes\n\nWelcome to Text Editor.\n\n- This is an in-memory document.\n- Use New to start over.\n- Use Insert Sample to restore this text.\n",
  );
  const [isImageViewerOpen, setIsImageViewerOpen] = createSignal(false);
  const [isImageViewerMinimized, setIsImageViewerMinimized] = createSignal(false);
  const [isMailOpen, setIsMailOpen] = createSignal(false);
  const [isMailMinimized, setIsMailMinimized] = createSignal(false);
  const [isMusicOpen, setIsMusicOpen] = createSignal(false);
  const [isMusicMinimized, setIsMusicMinimized] = createSignal(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = createSignal(false);
  const [isCalculatorMinimized, setIsCalculatorMinimized] = createSignal(false);
  const [isWallpapersOpen, setIsWallpapersOpen] = createSignal(false);
  const [isWallpapersMinimized, setIsWallpapersMinimized] = createSignal(false);
  const [isModel3DOpen, setIsModel3DOpen] = createSignal(false);
  const [isModel3DMinimized, setIsModel3DMinimized] = createSignal(false);
  const [isGalleryOpen, setIsGalleryOpen] = createSignal(false);
  const [isGalleryMinimized, setIsGalleryMinimized] = createSignal(false);
  const [isBrowserOpen, setIsBrowserOpen] = createSignal(false);
  const [isBrowserMinimized, setIsBrowserMinimized] = createSignal(false);
  const [isMapOpen, setIsMapOpen] = createSignal(false);
  const [isMapMinimized, setIsMapMinimized] = createSignal(false);
  const [desktopBackground, setDesktopBackground] = createSignal(
    "linear-gradient(135deg, #0a0a1a 0%, #0d1b3e 60%, #1a0a2e 100%)",
  );
  const [usagePulse, setUsagePulse] = createSignal(0);
  const [installedAppIds, setInstalledAppIds] = createSignal<string[]>([]);
  const [pinnedAppIds, setPinnedAppIds] = createSignal<string[]>([]);
  const [windowStack, setWindowStack] = createSignal<WindowId[]>([
    "store",
    "explorer",
    "control-panel",
    "ai-terminal",
    "task-manager",
    "text-editor",
    "image-viewer",
    "mail",
    "music",
    "calculator",
    "wallpapers",
    "model-3d",
    "gallery",
    "browser",
    "map",
  ]);
  const [aiMessages, setAiMessages] = createSignal<AIMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text:
        "AI assistant ready. AI Terminal is a standalone app, and AI Side Chat is available inside window headers. Try: open ai terminal, minimize explorer, close control panel, show time, help.",
    },
  ]);

  const emitAIState = (messages: AIMessage[] = aiMessages()) => {
    if (typeof window === "undefined") {
      return;
    }

    window.dispatchEvent(new CustomEvent("nebula:ai-state", { detail: { messages } }));
  };

  const appendAIMessage = (role: AIMessage["role"], text: string) => {
    setAiMessages((prev) => {
      const next = [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          role,
          text,
        },
      ];

      emitAIState(next);
      return next;
    });
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
    if (["music", "music player", "player", "audio"].includes(key)) return "music";
    if (["calculator", "calc", "math", "compute"].includes(key)) return "calculator";
    if (["wallpapers", "wallpaper", "background", "theme"].includes(key)) return "wallpapers";
    if (["3d", "3d model", "model viewer", "3d viewer"].includes(key)) return "model-3d";
    if (["gallery", "photos", "photo gallery"].includes(key)) return "gallery";
    if (["browser", "web", "internet", "web browser"].includes(key)) return "browser";
    if (["map", "maps", "navigation", "location"].includes(key)) return "map";
    return null;
  };

  const appLabel = (target: WindowId) => {
    if (target === "store") return "App Store";
    if (target === "explorer") return "File Explorer";
    if (target === "control-panel") return "Control Panel";
    if (target === "ai-terminal") return "AI Terminal";
    if (target === "task-manager") return "Task Manager";
    if (target === "text-editor") return "Text Editor";
    if (target === "image-viewer") return "Image Viewer";
    if (target === "mail") return "Mail";
    if (target === "music") return "Music Player";
    if (target === "calculator") return "Calculator";
    if (target === "wallpapers") return "Wallpapers";
    if (target === "model-3d") return "3D Model Viewer";
    if (target === "gallery") return "Gallery";
    if (target === "browser") return "Browser";
    if (target === "map") return "Map";
    return "App";
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

    if (target === "music") {
      setIsMusicOpen(true);
      setIsMusicMinimized(false);
    }

    if (target === "calculator") {
      setIsCalculatorOpen(true);
      setIsCalculatorMinimized(false);
    }

    if (target === "wallpapers") {
      setIsWallpapersOpen(true);
      setIsWallpapersMinimized(false);
    }

    if (target === "model-3d") {
      setIsModel3DOpen(true);
      setIsModel3DMinimized(false);
    }

    if (target === "gallery") {
      setIsGalleryOpen(true);
      setIsGalleryMinimized(false);
    }

    if (target === "browser") {
      setIsBrowserOpen(true);
      setIsBrowserMinimized(false);
    }

    if (target === "map") {
      setIsMapOpen(true);
      setIsMapMinimized(false);
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
    if (target === "music") setIsMusicMinimized(true);
    if (target === "calculator") setIsCalculatorMinimized(true);
    if (target === "wallpapers") setIsWallpapersMinimized(true);
    if (target === "model-3d") setIsModel3DMinimized(true);
    if (target === "gallery") setIsGalleryMinimized(true);
    if (target === "browser") setIsBrowserMinimized(true);
    if (target === "map") setIsMapMinimized(true);
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

    if (target === "music") {
      setIsMusicOpen(false);
      setIsMusicMinimized(false);
    }

    if (target === "calculator") {
      setIsCalculatorOpen(false);
      setIsCalculatorMinimized(false);
    }

    if (target === "wallpapers") {
      setIsWallpapersOpen(false);
      setIsWallpapersMinimized(false);
    }

    if (target === "model-3d") {
      setIsModel3DOpen(false);
      setIsModel3DMinimized(false);
    }

    if (target === "gallery") {
      setIsGalleryOpen(false);
      setIsGalleryMinimized(false);
    }

    if (target === "browser") {
      setIsBrowserOpen(false);
      setIsBrowserMinimized(false);
    }

    if (target === "map") {
      setIsMapOpen(false);
      setIsMapMinimized(false);
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
        "Blocked: this AI assistant is sandboxed to NebulaOS app controls only. I cannot execute real OS/system commands.",
      );
      return;
    }

    if (/^help$|^commands$|what can you do|capabilities/.test(lowered)) {
      appendAIMessage(
        "assistant",
        "Commands: open <app>, minimize <app>, close <app>, focus <app>, show time. Apps: app store, explorer, control panel, ai terminal, task manager, text editor, image viewer, mail, music player, calculator, wallpapers, 3d model viewer, gallery, browser, map.",
      );
      return;
    }

    if (/(show|what is|current)\s+time/.test(lowered)) {
      appendAIMessage("assistant", `Current desktop time: ${timeText()}.`);
      return;
    }

    const actionMatch = lowered.match(/(open|launch|start|minimize|close|focus|show)\s+(app store|store|market|file explorer|explorer|files|control panel|settings|control|ai terminal|terminal|ai|task manager|tasks|processes|text editor|editor|notes|text|image viewer|viewer|images|gallery|photos|photo gallery|mail|email|inbox|messages|music player|music|player|audio|calculator|calc|math|compute|wallpapers|wallpaper|background|theme|3d|3d model|model viewer|3d viewer|browser|web|internet|web browser|map|maps|navigation|location)/);

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
      "I can only control NebulaOS windows here. Try: open app store, focus explorer, minimize control panel, close ai terminal, open task manager, open text editor, open image viewer, open mail, open music player, open calculator, open wallpapers, open 3d model viewer, open gallery, open browser, open map, show time, help.",
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
    if (isMusicOpen()) rows.push({ appName: "Music Player", icon: "🎵", status: "Running", memoryMb: rand(17, 50, 110), cpuPercent: rand(18, 0, 7) });
    if (isCalculatorOpen()) rows.push({ appName: "Calculator", icon: "🧮", status: "Running", memoryMb: rand(19, 22, 54), cpuPercent: rand(20, 0, 4) });
    if (isWallpapersOpen()) rows.push({ appName: "Wallpapers", icon: "🖼", status: "Running", memoryMb: rand(21, 28, 66), cpuPercent: rand(22, 0, 3) });
    if (isModel3DOpen()) rows.push({ appName: "3D Model Viewer", icon: "3D", status: "Running", memoryMb: rand(23, 120, 240), cpuPercent: rand(24, 2, 16) });
    if (isGalleryOpen()) rows.push({ appName: "Gallery", icon: "🖼", status: "Running", memoryMb: rand(25, 48, 104), cpuPercent: rand(26, 0, 6) });
    if (isBrowserOpen()) rows.push({ appName: "Browser", icon: "🌐", status: "Running", memoryMb: rand(27, 70, 150), cpuPercent: rand(28, 1, 10) });
    if (isMapOpen()) rows.push({ appName: "Map", icon: "🗺", status: "Running", memoryMb: rand(29, 58, 128), cpuPercent: rand(30, 0, 7) });
    return rows;
  });

  const applyDesktopBackground = (background: string) => {
    setDesktopBackground(background);

    try {
      localStorage.setItem("nebula:desktopBackground", background);
    } catch (e) {
      console.error("Failed to save desktop wallpaper:", e);
    }
  };

  const totalMemoryMb = createMemo(() => runtimeRows().reduce((sum, r) => sum + r.memoryMb, 0));
  const totalCpuPct = createMemo(() => runtimeRows().reduce((sum, r) => sum + r.cpuPercent, 0));

  const savePinnedApps = (ids: string[]) => {
    try {
      localStorage.setItem("nebula:pinnedApps", JSON.stringify(ids));
    } catch (e) {
      console.error("Failed to save pinned apps:", e);
    }
  };

  onMount(() => {
    // Load pinned apps from localStorage
    try {
      const saved = localStorage.getItem("nebula:pinnedApps");
      if (saved) {
        setPinnedAppIds(JSON.parse(saved));
      }

      const savedBackground = localStorage.getItem("nebula:desktopBackground");
      if (savedBackground) {
        setDesktopBackground(savedBackground);
      }
    } catch (e) {
      console.error("Failed to load pinned apps:", e);
    }

    const formatTime = () =>
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const handleAICommand = (event: Event) => {
      const custom = event as CustomEvent<{ input?: string }>;

      if (typeof custom.detail?.input === "string") {
        runAITerminalCommand(custom.detail.input);
      }
    };

    const handleAIStateRequest = () => {
      emitAIState();
    };

    window.addEventListener("nebula:ai-command", handleAICommand);
    window.addEventListener("nebula:ai-state-request", handleAIStateRequest);
    emitAIState();

    setTimeText(formatTime());
    const timer = setInterval(() => setTimeText(formatTime()), 30_000);
    const usageTimer = setInterval(() => setUsagePulse((p) => (p + 1) % 1_000_000), 2500);
    onCleanup(() => {
      clearInterval(timer);
      clearInterval(usageTimer);
      window.removeEventListener("nebula:ai-command", handleAICommand);
      window.removeEventListener("nebula:ai-state-request", handleAIStateRequest);
    });
  });

  return (
    <div
      style={{
        "min-height": "100vh",
        background: desktopBackground(),
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
        <div
          style={{
            position: "absolute",
            top: "1.25rem",
            left: "1.25rem",
            right: "1.25rem",
            bottom: "1.25rem",
            display: "flex",
            "flex-flow": "column wrap",
            "align-content": "flex-start",
            gap: "1.05rem 0.8rem",
            "max-height": "100%",
            "pointer-events": "none",
          }}
        >
          <button
            type="button"
            onClick={() => openAppWindow("store")}
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

          <button
            type="button"
            onClick={() => openAppWindow("music")}
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
            aria-label="Open Music Player"
            title="Music Player"
          >
            <span
              style={{
                width: "56px",
                height: "56px",
                "border-radius": "14px",
                background: "linear-gradient(135deg, #22d3ee, #0ea5e9)",
                display: "grid",
                "place-items": "center",
                "box-shadow": "0 8px 24px rgba(34,211,238,0.35)",
                "font-size": "1.45rem",
              }}
            >
              🎵
            </span>
            <span style={{ "font-size": "0.82rem" }}>Music</span>
          </button>

          <button
            type="button"
            onClick={() => openAppWindow("calculator")}
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
            aria-label="Open Calculator"
            title="Calculator"
          >
            <span
              style={{
                width: "56px",
                height: "56px",
                "border-radius": "14px",
                background: "linear-gradient(135deg, #f59e0b, #f97316)",
                display: "grid",
                "place-items": "center",
                "box-shadow": "0 8px 24px rgba(249,115,22,0.35)",
                "font-size": "1.45rem",
              }}
            >
              🧮
            </span>
            <span style={{ "font-size": "0.82rem" }}>Calculator</span>
          </button>

          <button
            type="button"
            onClick={() => openAppWindow("wallpapers")}
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
            aria-label="Open Wallpapers"
            title="Wallpapers"
          >
            <span
              style={{
                width: "56px",
                height: "56px",
                "border-radius": "14px",
                background: "linear-gradient(135deg, #0ea5e9, #14b8a6)",
                display: "grid",
                "place-items": "center",
                "box-shadow": "0 8px 24px rgba(20,184,166,0.35)",
                "font-size": "1.45rem",
              }}
            >
              🌄
            </span>
            <span style={{ "font-size": "0.82rem" }}>Wallpapers</span>
          </button>

          <button
            type="button"
            onClick={() => openAppWindow("model-3d")}
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
            aria-label="Open 3D Model Viewer"
            title="3D Model Viewer"
          >
            <span
              style={{
                width: "56px",
                height: "56px",
                "border-radius": "14px",
                background: "linear-gradient(135deg, #4338ca, #0ea5e9)",
                display: "grid",
                "place-items": "center",
                "box-shadow": "0 8px 24px rgba(67,56,202,0.35)",
                "font-size": "1rem",
                "font-weight": "800",
              }}
            >
              3D
            </span>
            <span style={{ "font-size": "0.82rem" }}>3D Viewer</span>
          </button>

          <button
            type="button"
            onClick={() => openAppWindow("gallery")}
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
            aria-label="Open Gallery"
            title="Gallery"
          >
            <span
              style={{
                width: "56px",
                height: "56px",
                "border-radius": "14px",
                background: "linear-gradient(135deg, #22c55e, #06b6d4)",
                display: "grid",
                "place-items": "center",
                "box-shadow": "0 8px 24px rgba(34,197,94,0.35)",
                "font-size": "1.45rem",
              }}
            >
              🖼
            </span>
            <span style={{ "font-size": "0.82rem" }}>Gallery</span>
          </button>

          <button
            type="button"
            onClick={() => openAppWindow("browser")}
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
            aria-label="Open Browser"
            title="Browser"
          >
            <span
              style={{
                width: "56px",
                height: "56px",
                "border-radius": "14px",
                background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
                display: "grid",
                "place-items": "center",
                "box-shadow": "0 8px 24px rgba(37,99,235,0.35)",
                "font-size": "1.45rem",
              }}
            >
              🌐
            </span>
            <span style={{ "font-size": "0.82rem" }}>Browser</span>
          </button>

          <button
            type="button"
            onClick={() => openAppWindow("map")}
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
            aria-label="Open Map"
            title="Map"
          >
            <span
              style={{
                width: "56px",
                height: "56px",
                "border-radius": "14px",
                background: "linear-gradient(135deg, #16a34a, #0ea5e9)",
                display: "grid",
                "place-items": "center",
                "box-shadow": "0 8px 24px rgba(22,163,74,0.35)",
                "font-size": "1.45rem",
              }}
            >
              🗺
            </span>
            <span style={{ "font-size": "0.82rem" }}>Map</span>
          </button>
        </div>

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
            onOpenImageViewer={() => {
              setIsImageViewerOpen(true);
              setIsImageViewerMinimized(false);
              bringWindowToFront("image-viewer");
            }}
            onOpenTextEditor={(fileName, fileContent) => {
              setTextEditorTitle(fileName);
              setTextEditorContent(fileContent);
              setIsTextEditorOpen(true);
              setIsTextEditorMinimized(false);
              bringWindowToFront("text-editor");
            }}
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
            initialTitle={textEditorTitle()}
            initialContent={textEditorContent()}
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

        {isMusicOpen() && !isMusicMinimized() && (
          <MusicPlayer
            onClose={() => closeAppWindow("music")}
            onMinimize={() => minimizeAppWindow("music")}
            onFocus={() => bringWindowToFront("music")}
            zIndex={getWindowZIndex("music")}
          />
        )}

        {isCalculatorOpen() && !isCalculatorMinimized() && (
          <Calculator
            onClose={() => closeAppWindow("calculator")}
            onMinimize={() => minimizeAppWindow("calculator")}
            onFocus={() => bringWindowToFront("calculator")}
            zIndex={getWindowZIndex("calculator")}
          />
        )}

        {isWallpapersOpen() && !isWallpapersMinimized() && (
          <Wallpapers
            onClose={() => closeAppWindow("wallpapers")}
            onMinimize={() => minimizeAppWindow("wallpapers")}
            onFocus={() => bringWindowToFront("wallpapers")}
            zIndex={getWindowZIndex("wallpapers")}
            currentBackground={desktopBackground()}
            onApply={applyDesktopBackground}
          />
        )}

        {isModel3DOpen() && !isModel3DMinimized() && (
          <Model3DViewer
            onClose={() => closeAppWindow("model-3d")}
            onMinimize={() => minimizeAppWindow("model-3d")}
            onFocus={() => bringWindowToFront("model-3d")}
            zIndex={getWindowZIndex("model-3d")}
          />
        )}

        {isGalleryOpen() && !isGalleryMinimized() && (
          <Gallery
            onClose={() => closeAppWindow("gallery")}
            onMinimize={() => minimizeAppWindow("gallery")}
            onFocus={() => bringWindowToFront("gallery")}
            zIndex={getWindowZIndex("gallery")}
          />
        )}

        {isBrowserOpen() && !isBrowserMinimized() && (
          <Browser
            onClose={() => closeAppWindow("browser")}
            onMinimize={() => minimizeAppWindow("browser")}
            onFocus={() => bringWindowToFront("browser")}
            zIndex={getWindowZIndex("browser")}
          />
        )}

        {isMapOpen() && !isMapMinimized() && (
          <Map
            onClose={() => closeAppWindow("map")}
            onMinimize={() => minimizeAppWindow("map")}
            onFocus={() => bringWindowToFront("map")}
            zIndex={getWindowZIndex("map")}
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
              isPinned: pinnedAppIds().includes("store"),
              onRestore: () => openAppWindow("store"),
              onMinimize: () => setIsStoreMinimized(true),
              onPin: () => { const next = [...pinnedAppIds(), "store"]; setPinnedAppIds(next); savePinnedApps(next); },
              onUnpin: () => { const next = pinnedAppIds().filter((id) => id !== "store"); setPinnedAppIds(next); savePinnedApps(next); },
            },
            {
              id: "explorer",
              title: "File Explorer",
              icon: "📁",
              isOpen: isExplorerOpen(),
              isMinimized: isExplorerMinimized(),
              isPinned: pinnedAppIds().includes("explorer"),
              onRestore: () => openAppWindow("explorer"),
              onMinimize: () => setIsExplorerMinimized(true),
              onPin: () => { const next = [...pinnedAppIds(), "explorer"]; setPinnedAppIds(next); savePinnedApps(next); },
              onUnpin: () => { const next = pinnedAppIds().filter((id) => id !== "explorer"); setPinnedAppIds(next); savePinnedApps(next); },
            },
            {
              id: "control-panel",
              title: "Control Panel",
              icon: "⚙",
              isOpen: isControlPanelOpen(),
              isMinimized: isControlPanelMinimized(),
              isPinned: pinnedAppIds().includes("control-panel"),
              onRestore: () => openAppWindow("control-panel"),
              onMinimize: () => setIsControlPanelMinimized(true),
              onPin: () => { const next = [...pinnedAppIds(), "control-panel"]; setPinnedAppIds(next); savePinnedApps(next); },
              onUnpin: () => { const next = pinnedAppIds().filter((id) => id !== "control-panel"); setPinnedAppIds(next); savePinnedApps(next); },
            },
            {
              id: "ai-terminal",
              title: "AI Terminal",
              icon: "🤖",
              isOpen: isAITerminalOpen(),
              isMinimized: isAITerminalMinimized(),
              isPinned: pinnedAppIds().includes("ai-terminal"),
              onRestore: () => openAppWindow("ai-terminal"),
              onMinimize: () => setIsAITerminalMinimized(true),
              onPin: () => { const next = [...pinnedAppIds(), "ai-terminal"]; setPinnedAppIds(next); savePinnedApps(next); },
              onUnpin: () => { const next = pinnedAppIds().filter((id) => id !== "ai-terminal"); setPinnedAppIds(next); savePinnedApps(next); },
            },
            {
              id: "task-manager",
              title: "Task Manager",
              icon: "📊",
              isOpen: isTaskManagerOpen(),
              isMinimized: isTaskManagerMinimized(),
              isPinned: pinnedAppIds().includes("task-manager"),
              onRestore: () => openAppWindow("task-manager"),
              onMinimize: () => setIsTaskManagerMinimized(true),
              onPin: () => { const next = [...pinnedAppIds(), "task-manager"]; setPinnedAppIds(next); savePinnedApps(next); },
              onUnpin: () => { const next = pinnedAppIds().filter((id) => id !== "task-manager"); setPinnedAppIds(next); savePinnedApps(next); },
            },
            {
              id: "text-editor",
              title: "Text Editor",
              icon: "📝",
              isOpen: isTextEditorOpen(),
              isMinimized: isTextEditorMinimized(),
              isPinned: pinnedAppIds().includes("text-editor"),
              onRestore: () => openAppWindow("text-editor"),
              onMinimize: () => setIsTextEditorMinimized(true),
              onPin: () => { const next = [...pinnedAppIds(), "text-editor"]; setPinnedAppIds(next); savePinnedApps(next); },
              onUnpin: () => { const next = pinnedAppIds().filter((id) => id !== "text-editor"); setPinnedAppIds(next); savePinnedApps(next); },
            },
            {
              id: "image-viewer",
              title: "Image Viewer",
              icon: "🖼",
              isOpen: isImageViewerOpen(),
              isMinimized: isImageViewerMinimized(),
              isPinned: pinnedAppIds().includes("image-viewer"),
              onRestore: () => openAppWindow("image-viewer"),
              onMinimize: () => setIsImageViewerMinimized(true),
              onPin: () => { const next = [...pinnedAppIds(), "image-viewer"]; setPinnedAppIds(next); savePinnedApps(next); },
              onUnpin: () => { const next = pinnedAppIds().filter((id) => id !== "image-viewer"); setPinnedAppIds(next); savePinnedApps(next); },
            },
            {
              id: "mail",
              title: "Mail",
              icon: "📧",
              isOpen: isMailOpen(),
              isMinimized: isMailMinimized(),
              isPinned: pinnedAppIds().includes("mail"),
              onRestore: () => openAppWindow("mail"),
              onMinimize: () => setIsMailMinimized(true),
              onPin: () => { const next = [...pinnedAppIds(), "mail"]; setPinnedAppIds(next); savePinnedApps(next); },
              onUnpin: () => { const next = pinnedAppIds().filter((id) => id !== "mail"); setPinnedAppIds(next); savePinnedApps(next); },
            },
            {
              id: "music",
              title: "Music Player",
              icon: "🎵",
              isOpen: isMusicOpen(),
              isMinimized: isMusicMinimized(),
              isPinned: pinnedAppIds().includes("music"),
              onRestore: () => openAppWindow("music"),
              onMinimize: () => setIsMusicMinimized(true),
              onPin: () => { const next = [...pinnedAppIds(), "music"]; setPinnedAppIds(next); savePinnedApps(next); },
              onUnpin: () => { const next = pinnedAppIds().filter((id) => id !== "music"); setPinnedAppIds(next); savePinnedApps(next); },
            },
            {
              id: "calculator",
              title: "Calculator",
              icon: "🧮",
              isOpen: isCalculatorOpen(),
              isMinimized: isCalculatorMinimized(),
              isPinned: pinnedAppIds().includes("calculator"),
              onRestore: () => openAppWindow("calculator"),
              onMinimize: () => setIsCalculatorMinimized(true),
              onPin: () => { const next = [...pinnedAppIds(), "calculator"]; setPinnedAppIds(next); savePinnedApps(next); },
              onUnpin: () => { const next = pinnedAppIds().filter((id) => id !== "calculator"); setPinnedAppIds(next); savePinnedApps(next); },
            },
            {
              id: "wallpapers",
              title: "Wallpapers",
              icon: "🌄",
              isOpen: isWallpapersOpen(),
              isMinimized: isWallpapersMinimized(),
              isPinned: pinnedAppIds().includes("wallpapers"),
              onRestore: () => openAppWindow("wallpapers"),
              onMinimize: () => setIsWallpapersMinimized(true),
              onPin: () => { const next = [...pinnedAppIds(), "wallpapers"]; setPinnedAppIds(next); savePinnedApps(next); },
              onUnpin: () => { const next = pinnedAppIds().filter((id) => id !== "wallpapers"); setPinnedAppIds(next); savePinnedApps(next); },
            },
            {
              id: "model-3d",
              title: "3D Model Viewer",
              icon: "3D",
              isOpen: isModel3DOpen(),
              isMinimized: isModel3DMinimized(),
              isPinned: pinnedAppIds().includes("model-3d"),
              onRestore: () => openAppWindow("model-3d"),
              onMinimize: () => setIsModel3DMinimized(true),
              onPin: () => { const next = [...pinnedAppIds(), "model-3d"]; setPinnedAppIds(next); savePinnedApps(next); },
              onUnpin: () => { const next = pinnedAppIds().filter((id) => id !== "model-3d"); setPinnedAppIds(next); savePinnedApps(next); },
            },
            {
              id: "gallery",
              title: "Gallery",
              icon: "🖼",
              isOpen: isGalleryOpen(),
              isMinimized: isGalleryMinimized(),
              isPinned: pinnedAppIds().includes("gallery"),
              onRestore: () => openAppWindow("gallery"),
              onMinimize: () => setIsGalleryMinimized(true),
              onPin: () => { const next = [...pinnedAppIds(), "gallery"]; setPinnedAppIds(next); savePinnedApps(next); },
              onUnpin: () => { const next = pinnedAppIds().filter((id) => id !== "gallery"); setPinnedAppIds(next); savePinnedApps(next); },
            },
            {
              id: "browser",
              title: "Browser",
              icon: "🌐",
              isOpen: isBrowserOpen(),
              isMinimized: isBrowserMinimized(),
              isPinned: pinnedAppIds().includes("browser"),
              onRestore: () => openAppWindow("browser"),
              onMinimize: () => setIsBrowserMinimized(true),
              onPin: () => { const next = [...pinnedAppIds(), "browser"]; setPinnedAppIds(next); savePinnedApps(next); },
              onUnpin: () => { const next = pinnedAppIds().filter((id) => id !== "browser"); setPinnedAppIds(next); savePinnedApps(next); },
            },
            {
              id: "map",
              title: "Map",
              icon: "🗺",
              isOpen: isMapOpen(),
              isMinimized: isMapMinimized(),
              isPinned: pinnedAppIds().includes("map"),
              onRestore: () => openAppWindow("map"),
              onMinimize: () => setIsMapMinimized(true),
              onPin: () => { const next = [...pinnedAppIds(), "map"]; setPinnedAppIds(next); savePinnedApps(next); },
              onUnpin: () => { const next = pinnedAppIds().filter((id) => id !== "map"); setPinnedAppIds(next); savePinnedApps(next); },
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
