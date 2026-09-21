import React, { useState } from 'react';
import { Users, Clock, Calendar, Edit2, Stethoscope, Coffee, Check, X, Star } from 'lucide-react';
import { Doctor, Service } from '../types.js';

interface DoctorsAdminProps {
  doctors: Doctor[];
  services: Service[];
  onRefresh: () => void;
}

export const DoctorsAdmin: React.FC<DoctorsAdminProps> = ({
  doctors,
  services,
  onRefresh
}) => {
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [workDays, setWorkDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [breakStart, setBreakStart] = useState('13:00');
  const [breakEnd, setBreakEnd] = useState('14:00');
  const [slotInterval, setSlotInterval] = useState(45);
  const [isSaving, setIsSaving] = useState(false);

  const daysMap = [
    { num: 1, label: 'Пн' },
    { num: 2, label: 'Вт' },
    { num: 3, label: 'Ср' },
    { num: 4, label: 'Чт' },
    { num: 5, label: 'Пт' },
    { num: 6, label: 'Сб' },
    { num: 7, label: 'Вс' }
  ];

  const openEditModal = (doc: Doctor) => {
    setEditingDoctor(doc);
    setWorkDays([...doc.workDays]);
    setStartTime(doc.workHours.start);
    setEndTime(doc.workHours.end);
    setBreakStart(doc.breakHours.start);
    setBreakEnd(doc.breakHours.end);
    setSlotInterval(doc.slotInterval || 45);
  };

  const toggleDay = (dayNum: number) => {
    if (workDays.includes(dayNum)) {
      if (workDays.length > 1) {
        setWorkDays(workDays.filter(d => d !== dayNum));
      }
    } else {
      setWorkDays([...workDays, dayNum].sort());
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/doctors/${editingDoctor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workDays,
          workHours: { start: startTime, end: endTime },
          breakHours: { start: breakStart, end: breakEnd },
          slotInterval
        })
      });

      if (!res.ok) throw new Error('Ошибка сохранения графика');
      setEditingDoctor(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Не удалось сохранить');
    } finally {
      setIsSaving(false);
    }
  };

  const getDayNames = (days: number[]) => {
    return daysMap
      .filter(d => days.includes(d.num))
      .map(d => d.label)
      .join(', ');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Врачи клиники и индивидуальный график
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Рабочие часы, дни приёма и перерывы. AI проверяет эти параметры в реальном времени при поиске свободных слотов
          </p>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {doctors.map(doc => {
          const docServices = services.filter(s => doc.serviceIds.includes(s.id));
          return (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={doc.avatar}
                    alt={doc.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900 truncate">
                        {doc.name}
                      </h3>
                      {doc.rating && (
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {doc.rating}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-teal-700 mt-0.5">{doc.specialty}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {doc.bio}
                    </p>
                  </div>
                </div>

                {/* Schedule details */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Рабочие дни:
                    </span>
                    <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {getDayNames(doc.workDays)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Рабочие часы:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {doc.workHours.start} – {doc.workHours.end}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Coffee className="w-3.5 h-3.5 text-slate-400" />
                      Обеденный перерыв:
                    </span>
                    <span className="font-medium text-slate-600">
                      {doc.breakHours.start} – {doc.breakHours.end}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Интервал приёма:</span>
                    <span className="font-medium text-slate-800">{doc.slotInterval} минут</span>
                  </div>
                </div>

                {/* Assigned services tags */}
                <div className="mt-3">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Оказываемые услуги ({docServices.length}):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {docServices.map(s => (
                      <span
                        key={s.id}
                        className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => openEditModal(doc)}
                  className="text-xs font-medium text-slate-700 hover:text-teal-700 hover:bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Настроить график
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Doctor Schedule Modal */}
      {editingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Настройка графика врача</h3>
                <p className="text-xs text-slate-300">{editingDoctor.name}</p>
              </div>
              <button
                onClick={() => setEditingDoctor(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-2">
                  Рабочие дни недели:
                </label>
                <div className="grid grid-cols-7 gap-1.5">
                  {daysMap.map(d => {
                    const active = workDays.includes(d.num);
                    return (
                      <button
                        key={d.num}
                        type="button"
                        onClick={() => toggleDay(d.num)}
                        className={`py-2 text-center rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                          active
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Начало смены:
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Конец смены:
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Обед с:
                  </label>
                  <input
                    type="time"
                    required
                    value={breakStart}
                    onChange={e => setBreakStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Обед до:
                  </label>
                  <input
                    type="time"
                    required
                    value={breakEnd}
                    onChange={e => setBreakEnd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Шаг сетки слотов (минут):
                </label>
                <select
                  value={slotInterval}
                  onChange={e => setSlotInterval(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value={30}>30 минут</option>
                  <option value={45}>45 минут</option>
                  <option value={60}>60 минут</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSaving ? 'Сохранение...' : 'Применить график'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
