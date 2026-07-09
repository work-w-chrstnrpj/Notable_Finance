"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result.ok) {
      router.push("/dashboard");
    } else {
      setError(result.error ?? "Login failed");
    }
  }

  if (authLoading) {
    return <div className="auth-page"><p>Loading...</p></div>;
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Sign In</h1>
        <p className="auth-form__subtitle">Notion Finance</p>
        {error && <div className="auth-form__error">{error}</div>}
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        <button type="submit" className="button button--primary" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign In"}
        </button>
        <p className="auth-form__footer">
          Don&apos;t have an account? <Link href="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}
