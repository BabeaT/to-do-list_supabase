import { TutorialStep } from "./tutorial-step";

export function ConnectSupabaseSteps() {
  return (
    <ol className="flex flex-col gap-6">
      <TutorialStep title="创建 Supabase 项目">
        <p>
          前往{" "}
          <a
            href="https://app.supabase.com/project/_/settings/api"
            target="_blank"
            className="font-bold hover:underline text-foreground/80"
            rel="noreferrer"
          >
            database.new
          </a>{" "}
          并创建一个新的 Supabase 项目。
        </p>
      </TutorialStep>

      <TutorialStep title="配置环境变量">
        <p>
          将 Next.js 应用中的{" "}
          <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
            .env.example
          </span>{" "}
          文件重命名为{" "}
          <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
            .env.local
          </span>{" "}
          并填入来自{" "}
          <a
            href="https://app.supabase.com/project/_/settings/api"
            target="_blank"
            className="font-bold hover:underline text-foreground/80"
            rel="noreferrer"
          >
            Supabase 项目的 API 设置
          </a>
          的值。
        </p>
      </TutorialStep>

      <TutorialStep title="重启 Next.js 开发服务器">
        <p>
          你可能需要停止当前的 Next.js 开发服务器并再次运行{" "}
          <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
            npm run dev
          </span>{" "}
          以加载新的环境变量。
        </p>
      </TutorialStep>

      <TutorialStep title="刷新页面">
        <p>
          你可能需要刷新页面，Next.js 才能加载新的环境变量。
        </p>
      </TutorialStep>
    </ol>
  );
}
