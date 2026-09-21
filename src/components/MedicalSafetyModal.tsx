import React from 'react';
import { X, ShieldAlert, AlertTriangle, Stethoscope, CheckCircle2, PhoneCall, HeartPulse } from 'lucide-react';
import { ClinicInfo } from '../types.js';

interface MedicalSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicInfo: ClinicInfo;
}

export const MedicalSafetyModal: React.FC<MedicalSafetyModalProps> = ({
  isOpen,
  onClose,
  clinicInfo
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-amber-500 text-white p-4 sm:p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Медицинская безопасность AI</h3>
              <p className="text-xs text-amber-100">Стандарты работы электронного администратора</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-sm text-slate-700">
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900">
              <span className="font-bold">AI — это администратор, а НЕ лечащий врач!</span>
              <p className="mt-1 text-amber-800">
                AI-ассистент помогает с навигацией, отвечает на организационные вопросы, подбирает удобное время и фиксирует бронирование.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Строгие ограничения алгоритма:
            </div>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li className="flex items-start gap-2 text-slate-700">
                <span className="w-4 h-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✕</span>
                <span><strong>Не ставит диагнозы</strong> по жалобам в чате.</span>
              </li>
              <li className="flex items-start gap-2 text-slate-700">
                <span className="w-4 h-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✕</span>
                <span><strong>Не назначает лекарства</strong>, рецептурные препараты или антибиотики.</span>
              </li>
              <li className="flex items-start gap-2 text-slate-700">
                <span className="w-4 h-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✕</span>
                <span><strong>Не дает гарантий</strong> исхода медицинских вмешательств без очного осмотра.</span>
              </li>
            </ul>
          </div>

          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-800 uppercase tracking-wide">
              <HeartPulse className="w-4 h-4 text-rose-600" />
              Протокол при острой боли и экстренных ситуациях:
            </div>
            <p className="text-xs text-rose-900 leading-relaxed">
              При наличии острой нестерпимой боли, отека щеки, кровотечения или травмы челюсти — система предлагает незамедлительный очный приём вне очереди у дежурного врача клиники.
            </p>
            <div className="pt-1 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">Экстренный дежурный номер:</span>
              <a
                href={`tel:${clinicInfo.phone.replace(/[^0-9+]/g, '')}`}
                className="text-xs font-bold text-rose-700 hover:text-rose-800 flex items-center gap-1"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                {clinicInfo.phone}
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};
