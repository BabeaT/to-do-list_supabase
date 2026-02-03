-- 1. 创建 todos 表
create table public.todos (
  id uuid not null default gen_random_uuid(), -- 自动生成唯一 ID
  user_id uuid not null default auth.uid(),   -- 自动关联当前登录用户
  title text not null,                        -- 任务标题
  completed boolean not null default false,   -- 是否完成，默认为未完成
  image_url text,                             -- 附件图片地址
  created_at timestamp with time zone not null default now(), -- 创建时间
  
  -- 主键约束
  constraint todos_pkey primary key (id),
  -- 外键约束：关联 auth.users 表，当用户被删除时，其 todo 也会被级联删除
  constraint todos_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
);

-- 2. 启用行级安全策略 (RLS)
alter table public.todos enable row level security;

-- 3. 创建安全策略 (Policies)

-- 策略：允许用户查看(SELECT)自己的 todos
create policy "Users can view their own todos"
on public.todos
for select
to authenticated
using (auth.uid() = user_id);

-- 策略：允许登录用户创建(INSERT)自己的 todos
-- 这里的 with check 确保用户只能为自己创建 todo
create policy "Users can insert their own todos"
on public.todos
for insert
to authenticated
with check (auth.uid() = user_id);

-- 策略：允许用户更新(UPDATE)自己的 todos (例如标记完成)
create policy "Users can update their own todos"
on public.todos
for update
to authenticated
using (auth.uid() = user_id);

-- 策略：允许用户删除(DELETE)自己的 todos
create policy "Users can delete their own todos"
on public.todos
for delete
to authenticated
using (auth.uid() = user_id);
