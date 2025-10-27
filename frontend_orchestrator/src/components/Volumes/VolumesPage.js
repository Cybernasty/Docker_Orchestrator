import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../../config/api";
import Sidebar from "../common/Sidebar";
import Topbar from "../common/Topbar";
import { FaFolder, FaServer, FaLock, FaLockOpen, FaSearch, FaSync } from "react-icons/fa";

const VolumesPage = () => {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("all"); // all, rw, ro
  const [filterStatus, setFilterStatus] = useState("all"); // all, running, stopped

  // Fetch containers to get volumes
  const fetchContainers = async () => {
    try {
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(API_ENDPOINTS.CONTAINERS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setContainers(data.containers || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching containers:", err);
      setError("Failed to fetch containers");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContainers();
    const interval = setInterval(fetchContainers, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Extract all volumes from all containers
  const allVolumes = containers.flatMap(container => 
    (container.volumes || []).map(vol => ({
      ...vol,
      containerName: container.name,
      containerId: container.containerId,
      containerStatus: container.status,
      containerImage: container.image
    }))
  );

  // Filter volumes
  const filteredVolumes = allVolumes.filter(vol => {
    const matchesSearch = !searchQuery || 
      vol.host?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vol.container?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vol.containerName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesMode = filterMode === "all" || vol.mode === filterMode;
    const matchesStatus = filterStatus === "all" || vol.containerStatus === filterStatus;
    
    return matchesSearch && matchesMode && matchesStatus;
  });

  // Statistics
  const stats = {
    total: allVolumes.length,
    readWrite: allVolumes.filter(v => v.mode === "rw").length,
    readOnly: allVolumes.filter(v => v.mode === "ro").length,
    runningContainers: allVolumes.filter(v => v.containerStatus === "running").length,
    uniqueHostPaths: new Set(allVolumes.map(v => v.host)).size
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="flex-1 p-8 flex items-center justify-center">
            <div className="text-gray-600 text-lg">Loading volumes...</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                  <FaFolder className="mr-3 text-orange-600" />
                  Volumes
                </h1>
                <p className="text-gray-600 mt-1">Manage and monitor all container volume mounts</p>
              </div>
              <button 
                onClick={fetchContainers}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaSync className="mr-2" /> Refresh
              </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-sm text-gray-600">Total Volumes</div>
                <div className="text-2xl font-bold text-blue-600 mt-1">{stats.total}</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-sm text-gray-600">Read/Write</div>
                <div className="text-2xl font-bold text-green-600 mt-1">{stats.readWrite}</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-sm text-gray-600">Read Only</div>
                <div className="text-2xl font-bold text-yellow-600 mt-1">{stats.readOnly}</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-sm text-gray-600">Active Containers</div>
                <div className="text-2xl font-bold text-purple-600 mt-1">{stats.runningContainers}</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-sm text-gray-600">Unique Paths</div>
                <div className="text-2xl font-bold text-indigo-600 mt-1">{stats.uniqueHostPaths}</div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search volumes by path or container name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Modes</option>
                  <option value="rw">Read/Write Only</option>
                  <option value="ro">Read Only</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Containers</option>
                  <option value="running">Running Containers</option>
                  <option value="stopped">Stopped Containers</option>
                  <option value="exited">Exited Containers</option>
                </select>
              </div>
              <div className="mt-3 text-sm text-gray-500">
                Showing {filteredVolumes.length} of {allVolumes.length} volumes
              </div>
            </div>

            {/* Volumes List */}
            {error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-600">❌ {error}</p>
              </div>
            ) : filteredVolumes.length > 0 ? (
              <div className="space-y-4">
                {filteredVolumes.map((vol, idx) => (
                  <div 
                    key={`${vol.containerId}-${idx}`} 
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    {/* Header with Container Info */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <FaServer className="text-blue-600 text-xl" />
                        <div>
                          <h3 className="font-semibold text-gray-800">{vol.containerName}</h3>
                          <p className="text-xs text-gray-500">ID: {vol.containerId?.slice(0, 12)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          vol.containerStatus === "running" 
                            ? "bg-green-100 text-green-700" 
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {vol.containerStatus}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          vol.mode === 'rw' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {vol.mode === 'rw' ? <><FaLockOpen className="inline mr-1" />Read/Write</> : <><FaLock className="inline mr-1" />Read Only</>}
                        </span>
                      </div>
                    </div>

                    {/* Volume Mapping */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-xs font-semibold text-gray-500 uppercase">Host System</span>
                        </div>
                        <div className="bg-gradient-to-r from-blue-50 to-white p-4 rounded-lg border border-blue-200">
                          <code className="text-sm text-gray-900 break-all font-mono">
                            {vol.host || 'N/A'}
                          </code>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <span className="text-xs font-semibold text-gray-500 uppercase">Container Path</span>
                        </div>
                        <div className="bg-gradient-to-r from-orange-50 to-white p-4 rounded-lg border border-orange-200">
                          <code className="text-sm text-gray-900 break-all font-mono">
                            {vol.container || 'N/A'}
                          </code>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Image: <span className="font-medium text-gray-700">{vol.containerImage}</span></span>
                        <span>•</span>
                        <span>Mode: <span className="font-medium text-gray-700">{vol.mode === 'rw' ? 'Read/Write' : 'Read Only'}</span></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <FaFolder className="mx-auto text-6xl text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Volumes Found</h3>
                <p className="text-gray-500">
                  {searchQuery || filterMode !== "all" || filterStatus !== "all"
                    ? "No volumes match your current filters. Try adjusting your search criteria."
                    : "No containers have volume mounts configured."}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default VolumesPage;













