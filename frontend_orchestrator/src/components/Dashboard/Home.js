import { useEffect, useState } from "react";
import Sidebar from "../common/Sidebar";
import Topbar from "../common/Topbar";
import ContainerStatusWidget from "./ContainerStatusWidget";
import QuickActionsWidget from "./QuickActionsWidget";
import SystemStatusWidget from "./SystemStatusWidget";
import RecentActivityWidget from "./RecentActivityWidget";
import ContainerOverviewWidget from "./ContainerOverviewWidget";

const Home = () => {
  const [stats, setStats] = useState({ 
    total: 0, 
    running: 0, 
    stopped: 0, 
    healthy: 0, 
    unhealthy: 0,
    paused: 0
  });
  const [systemStats, setSystemStats] = useState({
    cpu: 25,
    memory: 45,
    network: 70,
    uptime: "15d 8h 32m",
    sla: "99.9%"
  });
  const [containers, setContainers] = useState([]);

  useEffect(() => {
    // Fetch containers for stats
    const fetchContainers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/containers", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setContainers(data.containers || []);
        
        const running = data.containers.filter(c => c.status === "running").length;
        const stopped = data.containers.filter(c => c.status === "stopped" || c.status === "exited").length;
        const paused = data.containers.filter(c => c.status === "paused").length;
        
        setStats({
          total: data.containers.length,
          running,
          stopped,
          paused,
          healthy: running,
          unhealthy: stopped,
          networkUsage: Math.floor(Math.random() * 50) + 20 // Simulate network usage
        });
      } catch (error) {
        console.error("Error fetching containers:", error);
      }
    };
    
    fetchContainers();
    
    // Simulate real-time system stats updates
    const interval = setInterval(() => {
      setSystemStats(prev => ({
        cpu: Math.max(10, Math.min(90, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(20, Math.min(85, prev.memory + (Math.random() - 0.5) * 5)),
        network: Math.max(30, Math.min(95, prev.network + (Math.random() - 0.5) * 8))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-8">
          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Container Status Widget */}
            <div className="lg:col-span-1">
              <ContainerStatusWidget stats={stats} />
            </div>
            
            {/* Quick Actions Widget */}
            <div className="lg:col-span-1">
              <QuickActionsWidget />
            </div>
            
            {/* System Status Widget */}
            <div className="lg:col-span-1">
              <SystemStatusWidget systemStats={systemStats} />
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity Widget */}
            <div>
              <RecentActivityWidget />
            </div>
            
            {/* Container Overview Widget */}
            <div>
              <ContainerOverviewWidget containerStats={stats} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
