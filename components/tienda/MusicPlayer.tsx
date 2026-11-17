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
  Flame,
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
  accentColor: string;
}

const PLAYLIST: Track[] = [
  {
    id: 1,
    title: "Rock Anthem & Distortion",
    artist: "Kraken Vibes · Alyshop",
    genre: "Rock / Metal",
    durationStr: "3:45",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
    accentColor: "#e11d48",
  },
  {
    id: 2,
    title: "Heavy Riffs & High Voltage",
    artist: "Electric Thunder",
    genre: "Hard Rock",
    durationStr: "4:12",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80",
    accentColor: "#f59e0b",
  },
  {
    id: 3,
    title: "Gothic Nights & Guitars",
    artist: "Midnight Shadows",
    genre: "Gothic Rock",
    durationStr: "3:58",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?auto=format&fit=crop&w=400&q=80",
    accentColor: "#9333ea",
  },
  {
    id: 4,
    title: "Chill Rock Acoustic Groove",
    artist: "Acoustic Lounge",
    genre: "Rock Suave / Chill",
    durationStr: "3:20",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=400&q=80",
    accentColor: "#ec4899",
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
  const currentTrack = PLAYLIST[currentTrackIndex];

  // Actualizar volumen
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Cambiar canción o cargar
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
    setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length);
  };

  const handlePrev = () => {
    setHasStartedOnce(true);
    setCurrentTrackIndex((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
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

      {/* Contenedor flotante a la izquierda (no tapa el botón de WhatsApp a la derecha) */}
      <div className="fixed bottom-20 left-4 md:bottom-6 md:left-6 z-40 flex flex-col items-start select-none font-sans">
        
        {/* Banner flotante de bienvenida a la música (se oculta al dar play o descartar) */}
        {showNotification && !isPlaying && (
          <div className="mb-2 bg-[#09090b]/95 backdrop-blur-md border border-[#e11d48]/50 text-white rounded-2xl p-3 shadow-2xl max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#e11d48] animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#e11d48] flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> Música de Tienda
                </span>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className="text-zinc-400 hover:text-white p-0.5 rounded-full"
                aria-label="Cerrar notificación"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-zinc-300 mt-1 mb-2">
              Disfruta de la mejor música ambiental y rock mientras exploras la tienda.
            </p>
            <button
              onClick={togglePlay}
              className="w-full py-1.5 px-3 rounded-xl bg-[#e11d48] hover:bg-[#be123c] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>Activar Música</span>
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* REPRODUCTOR EXPANDIDO (ESTILO ROCK / BRUTALIST & MODERN GLASS) */}
        {/* ============================================================== */}
        {isExpanded && (
          <div className="mb-3 w-80 sm:w-88 rounded-3xl bg-[#09090b]/95 backdrop-blur-xl border border-zinc-800 text-white shadow-2xl p-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Cabecera del reproductor */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-[#e11d48]/20 text-[#e11d48]">
                  <Radio className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">
                    Alyshop Sound Station
                  </h4>
                  <span className="text-[10px] text-zinc-400 block">
                    Música en vivo para tus compras
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowPlaylist((prev) => !prev)}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    showPlaylist
                      ? "bg-[#e11d48] text-white"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                  title="Ver lista de canciones"
                >
                  <ListMusic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="Minimizar"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Vista de Lista de Canciones */}
            {showPlaylist ? (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 my-3 scrollbar-thin">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block mb-1">
                  Selecciona una pista:
                </span>
                {PLAYLIST.map((track, idx) => (
                  <button
                    key={track.id}
                    onClick={() => {
                      setHasStartedOnce(true);
                      setCurrentTrackIndex(idx);
                      setShowPlaylist(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all ${
                      currentTrackIndex === idx
                        ? "bg-[#e11d48]/20 border border-[#e11d48]/60 text-white font-bold"
                        : "hover:bg-zinc-800/60 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-[11px] text-zinc-500 font-mono w-4">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <div className="truncate text-white">{track.title}</div>
                        <div className="text-[10px] text-zinc-400">{track.artist}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono ml-2">
                      {track.durationStr}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              /* Vista Principal del Track */
              <div className="space-y-4">
                {/* Portada con Vinilo Giratorio */}
                <div className="relative flex items-center justify-center py-2">
                  <div
                    className={`relative w-28 h-28 rounded-full shadow-2xl flex items-center justify-center border-4 border-zinc-900 overflow-hidden ${
                      isPlaying ? "animate-spin" : ""
                    }`}
                    style={{ animationDuration: "6s" }}
                  >
                    {/* Ranuras del vinilo */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-black opacity-95" />
                    <div className="absolute inset-2 rounded-full border border-zinc-700/40" />
                    <div className="absolute inset-4 rounded-full border border-zinc-700/30" />
                    <div className="absolute inset-6 rounded-full border border-zinc-700/20" />

                    {/* Centro con la imagen */}
                    <img
                      src={currentTrack.cover}
                      alt={currentTrack.title}
                      className="relative z-10 w-12 h-12 rounded-full object-cover border-2 border-white/20"
                    />

                    {/* Agujero central */}
                    <div className="absolute z-20 w-3 h-3 rounded-full bg-zinc-900 border border-white/30" />
                  </div>

                  {/* Ecualizador animado en esquina */}
                  <div className="absolute right-4 bottom-2 flex items-end gap-1 h-6 bg-black/60 px-2 py-1 rounded-lg border border-white/10">
                    <span
                      className={`w-1 bg-[#e11d48] rounded-full transition-all duration-150 ${
                        isPlaying ? "h-5 animate-pulse" : "h-1"
                      }`}
                    />
                    <span
                      className={`w-1 bg-[#f59e0b] rounded-full transition-all duration-150 delay-75 ${
                        isPlaying ? "h-3 animate-pulse" : "h-1"
                      }`}
                    />
                    <span
                      className={`w-1 bg-[#9333ea] rounded-full transition-all duration-150 delay-150 ${
                        isPlaying ? "h-6 animate-pulse" : "h-1"
                      }`}
                    />
                    <span
                      className={`w-1 bg-white rounded-full transition-all duration-150 delay-100 ${
                        isPlaying ? "h-4 animate-pulse" : "h-1"
                      }`}
                    />
                  </div>
                </div>

                {/* Info de la pista */}
                <div className="text-center">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700 mb-1">
                    {currentTrack.genre}
                  </span>
                  <h3 className="font-extrabold text-sm text-white truncate">
                    {currentTrack.title}
                  </h3>
                  <p className="text-xs text-zinc-400 truncate">{currentTrack.artist}</p>
                </div>

                {/* Barra de progreso */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#e11d48]"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controles de reproducción */}
                <div className="flex items-center justify-center gap-4 pt-1">
                  <button
                    onClick={handlePrev}
                    className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
                    title="Anterior"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#e11d48] to-[#f43f5e] hover:brightness-110 text-white flex items-center justify-center shadow-lg shadow-rose-900/40 transition-all active:scale-95 cursor-pointer"
                    title={isPlaying ? "Pausar" : "Reproducir"}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 fill-white" />
                    ) : (
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={handleNext}
                    className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
                    title="Siguiente"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                {/* Control de volumen */}
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
                  <button
                    onClick={toggleMute}
                    className="text-zinc-400 hover:text-white p-1"
                    title={isMuted ? "Activar sonido" : "Silenciar"}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
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
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#e11d48]"
                  />
                  <span className="text-[10px] font-mono text-zinc-500 w-7 text-right">
                    {Math.round((isMuted ? 0 : volume) * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* PÍLDORA / BOTÓN FLOTANTE MINIMALISTA                           */}
        {/* ============================================================== */}
        <div className="flex items-center gap-2 bg-[#09090b]/90 backdrop-blur-xl border border-zinc-800 hover:border-[#e11d48]/60 text-white rounded-full p-1.5 pr-4 shadow-xl shadow-black/40 transition-all hover:scale-102">
          {/* Mini disco o botón play */}
          <button
            onClick={togglePlay}
            className={`relative w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer ${
              isPlaying
                ? "bg-gradient-to-tr from-[#e11d48] to-[#f43f5e] text-white"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
            }`}
            title={isPlaying ? "Pausar música" : "Reproducir música"}
          >
            {isPlaying ? (
              <div className="relative flex items-center justify-center">
                <Disc className="w-5 h-5 animate-spin" style={{ animationDuration: "3s" }} />
                <span className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/60 rounded-full transition-opacity">
                  <Pause className="w-3.5 h-3.5 fill-white" />
                </span>
              </div>
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Información rápida del tema actual + ecualizador */}
          <div
            onClick={() => setIsExpanded((prev) => !prev)}
            className="cursor-pointer max-w-[120px] sm:max-w-[160px] truncate"
            title="Clic para expandir el reproductor"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-white truncate">
                {currentTrack.title}
              </span>
              {isPlaying && (
                <div className="flex items-end gap-0.5 h-3 shrink-0">
                  <span className="w-0.5 h-2.5 bg-[#e11d48] animate-pulse" />
                  <span className="w-0.5 h-1.5 bg-[#f59e0b] animate-pulse delay-75" />
                  <span className="w-0.5 h-3 bg-white animate-pulse delay-150" />
                </div>
              )}
            </div>
            <div className="text-[9px] text-zinc-400 truncate flex items-center gap-1">
              <span>{currentTrack.artist}</span>
            </div>
          </div>

          {/* Botón de expandir */}
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors ml-1 cursor-pointer"
            title={isExpanded ? "Minimizar" : "Expandir reproductor"}
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
