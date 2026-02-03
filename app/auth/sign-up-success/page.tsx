import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  const cardClass =
    "rounded-3xl border p-8 shadow-2xl backdrop-blur-2xl bg-white/70 border-white/40 text-slate-900 dark:bg-white/10 dark:border-white/20 dark:text-white transition-all duration-500";
  const titleClass =
    "text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent dark:from-cyan-400 dark:to-blue-400";
  const descriptionClass = "text-slate-600 dark:text-white/60";

  return (
    <div className="flex flex-col gap-6">
      <Card className={cardClass}>
        <CardHeader className="p-0 mb-6">
          <CardTitle className={titleClass}>
            感谢注册！
          </CardTitle>
          <CardDescription className={descriptionClass}>
            请查收邮件完成确认
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <p className="text-sm text-slate-600 dark:text-white/60">
            你已成功注册，请在登录前前往邮箱完成账号确认。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
