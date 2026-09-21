import React, { useState } from 'react';
import { HelpCircle, Plus, Search, ChevronDown, ChevronUp, MapPin, Clock, CreditCard, ShieldCheck, Sparkles } from 'lucide-react';
import { FaqItem, ClinicInfo } from '../types.js';

interface FaqAdminProps {
  faq: FaqItem[];
  clinicInfo: ClinicInfo;
  onRefresh: () => void;
}

export const FaqAdmin: React.FC<FaqAdminProps> = ({
  faq,
  clinicInfo,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(faq[0]?.id || null);
  const [isAdding, setIsAdding] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const filteredFaq = faq.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newQuestion.trim(),
          answer: newAnswer.trim(),
          category: 'general'
        })
      });

      if (!res.ok) throw new Error('Ошибка добавления FAQ');
      setNewQuestion('');
      setNewAnswer('');
      setIsAdding(false);
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Не удалось сохранить');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-teal-600" />
            База знаний клиники и FAQ для AI
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Типовые вопросы пациентов. AI-администратор использует эти верифицированные ответы при консультации
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-medium py-2 px-4 rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Добавить вопрос в базу
        </button>
      </div>

      {/* Clinic Fact Cards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-2">
            <MapPin className="w-4 h-4" />
            Адрес и парковка
          </div>
          <p className="text-sm font-semibold text-slate-900">{clinicInfo.address}</p>
          <p className="text-xs text-slate-500 mt-1">{clinicInfo.landmark}</p>
          <div className="mt-2 text-xs font-medium text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
            ✓ {clinicInfo.parking}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-2">
            <Clock className="w-4 h-4" />
            Режим работы
          </div>
          <div className="text-xs space-y-1.5 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Будни:</span>
              <span className="font-bold text-slate-900">{clinicInfo.workingHoursWeekdays}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Выходные:</span>
              <span className="font-medium text-slate-800">{clinicInfo.workingHoursWeekend}</span>
            </div>
            <div className="text-[11px] text-teal-600 font-medium">Без перерыва на обед</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-2">
            <CreditCard className="w-4 h-4" />
            Рассрочка и оплата
          </div>
          <ul className="text-xs space-y-1 text-slate-600">
            {clinicInfo.installments.map((inst, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-teal-600 font-bold">•</span>
                <span>{inst}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form onSubmit={handleAddFaq} className="bg-white p-5 rounded-2xl border-2 border-teal-500/80 shadow-md space-y-3">
          <h3 className="font-bold text-sm text-slate-900">
            Новый вопрос и ответ в базу знаний:
          </h3>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Вопрос пациента:
            </label>
            <input
              type="text"
              required
              value={newQuestion}
              onChange={e => setNewQuestion(e.target.value)}
              placeholder="Например: Какая анестезия используется при лечении?"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Официальный ответ клиники:
            </label>
            <textarea
              rows={3}
              required
              value={newAnswer}
              onChange={e => setNewAnswer(e.target.value)}
              placeholder="Подробный ответ с точными фактами и доброжелательным тоном..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSaving ? 'Сохранение...' : 'Добавить'}
            </button>
          </div>
        </form>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Поиск по вопросам и ответам базы знаний..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
        />
      </div>

      {/* FAQ Accordion List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden divide-y divide-slate-100">
        {filteredFaq.map(item => {
          const isExpanded = expandedId === item.id;
          return (
            <div key={item.id} className="transition-colors">
              <button
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
                    ?
                  </div>
                  <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                    {item.question}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 bg-slate-50/50 leading-relaxed border-t border-slate-100">
                  <p className="whitespace-pre-line pl-10">{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
