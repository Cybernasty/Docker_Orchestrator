import Sidebar from "../common/Sidebar";
import Topbar from "../common/Topbar";
import ContainersList from "../Dashboard/ContainersList";

const ContainersPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-8">
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="font-semibold text-lg mb-2 flex items-center">
              <span className="mr-2 text-blue-600">🛳️</span> Containers
            </div>
            <ContainersList />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ContainersPage; 