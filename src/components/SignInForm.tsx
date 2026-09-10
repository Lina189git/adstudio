"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { CheckCircle2, Eye, EyeOff, Loader2, TrendingUp } from "lucide-react";

type Mode = "signin" | "signup";

export default function SignInForm({ initialMode = "signin" }: { initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setSuccess("");
    setForm({ name: "", email: "", password: "" });
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    await signIn("google", { callbackUrl: "/auth/redirect" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Registration failed."); return; }

        const result = await signIn("credentials", {
          email: form.email,
          password: form.password,
          redirect: false,
        });
        if (result?.error) {
          setSuccess("Account created! Sign in below.");
          switchMode("signin");
        } else {
          window.location.href = "/auth/redirect";
        }
      } else {
        const result = await signIn("credentials", {
          email: form.email,
          password: form.password,
          redirect: false,
        });
        if (result?.error) {
          setError("Incorrect email or password.");
        } else {
          window.location.href = "/auth/redirect";
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* Tab switcher */}
      <div className="flex rounded-2xl border border-[#eadfcb] bg-[#faf6ef] p-1">
        {(["signin", "signup"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
              mode === m
                ? "bg-white shadow-sm text-[#1a1614]"
                : "text-[#8c7764] hover:text-[#1a1614]"
            }`}
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-[#eadfcb] bg-white px-5 py-3.5 text-sm font-semibold text-[#1a1614] transition hover:border-[#d4a574] hover:bg-[#fdf8f1] disabled:opacity-50"
      >
        {/* Google SVG */}
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[#eadfcb]" />
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a89a8e]">or</span>
        <div className="h-px flex-1 bg-[#eadfcb]" />
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-200 text-[10px] font-bold text-red-700">!</span>
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#6b5d54]">Full name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={set("name")}
              required
              placeholder="Your name"
              className="w-full rounded-2xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm text-[#1a1614] outline-none placeholder:text-[#c0b4aa] transition focus:border-[#d4a574] focus:ring-2 focus:ring-[#d4a574]/15"
            />
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#6b5d54]">Email address</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={set("email")}
            required
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm text-[#1a1614] outline-none placeholder:text-[#c0b4aa] transition focus:border-[#d4a574] focus:ring-2 focus:ring-[#d4a574]/15"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#6b5d54]">Password</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={set("password")}
              required
              minLength={6}
              placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
              className="w-full rounded-2xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 pr-11 text-sm text-[#1a1614] outline-none placeholder:text-[#c0b4aa] transition focus:border-[#d4a574] focus:ring-2 focus:ring-[#d4a574]/15"
            />
            <button type="button" tabIndex={-1} onClick={() => setShowPw((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a89a8e] hover:text-[#1a1614]">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Influencer notice on signup */}
        {mode === "signup" && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-[#eadfcb] bg-[#fdf8f1] px-4 py-3">
            <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-[#d4a574]" />
            <p className="text-xs text-[#6b5d54]">
              Your account will be set up as an <span className="font-semibold text-[#1a1614]">influencer / creator</span> — you can apply for products and earn commission immediately.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1a1614] py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#2a2624] hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" />{mode === "signup" ? "Creating account…" : "Signing in…"}</>
            : mode === "signup" ? "Create influencer account" : "Sign in"}
        </button>
      </form>

      <p className="text-center text-xs text-[#a89a8e]">
        By continuing you agree to our{" "}
        <a href="/terms" className="text-[#d4a574] hover:underline">Terms</a> and{" "}
        <a href="/privacy" className="text-[#d4a574] hover:underline">Privacy Policy</a>.
      </p>
    </div>
  );
}
