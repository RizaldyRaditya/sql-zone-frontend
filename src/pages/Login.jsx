import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import AnimatedPage from '../components/AnimatedPage';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Username dan password harus diisi");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.auth.login({ username, password });

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        navigate("/select-world");
      } else {
        setError(response.data.message || "Login gagal");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message || "Gagal login. Silakan coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = () => {
    navigate("/register");
  };

  return (
    <AnimatedPage>
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="absolute top-12 left-12">
          <h1 className="text-white text-2xl font-bold tracking-[0.3em]">
            SQL ZONE
          </h1>
        </div>

        <div className="bg-sql-card/40 backdrop-blur-md p-10 rounded-[50px] w-full max-w-[350px] shadow-2xl border border-white/5">
          <h2 className="text-white text-4xl font-semibold mb-12 text-center tracking-tight">
            Login
          </h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-2xl p-3 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form className="space-y-8" onSubmit={handleLogin}>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white rounded-2xl py-4 px-6 focus:outline-none focus:ring-4 focus:ring-sql-blue-light/40 transition-all text-slate-900 text-lg shadow-inner"
                placeholder="Username"
                disabled={loading}
              />
            </div>

            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white rounded-2xl py-4 px-6 focus:outline-none focus:ring-4 focus:ring-sql-blue-light/40 transition-all text-slate-900 text-lg shadow-inner"
                placeholder="Password"
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between pt-6 px-2">
              <button
                type="submit"
                className="bg-[#4A89C5] hover:bg-[#5a99d5] text-white font-bold py-3 px-10 rounded-2xl shadow-lg transition-all text-lg disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Loading..." : "Login"}
              </button>

              <button
                type="button"
                onClick={handleRegisterClick}
                className="text-white hover:text-sql-blue-light font-medium transition-all text-lg tracking-wide"
                disabled={loading}
              >
                Register
              </button>
            </div>
          </form>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default Login;
