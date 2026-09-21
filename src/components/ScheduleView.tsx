import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Stethoscope, CheckCircle2, XCircle, Search, Filter, AlertCircle, Plus, RefreshCw } from 'lucide-react';
import { Appointment, Doctor, Service, SlotInfo } from '../types.js';

interface ScheduleViewProps {
  appointments: Appointment[];
  doctors: Doctor[];
  services: Service[];
  onRefresh: () => void;
  onCancelAppointment: (id: string) => void;
  onOpenBooking?: () => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  appointments,
  doctors,
  services,
  onRefresh,
  onCancelAppointment,
  onOpenBooking
}) => {
  const [selectedDate, setSelectedDate] = useState('2026-09-22');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');
  const [liveSlots, setLiveSlots] = useState<SlotInfo[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('srv-cleaning');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Fetch true free slots for the selected date, service, and doctor
  useEffect(() => {
    fetchSlots();
  }, [selectedDate, selectedDoctorId, selectedServiceId]);

  const fetchSlots = async () => {
    setIsLoadingSlots(true);
    try {
      const docParam = selectedDoctorId !== 'all' ? `&doctorId=${selectedDoctorId}` : '';
      const srvParam = selectedServiceId ? `&serviceId=${selectedServiceId}` : '';
      const res = await fetch(`/api/slots?date=${selectedDate}${docParam}${srvParam}`);
      if (res.ok) {
        const data = await res.json();
        setLiveSlots(data.slots || []);
      }
    } catch (e) {
      console.error('Error fetching live slots', e);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Filter appointments for the selected date & doctor
  const filteredAppointments = appointments.filter(apt => {
    const matchesDate = apt.date === selectedDate;
    const matchesDoctor = selectedDoctorId === 'all' || apt.doctorId === selectedDoctorId;
    return matchesDate && matchesDoctor;
  });

  const getDoctor = (id: string) => doctors.find(d => d.id === id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header with Title and Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            Расписание врачей и журнал записей
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Система учета занятости. Все слоты синхронизированы с базой данных и AI-администратором
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Date buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setSelectedDate('2026-09-21')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedDate === '2026-09-21' ? 'bg-white text-teal-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Сегодня (21 сен)
            </button>
            <button
              onClick={() => setSelectedDate('2026-09-22')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedDate === '2026-09-22' ? 'bg-white text-teal-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Завтра (22 сен)
            </button>
            <button
              onClick={() => setSelectedDate('2026-09-24')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedDate === '2026-09-24' ? 'bg-white text-teal-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              24 сентября
            </button>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="border border-slate-200 bg-white rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />

          <button
            onClick={() => {
              onRefresh();
              fetchSlots();
            }}
            className="p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Обновить данные"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {onOpenBooking && (
            <button
              onClick={onOpenBooking}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Новая запись</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter by Doctor and Service */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
            Фильтр по врачу:
          </label>
          <select
            value={selectedDoctorId}
            onChange={e => setSelectedDoctorId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Все врачи клиники ({doctors.length})</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} — {d.specialty}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
            Проверка слота для услуги:
          </label>
          <select
            value={selectedServiceId}
            onChange={e => setSelectedServiceId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {services.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.duration} мин, {s.price.toLocaleString('ru-RU')} ₸)
              </option>
            ))}
          </select>
        </div>

        <div className="bg-teal-50 border border-teal-200 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-teal-800">Реальные свободные слоты:</div>
            <div className="text-xl font-bold text-teal-900 mt-0.5">
              {isLoadingSlots ? '...' : `${liveSlots.length} доступно`}
            </div>
            <div className="text-[11px] text-teal-700">На {selectedDate} с учетом обедов и записей</div>
          </div>
          <Clock className="w-8 h-8 text-teal-500 opacity-60" />
        </div>
      </div>

      {/* Real-time Available Slots Ribbon */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900">
              Свободные окна на выбранную дату (для AI и пациентов):
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Никогда не выдумываются искусственно
          </span>
        </div>

        {liveSlots.length === 0 ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>На выбранную дату свободных мест сейчас нет. Врач не принимает в этот день или все слоты заняты.</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {liveSlots.map((slot, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-slate-50 border border-slate-200 hover:border-teal-400 rounded-xl text-center transition-colors"
              >
                <div className="text-sm font-bold text-teal-700">{slot.time}</div>
                <div className="text-[10px] text-slate-500 truncate">{slot.doctorName}</div>
                <div className="text-[9px] text-emerald-600 font-semibold uppercase mt-0.5">Свободно</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Booked Appointments List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Записи пациентов на {selectedDate} ({filteredAppointments.length})
            </h3>
          </div>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            На этот день пока нет оформленных записей. Все доступные слоты свободны для бронирования через AI.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAppointments.map(apt => {
              const doc = getDoctor(apt.doctorId);
              return (
                <div
                  key={apt.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">
                      {apt.time}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{apt.patientName}</span>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                          {apt.patientPhone}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                          apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {apt.status === 'confirmed' ? 'Подтвержден' : 'Ожидает'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1 font-medium text-teal-700">
                          <Stethoscope className="w-3.5 h-3.5" />
                          {apt.serviceName} ({apt.duration} мин)
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-700">Врач: {apt.doctorName}</span>
                        <span className="text-slate-400">•</span>
                        <span className="font-semibold text-slate-900">{apt.price.toLocaleString('ru-RU')} ₸</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => onCancelAppointment(apt.id)}
                      className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-rose-200"
                    >
                      Отменить запись
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
