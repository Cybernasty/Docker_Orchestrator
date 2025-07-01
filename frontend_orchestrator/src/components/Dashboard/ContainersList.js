import { useEffect, useState, useContext } from "react";
import axios from "axios";
import TerminalComponent from "./TerminalComponent"; // Import the terminal
import { FaPlay, FaStop, FaTrash, FaTerminal, FaFileAlt, FaChartBar } from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";
import "../../App.css"; // Ensure styling applies

const ContainersList = () => {
  const { user } = useContext(AuthContext);
  const [containers, setContainers] = useState([]);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLogs, setShowLogs] = useState(null); // containerId or null
  const [logs, setLogs] = useState("");
  const [showStats, setShowStats] = useState(null); // containerId or null
  const [stats, setStats] = useState(null);

  // Fetch Containers
  const fetchContainers = async () => {
    try {
      setError(null);
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/containers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContainers(response.data.containers || []);
    } catch (err) {
      console.error("Error fetching containers:", err);
      setError(err.response?.data?.error?.message || "Failed to fetch containers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContainers();
    const interval = setInterval(fetchContainers, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async (containerId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`http://localhost:5000/api/containers/${containerId}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchContainers();
    } catch (err) {
      console.error("Error starting container:", err);
      setError(err.response?.data?.error?.message || "Failed to start container");
    }
  };

  const handleStop = async (containerId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`http://localhost:5000/api/containers/${containerId}/stop`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchContainers();
    } catch (err) {
      console.error("Error stopping container:", err);
      setError(err.response?.data?.error?.message || "Failed to stop container");
    }
  };

  const handleRemove = async (containerId) => {
    if (!window.confirm("Are you sure you want to remove this container?")) {
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/containers/${containerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchContainers();
    } catch (err) {
      console.error("Error removing container:", err);
      setError(err.response?.data?.error?.message || "Failed to remove container");
    }
  };

  const handleShowLogs = async (containerId) => {
    setShowLogs(containerId);
    setLogs("Loading logs...");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:5000/api/containers/${containerId}/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(res.data.logs || "No logs available.");
    } catch (err) {
      setLogs(err.response?.data?.error?.message || "Failed to fetch logs.");
    }
  };

  const handleShowStats = async (containerId) => {
    setShowStats(containerId);
    setStats(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:5000/api/containers/${containerId}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data.stats || null);
    } catch (err) {
      setStats({ error: err.response?.data?.error?.message || "Failed to fetch stats." });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'running':
        return <span className="badge badge-success badge-sm">running</span>;
      case 'stopped':
        return <span className="badge badge-error badge-sm">stopped</span>;
      case 'restarting':
        return <span className="badge badge-warning badge-sm">restarting</span>;
      case 'exited':
        return <span className="badge badge-ghost badge-sm">exited</span>;
      default:
        return <span className="badge badge-ghost badge-sm">{status}</span>;
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-lg">Loading containers...</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead>
          <tr className="bg-gray-100 text-xs uppercase text-gray-500">
            <th className="px-4 py-2"><input type="checkbox" className="checkbox checkbox-sm" /></th>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">State</th>
            <th className="px-4 py-2">Quick Actions</th>
            <th className="px-4 py-2">Image</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {containers.length > 0 ? (
            containers.map(container => (
              <tr key={container.containerId} className="hover:bg-blue-50 even:bg-gray-50 transition-all duration-150">
                <td className="px-4 py-2"><input type="checkbox" className="checkbox checkbox-sm" /></td>
                <td className="px-4 py-2">
                  <a href="#" className="text-blue-600 hover:underline font-medium">{container.name}</a>
                </td>
                <td className="px-4 py-2">{getStatusBadge(container.status)}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button className="btn btn-ghost btn-xs" title="Logs" onClick={() => handleShowLogs(container.containerId)}><FaFileAlt /></button>
                  <button className="btn btn-ghost btn-xs" title="Stats" onClick={() => handleShowStats(container.containerId)}><FaChartBar /></button>
                  {user?.role === "admin" || user?.role === "operator" ? (
                    <button className="btn btn-ghost btn-xs" title="Terminal" onClick={() => setSelectedContainer(container.containerId)}><FaTerminal /></button>
                  ) : null}
                  <button className="btn btn-ghost btn-xs" title="Start" onClick={() => handleStart(container.containerId)}><FaPlay /></button>
                  <button className="btn btn-ghost btn-xs" title="Stop" onClick={() => handleStop(container.containerId)}><FaStop /></button>
                  <button className="btn btn-ghost btn-xs" title="Remove" onClick={() => handleRemove(container.containerId)}><FaTrash /></button>
                </td>
                <td className="px-4 py-2">
                  <a href="#" className="text-blue-600 hover:underline">{container.image}</a>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="text-center py-8 text-gray-400">No containers found.</td>
            </tr>
          )}
        </tbody>
      </table>
      {/* Logs Modal */}
      {showLogs && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-2">Logs for {showLogs}</h3>
            <pre className="bg-base-200 p-2 rounded text-xs max-h-96 overflow-auto">{logs}</pre>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowLogs(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
      {/* Stats Modal */}
      {showStats && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-2">Stats for {showStats}</h3>
            {stats ? (
              stats.error ? (
                <div className="alert alert-error">{stats.error}</div>
              ) : (
                <pre className="bg-base-200 p-2 rounded text-xs max-h-96 overflow-auto">{JSON.stringify(stats, null, 2)}</pre>
              )
            ) : (
              <div>Loading stats...</div>
            )}
            <div className="modal-action">
              <button className="btn" onClick={() => setShowStats(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
      {/* Terminal Modal */}
      {selectedContainer && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-2">Terminal for {selectedContainer}</h3>
            <TerminalComponent containerId={selectedContainer} />
            <div className="modal-action">
              <button className="btn" onClick={() => setSelectedContainer(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContainersList;
