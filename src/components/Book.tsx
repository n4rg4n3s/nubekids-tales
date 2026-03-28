// src/components/Book.tsx
// Visor de libro con efecto de libro abierto estilo storybook

import { useState, useEffect } from 'react';
import type { ComicFace, TenantConfig } from '../types';

interface BookProps {
    pages: ComicFace[];
    tenantConfig: TenantConfig;
    heroName: string;
    onReset: () => void;
}

export default function Book({ pages, tenantConfig, heroName, onReset }: BookProps) {
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const currentPage = pages[currentPageIndex];
    const isFirstPage = currentPageIndex === 0;
    const isLastPage = currentPageIndex === pages.length - 1;

    // Navegación con teclado
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' && !isLastPage) {
                handleNextPage();
            } else if (e.key === 'ArrowLeft' && !isFirstPage) {
                handlePrevPage();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentPageIndex, isFirstPage, isLastPage]);

    const handleNextPage = () => {
        if (isLastPage || isAnimating) return;
        setIsAnimating(true);
        setTimeout(() => {
            setCurrentPageIndex(prev => prev + 1);
            setIsAnimating(false);
        }, 300);
    };

    const handlePrevPage = () => {
        if (isFirstPage || isAnimating) return;
        setIsAnimating(true);
        setTimeout(() => {
            setCurrentPageIndex(prev => prev - 1);
            setIsAnimating(false);
        }, 300);
    };

    return (
        <div
            className="min-h-screen flex flex-col"
            style={{ backgroundColor: '#1a1a2e' }}
        >
            {/* Header minimalista */}
            <header className="p-4 flex justify-between items-center">
                <h1 className="text-white/80 text-lg font-medium">
                    {heroName}'s Adventure
                </h1>
                <div className="flex items-center gap-4">
                    <span className="text-white/50 text-sm">
                        {currentPageIndex + 1} / {pages.length}
                    </span>
                    <button
                        onClick={onReset}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg text-sm transition-colors"
                    >
                        ✕ Cerrar
                    </button>
                </div>
            </header>

            {/* Book Container */}
            <main className="flex-1 flex items-center justify-center p-4 md:p-8">
                <div className="w-full max-w-6xl">

                    {/* Book Spread - Efecto libro abierto */}
                    <div
                        className="relative bg-[#f5f0e6] rounded-lg overflow-hidden"
                        style={{
                            aspectRatio: '2 / 1',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0,0,0,0.1)',
                        }}
                    >
                        {/* Sombra del lomo central */}
                        <div
                            className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-16 z-20 pointer-events-none"
                            style={{
                                background: 'linear-gradient(to right, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 30%, transparent 50%, rgba(0,0,0,0.05) 70%, rgba(0,0,0,0.15) 100%)',
                            }}
                        />

                        {/* Línea del lomo */}
                        <div
                            className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 z-20 pointer-events-none"
                            style={{
                                background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.2) 80%, transparent)',
                            }}
                        />

                        <div className="flex h-full">

                            {/* Página Izquierda - Imagen */}
                            <div className="w-1/2 h-full relative overflow-hidden">
                                {/* Efecto de curvatura de página */}
                                <div
                                    className="absolute inset-0 z-10 pointer-events-none"
                                    style={{
                                        background: 'linear-gradient(to right, rgba(0,0,0,0.03) 0%, transparent 10%, transparent 85%, rgba(0,0,0,0.08) 100%)',
                                    }}
                                />

                                {/* Imagen */}
                                <div
                                    className={`h-full transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
                                >
                                    {currentPage.imageUrl ? (
                                        <img
                                            src={currentPage.imageUrl}
                                            alt={`Página ${currentPageIndex + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                            <span className="text-6xl opacity-30">🖼️</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Página Derecha - Texto */}
                            <div className="w-1/2 h-full relative overflow-hidden bg-[#fdfbf7]">
                                {/* Efecto de curvatura de página */}
                                <div
                                    className="absolute inset-0 z-10 pointer-events-none"
                                    style={{
                                        background: 'linear-gradient(to left, rgba(0,0,0,0.02) 0%, transparent 10%, transparent 90%, rgba(0,0,0,0.06) 100%)',
                                    }}
                                />

                                {/* Textura de papel sutil */}
                                <div
                                    className="absolute inset-0 opacity-30 pointer-events-none"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
                                    }}
                                />

                                {/* Contenido */}
                                <div
                                    className={`relative z-0 h-full flex flex-col p-6 md:p-10 transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
                                >
                                    {/* Número de página decorativo */}
                                    <div className="text-center mb-4">
                                        <span
                                            className="text-2xl md:text-3xl font-serif"
                                            style={{ color: tenantConfig.brandColors.primary }}
                                        >
                                            {currentPageIndex + 1}
                                        </span>
                                    </div>

                                    {/* Texto principal */}
                                    <div className="flex-1 flex flex-col justify-center">
                                        <p className="text-base md:text-lg lg:text-xl text-[#2d2d2d] leading-relaxed font-serif text-justify">
                                            {currentPage.narrative?.caption || currentPage.narrative?.scene}
                                        </p>

                                        {currentPage.narrative?.dialogue && (
                                            <p
                                                className="mt-6 text-base md:text-lg italic font-serif"
                                                style={{ color: tenantConfig.brandColors.primary }}
                                            >
                                                "{currentPage.narrative.dialogue}"
                                            </p>
                                        )}
                                    </div>

                                    {/* Decoración inferior */}
                                    <div className="text-center mt-4 opacity-30">
                                        <span className="text-2xl">✦</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Botones de navegación flotantes */}
                        <button
                            onClick={handlePrevPage}
                            disabled={isFirstPage || isAnimating}
                            className={`absolute left-4 top-1/2 -translate-y-1/2 z-30
                w-12 h-12 rounded-full bg-black/20 backdrop-blur-sm
                flex items-center justify-center text-white text-xl
                transition-all duration-200
                ${isFirstPage ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-black/40 hover:scale-110'}
              `}
                            aria-label="Página anterior"
                        >
                            ‹
                        </button>

                        <button
                            onClick={handleNextPage}
                            disabled={isLastPage || isAnimating}
                            className={`absolute right-4 top-1/2 -translate-y-1/2 z-30
                w-12 h-12 rounded-full bg-black/20 backdrop-blur-sm
                flex items-center justify-center text-white text-xl
                transition-all duration-200
                ${isLastPage ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-black/40 hover:scale-110'}
              `}
                            aria-label="Página siguiente"
                        >
                            ›
                        </button>
                    </div>

                    {/* Indicador de páginas */}
                    <div className="flex justify-center mt-6 gap-2">
                        {pages.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => !isAnimating && setCurrentPageIndex(idx)}
                                className={`w-2 h-2 rounded-full transition-all duration-200 ${idx === currentPageIndex
                                        ? 'w-6 bg-white'
                                        : 'bg-white/30 hover:bg-white/50'
                                    }`}
                                aria-label={`Ir a página ${idx + 1}`}
                            />
                        ))}
                    </div>

                    {/* Instrucciones */}
                    <p className="text-center text-white/30 text-sm mt-4">
                        Usa ← → o haz clic en los botones para navegar
                    </p>
                </div>
            </main>
        </div>
    );
}