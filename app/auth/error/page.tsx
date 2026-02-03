import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      {params?.error ? (
        <p className="text-sm text-slate-600 dark:text-white/60">
          错误代码：{params.error}
        </p>
      ) : (
        <p className="text-sm text-slate-600 dark:text-white/60">
          发生未知错误。
        </p>
      )}
    </>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const cardClass =
    "rounded-3xl border p-8 shadow-2xl backdrop-blur-2xl bg-white/70 border-white/40 text-slate-900 dark:bg-white/10 dark:border-white/20 dark:text-white transition-all duration-500";
  const titleClass =
    "text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent dark:from-cyan-400 dark:to-blue-400";

  return (
    <div className="flex flex-col gap-6">
      <Card className={cardClass}>
        <CardHeader className="p-0 mb-6">
          <CardTitle className={titleClass}>
            抱歉，发生了错误。
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Suspense>
            <ErrorContent searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
