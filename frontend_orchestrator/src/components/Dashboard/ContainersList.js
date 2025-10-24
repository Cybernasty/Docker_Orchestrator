import { useEffect, useState, useContext } from "react";
import axios from "axios";
import TerminalComponent from "./TerminalComponent"; // Import the terminal
import { FaPlay, FaStop, FaTrash, FaTerminal, FaFileAlt, FaChartBar } from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";
import { API_ENDPOINTS } from "../../config/api";
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
      const response = await axios.get(API_ENDPOINTS.CONTAINERS, {
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
      await axios.post(API_ENDPOINTS.CONTAINER_START(containerId), {}, {
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
      await axios.post(API_ENDPOINTS.CONTAINER_STOP(containerId), {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchContainers();
    } catch (err) {
      console.error("Error stopping container:", err);
      setError(err.response?.data?.error?.message || "Failed to stop container");
    }
  };

  const handleRemove = async (containerId) => {
    if (!window.confirm("Are you sure you want to remove this container?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(API_ENDPOINTS.CONTAINER_DELETE(containerId), {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchContainers();
    } catch (err) {
      console.error("Error removing container:", err);
      setError(err.response?.data?.error?.message || "Failed to remove container");
    }
  };

  const handleShowLogs = async (containerId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(API_ENDPOINTS.CONTAINER_LOGS(containerId), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(response.data.logs || "No logs available");
      setShowLogs(containerId);
    } catch (err) {
      console.error("Error fetching logs:", err);
      setLogs("Failed to fetch logs");
      setShowLogs(containerId);
    }
  };

  const handleShowStats = async (containerId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(API_ENDPOINTS.CONTAINER_STATS(containerId), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats);
      setShowStats(containerId);
    } catch (err) {
      console.error("Error fetching stats:", err);
      setStats(null);
      setShowStats(containerId);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'running':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">running</span>;
      case 'stopped':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">stopped</span>;
      case 'paused':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">paused</span>;
      case 'exited':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">exited</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">{status}</span>;
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
            <th className="px-4 py-2"><input type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" /></th>
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
                <td className="px-4 py-2"><input type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" /></td>
                <td className="px-4 py-2">
                  <a href="#" className="text-blue-600 hover:underline font-medium">{container.name}</a>
                </td>
                <td className="px-4 py-2">{getStatusBadge(container.status)}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    {/* Logs and Stats: all roles */}
                    <button 
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" 
                      title="Logs" 
                      onClick={() => handleShowLogs(container.containerId)}
                    >
                      <FaFileAlt className="text-sm" />
                    </button>
                    <button 
                      className="p-2 text-green-600 hover:bg-green-100 rounded-md transition-colors" 
                      title="Stats" 
                      onClick={() => handleShowStats(container.containerId)}
                    >
                      <FaChartBar className="text-sm" />
                    </button>
                    <button 
                      className="p-2 text-purple-600 hover:bg-purple-100 rounded-md transition-colors" 
                      title="Terminal" 
                      onClick={() => setSelectedContainer(container)}
                    >
                      <FaTerminal className="text-sm" />
                    </button>
                    
                    {/* Start/Stop: admin/operator only */}
                    {(user?.role === "admin" || user?.role === "operator") && (
                      <>
                        {container.status === "running" ? (
                          <button 
                            className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors" 
                            title="Stop" 
                            onClick={() => handleStop(container.containerId)}
                          >
                            <FaStop className="text-sm" />
                          </button>
                        ) : (
                          <button 
                            className="p-2 text-green-600 hover:bg-green-100 rounded-md transition-colors" 
                            title="Start" 
                            onClick={() => handleStart(container.containerId)}
                          >
                            <FaPlay className="text-sm" />
                          </button>
                        )}
                        <button 
                          className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors" 
                          title="Remove" 
                          onClick={() => handleRemove(container.containerId)}
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 text-sm text-gray-600">{container.image}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                {error ? `Error: ${error}` : "No containers found"}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {/* Logs Modal */}
      {showLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h3 className="font-bold text-lg text-gray-800">Logs for {showLogs}</h3>
            </div>
            <div className="p-6 flex-1 overflow-auto">
              <pre className="bg-gray-100 p-4 rounded text-xs max-h-96 overflow-auto whitespace-pre-wrap">{logs}</pre>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button 
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                onClick={() => setShowLogs(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h3 className="font-bold text-lg text-gray-800">Stats for {showStats}</h3>
            </div>
            <div className="p-6 flex-1 overflow-auto">
              {stats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-100 p-4 rounded">
                      <h4 className="font-semibold text-gray-800">CPU Usage</h4>
                      <p className="text-2xl font-bold text-blue-600">{stats.cpuUsage || 0}%</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded">
                      <h4 className="font-semibold text-gray-800">Memory Usage</h4>
                      <p className="text-2xl font-bold text-green-600">{stats.memoryUsage || 0}%</p>
                      <p className="text-sm text-gray-600">
                        {formatBytes(stats.memoryUsed || 0)} / {formatBytes(stats.memoryLimit || 0)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-100 p-4 rounded">
                      <h4 className="font-semibold text-gray-800">Network I/O</h4>
                      <p className="text-sm text-gray-600">RX: {formatBytes(stats.networkRx || 0)}</p>
                      <p className="text-sm text-gray-600">TX: {formatBytes(stats.networkTx || 0)}</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded">
                      <h4 className="font-semibold text-gray-800">Block I/O</h4>
                      <p className="text-sm text-gray-600">Read: {formatBytes(stats.blockRead || 0)}</p>
                      <p className="text-sm text-gray-600">Write: {formatBytes(stats.blockWrite || 0)}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-100 p-4 rounded">
                    <h4 className="font-semibold text-gray-800">Processes</h4>
                    <p className="text-2xl font-bold text-purple-600">{stats.processes || 0}</p>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Last updated: {new Date(stats.timestamp).toLocaleString()}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No stats available</p>
              )}
              
              {/* Volumes Section - Get from container data */}
              {containers.find(c => c.containerId === showStats)?.volumes && (
                <div className="mt-6 border-t pt-6">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                    <span className="mr-2">📂</span> Mounted Volumes
                  </h4>
                  {containers.find(c => c.containerId === showStats).volumes.length > 0 ? (
                    <div className="space-y-3">
                      {containers.find(c => c.containerId === showStats).volumes.map((vol, idx) => (
                        <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Host Path:</span>
                              <p className="text-gray-900 font-mono text-xs mt-1 break-all">{vol.host || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Container Path:</span>
                              <p className="text-gray-900 font-mono text-xs mt-1 break-all">{vol.container || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Mode:</span>
                              <p className="mt-1">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${vol.mode === 'rw' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                  {vol.mode === 'rw' ? '🔓 Read/Write' : '🔒 Read Only'}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No volumes mounted</p>
                  )}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button 
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                onClick={() => setShowStats(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Modal */}
      {selectedContainer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h3 className="font-bold text-lg text-gray-800">Terminal - {selectedContainer.name}</h3>
            </div>
            <div className="flex-1 overflow-hidden">
              <TerminalComponent container={selectedContainer} />
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button 
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                onClick={() => setSelectedContainer(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ContainersList;