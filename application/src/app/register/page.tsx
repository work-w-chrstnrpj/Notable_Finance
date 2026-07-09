"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await register(email, password, name || undefined);
    setSubmitting(false);
    if (result.ok) {
      router.push("/dashboard");
    } else {
      setError(result.error ?? "Registration failed");
    }
  }

  if (authLoading) {
    return <div className="auth-page"><p>Loading...</p></div>;
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Create Account</h1>
        <p className="auth-form__subtitle">Notion Finance</p>
        {error && <div className="auth-form__error">{error}</div>}
        <label>
          Name (optional)
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </label>
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
            minLength={6}
            autoComplete="new-password"
          />
        </label>
        <button type="submit" className="button button--primary" disabled={submitting}>
          {submitting ? "Creating account..." : "Create Account"}
        </button>
        <p className="auth-form__footer">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
