"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../../components/ui/Button";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    full_name: "",
  });
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await register(form);
      toast.success("Account created!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Registration failed");
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-accent font-mono text-2xl font-medium">
            {"</>"}
          </Link>
          <h1 className="text-xl font-semibold mt-3">Create your account</h1>
          <p className="text-muted text-sm mt-1">
            3 free sessions per month, no card required
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-border rounded-xl p-6 space-y-4"
        >
          <div>
            <label className="block text-xs text-muted mb-1.5">
              Full name
            </label>
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-accent transition-colors"
              placeholder="Priya Sharma"
            />
          </div>

          <div>
            <label className="block text-xs text-muted mb-1.5">Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-accent transition-colors"
              placeholder="priya123"
            />
          </div>

          <div>
            <label className="block text-xs text-muted mb-1.5">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-accent transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs text-muted mb-1.5">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-accent transition-colors"
              placeholder="Min. 8 characters"
            />
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full"
            size="md"
          >
            Create account
          </Button>
        </form>

        <p className="text-center text-muted text-xs mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
