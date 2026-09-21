import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Clock, Tag, Stethoscope, Check, X, ShieldCheck } from 'lucide-react';
import { Service, Doctor } from '../types.js';

interface ServicesAdminProps {
  services: Service[];
  doctors: Doctor[];
  onRefresh: () => void;
}

export const ServicesAdmin: React.FC<ServicesAdminProps> = ({
  services,
  doctors,
  onRefresh
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(45);
  const [price, setPrice] = useState(15000);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'general' | 'aesthetic' | 'surgery' | 'ortho' | 'pediatric' | 'therapy'>('general');
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const openAddModal = () => {
    setEditingService(null);
    setName('');
    setDuration(45);
    setPrice(15000);
    setDescription('');
    setCategory('general');
    setSelectedDoctorIds([doctors[0]?.id || 'doc-1']);
    setIsModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setName(service.name);
    setDuration(service.duration);
    setPrice(service.price);
    setDescription(service.description);
    setCategory(service.category);
    setSelectedDoctorIds([...service.doctorIds]);
    setIsModalOpen(true);
  };

  const toggleDoctorSelection = (docId: string) => {
    if (selectedDoctorIds.includes(docId)) {
      if (selectedDoctorIds.length > 1) {
        setSelectedDoctorIds(selectedDoctorIds.filter(id => id !== docId));
      }
    } else {
      setSelectedDoctorIds([...selectedDoctorIds, docId]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      if (editingService) {
        // Edit existing
        const res = await fetch(`/api/services/${editingService.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            duration: Number(duration),
            price: Number(price),
            description: description.trim(),
            category,
            doctorIds: selectedDoctorIds
          })
        });
        if (!res.ok) throw new Error('Ошибка сохранения');
      } else {
        // Create new
        const res = await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            duration: Number(duration),
            price: Number(price),
            description: description.trim(),
            category,
            doctorIds: selectedDoctorIds
          })
        });
        if (!res.ok) throw new Error('Ошибка создания услуги');
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  };

  const getDoctorNames = (doctorIds: string[]) => {
    return doctorIds
      .map(id => doctors.find(d => d.id === id)?.name.split(' ')[0])
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal-600" />
            Услуги и Прайс-лист клиники
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            10 основных стоматологических услуг. Все цены и длительности синхронизированы с AI-администратором
          </p>
        </div>

        <button
          id="btn-add-service"
          onClick={openAddModal}
          className="bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-medium py-2 px-4 rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Добавить услугу
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(service => (
          <div
            key={service.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  {service.name}
                </h3>
                <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg shrink-0">
                  {service.price.toLocaleString('ru-RU')} ₸
                </span>
              </div>

              <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                {service.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Длительность:
                </span>
                <span className="font-semibold text-slate-800">{service.duration} минут</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Врачи:
                </span>
                <span className="font-medium text-slate-700 text-right truncate max-w-[180px]">
                  {getDoctorNames(service.doctorIds) || 'Все врачи'}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(service)}
                  className="text-xs font-medium text-slate-600 hover:text-teal-700 hover:bg-slate-50 p-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Редактировать
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add/Edit Service */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingService ? 'Редактирование услуги' : 'Добавление новой услуги'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Название услуги:
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Например: Профессиональная чистка"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Длительность (мин):
                  </label>
                  <input
                    type="number"
                    required
                    min={15}
                    max={240}
                    step={5}
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Стоимость (₸):
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={500}
                    value={price}
                    onChange={e => setPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Категория:
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="general">Общая стоматология / гигиена</option>
                  <option value="therapy">Терапия / кариес / каналы</option>
                  <option value="aesthetic">Эстетическая стоматология</option>
                  <option value="surgery">Хирургия / имплантация</option>
                  <option value="ortho">Ортодонтия / коронки</option>
                  <option value="pediatric">Детская стоматология</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Описание для пациента и AI:
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Опишите процедуру, используемые материалы и методику..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Врачи, оказывающие данную услугу:
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50">
                  {doctors.map(d => {
                    const isChecked = selectedDoctorIds.includes(d.id);
                    return (
                      <label
                        key={d.id}
                        className="flex items-center gap-2 p-1.5 hover:bg-white rounded cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleDoctorSelection(d.id)}
                          className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                        />
                        <span className="text-xs text-slate-800 font-medium">
                          {d.name} — <span className="text-slate-500">{d.specialty}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSaving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
