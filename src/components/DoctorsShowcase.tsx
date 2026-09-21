import React, { useState } from 'react';
import { Star, Award, Calendar, Clock, ChevronRight, Sparkles, Filter, CheckCircle2, Stethoscope, Image as ImageIcon } from 'lucide-react';
import { Doctor, Service } from '../types.js';

interface DoctorsShowcaseProps {
  doctors: Doctor[];
  services: Service[];
  onSelectDoctor: (doctor: Doctor) => void;
  onBookDoctor: (doctor: Doctor) => void;
}

export const DoctorsShowcase: React.FC<DoctorsShowcaseProps> = ({
  doctors,
  services,
  onSelectDoctor,
  onBookDoctor
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Все специалисты' },
    { id: 'therapy', label: 'Терапия и кариес' },
    { id: 'ortho', label: 'Ортодонтия (брекеты)' },
    { id: 'surgery', label: 'Хирургия и импланты' },
    { id: 'hygiene', label: 'Гигиена и отбеливание' },
    { id: 'pediatric', label: 'Детская стоматология' }
  ];

  const filteredDoctors = doctors.filter(doc => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'therapy') return doc.serviceIds.some(id => ['srv-consult', 'srv-caries', 'srv-root-canal'].includes(id));
    if (selectedCategory === 'ortho') return doc.serviceIds.includes('srv-ortho');
    if (selectedCategory === 'surgery') return doc.serviceIds.some(id => ['srv-implant', 'srv-extraction'].includes(id));
    if (selectedCategory === 'hygiene') return doc.serviceIds.some(id => ['srv-cleaning', 'srv-whitening'].includes(id));
    if (selectedCategory === 'pediatric') return doc.serviceIds.includes('srv-pediatric');
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 sm:p-10 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Команда экспертов DentaCare</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Врачи высшей категории и реальные клинические результаты
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Каждый доктор клиники имеет узкую специализацию, международные сертификаты и реальное портфолио работ. Выберите врача, изучите фото До/После и запишитесь на удобное время.
          </p>
        </div>
      </div>

      {/* Specialty Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map(doctor => {
          const docServices = services.filter(s => doctor.serviceIds.includes(s.id));
          const casesCount = doctor.portfolio?.length || 0;

          return (
            <div
              key={doctor.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Doctor Header & Avatar */}
                <div className="p-6 pb-4">
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={doctor.avatar}
                        alt={doctor.name}
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 rounded-2xl object-cover border border-slate-200 group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                          {doctor.specialty}
                        </span>
                        <span className="text-[11px] font-semibold text-amber-500 flex items-center gap-0.5 ml-auto">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {doctor.rating}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                        {doctor.name}
                      </h3>

                      {doctor.experienceYears && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Award className="w-3.5 h-3.5 text-teal-600" />
                          Стаж {doctor.experienceYears} лет
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                    {doctor.bio}
                  </p>
                </div>

                {/* Focus Areas Chips */}
                {doctor.focusAreas && doctor.focusAreas.length > 0 && (
                  <div className="px-6 pb-4 flex flex-wrap gap-1.5">
                    {doctor.focusAreas.slice(0, 3).map((area, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium"
                      >
                        {area}
                      </span>
                    ))}
                    {doctor.focusAreas.length > 3 && (
                      <span className="text-[11px] px-2 py-1 rounded-lg bg-slate-100 text-slate-500 font-medium">
                        +{doctor.focusAreas.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Portfolio preview indicator */}
                {casesCount > 0 && (
                  <div className="px-6 py-2.5 bg-emerald-50/60 border-y border-emerald-100 text-emerald-800 text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                      Клинические примеры До/После
                    </span>
                    <span className="font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[11px]">
                      {casesCount} {casesCount === 1 ? 'кейс' : 'кейса'}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="p-6 pt-4 border-t border-slate-100 bg-slate-50/60 flex items-center gap-2">
                <button
                  onClick={() => onSelectDoctor(doctor)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer text-center"
                >
                  Профиль и кейсы
                </button>
                <button
                  onClick={() => onBookDoctor(doctor)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer text-center flex items-center justify-center gap-1"
                >
                  <span>Записаться</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
