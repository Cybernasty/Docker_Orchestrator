import { useEffect, useMemo, useState } from "react";
import { API_ENDPOINTS } from "../../config/api";
import Sidebar from "../common/Sidebar";
import Topbar from "../common/Topbar";
import { FaMicrochip, FaMemory, FaNetworkWired, FaClock, FaBug, FaSync, FaTerminal } from "react-icons/fa";

const Gauge = ({ label, value, unit = "%" }) => {
  const percentage = Math.min(100, Math.max(0, Math.round(value)));
  const colorClass = value < 50 ? "from-green-400 to-green-600" : value < 80 ? "from-yellow-400 to-yellow-600" : "from-red-400 to-red-600";
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200">
      <div className="text-sm font-medium text-gray-700 mb-3">{label}</div>
      <div className="flex items-center space-x-4">
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div 
            className={`bg-gradient-to-r ${colorClass} h-4 rounded-full transition-all duration-1000 ease-out relative overflow-hidden`} 
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
            <div className="absolute right-0 top-0 h-full w-1 bg-white opacity-50"></div>
            <div 
              className="absolute inset-0 bg-white opacity-30"
              style={{
                animation: "shimmer 2s infinite",
                transform: "translateX(-100%)"
              }}
            ></div>
          </div>
        </div>
        <div className="text-lg font-bold text-gray-800 min-w-[3rem] text-right">
          <span className={`${value < 50 ? "text-green-600" : value < 80 ? "text-yellow-600" : "text-red-600"}`}>
            {percentage}{unit}
          </span>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        {value < 50 ? "🟢 Healthy" : value < 80 ? "🟡 Warning" : "🔴 Critical"}
      </div>
    </div>
  );
};

const LogLine = ({ line }) => (
  <div className="whitespace-pre text-sm text-white font-mono leading-relaxed">
    {line}
  </div>
);

const MonitoringPage = () => {
  const [metrics, setMetrics] = useState({ cpu: 0, memory: 0, network: 0, uptime: "" });
  const [cpuTrend, setCpuTrend] = useState([]);
  const [memTrend, setMemTrend] = useState([]);
  const [netTrend, setNetTrend] = useState([]);
  const [containers, setContainers] = useState([]);
  const [selectedContainerId, setSelectedContainerId] = useState("");
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [refreshMs, setRefreshMs] = useState(2000);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [testMode, setTestMode] = useState(false);

  // Poll containers to get list
  useEffect(() => {
    let timer;
    const fetchContainers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(API_ENDPOINTS.CONTAINERS, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        const list = data?.containers || [];
        setContainers(list);
      } catch (e) {
        console.error("Error fetching containers:", e);
      }
    };

    fetchContainers();
    if (isAutoRefresh) {
      timer = setInterval(fetchContainers, refreshMs);
    }
    return () => timer && clearInterval(timer);
  }, [isAutoRefresh, refreshMs]);

  // Poll metrics for selected container
  useEffect(() => {
    let timer;
    const fetchMetrics = async () => {
      if (!selectedContainerId) {
        setMetrics({ cpu: 0, memory: 0, network: 0, uptime: "" });
        setCpuTrend([]);
        setMemTrend([]);
        setNetTrend([]);
        return;
      }

      // Test mode - generate fake data for demonstration
      if (testMode) {
        const fakeCpu = Math.random() * 100;
        const fakeMemory = Math.random() * 100;
        const fakeNetwork = Math.random() * 100;
        
        const next = {
          cpu: fakeCpu,
          memory: fakeMemory,
          network: fakeNetwork,
          uptime: metrics.uptime
        };
        setMetrics((prev) => ({ ...prev, ...next }));
        setCpuTrend((arr) => [...arr.slice(-49), Math.round(next.cpu)]);
        setMemTrend((arr) => [...arr.slice(-49), Math.round(next.memory)]);
        setNetTrend((arr) => [...arr.slice(-49), Math.round(next.network)]);
        setLastUpdate(new Date());
        return;
      }

      try {
        const token = localStorage.getItem("token");
        
        const res = await fetch(API_ENDPOINTS.CONTAINER_STATS(selectedContainerId), { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        
        if (!res.ok) {
          console.error("Stats API error:", res.status, res.statusText);
          return;
        }
        const data = await res.json();
        
        if (data?.stats) {
          const stats = data.stats;
          
          // Calculate network usage as a percentage based on total bytes
          const totalNetworkBytes = (stats.networkRx || 0) + (stats.networkTx || 0);
          const networkPercentage = Math.min(100, (totalNetworkBytes / 1_000_000) * 10);
          
          const next = {
            cpu: stats.cpuUsage || 0,
            memory: stats.memoryUsage || 0,
            network: networkPercentage,
            uptime: metrics.uptime
          };
          setMetrics((prev) => ({ ...prev, ...next }));
          setCpuTrend((arr) => [...arr.slice(-49), Math.round(next.cpu)]);
          setMemTrend((arr) => [...arr.slice(-49), Math.round(next.memory)]);
          setNetTrend((arr) => [...arr.slice(-49), Math.round(next.network)]);
          setLastUpdate(new Date());
        }
      } catch (e) {
        console.error("Error fetching stats:", e);
      }
    };

    fetchMetrics();
    if (isAutoRefresh) {
      timer = setInterval(fetchMetrics, refreshMs);
    }
    return () => timer && clearInterval(timer);
  }, [selectedContainerId, isAutoRefresh, refreshMs, testMode]);

  // Load logs for selected container
  useEffect(() => {
    let timer;
    const loadLogs = async () => {
      if (!selectedContainerId) return;
      setLogsLoading(true);
      setLogsError(null);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(API_ENDPOINTS.CONTAINER_LOGS(selectedContainerId) + "?tail=200", { headers: { Authorization: `Bearer ${token}` } });
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        const lines = (data?.logs || "").split("\n").filter(line => line.trim()).slice(-200);
        setLogs(lines);
      } catch (e) {
        setLogsError(`Failed to fetch logs: ${e.message}`);
        setLogs([]);
      } finally {
        setLogsLoading(false);
      }
    };
    loadLogs();
    if (isAutoRefresh) {
      timer = setInterval(loadLogs, Math.max(3000, refreshMs));
    }
    return () => timer && clearInterval(timer);
  }, [selectedContainerId, isAutoRefresh, refreshMs]);

  const filteredContainers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return containers.filter((c) => {
      const matchesQuery = !q || (c.Names?.[0] || c.name || "").toLowerCase().includes(q) || (c.Image || c.image || "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [containers, query, statusFilter]);

  const counts = useMemo(() => {
    const running = containers.filter(c => c.status === "running").length;
    const stopped = containers.filter(c => ["exited", "stopped"].includes(c.status)).length;
    const paused = containers.filter(c => c.status === "paused").length;
    return { running, stopped, paused, total: containers.length };
  }, [containers]);

  const Sparkline = ({ data, color }) => {
    const h = 40; const w = 180;
    if (!data.length) return <div className="h-10 bg-gray-100 rounded animate-pulse" />;
    const max = Math.max(100, ...data);
    const points = data.map((v, i) => `${(i/(data.length-1)) * w},${h - (v/max) * h}`).join(" ");
    const areaPoints = `${points} L${w},${h} L0,${h} Z`;
    
    return (
      <div className="relative">
        <svg width={w} height={h} className="overflow-visible">
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
              <stop offset="100%" stopColor={color} stopOpacity="0.05"/>
            </linearGradient>
          </defs>
          <path d={areaPoints} fill={`url(#gradient-${color})`} className="animate-pulse" />
          <polyline 
            fill="none" 
            stroke={color} 
            strokeWidth="2.5" 
            points={points}
            className="drop-shadow-sm"
            style={{
              strokeDasharray: data.length * 2,
              strokeDashoffset: 0,
              animation: "dash 2s linear infinite"
            }}
          />
          {data.length > 0 && (
            <circle 
              cx={(data.length-1)/(data.length-1) * w} 
              cy={h - (data[data.length-1]/max) * h} 
              r="3" 
              fill={color}
              className="animate-ping"
            />
          )}
        </svg>
        <style jsx>{`
          @keyframes dash {
            to { stroke-dashoffset: -${data.length * 4}; }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Monitoring</h1>
                <p className="text-gray-600 mt-1">Live system metrics, container health and logs</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center text-xs text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  Last update: {lastUpdate.toLocaleTimeString()}
                </div>
                <label className="flex items-center text-sm text-gray-700">
                  <input type="checkbox" className="mr-2" checked={isAutoRefresh} onChange={(e) => setIsAutoRefresh(e.target.checked)} />
                  Auto refresh
                </label>
                <select className="text-sm border border-gray-300 rounded-md px-2 py-1" value={refreshMs} onChange={(e) => setRefreshMs(parseInt(e.target.value))}>
                  <option value={1000}>1s</option>
                  <option value={2000}>2s</option>
                  <option value={3000}>3s</option>
                  <option value={5000}>5s</option>
                </select>
                <button 
                  onClick={() => setTestMode(!testMode)} 
                  className={`flex items-center px-3 py-2 border rounded-md text-sm transition-colors ${
                    testMode 
                      ? "bg-green-100 border-green-300 text-green-700 hover:bg-green-200" 
                      : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  🧪 {testMode ? "Real Data" : "Test Mode"}
                </button>
                <button onClick={() => window.location.reload()} className="flex items-center px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm hover:bg-gray-200">
                  <FaSync className="mr-2" /> Refresh
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  placeholder="Search containers by name or image..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="all">All statuses</option>
                  <option value="running">Running</option>
                  <option value="paused">Paused</option>
                  <option value="exited">Exited</option>
                </select>
                <div className="text-sm text-gray-500 self-center">Showing {filteredContainers.length} of {containers.length} containers</div>
              </div>
            </div>

            {/* Gauges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="space-y-3">
                <Gauge label={<span className="inline-flex items-center"><FaMicrochip className="mr-2 text-blue-600" />CPU Usage{selectedContainerId ? " (Selected)" : ""}</span>} value={metrics.cpu} />
                <Sparkline data={cpuTrend} color="#2563eb" />
              </div>
              <div className="space-y-3">
                <Gauge label={<span className="inline-flex items-center"><FaMemory className="mr-2 text-green-600" />Memory Usage{selectedContainerId ? " (Selected)" : ""}</span>} value={metrics.memory} />
                <Sparkline data={memTrend} color="#16a34a" />
              </div>
              <div className="space-y-3">
                <Gauge label={<span className="inline-flex items-center"><FaNetworkWired className="mr-2 text-purple-600" />Network I/O{selectedContainerId ? " (Selected)" : ""}</span>} value={metrics.network} />
                <Sparkline data={netTrend} color="#7c3aed" />
              </div>
            </div>
            
            {!selectedContainerId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <FaMicrochip className="text-blue-500 mr-2" />
                  <span className="text-blue-700 text-sm font-medium">
                    Select a container from the list below to view its real-time metrics
                  </span>
                </div>
              </div>
            )}

            {/* Containers summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              {[{label:"Running", value:counts.running, color:"text-green-600"}, {label:"Stopped", value:counts.stopped, color:"text-red-600"}, {label:"Paused", value:counts.paused, color:"text-yellow-600"}, {label:"Total", value:counts.total, color:"text-blue-600"}].map((s) => (
                <div key={s.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-sm text-gray-700">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Container list */}
              <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="font-semibold text-gray-800">Containers</div>
                  <div className="text-xs text-gray-500">{counts.total} items</div>
                </div>
                <div className="max-h-[28rem] overflow-auto">
                  {filteredContainers.map((c) => (
                    <button key={c._id || c.id} onClick={() => setSelectedContainerId(c.containerId)} className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 ${selectedContainerId === c.containerId ? "bg-blue-50" : ""}`}>
                      <div className="min-w-0 pr-3">
                        <div className="truncate text-sm font-medium text-gray-800">{c.name || c.containerId?.slice(0,12)}</div>
                        <div className="truncate text-xs text-gray-500">{c.image}</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${c.status === "running" ? "bg-green-100 text-green-700" : c.status === "paused" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{c.status}</span>
                      </div>
                    </button>
                  ))}
                  {filteredContainers.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-gray-500">No containers found or API requires authentication.</div>
                  )}
                </div>
              </div>

              {/* Logs viewer */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="font-semibold text-gray-800 inline-flex items-center">
                    <FaTerminal className="mr-2 text-gray-600" />
                    Logs {selectedContainerId ? `- ${containers.find(c => c.containerId === selectedContainerId)?.name || selectedContainerId}` : ""}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center space-x-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-1" checked={isAutoRefresh} onChange={(e) => setIsAutoRefresh(e.target.checked)} />
                      Auto refresh
                    </label>
                    {selectedContainerId && (
                      <button 
                        onClick={() => {
                          const loadLogs = async () => {
                            if (!selectedContainerId) return;
                            setLogsLoading(true);
                            setLogsError(null);
                            try {
                              const token = localStorage.getItem("token");
                              const res = await fetch(API_ENDPOINTS.CONTAINER_LOGS(selectedContainerId) + "?tail=200", { headers: { Authorization: `Bearer ${token}` } });
                              
                              if (!res.ok) {
                                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                              }
                              
                              const data = await res.json();
                              const lines = (data?.logs || "").split("\n").filter(line => line.trim()).slice(-200);
                              setLogs(lines);
                            } catch (e) {
                              setLogsError(`Failed to fetch logs: ${e.message}`);
                              setLogs([]);
                            } finally {
                              setLogsLoading(false);
                            }
                          };
                          loadLogs();
                        }}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                        disabled={logsLoading}
                      >
                        {logsLoading ? "..." : "Refresh"}
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-4 h-[28rem] overflow-auto bg-gradient-to-b from-gray-900 to-black text-white rounded-b-lg">
                  {logsLoading ? (
                    <div className="text-gray-300 text-sm flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300 mr-2"></div>
                      Loading logs...
                    </div>
                  ) : logsError ? (
                    <div className="text-red-300 text-sm">{logsError}</div>
                  ) : logs.length > 0 ? (
                    logs.map((l, i) => <LogLine key={i} line={l} />)
                  ) : selectedContainerId ? (
                    <div className="text-gray-300 text-sm">No logs available for this container.</div>
                  ) : (
                    <div className="text-gray-300 text-sm">Select a container to stream recent logs.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <FaBug className="text-red-500 mr-2" />
                <div className="font-semibold text-gray-800">Alerts</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className={`p-4 rounded border ${metrics.cpu > 85 ? "border-red-300 bg-red-50" : "border-gray-200"}`}>
                  <div className="font-medium text-gray-800 mb-1">High CPU usage</div>
                  <div className="text-gray-600">Triggered when CPU > 85% (now {Math.round(metrics.cpu)}%)</div>
                </div>
                <div className={`p-4 rounded border ${metrics.memory > 80 ? "border-red-300 bg-red-50" : "border-gray-200"}`}>
                  <div className="font-medium text-gray-800 mb-1">High Memory usage</div>
                  <div className="text-gray-600">Triggered when Memory > 80% (now {Math.round(metrics.memory)}%)</div>
                </div>
                <div className={`p-4 rounded border ${metrics.network > 90 ? "border-red-300 bg-red-50" : "border-gray-200"}`}>
                  <div className="font-medium text-gray-800 mb-1">High Network I/O</div>
                  <div className="text-gray-600">Triggered when Network > 90% (now {Math.round(metrics.network)}%)</div>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default MonitoringPage;