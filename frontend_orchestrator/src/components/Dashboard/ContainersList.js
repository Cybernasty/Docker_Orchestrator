import { useEffect, useState } from "react";
import axios from "axios";
import TerminalComponent from "./TerminalComponent"; // Import the terminal
import { FaPlay, FaStop, FaTrash, FaTerminal, FaFileAlt, FaChartBar } from "react-icons/fa";
import "../../App.css"; // Ensure styling applies

const ContainersList = () => {
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'text-green-600';
      case 'stopped':
        return 'text-red-600';
      case 'restarting':
        return 'text-yellow-600';
      case 'exited':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
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
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading containers...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Containers List</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
          <button 
            onClick={() => setError(null)}
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-t-lg">
              <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Image
              </th>
              <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CPU Usage
              </th>
              <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Memory Usage
              </th>
              <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {containers.length > 0 ? (
              containers.map(container => (
                <tr key={container.containerId} className="hover:bg-blue-50 even:bg-gray-50 transition-all duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {container.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {container.image}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(container.status)}`}>
                      {container.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {container.cpuUsage ? `${container.cpuUsage.toFixed(2)}%` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {container.memoryUsage ? formatBytes(container.memoryUsage) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button title="Start" className="bg-green-500 hover:bg-green-700 text-white p-2 rounded shadow transition" onClick={() => handleStart(container.containerId)} disabled={container.status === 'running'}>
                        <FaPlay />
                      </button>
                      <button title="Stop" className="bg-yellow-500 hover:bg-yellow-700 text-white p-2 rounded shadow transition" onClick={() => handleStop(container.containerId)} disabled={container.status === 'stopped'}>
                        <FaStop />
                      </button>
                      <button title="Remove" className="bg-red-500 hover:bg-red-700 text-white p-2 rounded shadow transition" onClick={() => handleRemove(container.containerId)}>
                        <FaTrash />
                      </button>
                      <button title="Shell" className="bg-blue-500 hover:bg-blue-700 text-white p-2 rounded shadow transition" onClick={() => setSelectedContainer(container.containerId)}>
                        <FaTerminal />
                      </button>
                      <button title="Logs" className="bg-gray-500 hover:bg-gray-700 text-white p-2 rounded shadow transition" onClick={() => handleShowLogs(container.containerId)}>
                        <FaFileAlt />
                      </button>
                      <button title="Stats" className="bg-purple-500 hover:bg-purple-700 text-white p-2 rounded shadow transition" onClick={() => handleShowStats(container.containerId)}>
                        <FaChartBar />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No containers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedContainer && (
        <TerminalComponent 
          containerId={selectedContainer} 
          onClose={() => setSelectedContainer(null)} 
        />
      )}

      {/* Logs Modal */}
      {showLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl relative animate-fadeIn">
            <button className="absolute top-2 right-2 text-2xl font-bold text-gray-500 hover:text-red-500 transition" onClick={() => setShowLogs(null)}>×</button>
            <h3 className="text-lg font-bold mb-2">Logs for {showLogs}</h3>
            <pre className="bg-gray-900 text-green-200 p-3 rounded overflow-x-auto max-h-96 whitespace-pre-wrap">{logs}</pre>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStats && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md relative animate-fadeIn">
            <button className="absolute top-2 right-2 text-2xl font-bold text-gray-500 hover:text-red-500 transition" onClick={() => setShowStats(null)}>×</button>
            <h3 className="text-lg font-bold mb-2">Stats for {showStats}</h3>
            {stats ? (
              stats.error ? (
                <div className="text-red-600">{stats.error}</div>
              ) : (
                <div>
                  <div><strong>CPU Usage:</strong> {stats.cpu?.usage ?? 'N/A'}%</div>
                  <div><strong>Memory Usage:</strong> {stats.memory ? `${formatBytes(stats.memory.usage)} / ${formatBytes(stats.memory.limit)}` : 'N/A'}</div>
                  <div><strong>Memory %:</strong> {stats.memory ? `${stats.memory.percentage}%` : 'N/A'}</div>
                  <div><strong>Network:</strong> {stats.network ? JSON.stringify(stats.network) : 'N/A'}</div>
                  <div><strong>Timestamp:</strong> {stats.timestamp ? new Date(stats.timestamp).toLocaleString() : 'N/A'}</div>
                </div>
              )
            ) : (
              <div>Loading stats...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContainersList;
