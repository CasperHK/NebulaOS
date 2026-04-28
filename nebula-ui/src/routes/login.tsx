import { createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setError("");

    if (!username() || !password()) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    // Mock login: accept any non-empty credentials
    setTimeout(() => {
      setLoading(false);
      navigate("/desktop");
    }, 800);
  }

  return (
    <main
      style={{
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
        "min-height": "100vh",
        background: "linear-gradient(135deg, #0a0a1a 0%, #0d1b3e 50%, #0a0a1a 100%)",
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          "max-width": "380px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.12)",
          "border-radius": "1rem",
          padding: "2.5rem 2rem",
          "backdrop-filter": "blur(12px)",
        }}
      >
        <h2
          style={{
            "text-align": "center",
            "font-size": "1.75rem",
            "font-weight": "700",
            "margin-bottom": "0.5rem",
            background: "linear-gradient(90deg, #7b8cde, #a78bfa)",
            "-webkit-background-clip": "text",
            "-webkit-text-fill-color": "transparent",
            "background-clip": "text",
          }}
        >
          Welcome Back
        </h2>
        <p style={{ "text-align": "center", color: "#7070a0", "margin-bottom": "2rem", "font-size": "0.9rem" }}>
          Sign in to your NebulaOS account
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", "flex-direction": "column", gap: "1rem" }}>
          <div style={{ display: "flex", "flex-direction": "column", gap: "0.4rem" }}>
            <label style={{ "font-size": "0.85rem", color: "#a0a0c0" }}>Username</label>
            <input
              type="text"
              value={username()}
              onInput={(e) => setUsername(e.currentTarget.value)}
              placeholder="nebula_user"
              style={{
                padding: "0.65rem 0.85rem",
                "border-radius": "0.5rem",
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.07)",
                color: "#e0e0ff",
                "font-size": "0.95rem",
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", "flex-direction": "column", gap: "0.4rem" }}>
            <label style={{ "font-size": "0.85rem", color: "#a0a0c0" }}>Password</label>
            <input
              type="password"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              placeholder="••••••••"
              style={{
                padding: "0.65rem 0.85rem",
                "border-radius": "0.5rem",
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.07)",
                color: "#e0e0ff",
                "font-size": "0.95rem",
                outline: "none",
              }}
            />
          </div>

          {error() && (
            <p style={{ color: "#f87171", "font-size": "0.85rem", "text-align": "center" }}>
              {error()}
            </p>
          )}

          <button
            type="submit"
            disabled={loading()}
            style={{
              "margin-top": "0.5rem",
              padding: "0.75rem",
              "border-radius": "0.5rem",
              border: "none",
              background: loading()
                ? "rgba(99,102,241,0.5)"
                : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              "font-size": "1rem",
              "font-weight": "600",
              cursor: loading() ? "not-allowed" : "pointer",
              transition: "opacity 0.2s",
            }}
          >
            {loading() ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p style={{ "text-align": "center", "margin-top": "1.5rem", "font-size": "0.85rem", color: "#7070a0" }}>
          <a href="/" style={{ color: "#a78bfa" }}>← Back to Home</a>
        </p>
      </div>
    </main>
  );
}
