// src/components/Book.tsx
// Visor de libro con efecto page-flip + export PDF
// Ratio libro abierto: 16:9 | Ratio imagen: 4:5
// Usa: npm install react-pageflip jspdf

import { useRef, useCallback, forwardRef, useState, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import type { ComicFace, TenantConfig } from '../types';

// ============================================================================
// TIPOS
// ============================================================================

interface BookProps {
    pages: ComicFace[];
    tenantConfig: TenantConfig;
    heroName: string;
    onReset: () => void;
}

interface PageProps {
    children: React.ReactNode;
    className?: string;
}

interface FlipBookApi {
    pageFlip: () => {
        flipPrev: () => void;
        flipNext: () => void;
    } | null;
}

interface FlipEvent {
    data: number;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const INK_BLACK = '#1E293B';
const SPREAD_RATIO = 16 / 9; // Libro abierto completo
const TARGET_SPREAD_WIDTH = 900; // Ancho total del libro abierto (2 páginas)
const TARGET_SPREAD_HEIGHT = Math.round((TARGET_SPREAD_WIDTH * 9) / 16);

// ============================================================================
// COMPONENTE DE PÁGINA
// ============================================================================

const Page = forwardRef<HTMLDivElement, PageProps>(({ children, className = '' }, ref) => {
    return (
        <div ref={ref} className={`page-wrapper ${className}`}>
            {children}
        </div>
    );
});

Page.displayName = 'Page';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function Book({ pages, tenantConfig, heroName, onReset }: BookProps) {
    const bookRef = useRef<FlipBookApi | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [bookSize, setBookSize] = useState({
        spreadWidth: TARGET_SPREAD_WIDTH,
        spreadHeight: TARGET_SPREAD_HEIGHT,
    });

    // Estado para export PDF
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState({ percent: 0, message: '' });

    // Colores dinámicos del tenant
    const colors = {
        primary: tenantConfig.brandColors.primary,
        accent: tenantConfig.brandColors.accent,
        background: tenantConfig.brandColors.background,
    };

    // Calcular dimensiones con ratio 16:9 estricto para el libro abierto
    useEffect(() => {
        const updateDimensions = () => {
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            // En desktop damos prioridad al ancho 900; en móvil, ancho disponible.
            const horizontalPadding = vw < 768 ? 24 : 80;
            const availableWidth = Math.max(320, vw - horizontalPadding);
            const availableHeight = Math.max(220, vh - (vw < 768 ? 260 : 420));

            let spreadWidth = vw >= 1024
                ? Math.min(TARGET_SPREAD_WIDTH, availableWidth)
                : availableWidth;
            let spreadHeight = spreadWidth / SPREAD_RATIO;

            // En mobile/tablet, ajustar por alto manteniendo 16:9.
            // En desktop, respetar 900x506 aunque implique más scroll vertical.
            if (vw < 1024 && spreadHeight > availableHeight) {
                spreadHeight = availableHeight;
                spreadWidth = spreadHeight * SPREAD_RATIO;
            }

            setBookSize({
                spreadWidth: Math.floor(spreadWidth),
                spreadHeight: Math.floor(spreadHeight),
            });
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Navegación
    const handlePrevPage = useCallback(() => {
        bookRef.current?.pageFlip()?.flipPrev();
    }, []);

    const handleNextPage = useCallback(() => {
        bookRef.current?.pageFlip()?.flipNext();
    }, []);

    const onFlip = useCallback((e: FlipEvent) => {
        setCurrentPage(e.data);
    }, []);

    // Navegación por teclado
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isExporting) return; // Deshabilitar durante export

            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                handleNextPage();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handlePrevPage();
            } else if (e.key === 'Escape') {
                onReset();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleNextPage, handlePrevPage, onReset, isExporting]);

    // Export PDF
    const handleExportPdf = async () => {
        setIsExporting(true);
        setExportProgress({ percent: 0, message: 'Preparando PDF...' });

        try {
            const { exportToPdf } = await import('../utils/pdfExport');
            await exportToPdf({
                pages,
                heroName,
                tenantConfig,
                onProgress: (percent, message) => {
                    setExportProgress({ percent, message });
                },
            });
        } catch (error) {
            console.error('Error exportando PDF:', error);
            alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
        } finally {
            setIsExporting(false);
        }
    };

    // Construir las páginas
    const buildPages = () => {
        const bookPages: React.ReactNode[] = [];

        // === PORTADA ===
        bookPages.push(
            <Page key="cover" className="cover-page">
                <div
                    className="h-full flex items-center justify-center p-4"
                    style={{ backgroundColor: colors.background }}
                >
                    <div className="w-full max-w-[360px] text-center flex flex-col items-center">
                        <h1
                            className="text-2xl md:text-4xl font-display font-bold leading-tight"
                            style={{ color: colors.primary }}
                        >
                            La Aventura de {heroName}
                        </h1>

                        <div
                            className="mt-4 px-6 py-2 rounded-full text-white text-base md:text-lg font-bold"
                            style={{
                                backgroundColor: colors.primary,
                                border: `3px solid ${INK_BLACK}`,
                                boxShadow: `2px 2px 0px ${INK_BLACK}`,
                            }}
                        >
                            {tenantConfig.tenantName}
                        </div>
                    </div>
                </div>
            </Page>
        );

        // === PÁGINAS DEL CUENTO ===
        pages.forEach((page, idx) => {
            // Página de IMAGEN
            bookPages.push(
                <Page key={`img-${idx}`} className="image-page">
                    <div
                        className="h-full flex items-center justify-center p-3"
                        style={{ backgroundColor: colors.background }}
                    >
                        <div
                            className="w-full rounded-lg overflow-hidden"
                            style={{
                                aspectRatio: '4/5',
                                border: '1px solid #E5E7EB',
                            }}
                        >
                            {page.imageUrl ? (
                                <img
                                    src={page.imageUrl}
                                    alt={`Ilustración página ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-400 text-sm">Sin imagen</span>
                                </div>
                            )}
                        </div>
                    </div>
                </Page>
            );

            // Página de TEXTO
            bookPages.push(
                <Page key={`text-${idx}`} className="text-page">
                    <div
                        className="h-full flex flex-col justify-between p-4"
                        style={{ backgroundColor: colors.background }}
                    >
                        {/* Número de página */}
                        <div className="flex justify-center mb-2">
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm"
                                style={{
                                    backgroundColor: colors.primary,
                                }}
                            >
                                {idx + 1}
                            </div>
                        </div>

                        {/* Texto del cuento */}
                        <div className="flex-1 flex flex-col justify-center space-y-3">
                            {page.narrative?.caption && (
                                <p
                                    className="text-sm md:text-base font-body leading-relaxed text-center"
                                    style={{ color: INK_BLACK }}
                                >
                                    {page.narrative.caption}
                                </p>
                            )}

                            {page.narrative?.dialogue && (
                                <p
                                    className="text-sm md:text-base font-body italic leading-relaxed text-center"
                                    style={{ color: colors.primary }}
                                >
                                    "{page.narrative.dialogue}"
                                </p>
                            )}
                        </div>

                        {/* Decoración */}
                        <div className="flex justify-center text-lg" style={{ color: colors.accent }}>
                            ✦  ✦  ✦
                        </div>
                    </div>
                </Page>
            );
        });

        // === CONTRAPORTADA ===
        bookPages.push(
            <Page key="back-cover" className="back-cover-page">
                <div
                    className="h-full flex items-center justify-center p-4"
                    style={{ backgroundColor: colors.background }}
                >
                    <div
                        className="w-full max-w-[320px] md:max-w-[360px] rounded-2xl px-5 py-5 md:px-6 md:py-6 text-center"
                        style={{ backgroundColor: '#FCFBF8' }}
                    >
                        <div className="text-4xl md:text-5xl mb-2">🌟</div>

                        <h2
                            className="text-3xl md:text-4xl font-display font-bold mb-2"
                            style={{ color: colors.primary }}
                        >
                            ¡Fin!
                        </h2>

                        <p className="text-base md:text-lg font-body mb-5 md:mb-6 leading-relaxed" style={{ color: INK_BLACK, opacity: 0.7 }}>
                            Esperamos que hayas disfrutado
                            <br />
                            esta aventura mágica
                        </p>

                        <div className="flex flex-col gap-4">
                            <button
                                onClick={handleExportPdf}
                                disabled={isExporting}
                                className="w-full px-5 py-3 rounded-xl font-display font-bold text-lg md:text-xl btn-tactile disabled:opacity-60"
                                style={{
                                    backgroundColor: colors.primary,
                                    border: `3px solid ${INK_BLACK}`,
                                    boxShadow: `4px 4px 0px ${INK_BLACK}`,
                                    color: 'white',
                                }}
                            >
                                📥 Descargar PDF
                            </button>

                            <button
                                onClick={onReset}
                                disabled={isExporting}
                                className="w-full px-5 py-3 rounded-xl font-display font-bold text-lg md:text-xl btn-tactile disabled:opacity-60"
                                style={{
                                    backgroundColor: colors.accent,
                                    border: `3px solid ${INK_BLACK}`,
                                    boxShadow: `4px 4px 0px ${INK_BLACK}`,
                                    color: INK_BLACK,
                                }}
                            >
                                ✨ Nuevo Cuento
                            </button>
                        </div>
                    </div>
                </div>
            </Page>
        );

        return bookPages;
    };

    const bookPagesElements = buildPages();

    // Contador de páginas (par/impar)
    const totalPairs = Math.ceil(bookPagesElements.length / 2);
    const displayPage = Math.floor(currentPage / 2) + 1;
    const displayTotal = totalPairs;

    // Verificar si estamos en primera o última página
    const isFirstPage = currentPage === 0;
    const isLastPage = currentPage >= bookPagesElements.length - 2;
    const pageWidth = Math.floor(bookSize.spreadWidth / 2);
    const pageHeight = Math.floor(bookSize.spreadHeight);

    return (
        <div
            className="min-h-screen flex flex-col relative"
            style={{ backgroundColor: colors.background }}
        >
            {/* Modal de progreso PDF */}
            {isExporting && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div
                        className="bg-white rounded-xl p-6 max-w-sm w-full mx-4"
                        style={{ border: `3px solid ${INK_BLACK}` }}
                    >
                        <h3
                            className="text-lg font-display font-bold mb-4 text-center"
                            style={{ color: colors.primary }}
                        >
                            Generando PDF...
                        </h3>

                        {/* Barra de progreso */}
                        <div
                            className="w-full h-4 rounded-full overflow-hidden mb-3"
                            style={{ backgroundColor: '#f0f0f0', border: `2px solid ${INK_BLACK}` }}
                        >
                            <div
                                className="h-full transition-all duration-300"
                                style={{
                                    width: `${exportProgress.percent}%`,
                                    backgroundColor: colors.primary,
                                }}
                            />
                        </div>

                        <p
                            className="text-sm text-center font-body"
                            style={{ color: INK_BLACK }}
                        >
                            {exportProgress.message}
                        </p>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="w-full px-4 mt-6 mb-5 flex justify-center items-center gap-4 md:gap-10">
                <h1
                    className="text-xl md:text-2xl font-display font-bold"
                    style={{ color: colors.primary }}
                >
                    {tenantConfig.tenantName}
                </h1>
                <div className="flex items-center gap-3">
                    <span
                        className="text-sm md:text-base font-body font-medium text-center"
                        style={{ color: INK_BLACK }}
                    >
                        Página {displayPage} de {displayTotal}
                    </span>
                    <button
                        onClick={onReset}
                        disabled={isExporting}
                        className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-display font-bold text-sm btn-tactile disabled:opacity-60"
                        style={{
                            backgroundColor: 'white',
                            border: `3px solid ${INK_BLACK}`,
                            boxShadow: `3px 3px 0px ${INK_BLACK}`,
                            color: INK_BLACK,
                        }}
                    >
                        ✕ Cerrar
                    </button>
                </div>
            </header>

            {/* Book Container */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
                <div
                    className="relative rounded-xl"
                    style={{
                        backgroundColor: 'white',
                        border: `3px solid ${INK_BLACK}`,
                        boxShadow: `6px 6px 0px ${INK_BLACK}`,
                        width: `${bookSize.spreadWidth}px`,
                        height: `${bookSize.spreadHeight}px`,
                        maxWidth: 'calc(100vw - 24px)',
                        overflow: 'hidden',
                    }}
                >
                    <HTMLFlipBook
                        ref={bookRef}
                        width={pageWidth}
                        height={pageHeight}
                        size="fixed"
                        minWidth={160}
                        maxWidth={pageWidth}
                        minHeight={180}
                        maxHeight={pageHeight}
                        showCover={true}
                        mobileScrollSupport={true}
                        drawShadow={true}
                        flippingTime={600}
                        usePortrait={false}
                        startPage={0}
                        startZIndex={0}
                        autoSize={false}
                        maxShadowOpacity={0.3}
                        showPageCorners={true}
                        disableFlipByClick={false}
                        onFlip={onFlip}
                        className=""
                        style={{}}
                        useMouseEvents={true}
                        swipeDistance={30}
                        clickEventForward={true}
                    >
                        {bookPagesElements}
                    </HTMLFlipBook>
                </div>
                {/* Controls - Pegados al contenedor del libro */}
                <footer className="mt-5 flex justify-center items-center gap-4 md:gap-6">
                    {/* Botón Anterior */}
                    <button
                        onClick={handlePrevPage}
                        disabled={isFirstPage || isExporting}
                        className="px-5 md:px-6 py-2.5 md:py-3 rounded-lg font-display font-bold text-sm md:text-base btn-tactile disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        style={{
                            backgroundColor: colors.accent,
                            border: `3px solid ${INK_BLACK}`,
                            boxShadow: isFirstPage ? 'none' : `4px 4px 0px ${INK_BLACK}`,
                            color: INK_BLACK,
                        }}
                    >
                        ← Anterior
                    </button>

                    {/* Botón Siguiente */}
                    <button
                        onClick={handleNextPage}
                        disabled={isLastPage || isExporting}
                        className="px-5 md:px-6 py-2.5 md:py-3 rounded-lg font-display font-bold text-sm md:text-base btn-tactile disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        style={{
                            backgroundColor: colors.accent,
                            border: `3px solid ${INK_BLACK}`,
                            boxShadow: isLastPage ? 'none' : `4px 4px 0px ${INK_BLACK}`,
                            color: INK_BLACK,
                        }}
                    >
                        Siguiente →
                    </button>
                </footer>

                {/* Instrucciones */}
                <p
                    className="mt-2 text-center text-xs font-body"
                    style={{ color: INK_BLACK, opacity: 0.5 }}
                >
                    Haz clic en las esquinas o usa los botones • ← → para teclado • ESC para cerrar
                </p>
            </main>

            {/* Estilos */}
            <style>{`
        .page-wrapper {
          width: 100%;
          height: 100%;
          background: ${colors.background};
          overflow: hidden;
        }
        
        .cover-page {
          border-radius: 0 8px 8px 0;
        }
        
        .back-cover-page {
          border-radius: 8px 0 0 8px;
        }

        .image-page img {
          transition: transform 0.3s ease;
        }

        /* Remove react-pageflip default dark borders on pages */
        .stf__item {
          border: none !important;
          box-shadow: none !important;
        }

        /* Efecto táctil neobrutalist para botones */
        .btn-tactile:hover:not(:disabled) {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0px ${INK_BLACK} !important;
        }
        .btn-tactile:active:not(:disabled) {
          transform: translate(4px, 4px);
          box-shadow: 0px 0px 0px ${INK_BLACK} !important;
        }

        @media print {
          header, footer, p:last-of-type {
            display: none !important;
          }
        }
      `}</style>
        </div>
    );
}
