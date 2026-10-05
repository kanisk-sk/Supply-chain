"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import FeedbackAlert from "@/components/common/FeedbackAlert";
import { Tilt } from "@/components/core/tilt";
import { Lock, Mail, ArrowRight, ShieldCheck, Plane } from "lucide-react";

const DEV_CREDENTIALS = [
  { role: "ADMIN", email: "admin@example.com", pass: "Admin123!" },
  { role: "WAREHOUSE_MANAGER", email: "warehouse@example.com", pass: "Warehouse123!" },
  { role: "SUPPLY_CHAIN_MANAGER", email: "supply@example.com", pass: "Supply123!" },
  { role: "ANALYST", email: "analyst@example.com", pass: "Analyst123!" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { access_token } = await authApi.login(email, password);
      await login(access_token);
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError(null);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center lg:justify-end bg-slate-900 overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/ags-logistics.jpg')" }}
      >
        <div className="absolute inset-0 bg-slate-900/30 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-900/10 to-slate-900/90" />
      </div>

      {/* Airplane Animation */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden hidden sm:block">

        
        {/* Animated plane for regular motion */}
        <div className="flight-path absolute top-0 left-0 text-white/80 drop-shadow-lg">
          <Plane className="w-8 h-8 fill-white/20" />
        </div>

        {/* Static plane for reduced motion (hidden by default) */}
        <div className="reduced-motion-plane hidden absolute top-1/4 left-1/4 text-white/50 opacity-50 drop-shadow-md">
          <Plane className="w-8 h-8 rotate-12" />
        </div>
      </div>

      {/* Login Panel */}
      <div className="relative z-20 w-full max-w-md p-6 sm:p-8 lg:mr-16 xl:mr-32">
        <Tilt rotationFactor={8} isRevese>
          <div className="bg-white p-8 shadow-2xl border border-slate-200">
          <div className="mb-8">
            <div className="flex h-12 w-12 items-center justify-center bg-slate-900 text-white shadow-sm mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Supply Chain Platform
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Sign in to access your tracking & analytics workspace
            </p>
          </div>

          {error && (
            <div className="mb-6">
              <FeedbackAlert
                type="error"
                message={error}
                onDismiss={() => setError(null)}
              />
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Email address
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="block w-full border border-slate-300 py-2.5 pl-10 pr-3 text-sm placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Password
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full border border-slate-300 py-2.5 pl-10 pr-3 text-sm placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {loading ? "Signing in..." : "Sign in"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </form>

          {/* Dev Quick-Fill Credentials */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Dev Quick Login
              </span>
              <span className="text-[10px] text-slate-400">Click to fill</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEV_CREDENTIALS.map((cred) => (
                <button
                  key={cred.role}
                  type="button"
                  onClick={() => fillCredentials(cred.email, cred.pass)}
                  className="flex flex-col items-start p-2 text-left border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-colors"
                >
                  <span className="text-xs font-semibold text-slate-800">
                    {cred.role.replace(/_/g, " ")}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                    {cred.role.replace(/_/g, " ")}
                  </span>
                </button>
              ))}
            </div>
          </div>
          </div>
        </Tilt>
      </div>
    </div>
  );
}


