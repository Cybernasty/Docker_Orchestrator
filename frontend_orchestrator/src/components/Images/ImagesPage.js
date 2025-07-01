import Sidebar from "../common/Sidebar";
import Topbar from "../common/Topbar";
import ImagesList from "./ImagesList";

const ImagesPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-8">
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <ImagesList />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ImagesPage; 