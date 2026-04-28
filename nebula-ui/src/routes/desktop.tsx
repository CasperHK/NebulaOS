export default function Desktop() {
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
          "align-items": "center",
          "justify-content": "center",
          padding: "1rem",
        }}
      >
        <div style={{ "text-align": "center" }}>
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
          NebulaOS
        </span>
        <span style={{ "font-size": "0.8rem", color: "#6060a0" }}>
          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </nav>
    </div>
  );
}
