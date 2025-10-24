import Sidebar from "../common/Sidebar";
import Topbar from "../common/Topbar";
import ImagesList from "./ImagesList";

const ImagesPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="mb-6">
              <h1 className="font-bold text-xl text-gray-800 flex items-center">
                <span className="mr-3 text-blue-600">📦</span> Docker Images
              </h1>
            </div>
            <ImagesList />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ImagesPage; 