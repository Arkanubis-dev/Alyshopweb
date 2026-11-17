"use client";

import { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Music,
  Disc,
  ListMusic,
  ChevronUp,
  ChevronDown,
  X,
  Sparkles,
  Heart,
  Radio,
} from "lucide-react";

export interface Track {
  id: number;
  title: string;
  artist: string;
  genre: string;
  durationStr: string;
  src: string;
  cover: string;
  badge: string;
}

const FEMININE_PLAYLIST: Track[] = [
  {
    id: 1,
    title: "Dulce Café & Mañanas Tiernas",
    artist: "Alyshop Sweet Lounge",
    genre: "Acústica Suave & Calidez",
    durationStr: "3:40",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=400&q=80",
    badge: "🌸 Favorita",
  },
  {
    id: 2,
    title: "Algodón de Azúcar & Sueños",
    artist: "Pastel Dreamland",
    genre: "Lo-Fi Cute & Melódico",
    durationStr: "4:15",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    cover: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=400&q=80",
    badge: "✨ Relajante",
  },
  {
    id: 3,
    title: "Brisa Rosa & Pétalos al Viento",
    artist: "Cozy Bedroom Beats",
    genre: "Melodía Delicada",
    durationStr: "3:30",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    cover: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=400&q=80",
    badge: "💖 Tierna",
  },
  {
    id: 4,
    title: "Flores de Cerezo & Piano Mágico",
    artist: "Sakura Breeze",
    genre: "Piano Tierno & Campanas",
    durationStr: "3:55",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3",
    cover: "https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=400&q=80",
    badge: "🌷 Sweet Pop",
  },
];

export function MusicPlayer() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasStartedOnce, setHasStartedOnce] = useState(false);
  const [showNotification, setShowNotification] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrack = FEMININE_PLAYLIST[currentTrackIndex];

  // Control de volumen
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Carga y reproducción automática al cambiar de canción una vez activado
  useEffect(() => {
    if (audioRef.current && hasStartedOnce) {
      audioRef.current.src = currentTrack.src;
      audioRef.current.load();
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [currentTrackIndex, hasStartedOnce, currentTrack.src]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (!hasStartedOnce) {
      setHasStartedOnce(true);
      setShowNotification(false);
      audioRef.current.src = currentTrack.src;
      audioRef.current.load();
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setShowNotification(false);
        })
        .catch(() => {
          setIsPlaying(false);
        });
    }
  };

  const handleNext = () => {
    setHasStartedOnce(true);
    setCurrentTrackIndex((prev) => (prev + 1) % FEMININE_PLAYLIST.length);
  };

  const handlePrev = () => {
    setHasStartedOnce(true);
    setCurrentTrackIndex(
      (prev) => (prev - 1 + FEMININE_PLAYLIST.length) % FEMININE_PLAYLIST.length
    );
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={handleNext}
        preload="none"
      />

      {/* Contenedor flotante a la izquierda (perfectamente integrado con alyshop) */}
      <div className="fixed bottom-20 left-4 md:bottom-6 md:left-6 z-40 flex flex-col items-start select-none font-sans">
        
        {/* Banner tierno de bienvenida (colores alyshop: morado y rosa pastel) */}
        {showNotification && !isPlaying && (
          <div className="mb-2 bg-white/95 backdrop-blur-md border border-[#F472A8]/40 text-[#2E2A3B] rounded-3xl p-3.5 shadow-xl shadow-purple-900/10 max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F472A8] animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#6D4BB8] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#F472A8]" /> Música alyshop
                </span>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className="text-[#7A7590] hover:text-[#2E2A3B] p-0.5 rounded-full"
                aria-label="Cerrar mensaje"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-[#7A7590] mt-1.5 mb-2.5 leading-relaxed">
              ¿Quieres música suave y tierna mientras eliges tus artículos favoritos?
            </p>
            <button
              onClick={togglePlay}
              className="w-full py-2 px-3 rounded-2xl bg-gradient-to-r from-[#6D4BB8] to-[#F472A8] hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-pink-500/20 active:scale-95 cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 fill-white text-white" />
              <span>Escuchar música tierna</span>
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL / TARJETA EXPANDIDA (PALETA PASTEL MORADO & ROSA ALYSHOP) */}
        {/* ============================================================== */}
        {isExpanded && (
          <div className="mb-3 w-80 sm:w-88 rounded-3xl bg-white/98 backdrop-blur-xl border border-[#F0E8F2] text-[#2E2A3B] shadow-2xl shadow-purple-950/15 p-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Cabecera del reproductor */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E8F2] mb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-2xl bg-[#FCE4EF] text-[#F472A8]">
                  <Music className="w-4 h-4 text-[#6D4BB8]" />
                </span>
                <div>
                  <h4 className="text-xs font-extrabold text-[#2E2A3B] tracking-tight">
                    alyshop Melody
                  </h4>
                  <span className="text-[10px] font-semibold text-[#F472A8] block">
                    Melodías tiernas para tus compras 🌸
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowPlaylist((prev) => !prev)}
                  className={`p-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    showPlaylist
                      ? "bg-[#6D4BB8] text-white"
                      : "text-[#7A7590] hover:text-[#2E2A3B] hover:bg-[#FAF5FB]"
                  }`}
                  title="Ver lista de canciones"
                >
                  <ListMusic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 rounded-xl text-[#7A7590] hover:text-[#2E2A3B] hover:bg-[#FAF5FB] transition-colors cursor-pointer"
                  title="Minimizar"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Vista de Playlist */}
            {showPlaylist ? (
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 my-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#7A7590] block mb-2">
                  Elige una canción suave:
                </span>
                {FEMININE_PLAYLIST.map((track, idx) => (
                  <button
                    key={track.id}
                    onClick={() => {
                      setHasStartedOnce(true);
                      setCurrentTrackIndex(idx);
                      setShowPlaylist(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left text-xs transition-all cursor-pointer ${
                      currentTrackIndex === idx
                        ? "bg-[#FCE4EF] border border-[#F472A8]/50 text-[#6D4BB8] font-bold"
                        : "hover:bg-[#FAF5FB] text-[#2E2A3B]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-[11px] text-[#A67AE3] font-bold w-4">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <div className="truncate font-semibold">{track.title}</div>
                        <div className="text-[10px] text-[#7A7590]">{track.genre}</div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[#F472A8] border border-[#F0E8F2] shrink-0 font-medium ml-2">
                      {track.badge}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              /* Vista Principal de la Canción */
              <div className="space-y-4">
                {/* Disco Vinilo Pastel Giratorio */}
                <div className="relative flex items-center justify-center py-2">
                  <div
                    className={`relative w-28 h-28 rounded-full shadow-lg flex items-center justify-center p-1.5 bg-gradient-to-tr from-[#6D4BB8] via-[#F472A8] to-[#FFAA90] ${
                      isPlaying ? "animate-spin" : ""
                    }`}
                    style={{ animationDuration: "7s" }}
                  >
                    {/* Círculo interior del vinilo pastel */}
                    <div className="w-full h-full rounded-full bg-[#FAF5FB] flex items-center justify-center relative overflow-hidden border border-[#F0E8F2]">
                      <img
                        src={currentTrack.cover}
                        alt={currentTrack.title}
                        className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      {/* Agujero central tierno */}
                      <div className="absolute w-3.5 h-3.5 rounded-full bg-[#6D4BB8] border-2 border-white" />
                    </div>
                  </div>

                  {/* Ondas del ecualizador en rosa pastel y lila */}
                  <div className="absolute right-3 bottom-2 flex items-end gap-1 h-6 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-xl border border-[#F0E8F2] shadow-sm">
                    <span
                      className={`w-1 bg-[#6D4BB8] rounded-full transition-all duration-150 ${
                        isPlaying ? "h-5 animate-pulse" : "h-1"
                      }`}
                    />
                    <span
                      className={`w-1 bg-[#F472A8] rounded-full transition-all duration-150 delay-75 ${
                        isPlaying ? "h-3 animate-pulse" : "h-1"
                      }`}
                    />
                    <span
                      className={`w-1 bg-[#FFAA90] rounded-full transition-all duration-150 delay-150 ${
                        isPlaying ? "h-6 animate-pulse" : "h-1"
                      }`}
                    />
                    <span
                      className={`w-1 bg-[#A67AE3] rounded-full transition-all duration-150 delay-100 ${
                        isPlaying ? "h-4 animate-pulse" : "h-1"
                      }`}
                    />
                  </div>
                </div>

                {/* Info de la pista */}
                <div className="text-center">
                  <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-[#FCE4EF] text-[#E05D8C] border border-[#FCE4EF] mb-1.5">
                    {currentTrack.badge} · {currentTrack.genre}
                  </span>
                  <h3 className="font-extrabold text-sm text-[#2E2A3B] truncate">
                    {currentTrack.title}
                  </h3>
                  <p className="text-xs text-[#7A7590] truncate mt-0.5">{currentTrack.artist}</p>
                </div>

                {/* Barra de progreso en rosa pastel */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-[#FAF5FB] rounded-lg appearance-none cursor-pointer accent-[#F472A8]"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[#7A7590]">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controles de reproducción con estilo alyshop */}
                <div className="flex items-center justify-center gap-4 pt-1">
                  <button
                    onClick={handlePrev}
                    className="p-2.5 rounded-2xl text-[#7A7590] hover:text-[#6D4BB8] hover:bg-[#FAF5FB] transition-all cursor-pointer"
                    title="Anterior"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="w-13 h-13 rounded-3xl bg-gradient-to-tr from-[#6D4BB8] to-[#F472A8] hover:opacity-95 text-white flex items-center justify-center shadow-lg shadow-pink-500/25 transition-all active:scale-95 cursor-pointer"
                    title={isPlaying ? "Pausar" : "Reproducir"}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 fill-white text-white" />
                    ) : (
                      <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={handleNext}
                    className="p-2.5 rounded-2xl text-[#7A7590] hover:text-[#6D4BB8] hover:bg-[#FAF5FB] transition-all cursor-pointer"
                    title="Siguiente"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                {/* Control de volumen */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#F0E8F2]">
                  <button
                    onClick={toggleMute}
                    className="text-[#7A7590] hover:text-[#6D4BB8] p-1 cursor-pointer"
                    title={isMuted ? "Activar sonido" : "Silenciar"}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-[#F472A8]" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolume(parseFloat(e.target.value));
                      setIsMuted(false);
                    }}
                    className="w-full h-1.5 bg-[#FAF5FB] rounded-lg appearance-none cursor-pointer accent-[#6D4BB8]"
                  />
                  <span className="text-[10px] font-mono text-[#7A7590] w-7 text-right">
                    {Math.round((isMuted ? 0 : volume) * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* PÍLDORA / BOTÓN FLOTANTE EN COLORES ALYSHOP (BLANCO, ROSA, MORADO) */}
        {/* ============================================================== */}
        <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-xl border border-[#F0E8F2] hover:border-[#F472A8]/60 text-[#2E2A3B] rounded-full p-1.5 pr-4 shadow-lg shadow-purple-900/10 transition-all hover:scale-102">
          {/* Mini botón con degradado alyshop */}
          <button
            onClick={togglePlay}
            className={`relative w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer ${
              isPlaying
                ? "bg-gradient-to-tr from-[#6D4BB8] to-[#F472A8] text-white"
                : "bg-[#FCE4EF] hover:bg-[#fcd2e4] text-[#6D4BB8]"
            }`}
            title={isPlaying ? "Pausar música" : "Reproducir música tierna"}
          >
            {isPlaying ? (
              <div className="relative flex items-center justify-center">
                <Disc className="w-5 h-5 animate-spin" style={{ animationDuration: "4s" }} />
                <span className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-[#6D4BB8]/80 rounded-full transition-opacity">
                  <Pause className="w-3.5 h-3.5 fill-white text-white" />
                </span>
              </div>
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Información rápida del tema actual + ecualizador pastel */}
          <div
            onClick={() => setIsExpanded((prev) => !prev)}
            className="cursor-pointer max-w-[130px] sm:max-w-[170px] truncate"
            title="Clic para ver el reproductor completo"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#2E2A3B] truncate">
                {currentTrack.title}
              </span>
              {isPlaying && (
                <div className="flex items-end gap-0.5 h-3 shrink-0">
                  <span className="w-0.5 h-2.5 bg-[#6D4BB8] animate-pulse" />
                  <span className="w-0.5 h-1.5 bg-[#F472A8] animate-pulse delay-75" />
                  <span className="w-0.5 h-3 bg-[#FFAA90] animate-pulse delay-150" />
                </div>
              )}
            </div>
            <div className="text-[9px] font-medium text-[#F472A8] truncate flex items-center gap-1">
              <span>{currentTrack.badge}</span>
              <span className="text-[#7A7590]">· {currentTrack.artist}</span>
            </div>
          </div>

          {/* Botón de expandir */}
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1 rounded-full text-[#7A7590] hover:text-[#6D4BB8] hover:bg-[#FAF5FB] transition-colors ml-0.5 cursor-pointer"
            title={isExpanded ? "Minimizar" : "Abrir reproductor"}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
