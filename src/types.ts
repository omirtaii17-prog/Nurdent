export interface Service {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number; // in KZT (₸)
  description: string;
  category: 'general' | 'aesthetic' | 'surgery' | 'ortho' | 'pediatric' | 'therapy';
  doctorIds: string[];
  active: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  workDays: number[]; // 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat, 7 = Sun
  workHours: {
    start: string; // "09:00"
    end: string;   // "18:00"
  };
  breakHours: {
    start: string; // "13:00"
    end: string;   // "14:00"
  };
  slotInterval: number; // 30 or 45 mins
  serviceIds: string[];
  bio: string;
  rating?: number;
}

export interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  serviceId: string;
  serviceName: string;
  doctorId: string;
  doctorName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number;
  price: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  reminder24hSent: boolean;
  reminder2hSent: boolean;
  notes?: string;
  createdAt: string;
}

export interface AppointmentDraft {
  patientName: string;
  patientPhone: string;
  serviceId: string;
  serviceName: string;
  doctorId: string;
  doctorName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration?: number;
  price: number;
}

export interface SlotInfo {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  doctorId: string;
  doctorName: string;
  serviceId?: string;
  serviceName?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  appointmentDraft?: AppointmentDraft;
  isConfirmedCard?: boolean;
  confirmedAppointmentId?: string;
  suggestedSlots?: SlotInfo[];
  quickReplies?: string[];
  isEmergencyAlert?: boolean;
}

export interface ClinicInfo {
  name: string;
  tagline: string;
  address: string;
  landmark: string;
  parking: string;
  phone: string;
  whatsapp: string;
  email: string;
  workingHoursWeekdays: string;
  workingHoursWeekend: string;
  installments: string[];
  emergencyPolicy: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface ReminderSettings {
  enable24h: boolean;
  template24h: string;
  enable2h: boolean;
  template2h: string;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
}

export interface ReminderLog {
  id: string;
  appointmentId: string;
  patientName: string;
  patientPhone: string;
  type: '24h' | '2h';
  scheduledTime: string;
  sentAt?: string;
  channel: 'SMS' | 'WhatsApp';
  messageText: string;
  status: 'scheduled' | 'sent' | 'cancelled';
}
