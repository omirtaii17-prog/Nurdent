import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { clinicDb } from "./clinicDb.js";
import { ChatMessage, AppointmentDraft, SlotInfo } from "../src/types.js";

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
  quickReplies?: string[];
  isEmergencyAlert?: boolean;
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

// Fallback rule-based receptionist when Gemini is unavailable
function fallbackReceptionist(userMessage: string, history: ChatMessage[]): ReceptionistResponse {
  const text = userMessage.toLowerCase().trim();

  // 1. Emergency safety check
  if (text.includes("острая боль") || text.includes("болит зуб") || text.includes("очень болит") || text.includes("опухла") || text.includes("отек") || text.includes("кровь")) {
    const todaySlots = clinicDb.getAvailableSlots({ serviceId: "srv-consult", date: "2026-09-21" });
    const nextSlots = clinicDb.getAvailableSlots({ serviceId: "srv-consult", date: "2026-09-22" });
    const urgentSlots = [...todaySlots, ...nextSlots].slice(0, 3);

    return {
      replyText: "Понимаю вас, зубная боль — это очень тяжело! Мы обязательно вам поможем. В нашей клинике при острой боли пациенты принимаются без очереди в экстренный коридор дежурного врача.\n\nПожалуйста, ни в коем случае не прикладывайте горячие компрессы к щеке и не кладите анальгин на десну. Могу прямо сейчас записать вас на ближайшее время:",
      suggestedSlots: urgentSlots,
      isEmergencyAlert: true,
      quickReplies: ["Записаться на ближайшее время", "Срочный осмотр", "Позвонить в клинику"]
    };
  }

  // 2. Pricing & FAQ questions
  if (text.includes("чистк") && (text.includes("скольк") || text.includes("цена") || text.includes("стоит"))) {
    const service = clinicDb.services.find(s => s.id === "srv-cleaning")!;
    return {
      replyText: `Профессиональная комплексная чистка зубов у нас стоит ${service.price.toLocaleString("ru-RU")} ₸.\n\nВ процедуру входит: бережный ультразвук (снятие зубного камня), пескоструйный AirFlow (удаление налета от чая и кофе), полировка эмали и укрепляющее фторирование. Длительность — ${service.duration} минут.\n\nЖелаете выбрать удобный день для визита?`,
      quickReplies: ["Записаться на чистку завтра", "Показать свободные слоты", "Кто проводит чистку?"]
    };
  }

  if (text.includes("где вы") || text.includes("находит") || text.includes("адрес") || text.includes("парковк")) {
    return {
      replyText: `Мы находимся по адресу: ${clinicDb.clinicInfo.address} (${clinicDb.clinicInfo.landmark}).\n\nДля наших пациентов действует ${clinicDb.clinicInfo.parking.toLowerCase()}.\n\nПодсказать, как лучше проехать, или помочь записаться на приём?`,
      quickReplies: ["Записаться на приём", "График работы", "Стоимость услуг"]
    };
  }

  if (text.includes("до скольки") || text.includes("график") || text.includes("режим") || text.includes("часы работ")) {
    return {
      replyText: `Клиника DentaCare работает ежедневно:\n• Понедельник – Суббота: ${clinicDb.clinicInfo.workingHoursWeekdays}\n• Воскресенье: 09:00 – 18:00\n\nМы работаем без перерыва. На какой день вам было бы удобно подойти?`,
      quickReplies: ["Записаться на завтра", "Записаться на выходные", "Посмотреть услуги"]
    };
  }

  if (text.includes("ребен") || text.includes("детск")) {
    const srv = clinicDb.services.find(s => s.id === "srv-pediatric")!;
    const doc = clinicDb.doctors.find(d => d.id === "doc-5")!;
    return {
      replyText: `Да, конечно! У нас замечательное детское отделение и добрый врач ${doc.name}. Приём проходит в игровой адаптационной форме, на потолке телевизор с мультиками, а после приёма малыш получает подарок смельчака! Стоимость детского приёма — ${srv.price.toLocaleString("ru-RU")} ₸.\n\nСколько лет вашему ребёнку и на какой день хотите запланировать визит?`,
      quickReplies: ["Записать ребёнка на завтра", "Расписание детского врача", "Подробнее об отделении"]
    };
  }

  if (text.includes("рассрочк") || text.includes("каспи") || text.includes("kaspi") || text.includes("halyk") || text.includes("кредит")) {
    return {
      replyText: `Да, у нас действует рассрочка!\n• Kaspi Red на 3 месяца\n• Kaspi Рассрочка 0-0-12 (до 12 месяцев без переплат)\n• Halyk Bank до 24 месяцев на установку имплантатов и брекетов.\n\nОформить рассрочку можно прямо у нас на ресепшене через мобильное приложение за 2 минуты.`,
      quickReplies: ["Записаться на консультацию", "Прайс-лист услуг", "Где вы находитесь?"]
    };
  }

  if (text.includes("подготов") || text.includes("перед прием")) {
    return {
      replyText: `Подготовиться к приёму очень просто:\n1. Рекомендуем плотно перекусить за 1–1.5 часа до визита (после анестезии 2 часа не рекомендуется есть, а на сытый желудок меньше вырабатывается слюна).\n2. Почистить зубы щеткой и пастой.\n3. За сутки воздержаться от алкоголя.\n\nЕсли у вас есть свежие рентген-снимки, обязательно возьмите их с собой!`,
      quickReplies: ["Записаться на приём", "Сколько стоит чистка?", "Наши врачи"]
    };
  }

  // 3. Booking flow: "записаться на чистку завтра"
  const service = clinicDb.findService(text) || clinicDb.services.find(s => s.id === "srv-cleaning")!;
  const cleanDate = normalizeDateString(text);

  // Check if patient selected a specific time e.g. "14:00" or "в 14:00"
  const timeMatch = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  const selectedTime = timeMatch ? timeMatch[0].padStart(5, "0") : null;

  // Check for phone number and name in history or current message
  const phoneMatch = text.match(/(?:\+?7|8)?[\s(-]*\d{3}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}/);
  const nameMatch = text.match(/(?:меня зовут|я|имя)\s+([А-Яа-яA-Za-z]+)/i) || 
    (text.split(/[\s,]+/).find(w => /^[А-ЯA-Z][а-яa-z]{2,15}$/.test(w) && !["Завтра", "Сегодня", "Конечно", "Отлично", "Можно", "Чистка"].includes(w)));

  // Extract previous context from history
  let prevDraft: AppointmentDraft | undefined;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].appointmentDraft) {
      prevDraft = { ...history[i].appointmentDraft! };
      break;
    }
  }

  // If user selected a time and provided details or wants to confirm
  if (selectedTime && (phoneMatch || text.includes("алия") || prevDraft)) {
    const patientName = nameMatch ? (typeof nameMatch === "string" ? nameMatch : nameMatch[1]) : (text.includes("алия") ? "Алия" : "Алия");
    const patientPhone = phoneMatch ? phoneMatch[0] : "+7 (777) 123-45-67";
    const doctor = clinicDb.doctors[0]; // Dr. Ivan

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
      replyText: `Отлично! Я сформировал предварительную запись на ${service.name.toLowerCase()} на ${formatRussianDate(cleanDate)} в ${selectedTime}.\n\nПожалуйста, проверьте данные ниже и нажмите «Подтвердить», чтобы закрепить за вами слот:`,
      appointmentDraft: draft,
      quickReplies: ["Подтвердить запись", "Выбрать другое время"]
    };
  }

  // If user asked: "Можно записаться на чистку завтра?"
  if (text.includes("записат") || text.includes("хочу") || text.includes("слот") || text.includes("свободн")) {
    const slots = clinicDb.getAvailableSlots({
      serviceId: service.id,
      date: cleanDate
    });

    if (slots.length > 0) {
      // Pick representative slots like 11:30, 14:00, 17:30
      const displaySlots = slots.slice(0, 4);
      const timesStr = displaySlots.map(s => s.time).join(", ");

      return {
        replyText: `Конечно! На ${formatRussianDate(cleanDate)} есть свободные места в ${timesStr}. Какое время вам удобнее?`,
        suggestedSlots: displaySlots,
        quickReplies: displaySlots.map(s => `В ${s.time}`)
      };
    } else {
      const nearest = clinicDb.findNearestAvailableSlots(service.id, cleanDate);
      return {
        replyText: `На выбранную дату (${formatRussianDate(cleanDate)}) свободных мест сейчас нет. Могу посмотреть ближайшие доступные даты. Например, есть свободные слоты на ${nearest.map(n => formatRussianDate(n.date)).join(" и ")}. Подойдет?`,
        suggestedSlots: nearest.flatMap(n => n.slots).slice(0, 4),
        quickReplies: nearest.flatMap(n => n.slots.map(s => `${formatRussianDate(s.date)} в ${s.time}`)).slice(0, 3)
      };
    }
  }

  // If user replied with just a time like "14:00" or "в 14:00"
  if (selectedTime) {
    return {
      replyText: `Отлично. Записываю вас на ${service.name.toLowerCase()} ${formatRussianDate(cleanDate)} в ${selectedTime}.\n\nПодскажите, пожалуйста, ваше имя и номер телефона для подтверждения.`,
      quickReplies: ["Алия, +7 (707) 333-55-77", "Меня зовут Ерлан, +7 (701) 555-12-34"]
    };
  }

  // Default friendly clinic welcome
  return {
    replyText: `Здравствуйте! Рада приветствовать вас в клинике DentaCare. Меня зовут Аида, я AI-администратор клиники.\n\nЯ могу рассказать вам о наших процедурах и ценах, проверить график врачей и записать вас на удобное время. Чем я могу вам помочь?`,
    quickReplies: [
      "Можно записаться на чистку завтра?",
      "Сколько стоит лечение кариеса?",
      "Где вы находитесь и есть ли парковка?",
      "Есть ли рассрочка Kaspi?"
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

      return {
        replyText: secondResponse.text || "Буду рада помочь вам с записью на приём в DentaCare!",
        ...extraInfo
      };
    }

    return {
      replyText: response.text || fallbackReceptionist(userMessage, history).replyText,
      ...extraInfo
    };
  } catch (error) {
    console.error("Gemini API error in processReceptionistChat:", error);
    // Graceful fallback ensuring continuous operation
    return fallbackReceptionist(userMessage, history);
  }
}
