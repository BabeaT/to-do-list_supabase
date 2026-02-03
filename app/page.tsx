'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Sparkles,
  Moon,
  Sun,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Todo = {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  created_at: string;
};

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isDark, setIsDark] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      if (data.user) {
        setUserId(data.user.id);
      } else {
        setUserId(null);
      }
    };
    getUser();
  }, []);

  const loadTodos = useCallback((uid: string) => {
    setLoading(true);
    const mockTodos: Todo[] = [
      {
        id: '1',
        user_id: uid,
        title: '欢迎使用你的清单！',
        completed: false,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        user_id: uid,
        title: '试着添加一个新任务',
        completed: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
    setTodos(mockTodos);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (userId) {
      loadTodos(userId);
    } else {
      setTodos([]);
      setLoading(false);
    }
  }, [loadTodos, userId]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setUserId(null);
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      router.push('/auth/login');
      return;
    }
    if (!newTodo.trim()) return;

    const newTodoItem: Todo = {
      id: Math.random().toString(36).substring(7),
      user_id: userId,
      title: newTodo,
      completed: false,
      created_at: new Date().toISOString(),
    };

    setTodos([newTodoItem, ...todos]);
    setNewTodo('');
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !completed } : todo
    ));
  };

  const deleteTodo = async (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        isDark
          ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900'
          : 'bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100'
      }`}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-20 w-72 h-72 ${isDark ? 'bg-blue-500' : 'bg-blue-300'} rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse`}></div>
        <div className={`absolute top-40 right-20 w-72 h-72 ${isDark ? 'bg-cyan-500' : 'bg-cyan-300'} rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000`}></div>
        <div className={`absolute -bottom-8 left-1/2 w-72 h-72 ${isDark ? 'bg-blue-600' : 'bg-blue-400'} rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-2000`}></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className={`absolute top-8 left-8 flex items-center gap-4 z-10 ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {user ? (
            <>
              <span className="text-sm font-medium">{user.email}</span>
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                size="sm"
                className={isDark ? 'bg-white/10 text-white hover:bg-white/20 border-white/20' : ''}
              >
                退出登录
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                asChild
                className={`${
                  isDark
                    ? 'bg-white/10 text-white hover:bg-white/20 border-white/20'
                    : 'bg-white/60 text-slate-900 hover:bg-white/80 border-slate-200'
                } backdrop-blur-md border transition-all duration-300`}
              >
                <Link href="/auth/login">登录</Link>
              </Button>
              <Button
                asChild
                className={`${
                  isDark
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                } text-white shadow-lg hover:shadow-xl transition-all duration-300`}
              >
                <Link href="/auth/sign-up">注册</Link>
              </Button>
            </div>
          )}
        </div>
        
        <div className="w-full max-w-2xl">
          <button
            onClick={() => setIsDark(!isDark)}
            className={`absolute top-8 right-8 p-3 rounded-full ${
              isDark
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-slate-800/10 text-slate-800 hover:bg-slate-800/20'
            } backdrop-blur-lg transition-all duration-300`}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div
            className={`${
              isDark
                ? 'bg-white/10 backdrop-blur-2xl border-white/20'
                : 'bg-white/70 backdrop-blur-2xl border-white/40'
            } rounded-3xl shadow-2xl border p-8 transition-all duration-500`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className={`w-8 h-8 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
              <h1
                className={`text-4xl font-bold ${
                  isDark
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'
                }`}
              >
                BabeaT 清单
              </h1>
            </div>

            <p className={`${isDark ? 'text-white/60' : 'text-slate-600'} mb-8`}>
              {totalCount === 0
                ? '开启高效的一天！'
                : `已完成 ${completedCount} / ${totalCount}`}
            </p>

            <form onSubmit={addTodo} className="mb-8">
              <div className="flex gap-3">
                <Input
                  type="text"
                  placeholder="添加新任务..."
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  className={`flex-1 h-14 px-6 text-lg ${
                    isDark
                      ? 'bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-cyan-400'
                      : 'bg-white/80 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500'
                  } backdrop-blur-xl rounded-2xl transition-all duration-300`}
                />
                <Button
                  type="submit"
                  className={`h-14 px-8 ${
                    isDark
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                  } text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </form>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className={`w-8 h-8 border-4 ${isDark ? 'border-cyan-400/30 border-t-cyan-400' : 'border-blue-600/30 border-t-blue-600'} rounded-full animate-spin`}></div>
              </div>
            ) : todos.length === 0 ? (
              <div className="text-center py-16">
                <Circle className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-white/20' : 'text-slate-300'}`} />
                <p className={`text-lg ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                  {user ? '还没有任务，先添加一个吧！' : '登录后制定Todo'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {todos.map((todo, index) => (
                  <div
                    key={todo.id}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className={`group ${
                      isDark
                        ? 'bg-white/5 hover:bg-white/10 border-white/10'
                        : 'bg-white/50 hover:bg-white/80 border-white/40'
                    } backdrop-blur-xl rounded-2xl border p-5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4`}
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleTodo(todo.id, todo.completed)}
                        className="flex-shrink-0 transition-transform duration-300 hover:scale-110"
                      >
                        {todo.completed ? (
                          <CheckCircle2 className={`w-7 h-7 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                        ) : (
                          <Circle className={`w-7 h-7 ${isDark ? 'text-white/40 hover:text-white/60' : 'text-slate-400 hover:text-slate-600'}`} />
                        )}
                      </button>

                      <span
                        className={`flex-1 text-lg transition-all duration-300 ${
                          todo.completed
                            ? `line-through ${isDark ? 'text-white/40' : 'text-slate-400'}`
                            : isDark ? 'text-white' : 'text-slate-800'
                        }`}
                      >
                        {todo.title}
                      </span>

                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className={`flex-shrink-0 p-2 ${
                          isDark
                            ? 'text-white/40 hover:text-red-400 hover:bg-red-400/10'
                            : 'text-slate-400 hover:text-red-600 hover:bg-red-100'
                        } rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalCount > 0 && (
              <div className={`mt-8 pt-6 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between text-sm">
                  <span className={isDark ? 'text-white/60' : 'text-slate-600'}>
                    进度
                  </span>
                  <span className={isDark ? 'text-white/80' : 'text-slate-700'}>
                    {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
                  </span>
                </div>
                <div className={`mt-3 h-2 ${isDark ? 'bg-white/10' : 'bg-slate-200'} rounded-full overflow-hidden`}>
                  <div
                    className={`h-full ${
                      isDark
                        ? 'bg-gradient-to-r from-cyan-400 to-blue-400'
                        : 'bg-gradient-to-r from-blue-600 to-cyan-600'
                    } transition-all duration-500 rounded-full`}
                    style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
