"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Chrome, Mail, Eye, EyeOff } from "lucide-react";

export default function SignInForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registrationUserId, setRegistrationUserId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    setRegistrationUserId("");

    try {
      const result = await signIn("google", {
        callbackUrl: "/",
        redirect: false,
      });

      if (result?.error) {
        setError("Failed to sign in. Please try again.");
      } else if (result?.url) {
        router.push(result.url);
      } else {
        router.push("/");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRegistrationUserId("");

    try {
      if (isSignUp) {
        // Registration
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Registration failed");
          return;
        }

        if (data.userId) {
          setRegistrationUserId(data.userId);
        }

        // After successful registration, sign in
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          callbackUrl: "/account?welcome=1",
          redirect: false,
        });

        if (result?.error) {
          setError(
            `Registration successful${data.userId ? ` (User ID: ${data.userId})` : ""}, but sign in failed. Please try signing in.`
          );
        } else {
          router.push(result?.url || "/account?welcome=1");
        }
      } else {
        // Sign in
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          callbackUrl: "/",
          redirect: false,
        });

        if (result?.error) {
          setError("Invalid email or password");
        } else {
          router.push("/");
        }
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="bg-white rounded-[1.75rem] border-2 border-[#eadfcb] p-8 shadow-[0_10px_30px_rgba(26,22,20,0.06)]">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {registrationUserId && !error ? (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          Account created successfully. Your user ID is <span className="font-semibold">{registrationUserId}</span>.
        </div>
      ) : null}

      {/* Google Sign In */}
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-white border-2 border-[#eadfcb] text-[#1a1614] px-6 py-3 rounded-lg hover:bg-[#f8f1e6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
      >
        <Chrome className="w-5 h-5" />
        <span className="font-semibold">
          {loading ? "Signing in..." : "Continue with Google"}
        </span>
      </button>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#eadfcb]"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-[#6b5d54]">Or continue with email</span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleEmailAuth} className="space-y-4">
        {isSignUp && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#1a1614] mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-[#eadfcb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a574] bg-[#faf6ef]"
              placeholder="Enter your full name"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#1a1614] mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border border-[#eadfcb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a574] bg-[#faf6ef]"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[#1a1614] mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength={6}
              className="w-full px-4 py-3 pr-12 border border-[#eadfcb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a574] bg-[#faf6ef]"
              placeholder={isSignUp ? "Create a password (min 6 characters)" : "Enter your password"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6b5d54] hover:text-[#1a1614]"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-[#1a1614] text-white px-6 py-3 rounded-lg hover:bg-[#2a2624] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Mail className="w-5 h-5" />
          <span className="font-semibold">
            {loading
              ? (isSignUp ? "Creating account..." : "Signing in...")
              : (isSignUp ? "Create Account" : "Sign In")
            }
          </span>
        </button>
      </form>

      {/* Toggle between sign in and sign up */}
      <div className="mt-6 text-center">
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError("");
            setRegistrationUserId("");
            setFormData({ name: "", email: "", password: "" });
          }}
          className="text-[#d4a574] hover:underline text-sm"
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "Don't have an account? Sign up"
          }
        </button>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-[#6b5d54]">
          By {isSignUp ? "signing up" : "signing in"}, you agree to our{" "}
          <a href="/terms" className="text-[#d4a574] hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-[#d4a574] hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
