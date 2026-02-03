"use client";

import Link from "next/link";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { useState } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDark, setIsDark] = useState(true);

  return (
    <div className={isDark ? "dark" : ""}>
      <div
        className={`min-h-screen transition-all duration-500 ${
          isDark
            ? "bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"
            : "bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100"
        }`}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className={`absolute top-20 left-20 w-72 h-72 ${
              isDark ? "bg-blue-500" : "bg-blue-300"
            } rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse`}
          ></div>
          <div
            className={`absolute top-40 right-20 w-72 h-72 ${
              isDark ? "bg-cyan-500" : "bg-cyan-300"
            } rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000`}
          ></div>
          <div
            className={`absolute -bottom-8 left-1/2 w-72 h-72 ${
              isDark ? "bg-blue-600" : "bg-blue-400"
            } rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-2000`}
          ></div>
        </div>

        <div className="relative min-h-screen flex flex-col">
          <header className="w-full max-w-5xl mx-auto p-6 flex items-center justify-between">
            <Link
              href="/"
              className={`flex items-center gap-2 text-sm font-medium ${
                isDark
                  ? "text-white/80 hover:text-white"
                  : "text-slate-700 hover:text-slate-900"
              } transition-colors`}
            >
              <ArrowLeft className="w-4 h-4" />
              返回首页
            </Link>
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-3 rounded-full ${
                isDark
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-slate-800/10 text-slate-800 hover:bg-slate-800/20"
              } backdrop-blur-lg transition-all duration-300`}
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </header>

          <main className="flex-1 flex items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
