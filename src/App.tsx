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
import { RemindersAdmin } from './components/RemindersAdmin.js';
import { FaqAdmin } from './components/FaqAdmin.js';
import { MedicalSafetyModal } from './components/MedicalSafetyModal.js';
import { ClinicInfo, Service, Doctor, Appointment, ReminderSettings, ReminderLog, FaqItem } from './types.js';

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
  emergencyPolicy: 'При острой боли и отеках приём дежурным врачом вне очереди'
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'schedule' | 'services' | 'doctors' | 'reminders' | 'faq'>('chat');
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
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Clinic Header & Navigation */}
      <Header
        clinicInfo={clinicInfo}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSafetyModal={() => setIsSafetyModalOpen(true)}
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
              />
            )}

            {activeTab === 'schedule' && (
              <ScheduleView
                appointments={appointments}
                doctors={doctors}
                services={services}
                onRefresh={loadAllData}
                onCancelAppointment={handleCancelAppointment}
              />
            )}

            {activeTab === 'services' && (
              <ServicesAdmin
                services={services}
                doctors={doctors}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'doctors' && (
              <DoctorsAdmin
                doctors={doctors}
                services={services}
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

      {/* Medical Safety Standards Modal */}
      <MedicalSafetyModal
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
        clinicInfo={clinicInfo}
      />
    </div>
  );
}
