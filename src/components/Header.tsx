import React from 'react';
import { Sparkles, Phone, MessageSquare, Calendar, Stethoscope, Users, Bell, HelpCircle, ShieldAlert, Clock, MapPin } from 'lucide-react';
import { ClinicInfo } from '../types.js';

interface HeaderProps {
  clinicInfo: ClinicInfo;
  activeTab: 'chat' | 'schedule' | 'services' | 'doctors' | 'reminders' | 'faq';
  onTabChange: (tab: 'chat' | 'schedule' | 'services' | 'doctors' | 'reminders' | 'faq') => void;
  onOpenSafetyModal: () => void;
  pendingRemindersCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  clinicInfo,
  activeTab,
  onTabChange,
  onOpenSafetyModal,
  pendingRemindersCount = 0
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      {/* Top micro bar with real clinic contact info */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-[11px] sm:text-xs">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Клиника открыта: {clinicInfo.workingHoursWeekdays}
            </span>
            <span className="hidden md:flex items-center gap-1 text-slate-400">
              <MapPin className="w-3 h-3" />
              {clinicInfo.address}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] sm:text-xs">
            <button
              onClick={onOpenSafetyModal}
              className="flex items-center gap-1 text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
              title="Правила медицинской безопасности AI"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="underline decoration-amber-400/50">Медбезопасность (AI — не врач)</span>
            </button>
            <a
              href={`tel:${clinicInfo.phone.replace(/[^0-9+]/g, '')}`}
              className="flex items-center gap-1 text-slate-200 hover:text-white transition-colors"
            >
              <Phone className="w-3 h-3 text-teal-400" />
              <span>{clinicInfo.phone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Identity */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-5 h-5 text-teal-100" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    {clinicInfo.name}
                  </h1>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                    AI Receptionist
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Интеллектуальный администратор для записи пациентов и проверки расписания
                </p>
              </div>
            </div>

            {/* Mobile indicator */}
            <div className="md:hidden flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>AI онлайн</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              id="tab-chat"
              onClick={() => onTabChange('chat')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Чат с AI
            </button>

            <button
              id="tab-schedule"
              onClick={() => onTabChange('schedule')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'schedule'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Расписание
            </button>

            <button
              id="tab-services"
              onClick={() => onTabChange('services')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'services'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              Услуги и Прайс
            </button>

            <button
              id="tab-doctors"
              onClick={() => onTabChange('doctors')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'doctors'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              Врачи
            </button>

            <button
              id="tab-reminders"
              onClick={() => onTabChange('reminders')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer relative ${
                activeTab === 'reminders'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Bell className="w-4 h-4" />
              Напоминания
              {pendingRemindersCount > 0 && (
                <span className="ml-1 w-4 h-4 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingRemindersCount}
                </span>
              )}
            </button>

            <button
              id="tab-faq"
              onClick={() => onTabChange('faq')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'faq'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              FAQ & База знаний
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
