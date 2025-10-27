import React, { useState, useEffect, useRef } from "react";
import { API_ENDPOINTS } from "../../config/api";

const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY = 1000; // 1 second

const TerminalComponent = ({ container, containerName = "Container", shellUser = "root", shellType = "bash", onDisconnect }) => {
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
    
    if (!container?.containerId) {
      setMessages(["❌ No container ID provided."]);
      setStatus("No container ID");
      setConnected(false);
      return;
    }
    
    // Use API_ENDPOINTS for WebSocket connection
    const wsUrl = `${API_ENDPOINTS.WEBSOCKET_URL}?token=${token}`;
    
    ws.current = new window.WebSocket(wsUrl);

    ws.current.onopen = () => {
      setMessages((prev) => [...prev, reconnectAttempts.current > 0 ? "🔄 Reconnected to container shell..." : "Connected to container shell..."]);
      setStatus("Connected");
      setConnected(true);
      reconnectAttempts.current = 0;
      
      // Wait a moment before sending container ID to start interactive shell
      setTimeout(() => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          const initMessage = JSON.stringify({ 
            containerId: container.containerId,
            containerName: containerName
          });
          ws.current.send(initMessage);
        }
      }, 100);
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.output) {
          setMessages((prev) => [...prev, data.output]);
        } else if (data.error) {
          setMessages((prev) => [...prev, `❌ Error: ${data.error}`]);
          setStatus("Error");
          setConnected(false);
        } else if (data.message) {
          setMessages((prev) => [...prev, `ℹ️ ${data.message}`]);
        }
      } catch (error) {
        setMessages((prev) => [...prev, `❌ Invalid message format: ${event.data}`]);
      }
    };

    ws.current.onclose = (event) => {
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
      setMessages((prev) => [...prev, "❌ WebSocket connection error occurred."]);
      setStatus("Connection error");
      setConnected(false);
    };
  };

  useEffect(() => {
    if (container?.containerId) {
      connectWebSocket();
    }
    return () => {
      if (ws.current) ws.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
    // eslint-disable-next-line
  }, [container?.containerId]);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendCommand = () => {
    if (input.trim() && ws.current && ws.current.readyState === WebSocket.OPEN && container?.containerId) {
      const commandData = JSON.stringify({ containerId: container.containerId, command: input });
      ws.current.send(commandData);
      setMessages((prev) => [...prev, `$ ${input}`]);
      setInput("");
    }
  };

  const handleDisconnect = () => {
    if (ws.current) ws.current.close();
    setStatus("Disconnected");
    setConnected(false);
    if (onDisconnect) onDisconnect();
  };

  const testConnection = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }
    
    const testWs = new WebSocket(`${API_ENDPOINTS.WEBSOCKET_URL}?token=${token}`);
    
    testWs.onopen = () => {
      testWs.close();
    };
    
    testWs.onerror = () => {
      // WebSocket test error
    };
    
    testWs.onclose = () => {
      // WebSocket test closed
    };
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded shadow-lg border border-gray-200">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50 rounded-t">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold">Exec into</span>
          <span className="text-blue-700 font-mono">{container?.name || containerName}</span>
          <span className="ml-2">as <span className="text-pink-600 font-mono">{shellUser}</span> using <span className="text-red-600 font-mono">{shellType}</span></span>
        </div>
            <div className="flex gap-2">
              <button onClick={testConnection} className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">Test Connection</button>
              <button onClick={handleDisconnect} className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600">Disconnect</button>
            </div>
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
