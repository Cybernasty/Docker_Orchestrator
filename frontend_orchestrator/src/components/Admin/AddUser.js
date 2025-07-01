import { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

const roles = ["admin", "operator", "viewer"];

export default function AddUser() {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({ email: "", password: "", role: "viewer" });
  const [message, setMessage] = useState(null);

  if (user?.role !== "admin") {
    return <div className="p-4 text-red-600">Access denied. Admins only.</div>;
  }

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage(null);
    try {
      await axios.post(
        "http://localhost:5000/api/auth/add-user",
        form,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setMessage({ type: "success", text: "User created successfully!" });
      setForm({ email: "", password: "", role: "viewer" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error?.message || "Error creating user" });
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Add New User</h2>
      {message && (
        <div className={`mb-4 p-2 rounded ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="input input-bordered w-full"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="input input-bordered w-full"
          value={form.password}
          onChange={handleChange}
          required
        />
        <select
          name="role"
          className="select select-bordered w-full"
          value={form.role}
          onChange={handleChange}
        >
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <button type="submit" className="btn btn-primary w-full">Add User</button>
      </form>
    </div>
  );
} 