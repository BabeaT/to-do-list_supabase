import { TutorialStep } from "./tutorial-step";
import { CodeBlock } from "./code-block";

const create = `create table notes (
  id bigserial primary key,
  title text
);

insert into notes(title)
values
  ('Today I created a Supabase project.'),
  ('I added some data and queried it from Next.js.'),
  ('It was awesome!');
`.trim();

const rls = `alter table notes enable row level security;
create policy "Allow public read access" on notes
for select
using (true);`.trim();

const server = `import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data: notes } = await supabase.from('notes').select()

  return <pre>{JSON.stringify(notes, null, 2)}</pre>
}
`.trim();

const client = `'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function Page() {
  const [notes, setNotes] = useState<any[] | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data } = await supabase.from('notes').select()
      setNotes(data)
    }
    getData()
  }, [])

  return <pre>{JSON.stringify(notes, null, 2)}</pre>
}
`.trim();

export function FetchDataSteps() {
  return (
    <ol className="flex flex-col gap-6">
      <TutorialStep title="创建表并插入示例数据">
        <p>
          前往 Supabase 项目的{" "}
          <a
            href="https://supabase.com/dashboard/project/_/editor"
            className="font-bold hover:underline text-foreground/80"
            target="_blank"
            rel="noreferrer"
          >
            Table Editor
          </a>{" "}
          来创建表并插入示例数据。如果没有灵感，可以把下面内容复制到{" "}
          <a
            href="https://supabase.com/dashboard/project/_/sql/new"
            className="font-bold hover:underline text-foreground/80"
            target="_blank"
            rel="noreferrer"
          >
            SQL Editor
          </a>{" "}
          并点击 RUN！
        </p>
        <CodeBlock code={create} />
      </TutorialStep>

      <TutorialStep title="启用行级安全（RLS）">
        <p>
          Supabase 默认启用行级安全（RLS）。要从{" "}
          <code>notes</code> 表中查询数据，需要添加一条策略。你可以在{" "}
          <a
            href="https://supabase.com/dashboard/project/_/editor"
            className="font-bold hover:underline text-foreground/80"
            target="_blank"
            rel="noreferrer"
          >
            Table Editor
          </a>{" "}
          中完成，或通过{" "}
          <a
            href="https://supabase.com/dashboard/project/_/sql/new"
            className="font-bold hover:underline text-foreground/80"
            target="_blank"
            rel="noreferrer"
          >
            SQL Editor
          </a>
          进行配置。
        </p>
        <p>
          例如，你可以执行以下 SQL 以允许公开读取：
        </p>
        <CodeBlock code={rls} />
        <p>
          你可以在{" "}
          <a
            href="https://supabase.com/docs/guides/auth/row-level-security"
            className="font-bold hover:underline text-foreground/80"
            target="_blank"
            rel="noreferrer"
          >
            Supabase 文档
          </a>
          中了解更多。
        </p>
      </TutorialStep>

      <TutorialStep title="在 Next.js 中查询 Supabase 数据">
        <p>
          要创建 Supabase 客户端并在异步服务器组件中查询数据，请在{" "}
          <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
            /app/notes/page.tsx
          </span>{" "}
          新建 page.tsx 文件并添加以下内容。
        </p>
        <CodeBlock code={server} />
        <p>或者使用客户端组件。</p>
        <CodeBlock code={client} />
      </TutorialStep>

      <TutorialStep title="探索 Supabase UI 组件库">
        <p>
          前往{" "}
          <a
            href="https://supabase.com/ui"
            className="font-bold hover:underline text-foreground/80"
          >
            Supabase UI 组件库
          </a>{" "}
          并尝试安装一些组件块。例如，可以通过以下命令安装 Realtime Chat：
        </p>
        <CodeBlock
          code={
            "npx shadcn@latest add https://supabase.com/ui/r/realtime-chat-nextjs.json"
          }
        />
      </TutorialStep>

      <TutorialStep title="周末就能上线，轻松扩展到百万用户！">
        <p>现在可以向全世界发布你的产品了！🚀</p>
      </TutorialStep>
    </ol>
  );
}
