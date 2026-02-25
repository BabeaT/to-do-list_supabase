'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  Image as ImageIcon,
  X,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Todo = {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  image_url?: string;
  created_at: string;
};

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isDark, setIsDark] = useState(true);
  
  // 图片上传相关状态
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [progressPercentage, setProgressPercentage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const loadTodos = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading todos:', error);
      // 可以添加一个 toast 通知
    } else {
      setTodos(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (userId) {
      loadTodos();

      // 订阅实时更新
      const supabase = createClient();
      const channel = supabase
        .channel('realtime todos')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: `user_id=eq.${userId}`,
        }, (payload) => {
          console.log('Realtime update:', payload);
          if (payload.eventType === 'INSERT') {
            setTodos((prev) => {
              if (prev.find(t => t.id === payload.new.id)) return prev;
              return [payload.new as Todo, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setTodos((prev) => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } as Todo : t));
          } else if (payload.eventType === 'DELETE') {
            setTodos((prev) => prev.filter(t => t.id !== payload.old.id));
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
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
    setTodos([]); // 清空 todos
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('文件大小不能超过 5MB');
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      router.push('/auth/login');
      return;
    }
    if (!newTodo.trim() && !selectedFile) return;

    setIsSubmitting(true);
    setProgressMessage('正在处理请求...');
    setProgressPercentage(10); // 初始进度
    const supabase = createClient();
    let imageUrl = null;
    let base64Image = null;

    try {
      if (selectedFile) {
        setProgressMessage('正在上传图片...');
        setProgressPercentage(30); // 开始上传
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        // 并行执行：上传到 Supabase 和 转换为 Base64
        const [uploadResult, base64Result] = await Promise.all([
          supabase.storage.from('my todo').upload(filePath, selectedFile),
          convertToBase64(selectedFile)
        ]);

        const { error: uploadError } = uploadResult;
        base64Image = base64Result;

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          alert('图片上传失败: ' + uploadError.message);
          setIsSubmitting(false);
          return;
        }

        const { data } = supabase.storage
          .from('my todo')
          .getPublicUrl(filePath);
          
        imageUrl = data.publicUrl;
        setProgressPercentage(60); // 上传完成
      }
      
      setProgressMessage('正在智能分析生成待办事项...');
      if (!selectedFile) setProgressPercentage(40); // 如果没有图片，直接跳到 AI 分析阶段

      // 模拟一点 AI 思考的进度条动画（因为 fetch 是 blocking 的，没法获得真实进度）
      const interval = setInterval(() => {
        setProgressPercentage((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 5;
        });
      }, 500);

      // 调用后端 API 解析待办事项
      const response = await fetch('/api/generate-todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: newTodo,
          userId: userId,
          imageUrl: imageUrl, // 用于保存到数据库
          base64Image: base64Image, // 用于 AI 分析
        }),
      });

      clearInterval(interval);
      setProgressPercentage(100); // 完成

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate todos');
      }

      // 成功后清空输入
      setNewTodo('');
      clearFile();
      // 这里不需要手动更新 todos，因为有 realtime 订阅，
      // 或者为了更快的反馈，我们可以重新 fetch 一次，但 realtime 应该够快。
      // 为了保险，可以手动 loadTodos 一次。
      // loadTodos(); // 不需要，realtime 会处理
      
    } catch (error: any) {
      console.error('Error adding todo:', error);
      alert('添加任务失败: ' + error.message);
    } finally {
      // 延迟关闭，让用户看到 100%
      setTimeout(() => {
        setIsSubmitting(false);
        setProgressMessage('');
        setProgressPercentage(0);
      }, 500);
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    // 乐观更新
    const originalTodos = [...todos];
    const newCompleted = !completed;
    
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: newCompleted } : todo
    ));

    const supabase = createClient();
    const { error } = await supabase
      .from('todos')
      .update({ completed: newCompleted })
      .eq('id', id);
      
    if (error) {
      console.error('Error toggling todo:', error);
      setTodos(originalTodos); // 回滚
      alert('更新状态失败: ' + error.message);
    }
  };

  const deleteTodo = async (id: string) => {
    // 乐观更新
    const originalTodos = [...todos];
    setTodos(todos.filter(todo => todo.id !== id));

    const supabase = createClient();
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting todo:', error);
      setTodos(originalTodos); // 回滚
      alert('删除任务失败: ' + error.message);
    }
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
      {/* 进度条弹窗 */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`p-8 rounded-3xl shadow-2xl ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'} max-w-sm w-full mx-4 flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300`}>
            <div className="relative w-16 h-16">
              <div className={`absolute inset-0 rounded-full border-4 border-t-transparent animate-spin ${isDark ? 'border-cyan-400' : 'border-blue-600'}`}></div>
              <Sparkles className={`absolute inset-0 m-auto w-8 h-8 ${isDark ? 'text-cyan-400' : 'text-blue-600'} animate-pulse`} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold">AI 正在思考中</h3>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-slate-500'}`}>{progressMessage}</p>
            </div>
            <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
              <div 
                className={`h-full transition-all duration-300 ease-out ${isDark ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gradient-to-r from-blue-600 to-cyan-600'}`}
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

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

            <form onSubmit={addTodo} className="mb-8 group">
              <div
                className={`
                  relative flex flex-col gap-2 p-4 rounded-3xl border transition-all duration-300
                  ${isDark
                    ? 'bg-white/10 border-white/20 focus-within:bg-white/15 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/50'
                    : 'bg-white/80 border-slate-200 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/50 shadow-sm hover:shadow-md focus-within:shadow-lg'
                  }
                  backdrop-blur-xl
                `}
              >
                <Textarea
                  placeholder="添加新任务... (支持自然语言，例如：明天早上买牛奶，下午去健身)"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  rows={3}
                  className={`w-full bg-transparent border-0 p-0 text-lg resize-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-400 min-h-[80px] ${
                    isDark ? 'text-white placeholder:text-white/30' : 'text-slate-800 placeholder:text-slate-400'
                  }`}
                />

                {previewUrl && (
                  <div className="relative inline-block self-start mt-2 animate-in fade-in zoom-in duration-300">
                    <img src={previewUrl} alt="Preview" className="h-24 w-auto rounded-xl border border-white/10 object-cover shadow-sm" />
                    <button
                      type="button"
                      onClick={clearFile}
                      className="absolute -top-2 -right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-red-500 transition-colors backdrop-blur-sm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className={`flex justify-between items-center pt-2 mt-2 border-t ${isDark ? 'border-white/10' : 'border-slate-200/60'}`}>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      className={`
                        h-9 w-9 rounded-full transition-all duration-300
                        ${isDark 
                          ? 'text-white/60 hover:text-white hover:bg-white/10' 
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                        }
                      `}
                      title="上传图片"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || (!newTodo.trim() && !previewUrl)}
                    className={`
                      rounded-full px-6 h-9 transition-all duration-300 font-medium text-sm
                      ${isDark
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                        : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/20'
                      }
                      disabled:opacity-50 disabled:shadow-none transform active:scale-95
                    `}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-1.5">
                        添加 <Plus className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </div>
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
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => toggleTodo(todo.id, todo.completed)}
                        className="flex-shrink-0 mt-1 transition-transform duration-300 hover:scale-110"
                      >
                        {todo.completed ? (
                          <CheckCircle2 className={`w-7 h-7 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                        ) : (
                          <Circle className={`w-7 h-7 ${isDark ? 'text-white/40 hover:text-white/60' : 'text-slate-400 hover:text-slate-600'}`} />
                        )}
                      </button>

                      <div className="flex-1 flex flex-col gap-2">
                        <span
                          className={`text-lg transition-all duration-300 ${
                            todo.completed
                              ? `line-through ${isDark ? 'text-white/40' : 'text-slate-400'}`
                              : isDark ? 'text-white' : 'text-slate-800'
                          }`}
                        >
                          {todo.title}
                        </span>
                        {todo.image_url && (
                          <img 
                            src={todo.image_url} 
                            alt="Attachment" 
                            className="max-h-40 w-auto rounded-lg border border-white/10 self-start object-contain bg-black/20"
                            loading="lazy"
                          />
                        )}
                      </div>

                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className={`flex-shrink-0 p-2 mt-1 ${
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
