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
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      // Update this route to redirect to an authenticated route. The user already has an active session.
      router.push("/");
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

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className={cardClass}>
        <CardHeader className="p-0 mb-6">
          <CardTitle className={titleClass}>设置新密码</CardTitle>
          <CardDescription className={descriptionClass}>
            请输入新的密码。
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={handleForgotPassword}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="password" className={labelClass}>
                  新密码
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="新密码"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              {error && (
                <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
              )}
              <Button
                type="submit"
                className={primaryButtonClass}
                disabled={isLoading}
              >
                {isLoading ? "保存中..." : "保存新密码"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
