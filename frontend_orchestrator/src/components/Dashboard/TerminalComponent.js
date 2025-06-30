import React, { useState, useEffect, useRef } from "react";

const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY = 1000; // 1 second

const TerminalComponent = ({ containerId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef(null);

  const connectWebSocket = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessages(["❌ No authentication token found. Please log in."]);
      return;
    }
    ws.current = new window.WebSocket(`ws://localhost:5000?token=${token}`);

    ws.current.onopen = () => {
      setMessages((prev) => [...prev, reconnectAttempts.current > 0 ? "🔄 Reconnected to container shell..." : "Connected to container shell..."]);
      reconnectAttempts.current = 0;
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.output) {
          setMessages((prev) => [...prev, data.output]);
        } else if (data.error) {
          setMessages((prev) => [...prev, `❌ Error: ${data.error}`]);
        }
      } catch (error) {
        console.error("Invalid WebSocket message:", error);
      }
    };

    ws.current.onclose = () => {
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current); // Exponential backoff
        setMessages((prev) => [...prev, `🔌 Disconnected. Attempting to reconnect in ${delay / 1000}s...`]);
        reconnectTimeout.current = setTimeout(() => {
          reconnectAttempts.current += 1;
          connectWebSocket();
        }, delay);
      } else {
        setMessages((prev) => [...prev, "❌ Could not reconnect to container shell. Please refresh the page."]);
      }
    };

    ws.current.onerror = (err) => {
      setMessages((prev) => [...prev, "❌ WebSocket error occurred."]);
    };
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (ws.current) ws.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
    // eslint-disable-next-line
  }, [containerId]);

  const sendCommand = () => {
    if (input.trim() && ws.current && ws.current.readyState === WebSocket.OPEN) {
      const commandData = JSON.stringify({ containerId, command: input });
      ws.current.send(commandData);
      setMessages((prev) => [...prev, `> ${input}`]);
      setInput("");
    }
  };

  return (
    <div style={styles.terminalContainer}>
      <div style={styles.terminalOutput}>
        {messages.map((msg, index) => (
          <div key={index} style={styles.message}>
            {msg}
          </div>
        ))}
      </div>
      <div style={styles.inputContainer}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendCommand()}
          placeholder="Type a command..."
          style={styles.input}
        />
        <button onClick={sendCommand} style={styles.button}>Send</button>
      </div>
    </div>
  );
};

// ✅ Basic inline styles
const styles = {
  terminalContainer: {
    backgroundColor: "#000",
    color: "#0f0",
    fontFamily: "monospace",
    padding: "10px",
    borderRadius: "5px",
    width: "100%",
    height: "300px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  terminalOutput: {
    flexGrow: 1,
    overflowY: "auto",
    maxHeight: "250px",
    padding: "5px",
  },
  inputContainer: {
    display: "flex",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#222",
    color: "#0f0",
    border: "none",
    padding: "5px",
    fontFamily: "monospace",
  },
  button: {
    backgroundColor: "#0f0",
    color: "#000",
    border: "none",
    padding: "5px 10px",
    cursor: "pointer",
    marginLeft: "5px",
  },
  message: {
    whiteSpace: "pre-wrap",
    marginBottom: "5px",
  },
};

export default TerminalComponent;
