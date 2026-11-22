import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

interface User {
  email: string;
  name?: string;
  isEmailVerified: boolean;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    api.get("/auth/me")
      .then((response) => setUser(response.data.user))
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [navigate]);

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
      navigate("/");
    }
  }

  if (loading) {
    return <div className="p-10">Loading...</div>;
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">SecureAuth</h1>

          <button
            onClick={logout}
            className="bg-red-600 px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>

        <div className="mt-10 bg-slate-900 border border-slate-800 rounded-xl p-8">
          <h2 className="text-2xl font-semibold">
            Welcome {user.name || "User"}
          </h2>

          <p className="text-slate-400 mt-3">{user.email}</p>

          <p className="mt-4 text-green-400">
            Email verified: {user.isEmailVerified ? "Yes" : "No"}
          </p>

          <button
            onClick={() => navigate("/sessions")}
            className="mt-6 bg-blue-600 px-5 py-3 rounded-lg"
          >
            Manage active sessions
          </button>
        </div>
      </div>
    </main>
  );
}