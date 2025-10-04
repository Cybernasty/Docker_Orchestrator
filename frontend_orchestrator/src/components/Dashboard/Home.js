import { useEffect, useState } from "react";
import ContainersList from "./ContainersList";
import Sidebar from "../common/Sidebar";
import Topbar from "../common/Topbar";
import { FaCubes, FaPlay, FaStop, FaHeart, FaExclamationTriangle, FaHdd, FaImages, FaNetworkWired, FaCogs } from "react-icons/fa";

const Home = () => {
  const [stats, setStats] = useState({ total: 0, running: 0, stopped: 0, healthy: 0, unhealthy: 0 });
  const [containers, setContainers] = useState([]);

  useEffect(() => {
    // Fetch containers for stats
    const fetchContainers = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/containers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setContainers(data.containers || []);
      const running = data.containers.filter(c => c.status === "running").length;
      const stopped = data.containers.filter(c => c.status === "stopped" || c.status === "exited").length;
      // For demo, healthy = running, unhealthy = stopped
      setStats({
        total: data.containers.length,
        running,
        stopped,
        healthy: running,
        unhealthy: stopped
      });
    };
    fetchContainers();
  }, []);

  // Demo values for other resources
  const demoStats = {
    stacks: 1,
    images: 29,
    imagesSize: '9.9 GB',
    volumes: 27,
    networks: 6
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-8">
          {/* Environment Info Panel */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="font-semibold text-lg mb-2 flex items-center"><FaCogs className="mr-2 text-blue-600" /> Environment info</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div><span className="font-bold">Environment:</span> local <span className="ml-2 text-gray-400">Standalone 20.10.8</span></div>
              <div><span className="font-bold">URL:</span> <span className="text-gray-600">/var/run/docker.sock</span></div>
              <div><span className="font-bold">Tags:</span> -</div>
            </div>
          </div>
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
            <div className="bg-white rounded-lg shadow flex items-center p-6">
              <FaCubes className="text-4xl text-blue-600 mr-4" />
              <div>
                <div className="text-2xl font-bold">{demoStats.stacks}</div>
                <div className="text-gray-600">Stack</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow flex items-center p-6">
              <FaCubes className="text-4xl text-blue-600 mr-4" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-gray-600">Containers</div>
                <div className="flex space-x-2 mt-1">
                  <span className="text-green-600 flex items-center text-xs"><FaHeart className="mr-1" />{stats.healthy} healthy</span>
                  <span className="text-blue-600 flex items-center text-xs"><FaPlay className="mr-1" />{stats.running} running</span>
                  <span className="text-yellow-600 flex items-center text-xs"><FaExclamationTriangle className="mr-1" />{stats.unhealthy} unhealthy</span>
                  <span className="text-red-600 flex items-center text-xs"><FaStop className="mr-1" />{stats.stopped} stopped</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow flex items-center p-6">
              <FaImages className="text-4xl text-blue-600 mr-4" />
              <div>
                <div className="text-2xl font-bold">{demoStats.images}</div>
                <div className="text-gray-600">Images</div>
                <div className="text-blue-400 text-xs flex items-center mt-1"><FaHdd className="mr-1" />{demoStats.imagesSize}</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow flex items-center p-6">
              <FaHdd className="text-4xl text-blue-600 mr-4" />
              <div>
                <div className="text-2xl font-bold">{demoStats.volumes}</div>
                <div className="text-gray-600">Volumes</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow flex items-center p-6">
              <FaNetworkWired className="text-4xl text-blue-600 mr-4" />
              <div>
                <div className="text-2xl font-bold">{demoStats.networks}</div>
                <div className="text-gray-600">Networks</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
