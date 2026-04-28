import { A } from "@solidjs/router";

export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        "flex-direction": "column",
        "align-items": "center",
        "justify-content": "center",
        "min-height": "100vh",
        gap: "2rem",
        padding: "2rem",
        background: "linear-gradient(135deg, #0a0a1a 0%, #0d1b3e 50%, #0a0a1a 100%)",
      }}
    >
      <div style={{ "text-align": "center" }}>
        <h1
          style={{
            "font-size": "clamp(2.5rem, 8vw, 5rem)",
            "font-weight": "700",
            background: "linear-gradient(90deg, #7b8cde, #a78bfa, #7b8cde)",
            "-webkit-background-clip": "text",
            "-webkit-text-fill-color": "transparent",
            "background-clip": "text",
            "margin-bottom": "1rem",
          }}
        >
          NebulaOS
        </h1>
        <p
          style={{
            "font-size": "1.2rem",
            color: "#a0a0c0",
            "max-width": "500px",
            "line-height": "1.6",
          }}
        >
          The next-generation AI-powered cloud desktop — blazing fast, SSR-first,
          and built for the future.
        </p>
      </div>

      <A
        href="/login"
        preload={false}
        style={{
          display: "inline-block",
          padding: "0.85rem 2.5rem",
          "border-radius": "0.5rem",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "#fff",
          "font-size": "1rem",
          "font-weight": "600",
          cursor: "pointer",
          transition: "opacity 0.2s",
          "box-shadow": "0 4px 24px rgba(99,102,241,0.4)",
        }}
      >
        Get Started →
      </A>
    </main>
  );
}
