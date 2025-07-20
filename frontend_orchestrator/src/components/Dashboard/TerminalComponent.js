import React, { useState, useEffect, useRef } from "react";

const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY = 1000; // 1 second

const TerminalComponent = ({ containerId, containerName = "Container", shellUser = "root", shellType = "bash", onDisconnect }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("Connecting...");
  const [connected, setConnected] = useState(false);
  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef(null);
  const terminalEndRef = useRef(null);

  const connectWebSocket = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessages(["❌ No authentication token found. Please log in."]);
      setStatus("No authentication token");
      setConnected(false);
      return;
    }
          ws.current = new window.WebSocket(`ws://${window.location.host}?token=${token}`);

    ws.current.onopen = () => {
      setMessages((prev) => [...prev, reconnectAttempts.current > 0 ? "🔄 Reconnected to container shell..." : "Connected to container shell..."]);
      setStatus("Connected");
      setConnected(true);
      reconnectAttempts.current = 0;
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.output) {
          setMessages((prev) => [...prev, data.output]);
        } else if (data.error) {
          setMessages((prev) => [...prev, `❌ Error: ${data.error}`]);
          setStatus("Error");
        }
      } catch (error) {
        console.error("Invalid WebSocket message:", error);
      }
    };

    ws.current.onclose = () => {
      setConnected(false);
      setStatus("Disconnected");
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current); // Exponential backoff
        setMessages((prev) => [...prev, `🔌 Disconnected. Attempting to reconnect in ${delay / 1000}s...`]);
        reconnectTimeout.current = setTimeout(() => {
          reconnectAttempts.current += 1;
          connectWebSocket();
        }, delay);
      } else {
        setMessages((prev) => [...prev, "❌ Could not reconnect to container shell. Please refresh the page."]);
        setStatus("Could not reconnect");
      }
    };

    ws.current.onerror = (err) => {
      setMessages((prev) => [...prev, "❌ WebSocket error occurred."]);
      setStatus("WebSocket error");
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

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendCommand = () => {
    if (input.trim() && ws.current && ws.current.readyState === WebSocket.OPEN) {
      const commandData = JSON.stringify({ containerId, command: input });
      ws.current.send(commandData);
      setMessages((prev) => [...prev, `> ${input}`]);
      setInput("");
    }
  };

  const handleDisconnect = () => {
    if (ws.current) ws.current.close();
    setStatus("Disconnected");
    setConnected(false);
    if (onDisconnect) onDisconnect();
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded shadow-lg border border-gray-200">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50 rounded-t">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold">Exec into</span>
          <span className="text-blue-700 font-mono">{containerName}</span>
          <span className="ml-2">as <span className="text-pink-600 font-mono">{shellUser}</span> using <span className="text-red-600 font-mono">{shellType}</span></span>
        </div>
        <button onClick={handleDisconnect} className="btn btn-sm btn-outline btn-error">Disconnect</button>
      </div>
      {/* Status/Alert */}
      {status && (
        <div className={`px-4 py-1 text-xs ${connected ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"}`}>{status}</div>
      )}
      {/* Terminal Area */}
      <div className="bg-black text-green-200 font-mono p-4 h-72 overflow-y-auto text-sm" style={{ minHeight: 300 }}>
        {messages.map((msg, index) => (
          <div key={index} className="whitespace-pre-wrap">{msg}</div>
        ))}
        <div ref={terminalEndRef} />
      </div>
      {/* Command Input */}
      <div className="flex items-center bg-gray-900 px-4 py-2 rounded-b">
        <span className="text-green-400 font-mono pr-2">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendCommand()}
          placeholder="Type a command..."
          className="flex-1 bg-transparent outline-none text-green-200 font-mono placeholder-green-400"
        />
        <button onClick={sendCommand} className="ml-2 btn btn-xs btn-primary">Send</button>
      </div>
    </div>
  );
};

export default TerminalComponent;
