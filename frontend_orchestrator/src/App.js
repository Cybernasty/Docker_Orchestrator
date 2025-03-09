import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [containers, setContainers] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/containers")
      .then(res => setContainers(res.data))
      .catch(err => console.error("Error fetching containers:", err));
  }, []);

  return (
    <div>
      <h1>Container Manager</h1>
      <ul>
        {containers.map(container => (
          <li key={container.Id}>
            {container.Names[0]} - {container.State}
            <button onClick={() => axios.post(`http://localhost:5000/api/containers/${container.Id}/start`)}>Start</button>
            <button onClick={() => axios.post(`http://localhost:5000/api/containers/${container.Id}/stop`)}>Stop</button>
            <button onClick={() => axios.delete(`http://localhost:5000/api/containers/${container.Id}`)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
