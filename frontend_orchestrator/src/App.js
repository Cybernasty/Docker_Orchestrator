import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [containers, setContainers] = useState([]);

  const fetchContainers = () => {
    axios
      .get("http://localhost:5000/api/containers")
      .then((res) => setContainers(res.data))
      .catch((err) => console.error("Error fetching containers:", err));
  };

  useEffect(() => {
    fetchContainers();
    const interval = setInterval(fetchContainers, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = (containerId) => {
    axios.post(`http://localhost:5000/api/containers/${containerId}/start`)
      .then(() => fetchContainers())
      .catch(err => console.error("Error starting container:", err));
  };

  const handleStop = (containerId) => {
    axios.post(`http://localhost:5000/api/containers/${containerId}/stop`)
      .then(() => fetchContainers())
      .catch(err => console.error("Error stopping container:", err));
  };

  const handleRemove = (containerId) => {
    axios.delete(`http://localhost:5000/api/containers/${containerId}`)
      .then(() => fetchContainers())
      .catch(err => console.error("Error removing container:", err));
  };

  return (
    <div>
      <h1>Container Manager</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {containers.map(container => (
            <tr key={container.containerId}>
              <td>{container.name}</td>
              <td>{container.status}</td>
              <td>
                <button className="start" onClick={() => handleStart(container.containerId)}>Start</button>
                <button className="stop" onClick={() => handleStop(container.containerId)}>Stop</button>
                <button className="remove" onClick={() => handleRemove(container.containerId)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
