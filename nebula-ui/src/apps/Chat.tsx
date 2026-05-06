import { For, createSignal } from "solid-js";
import type { JSX } from "solid-js";
import Windows from "../components/Windows";

type ChatProps = {
  onClose: () => void;
  onMinimize: () => void;
  onFocus: () => void;
  zIndex: number;
};

type Message = {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: string;
};

export default function Chat(props: ChatProps) {
  const [messages, setMessages] = createSignal<Message[]>([]);
  const [input, setInput] = createSignal("");

  // Initialize with a welcome message
  const initMessages = () => {
    setMessages([
      {
        id: 1,
        text: "Hello! I'm NebulaOS Chat Assistant. How can I help you today?",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  // Add welcome message on mount
  // In SolidJS, we can use an effect or just initialize directly
  // For simplicity, we'll initialize when the component first renders
  // but we need to avoid re-initializing on every render
  const [initialized, setInitialized] = createSignal(false);
  
  if (!initialized()) {
    initMessages();
    setInitialized(true);
  }

  const addMessage = (text: string, sender: "user" | "bot") => {
    const newMessage: Message = {
      id: Date.now(),
      text,
      sender,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMessage]);
    
    // Auto-respond if it's a user message
    if (sender === "user") {
      setTimeout(() => {
        const botResponse = generateBotResponse(text);
        addMessage(botResponse, "bot");
      }, 500 + Math.random() * 1000); // Simulate thinking time
    }
  };

  const generateBotResponse = (input: string): string => {
    const lowerInput = input.toLowerCase().trim();
    
    if (lowerInput.includes("hello") || lowerInput.includes("hi")) {
      return "Hello! How can I assist you today?";
    }
    
    if (lowerInput.includes("help")) {
      return "I can help you with general questions, provide information, or just chat. Try asking me about the weather, news, or anything else!";
    }
    
    if (lowerInput.includes("weather")) {
      return "I'm not connected to real weather data, but I hope it's nice where you are! ☀️";
    }
    
    if (lowerInput.includes("time")) {
      return `The current time is ${new Date().toLocaleTimeString()}.`;
    }
    
    if (lowerInput.includes("joke")) {
      const jokes = [
        "Why don't scientists trust atoms anymore? Because they make up everything!",
        "I told my wife she was drawing her eyebrows too high. She looked surprised.",
        "Why did the scarecrow win an award? Because he was outstanding in his field!",
        "I'm reading a book about anti-gravity. It's impossible to put down!",
        "Did you hear about the mathematician who's afraid of negative numbers? He'll stop at nothing to avoid them!"
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }
    
    if (lowerInput.includes("nebula") || lowerInput.includes("os")) {
      return "NebulaOS is a beautiful operating system with a cosmic theme! It features various apps like File Explorer, Terminal, AI Terminal, and more.";
    }
    
    // Default response
    const defaultResponses = [
      "That's interesting! Tell me more.",
      "I see. What else is on your mind?",
      "Hmm, let me think about that...",
      "Thanks for sharing! What would you like to discuss next?",
      "I appreciate your perspective. How can I help you further?",
    ];
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      const text = input().trim();
      if (text) {
        addMessage(text, "user");
        setInput("");
      }
    }
  };

  const messageStyle = (sender: "user" | "bot"): JSX.CSSProperties => ({
    display: "flex",
    "margin-bottom": "0.75rem",
    "max-width": "80%",
    "margin-left": sender === "user" ? "auto" : "0",
    "margin-right": sender === "user" ? "0" : "auto",
    "text-align": sender === "user" ? "right" : "left",
  });

  const bubbleStyle = (sender: "user" | "bot") => ({
    "padding": "0.75rem 1rem",
    "border-radius": "18px",
    "font-size": "0.9rem",
    "line-height": "1.4",
    ...(sender === "user"
      ? {
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "white",
        }
      : {
          background: "rgba(255,255,255,0.08)",
          color: "#e8ecff",
          border: "1px solid rgba(255,255,255,0.12)",
        }),
  });

  return (
    <Windows
      title="Chat"
      icon="💬"
      defaultMaximized={false}
      onClose={props.onClose}
      onMinimize={props.onMinimize}
      onFocus={props.onFocus}
      zIndex={props.zIndex}
      top="50%"
      left="50%"
      width="min(400px, 90vw)"
      height="min(500px, 80vh)"
      background="rgba(9,14,30,0.95)"
    >
      <div
        style={{
          display: "flex",
          "flex-direction": "column",
          height: "100%",
          padding: "1rem",
          gap: "0.75rem",
          "box-sizing": "border-box",
        }}
      >
        {/* Messages list */}
        <div
          style={{
            flex: "1",
            "overflow-y": "auto",
            "padding-right": "0.5rem",
          }}
        >
          <For each={messages()}>
            {(message) => (
              <div style={messageStyle(message.sender)}>
                <div style={bubbleStyle(message.sender)}>
                  <div>
                    {message.text}
                    <br />
                    <small style={{ 
                      opacity: 0.7, 
                      "font-size": "0.75rem",
                      "margin-top": "0.25rem",
                      display: "inline-block"
                    }}>
                      {message.timestamp}
                    </small>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>

        {/* Input area */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            placeholder="Type a message..."
            value={input()}
            onInput={(e) => setInput(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: "1",
              padding: "0.75rem 1rem",
              "border-radius": "25px",
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "#e8ecff",
              outline: "none",
              "font-size": "0.9rem",
            }}
          />
          <button
            type="button"
            onClick={() => {
              const text = input().trim();
              if (text) {
                addMessage(text, "user");
                setInput("");
              }
            }}
            style={{
              padding: "0.75rem 1.5rem",
              "border-radius": "25px",
              border: "1px solid rgba(120,100,255,0.5)",
              background: "rgba(120,100,255,0.3)",
              color: "#e8ecff",
              "font-size": "0.9rem",
              cursor: "pointer",
              "white-space": "nowrap",
              display: "flex",
              "align-items": "center",
              gap: "0.5rem",
            }}
          >
            Send
          </button>
        </div>
      </div>
    </Windows>
  );
}