import React, { useState } from 'react';
import { Bell, MessageSquare, Send, CheckCircle2, Clock, Smartphone, Settings, AlertCircle, RefreshCw } from 'lucide-react';
import { ReminderSettings, ReminderLog, Appointment } from '../types.js';

interface RemindersAdminProps {
  settings: ReminderSettings;
  logs: ReminderLog[];
  appointments: Appointment[];
  onRefresh: () => void;
}

export const RemindersAdmin: React.FC<RemindersAdminProps> = ({
  settings,
  logs,
  appointments,
  onRefresh
}) => {
  const [localSettings, setLocalSettings] = useState<ReminderSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);

  const handleToggle = async (key: keyof ReminderSettings) => {
    const updated = {
      ...localSettings,
      [key]: !localSettings[key]
    };
    setLocalSettings(updated);
    await saveSettings(updated);
  };

  const saveSettings = async (updated: ReminderSettings) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/reminders/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (!res.ok) throw new Error('Ошибка обновления настроек');
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestTrigger = async (type: '24h' | '2h') => {
    const apt = appointments[0];
    if (!apt) {
      alert('Нет активных записей для отправки теста');
      return;
    }

    try {
      const res = await fetch('/api/reminders/trigger-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: apt.id, type })
      });
      if (!res.ok) throw new Error('Ошибка отправки теста');
      const data = await res.json();
      setTestSuccess(`Тестовое напоминание (${type === '24h' ? '24 часа' : '2 часа'}) успешно отправлено пациенту ${apt.patientName}!`);
      setTimeout(() => setTestSuccess(null), 5000);
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Ошибка тестирования');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-600" />
            Автоматическая система напоминаний
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Уведомления за 24 часа и за 2 часа до визита через WhatsApp и SMS для снижения процента неявок
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
          title="Обновить журнал"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {testSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs sm:text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{testSuccess}</span>
        </div>
      )}

      {/* Main Settings & Phone Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Settings */}
        <div className="lg:col-span-2 space-y-4">
          {/* 24 Hours Rule Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                  24ч
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Напоминание за 24 часа до визита
                  </h3>
                  <p className="text-xs text-slate-500">
                    Отправляется накануне приёма в назначенное время
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => handleToggle('enable24h')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  localSettings.enable24h ? 'bg-teal-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    localSettings.enable24h ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Шаблон текста (24 часа):
              </label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-mono leading-relaxed">
                {localSettings.template24h}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Доступные переменные: {'{patientName}'}, {'{time}'}, {'{date}'}, {'{serviceName}'}
                </span>
                <button
                  onClick={() => handleTestTrigger('24h')}
                  className="text-xs font-medium text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Тест 24h
                </button>
              </div>
            </div>
          </div>

          {/* 2 Hours Rule Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                  2ч
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Напоминание за 2 часа до визита
                  </h3>
                  <p className="text-xs text-slate-500">
                    Экспресс-напоминание в день приёма
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => handleToggle('enable2h')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  localSettings.enable2h ? 'bg-teal-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    localSettings.enable2h ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Шаблон текста (2 часа):
              </label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-mono leading-relaxed">
                {localSettings.template2h}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Доступные переменные: {'{patientName}'}, {'{time}'}
                </span>
                <button
                  onClick={() => handleTestTrigger('2h')}
                  className="text-xs font-medium text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Тест 2h
                </button>
              </div>
            </div>
          </div>

          {/* Channels Selection */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-teal-600" />
              Каналы доставки уведомлений
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <label
                onClick={() => handleToggle('whatsappEnabled')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  localSettings.whatsappEnabled ? 'bg-emerald-50/60 border-emerald-300' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">WhatsApp Business</div>
                    <div className="text-[11px] text-slate-500">Высокая открываемость</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.whatsappEnabled}
                  onChange={() => {}}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              <label
                onClick={() => handleToggle('smsEnabled')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  localSettings.smsEnabled ? 'bg-teal-50/60 border-teal-300' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">SMS-шлюз</div>
                    <div className="text-[11px] text-slate-500">Резервный канал</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.smsEnabled}
                  onChange={() => {}}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Col: Phone Mockup Simulation */}
        <div>
          <div className="bg-slate-900 rounded-3xl p-4 shadow-xl border-4 border-slate-800 text-white">
            <div className="flex items-center justify-between px-2 pb-3 border-b border-slate-800 text-[11px] text-slate-400">
              <span>09:41</span>
              <div className="flex items-center gap-1">
                <span>DentaCare</span>
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
            </div>

            <div className="py-4 space-y-3 min-h-[340px]">
              <div className="text-center">
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                  Сегодня, 09:30
                </span>
              </div>

              {/* Sample WhatsApp message bubble */}
              <div className="bg-emerald-950/80 border border-emerald-800/60 p-3.5 rounded-2xl rounded-tl-xs text-xs space-y-1.5 shadow-sm">
                <div className="font-bold text-emerald-300 text-[11px] flex items-center justify-between">
                  <span>Стоматология DentaCare</span>
                  <span className="text-[10px] text-emerald-400/80">09:30</span>
                </div>
                <p className="text-emerald-100 text-xs leading-relaxed">
                  Здравствуйте, Алия! Напоминаем, что завтра в 14:00 у вас приём в нашей стоматологии (Профессиональная чистка, врач Dr. Ivan).
                </p>
                <div className="pt-1 text-[10px] text-emerald-300/70 border-t border-emerald-900/50">
                  Адрес: пр. Достык 128 (парковка бесплатная)
                </div>
              </div>

              {/* 2 hours prior bubble */}
              <div className="bg-emerald-950/80 border border-emerald-800/60 p-3.5 rounded-2xl rounded-tl-xs text-xs space-y-1.5 shadow-sm">
                <div className="font-bold text-emerald-300 text-[11px] flex items-center justify-between">
                  <span>Стоматология DentaCare</span>
                  <span className="text-[10px] text-emerald-400/80">12:00</span>
                </div>
                <p className="text-emerald-100 text-xs leading-relaxed">
                  Напоминаем, что сегодня в 14:00 у вас приём. Будем рады видеть вас!
                </p>
              </div>
            </div>

            <div className="text-center pt-2 text-[11px] text-slate-500">
              Вид сообщения на смартфоне пациента
            </div>
          </div>
        </div>
      </div>

      {/* Outbox & Sent Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Журнал отправки напоминаний ({logs.length})
            </h3>
          </div>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {logs.map(log => (
            <div
              key={log.id}
              className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                  log.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {log.type}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.patientName}</span>
                    <span className="font-mono text-slate-500">{log.patientPhone}</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium text-[10px]">
                      {log.channel}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1 line-clamp-1 max-w-xl">
                    {log.messageText}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                  log.status === 'sent' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {log.status === 'sent' ? 'Отправлено' : 'Запланировано'}
                </span>
                <span className="text-slate-400 text-[11px]">
                  {log.sentAt ? new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ожидает'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
