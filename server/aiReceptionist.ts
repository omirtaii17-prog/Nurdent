import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { clinicDb } from "./clinicDb.js";
import { ChatMessage, AppointmentDraft, SlotInfo, Doctor, ChatAction } from "../src/types.js";

// Initialize GoogleGenAI client lazily or with safety check
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
}) : null;

// Function declarations for Gemini tools
const checkAvailableSlotsTool: FunctionDeclaration = {
  name: "check_available_slots",
  description: "Проверить реальные свободные слоты на конкретную дату для выбранной стоматологической услуги или врача. НИКОГДА не выдумывать слоты из головы!",
  parameters: {
    type: Type.OBJECT,
    properties: {
      service_name: {
        type: Type.STRING,
        description: "Название или тип услуги (например: 'Профессиональная чистка', 'Лечение кариеса', 'Консультация', 'Удаление зуба')"
      },
      date: {
        type: Type.STRING,
        description: "Дата в формате YYYY-MM-DD (например: '2026-09-22'). Если пациент сказал 'завтра', переведи в точную дату относительно 2026-09-21."
      },
      doctor_name: {
        type: Type.STRING,
        description: "Опционально имя врача, если пациент запросил конкретного доктора (например: 'Dr. Ivan', 'Асель')"
      }
    },
    required: ["service_name", "date"]
  }
};

const getServicesAndPricesTool: FunctionDeclaration = {
  name: "get_services_and_prices",
  description: "Получить официальный перечень стоматологических услуг с точными ценами в тенге (₸), длительностью и описанием из базы клиники.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "Поисковый запрос (например: 'чистка', 'имплантация', 'ортодонтия', 'все услуги')"
      }
    }
  }
};

const getClinicFaqInfoTool: FunctionDeclaration = {
  name: "get_clinic_faq_info",
  description: "Получить точные факты о клинике: адрес, парковка, график работы, рассрочка Kaspi/Halyk, прием детей, подготовка к приему, острая боль.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      topic: {
        type: Type.STRING,
        description: "Тема вопроса: 'location', 'hours', 'installments', 'pediatric', 'preparation', 'pain_emergency', 'anesthesia'"
      }
    },
    required: ["topic"]
  }
};

const prepareBookingConfirmationTool: FunctionDeclaration = {
  name: "prepare_booking_confirmation",
  description: "Подготовить карточку подтверждения записи на приём, когда известны имя пациента, телефон, услуга, дата, время и врач. Пользователь увидит интерактивные кнопки [Подтвердить] и [Изменить].",
  parameters: {
    type: Type.OBJECT,
    properties: {
      patient_name: { type: Type.STRING, description: "Имя пациента (например: 'Алия')" },
      patient_phone: { type: Type.STRING, description: "Номер телефона пациента" },
      service_name_or_id: { type: Type.STRING, description: "Название услуги или ID" },
      date: { type: Type.STRING, description: "Дата приема YYYY-MM-DD" },
      time: { type: Type.STRING, description: "Время приема в формате HH:MM (например: '14:00')" },
      doctor_name_or_id: { type: Type.STRING, description: "Имя или ID врача (например: 'Dr. Ivan')" }
    },
    required: ["patient_name", "patient_phone", "service_name_or_id", "date", "time"]
  }
};

// Date normalization helper relative to simulated date 2026-09-21 (Monday)
function normalizeDateString(dateInput: string): string {
  const base = new Date(Date.UTC(2026, 8, 21, 12, 0, 0)); // 2026-09-21
  const lower = dateInput.toLowerCase().trim();

  if (lower.includes("сегодня")) {
    return "2026-09-21";
  }
  if (lower.includes("завтра")) {
    return "2026-09-22";
  }
  if (lower.includes("послезавтра")) {
    return "2026-09-23";
  }
  if (lower.includes("24") || lower.includes("четверг")) {
    return "2026-09-24";
  }
  if (lower.includes("25") || lower.includes("пятниц")) {
    return "2026-09-25";
  }
  if (lower.includes("26") || lower.includes("суббот")) {
    return "2026-09-26";
  }
  if (lower.includes("27") || lower.includes("воскрес")) {
    return "2026-09-27";
  }

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(lower)) {
    return lower;
  }

  // If DD.MM.YYYY
  const dotMatch = lower.match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?$/);
  if (dotMatch) {
    const d = dotMatch[1].padStart(2, "0");
    const m = dotMatch[2].padStart(2, "0");
    const y = dotMatch[3] || "2026";
    return `${y}-${m}-${d}`;
  }

  return "2026-09-22"; // default to tomorrow for demo if unclear
}

// Convert date like '2026-09-22' to Russian natural '22 сентября'
export function formatRussianDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const months = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря"
  ];
  return `${d} ${months[m - 1]}`;
}

export interface ReceptionistResponse {
  replyText: string;
  appointmentDraft?: AppointmentDraft;
  suggestedSlots?: SlotInfo[];
  recommendedDoctors?: Doctor[];
  actions?: ChatAction[];
  quickReplies?: string[];
  isEmergencyAlert?: boolean;
  needsHandoff?: boolean;
}

// Execute tool against clinicDb
function executeTool(name: string, args: any): { result: any; extra?: Partial<ReceptionistResponse> } {
  if (name === "check_available_slots") {
    const rawDate = args.date || "2026-09-22";
    const cleanDate = normalizeDateString(rawDate);
    const service = clinicDb.findService(args.service_name || "чистка");
    const doctor = args.doctor_name ? clinicDb.findDoctor(args.doctor_name) : undefined;

    const slots = clinicDb.getAvailableSlots({
      serviceId: service?.id,
      doctorId: doctor?.id,
      date: cleanDate
    });

    if (slots.length === 0) {
      const nearest = clinicDb.findNearestAvailableSlots(service?.id || "srv-cleaning", cleanDate);
      return {
        result: {
          available: false,
          message: `На выбранную дату (${formatRussianDate(cleanDate)}) свободных мест сейчас нет.`,
          nearestDates: nearest
        },
        extra: {
          suggestedSlots: nearest.flatMap(n => n.slots).slice(0, 4)
        }
      };
    }

    return {
      result: {
        available: true,
        date: cleanDate,
        formattedDate: formatRussianDate(cleanDate),
        service: service ? { name: service.name, price: service.price, duration: service.duration } : null,
        slots: slots.map(s => ({ time: s.time, doctor: s.doctorName }))
      },
      extra: {
        suggestedSlots: slots.slice(0, 5)
      }
    };
  }

  if (name === "get_services_and_prices") {
    const q = args.query ? args.query.toLowerCase() : "";
    let list = clinicDb.services.filter(s => s.active);
    if (q && q !== "все" && q !== "все услуги") {
      const found = clinicDb.findService(q);
      if (found) list = [found];
    }
    return {
      result: list.map(s => ({
        id: s.id,
        name: s.name,
        price: `${s.price.toLocaleString("ru-RU")} ₸`,
        duration: `${s.duration} мин`,
        description: s.description
      }))
    };
  }

  if (name === "get_clinic_faq_info") {
    const topic = args.topic;
    return {
      result: {
        clinic: clinicDb.clinicInfo,
        faq: clinicDb.faq
      }
    };
  }

  if (name === "prepare_booking_confirmation") {
    const cleanDate = normalizeDateString(args.date);
    const service = clinicDb.findService(args.service_name_or_id) || clinicDb.services[0];
    const doctor = (args.doctor_name_or_id ? clinicDb.findDoctor(args.doctor_name_or_id) : undefined) || 
      clinicDb.doctors.find(d => service.doctorIds.includes(d.id)) || clinicDb.doctors[0];

    const draft: AppointmentDraft = {
      patientName: args.patient_name || "Пациент",
      patientPhone: args.patient_phone || "+7 (777) 000-00-00",
      serviceId: service.id,
      serviceName: service.name,
      doctorId: doctor.id,
      doctorName: doctor.name,
      date: cleanDate,
      time: args.time || "14:00",
      duration: service.duration,
      price: service.price
    };

    return {
      result: {
        status: "card_ready",
        draft
      },
      extra: {
        appointmentDraft: draft
      }
    };
  }

  return { result: { error: "Unknown tool" } };
}

// Fallback rule-based receptionist when Gemini is unavailable or for instant triage
function fallbackReceptionist(userMessage: string, history: ChatMessage[]): ReceptionistResponse {
  const text = userMessage.toLowerCase().trim();

  // Kazakh language greetings & inquiries
  if (text.includes("сәлемет") || text.includes("қайырлы") || text.includes("тісім") || text.includes("емдеу") || text.includes("баға") || text.includes("дәрігер") || text.includes("жазылу")) {
    const slots = clinicDb.getAvailableSlots({ serviceId: "srv-consult", date: "2026-09-22" });
    return {
      replyText: "Сәлеметсіз бе! DentaCare цифрлық стоматология клиникасына қош келдіңіз. Мен — клиниканың AI-әкімшісімін.\n\nБіздің клиникада халықаралық стандарт бойынша ауыртпалықсыз емдеу жүргізіледі. Мен сізге қажетті дәрігерді таңдап, бағасын анықтауға және бос уақытқа жылдам жазылуға көмектесемін.\n\nСізді қандай мәселе немесе тіс мазалап тұр?",
      suggestedSlots: slots.slice(0, 3),
      recommendedDoctors: [clinicDb.doctors[0], clinicDb.doctors[1]],
      actions: [
        { label: "Дәрігерлер мен кесте", type: "navigate_doctors" },
        { label: "Қабылдауға жазылу", type: "open_booking" },
        { label: "2GIS бағыты", type: "open_2gis" }
      ],
      quickReplies: ["Тісім қатты ауырып тұр", "Тіс тазалау бағасы қанша?", "Ертеңге жазылуға бола ма?"]
    };
  }

  // English inquiries
  if (text.includes("hello") || text.includes("hi") || text.includes("toothache") || text.includes("doctor") || text.includes("appointment") || text.includes("price") || text.includes("english")) {
    const slots = clinicDb.getAvailableSlots({ serviceId: "srv-consult", date: "2026-09-22" });
    return {
      replyText: "Hello and welcome to DentaCare Dental Clinic in Almaty! I am your AI digital receptionist.\n\nWe provide pain-free digital dentistry, professional hygiene, dental implants, and Damon orthodontic systems. I can help answer your questions, suggest the right specialist, and book your visit.",
      suggestedSlots: slots.slice(0, 3),
      recommendedDoctors: [clinicDb.doctors[0], clinicDb.doctors[3]],
      actions: [
        { label: "Doctors & Schedule", type: "navigate_doctors" },
        { label: "Book Appointment", type: "open_booking" },
        { label: "Get Directions (2GIS)", type: "open_2gis" }
      ],
      quickReplies: ["Book appointment tomorrow", "Toothache consultation", "How to find you?"]
    };
  }

  // Request for human administrator handoff
  if (text.includes("человек") || text.includes("оператор") || text.includes("администратор") || text.includes("живой") || text.includes("позвонить") || text.includes("менеджер")) {
    return {
      replyText: "Я с радостью передам вас старшему администратору клиники DentaCare! Вы можете прямо сейчас позвонить нам по телефону, написать в WhatsApp или заказать звонок.",
      needsHandoff: true,
      actions: [
        { label: "📞 Позвонить администратору", type: "call_admin" },
        { label: "💬 Написать в WhatsApp", type: "whatsapp_admin" },
        { label: "📍 Как нас найти (2GIS)", type: "open_2gis" }
      ],
      quickReplies: ["Позвонить в клинику", "Написать в WhatsApp", "Вернуться к записи"]
    };
  }

  // 1. Toothache & night pain triage (Requirement: Pain worse at night -> терапевт)
  if (text.includes("ночью") || text.includes("ноч") || text.includes("пульсирует") || text.includes("болит зуб") || text.includes("острая боль") || text.includes("ноет")) {
    const docIvan = clinicDb.doctors.find(d => d.id === "doc-1") || clinicDb.doctors[0];
    const docAsel = clinicDb.doctors.find(d => d.id === "doc-2") || clinicDb.doctors[1];
    const urgentSlots = clinicDb.getAvailableSlots({ serviceId: "srv-consult", date: "2026-09-22" }).slice(0, 4);

    return {
      replyText: "Понимаю вас, зубная боль (особенно усиливающаяся ночью или пульсирующая) — это серьезный сигнал, часто связанный с воспалением внутри зуба (пульпит). По международному протоколу важно не терпеть боль и не греть щеку.\n\nЛучше всего начать с консультации стоматолога-терапевта: врач сделает прицельный цифровой снимок, бережно обезболит и сразу устранит причину боли. Ниже рекомендуемые доктора и ближайшие окна для записи:",
      suggestedSlots: urgentSlots,
      recommendedDoctors: [docIvan, docAsel],
      actions: [
        { label: "Записаться к терапевту", type: "open_booking", doctorId: docIvan.id, serviceId: "srv-consult" },
        { label: "Врачи и портфолио работ", type: "navigate_doctors", doctorId: docIvan.id },
        { label: "📍 Маршрут в 2GIS", type: "open_2gis" },
        { label: "📞 Связаться с клиникой", type: "call_admin" }
      ],
      isEmergencyAlert: true,
      quickReplies: ["Записаться на завтра", "Срочный прием", "Кто ведет прием?"]
    };
  }

  // 2. Orthodontics: Braces, aligners, uneven teeth, bite
  if (text.includes("брекет") || text.includes("элайнер") || text.includes("прикус") || text.includes("крив") || text.includes("ровн") || text.includes("выровн")) {
    const docElena = clinicDb.doctors.find(d => d.id === "doc-4") || clinicDb.doctors[3];
    const orthoSlots = clinicDb.getAvailableSlots({ serviceId: "srv-ortho", doctorId: docElena.id, date: "2026-09-23" }).slice(0, 3);

    return {
      replyText: "Для исправления прикуса и выравнивания зубов вам лучше всего начать с первичной консультации врача-ортодонта.\n\nНаш ведущий ортодонт — Dr. Елена Ким (опыт 11 лет). Доктор работает как с премиальными самолигирующими брекетами Damon, так и с незаметными прозрачными каппами-элайнерами Spark. На приёме доктор проведет осмотр, фотопротокол и составит индивидуальный план лечения.",
      suggestedSlots: orthoSlots,
      recommendedDoctors: [docElena],
      actions: [
        { label: "Записаться к Dr. Елене Ким", type: "open_booking", doctorId: docElena.id, serviceId: "srv-ortho" },
        { label: "Смотреть работы ортодонта", type: "navigate_portfolio", doctorId: docElena.id },
        { label: "Стоимость брекетов и элайнеров", type: "navigate_services", serviceId: "srv-ortho" }
      ],
      quickReplies: ["Записаться на консультацию", "Показать работы До/После", "Есть ли рассрочка?"]
    };
  }

  // 3. Implants & Missing teeth
  if (text.includes("имплант") || text.includes("нет зуба") || text.includes("вставить зуб") || text.includes("удалить зуб") || text.includes("мудрост")) {
    const docMarat = clinicDb.doctors.find(d => d.id === "doc-3") || clinicDb.doctors[2];
    const srvId = text.includes("имплант") ? "srv-implant" : "srv-extraction";
    const surgSlots = clinicDb.getAvailableSlots({ serviceId: srvId, doctorId: docMarat.id, date: "2026-09-22" }).slice(0, 3);

    return {
      replyText: "Для восстановления отсутствующего зуба или удаления зуба мудрости необходима консультация челюстно-лицевого хирурга-имплантолога.\n\nОперации у нас проводит Dr. Марат Жумабаев (стаж 16 лет, более 4 500 успешно установленных имплантатов Osstem и Straumann). Мы используем 3D-навигационные шаблоны и атравматичный ультразвуковой пьезотом, что гарантирует быстрое заживление без отеков.",
      suggestedSlots: surgSlots,
      recommendedDoctors: [docMarat],
      actions: [
        { label: "Записаться к Dr. Марату Жумабаеву", type: "open_booking", doctorId: docMarat.id, serviceId: srvId },
        { label: "Посмотреть клинические работы", type: "navigate_portfolio", doctorId: docMarat.id },
        { label: "Рассрочка на имплантацию", type: "navigate_services", serviceId: "srv-implant" }
      ],
      quickReplies: ["Записаться на 22 сентября", "Сколько стоит имплантация?", "Показать расписание врача"]
    };
  }

  // 4. Pediatric dentistry
  if (text.includes("ребен") || text.includes("детск") || text.includes("малыш") || text.includes("доч") || text.includes("сын")) {
    const docDaniyar = clinicDb.doctors.find(d => d.id === "doc-5") || clinicDb.doctors[4];
    const pedSlots = clinicDb.getAvailableSlots({ serviceId: "srv-pediatric", doctorId: docDaniyar.id, date: "2026-09-22" }).slice(0, 3);

    return {
      replyText: "Для маленьких пациентов у нас создано специальное детское отделение! Приём ведет Dr. Данияр Оспанов (опыт 8 лет, врач высшей категории).\n\nЛечение проходит в игровой форме без уколов и страха: над креслом установлен экран с любимыми мультфильмами, используются биосовместимые цветные пломбы, а в конце визита доктор вручает малышу медаль и подарок за храбрость!",
      suggestedSlots: pedSlots,
      recommendedDoctors: [docDaniyar],
      actions: [
        { label: "Записать ребёнка к Dr. Данияру", type: "open_booking", doctorId: docDaniyar.id, serviceId: "srv-pediatric" },
        { label: "Профиль и отзывы врача", type: "navigate_doctors", doctorId: docDaniyar.id }
      ],
      quickReplies: ["Записаться на завтра", "Сколько длится приём?", "Цены на детский приём"]
    };
  }

  // 5. Whitening & Hygiene
  if (text.includes("чистк") || text.includes("гигиен") || text.includes("отбеливан") || text.includes("airflow") || text.includes("налет")) {
    const docAsel = clinicDb.doctors.find(d => d.id === "doc-2") || clinicDb.doctors[1];
    const srv = text.includes("отбеливан") ? clinicDb.services.find(s => s.id === "srv-whitening")! : clinicDb.services.find(s => s.id === "srv-cleaning")!;
    const cleanSlots = clinicDb.getAvailableSlots({ serviceId: srv.id, doctorId: docAsel.id, date: "2026-09-22" }).slice(0, 4);

    return {
      replyText: `Процедуру ${srv.name.toLowerCase()} проводит Dr. Асель Касымова (опыт 9 лет, сертифицированный гигиенист).\n\nСтоимость процедуры: ${srv.price.toLocaleString("ru-RU")} ₸. Мы применяем оригинальный швейцарский аппарат AirFlow с мягким порошком на основе глицина и систему холодного фотоотбеливания Beyond Polus без повышения чувствительности эмали.`,
      suggestedSlots: cleanSlots,
      recommendedDoctors: [docAsel],
      actions: [
        { label: `Записаться на ${srv.name}`, type: "open_booking", doctorId: docAsel.id, serviceId: srv.id },
        { label: "Работы До/После отбеливания", type: "navigate_portfolio", doctorId: docAsel.id }
      ],
      quickReplies: ["Записаться на завтра", "Показать свободное время", "Где вы находитесь?"]
    };
  }

  // 6. Address & 2GIS
  if (text.includes("где вы") || text.includes("находит") || text.includes("адрес") || text.includes("парковк") || text.includes("2gis") || text.includes("доехать")) {
    return {
      replyText: `Мы находимся по адресу: ${clinicDb.clinicInfo.address} (${clinicDb.clinicInfo.landmark}).\n\nДля наших пациентов действует ${clinicDb.clinicInfo.parking.toLowerCase()}.\n\nВы можете открыть маршрут прямо в приложении 2GIS:`,
      actions: [
        { label: "📍 Как нас найти (Маршрут в 2GIS)", type: "open_2gis" },
        { label: "Записаться на приём", type: "open_booking" },
        { label: "📞 Позвонить в клинику", type: "call_admin" }
      ],
      quickReplies: ["Открыть 2GIS маршрут", "График работы", "Записаться на приём"]
    };
  }

  // 7. Working hours
  if (text.includes("до скольки") || text.includes("график") || text.includes("режим") || text.includes("часы работ") || text.includes("время работ")) {
    return {
      replyText: `Клиника DentaCare открыта для вас каждый день без перерыва на обед:\n• Понедельник – Суббота: ${clinicDb.clinicInfo.workingHoursWeekdays}\n• Воскресенье: ${clinicDb.clinicInfo.workingHoursWeekend}\n\nНа какой день вам удобнее запланировать консультацию?`,
      actions: [
        { label: "Записаться на приём", type: "open_booking" },
        { label: "Расписание врачей", type: "navigate_doctors" }
      ],
      quickReplies: ["Записаться на завтра", "Записаться на выходные", "Посмотреть услуги"]
    };
  }

  // 8. Installments & Banks
  if (text.includes("рассрочк") || text.includes("каспи") || text.includes("kaspi") || text.includes("halyk") || text.includes("кредит")) {
    return {
      replyText: "Да, у нас действует честная рассрочка 0% без переплат и скрытых комиссий:\n• Kaspi Red на 3 месяца\n• Kaspi Рассрочка 0-0-12 (до 12 месяцев)\n• Halyk Bank до 24 месяцев на установку имплантатов и брекетов.\n\nОформление занимает ровно 2 минуты через приложение банка прямо на ресепшене.",
      actions: [
        { label: "Услуги и цены", type: "navigate_services" },
        { label: "Записаться на осмотр", type: "open_booking" }
      ],
      quickReplies: ["Записаться на консультацию", "Прайс-лист услуг", "Где вы находитесь?"]
    };
  }

  // 9. Booking flow: service + date + time + phone
  const service = clinicDb.findService(text) || clinicDb.services.find(s => s.id === "srv-cleaning")!;
  const cleanDate = normalizeDateString(text);
  const timeMatch = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  const selectedTime = timeMatch ? timeMatch[0].padStart(5, "0") : null;
  const phoneMatch = text.match(/(?:\+?7|8)?[\s(-]*\d{3}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}/);
  const nameMatch = text.match(/(?:меня зовут|я|имя)\s+([А-Яа-яA-Za-z]+)/i) || 
    (text.split(/[\s,]+/).find(w => /^[А-ЯA-Z][а-яa-z]{2,15}$/.test(w) && !["Завтра", "Сегодня", "Конечно", "Отлично", "Можно", "Чистка", "Здравствуйте"].includes(w)));

  let prevDraft: AppointmentDraft | undefined;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].appointmentDraft) {
      prevDraft = { ...history[i].appointmentDraft! };
      break;
    }
  }

  if (selectedTime && (phoneMatch || text.includes("алия") || prevDraft)) {
    const patientName = nameMatch ? (typeof nameMatch === "string" ? nameMatch : nameMatch[1]) : (text.includes("алия") ? "Алия" : "Алия");
    const patientPhone = phoneMatch ? phoneMatch[0] : "+7 (777) 123-45-67";
    const doctor = clinicDb.doctors.find(d => service.doctorIds.includes(d.id)) || clinicDb.doctors[0];

    const draft: AppointmentDraft = {
      patientName,
      patientPhone,
      serviceId: service.id,
      serviceName: service.name,
      doctorId: doctor.id,
      doctorName: doctor.name,
      date: cleanDate,
      time: selectedTime,
      duration: service.duration,
      price: service.price
    };

    return {
      replyText: `Отлично! Я сформировала предварительную запись на «${service.name}» к врачу ${doctor.name} на ${formatRussianDate(cleanDate)} в ${selectedTime}.\n\nПожалуйста, проверьте данные ниже и нажмите «Подтвердить», чтобы закрепить за вами слот:`,
      appointmentDraft: draft,
      actions: [
        { label: "📍 Как проехать (2GIS)", type: "open_2gis" }
      ],
      quickReplies: ["Подтвердить запись", "Выбрать другое время"]
    };
  }

  if (text.includes("записат") || text.includes("хочу") || text.includes("слот") || text.includes("свободн")) {
    const slots = clinicDb.getAvailableSlots({
      serviceId: service.id,
      date: cleanDate
    });

    if (slots.length > 0) {
      const displaySlots = slots.slice(0, 4);
      const timesStr = displaySlots.map(s => s.time).join(", ");

      return {
        replyText: `Конечно! На ${formatRussianDate(cleanDate)} есть свободные окна на «${service.name}» в ${timesStr}. Какое время вам удобнее?`,
        suggestedSlots: displaySlots,
        recommendedDoctors: [clinicDb.doctors.find(d => service.doctorIds.includes(d.id)) || clinicDb.doctors[0]],
        actions: [
          { label: "Открыть форму записи", type: "open_booking", serviceId: service.id }
        ],
        quickReplies: displaySlots.map(s => `В ${s.time}`)
      };
    } else {
      const nearest = clinicDb.findNearestAvailableSlots(service.id, cleanDate);
      return {
        replyText: `На выбранную дату (${formatRussianDate(cleanDate)}) свободных мест сейчас нет. Могу предложить ближайшие доступные слоты:`,
        suggestedSlots: nearest.flatMap(n => n.slots).slice(0, 4),
        actions: [
          { label: "Посмотреть расписание врачей", type: "navigate_doctors" }
        ],
        quickReplies: nearest.flatMap(n => n.slots.map(s => `${formatRussianDate(s.date)} в ${s.time}`)).slice(0, 3)
      };
    }
  }

  if (selectedTime) {
    return {
      replyText: `Отлично! Записываю вас на «${service.name}» ${formatRussianDate(cleanDate)} в ${selectedTime}.\n\nПодскажите, пожалуйста, ваше имя и номер телефона для подтверждения.`,
      quickReplies: ["Алия, +7 (707) 333-55-77", "Меня зовут Ерлан, +7 (701) 555-12-34"]
    };
  }

  // Default digital clinic receptionist welcome
  return {
    replyText: "Здравствуйте! Рада приветствовать вас в клинике цифровой стоматологии DentaCare. Меня зовут Аида, я ваш персональный AI-администратор.\n\nОпишите вашу проблему или цель (например: «Болит зуб ночью», «Хочу брекеты», «Нужна чистка зубов» или «Хочу восстановить зуб»), и я помогу вам подобрать лучшего специалиста, посмотреть его работы и сразу записаться на удобное время!",
    recommendedDoctors: clinicDb.doctors.slice(0, 3),
    actions: [
      { label: "👨‍⚕️ Врачи и расписание", type: "navigate_doctors" },
      { label: "📋 Услуги и прайс-лист", type: "navigate_services" },
      { label: "📍 Как нас найти (2GIS)", type: "open_2gis" },
      { label: "📞 AI-звонок в клинику", type: "voice_call" }
    ],
    quickReplies: [
      "Болит зуб и боль усиливается ночью",
      "Хочу поставить брекеты",
      "Хочу имплант",
      "Сколько стоит чистка зубов?",
      "Как до вас доехать в 2GIS?"
    ]
  };
}

// Main conversation orchestrator
export async function processReceptionistChat(
  userMessage: string,
  history: ChatMessage[] = []
): Promise<ReceptionistResponse> {
  // If no Gemini API key, use the robust clinical fallback
  if (!ai || !process.env.GEMINI_API_KEY) {
    return fallbackReceptionist(userMessage, history);
  }

  try {
    const systemInstruction = `Ты — Аида, профессиональный, приветливый и чуткий AI-администратор современной стоматологической клиники DentaCare (г. Алматы).
Текущая дата: 21 сентября 2026 года (понедельник). "Завтра" — это 22 сентября 2026 г. (2026-09-22). "24 сентября" — это 2026-09-24.

ТВОЯ ГЛАВНАЯ ЗАДАЧА:
Общаться с пациентами, отвечать на типовые вопросы и помогать записаться на приём.
Сценарий:
Пациент пишет сообщение → Приветствуешь → Понимаешь потребность → Определяешь услугу → Уточняешь дату/время → Вызываешь check_available_slots → Предлагаешь реальные свободные слоты → Получаешь имя и телефон → Вызываешь prepare_booking_confirmation для показа интерактивной карточки подтверждения.

КРИТИЧЕСКИЕ ПРАВИЛА:
1. НИКОГДА НЕ ВЫДУМЫВАЙ свободное время, слоты, врачей, цены, адрес или график работы! Все эти данные должны приходить из инструментов базы данных (check_available_slots, get_services_and_prices, get_clinic_faq_info).
Если мест нет: «На выбранную дату свободных мест сейчас нет. Могу посмотреть ближайшие доступные даты.»
2. РАЗГОВАРИВАЙ ЕСТЕСТВЕННО, доброжелательно, как первоклассный живой администратор премиум-клиники. Никаких шаблонных робо-фраз.
3. МЕДИЦИНСКАЯ БЕЗОПАСНОСТЬ:
Ты — администратор, а НЕ врач!
КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО: ставить диагнозы, назначать антибиотики или медикаменты, давать медицинские гарантии исхода лечения.
При острой боли, отеке, кровотечении: вырази сочувствие, предупреди не греть щеку и немедленно предложи ближайший экстренный приём у дежурного врача вне очереди!
4. ПОДТВЕРЖДЕНИЕ ЗАПИСИ:
Когда пациент выбрал время и назвал имя/телефон, ОБЯЗАТЕЛЬНО вызови инструмент prepare_booking_confirmation, чтобы в чате появилась красивая карточка подтверждения с кнопками [Подтвердить] и [Изменить].
5. Цены всегда в тенге (₸).`;

    // Determine context-based suggested actions and recommended doctors
    const userLower = userMessage.toLowerCase();
    const actions: ChatAction[] = [];
    let recDocs: Doctor[] | undefined;

    if (userLower.includes("болит") || userLower.includes("ноч") || userLower.includes("зуб")) {
      recDocs = [clinicDb.doctors[0], clinicDb.doctors[1]];
      actions.push({ label: "Записаться к терапевту", type: "open_booking", doctorId: "doc-1", serviceId: "srv-consult" });
      actions.push({ label: "Врачи и портфолио", type: "navigate_doctors" });
    } else if (userLower.includes("брекет") || userLower.includes("элайнер") || userLower.includes("прикус")) {
      recDocs = [clinicDb.doctors[3]];
      actions.push({ label: "Записаться к ортодонту", type: "open_booking", doctorId: "doc-4", serviceId: "srv-ortho" });
      actions.push({ label: "Портфолио ортодонта", type: "navigate_portfolio", doctorId: "doc-4" });
    } else if (userLower.includes("имплант") || userLower.includes("удал")) {
      recDocs = [clinicDb.doctors[2]];
      actions.push({ label: "Записаться к хирургу", type: "open_booking", doctorId: "doc-3", serviceId: "srv-implant" });
      actions.push({ label: "Работы по имплантации", type: "navigate_portfolio", doctorId: "doc-3" });
    } else if (userLower.includes("ребен") || userLower.includes("детск")) {
      recDocs = [clinicDb.doctors[4]];
      actions.push({ label: "Записать ребёнка", type: "open_booking", doctorId: "doc-5", serviceId: "srv-pediatric" });
    }

    if (userLower.includes("где") || userLower.includes("адрес") || userLower.includes("2gis") || userLower.includes("доехать")) {
      actions.push({ label: "📍 Как нас найти (2GIS)", type: "open_2gis" });
    }
    if (userLower.includes("человек") || userLower.includes("администратор") || userLower.includes("позвонить")) {
      actions.push({ label: "📞 Позвонить администратору", type: "call_admin" });
    }

    // Map conversation history
    const contents: any[] = [];
    for (const msg of history.slice(-6)) {
      contents.push({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }]
      });
    }
    contents.push({
      role: "user",
      parts: [{ text: userMessage }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.5,
        tools: [{
          functionDeclarations: [
            checkAvailableSlotsTool,
            getServicesAndPricesTool,
            getClinicFaqInfoTool,
            prepareBookingConfirmationTool
          ]
        }]
      }
    });

    let extraInfo: Partial<ReceptionistResponse> = {};
    const functionCalls = response.functionCalls;

    if (functionCalls && functionCalls.length > 0) {
      // Execute the first tool
      const call = functionCalls[0];
      const toolName = call.name || "";
      const exec = executeTool(toolName, call.args || {});
      if (exec.extra) {
        extraInfo = { ...exec.extra };
      }

      // Feed function response back to Gemini for final natural phrasing
      const functionResponseParts = [
        {
          functionResponse: {
            name: toolName,
            response: exec.result
          }
        }
      ];

      const secondResponse = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          ...contents,
          response.candidates?.[0]?.content as any,
          {
            role: "tool",
            parts: functionResponseParts
          }
        ],
        config: {
          systemInstruction,
          temperature: 0.6
        }
      });

      const replyText = secondResponse.text || "Буду рада помочь вам с записью на приём в DentaCare!";
      return {
        replyText,
        recommendedDoctors: extraInfo.recommendedDoctors || recDocs,
        actions: extraInfo.actions || (actions.length > 0 ? actions : undefined),
        ...extraInfo
      };
    }

    const replyText = response.text || fallbackReceptionist(userMessage, history).replyText;
    return {
      replyText,
      recommendedDoctors: extraInfo.recommendedDoctors || recDocs,
      actions: extraInfo.actions || (actions.length > 0 ? actions : undefined),
      ...extraInfo
    };
  } catch (error) {
    console.error("Gemini API error in processReceptionistChat:", error);
    // Graceful fallback ensuring continuous operation
    return fallbackReceptionist(userMessage, history);
  }
}
