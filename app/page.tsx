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
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  const [uploading, setUploading] = useState(false);
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

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      router.push('/auth/login');
      return;
    }
    if (!newTodo.trim() && !selectedFile) return;

    const supabase = createClient();
    let imageUrl = null;

    if (selectedFile) {
      setUploading(true);
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('my todo')
        .upload(filePath, selectedFile);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        alert('图片上传失败: ' + uploadError.message);
        setUploading(false);
        return;
      }

      const { data } = supabase.storage
        .from('my todo')
        .getPublicUrl(filePath);
        
      imageUrl = data.publicUrl;
      setUploading(false);
    }
    
    // 乐观更新 UI (可选，这里先不乐观更新添加操作，等待服务器返回以获取真实 ID)
    // 如果需要极速体验可以生成临时 ID，但这里为了简单直接等待返回
    
    const { data, error } = await supabase
      .from('todos')
      .insert([
        { 
          title: newTodo,
          image_url: imageUrl
          // user_id 会由数据库默认值 auth.uid() 自动填充，且受 RLS 保护
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding todo:', error);
      alert('添加任务失败: ' + error.message);
    } else if (data) {
      setTodos([data, ...todos]);
      setNewTodo('');
      clearFile();
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
              <div className="flex flex-col gap-3">
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
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`h-14 w-14 p-0 ${
                      isDark
                        ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                        : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200'
                    } rounded-2xl transition-all duration-300`}
                  >
                    <ImageIcon className="w-6 h-6" />
                  </Button>

                  <Button
                    type="submit"
                    disabled={uploading}
                    className={`h-14 px-8 ${
                      isDark
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
                        : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                    } text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
                  >
                    {uploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-5 h-5" />}
                  </Button>
                </div>
                
                {previewUrl && (
                  <div className="relative inline-block self-start">
                    <img src={previewUrl} alt="Preview" className="h-20 w-auto rounded-lg border border-white/20" />
                    <button
                      type="button"
                      onClick={clearFile}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
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
