import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../config/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      // Try to decode the token to get user info
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ 
          token,
          id: payload.id,
          email: payload.email,
          role: payload.role
        });
      } catch (error) {
        // If token is invalid, remove it
        localStorage.removeItem("token");
        delete axios.defaults.headers.common["Authorization"];
      }
    }
  }, []);

  const login = async (credentials) => {
    const res = await axios.post(API_ENDPOINTS.LOGIN, credentials);
    localStorage.setItem("token", res.data.token);
    setUser({
      token: res.data.token,
      email: res.data.user.email,
      id: res.data.user.id,
      role: res.data.user.role
    });
    axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    // Redirect to login page
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
