import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RefreshCw, Clock, Calendar, Check, AlertCircle, HeartPulse, User, Phone, Stethoscope, ChevronRight, Mic, PhoneCall, MapPin, Award, Star, Image as ImageIcon } from 'lucide-react';
import { ChatMessage, AppointmentDraft, SlotInfo, ClinicInfo, Doctor, ChatAction } from '../types.js';
import { ConfirmationCard } from './ConfirmationCard.js';

interface ChatViewProps {
  clinicInfo: ClinicInfo;
  onAppointmentCreated?: () => void;
  onOpenGis?: () => void;
  onOpenBooking?: (serviceId?: string, doctorId?: string) => void;
  onOpenDoctorProfile?: (doctor: Doctor) => void;
  onOpenVoice?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  clinicInfo,
  onAppointmentCreated,
  onOpenGis,
  onOpenBooking,
  onOpenDoctorProfile,
  onOpenVoice
}) => {
  const initialWelcomeMessage: ChatMessage = {
    id: 'msg-welcome',
    sender: 'assistant',
    text: 'Здравствуйте! Рада приветствовать вас в клинике DentaCare. Меня зовут Аида, я цифровой администратор клиники.\n\nОпишите, пожалуйста, вашу проблему или желаемую процедуру. Я порекомендую подходящего профильного врача, покажу свободные слоты и помогу записаться на приём.',
    timestamp: '08:30',
    quickReplies: [
      'У меня сильно болит зуб ночью',
      'Хочу записаться на чистку зубов',
      'Сколько стоят брекеты и кто ортодонт?',
      '📍 Как вас найти в 2GIS и где парковка?',
      'Можно ли оформить рассрочку Kaspi 0-0-12?'
    ]
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialWelcomeMessage]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeDraft, setActiveDraft] = useState<AppointmentDraft | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: newMessages
        })
      });

      if (!res.ok) {
        throw new Error('Ошибка связи с сервером');
      }

      const data = await res.json();

      const botMessage: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'assistant',
        text: data.replyText || 'Я вас поняла, проверяю информацию...',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        appointmentDraft: data.appointmentDraft,
        suggestedSlots: data.suggestedSlots,
        quickReplies: data.quickReplies,
        isEmergencyAlert: data.isEmergencyAlert,
        recommendedDoctors: data.recommendedDoctors,
        actions: data.actions
      };

      setMessages(prev => [...prev, botMessage]);

      if (data.appointmentDraft) {
        setActiveDraft(data.appointmentDraft);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: 'assistant',
          text: 'Извините, произошла небольшая заминка соединения. Пожалуйста, повторите запрос или свяжитесь с нами по номеру ' + clinicInfo.phone,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSlotSelect = (slot: SlotInfo) => {
    handleSendMessage(`Мне удобно в ${slot.time} к врачу ${slot.doctorName}`);
  };

  const handleConfirmAppointment = async (draft: AppointmentDraft): Promise<boolean> => {
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: draft.patientName,
          patientPhone: draft.patientPhone,
          serviceId: draft.serviceId,
          doctorId: draft.doctorId,
          date: draft.date,
          time: draft.time
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Не удалось забронировать слот');
      }

      const created = await res.json();

      setMessages(prev => [
        ...prev,
        {
          id: `msg-confirmed-${Date.now()}`,
          sender: 'assistant',
          text: `Отлично, ${draft.patientName}! Ваша запись #${created.id} успешно подтверждена и занесена в расписание клиники.\n\nЗа 24 часа и за 2 часа до приёма вам придёт автоматическое напоминание в WhatsApp / SMS. Ждём вас по адресу: ${clinicInfo.address}!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actions: [
            {
              id: 'act-2gis',
              label: '📍 Как нас найти (2GIS)',
              type: 'open_2gis'
            },
            {
              id: 'act-prep',
              label: 'Памятка пациенту',
              type: 'navigate_faq'
            }
          ],
          quickReplies: [
            'Как подготовиться к приёму?',
            'Где припарковать машину?',
            'Записать ещё одного человека'
          ]
        }
      ]);

      if (onAppointmentCreated) {
        onAppointmentCreated();
      }

      return true;
    } catch (err: any) {
      alert(err.message || 'Ошибка бронирования');
      return false;
    }
  };

  const handleModifyAppointment = (draft: AppointmentDraft) => {
    handleSendMessage(`Я хочу изменить время или дату записи на ${draft.serviceName.toLowerCase()}`);
  };

  const handleActionClick = (action: ChatAction) => {
    if (action.type === 'open_2gis') {
      if (onOpenGis) onOpenGis();
      else window.open(clinicInfo.gisUrl || 'https://2gis.kz/almaty', '_blank');
    } else if (action.type === 'open_booking') {
      if (onOpenBooking) {
        onOpenBooking(action.serviceId || action.payload?.serviceId, action.doctorId || action.payload?.doctorId);
      }
    } else if (action.type === 'voice_call') {
      if (onOpenVoice) onOpenVoice();
    } else if (action.type === 'call_admin') {
      window.location.href = `tel:${clinicInfo.phone.replace(/[^0-9+]/g, '')}`;
    } else if (action.type === 'navigate_doctors' || action.type === 'navigate_portfolio') {
      if (action.payload?.doctor && onOpenDoctorProfile) {
        onOpenDoctorProfile(action.payload.doctor);
      }
    }
  };

  const handleResetChat = () => {
    if (confirm('Очистить диалог и начать сначала?')) {
      setMessages([initialWelcomeMessage]);
      setActiveDraft(null);
    }
  };

  // Preset symptom buttons for instant triage
  const symptomPresets = [
    { label: 'Ночная боль в зубе', icon: '⚡', query: 'У меня болит зуб ночью, пульсирует, к какому врачу пойти?' },
    { label: 'Брекеты / Прикус', icon: '🦷', query: 'Хочу выровнять зубы и проконсультироваться по брекетам' },
    { label: 'Чистка AirFlow', icon: '✨', query: 'Хочу записаться на гигиеническую чистку зубов' },
    { label: 'Имплантация зуба', icon: '🔩', query: 'Сколько стоит имплантация зуба под ключ?' },
    { label: 'Детский врач', icon: '👶', query: 'Принимаете ли вы детей и как подготовить ребёнка?' }
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-130px)] min-h-[620px] bg-slate-50 border-x border-slate-200">
      {/* Top reception assistant bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              АИ
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Аида • AI-Администратор</h2>
              <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-medium border border-teal-200">
                Ресепшен DentaCare
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Сверяет реальное расписание • Подбирает врача • Записывает без звонков
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenVoice && (
            <button
              onClick={onOpenVoice}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold border border-teal-200 transition-colors cursor-pointer"
              title="Переключиться на голосовой звонок с AI"
            >
              <PhoneCall className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">AI-Звонок</span>
            </button>
          )}

          {onOpenGis && (
            <button
              onClick={onOpenGis}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Открыть схему проезда в 2GIS"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>2GIS</span>
            </button>
          )}

          <button
            onClick={handleResetChat}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Очистить диалог"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id || index}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[92%] sm:max-w-[82%] rounded-2xl p-4 text-sm leading-relaxed shadow-2xs ${
                  isUser
                    ? 'bg-teal-600 text-white rounded-br-xs'
                    : msg.isEmergencyAlert
                    ? 'bg-rose-50 border border-rose-200 text-slate-900 rounded-bl-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                }`}
              >
                {/* Emergency banner inside message if acute pain */}
                {msg.isEmergencyAlert && (
                  <div className="flex items-center gap-2 mb-2.5 p-2.5 bg-rose-100/80 text-rose-900 rounded-xl text-xs font-semibold">
                    <HeartPulse className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Внимание: Экстренный коридор при острой боли. Не прогревайте щёку компрессами!</span>
                  </div>
                )}

                <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>

                {/* Recommended Doctors Cards (AI Triage outcome) */}
                {msg.recommendedDoctors && msg.recommendedDoctors.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-teal-600" />
                      <span>Рекомендованный профильный специалист:</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {msg.recommendedDoctors.map(doctor => (
                        <div
                          key={doctor.id}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={doctor.avatar}
                              alt={doctor.name}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-900">{doctor.name}</span>
                                <span className="text-[10px] font-semibold text-amber-600 flex items-center">
                                  ★ {doctor.rating}
                                </span>
                              </div>
                              <div className="text-xs text-teal-700 font-medium">{doctor.specialty}</div>
                              {doctor.experienceYears && (
                                <div className="text-[11px] text-slate-500">Стаж {doctor.experienceYears} лет</div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {onOpenDoctorProfile && (
                              <button
                                onClick={() => onOpenDoctorProfile(doctor)}
                                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                              >
                                До/После
                              </button>
                            )}

                            {onOpenBooking && (
                              <button
                                onClick={() => onOpenBooking(undefined, doctor.id)}
                                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                              >
                                <span>Записаться</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested slot chips when AI offers free times */}
                {msg.suggestedSlots && msg.suggestedSlots.length > 0 && !msg.appointmentDraft && (
                  <div className="mt-3.5 pt-2.5 border-t border-slate-100">
                    <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>Свободные окна (нажмите для выбора):</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedSlots.map((slot, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSlotSelect(slot)}
                          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-600 hover:text-white text-teal-800 border border-teal-200 hover:border-teal-600 rounded-xl text-xs font-medium transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Clock className="w-3 h-3" />
                          <span>{slot.time}</span>
                          <span className="text-[10px] opacity-75">({slot.doctorName.split(' ')[0]})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirmation Card Requirement */}
                {msg.appointmentDraft && (
                  <ConfirmationCard
                    draft={msg.appointmentDraft}
                    onConfirm={handleConfirmAppointment}
                    onModify={handleModifyAppointment}
                  />
                )}

                {/* Action buttons (e.g. 2GIS, voice call, booking) */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-2">
                    {msg.actions.map((action, aIdx) => (
                      <button
                        key={action.id || aIdx}
                        onClick={() => handleActionClick(action)}
                        className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                      >
                        {action.type === 'open_2gis' && <MapPin className="w-3.5 h-3.5 text-emerald-600" />}
                        {action.type === 'open_booking' && <Calendar className="w-3.5 h-3.5 text-teal-600" />}
                        {action.type === 'voice_call' && <PhoneCall className="w-3.5 h-3.5 text-teal-600" />}
                        {action.type === 'call_admin' && <Phone className="w-3.5 h-3.5 text-teal-600" />}
                        {action.type === 'navigate_portfolio' && <ImageIcon className="w-3.5 h-3.5 text-teal-600" />}
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div
                  className={`mt-2 text-[10px] text-right ${
                    isUser ? 'text-teal-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {/* Quick reply chips underneath the latest message */}
              {index === messages.length - 1 && msg.quickReplies && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 max-w-[92%]">
                  {msg.quickReplies.map((reply, rIdx) => (
                    <button
                      key={rIdx}
                      onClick={() => handleSendMessage(reply)}
                      disabled={isLoading}
                      className="text-xs bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200 hover:border-teal-300 px-3 py-1.5 rounded-full transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                    >
                      <span>{reply}</span>
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
            <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
              АИ
            </div>
            <div className="bg-white border border-slate-200 px-3 py-2 rounded-2xl shadow-2xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]" />
              <span className="text-slate-500 text-xs ml-1">Аида подбирает врача и проверяет слоты...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Symptom triage quick prompt pills */}
      <div className="bg-slate-100/80 border-t border-slate-200 px-3 py-2 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 ml-1">
          Частые темы:
        </span>
        {symptomPresets.map((preset, pIdx) => (
          <button
            key={pIdx}
            onClick={() => handleSendMessage(preset.query)}
            disabled={isLoading}
            className="text-[11px] bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors shadow-2xs cursor-pointer whitespace-nowrap flex items-center gap-1"
          >
            <span>{preset.icon}</span>
            <span>{preset.label}</span>
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div className="bg-white border-t border-slate-200 p-3 sm:p-4">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            id="chat-input-message"
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Опишите, что вас беспокоит (например: «У меня ноет зуб», «Хочу чистку завтра»)..."
            disabled={isLoading}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
          />

          <button
            id="btn-send-message"
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white p-2.5 rounded-xl font-medium transition-colors shadow-xs cursor-pointer flex items-center justify-center shrink-0"
            title="Отправить сообщение"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>Сверка с базой врачей в реальном времени • Kaspi Red 0-0-12</span>
          <button
            onClick={onOpenGis}
            className="text-emerald-700 hover:underline font-medium cursor-pointer"
          >
            Алматы, пр. Достык 128 (2GIS)
          </button>
        </div>
      </div>
    </div>
  );
};
