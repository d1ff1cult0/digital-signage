"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((d) => setIsSetup(d.setup))
      .catch(() => setIsSetup(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  if (isSetup === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm">
        <div className="bg-card-bg border border-card-border rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold">SignageControl</h1>
            <p className="text-sm text-muted mt-1">
              {isSetup
                ? "Create your admin account"
                : "Sign in to continue"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isSetup ? "new-password" : "current-password"}
              />
            </div>

            {error && (
              <p className="text-sm text-danger font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {loading
                ? "Please wait..."
                : isSetup
                  ? "Create Account & Sign In"
                  : "Sign In"}
            </button>
          </form>

          {isSetup && (
            <p className="text-xs text-muted text-center mt-4">
              This will be the only admin account.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
