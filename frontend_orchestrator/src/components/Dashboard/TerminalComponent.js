import React, { useState, useEffect, useRef } from "react";

const TerminalComponent = ({ containerId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const ws = useRef(null);

  useEffect(() => {
    // ✅ Establish WebSocket connection
    ws.current = new WebSocket("ws://localhost:5000");

    ws.current.onopen = () => {
      console.log("✅ Connected to WebSocket server");
      setMessages((prev) => [...prev, "Connected to container shell..."]);
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
      console.log("❌ WebSocket disconnected");
      setMessages((prev) => [...prev, "WebSocket disconnected"]);
    };

    return () => {
      ws.current.close();
    };
  }, []);

  const sendCommand = () => {
    if (input.trim() && ws.current.readyState === WebSocket.OPEN) {
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
