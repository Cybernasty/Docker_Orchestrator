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
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-8">
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div className="font-semibold text-lg flex items-center">
                <span className="mr-2 text-blue-600">🛳️</span> Containers
              </div>
              {(user?.role === "admin" || user?.role === "operator") && (
                <button
                  onClick={() => navigate('/containers/create')}
                  className="btn btn-primary btn-sm"
                >
                  <FaPlus className="mr-2" />
                  Create Container
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