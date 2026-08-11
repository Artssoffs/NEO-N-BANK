import React from 'react';
import { Cloud, FileText, X, AlertTriangle, ShieldAlert, CheckCircle2, RefreshCw, Table, CheckSquare } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { uk } from 'date-fns/locale';

interface SyncReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportSheets?: () => Promise<void>;
  onExportDocs: () => Promise<void>;
  onExportKeep: () => Promise<void>;
  onOpenTasks?: () => void;
  lastSyncDate?: string;
  isExporting: boolean;
  onSnooze30Days: () => void;
}

export function SyncReminderModal({
  isOpen,
  onClose,
  onExportSheets,
  onExportDocs,
  onExportKeep,
  onOpenTasks,
  lastSyncDate,
  isExporting,
  onSnooze30Days,
}: SyncReminderModalProps) {
  if (!isOpen) return null;

  const daysElapsed = lastSyncDate
    ? differenceInDays(new Date(), new Date(lastSyncDate))
    : 30;

  const formattedLastSync = lastSyncDate
    ? format(new Date(lastSyncDate), 'd MMMM yyyy, HH:mm', { locale: uk })
    : 'Ніколи (понад 30 днів тому)';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0C1322] border border-cyan-500/40 rounded-3xl overflow-hidden shadow-2xl p-5 space-y-4 relative">
        
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 bg-emerald-500/10 rounded-full filter blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-start border-b border-cyan-500/20 pb-3 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/30 to-cyan-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0">
              <Table className="w-5 h-5 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">
                Резервне Копіювання Даних
              </h3>
              <p className="text-[10px] text-cyan-300/70 font-medium">
                NEO-N•BANK Workspace Integration
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

        {/* Sync Status Banner */}
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-2 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider">Увага: минуло {daysElapsed} днів</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[9px] font-mono font-bold">
              Регулярний бекап
            </span>
          </div>

          <p className="text-xs text-white/90 leading-relaxed">
            Ви давно не оновлювали резервну копію транзакцій. Збережіть ваші дані в <b>Google Sheets</b>, <b>Google Docs</b> або <b>Google Keep</b>, щоб уникнути втрати фінансової історії.
          </p>

          <div className="pt-2 border-t border-amber-500/20 text-[10px] text-cyan-200/60 font-mono">
            <span>Остання резервна копія: </span>
            <span className="text-cyan-300 font-bold">{formattedLastSync}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 relative z-10">
          <span className="text-[10px] text-cyan-200/60 uppercase font-bold tracking-wider block px-1">
            Оберіть сервіс Google для бекапу:
          </span>

          {onExportSheets && (
            <button
              onClick={onExportSheets}
              disabled={isExporting}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-between transition active:scale-[0.98] disabled:opacity-50"
            >
              <div className="flex items-center space-x-2.5">
                <Table className="w-4 h-4 text-black" />
                <span>Експортувати у Google Sheets (Таблиці)</span>
              </div>
              {isExporting ? (
                <RefreshCw className="w-4 h-4 animate-spin text-black" />
              ) : (
                <span className="text-[10px] font-mono bg-black/20 px-2 py-0.5 rounded text-black font-bold">Sheets</span>
              )}
            </button>
          )}

          <button
            onClick={onExportDocs}
            disabled={isExporting}
            className="w-full p-3 rounded-2xl bg-[#121721] hover:bg-[#1A2130] border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center justify-between transition active:scale-[0.98] disabled:opacity-50"
          >
            <div className="flex items-center space-x-2.5">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Експортувати виписку в Google Docs</span>
            </div>
            {isExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            ) : (
              <span className="text-[10px] font-mono bg-cyan-500/20 px-2 py-0.5 rounded text-cyan-300 font-bold">Docs</span>
            )}
          </button>

          <button
            onClick={onExportKeep}
            disabled={isExporting}
            className="w-full p-3 rounded-2xl bg-[#121721] hover:bg-[#1A2130] border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-between transition active:scale-[0.98] disabled:opacity-50"
          >
            <div className="flex items-center space-x-2.5">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Створити нотатку в Google Keep</span>
            </div>
            {isExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <span className="text-[10px] font-mono bg-amber-500/20 px-2 py-0.5 rounded text-amber-300 font-bold">Keep</span>
            )}
          </button>

          {onOpenTasks && (
            <button
              onClick={() => {
                onClose();
                onOpenTasks();
              }}
              className="w-full p-3 rounded-2xl bg-[#121721] hover:bg-[#1A2130] border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center justify-between transition active:scale-[0.98]"
            >
              <div className="flex items-center space-x-2.5">
                <CheckSquare className="w-4 h-4 text-cyan-400" />
                <span>Планувальник в Google Tasks</span>
              </div>
              <span className="text-[10px] font-mono bg-cyan-500/20 px-2 py-0.5 rounded text-cyan-300 font-bold">Tasks</span>
            </button>
          )}
        </div>

        {/* Secondary options */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-cyan-500/15 relative z-10">
          <button
            onClick={onClose}
            className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition"
          >
            Нагадати пізніше
          </button>

          <button
            onClick={onSnooze30Days}
            className="py-2.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition"
          >
            Сховати на 30 днів
          </button>
        </div>

      </div>
    </div>
  );
}
