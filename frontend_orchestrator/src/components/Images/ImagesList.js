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
      <div className="alert alert-error shadow-lg mb-4">
        <div>
          <span>Error: {error}</span>
          <button onClick={() => setError(null)} className="btn btn-sm btn-ghost ml-4">×</button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead>
          <tr className="bg-gray-100 text-xs uppercase text-gray-500">
            <th className="px-4 py-2"><input type="checkbox" className="checkbox checkbox-sm" /></th>
            <th className="px-4 py-2">Repository</th>
            <th className="px-4 py-2">Tag</th>
            <th className="px-4 py-2">Image ID</th>
            <th className="px-4 py-2">Size</th>
            <th className="px-4 py-2">Created</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {images.length > 0 ? (
            images.map((img) =>
              (img.RepoTags || ["<none>:<none>"]).map((repoTag, idx) => {
                const [repo, tag] = repoTag.split(":");
                return (
                  <tr key={img.Id + repoTag + idx} className="hover:bg-blue-50 even:bg-gray-50 transition-all duration-150">
                    <td className="px-4 py-2"><input type="checkbox" className="checkbox checkbox-sm" /></td>
                    <td className="px-4 py-2">
                      <a href="#" className="text-blue-600 hover:underline font-medium">{repo}</a>
                    </td>
                    <td className="px-4 py-2">{tag}</td>
                    <td className="px-4 py-2 font-mono">{img.Id.substring(7, 19)}</td>
                    <td className="px-4 py-2">{formatBytes(img.Size)}</td>
                    <td className="px-4 py-2">{new Date(img.Created * 1000).toLocaleString()}</td>
                  </tr>
                );
              })
            )
          ) : (
            <tr>
              <td colSpan={6} className="text-center py-8 text-gray-400">No images found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ImagesList; 