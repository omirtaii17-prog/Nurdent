import { Service, Doctor, Appointment, ClinicInfo, FaqItem, ReminderSettings, ReminderLog, SlotInfo } from '../src/types.js';

// Central in-memory clinic store with rich seed data
export const clinicInfo: ClinicInfo = {
  name: "Стоматология DentaCare",
  tagline: "Современная цифровая стоматология без боли и страха",
  address: "г. Алматы, пр. Достык, 128 (ЖК «Премиум Plaza», 2 этаж)",
  landmark: "Напротив ТРЦ «Достык Плаза», отдельный вход со стороны парка",
  parking: "Бесплатная охраняемая гостевая парковка для пациентов клиники",
  phone: "+7 (727) 345-67-89",
  whatsapp: "+7 (777) 123-45-67",
  email: "info@dentacare.kz",
  workingHoursWeekdays: "08:30 – 20:30 (без перерыва)",
  workingHoursWeekend: "Суббота: 09:00 – 19:00, Воскресенье: 09:00 – 18:00",
  installments: [
    "Kaspi Red (рассрочка на 3 месяца без переплат)",
    "Kaspi Рассрочка 0-0-12 (до 12 месяцев)",
    "Halyk Bank (рассрочка до 24 месяцев на имплантацию и брекеты)",
    "Оплата картой Visa / Mastercard, наличный и безналичный расчет"
  ],
  emergencyPolicy: "При острой зубной боли, травме или отеке мы принимаем вне очереди по экстренному коридору дежурного врача!"
};

export const defaultServices: Service[] = [
  {
    id: "srv-consult",
    name: "Консультация стоматолога",
    duration: 30,
    price: 5000,
    description: "Первичный осмотр, детальный фотопротокол зубов, консультация по рентген-снимку и составление персонального плана лечения.",
    category: "general",
    doctorIds: ["doc-1", "doc-2", "doc-3", "doc-4", "doc-5"],
    active: true
  },
  {
    id: "srv-caries",
    name: "Лечение кариеса",
    duration: 60,
    price: 18000,
    description: "Бережное удаление кариозных тканей под микроскопом, изоляция коффердамом и анатомическая реставрация пломбой Estelite (Япония).",
    category: "therapy",
    doctorIds: ["doc-1", "doc-2", "doc-5"],
    active: true
  },
  {
    id: "srv-cleaning",
    name: "Профессиональная чистка",
    duration: 45,
    price: 15000,
    description: "Комплексная гигиена полости рта: ультразвуковое снятие твердых зубных камней, пескоструйный AirFlow, полировка и фторирование эмали.",
    category: "general",
    doctorIds: ["doc-1", "doc-2"],
    active: true
  },
  {
    id: "srv-whitening",
    name: "Отбеливание",
    duration: 60,
    price: 45000,
    description: "Клиническое аппаратное отбеливание Beyond Polus до 8 тонов без повреждения эмали и повышенной чувствительности.",
    category: "aesthetic",
    doctorIds: ["doc-2"],
    active: true
  },
  {
    id: "srv-extraction",
    name: "Удаление зуба",
    duration: 45,
    price: 12000,
    description: "Атравматичное удаление зуба любой сложности (включая зубы мудрости) с надежной анестезией и заживляющей биомембраной.",
    category: "surgery",
    doctorIds: ["doc-3"],
    active: true
  },
  {
    id: "srv-canal",
    name: "Лечение зубного канала",
    duration: 90,
    price: 28000,
    description: "Эндодонтическая обработка корневых каналов под операционным микроскопом, медикаментозная обработка и 3D-герметизация гуттаперчей.",
    category: "therapy",
    doctorIds: ["doc-1", "doc-2"],
    active: true
  },
  {
    id: "srv-crown",
    name: "Установка коронки",
    duration: 60,
    price: 40000,
    description: "Установка эстетичной цельноциркониевой коронки или керамики E-max с цифровым 3D-сканированием челюсти.",
    category: "ortho",
    doctorIds: ["doc-1"],
    active: true
  },
  {
    id: "srv-implant",
    name: "Имплантация",
    duration: 90,
    price: 120000,
    description: "Установка оригинального титанового имплантата (Osstem/Straumann) по навигационному хирургическому шаблону с гарантией приживаемости.",
    category: "surgery",
    doctorIds: ["doc-3"],
    active: true
  },
  {
    id: "srv-ortho",
    name: "Ортодонтия",
    duration: 45,
    price: 20000,
    description: "Консультация и компьютерная диагностика прикуса, планирование лечения на самолигирующих брекетах Damon или прозрачных элайнерах.",
    category: "ortho",
    doctorIds: ["doc-4"],
    active: true
  },
  {
    id: "srv-pediatric",
    name: "Детская стоматология",
    duration: 40,
    price: 10000,
    description: "Адаптационный прием в игровой форме без страха и слез: лечение молочных зубов, фторирование, герметизация фиссур и подарки смельчаку.",
    category: "pediatric",
    doctorIds: ["doc-5"],
    active: true
  }
];

export const defaultDoctors: Doctor[] = [
  {
    id: "doc-1",
    name: "Dr. Ivan (Иван Смирнов)",
    specialty: "Главный врач, стоматолог-терапевт, ортопед",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop&crop=face",
    workDays: [1, 2, 3, 4, 5], // Пн, Вт, Ср, Чт, Пт
    workHours: { start: "09:00", end: "18:00" },
    breakHours: { start: "13:00", end: "14:00" },
    slotInterval: 45,
    serviceIds: ["srv-consult", "srv-caries", "srv-cleaning", "srv-canal", "srv-crown"],
    bio: "Опыт работы 14 лет. Эксперт по цифровой реставрации зубов и комплексному протезированию. Член Европейской ассоциации эстетической стоматологии.",
    rating: 4.9
  },
  {
    id: "doc-2",
    name: "Dr. Асель Касымова",
    specialty: "Стоматолог-терапевт, гигиенист, специалист по отбеливанию",
    avatar: "https://images.unsplash.com/photo-1594824813589-3221b6562092?w=200&h=200&fit=crop&crop=face",
    workDays: [1, 2, 3, 4, 6], // Пн, Вт, Ср, Чт, Сб
    workHours: { start: "10:00", end: "19:00" },
    breakHours: { start: "14:00", end: "15:00" },
    slotInterval: 45,
    serviceIds: ["srv-consult", "srv-caries", "srv-cleaning", "srv-whitening", "srv-canal"],
    bio: "Опыт 9 лет. Сертифицированный специалист по деликатной ультразвуковой чистке AirFlow и аппаратному отбеливанию Beyond Polus.",
    rating: 5.0
  },
  {
    id: "doc-3",
    name: "Dr. Марат Жумабаев",
    specialty: "Стоматолог-хирург, челюстно-лицевой хирург, имплантолог",
    avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&h=200&fit=crop&crop=face",
    workDays: [2, 3, 4, 5, 6], // Вт, Ср, Чт, Пт, Сб
    workHours: { start: "09:30", end: "18:30" },
    breakHours: { start: "13:30", end: "14:30" },
    slotInterval: 45,
    serviceIds: ["srv-consult", "srv-extraction", "srv-implant"],
    bio: "Опыт 16 лет. Провёл более 4 500 успешных операций по установке имплантатов. Безболезненное удаление зубов любой сложности.",
    rating: 4.95
  },
  {
    id: "doc-4",
    name: "Dr. Елена Ким",
    specialty: "Врач-ортодонт (брекет-системы и прозрачные элайнеры)",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face",
    workDays: [1, 3, 5, 6], // Пн, Ср, Пт, Сб
    workHours: { start: "11:00", end: "20:00" },
    breakHours: { start: "15:00", end: "16:00" },
    slotInterval: 45,
    serviceIds: ["srv-consult", "srv-ortho"],
    bio: "Опыт 11 лет. Исправление прикуса любой сложности для взрослых и подростков. Сертифицированный эксперт по элайнерам Spark и Invisalign.",
    rating: 4.9
  },
  {
    id: "doc-5",
    name: "Dr. Данияр Оспанов",
    specialty: "Детский стоматолог, врач высшей категории",
    avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face",
    workDays: [1, 2, 4, 5, 7], // Пн, Вт, Чт, Пт, Вс
    workHours: { start: "09:00", end: "17:00" },
    breakHours: { start: "13:00", end: "14:00" },
    slotInterval: 30,
    serviceIds: ["srv-consult", "srv-pediatric", "srv-caries"],
    bio: "Опыт 8 лет. Любимый доктор маленьких пациентов! Лечение без слез, адаптация тревожных деток, мультфильмы во время приема.",
    rating: 5.0
  }
];

// Seed some initial appointments around current date (2026-09-21, 2026-09-22, etc.)
// Notice: On 2026-09-22 (tomorrow), we purposely leave 11:30, 14:00, and 17:30 open for Dr. Ivan / Dr. Asel
// to match the exact natural example in prompt:
// "Конечно! На завтра есть свободные места в 11:30, 14:00 и 17:30. Какое время вам удобнее?"
export const defaultAppointments: Appointment[] = [
  {
    id: "apt-101",
    patientName: "Ерлан Сейткалиев",
    patientPhone: "+7 (701) 555-12-34",
    serviceId: "srv-caries",
    serviceName: "Лечение кариеса",
    doctorId: "doc-1",
    doctorName: "Dr. Ivan (Иван Смирнов)",
    date: "2026-09-22",
    time: "09:30",
    duration: 60,
    price: 18000,
    status: "confirmed",
    reminder24hSent: true,
    reminder2hSent: false,
    createdAt: "2026-09-20T10:00:00Z"
  },
  {
    id: "apt-102",
    patientName: "Айгерим Мусина",
    patientPhone: "+7 (705) 987-65-43",
    serviceId: "srv-consult",
    serviceName: "Консультация стоматолога",
    doctorId: "doc-1",
    doctorName: "Dr. Ivan (Иван Смирнов)",
    date: "2026-09-22",
    time: "10:45",
    duration: 30,
    price: 5000,
    status: "confirmed",
    reminder24hSent: true,
    reminder2hSent: false,
    createdAt: "2026-09-20T11:20:00Z"
  },
  {
    id: "apt-103",
    patientName: "Кайрат Нурланов",
    patientPhone: "+7 (775) 444-22-11",
    serviceId: "srv-caries",
    serviceName: "Лечение кариеса",
    doctorId: "doc-1",
    doctorName: "Dr. Ivan (Иван Смирнов)",
    date: "2026-09-22",
    time: "15:00",
    duration: 60,
    price: 18000,
    status: "confirmed",
    reminder24hSent: true,
    reminder2hSent: false,
    createdAt: "2026-09-21T09:00:00Z"
  },
  {
    id: "apt-104",
    patientName: "Руслан Бакиров",
    patientPhone: "+7 (777) 321-00-99",
    serviceId: "srv-implant",
    serviceName: "Имплантация",
    doctorId: "doc-3",
    doctorName: "Dr. Марат Жумабаев",
    date: "2026-09-22",
    time: "11:00",
    duration: 90,
    price: 120000,
    status: "confirmed",
    reminder24hSent: true,
    reminder2hSent: false,
    createdAt: "2026-09-18T14:30:00Z"
  },
  {
    id: "apt-105",
    patientName: "Мадина Садыкова",
    patientPhone: "+7 (702) 111-22-33",
    serviceId: "srv-ortho",
    serviceName: "Ортодонтия",
    doctorId: "doc-4",
    doctorName: "Dr. Елена Ким",
    date: "2026-09-23",
    time: "14:00",
    duration: 45,
    price: 20000,
    status: "confirmed",
    reminder24hSent: false,
    reminder2hSent: false,
    createdAt: "2026-09-21T08:00:00Z"
  },
  {
    id: "apt-106",
    patientName: "Алия",
    patientPhone: "+7 (707) 333-55-77",
    serviceId: "srv-cleaning",
    serviceName: "Профессиональная чистка",
    doctorId: "doc-1",
    doctorName: "Dr. Ivan (Иван Смирнов)",
    date: "2026-09-24",
    time: "11:00",
    duration: 45,
    price: 15000,
    status: "confirmed",
    reminder24hSent: false,
    reminder2hSent: false,
    createdAt: "2026-09-21T07:45:00Z"
  }
];

export const defaultFaq: FaqItem[] = [
  {
    id: "faq-1",
    question: "Сколько стоит чистка?",
    answer: "Профессиональная комплексная чистка зубов стоит 15 000 ₸. В процедуру входит: бережный ультразвук (снятие зубного камня), пескоструйный аппарат AirFlow (удаление пигментированного налета от кофе и чая), полировка защитной пастой и укрепляющее фторирование эмали. Процедура длится 45 минут.",
    category: "prices"
  },
  {
    id: "faq-2",
    question: "Где вы находитесь?",
    answer: "Мы находимся по адресу: г. Алматы, пр. Достык, 128 (ЖК «Премиум Plaza», 2 этаж). Это прямо напротив ТРЦ «Достык Плаза». Для наших пациентов действует бесплатная охраняемая парковка со шлагбаумом.",
    category: "location"
  },
  {
    id: "faq-3",
    question: "До скольки работает клиника?",
    answer: "Клиника работает ежедневно: с понедельника по субботу с 08:30 до 20:30, а в воскресенье — с 09:00 до 18:00 без перерыва на обед.",
    category: "hours"
  },
  {
    id: "faq-4",
    question: "Можно ли записать ребёнка?",
    answer: "Да, обязательно! У нас работает замечательный детский врач Dr. Данияр Оспанов. Детский кабинет оборудован мультимедийным экраном на потолке — ребенок смотрит любимые мультфильмы в наушниках. Прием проходит в игровой форме, без боли и уколов, а после приема дарим подарок за храбрость!",
    category: "pediatric"
  },
  {
    id: "faq-5",
    question: "Сколько длится лечение?",
    answer: "Длительность зависит от процедуры: консультация — 30 минут; профессиональная чистка зубов — 45 минут; лечение поверхностного или среднего кариеса — около 60 минут; сложное лечение каналов или установка имплантата — 90 минут. Точное время врач назовет на осмотре.",
    category: "treatment"
  },
  {
    id: "faq-6",
    question: "Есть ли рассрочка?",
    answer: "Да! Мы сотрудничаем с Kaspi и Halyk Bank. Вы можете оформить рассрочку через Kaspi Red на 3 месяца либо Kaspi Рассрочку 0-0-12 (до 12 месяцев без переплат и скрытых комиссий). На дорогостоящие процедуры (имплантация, брекет-системы) доступна рассрочка Halyk Bank до 24 месяцев.",
    category: "payment"
  },
  {
    id: "faq-7",
    question: "Как подготовиться к приёму?",
    answer: "Перед приемом рекомендуем: 1) плотно покушать за 1–1.5 часа (на сытый желудок выделяется меньше слюны, и легче переносится анестезия; к тому же после лечения 2 часа нельзя есть); 2) почистить зубы щеткой и пастой; 3) не употреблять алкоголь за 24 часа; 4) если у вас есть свежие рентген-снимки или КТ, возьмите их с собой.",
    category: "preparation"
  },
  {
    id: "faq-8",
    question: "Больно ли лечить зубы? Какая анестезия?",
    answer: "Лечение проходит абсолютно безболезненно! Мы используем передовые анестетики артикаинового ряда (Германия, Франция). Перед уколом десна смазывается приятным фруктовым гелем-аппликатором, поэтому даже сам укол совершенно не чувствуется.",
    category: "safety"
  },
  {
    id: "faq-9",
    question: "Что делать при острой зубной боли?",
    answer: "При острой нестерпимой боли мы принимаем пациентов вне очереди в ближайший экстренный слот! Пожалуйста, НЕ прикладывайте к щеке горячие компрессы и не кладите таблетки аспирина на десну. Напишите мне, и я сразу забронирую ближайшее время у дежурного врача.",
    category: "emergency"
  }
];

export const defaultReminderSettings: ReminderSettings = {
  enable24h: true,
  template24h: "Здравствуйте, {patientName}! Напоминаем, что завтра {date} в {time} у вас приём в стоматологии DentaCare ({serviceName}, врач {doctorName}). Наш адрес: пр. Достык 128. Будем рады видеть вас!",
  enable2h: true,
  template2h: "Здравствуйте, {patientName}! Напоминаем, что сегодня в {time} у вас приём в стоматологии DentaCare. Ждем вас по адресу: пр. Достык 128 (парковка бесплатная).",
  smsEnabled: true,
  whatsappEnabled: true
};

export const defaultReminderLogs: ReminderLog[] = [
  {
    id: "rem-1",
    appointmentId: "apt-101",
    patientName: "Ерлан Сейткалиев",
    patientPhone: "+7 (701) 555-12-34",
    type: "24h",
    scheduledTime: "2026-09-21T09:30:00Z",
    sentAt: "2026-09-21T09:30:05Z",
    channel: "WhatsApp",
    messageText: "Здравствуйте, Ерлан! Напоминаем, что завтра 22 сентября в 09:30 у вас приём в нашей стоматологии.",
    status: "sent"
  },
  {
    id: "rem-2",
    appointmentId: "apt-102",
    patientName: "Айгерим Мусина",
    patientPhone: "+7 (705) 987-65-43",
    type: "24h",
    scheduledTime: "2026-09-21T10:45:00Z",
    sentAt: "2026-09-21T10:45:12Z",
    channel: "SMS",
    messageText: "Здравствуйте, Айгерим! Напоминаем, что завтра 22 сентября в 10:45 у вас приём в стоматологии DentaCare.",
    status: "sent"
  }
];

// Active state holder in memory
class ClinicDatabase {
  clinicInfo: ClinicInfo = clinicInfo;
  services: Service[] = [...defaultServices];
  doctors: Doctor[] = [...defaultDoctors];
  appointments: Appointment[] = [...defaultAppointments];
  faq: FaqItem[] = [...defaultFaq];
  reminderSettings: ReminderSettings = { ...defaultReminderSettings };
  reminderLogs: ReminderLog[] = [...defaultReminderLogs];

  // Helper to parse time string "HH:MM" to minutes from 00:00
  timeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  }

  minutesToTime(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }

  // Get day of week (1=Mon ... 7=Sun) for YYYY-MM-DD
  getDayOfWeek(dateStr: string): number {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const jsDay = date.getUTCDay(); // 0 is Sun, 1 is Mon...
    return jsDay === 0 ? 7 : jsDay;
  }

  // Find matching service by ID or fuzzy name
  findService(serviceQuery: string): Service | undefined {
    const q = serviceQuery.toLowerCase().trim();
    return this.services.find(s => 
      s.id.toLowerCase() === q ||
      s.name.toLowerCase().includes(q) ||
      q.includes(s.name.toLowerCase()) ||
      (q.includes("чистк") && s.id === "srv-cleaning") ||
      (q.includes("кариес") && s.id === "srv-caries") ||
      (q.includes("пломб") && s.id === "srv-caries") ||
      (q.includes("отбеливан") && s.id === "srv-whitening") ||
      (q.includes("удал") && s.id === "srv-extraction") ||
      (q.includes("канал") && s.id === "srv-canal") ||
      (q.includes("пульпит") && s.id === "srv-canal") ||
      (q.includes("коронк") && s.id === "srv-crown") ||
      (q.includes("имплант") && s.id === "srv-implant") ||
      (q.includes("брекет") && s.id === "srv-ortho") ||
      (q.includes("элайнер") && s.id === "srv-ortho") ||
      (q.includes("прикус") && s.id === "srv-ortho") ||
      (q.includes("детск") && s.id === "srv-pediatric") ||
      (q.includes("ребен") && s.id === "srv-pediatric") ||
      (q.includes("консультац") && s.id === "srv-consult") ||
      (q.includes("осмотр") && s.id === "srv-consult")
    );
  }

  // Find matching doctor
  findDoctor(doctorQuery: string): Doctor | undefined {
    const q = doctorQuery.toLowerCase().trim();
    return this.doctors.find(d => 
      d.id.toLowerCase() === q ||
      d.name.toLowerCase().includes(q) ||
      (q.includes("ivan") || q.includes("иван") ? d.id === "doc-1" : false) ||
      (q.includes("асель") || q.includes("asel") ? d.id === "doc-2" : false) ||
      (q.includes("марат") || q.includes("marat") ? d.id === "doc-3" : false) ||
      (q.includes("ким") || q.includes("елен") ? d.id === "doc-4" : false) ||
      (q.includes("данияр") || q.includes("детск") ? d.id === "doc-5" : false)
    );
  }

  // Calculate genuine available slots for a given date and service/doctor
  getAvailableSlots(params: {
    serviceId?: string;
    doctorId?: string;
    date: string; // YYYY-MM-DD
  }): SlotInfo[] {
    const { serviceId, doctorId, date } = params;
    const dayOfWeek = this.getDayOfWeek(date);

    // Eligible services
    let targetService = serviceId ? this.services.find(s => s.id === serviceId) : undefined;
    if (!targetService && serviceId) {
      targetService = this.findService(serviceId);
    }
    const duration = targetService ? targetService.duration : 45;

    // Eligible doctors
    let eligibleDoctors = this.doctors;
    if (doctorId) {
      eligibleDoctors = eligibleDoctors.filter(d => d.id === doctorId || d.name.toLowerCase().includes(doctorId.toLowerCase()));
    } else if (targetService) {
      eligibleDoctors = eligibleDoctors.filter(d => targetService!.doctorIds.includes(d.id));
    }

    const freeSlots: SlotInfo[] = [];

    for (const doc of eligibleDoctors) {
      // Check if doctor works on this day
      if (!doc.workDays.includes(dayOfWeek)) {
        continue;
      }

      const workStart = this.timeToMinutes(doc.workHours.start);
      const workEnd = this.timeToMinutes(doc.workHours.end);
      const breakStart = this.timeToMinutes(doc.breakHours.start);
      const breakEnd = this.timeToMinutes(doc.breakHours.end);

      // Existing bookings for this doctor on this date
      const docBookings = this.appointments.filter(
        a => a.doctorId === doc.id && a.date === date && a.status !== "cancelled"
      );

      // Step interval
      const step = doc.slotInterval || 45;

      for (let slotTime = workStart; slotTime + duration <= workEnd; slotTime += step) {
        const slotEnd = slotTime + duration;

        // Check break overlap
        if (slotTime < breakEnd && slotEnd > breakStart) {
          continue; // Overlaps lunch break
        }

        // Check appointment conflicts
        const hasConflict = docBookings.some(booking => {
          const bStart = this.timeToMinutes(booking.time);
          const bEnd = bStart + (booking.duration || 45);
          return slotTime < bEnd && slotEnd > bStart;
        });

        if (!hasConflict) {
          freeSlots.push({
            date,
            time: this.minutesToTime(slotTime),
            doctorId: doc.id,
            doctorName: doc.name,
            serviceId: targetService?.id,
            serviceName: targetService?.name
          });
        }
      }
    }

    // Sort chronologically
    return freeSlots.sort((a, b) => a.time.localeCompare(b.time));
  }

  // Find nearest available dates if a date has zero free slots
  findNearestAvailableSlots(serviceId: string, startDate: string, limitDays = 5): { date: string; slots: SlotInfo[] }[] {
    const results: { date: string; slots: SlotInfo[] }[] = [];
    const [y, m, d] = startDate.split("-").map(Number);
    const curr = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

    for (let i = 1; i <= limitDays; i++) {
      curr.setUTCDate(curr.getUTCDate() + 1);
      const nextDateStr = curr.toISOString().split("T")[0];
      const slots = this.getAvailableSlots({ serviceId, date: nextDateStr });
      if (slots.length > 0) {
        results.push({ date: nextDateStr, slots: slots.slice(0, 5) });
        if (results.length >= 2) break;
      }
    }

    return results;
  }

  // Create an appointment
  createAppointment(data: {
    patientName: string;
    patientPhone: string;
    serviceId: string;
    doctorId: string;
    date: string;
    time: string;
    notes?: string;
  }): { success: boolean; appointment?: Appointment; error?: string } {
    const service = this.services.find(s => s.id === data.serviceId);
    const doctor = this.doctors.find(d => d.id === data.doctorId);

    if (!service) return { success: false, error: "Услуга не найдена" };
    if (!doctor) return { success: false, error: "Врач не найден" };

    // Verify slot is actually free (CRITICAL: Never invent or double-book)
    const currentSlots = this.getAvailableSlots({
      serviceId: service.id,
      doctorId: doctor.id,
      date: data.date
    });

    const isAvailable = currentSlots.some(s => s.time === data.time);
    if (!isAvailable) {
      return {
        success: false,
        error: `Выбранное время ${data.time} на дату ${data.date} у доктора ${doctor.name} уже занято или недоступно.`
      };
    }

    const newApt: Appointment = {
      id: `apt-${Date.now().toString().slice(-6)}`,
      patientName: data.patientName.trim(),
      patientPhone: data.patientPhone.trim(),
      serviceId: service.id,
      serviceName: service.name,
      doctorId: doctor.id,
      doctorName: doctor.name,
      date: data.date,
      time: data.time,
      duration: service.duration,
      price: service.price,
      status: "confirmed",
      reminder24hSent: false,
      reminder2hSent: false,
      notes: data.notes,
      createdAt: new Date().toISOString()
    };

    this.appointments.unshift(newApt);

    // Add reminder queue items
    if (this.reminderSettings.enable24h) {
      this.reminderLogs.unshift({
        id: `rem-24h-${newApt.id}`,
        appointmentId: newApt.id,
        patientName: newApt.patientName,
        patientPhone: newApt.patientPhone,
        type: "24h",
        scheduledTime: `${newApt.date}T${newApt.time}:00Z - 24h`,
        channel: this.reminderSettings.whatsappEnabled ? "WhatsApp" : "SMS",
        messageText: `Здравствуйте, ${newApt.patientName}! Напоминаем, что завтра в ${newApt.time} у вас приём в нашей стоматологии (${newApt.serviceName}, врач ${newApt.doctorName}).`,
        status: "scheduled"
      });
    }

    if (this.reminderSettings.enable2h) {
      this.reminderLogs.unshift({
        id: `rem-2h-${newApt.id}`,
        appointmentId: newApt.id,
        patientName: newApt.patientName,
        patientPhone: newApt.patientPhone,
        type: "2h",
        scheduledTime: `${newApt.date}T${newApt.time}:00Z - 2h`,
        channel: this.reminderSettings.whatsappEnabled ? "WhatsApp" : "SMS",
        messageText: `Напоминаем, что сегодня в ${newApt.time} у вас приём в стоматологии DentaCare.`,
        status: "scheduled"
      });
    }

    return { success: true, appointment: newApt };
  }

  cancelAppointment(id: string): boolean {
    const apt = this.appointments.find(a => a.id === id);
    if (!apt) return false;
    apt.status = "cancelled";
    // Cancel scheduled reminders
    this.reminderLogs.forEach(r => {
      if (r.appointmentId === id && r.status === "scheduled") {
        r.status = "cancelled";
      }
    });
    return true;
  }
}

export const clinicDb = new ClinicDatabase();
