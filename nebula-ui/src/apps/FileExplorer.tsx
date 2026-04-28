import { For, createMemo, createSignal } from "solid-js";
import Windows from "../components/Windows";

type FileNode = {
  id: string;
  name: string;
  type: "folder" | "file";
  size?: string;
  children?: FileNode[];
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

type FileExplorerProps = {
  onClose: () => void;
  onMinimize: () => void;
  onFocus: () => void;
  zIndex: number;
  onOpenImageViewer?: (fileName: string, fileSize: string) => void;
};

export default function FileExplorer(props: FileExplorerProps) {
  const [currentFolderId, setCurrentFolderId] = createSignal("root");

  const isImageFile = (fileName: string): boolean => {
    const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"];
    return imageExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));
  };

  const handleFileDoubleClick = (file: FileNode) => {
    if (isImageFile(file.name) && props.onOpenImageViewer) {
      props.onOpenImageViewer(file.name, file.size ?? "Unknown");
    }
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

  return (
    <Windows
      title="Nebula File Explorer"
      icon="📁"
      onClose={props.onClose}
      onMinimize={props.onMinimize}
      onFocus={props.onFocus}
      zIndex={props.zIndex}
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
                <button
                  type="button"
                  onDblClick={() => handleFileDoubleClick(file)}
                  style={{
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.03)",
                    "border-radius": "10px",
                    padding: "0.65rem 0.75rem",
                    display: "flex",
                    "align-items": "center",
                    "justify-content": "space-between",
                    color: "#ecf6ff",
                    cursor: isImageFile(file.name) ? "pointer" : "default",
                    transition: "background 120ms ease",
                  }}
                  onMouseOver={(e) => {
                    if (isImageFile(file.name)) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  }}
                  title={isImageFile(file.name) ? `Double-click to open ${file.name}` : file.name}
                >
                  <span>📄 {file.name}</span>
                  <span style={{ color: "#8eb8d8", "font-size": "0.78rem" }}>{file.size ?? "-"}</span>
                </button>
              )}
            </For>

            {folderItems().length === 0 && fileItems().length === 0 && (
              <p style={{ color: "#7fa6c4", "font-size": "0.86rem" }}>This folder is empty.</p>
            )}
          </div>
        </section>
      </div>
    </Windows>
  );
}
