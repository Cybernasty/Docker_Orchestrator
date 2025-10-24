import Sidebar from "../common/Sidebar";
import Topbar from "../common/Topbar";
import ContainersList from "../Dashboard/ContainersList";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const ContainersPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="font-bold text-xl text-gray-800 flex items-center">
                <span className="mr-3 text-blue-600">🛳️</span> Containers
              </div>
              {(user?.role === "admin" || user?.role === "operator") && (
                <button
                  onClick={() => navigate('/containers/create')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                >
                  <FaPlus className="text-sm" />
                  <span>Create Container</span>
                </button>
              )}
            </div>
            <ContainersList />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ContainersPage; 