import React, { useState, useEffect } from 'react';
import { X, Cast, Tv, Check, Wifi, Smartphone, Radio, Copy, Monitor, ExternalLink, ShieldCheck } from 'lucide-react';
import { sounds } from '../utils/audioEffects';

interface CastModalProps {
  onClose: () => void;
  tvUrl: string;
}

interface ConnectedDevice {
  id: string;
  type: 'tv' | 'mobile';
  name: string;
  connectedAt: number;
}

export const CastModal: React.FC<CastModalProps> = ({ onClose, tvUrl }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'samsung' | 'direct' | 'status'>('samsung');
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);
  const [hasTv, setHasTv] = useState(false);

  // Fetch real connected screens from server
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await fetch('/api/devices');
        if (res.ok) {
          const data = await res.json();
          if (data.devices) {
            setConnectedDevices(data.devices);
            setHasTv(Boolean(data.hasTv));
          }
        }
      } catch {
        // ignore
      }
    };
    fetchDevices();
    const interval = setInterval(fetchDevices, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = async () => {
    sounds.playButtonTick();
    try {
      await navigator.clipboard.writeText(tvUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-gradient-to-b from-[#1c202a] via-[#141720] to-[#0d0f14] border-2 border-cyan-500/70 p-5 sm:p-6 text-white shadow-[0_20px_50px_rgba(0,0,0,0.9)] max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Encabezado con estética Virtual Music Jukebox */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-black border border-cyan-500/50 shadow-inner">
            <Tv className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-mono text-sm sm:text-base font-black tracking-wider uppercase text-white">
              CONECTAR A TU SMART TV
            </h3>
            <p className="text-xs text-cyan-300 font-sans">
              Samsung TV • LG • Android TV • Chromecast • AirPlay
            </p>
          </div>
        </div>

        {/* Selector de Pestañas */}
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-black/80 p-1 border border-gray-800 mb-4">
          <button
            onClick={() => {
              sounds.playButtonTick();
              setActiveTab('samsung');
            }}
            className={`py-2 text-xs font-black rounded-lg transition ${
              activeTab === 'samsung'
                ? 'bg-cyan-500 text-black shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Samsung TV
          </button>
          <button
            onClick={() => {
              sounds.playButtonTick();
              setActiveTab('direct');
            }}
            className={`py-2 text-xs font-black rounded-lg transition ${
              activeTab === 'direct'
                ? 'bg-cyan-500 text-black shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Enlace Web
          </button>
          <button
            onClick={() => {
              sounds.playButtonTick();
              setActiveTab('status');
            }}
            className={`py-2 text-xs font-black rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'status'
                ? 'bg-cyan-500 text-black shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Radio className="h-3 w-3" />
            <span>Estado</span>
            {hasTv && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />}
          </button>
        </div>

        {/* CONTENIDO TAB 1: GUÍA PASO A PASO PARA SAMSUNG TV */}
        {activeTab === 'samsung' && (
          <div className="space-y-3.5">
            {/* Método 1: Smart View de Samsung */}
            <div className="rounded-xl border border-cyan-500/40 bg-black/60 p-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-[11px] font-black text-black">
                  1
                </span>
                <h4 className="text-xs sm:text-sm font-black text-white uppercase">
                  Desde tu Celular Samsung (Smart View)
                </h4>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Si tu celular es Samsung o Android:
              </p>
              <ol className="text-xs text-gray-300 list-decimal list-inside space-y-1 mt-1 font-sans">
                <li>Desliza hacia abajo la barra superior de notificaciones.</li>
                <li>Toca el icono <strong className="text-cyan-300">«Smart View»</strong> o <strong className="text-cyan-300">«Emitir pantalla»</strong>.</li>
                <li>Selecciona tu <strong className="text-white">Samsung TV</strong> de la lista.</li>
              </ol>
            </div>

            {/* Método 2: En la app Internet de Samsung Smart TV */}
            <div className="rounded-xl border border-gray-700 bg-black/60 p-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-[11px] font-black text-black">
                  2
                </span>
                <h4 className="text-xs sm:text-sm font-black text-white uppercase">
                  Directo en la app «Internet» de la Samsung TV
                </h4>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Recomendado (no gasta la batería de tu celular):
              </p>
              <ol className="text-xs text-gray-300 list-decimal list-inside space-y-1 mt-1 font-sans">
                <li>En tu control remoto Samsung, pulsa el botón <strong className="text-white">Home 🏠</strong>.</li>
                <li>Abre la aplicación <strong className="text-cyan-300">«Internet»</strong> (el globo azul).</li>
                <li>Escribe este enlace en la barra de direcciones de la TV:</li>
              </ol>

              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={tvUrl}
                  className="flex-1 bg-black border border-cyan-500/50 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-mono select-all truncate"
                />
                <button
                  onClick={handleCopy}
                  className="rounded-lg bg-cyan-500 hover:bg-cyan-400 px-3 py-1.5 text-xs font-black text-black transition active:scale-95 shrink-0 flex items-center gap-1"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Método 3: AirPlay si tienes iPhone */}
            <div className="rounded-xl border border-gray-800 bg-black/40 p-3 text-xs text-gray-400">
              <span className="text-cyan-300 font-bold">¿Tienes iPhone?</span> Desliza el Centro de Control de tu iPhone, toca <strong className="text-gray-200">«Duplicar Pantalla»</strong> y elige tu Samsung TV.
            </div>
          </div>
        )}

        {/* CONTENIDO TAB 2: ENLACE WEB DIRECTO */}
        {activeTab === 'direct' && (
          <div className="space-y-3">
            <div className="rounded-xl border border-cyan-500/40 bg-black/60 p-4">
              <h4 className="text-xs sm:text-sm font-black text-white uppercase mb-1">
                Enlace para cualquier Pantalla o PC
              </h4>
              <p className="text-xs text-gray-300 mb-3">
                Abre esta dirección en el navegador de cualquier Smart TV, laptop, consola o proyector:
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={tvUrl}
                  className="flex-1 bg-black border border-cyan-500/50 rounded-lg px-3 py-2 text-xs text-cyan-300 font-mono select-all"
                />
                <button
                  onClick={handleCopy}
                  className="rounded-lg bg-cyan-500 hover:bg-cyan-400 px-4 py-2 text-xs font-black text-black transition active:scale-95 shrink-0 flex items-center gap-1"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-gray-800 bg-black/40 p-3 text-xs text-gray-400 leading-relaxed">
              <span className="text-cyan-300 font-bold block mb-1">💡 ¿Cómo funciona?</span>
              Al abrir este enlace en la TV, la pantalla se convertirá de inmediato en la rockola con video en pantalla completa y el QR de la esquina para pedir canciones.
            </div>
          </div>
        )}

        {/* CONTENIDO TAB 3: ESTADO REAL DE DISPOSITIVOS */}
        {activeTab === 'status' && (
          <div className="space-y-3">
            <div className="rounded-xl border border-gray-800 bg-black/60 p-4">
              <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
                <span className="text-xs font-mono font-bold text-gray-300 uppercase">
                  Estado de la Sala
                </span>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {hasTv ? '🟢 TV CONECTADA' : '🟡 ESPERANDO TV'}
                </span>
              </div>

              {connectedDevices.length > 0 ? (
                <div className="space-y-2">
                  {connectedDevices.map((dev, idx) => (
                    <div
                      key={dev.id || idx}
                      className="flex items-center justify-between text-xs bg-gray-950 border border-gray-800 px-3 py-2.5 rounded-lg"
                    >
                      <div className="flex items-center gap-2.5">
                        {dev.type === 'tv' ? (
                          <Tv className="h-4 w-4 text-cyan-400" />
                        ) : (
                          <Smartphone className="h-4 w-4 text-teal-400" />
                        )}
                        <div>
                          <span className="font-bold text-white block">{dev.name}</span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {dev.type === 'tv' ? 'Pantalla de Video' : 'Control Remoto'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                        En línea
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-gray-400">
                  No hay pantallas externas activas en este momento. Conecta tu Samsung TV con las opciones de la pestaña anterior.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 py-2.5 text-xs font-black text-cyan-300 transition"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
