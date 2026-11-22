import { useEffect, useState } from "react";
import api from "../services/api";

interface Session {
  id: string;
  userAgent: string;
  ip: string;
  createdAt: string;
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);

  async function loadSessions() {
    const response = await api.get("/sessions");
    setSessions(response.data.sessions);
  }

  useEffect(() => {
    loadSessions().catch(console.error);
  }, []);

  async function revoke(id: string) {
    await api.delete(`/sessions/${id}`);
    await loadSessions();
  }

  async function revokeAll() {
    await api.delete("/sessions");
    window.location.href = "/";
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Active Sessions</h1>

          <button
            onClick={revokeAll}
            className="bg-red-600 px-4 py-2 rounded-lg"
          >
            Logout all devices
          </button>
        </div>

        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex justify-between gap-4"
            >
              <div>
                <p className="font-semibold">{session.userAgent}</p>
                <p className="text-sm text-slate-400">
                  IP: {session.ip}
                </p>
                <p className="text-sm text-slate-400">
                  Created: {new Date(session.createdAt).toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => revoke(session.id)}
                className="text-red-400"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}