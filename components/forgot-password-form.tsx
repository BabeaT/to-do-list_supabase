"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "发生错误");
    } finally {
      setIsLoading(false);
    }
  };

  const cardClass =
    "rounded-3xl border p-8 shadow-2xl backdrop-blur-2xl bg-white/70 border-white/40 text-slate-900 dark:bg-white/10 dark:border-white/20 dark:text-white transition-all duration-500";
  const titleClass =
    "text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent dark:from-cyan-400 dark:to-blue-400";
  const descriptionClass = "text-slate-600 dark:text-white/60";
  const labelClass = "text-slate-700 dark:text-white/80";
  const inputClass =
    "h-12 px-4 text-base rounded-2xl backdrop-blur-xl transition-all duration-300 bg-white/80 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 dark:bg-white/10 dark:border-white/20 dark:text-white dark:placeholder:text-white/50 dark:focus:bg-white/15 dark:focus:border-cyan-400";
  const primaryButtonClass =
    "w-full h-12 rounded-2xl text-white shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 dark:from-cyan-500 dark:to-blue-500 dark:hover:from-cyan-600 dark:hover:to-blue-600";
  const linkClass =
    "text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white underline underline-offset-4";

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {success ? (
        <Card className={cardClass}>
          <CardHeader className="p-0 mb-6">
            <CardTitle className={titleClass}>请查收邮件</CardTitle>
            <CardDescription className={descriptionClass}>
              重置密码的说明已发送
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-sm text-slate-600 dark:text-white/60">
              如果你使用邮箱和密码注册，将会收到一封重置密码邮件。
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className={cardClass}>
          <CardHeader className="p-0 mb-6">
            <CardTitle className={titleClass}>重置密码</CardTitle>
            <CardDescription className={descriptionClass}>
              输入邮箱，我们会发送重置密码链接
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleForgotPassword}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email" className={labelClass}>
                    邮箱
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-500 dark:text-red-400">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  className={primaryButtonClass}
                  disabled={isLoading}
                >
                  {isLoading ? "发送中..." : "发送重置邮件"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm text-slate-600 dark:text-white/70">
                已有账号？{" "}
                <Link href="/auth/login" className={linkClass}>
                  登录
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
