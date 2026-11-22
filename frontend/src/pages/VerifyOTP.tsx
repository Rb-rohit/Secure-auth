import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function VerifyOTP() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const email = sessionStorage.getItem("loginEmail");

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();

    if (!email) {
      navigate("/");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/auth/verify-otp", {
        email,
        otp
      });

      sessionStorage.removeItem("loginEmail");

      navigate("/dashboard");
    } catch (error: any) {
      setError(
        error.response?.data?.message || "OTP verification failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <form
        onSubmit={handleVerify}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 text-white"
      >
        <h1 className="text-2xl font-bold mb-2">
          Verify your email
        </h1>

        <p className="text-slate-400 mb-6">
          Enter the six-digit verification code sent to {email}.
        </p>

        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          pattern="[0-9]{6}"
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          className="w-full text-center tracking-[0.5em] text-2xl p-4 rounded-lg bg-slate-800 border border-slate-700 mb-5"
        />

        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        <button
          disabled={loading || otp.length !== 6}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 p-3 rounded-lg font-semibold"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        <button
          type="button"
          onClick={async () => {
            try {
              await api.post("/auth/resend-otp", { email });
              setError("");
            } catch (error: any) {
              setError(
                error.response?.data?.message || "Unable to resend OTP"
              );
            }
          }}
          className="w-full mt-4 text-blue-400 text-sm"
        >
          Resend OTP
        </button>
      </form>
    </div>
  );
}