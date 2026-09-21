import React, { useState } from 'react';
import { X, MapPin, Navigation, Car, Train, Clock, Copy, Check, ExternalLink, ShieldCheck } from 'lucide-react';
import { ClinicInfo } from '../types.js';

interface GisMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicInfo: ClinicInfo;
}

export const GisMapModal: React.FC<GisMapModalProps> = ({
  isOpen,
  onClose,
  clinicInfo
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(clinicInfo.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const gisUrl = clinicInfo.gisUrl || 'https://2gis.kz/almaty';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded-full">
                2GIS Навигация
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                Как нас найти • Клиника DentaCare
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Address card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Точный адрес</div>
              <div className="text-base font-bold text-slate-900 mt-1">{clinicInfo.address}</div>
              <div className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                📍 {clinicInfo.landmark}
              </div>
            </div>
            <button
              onClick={handleCopyAddress}
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
              title="Скопировать адрес"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Скопировано</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Скопировать</span>
                </>
              )}
            </button>
          </div>

          {/* Visual 2GIS preview map banner */}
          <div className="relative rounded-2xl overflow-hidden border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-100 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <Navigation className="w-4 h-4 text-emerald-600" />
                  <span>Построить маршрут прямо в 2GIS</span>
                </div>
                <p className="text-xs text-emerald-700/90 mt-1 max-w-sm">
                  Приложение откроет оптимальный автомобильный маршрут или путь на общественном транспорте до нашего крыльца.
                </p>
              </div>

              <a
                href={gisUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
              >
                <span>Открыть в 2GIS</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Transportation info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
              <Car className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800">На автомобиле и парковка:</span>
                <p className="text-slate-600 mt-0.5">{clinicInfo.parking}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800">График работы:</span>
                <p className="text-slate-600 mt-0.5">
                  Пн–Сб: {clinicInfo.workingHoursWeekdays}<br />
                  Вс: {clinicInfo.workingHoursWeekend}
                </p>
              </div>
            </div>
          </div>

          {/* Emergency reminder */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>При острой зубной боли вы можете подъехать без предварительной записи — дежурный врач примет в экстренный коридор!</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Ресепшен: {clinicInfo.phone}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
