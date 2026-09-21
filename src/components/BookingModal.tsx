import React, { useState, useEffect } from 'react';
import { X, Check, Calendar, Clock, User, Phone, Stethoscope, ChevronRight, ChevronLeft, MapPin, Sparkles, AlertCircle, FileText, CheckCircle2, Download } from 'lucide-react';
import { Service, Doctor, SlotInfo, ClinicInfo, Appointment } from '../types.js';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  doctors: Doctor[];
  clinicInfo: ClinicInfo;
  initialServiceId?: string;
  initialDoctorId?: string;
  onAppointmentCreated: () => void;
  onOpenGis: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  services,
  doctors,
  clinicInfo,
  initialServiceId,
  initialDoctorId,
  onAppointmentCreated,
  onOpenGis
}) => {
  // Steps: 1 = Service, 2 = Doctor, 3 = Date & Time, 4 = Contact, 5 = Success ("Вы записаны")
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-22');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [patientName, setPatientName] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>('+7 ');
  const [patientNotes, setPatientNotes] = useState<string>('');
  const [isInstallmentInterest, setIsInstallmentInterest] = useState<boolean>(false);

  const [availableSlots, setAvailableSlots] = useState<SlotInfo[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Pre-seed choices when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialServiceId) {
        setSelectedServiceId(initialServiceId);
        if (initialDoctorId) {
          setSelectedDoctorId(initialDoctorId);
          setCurrentStep(3);
        } else {
          setCurrentStep(2);
        }
      } else if (initialDoctorId) {
        setSelectedDoctorId(initialDoctorId);
        setCurrentStep(1);
      } else {
        setCurrentStep(1);
      }
      setConfirmedAppointment(null);
      setErrorMessage('');
    }
  }, [isOpen, initialServiceId, initialDoctorId]);

  // Generate next 7 days for the calendar selector
  const availableDates = [
    { date: '2026-09-21', label: '21 сен', dayOfWeek: 'Пн' },
    { date: '2026-09-22', label: '22 сен', dayOfWeek: 'Вт' },
    { date: '2026-09-23', label: '23 сен', dayOfWeek: 'Ср' },
    { date: '2026-09-24', label: '24 сен', dayOfWeek: 'Чт' },
    { date: '2026-09-25', label: '25 сен', dayOfWeek: 'Пт' },
    { date: '2026-09-26', label: '26 сен', dayOfWeek: 'Сб' },
    { date: '2026-09-27', label: '27 сен', dayOfWeek: 'Вс' }
  ];

  // Fetch real available slots when date, service or doctor changes
  useEffect(() => {
    if (currentStep === 3 && selectedServiceId && selectedDate) {
      fetchSlots();
    }
  }, [currentStep, selectedServiceId, selectedDoctorId, selectedDate]);

  const fetchSlots = async () => {
    setIsLoadingSlots(true);
    setErrorMessage('');
    try {
      let url = `/api/slots?serviceId=${selectedServiceId}&date=${selectedDate}`;
      if (selectedDoctorId) {
        url += `&doctorId=${selectedDoctorId}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAvailableSlots(data.slots || []);
      }
    } catch (e) {
      console.error('Failed to fetch slots', e);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  if (!isOpen) return null;

  const selectedService = services.find(s => s.id === selectedServiceId);
  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

  // Filter doctors that provide the selected service
  const matchingDoctors = selectedServiceId
    ? doctors.filter(d => d.serviceIds.includes(selectedServiceId))
    : doctors;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+7')) {
      val = '+7 ' + val.replace(/[^0-9]/g, '');
    }
    setPatientPhone(val);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || patientPhone.trim().length < 8) {
      setErrorMessage('Пожалуйста, укажите имя и контактный телефон');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const docId = selectedDoctorId || (availableSlots.find(s => s.time === selectedTime)?.doctorId) || matchingDoctors[0]?.id;

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: patientName.trim(),
          patientPhone: patientPhone.trim(),
          serviceId: selectedServiceId,
          doctorId: docId,
          date: selectedDate,
          time: selectedTime,
          notes: `${patientNotes}${isInstallmentInterest ? ' [Интересует рассрочка Kaspi/Halyk]' : ''}`
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Не удалось оформить запись');
      }

      const created: Appointment = await res.json();
      setConfirmedAppointment(created);
      setCurrentStep(5); // Success screen!
      onAppointmentCreated();
    } catch (err: any) {
      setErrorMessage(err.message || 'Ошибка сохранения записи');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    onClose();
    setCurrentStep(1);
    setSelectedTime('');
    setConfirmedAppointment(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-emerald-800 p-6 text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-teal-100">
              {currentStep === 5 ? 'Запись подтверждена' : `Шаг ${currentStep} из 4 • Онлайн-запись`}
            </span>
            <h3 className="text-xl font-bold text-white mt-1">
              {currentStep === 1 && 'Выберите необходимую услугу'}
              {currentStep === 2 && 'Выберите врача'}
              {currentStep === 3 && 'Удобная дата и свободное время'}
              {currentStep === 4 && 'Контактные данные пациента'}
              {currentStep === 5 && 'Вы успешно записаны на приём!'}
            </h3>
          </div>
          <button
            onClick={resetAndClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        {currentStep < 5 && (
          <div className="grid grid-cols-4 bg-slate-100 border-b border-slate-200 text-[11px] font-semibold">
            {[
              { step: 1, label: '1. Услуга' },
              { step: 2, label: '2. Врач' },
              { step: 3, label: '3. Время' },
              { step: 4, label: '4. Данные' }
            ].map(s => (
              <div
                key={s.step}
                className={`py-2 text-center transition-colors ${
                  currentStep === s.step
                    ? 'bg-teal-600 text-white font-bold'
                    : currentStep > s.step
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'text-slate-500'
                }`}
              >
                {s.label}
              </div>
            ))}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 max-h-[calc(85vh-220px)] overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: SERVICE SELECTION */}
          {currentStep === 1 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Выберите категорию или конкретную медицинскую услугу:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {services.map(srv => {
                  const isSelected = selectedServiceId === srv.id;
                  return (
                    <button
                      key={srv.id}
                      onClick={() => {
                        setSelectedServiceId(srv.id);
                        setCurrentStep(2);
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/70 shadow-xs ring-2 ring-teal-500/20'
                          : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{srv.name}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {srv.duration} мин
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {srv.description}
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-teal-700">
                          {srv.price.toLocaleString('ru-RU')} ₸
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">Выбрать →</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: DOCTOR SELECTION */}
          {currentStep === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Специалисты, проводящие «{selectedService?.name}»:
                </p>
                <button
                  onClick={() => {
                    setSelectedDoctorId('');
                    setCurrentStep(3);
                  }}
                  className="text-xs text-teal-700 hover:underline font-semibold cursor-pointer"
                >
                  Любой свободный врач
                </button>
              </div>

              <div className="space-y-2.5">
                {matchingDoctors.map(doc => {
                  const isSelected = selectedDoctorId === doc.id;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => {
                        setSelectedDoctorId(doc.id);
                        setCurrentStep(3);
                      }}
                      className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-4 ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/70 shadow-xs ring-2 ring-teal-500/20'
                          : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50'
                      }`}
                    >
                      <img
                        src={doc.avatar}
                        alt={doc.name}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                          <span className="text-xs font-semibold text-amber-500">
                            ★ {doc.rating}
                          </span>
                        </div>
                        <p className="text-xs text-teal-700 font-medium">{doc.specialty}</p>
                        {doc.experienceYears && (
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Опыт работы: {doc.experienceYears} лет
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: DATE & TIME SELECTION */}
          {currentStep === 3 && (
            <div className="space-y-4">
              {/* Date picker tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Выберите день визита:
                </label>
                <div className="grid grid-cols-7 gap-1.5">
                  {availableDates.map(d => {
                    const isSelected = selectedDate === d.date;
                    return (
                      <button
                        key={d.date}
                        onClick={() => {
                          setSelectedDate(d.date);
                          setSelectedTime('');
                        }}
                        className={`p-2 rounded-xl text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-600 text-white shadow-md'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="text-[10px] opacity-75">{d.dayOfWeek}</div>
                        <div className="text-xs font-bold mt-0.5">{d.label.split(' ')[0]}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Free slots grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <span>Доступные слоты на выбранную дату:</span>
                  </label>
                  {isLoadingSlots && (
                    <span className="text-[11px] text-teal-600 animate-pulse">
                      Проверка расписания...
                    </span>
                  )}
                </div>

                {isLoadingSlots ? (
                  <div className="h-32 flex items-center justify-center text-xs text-slate-400">
                    Загрузка свободных окон...
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
                    <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-600 font-medium">
                      На выбранный день свободных слотов нет. Пожалуйста, выберите другую дату в календаре выше.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableSlots.map((slot, idx) => {
                      const isSelected = selectedTime === slot.time;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedTime(slot.time);
                            if (!selectedDoctorId) {
                              setSelectedDoctorId(slot.doctorId);
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-teal-600 text-white border-teal-600 shadow-md font-bold'
                              : 'bg-white hover:bg-teal-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="text-xs font-bold">{slot.time}</div>
                          <div className="text-[10px] opacity-75 mt-0.5 truncate">
                            {slot.doctorName.split(' ')[0]}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: CONTACT INFORMATION */}
          {currentStep === 4 && (
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              {/* Summary recap box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Услуга:</span>
                  <span className="font-bold text-slate-900">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Врач:</span>
                  <span className="font-bold text-slate-900">{selectedDoctor?.name || 'Дежурный врач'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Дата и время:</span>
                  <span className="font-bold text-teal-700">{selectedDate} в {selectedTime}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Стоимость:</span>
                  <span className="font-bold text-slate-900">{selectedService?.price.toLocaleString('ru-RU')} ₸</span>
                </div>
              </div>

              {/* Patient Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ваше имя и фамилия *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    placeholder="Например: Алия Касымова"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Patient Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Номер телефона (для SMS / WhatsApp подтверждения) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={patientPhone}
                    onChange={handlePhoneChange}
                    placeholder="+7 (707) 123-45-67"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Notes / Symptoms */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Симптомы или пожелания к приёму (необязательно)
                </label>
                <textarea
                  rows={2}
                  value={patientNotes}
                  onChange={e => setPatientNotes(e.target.value)}
                  placeholder="Опишите, если есть боль, отек или особые пожелания..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Installment interest checkbox */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={isInstallmentInterest}
                  onChange={e => setIsInstallmentInterest(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded-sm"
                />
                <span className="text-xs text-slate-700">
                  Хочу оформить рассрочку 0% (Kaspi Red / Kaspi 0-0-12 / Halyk)
                </span>
              </label>
            </form>
          )}

          {/* STEP 5: SUCCESS CONFIRMATION SCREEN ("ВЫ ЗАПИСАНЫ") */}
          {currentStep === 5 && confirmedAppointment && (
            <div className="text-center space-y-6 py-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Вы успешно записаны на приём!
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Талон бронирования <span className="font-mono font-bold text-teal-700">#{confirmedAppointment.id}</span>
                </p>
              </div>

              {/* Ticket details summary */}
              <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <Stethoscope className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Услуга и врач:</span>
                    <div className="text-xs font-bold text-slate-900">{confirmedAppointment.serviceName}</div>
                    <div className="text-xs text-slate-600">{confirmedAppointment.doctorName}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2 border-t border-slate-200">
                  <Calendar className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Дата и время:</span>
                    <div className="text-xs font-bold text-emerald-700">
                      {confirmedAppointment.date} в {confirmedAppointment.time}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2 border-t border-slate-200">
                  <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Адрес клиники:</span>
                    <div className="text-xs font-bold text-slate-900">{clinicInfo.address}</div>
                    <div className="text-[11px] text-slate-500">{clinicInfo.parking}</div>
                  </div>
                </div>
              </div>

              {/* Patient preparation checklist */}
              <div className="max-w-md mx-auto bg-teal-50/70 border border-teal-200 rounded-2xl p-4 text-left text-xs text-teal-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-teal-800">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Памятка перед визитом:</span>
                </div>
                <p>• Рекомендуем перекусить за 1–1.5 часа до приёма.</p>
                <p>• За 24 часа и за 2 часа до времени визита вам придёт SMS-напоминание.</p>
                <p>• При наличии возьмите с собой свежие снимки или томографию.</p>
              </div>

              {/* Action buttons on success */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    resetAndClose();
                    onOpenGis();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  <span>📍 Маршрут в 2GIS</span>
                </button>

                <button
                  onClick={resetAndClose}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Вернуться на сайт
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        {currentStep < 5 && (
          <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={() => {
                if (currentStep > 1) setCurrentStep((currentStep - 1) as any);
                else resetAndClose();
              }}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{currentStep === 1 ? 'Отмена' : 'Назад'}</span>
            </button>

            {currentStep === 1 && (
              <button
                disabled={!selectedServiceId}
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <span>Далее: Выбрать врача</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 2 && (
              <button
                onClick={() => setCurrentStep(3)}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <span>Далее: Выбрать время</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 3 && (
              <button
                disabled={!selectedTime}
                onClick={() => setCurrentStep(4)}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <span>Далее: Контакты</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 4 && (
              <button
                type="button"
                disabled={isSubmitting || !patientName.trim()}
                onClick={handleFinalSubmit}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <span>Бронирование...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Подтвердить запись</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
