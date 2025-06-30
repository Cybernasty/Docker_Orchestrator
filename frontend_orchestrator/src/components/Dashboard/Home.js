import { useEffect, useState } from "react";
import ContainersList from "./ContainersList";
import Sidebar from "../common/Sidebar";

const Home = () => {
  const [stats, setStats] = useState({ total: 0, running: 0, stopped: 0 });
  const [containers, setContainers] = useState([]);

  useEffect(() => {
    // Fetch containers for stats
    const fetchContainers = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/containers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setContainers(data.containers || []);
      const running = data.containers.filter(c => c.status === "running").length;
      const stopped = data.containers.filter(c => c.status === "stopped" || c.status === "exited").length;
      setStats({ total: data.containers.length, running, stopped });
    };
    fetchContainers();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-blue-700 mb-2">Welcome to Orchestrator Dashboard</h1>
          <p className="text-lg text-gray-600">Manage your Docker containers with ease. View logs, stats, and access shell in real time.</p>
        </div>
        {/* Dashboard widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
            <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
            <div className="text-gray-600">Total Containers</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
            <div className="text-2xl font-bold text-green-600">{stats.running}</div>
            <div className="text-gray-600">Running</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
            <div className="text-2xl font-bold text-red-600">{stats.stopped}</div>
            <div className="text-gray-600">Stopped</div>
          </div>
        </div>
        <div id="containers">
          <ContainersList containers={containers} setContainers={setContainers} />
        </div>
      </main>
    </div>
  );
};

export default Home;
