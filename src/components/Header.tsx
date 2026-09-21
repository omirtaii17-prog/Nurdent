import React from 'react';
import { Sparkles, Phone, MessageSquare, Calendar, Stethoscope, Users, Bell, HelpCircle, ShieldAlert, Clock, MapPin, PhoneCall, ChevronRight } from 'lucide-react';
import { ClinicInfo } from '../types.js';

interface HeaderProps {
  clinicInfo: ClinicInfo;
  activeTab: 'chat' | 'schedule' | 'services' | 'doctors' | 'reminders' | 'faq';
  onTabChange: (tab: 'chat' | 'schedule' | 'services' | 'doctors' | 'reminders' | 'faq') => void;
  onOpenSafetyModal: () => void;
  onOpenGis?: () => void;
  onOpenVoice?: () => void;
  onOpenBooking?: () => void;
  pendingRemindersCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  clinicInfo,
  activeTab,
  onTabChange,
  onOpenSafetyModal,
  onOpenGis,
  onOpenVoice,
  onOpenBooking,
  pendingRemindersCount = 0
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      {/* Top micro bar with real clinic contact info & 2GIS route */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-[11px] sm:text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Клиника открыта: {clinicInfo.workingHoursWeekdays}</span>
            </span>

            {/* Interactive 2GIS button */}
            <button
              id="header-2gis-button"
              onClick={onOpenGis}
              className="flex items-center gap-1 text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-900 px-2 py-0.5 rounded-md border border-emerald-500/30 transition-colors cursor-pointer font-medium"
              title="Открыть интерактивную схему проезда и маршрут в 2GIS"
            >
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span>📍 Как нас найти (2GIS)</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-[11px] sm:text-xs">
            {/* Voice call button */}
            {onOpenVoice && (
              <button
                onClick={onOpenVoice}
                className="flex items-center gap-1 text-teal-300 hover:text-white transition-colors cursor-pointer"
                title="AI-Голосовой телефонный ассистент"
              >
                <PhoneCall className="w-3.5 h-3.5 text-teal-400" />
                <span className="font-medium">AI-Телефония</span>
              </button>
            )}

            <button
              onClick={onOpenSafetyModal}
              className="hidden sm:flex items-center gap-1 text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
              title="Правила медицинской безопасности AI"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="underline decoration-amber-400/50">Медбезопасность</span>
            </button>

            <a
              href={`tel:${clinicInfo.phone.replace(/[^0-9+]/g, '')}`}
              className="flex items-center gap-1 text-slate-200 hover:text-white transition-colors font-medium"
            >
              <Phone className="w-3 h-3 text-teal-400" />
              <span>{clinicInfo.phone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Logo & Identity */}
          <div className="flex items-center justify-between">
            <div
              onClick={() => onTabChange('chat')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-teal-100" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight group-hover:text-teal-700 transition-colors">
                    {clinicInfo.name}
                  </h1>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                    AI Receptionist
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Умный ресепшен • Подбор врачей • Реальные слоты • До/После
                </p>
              </div>
            </div>

            {/* Quick action buttons on mobile */}
            <div className="flex items-center gap-1.5 lg:hidden">
              {onOpenBooking && (
                <button
                  onClick={onOpenBooking}
                  className="px-3 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Записаться
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs & Actions */}
          <div className="flex items-center justify-between lg:justify-end gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <nav className="flex items-center gap-1">
              <button
                id="tab-chat"
                onClick={() => onTabChange('chat')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-teal-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Чат с AI</span>
              </button>

              <button
                id="tab-doctors"
                onClick={() => onTabChange('doctors')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'doctors'
                    ? 'bg-teal-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Врачи и До/После</span>
              </button>

              <button
                id="tab-services"
                onClick={() => onTabChange('services')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'services'
                    ? 'bg-teal-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                <span>Услуги и Прайс</span>
              </button>

              <button
                id="tab-schedule"
                onClick={() => onTabChange('schedule')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'schedule'
                    ? 'bg-teal-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Расписание</span>
              </button>

              <button
                id="tab-reminders"
                onClick={() => onTabChange('reminders')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer relative ${
                  activeTab === 'reminders'
                    ? 'bg-teal-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>Напоминания</span>
                {pendingRemindersCount > 0 && (
                  <span className="ml-0.5 w-4 h-4 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {pendingRemindersCount}
                  </span>
                )}
              </button>

              <button
                id="tab-faq"
                onClick={() => onTabChange('faq')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'faq'
                    ? 'bg-teal-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>База знаний</span>
              </button>
            </nav>

            {/* Primary booking button for desktop */}
            {onOpenBooking && (
              <button
                id="header-book-button"
                onClick={onOpenBooking}
                className="hidden lg:flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0 ml-2"
              >
                <span>Записаться</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
