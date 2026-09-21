/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { ChatView } from './components/ChatView.js';
import { ScheduleView } from './components/ScheduleView.js';
import { ServicesAdmin } from './components/ServicesAdmin.js';
import { DoctorsAdmin } from './components/DoctorsAdmin.js';
import { DoctorsShowcase } from './components/DoctorsShowcase.js';
import { DoctorProfileModal } from './components/DoctorProfileModal.js';
import { BookingModal } from './components/BookingModal.js';
import { GisMapModal } from './components/GisMapModal.js';
import { VoiceReceptionistModal } from './components/VoiceReceptionistModal.js';
import { RemindersAdmin } from './components/RemindersAdmin.js';
import { FaqAdmin } from './components/FaqAdmin.js';
import { MedicalSafetyModal } from './components/MedicalSafetyModal.js';
import { ClinicInfo, Service, Doctor, Appointment, ReminderSettings, ReminderLog, FaqItem } from './types.js';
import { Users, Settings, Sparkles } from 'lucide-react';

const defaultClinicInfo: ClinicInfo = {
  name: 'DentaCare',
  tagline: 'Современная семейная стоматология и имплантология',
  address: 'г. Алматы, пр. Достык 128 (ЖК «Премиум Plaza»)',
  phone: '+7 (727) 345-67-89',
  whatsapp: '+7 (701) 987-65-43',
  email: 'info@dentacare-clinic.kz',
  workingHoursWeekdays: '08:30 – 20:30',
  workingHoursWeekend: '09:00 – 18:00',
  parking: 'Подземный и гостевой паркинг клиники (бесплатно для пациентов)',
  installments: [
    'Kaspi Red (3 месяца без переплаты)',
    'Kaspi Рассрочка 0-0-12 и 0-0-24',
    'Halyk Bank Рассрочка до 12 месяцев'
  ],
  landmark: 'Напротив ТРЦ «Достык», отдельный вход со стороны проспекта с вывеской DentaCare',
  emergencyPolicy: 'При острой боли и отеках приём дежурным врачом вне очереди',
  gisUrl: 'https://2gis.kz/almaty/search/%D0%BF%D1%80%D0%BE%D1%81%D0%BF%D0%B5%D0%BA%D1%82%20%D0%94%D0%BE%D1%81%D1%82%D1%8B%D0%BA%20128'
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'schedule' | 'services' | 'doctors' | 'reminders' | 'faq'>('chat');
  const [doctorsSubView, setDoctorsSubView] = useState<'showcase' | 'admin'>('showcase');
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo>(defaultClinicInfo);
  const [services, setServices] = useState<Service[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    enable24h: true,
    enable2h: true,
    template24h: 'Здравствуйте, {patientName}! Напоминаем, что завтра в {time} у вас приём в нашей стоматологии ({serviceName}, врач {doctorName}). Наш адрес: пр. Достык 128.',
    template2h: 'Напоминаем, что сегодня в {time} у вас приём в стоматологии DentaCare. Ждем вас!',
    whatsappEnabled: true,
    smsEnabled: true
  });
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([]);
  const [faq, setFaq] = useState<FaqItem[]>([]);

  // Modals state
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [isGisModalOpen, setIsGisModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedDoctorForProfile, setSelectedDoctorForProfile] = useState<Doctor | null>(null);
  const [bookingInitialServiceId, setBookingInitialServiceId] = useState<string | undefined>();
  const [bookingInitialDoctorId, setBookingInitialDoctorId] = useState<string | undefined>();

  const [isLoading, setIsLoading] = useState(true);

  const loadAllData = async () => {
    try {
      const [clinicRes, servicesRes, doctorsRes, appointmentsRes, remindersRes] = await Promise.all([
        fetch('/api/clinic'),
        fetch('/api/services'),
        fetch('/api/doctors'),
        fetch('/api/appointments'),
        fetch('/api/reminders')
      ]);

      if (clinicRes.ok) {
        const cData = await clinicRes.json();
        if (cData.info) setClinicInfo(cData.info);
        if (cData.faq) setFaq(cData.faq);
        if (cData.reminderSettings) setReminderSettings(cData.reminderSettings);
      }

      if (servicesRes.ok) {
        setServices(await servicesRes.json());
      }

      if (doctorsRes.ok) {
        setDoctors(await doctorsRes.json());
      }

      if (appointmentsRes.ok) {
        setAppointments(await appointmentsRes.json());
      }

      if (remindersRes.ok) {
        const rData = await remindersRes.json();
        if (rData.settings) setReminderSettings(rData.settings);
        if (rData.logs) setReminderLogs(rData.logs);
      }
    } catch (err) {
      console.error('Failed loading clinic data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleCancelAppointment = async (id: string) => {
    if (!confirm('Отменить эту запись на приём?')) return;
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAppointments(prev => prev.filter(a => a.id !== id));
      }
    } catch (e) {
      console.error('Error deleting appointment', e);
    }
  };

  const handleOpenBooking = (serviceId?: string, doctorId?: string) => {
    setBookingInitialServiceId(serviceId);
    setBookingInitialDoctorId(doctorId);
    setIsBookingModalOpen(true);
  };

  const handleBookDoctor = (doctor: Doctor) => {
    handleOpenBooking(undefined, doctor.id);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Clinic Header & Navigation */}
      <Header
        clinicInfo={clinicInfo}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSafetyModal={() => setIsSafetyModalOpen(true)}
        onOpenGis={() => setIsGisModalOpen(true)}
        onOpenVoice={() => setIsVoiceModalOpen(true)}
        onOpenBooking={() => handleOpenBooking()}
        pendingRemindersCount={appointments.length}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-500 font-medium">Загрузка системы DentaCare...</span>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'chat' && (
              <ChatView
                clinicInfo={clinicInfo}
                onAppointmentCreated={loadAllData}
                onOpenGis={() => setIsGisModalOpen(true)}
                onOpenBooking={handleOpenBooking}
                onOpenDoctorProfile={doctor => setSelectedDoctorForProfile(doctor)}
                onOpenVoice={() => setIsVoiceModalOpen(true)}
              />
            )}

            {activeTab === 'doctors' && (
              <div className="space-y-4">
                {/* Sub-navigation between patient showcase and admin schedule management */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-2xl text-xs font-semibold">
                    <button
                      onClick={() => setDoctorsSubView('showcase')}
                      className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                        doctorsSubView === 'showcase'
                          ? 'bg-white text-teal-800 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      <span>Каталог врачей и До/После</span>
                    </button>
                    <button
                      onClick={() => setDoctorsSubView('admin')}
                      className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                        doctorsSubView === 'admin'
                          ? 'bg-white text-teal-800 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-500" />
                      <span>Настройка рабочих часов</span>
                    </button>
                  </div>
                </div>

                {doctorsSubView === 'showcase' ? (
                  <DoctorsShowcase
                    doctors={doctors}
                    services={services}
                    onSelectDoctor={doctor => setSelectedDoctorForProfile(doctor)}
                    onBookDoctor={handleBookDoctor}
                  />
                ) : (
                  <DoctorsAdmin
                    doctors={doctors}
                    services={services}
                    onRefresh={loadAllData}
                  />
                )}
              </div>
            )}

            {activeTab === 'schedule' && (
              <ScheduleView
                appointments={appointments}
                doctors={doctors}
                services={services}
                onRefresh={loadAllData}
                onCancelAppointment={handleCancelAppointment}
                onOpenBooking={() => handleOpenBooking()}
              />
            )}

            {activeTab === 'services' && (
              <ServicesAdmin
                services={services}
                doctors={doctors}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'reminders' && (
              <RemindersAdmin
                settings={reminderSettings}
                logs={reminderLogs}
                appointments={appointments}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'faq' && (
              <FaqAdmin
                faq={faq}
                clinicInfo={clinicInfo}
                onRefresh={loadAllData}
              />
            )}
          </>
        )}
      </main>

      {/* 2GIS Map and Route Modal */}
      <GisMapModal
        isOpen={isGisModalOpen}
        onClose={() => setIsGisModalOpen(false)}
        clinicInfo={clinicInfo}
      />

      {/* Doctor Profile & Clinical Cases Modal */}
      <DoctorProfileModal
        doctor={selectedDoctorForProfile}
        services={services}
        onClose={() => setSelectedDoctorForProfile(null)}
        onBookDoctor={handleBookDoctor}
      />

      {/* Multi-step Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        services={services}
        doctors={doctors}
        clinicInfo={clinicInfo}
        initialServiceId={bookingInitialServiceId}
        initialDoctorId={bookingInitialDoctorId}
        onAppointmentCreated={loadAllData}
        onOpenGis={() => setIsGisModalOpen(true)}
      />

      {/* AI Voice Receptionist & Architecture Modal */}
      <VoiceReceptionistModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        clinicInfo={clinicInfo}
        doctors={doctors}
        services={services}
        onBookAppointmentFromVoice={() => {
          setIsVoiceModalOpen(false);
          handleOpenBooking();
        }}
      />

      {/* Medical Safety Standards Modal */}
      <MedicalSafetyModal
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
        clinicInfo={clinicInfo}
      />
    </div>
  );
}
