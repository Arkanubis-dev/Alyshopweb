"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Heart, Sparkles } from "lucide-react";
import { BannerSlide } from "@/types";

interface HeroCarouselProps {
  slides: BannerSlide[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  }, [slides.length]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  }, [slides.length]);

  // Slow autoplay (6 seconds)
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide, slides.length]);

  if (!slides || slides.length === 0) return null;

  const currentSlide = slides[currentIndex];
  const hasText = Boolean(currentSlide.title?.trim() || currentSlide.subtitle?.trim());

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden shadow-xs border border-[#F0E8F2] select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slide Container - Ampliado y simétrico */}
      <div
        className={`w-full min-h-[380px] sm:min-h-[440px] md:min-h-[490px] lg:min-h-[530px] bg-gradient-to-r ${currentSlide.bg_gradient} flex items-center p-6 sm:p-8 md:p-10 lg:p-12 transition-colors duration-700`}
      >
        {hasText ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 lg:gap-12 items-center w-full">
            {/* Left Text Content */}
            <div className="md:col-span-6 lg:col-span-6 flex flex-col justify-center space-y-3 sm:space-y-4 md:space-y-5 text-left z-10">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-xs w-fit text-xs font-bold text-[#6D4BB8] shadow-xs border border-white/70">
                <Sparkles className="w-3.5 h-3.5 text-[#F472A8]" />
                <span>Tienda colombiana con envíos seguros</span>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <h1 className="leading-tight">
                  <span className="block font-script text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#6D4BB8]">
                    {currentSlide.title}
                  </span>
                  {currentSlide.highlight_text && (
                    <span className="inline-flex items-center gap-2 font-script text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#F472A8] font-normal tracking-tight">
                      {currentSlide.highlight_text}
                      <Heart className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-[#F472A8] fill-[#F472A8] inline-block animate-bounce" />
                    </span>
                  )}
                </h1>
                {currentSlide.subtitle && (
                  <p className="text-xs sm:text-sm md:text-base text-[#7A7590] max-w-lg font-normal leading-relaxed pt-1">
                    {currentSlide.subtitle}
                  </p>
                )}
              </div>

              <div className="pt-2 sm:pt-3">
                <Link
                  href={currentSlide.link}
                  className="inline-flex items-center justify-center px-7 sm:px-9 py-3 sm:py-3.5 bg-[#F472A8] hover:bg-[#E35E96] text-white text-sm sm:text-base font-bold rounded-full shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
                >
                  {currentSlide.cta_text || "¡Descubre más!"}
                </Link>
              </div>
            </div>

            {/* Right Hero Image - Ajuste simétrico, completa, hasta 1920x1080 sin recortar */}
            <div className="md:col-span-6 lg:col-span-6 relative w-full h-[250px] sm:h-[320px] md:h-[400px] lg:h-[460px] flex items-center justify-center">
              {currentSlide.image_url ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src={currentSlide.image_url}
                    alt={currentSlide.title || "Banner promocional alyshop"}
                    fill
                    priority
                    quality={95}
                    unoptimized={currentSlide.image_url?.startsWith("data:")}
                    className="object-contain drop-shadow-md transition-transform duration-500 hover:scale-[1.02]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 1920px"
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          /* Banner gráfico completo (Full Width Banner) */
          <Link
            href={currentSlide.link || "/#productos"}
            className="relative w-full h-[280px] sm:h-[380px] md:h-[460px] lg:h-[500px] flex items-center justify-center group"
          >
            {currentSlide.image_url && (
              <Image
                src={currentSlide.image_url}
                alt={currentSlide.title || "Banner promocional alyshop"}
                fill
                priority
                quality={95}
                unoptimized={currentSlide.image_url?.startsWith("data:")}
                className="object-contain drop-shadow-md group-hover:scale-[1.01] transition-transform duration-500"
                sizes="(max-width: 1024px) 100vw, 1920px"
              />
            )}
          </Link>
        )}
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Slide anterior"
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-[#2E2A3B] hover:text-[#6D4BB8] shadow-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 z-20 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.2} />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Slide siguiente"
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-[#2E2A3B] hover:text-[#6D4BB8] shadow-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 z-20 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.2} />
          </button>

          {/* Indicators Dots */}
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/70 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-white/80 shadow-xs z-20">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Ir a slide ${idx + 1}`}
                className={`transition-all duration-200 rounded-full cursor-pointer ${
                  idx === currentIndex
                    ? "w-6 h-2 bg-[#F472A8]"
                    : "w-2 h-2 bg-[#7A7590]/40 hover:bg-[#6D4BB8]"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
