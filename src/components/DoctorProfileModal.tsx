import React, { useState } from 'react';
import { X, Star, Calendar, Clock, Award, ShieldCheck, Sparkles, CheckCircle2, ChevronRight, Stethoscope } from 'lucide-react';
import { Doctor, Service } from '../types.js';
import { BeforeAfterSlider } from './BeforeAfterSlider.js';

interface DoctorProfileModalProps {
  doctor: Doctor | null;
  services: Service[];
  onClose: () => void;
  onBookDoctor: (doctor: Doctor) => void;
}

export const DoctorProfileModal: React.FC<DoctorProfileModalProps> = ({
  doctor,
  services,
  onClose,
  onBookDoctor
}) => {
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);

  if (!doctor) return null;

  const docServices = services.filter(s => doctor.serviceIds.includes(s.id));
  const portfolioCases = doctor.portfolio || [];
  const currentCase = portfolioCases[activeCaseIndex];

  const daysMap = [
    { num: 1, label: 'Пн' },
    { num: 2, label: 'Вт' },
    { num: 3, label: 'Ср' },
    { num: 4, label: 'Чт' },
    { num: 5, label: 'Пт' },
    { num: 6, label: 'Сб' },
    { num: 7, label: 'Вс' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Hero */}
        <div className="relative bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 p-6 sm:p-8 text-white">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative">
              <img
                src={doctor.avatar}
                alt={doctor.name}
                referrerPolicy="no-referrer"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-teal-400/40 shadow-xl"
              />
              <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-slate-900 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Онлайн
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {doctor.specialty}
                </span>
                {doctor.experienceYears && (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    Опыт {doctor.experienceYears} лет
                  </span>
                )}
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {doctor.rating} / 5.0
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {doctor.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                {doctor.bio}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[calc(85vh-200px)] overflow-y-auto">
          {/* Key specialization areas */}
          {doctor.focusAreas && doctor.focusAreas.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Ключевые направления и компетенции
              </h3>
              <div className="flex flex-wrap gap-2">
                {doctor.focusAreas.map((area, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
                  >
                    <CheckCircle2 className="w-3 h-3 text-teal-600" />
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Schedule & Working Hours */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>Индивидуальный график приёма</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Интервал: {doctor.slotInterval || 45} мин
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              {daysMap.map(d => {
                const isWorking = doctor.workDays.includes(d.num);
                return (
                  <div
                    key={d.num}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                      isWorking
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {d.label}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                Часы приёма: {doctor.workHours.start} – {doctor.workHours.end}
              </span>
              <span className="text-slate-400">•</span>
              <span>Перерыв: {doctor.breakHours.start} – {doctor.breakHours.end}</span>
            </div>
          </div>

          {/* Clinical Cases & Before/After Portfolio */}
          {portfolioCases.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Портфолио клинических работ До / После ({portfolioCases.length})
                  </h3>
                </div>

                {/* Case selector tabs */}
                {portfolioCases.length > 1 && (
                  <div className="flex items-center gap-1">
                    {portfolioCases.map((c, idx) => (
                      <button
                        key={c.id || idx}
                        onClick={() => setActiveCaseIndex(idx)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          activeCaseIndex === idx
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Случай {idx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {currentCase && (
                <BeforeAfterSlider
                  beforeImage={currentCase.beforeImage}
                  afterImage={currentCase.afterImage}
                  title={currentCase.title}
                  description={currentCase.description}
                  durationText={currentCase.durationText}
                />
              )}
            </div>
          )}

          {/* Services conducted by this doctor */}
          {docServices.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Проводимые процедуры и стоимость
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {docServices.map(srv => (
                  <div
                    key={srv.id}
                    className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800">{srv.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{srv.duration} мин</div>
                    </div>
                    <div className="text-xs font-bold text-teal-700">
                      {srv.price.toLocaleString('ru-RU')} ₸
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Запись подтверждается моментально без звонков
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Закрыть
            </button>
            <button
              id={`book-doc-${doctor.id}`}
              onClick={() => {
                onClose();
                onBookDoctor(doctor);
              }}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Записаться к {doctor.name.split(' ')[0]} {doctor.name.split(' ')[1]}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
