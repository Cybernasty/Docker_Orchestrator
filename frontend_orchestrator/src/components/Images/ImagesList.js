import { useEffect, useState } from "react";
import axios from "axios";

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ImagesList = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/containers/images", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setImages(res.data.images || []);
      } catch (err) {
        setError(err.response?.data?.error?.message || "Failed to fetch images");
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-lg">Loading images...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <strong>Error:</strong> {error}
        <button onClick={() => setError(null)} className="float-right font-bold">×</button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-t-lg">
            <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Repository</th>
            <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tag</th>
            <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image ID</th>
            <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
            <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {images.length > 0 ? (
            images.map((img) => (
              (img.RepoTags || ["<none>:<none>"]).map((repoTag, idx) => {
                const [repo, tag] = repoTag.split(":");
                return (
                  <tr key={img.Id + repoTag + idx} className="hover:bg-blue-50 even:bg-gray-50 transition-all duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{repo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tag}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{img.Id.substring(7, 19)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatBytes(img.Size)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(img.Created * 1000).toLocaleString()}</td>
                  </tr>
                );
              })
            ))
          ) : (
            <tr><td colSpan={5} className="text-center py-8 text-gray-400">No images found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ImagesList; 