import React, { useState } from 'react';
import { Check, Calendar, Clock, User, Stethoscope, Tag, AlertCircle, Edit3, CheckCircle2, ShieldCheck, MessageSquare } from 'lucide-react';
import { AppointmentDraft } from '../types.js';

interface ConfirmationCardProps {
  draft: AppointmentDraft;
  onConfirm: (draft: AppointmentDraft) => Promise<boolean>;
  onModify: (draft: AppointmentDraft) => void;
  isConfirmed?: boolean;
  appointmentId?: string;
}

export const ConfirmationCard: React.FC<ConfirmationCardProps> = ({
  draft,
  onConfirm,
  onModify,
  isConfirmed: initialConfirmed = false,
  appointmentId
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(initialConfirmed);
  const [savedId, setSavedId] = useState(appointmentId);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const ok = await onConfirm(draft);
      if (ok) {
        setConfirmed(true);
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка создания записи');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateHuman = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const months = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
      ];
      return `${d} ${months[m - 1]}`;
    } catch {
      return dateStr;
    }
  };

  if (confirmed) {
    return (
      <div className="mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl shadow-xs text-slate-800">
        <div className="flex items-center gap-2.5 text-emerald-800 font-semibold mb-2">
          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-emerald-900">Запись успешно подтверждена!</div>
            {savedId && <div className="text-xs text-emerald-700 font-normal">Номер бронирования: #{savedId}</div>}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xs p-3 rounded-lg border border-emerald-100 text-xs space-y-1.5 mb-3">
          <div className="flex justify-between">
            <span className="text-slate-500">Пациент:</span>
            <span className="font-medium text-slate-800">{draft.patientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Телефон:</span>
            <span className="font-medium text-slate-800">{draft.patientPhone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Услуга:</span>
            <span className="font-medium text-slate-800">{draft.serviceName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Врач:</span>
            <span className="font-medium text-slate-800">{draft.doctorName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Дата и время:</span>
            <span className="font-bold text-emerald-800">{formatDateHuman(draft.date)}, {draft.time}</span>
          </div>
          <div className="flex justify-between border-t border-emerald-100 pt-1.5">
            <span className="text-slate-500">Стоимость:</span>
            <span className="font-bold text-slate-900">{draft.price.toLocaleString('ru-RU')} ₸</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Напоминания за 24 часа и за 2 часа до визита активированы. Ждем вас!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 p-4 bg-white border-2 border-teal-500/80 rounded-xl shadow-sm text-slate-800">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
          <span className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Запись на приём
          </span>
        </div>
        <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md font-medium border border-teal-200">
          Ожидает подтверждения
        </span>
      </div>

      <div className="space-y-2 text-xs sm:text-sm mb-4">
        <div className="flex items-center gap-2 text-slate-700">
          <User className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-slate-500 w-20">Пациент:</span>
          <span className="font-semibold text-slate-900">{draft.patientName}</span>
        </div>

        <div className="flex items-center gap-2 text-slate-700">
          <Tag className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-slate-500 w-20">Услуга:</span>
          <span className="font-semibold text-teal-700">{draft.serviceName}</span>
        </div>

        <div className="flex items-center gap-2 text-slate-700">
          <Stethoscope className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-slate-500 w-20">Врач:</span>
          <span className="font-medium text-slate-900">{draft.doctorName}</span>
        </div>

        <div className="flex items-center gap-2 text-slate-700">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-slate-500 w-20">Дата:</span>
          <span className="font-medium text-slate-900">{formatDateHuman(draft.date)}</span>
        </div>

        <div className="flex items-center gap-2 text-slate-700">
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-slate-500 w-20">Время:</span>
          <span className="font-bold text-slate-900">{draft.time}</span>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-slate-900">
          <span className="text-slate-500 w-20 pl-6">Стоимость:</span>
          <span className="font-bold text-base text-slate-900">
            {draft.price.toLocaleString('ru-RU')} ₸
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Required Buttons from Prompt: [Подтвердить] [Изменить] */}
      <div className="flex items-center gap-2 pt-1">
        <button
          id="btn-confirm-booking"
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs sm:text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-4 h-4" />
              Подтвердить
            </>
          )}
        </button>

        <button
          id="btn-modify-booking"
          onClick={() => onModify(draft)}
          disabled={isSubmitting}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs sm:text-sm py-2.5 px-4 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
        >
          <Edit3 className="w-4 h-4" />
          Изменить
        </button>
      </div>

      <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
        <span>Слот резервируется мгновенно в расписании клиники</span>
      </div>
    </div>
  );
};
