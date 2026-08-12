import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, X, Calendar, CheckCircle2, RefreshCw, AlertCircle, ListTodo } from 'lucide-react';
import { createGoogleTask, fetchGoogleTasks, completeGoogleTask, TaskItem } from '../lib/tasksIntegration';
import { googleSignIn } from '../lib/auth';

interface GoogleTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'info' | 'push') => void;
  googleToken: string | null;
  setGoogleToken: (token: string | null) => void;
}

export function GoogleTasksModal({
  isOpen,
  onClose,
  showToast,
  googleToken,
  setGoogleToken
}: GoogleTasksModalProps) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadTasks();
    }
  }, [isOpen, googleToken]);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      if (!googleToken) {
        // Will ask user to sign in when needed or on load if opened
        return;
      }
      const items = await fetchGoogleTasks();
      setTasks(items);
    } catch (e: any) {
      if (
        e?.code !== 'auth/popup-closed-by-user' &&
        e?.code !== 'auth/cancelled-popup-request' &&
        !e?.message?.includes('popup-closed-by-user')
      ) {
        console.error(e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const ensureAuth = async (): Promise<boolean> => {
    if (googleToken) return true;
    try {
      const res = await googleSignIn();
      if (res?.accessToken) {
        setGoogleToken(res.accessToken);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Google Tasks', 'Введіть назву завдання', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const authed = await ensureAuth();
      if (!authed) return;

      await createGoogleTask({
        title: title.trim(),
        notes: notes.trim() || undefined,
        due: dueDate || undefined
      });

      showToast('Google Tasks', 'Завдання успешно додано в Google Tasks!', 'success');
      setTitle('');
      setNotes('');
      setDueDate('');
      await loadTasks();
    } catch (err: any) {
      console.error(err);
      showToast('Google Tasks', 'Помилка створення завдання', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      setCompletingTaskId(taskId);
      await completeGoogleTask(taskId);
      showToast('Google Tasks', 'Завдання позначено виконаним', 'success');
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (e) {
      showToast('Google Tasks', 'Не вдалося оновити статус завдання', 'error');
    } finally {
      setCompletingTaskId(null);
    }
  };

  const handleQuickPreset = (presetTitle: string, presetNotes: string) => {
    setTitle(presetTitle);
    setNotes(presetNotes);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDueDate(tomorrow.toISOString().split('T')[0]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0C1322] border border-violet-500/40 rounded-3xl overflow-hidden shadow-2xl p-5 space-y-4 relative max-h-[90vh] flex flex-col">
        
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 bg-violet-500/10 rounded-full filter blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-center border-b border-violet-500/20 pb-3 relative z-10 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-violet-500/20 border border-violet-400/40 text-violet-300 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-violet-300" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">
                Google Tasks Нагадування
              </h3>
              <p className="text-[10px] text-violet-300/70 font-medium">
                Синхронізація платіжних завдань
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto space-y-4 pr-1 relative z-10 flex-1 custom-scrollbar">
          
          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-violet-200/60 uppercase font-bold tracking-wider block">
              Швидкі фінансові шаблони:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickPreset('Оплатити комунальні послуги 💡', 'Перевірити лічильники та сплатити платіжку через Ne•OBank App')}
                className="p-2 rounded-xl bg-[#121826] border border-violet-500/20 hover:border-violet-400/50 text-left text-[11px] text-violet-200 hover:text-white transition"
              >
                💡 Оплата комуналки
              </button>

              <button
                type="button"
                onClick={() => handleQuickPreset('Поповнити Банку / Накопичення 🏺', 'Перерахувати відсоток доходу в заначку')}
                className="p-2 rounded-xl bg-[#121826] border border-violet-500/20 hover:border-violet-400/50 text-left text-[11px] text-violet-200 hover:text-white transition"
              >
                🏺 Заначка в Банку
              </button>

              <button
                type="button"
                onClick={() => handleQuickPreset('Поповнити конверт «Продукти» ✉️', 'Розподілити готівку за конвертами')}
                className="p-2 rounded-xl bg-[#121826] border border-violet-500/20 hover:border-violet-400/50 text-left text-[11px] text-violet-200 hover:text-white transition"
              >
                ✉️ Конверти готівки
              </button>

              <button
                type="button"
                onClick={() => handleQuickPreset('Резервне копіювання виписки 📊', 'Створити щомісячний бекап у Google Sheets / Docs')}
                className="p-2 rounded-xl bg-[#121826] border border-violet-500/20 hover:border-violet-400/50 text-left text-[11px] text-violet-200 hover:text-white transition"
              >
                📊 Бекап у Sheets
              </button>
            </div>
          </div>

          {/* Form Create Task */}
          <form onSubmit={handleCreateTask} className="p-3.5 rounded-2xl bg-[#121826] border border-violet-500/25 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
              <Plus className="w-3.5 h-3.5 text-violet-400" />
              <span>Створити нове завдання</span>
            </h4>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="Назва завдання (напр. Сплатити кредит)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-[#090D16] border border-violet-500/20 rounded-xl text-xs text-white placeholder-violet-200/40 focus:outline-none focus:border-violet-400/60"
              />

              <input
                type="text"
                placeholder="Примітка або деталі (необов'язково)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-[#090D16] border border-violet-500/20 rounded-xl text-xs text-white placeholder-violet-200/40 focus:outline-none focus:border-violet-400/60"
              />

              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-violet-400 shrink-0" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#090D16] border border-violet-500/20 rounded-xl text-xs text-white focus:outline-none focus:border-violet-400/60"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-extrabold text-xs shadow-lg shadow-violet-500/20 flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckSquare className="w-4 h-4" />
                  <span>Додати в Google Tasks</span>
                </>
              )}
            </button>
          </form>

          {/* Existing Google Tasks List */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-violet-200/60 uppercase font-bold tracking-wider block">
                Активні завдання з Google Tasks:
              </span>
              <button
                type="button"
                onClick={loadTasks}
                disabled={isLoading}
                className="text-[10px] text-violet-300 hover:text-white flex items-center space-x-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Оновити</span>
              </button>
            </div>

            {!googleToken ? (
              <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-center space-y-2">
                <p className="text-xs text-amber-200/80">Потрібна авторизація для синхронізації списку Google Tasks</p>
                <button
                  type="button"
                  onClick={async () => {
                    const authed = await ensureAuth();
                    if (authed) loadTasks();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition"
                >
                  Увійти з Google
                </button>
              </div>
            ) : isLoading ? (
              <div className="p-4 text-center text-xs text-violet-200/50 flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin text-violet-400" />
                <span>Завантаження списку завдань...</span>
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[#121826] border border-violet-500/15 text-center text-xs text-violet-200/50 space-y-1">
                <ListTodo className="w-6 h-6 text-violet-400/30 mx-auto" />
                <p>Активних фінансових завдань немає</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {tasks.map(task => (
                  <div key={task.id} className="p-2.5 rounded-xl bg-[#121826] border border-violet-500/20 flex items-start justify-between space-x-2">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-white">{task.title}</p>
                      {task.notes && <p className="text-[11px] text-violet-200/60 leading-tight">{task.notes}</p>}
                      {task.due && (
                        <p className="text-[10px] text-amber-300/80 font-mono">
                          Термін: {new Date(task.due).toLocaleDateString('uk-UA')}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => task.id && handleCompleteTask(task.id)}
                      disabled={completingTaskId === task.id}
                      className="p-1.5 rounded-lg bg-violet-500/10 hover:bg-emerald-500/20 border border-violet-500/30 hover:border-emerald-400 text-violet-300 hover:text-emerald-300 text-xs font-bold transition shrink-0"
                      title="Позначити виконаним"
                    >
                      {completingTaskId === task.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
