import React, { useState, useEffect, useRef } from 'react';
import { X, Phone, PhoneCall, PhoneOff, Mic, MicOff, Volume2, Sparkles, Server, Cpu, ShieldCheck, Activity, Terminal, ArrowRight, User, Stethoscope } from 'lucide-react';
import { ClinicInfo, Doctor, Service } from '../types.js';

interface VoiceReceptionistModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicInfo: ClinicInfo;
  doctors: Doctor[];
  services: Service[];
  onBookAppointmentFromVoice?: () => void;
}

export const VoiceReceptionistModal: React.FC<VoiceReceptionistModalProps> = ({
  isOpen,
  onClose,
  clinicInfo,
  doctors,
  services,
  onBookAppointmentFromVoice
}) => {
  const [callState, setCallState] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [activeTab, setActiveTab] = useState<'simulator' | 'architecture'>('simulator');
  const [isSpeakingAi, setIsSpeakingAi] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callLog, setCallLog] = useState<Array<{ sender: 'ai' | 'patient'; text: string; time: string }>>([]);
  const [userSpeechInput, setUserSpeechInput] = useState('');
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [callState]);

  if (!isOpen) return null;

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ru-RU';
      utterance.rate = 1.05;
      utterance.pitch = 1.1;

      // Pick Russian female voice if present
      const voices = window.speechSynthesis.getVoices();
      const ruVoice = voices.find(v => v.lang.startsWith('ru') && v.name.toLowerCase().includes('female')) ||
                      voices.find(v => v.lang.startsWith('ru'));
      if (ruVoice) utterance.voice = ruVoice;

      utterance.onstart = () => setIsSpeakingAi(true);
      utterance.onend = () => setIsSpeakingAi(false);
      utterance.onerror = () => setIsSpeakingAi(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const startDemoCall = () => {
    setCallState('calling');
    setCallDuration(0);
    setCallLog([]);

    setTimeout(() => {
      setCallState('connected');
      const initialGreeting = 'Здравствуйте! Клиника цифровой стоматологии DentaCare, меня зовут Аида. Чем я могу вам помочь?';
      setCallLog([{
        sender: 'ai',
        text: initialGreeting,
        time: '00:01'
      }]);
      speakText(initialGreeting);
    }, 1500);
  };

  const endCall = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCallState('ended');
    setIsSpeakingAi(false);
  };

  const handlePatientSay = (text: string) => {
    if (!text || callState !== 'connected') return;

    const currentSecs = `${Math.floor(callDuration / 60).toString().padStart(2, '0')}:${(callDuration % 60).toString().padStart(2, '0')}`;
    setCallLog(prev => [...prev, { sender: 'patient', text, time: currentSecs }]);
    setUserSpeechInput('');

    // Rule-based voice answer logic
    setTimeout(() => {
      const lower = text.toLowerCase();
      let aiReply = '';

      if (lower.includes('болит') || lower.includes('ноч') || lower.includes('острая')) {
        aiReply = 'Я вас поняла. При ноющей или острой зубной боли рекомендую срочный осмотр стоматолога-терапевта Dr. Ивана Смирнова. Не грейте щёку. У доктора есть свободный слот завтра в 11:30. Записать вас?';
      } else if (lower.includes('чистк') || lower.includes('цена') || lower.includes('стоимость')) {
        aiReply = 'Комплексная профессиональная чистка AirFlow у нас стоит 18 000 тенге. Процедура длится 45 минут. Могу предложить время завтра в 14:00 или 17:30.';
      } else if (lower.includes('брекет') || lower.includes('прикус')) {
        aiReply = 'Консультация ортодонта Dr. Елены Ким включает 3D-сканирование и фотопротокол. Ближайшая свободная запись — на среду в 15:00.';
      } else if (lower.includes('да') || lower.includes('запишите') || lower.includes('удобно')) {
        aiReply = 'Прекрасно! Зафиксировала предварительную запись. Подскажите, пожалуйста, ваше имя для регистрации талона.';
      } else {
        aiReply = 'Спасибо за вопрос! Наша клиника находится на проспекте Достык 128 с бесплатным подземным паркингом. Мы также предоставляем рассрочку Kaspi Red на 3 месяца. Записать вас на приём?';
      }

      const replySecs = `${Math.floor((callDuration + 2) / 60).toString().padStart(2, '0')}:${((callDuration + 2) % 60).toString().padStart(2, '0')}`;
      setCallLog(prev => [...prev, { sender: 'ai', text: aiReply, time: replySecs }]);
      speakText(aiReply);
    }, 1000);
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const secs = (totalSecs % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-600/30 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 px-2.5 py-0.5 rounded-full border border-teal-500/30">
                  AI Voice Receptionist
                </span>
                <span className="text-[11px] text-slate-400">Голосовой администратор</span>
              </div>
              <h3 className="text-xl font-bold text-white mt-0.5">
                AI-Телефония и обработка входящих звонков
              </h3>
            </div>
          </div>
          <button
            onClick={() => {
              endCall();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 bg-slate-100 border-b border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`py-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'simulator'
                ? 'bg-white text-teal-800 border-b-2 border-teal-600 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Phone className="w-4 h-4 text-teal-600" />
            <span>Интерактивный звонок в клинику</span>
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`py-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'architecture'
                ? 'bg-white text-teal-800 border-b-2 border-teal-600 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-4 h-4 text-teal-600" />
            <span>Архитектура Production-телефонии</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[calc(85vh-200px)] overflow-y-auto">
          {/* 1. SIMULATOR TAB */}
          {activeTab === 'simulator' && (
            <div className="space-y-6">
              {/* Phone call interface card */}
              <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-6 text-white text-center shadow-xl border border-slate-800">
                <div className="max-w-md mx-auto space-y-4">
                  {/* Status & Timer */}
                  <div className="flex items-center justify-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      callState === 'connected' ? 'bg-emerald-400 animate-pulse' :
                      callState === 'calling' ? 'bg-amber-400 animate-ping' : 'bg-slate-600'
                    }`} />
                    <span className="text-xs font-semibold text-slate-300">
                      {callState === 'idle' && 'Линия свободна • Нажмите для звонка'}
                      {callState === 'calling' && 'Установка SIP-соединения...'}
                      {callState === 'connected' && `Идёт разговор • ${formatTimer(callDuration)}`}
                      {callState === 'ended' && 'Звонок завершён'}
                    </span>
                  </div>

                  {/* Visual sound wave animation */}
                  <div className="h-16 flex items-center justify-center gap-1.5">
                    {[40, 75, 20, 90, 60, 30, 85, 45, 100, 50, 70, 35].map((val, i) => (
                      <div
                        key={i}
                        className={`w-1.5 rounded-full transition-all duration-200 ${
                          isSpeakingAi
                            ? 'bg-teal-400 animate-pulse'
                            : callState === 'connected'
                            ? 'bg-emerald-500/50'
                            : 'bg-slate-700'
                        }`}
                        style={{
                          height: isSpeakingAi ? `${Math.max(12, (val * (i % 3 + 1)) % 55)}px` : '8px'
                        }}
                      />
                    ))}
                  </div>

                  {/* Caller info */}
                  <div>
                    <h4 className="text-lg font-bold text-white">Аида • AI-Администратор DentaCare</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Городской номер: {clinicInfo.phone}
                    </p>
                  </div>

                  {/* Call Controls */}
                  <div className="flex items-center justify-center gap-4 pt-2">
                    {callState === 'idle' || callState === 'ended' ? (
                      <button
                        onClick={startDemoCall}
                        className="px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg hover:shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2"
                      >
                        <PhoneCall className="w-4 h-4" />
                        <span>Начать тестовый звонок</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors cursor-pointer ${
                            isMuted ? 'bg-amber-600' : 'bg-slate-800 hover:bg-slate-700'
                          }`}
                          title={isMuted ? 'Включить микрофон' : 'Отключить микрофон'}
                        >
                          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>

                        <button
                          onClick={endCall}
                          className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg transition-colors cursor-pointer"
                          title="Завершить разговор"
                        >
                          <PhoneOff className="w-6 h-6" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Patient phrases for instant testing */}
              {callState === 'connected' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Mic className="w-4 h-4 text-teal-600" />
                      <span>Что сказать администратору (нажмите для симуляции речи):</span>
                    </span>
                    <span className="text-[11px] text-slate-400">Синтез речи озвучит ответ</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      'У меня сильно болит зуб ночью, можно записаться?',
                      'Сколько стоит чистка зубов AirFlow?',
                      'Хочу консультацию по брекетам Damon',
                      'Да, запишите меня на завтра на 11:30'
                    ].map((phrase, idx) => (
                      <button
                        key={idx}
                        onClick={() => handlePatientSay(phrase)}
                        className="text-xs bg-white hover:bg-teal-50 text-slate-800 hover:text-teal-900 border border-slate-200 hover:border-teal-300 px-3 py-2 rounded-xl transition-all shadow-2xs cursor-pointer text-left"
                      >
                        «{phrase}»
                      </button>
                    ))}
                  </div>

                  {/* Custom input */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      value={userSpeechInput}
                      onChange={e => setUserSpeechInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handlePatientSay(userSpeechInput)}
                      placeholder="Или наберите свой вопрос..."
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                      onClick={() => handlePatientSay(userSpeechInput)}
                      disabled={!userSpeechInput.trim()}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Сказать
                    </button>
                  </div>
                </div>
              )}

              {/* Call Transcript */}
              {callLog.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Стенограмма звонка в реальном времени
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {callLog.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          item.sender === 'ai'
                            ? 'bg-teal-50/70 border border-teal-200 text-teal-950'
                            : 'bg-slate-100 border border-slate-200 text-slate-800 ml-6'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] opacity-70 mb-1">
                          <span className="font-bold">
                            {item.sender === 'ai' ? 'Аида (AI-Ресепшен)' : 'Пациент'}
                          </span>
                          <span>{item.time}</span>
                        </div>
                        <div>{item.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. ARCHITECTURE TAB */}
          {activeTab === 'architecture' && (
            <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950">
                <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  Архитектура Enterprise AI Voice Receptionist
                </h4>
                <p>
                  Полноценное решение для телефонии клиники DentaCare заменяет первую линию операторов, исключает пропущенные звонки 24/7 и моментально бронирует пациентов в медицинскую информационную систему (МИС).
                </p>
              </div>

              {/* Pipeline Diagram */}
              <div className="space-y-3">
                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Пайплайн голосового потока с задержкой &lt; 500 мс:
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1.5">
                    <div className="flex items-center gap-2 text-teal-700 font-bold">
                      <Phone className="w-4 h-4" />
                      <span>1. SIP / Asterisk / FreePBX</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Входящий звонок с городского номера +7 (727) поступает на Asterisk/FreePBX. По SIP Trunk аудиопоток захватывается и направляется через WebSockets.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1.5">
                    <div className="flex items-center gap-2 text-teal-700 font-bold">
                      <Activity className="w-4 h-4" />
                      <span>2. Silero VAD + Streaming STT</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Voice Activity Detection отсекает шум и определяет окончание фразы. Deepgram Nova-2 / Whisper преобразуют речь в текст за 120 мс (поддержка казахского и русского языков).
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1.5">
                    <div className="flex items-center gap-2 text-teal-700 font-bold">
                      <Cpu className="w-4 h-4" />
                      <span>3. Gemini 2.5 Flash + Tool Calling</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      LLM анализирует жалобу, сверяет свободные слоты в базе клиники через функцию <code>check_available_slots</code> и формирует естественный ответ.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1.5">
                    <div className="flex items-center gap-2 text-teal-700 font-bold">
                      <Volume2 className="w-4 h-4" />
                      <span>4. Streaming TTS + RTP Audio</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      ElevenLabs / Google Cloud TTS Neural2 генерирует приветливый естественный голос и отдаёт звук в телефонную трубку пациента порциями по 20 мс.
                    </p>
                  </div>
                </div>
              </div>

              {/* Safety & Handoff Protocols */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                <div className="flex items-center gap-2 font-bold text-teal-300">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Протоколы безопасности и перевод на живого человека:</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-300 list-disc pl-4">
                  <li><strong>Острая боль / кровотечение:</strong> AI мгновенно направляет пациента в экстренный коридор и отправляет алерт дежурному врачу.</li>
                  <li><strong>Запрос человека:</strong> При словах «позовите оператора» или «соедините с администратором» сервер выполняет SIP Refer трансфер на старшего администратора клиники.</li>
                  <li><strong>Интеграция с МИС:</strong> Созданная запись автоматически падает в 1С-Медицина / Dental4Windows / Yclients через REST Webhook.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            DentaCare AI Voice Engine • Алматы
          </span>
          <button
            onClick={() => {
              endCall();
              onClose();
            }}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
