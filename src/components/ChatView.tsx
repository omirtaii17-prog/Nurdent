import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RefreshCw, Clock, Calendar, Check, AlertCircle, HeartPulse, User, Phone, Stethoscope, ChevronRight, Mic, MicOff, Volume2 } from 'lucide-react';
import { ChatMessage, AppointmentDraft, SlotInfo, ClinicInfo } from '../types.js';
import { ConfirmationCard } from './ConfirmationCard.js';

interface ChatViewProps {
  clinicInfo: ClinicInfo;
  onAppointmentCreated?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  clinicInfo,
  onAppointmentCreated
}) => {
  const initialWelcomeMessage: ChatMessage = {
    id: 'msg-welcome',
    sender: 'assistant',
    text: 'Здравствуйте! Рада приветствовать вас в клинике DentaCare. Меня зовут Аида, я AI-администратор клиники.\n\nПодскажите, пожалуйста, что вас беспокоит или на какую процедуру вы хотите записаться? Я помогу подобрать врача и удобное время.',
    timestamp: '08:30',
    quickReplies: [
      'Можно записаться на чистку завтра?',
      'Сколько стоит лечение кариеса?',
      'Где вы находитесь и есть ли парковка?',
      'Можно ли записать ребёнка?',
      'Есть ли рассрочка Kaspi?'
    ]
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialWelcomeMessage]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeDraft, setActiveDraft] = useState<AppointmentDraft | null>(null);
  const [speechActive, setSpeechActive] = useState(false);
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
        isEmergencyAlert: data.isEmergencyAlert
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
          text: 'Извините, произошла небольшая заминка соединения. Пожалуйста, повторите запрос или позвоните нам по номеру ' + clinicInfo.phone,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSlotSelect = (slot: SlotInfo) => {
    handleSendMessage(`Мне удобно в ${slot.time}`);
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

      // Add a celebration message from the assistant
      setMessages(prev => [
        ...prev,
        {
          id: `msg-confirmed-${Date.now()}`,
          sender: 'assistant',
          text: `Отлично, ${draft.patientName}! Запись #${created.id} окончательно зарегистрирована в нашей базе.\n\nМы отправили вам подтверждение. Также за 24 часа и за 2 часа до приёма вам придёт автоматическое напоминание в WhatsApp / SMS. Ждём вас в клинике DentaCare по адресу: ${clinicInfo.address}!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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

  const handleResetChat = () => {
    if (confirm('Очистить диалог и начать сначала?')) {
      setMessages([initialWelcomeMessage]);
      setActiveDraft(null);
    }
  };

  const simulatePatientVoice = () => {
    const demoPhrases = [
      'Можно записаться на чистку завтра?',
      'Здравствуйте, сколько стоит лечение кариеса и есть ли свободные места на этой неделе?',
      'У меня очень сильно разболелся зуб, можно прийти сегодня?',
      'Подскажите, со скольки лет вы принимаете детей и есть ли рассрочка Kaspi?'
    ];
    const phrase = demoPhrases[Math.floor(Math.random() * demoPhrases.length)];
    setInputValue(phrase);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-130px)] min-h-[580px] bg-slate-50 border-x border-slate-200">
      {/* Top reception assistant bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              АИ
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Аида • AI-Администратор</h2>
              <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-medium border border-teal-200">
                Ресепшен DentaCare
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Проверяет реальные слоты врачей • Никаких выдуманных данных
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={simulatePatientVoice}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs hover:bg-slate-100 transition-colors cursor-pointer"
            title="Вставить реалистичную фразу пациента"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Пример фразы</span>
          </button>

          <button
            onClick={handleResetChat}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
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
                className={`max-w-[88%] sm:max-w-[78%] rounded-2xl p-3.5 sm:p-4 text-sm leading-relaxed shadow-2xs ${
                  isUser
                    ? 'bg-teal-600 text-white rounded-br-xs'
                    : msg.isEmergencyAlert
                    ? 'bg-rose-50 border border-rose-200 text-slate-900 rounded-bl-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                }`}
              >
                {/* Emergency banner inside message if acute pain */}
                {msg.isEmergencyAlert && (
                  <div className="flex items-center gap-2 mb-2 p-2 bg-rose-100 text-rose-800 rounded-lg text-xs font-semibold">
                    <HeartPulse className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Внимание: Экстренный коридор при острой боли</span>
                  </div>
                )}

                <div className="whitespace-pre-line">{msg.text}</div>

                {/* Suggested slot chips when AI offers free times */}
                {msg.suggestedSlots && msg.suggestedSlots.length > 0 && !msg.appointmentDraft && (
                  <div className="mt-3 pt-2 border-t border-slate-100">
                    <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>Свободные окна (нажмите для выбора):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedSlots.map((slot, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSlotSelect(slot)}
                          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-600 hover:text-white text-teal-800 border border-teal-200 hover:border-teal-600 rounded-lg text-xs font-medium transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Clock className="w-3 h-3" />
                          <span>{slot.time}</span>
                          <span className="text-[10px] opacity-75">({slot.doctorName.split(' ')[0]})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 5 Confirmation Card Requirement */}
                {msg.appointmentDraft && (
                  <ConfirmationCard
                    draft={msg.appointmentDraft}
                    onConfirm={handleConfirmAppointment}
                    onModify={handleModifyAppointment}
                  />
                )}

                <div
                  className={`mt-1.5 text-[10px] text-right ${
                    isUser ? 'text-teal-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {/* Quick reply chips underneath the latest message */}
              {index === messages.length - 1 && msg.quickReplies && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 max-w-[90%]">
                  {msg.quickReplies.map((reply, rIdx) => (
                    <button
                      key={rIdx}
                      onClick={() => handleSendMessage(reply)}
                      disabled={isLoading}
                      className="text-xs bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-300 px-3 py-1.5 rounded-full transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
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
              <span className="text-slate-500 text-xs ml-1">Аида проверяет базу данных...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
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
            placeholder="Напишите сообщение администратору (например: «Хочу записаться на чистку завтра»)..."
            disabled={isLoading}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
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
          <span>AI-администратор сверяется с реальным расписанием врачей клиники DentaCare</span>
          <span className="hidden sm:inline">Алматы • Пн-Вс</span>
        </div>
      </div>
    </div>
  );
};
