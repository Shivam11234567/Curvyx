"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-white rounded-3xl border border-rose-100 p-8 sm:p-10 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <span className="font-serif text-3xl font-bold tracking-widest text-neutral-900 uppercase">
            ELORA
          </span>
          <h1 className="font-serif text-xl font-bold text-neutral-800">Reset Password</h1>
          <p className="text-xs text-neutral-500">
            Enter your registered email address to receive password reset instructions.
          </p>
        </div>

        {submitted ? (
          <div className="text-center space-y-4 py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-neutral-800">Password Reset Link Sent</p>
            <p className="text-xs text-neutral-500">
              If an account with <strong>{email}</strong> exists, you will receive an email shortly with reset instructions.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs font-bold text-rose-600 hover:underline uppercase"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg transition-all"
            >
              Send Reset Link
            </button>

            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-rose-600"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Login</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
