import { For, Show, createMemo, createSignal } from "solid-js";
import Windows from "../components/Windows";

type FileNode = {
  id: string;
  name: string;
  type: "folder" | "file";
  size?: string;
  content?: string;
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
        {
          id: "roadmap",
          name: "Nebula-Roadmap.md",
          type: "file",
          size: "128 KB",
          content:
            "# NebulaOS Roadmap\n\n## Q2 Goals\n- Improve desktop app interactions\n- Add richer file preview support\n- Polish app launch animations\n\n## Notes\nThis document is a sample preview rendered from File Explorer.",
        },
        {
          id: "meeting-notes",
          name: "Meeting-Notes.txt",
          type: "file",
          size: "42 KB",
          content:
            "Nebula Team Sync\n\n- Reviewed UI app integration\n- Confirmed File Explorer double-click behavior\n- Action: connect text files to Text Editor preview\n",
        },
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
  onOpenTextEditor?: (fileName: string, fileContent: string) => void;
};

export default function FileExplorer(props: FileExplorerProps) {
  const [currentFolderId, setCurrentFolderId] = createSignal("root");
  const [contextMenuId, setContextMenuId] = createSignal<string | null>(null);
  const [contextMenuPos, setContextMenuPos] = createSignal({ x: 0, y: 0 });
  const [copiedItemId, setCopiedItemId] = createSignal<string | null>(null);

  const isImageFile = (fileName: string): boolean => {
    const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"];
    return imageExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));
  };

  const isTextFile = (fileName: string): boolean => {
    const textExtensions = [
      ".txt",
      ".md",
      ".json",
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".css",
      ".html",
      ".yaml",
      ".yml",
      ".xml",
    ];
    return textExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));
  };

  const handleContextMenu = (e: MouseEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuId(itemId);

    let x = e.clientX + 5;
    let y = e.clientY + 5;

    if (x + 160 > window.innerWidth) {
      x = window.innerWidth - 170;
    }
    if (y + 150 > window.innerHeight) {
      y = window.innerHeight - 160;
    }

    setContextMenuPos({ x, y });
  };

  const closeMenu = () => setContextMenuId(null);

  const handleCopy = (itemId: string) => {
    setCopiedItemId(itemId);
    closeMenu();
  };

  const handlePaste = () => {
    const copiedId = copiedItemId();
    if (!copiedId) return;

    const copiedNode = findNode(FILE_TREE, copiedId);
    if (!copiedNode) return;

    const targetFolder = findNode(FILE_TREE, currentFolderId());
    if (!targetFolder || targetFolder.type !== "folder") return;

    // Create a copy of the node
    const newNode: FileNode = {
      ...copiedNode,
      id: `${copiedNode.id}-copy-${Date.now()}`,
      name: `${copiedNode.name}${copiedNode.type === "folder" ? "-copy" : ""}`,
    };

    if (!targetFolder.children) {
      targetFolder.children = [];
    }
    targetFolder.children.push(newNode);
    closeMenu();
  };

  const handleDelete = (itemId: string) => {
    const targetFolder = findNode(FILE_TREE, currentFolderId());
    if (!targetFolder || !targetFolder.children) return;

    const index = targetFolder.children.findIndex((child) => child.id === itemId);
    if (index !== -1) {
      targetFolder.children.splice(index, 1);
    }
    closeMenu();
  };

  const handleFileDoubleClick = (file: FileNode) => {
    if (isImageFile(file.name) && props.onOpenImageViewer) {
      props.onOpenImageViewer(file.name, file.size ?? "Unknown");
      return;
    }

    if (isTextFile(file.name) && props.onOpenTextEditor) {
      const previewContent =
        file.content ?? `${file.name}\n\nNo preview content is available for this file yet.`;
      props.onOpenTextEditor(file.name, previewContent);
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
                  onContextMenu={(e) => handleContextMenu(e, folder.id)}
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
                  onContextMenu={(e) => handleContextMenu(e, file.id)}
                  style={{
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.03)",
                    "border-radius": "10px",
                    padding: "0.65rem 0.75rem",
                    display: "flex",
                    "align-items": "center",
                    "justify-content": "space-between",
                    color: "#ecf6ff",
                    cursor: isImageFile(file.name) || isTextFile(file.name) ? "pointer" : "default",
                    transition: "background 120ms ease",
                  }}
                  onMouseOver={(e) => {
                    if (isImageFile(file.name) || isTextFile(file.name)) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  }}
                  title={
                    isImageFile(file.name) || isTextFile(file.name)
                      ? `Double-click to open ${file.name}`
                      : file.name
                  }
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

        <Show when={contextMenuId() !== null}>
          <div
            onClick={closeMenu}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              "z-index": 998,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: contextMenuPos().y + "px",
              left: contextMenuPos().x + "px",
              "z-index": 999,
              background: "rgba(20, 20, 30, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              "border-radius": "8px",
              "box-shadow": "0 8px 32px rgba(0, 0, 0, 0.3)",
              "backdrop-filter": "blur(8px)",
              "min-width": "160px",
              padding: "4px 0",
            }}
          >
            <Show when={contextMenuId() !== null}>
              {(() => {
                const node = findNode(FILE_TREE, contextMenuId()!);
                return (
                  <>
                    {node?.type === "file" && isTextFile(node.name) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (node.type === "file" && isTextFile(node.name)) {
                            const previewContent =
                              node.content ?? `${node.name}\n\nNo preview content available.`;
                            props.onOpenTextEditor?.(node.name, previewContent);
                          }
                          closeMenu();
                        }}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "8px 16px",
                          background: "transparent",
                          border: "none",
                          color: "#e5e6ff",
                          "text-align": "left",
                          cursor: "pointer",
                          "font-size": "0.9rem",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "transparent";
                        }}
                      >
                        📖 Open
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        handleCopy(contextMenuId()!);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "8px 16px",
                        background: "transparent",
                        border: "none",
                        color: "#e5e6ff",
                        "text-align": "left",
                        cursor: "pointer",
                        "font-size": "0.9rem",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}
                    >
                      📋 Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handlePaste();
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "8px 16px",
                        background: "transparent",
                        border: "none",
                        color: copiedItemId() ? "#e5e6ff" : "#7a7a8f",
                        "text-align": "left",
                        cursor: copiedItemId() ? "pointer" : "not-allowed",
                        "font-size": "0.9rem",
                        transition: "background 0.1s",
                        opacity: copiedItemId() ? "1" : "0.5",
                      }}
                      disabled={!copiedItemId()}
                      onMouseEnter={(e) => {
                        if (copiedItemId()) {
                          (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.1)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}
                    >
                      📌 Paste
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleDelete(contextMenuId()!);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "8px 16px",
                        background: "transparent",
                        border: "none",
                        color: "#ff6b6b",
                        "text-align": "left",
                        cursor: "pointer",
                        "font-size": "0.9rem",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(255, 107, 107, 0.2)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </>
                );
              })()}
            </Show>
          </div>
        </Show>
      </div>
    </Windows>
  );
}
