import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/request-otp", { email });

      sessionStorage.setItem("loginEmail", email);

      navigate("/verify-otp");
    } catch (error: any) {
      setError(
        error.response?.data?.message || "Unable to request OTP"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 text-white"
      >
        <h1 className="text-3xl font-bold mb-2">
          SecureAuth
        </h1>

        <p className="text-slate-400 mb-8">
          Secure passwordless authentication
        </p>

        <label className="text-sm text-slate-300">
          Email address
        </label>

        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full mt-2 mb-5 p-3 rounded-lg bg-slate-800 border border-slate-700 outline-none"
        />

        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        <button
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 p-3 rounded-lg font-semibold"
        >
          {loading ? "Sending..." : "Send OTP"}
        </button>
      </form>
    </div>
  );
}