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
      {/* Slide Container - Tamaño original simétrico y armónico */}
      <div
        className={`w-full min-h-[290px] sm:min-h-[320px] md:min-h-[350px] bg-gradient-to-r ${currentSlide.bg_gradient} flex items-center p-6 sm:p-8 md:p-10 transition-colors duration-700`}
      >
        {hasText ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center w-full">
            {/* Left Text Content */}
            <div className="md:col-span-7 flex flex-col justify-center space-y-3 sm:space-y-4 text-left z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 backdrop-blur-xs w-fit text-xs font-semibold text-[#6D4BB8] shadow-xs border border-white/60">
                <Sparkles className="w-3.5 h-3.5 text-[#F472A8]" />
                <span>Tienda colombiana con envíos seguros</span>
              </div>

              <div className="space-y-1">
                <h1 className="leading-tight">
                  <span className="block font-script text-2xl sm:text-3xl md:text-4xl text-[#6D4BB8]">
                    {currentSlide.title}
                  </span>
                  {currentSlide.highlight_text && (
                    <span className="inline-flex items-center gap-2 font-script text-3xl sm:text-4xl md:text-5xl text-[#F472A8] font-normal tracking-tight">
                      {currentSlide.highlight_text}
                      <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-[#F472A8] fill-[#F472A8] inline-block animate-bounce" />
                    </span>
                  )}
                </h1>
                {currentSlide.subtitle && (
                  <p className="text-xs sm:text-sm md:text-base text-[#7A7590] max-w-md font-normal leading-relaxed pt-1">
                    {currentSlide.subtitle}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Link
                  href={currentSlide.link || "/#productos"}
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 bg-[#F472A8] hover:bg-[#E35E96] text-white text-sm sm:text-base font-bold rounded-full shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
                >
                  {currentSlide.cta_text || "¡Descubre más!"}
                </Link>
              </div>
            </div>

            {/* Right Hero Image */}
            <div className="hidden md:flex md:col-span-5 relative h-56 sm:h-64 lg:h-72 w-full items-center justify-center">
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-xs border border-white/60 group">
                {currentSlide.image_url ? (
                  <Image
                    src={currentSlide.image_url}
                    alt={currentSlide.title || "Variedad de productos alyshop"}
                    fill
                    priority
                    unoptimized={currentSlide.image_url?.startsWith("data:")}
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 1024px) 40vw, 350px"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        ) : (
          /* Full Image Banner (si no tiene texto) */
          <Link
            href={currentSlide.link || "/#productos"}
            className="relative w-full h-[290px] sm:h-[320px] md:h-[350px] flex items-center justify-center group"
          >
            {currentSlide.image_url && (
              <Image
                src={currentSlide.image_url}
                alt={currentSlide.title || "Banner promocional alyshop"}
                fill
                priority
                unoptimized={currentSlide.image_url?.startsWith("data:")}
                className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                sizes="(max-width: 1024px) 100vw, 1200px"
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
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-[#2E2A3B] hover:text-[#6D4BB8] shadow-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 z-20 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2.2} />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Slide siguiente"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-[#2E2A3B] hover:text-[#6D4BB8] shadow-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 z-20 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" strokeWidth={2.2} />
          </button>

          {/* Indicators Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/60 backdrop-blur-xs px-3 py-1.5 rounded-full border border-white/70 z-20">
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
