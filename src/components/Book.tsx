import { useRef, useCallback, forwardRef, useState, useEffect, type ReactNode } from 'react';
import HTMLFlipBook from 'react-pageflip';
import type { ComicFace, TenantConfig } from '../types';
import type { ExportedPdfAsset } from '../utils/pdfExport';

interface BookProps {
    pages: ComicFace[];
    tenantConfig: TenantConfig;
    heroName: string;
    onReset: () => void;
}

interface PageProps {
    children: ReactNode;
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

interface ViewportState {
    width: number;
    height: number;
    isMobile: boolean;
    isLandscape: boolean;
}

interface PreparedPdfState extends ExportedPdfAsset {
    url: string;
}

const INK_BLACK = '#1E293B';
const SPREAD_RATIO = 16 / 9;
const TARGET_SPREAD_WIDTH = 900;
const MOBILE_BOOK_PADDING = 15;
const DEFAULT_VIEWPORT: ViewportState = {
    width: 1280,
    height: 800,
    isMobile: false,
    isLandscape: true,
};

function getViewportState(): ViewportState {
    if (typeof window === 'undefined') {
        return DEFAULT_VIEWPORT;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const shortestSide = Math.min(width, height);
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

    return {
        width,
        height,
        isLandscape: width > height,
        isMobile: isCoarsePointer && shortestSide < 900,
    };
}

function computeBookSize(viewport: ViewportState): { spreadWidth: number; spreadHeight: number } {
    const isImmersiveMobile = viewport.isMobile && viewport.isLandscape;
    const horizontalPadding = isImmersiveMobile ? MOBILE_BOOK_PADDING * 2 : viewport.width < 768 ? 24 : 80;
    const chromeAllowance = isImmersiveMobile ? MOBILE_BOOK_PADDING * 2 : viewport.isMobile ? 260 : 420;
    const availableWidth = Math.max(320, viewport.width - horizontalPadding);
    const availableHeight = Math.max(220, viewport.height - chromeAllowance);

    let spreadWidth = viewport.width >= 1024 && !viewport.isMobile
        ? Math.min(TARGET_SPREAD_WIDTH, availableWidth)
        : availableWidth;
    let spreadHeight = spreadWidth / SPREAD_RATIO;

    if (viewport.width < 1024 || isImmersiveMobile) {
        if (spreadHeight > availableHeight) {
            spreadHeight = availableHeight;
            spreadWidth = spreadHeight * SPREAD_RATIO;
        }
    }

    return {
        spreadWidth: Math.floor(spreadWidth),
        spreadHeight: Math.floor(spreadHeight),
    };
}

function triggerBrowserDownload(url: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function buildShareablePdfFile(blob: Blob, fileName: string): File | null {
    if (typeof File === 'undefined') {
        return null;
    }

    return new File([blob], fileName, { type: 'application/pdf' });
}

function canSharePdf(blob: Blob, fileName: string): boolean {
    const file = buildShareablePdfFile(blob, fileName);
    if (!file || typeof navigator === 'undefined' || typeof navigator.canShare !== 'function') {
        return false;
    }

    try {
        return navigator.canShare({ files: [file] });
    } catch {
        return false;
    }
}

const Page = forwardRef<HTMLDivElement, PageProps>(({ children, className = '' }, ref) => {
    return (
        <div ref={ref} className={`page-wrapper ${className}`}>
            {children}
        </div>
    );
});

Page.displayName = 'Page';

export default function Book({ pages, tenantConfig, heroName, onReset }: BookProps) {
    const bookRef = useRef<FlipBookApi | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [viewport, setViewport] = useState<ViewportState>(DEFAULT_VIEWPORT);
    const [bookSize, setBookSize] = useState(() => computeBookSize(DEFAULT_VIEWPORT));
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState({ percent: 0, message: '' });
    const [preparedPdf, setPreparedPdf] = useState<PreparedPdfState | null>(null);

    const isMobilePortrait = viewport.isMobile && !viewport.isLandscape;
    const isImmersiveMobile = viewport.isMobile && viewport.isLandscape;
    const exportButtonLabel = viewport.isMobile ? 'Preparar PDF' : 'Descargar PDF';

    const colors = {
        primary: tenantConfig.brandColors.primary,
        accent: tenantConfig.brandColors.accent,
        background: tenantConfig.brandColors.background,
    };

    const replacePreparedPdf = useCallback((nextPdf: PreparedPdfState | null) => {
        setPreparedPdf((currentPdf) => {
            if (currentPdf?.url && currentPdf.url !== nextPdf?.url) {
                URL.revokeObjectURL(currentPdf.url);
            }
            return nextPdf;
        });
    }, []);

    useEffect(() => {
        const updateViewport = () => {
            const nextViewport = getViewportState();
            setViewport(nextViewport);
            setBookSize(computeBookSize(nextViewport));
        };

        updateViewport();
        window.addEventListener('resize', updateViewport, { passive: true });
        window.addEventListener('orientationchange', updateViewport, { passive: true });

        return () => {
            window.removeEventListener('resize', updateViewport);
            window.removeEventListener('orientationchange', updateViewport);
        };
    }, []);

    useEffect(() => {
        return () => {
            if (preparedPdf?.url) {
                URL.revokeObjectURL(preparedPdf.url);
            }
        };
    }, [preparedPdf]);

    const handlePrevPage = useCallback(() => {
        bookRef.current?.pageFlip()?.flipPrev();
    }, []);

    const handleNextPage = useCallback(() => {
        bookRef.current?.pageFlip()?.flipNext();
    }, []);

    const onFlip = useCallback((e: FlipEvent) => {
        setCurrentPage(e.data);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isExporting || isMobilePortrait) {
                return;
            }

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
    }, [handleNextPage, handlePrevPage, onReset, isExporting, isMobilePortrait]);

    const closePreparedPdf = useCallback(() => {
        replacePreparedPdf(null);
    }, [replacePreparedPdf]);

    const handleOpenPreparedPdf = useCallback(() => {
        if (!preparedPdf) {
            return;
        }

        const openedWindow = window.open(preparedPdf.url, '_blank', 'noopener,noreferrer');
        if (!openedWindow) {
            window.location.assign(preparedPdf.url);
        }
    }, [preparedPdf]);

    const handleDownloadPreparedPdf = useCallback(() => {
        if (!preparedPdf) {
            return;
        }

        triggerBrowserDownload(preparedPdf.url, preparedPdf.fileName);
    }, [preparedPdf]);

    const handleSharePreparedPdf = useCallback(async () => {
        if (!preparedPdf) {
            return;
        }

        const shareFile = buildShareablePdfFile(preparedPdf.blob, preparedPdf.fileName);
        if (
            !shareFile ||
            typeof navigator.share !== 'function' ||
            !canSharePdf(preparedPdf.blob, preparedPdf.fileName)
        ) {
            handleOpenPreparedPdf();
            return;
        }

        try {
            await navigator.share({
                files: [shareFile],
                title: preparedPdf.fileName,
            });
            closePreparedPdf();
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                return;
            }

            console.error('Error compartiendo PDF:', error);
            alert('No hemos podido abrir el menu de compartir. Prueba con "Abrir PDF".');
        }
    }, [preparedPdf, closePreparedPdf, handleOpenPreparedPdf]);

    const handleExportPdf = useCallback(async () => {
        setIsExporting(true);
        setExportProgress({ percent: 0, message: 'Preparando PDF...' });
        closePreparedPdf();

        try {
            const { exportToPdf } = await import('../utils/pdfExport');
            const pdfAsset = await exportToPdf({
                pages,
                heroName,
                tenantConfig,
                onProgress: (percent, message) => {
                    setExportProgress({ percent, message });
                },
            });

            if (viewport.isMobile) {
                replacePreparedPdf({
                    ...pdfAsset,
                    url: URL.createObjectURL(pdfAsset.blob),
                });
            } else {
                const downloadUrl = URL.createObjectURL(pdfAsset.blob);
                triggerBrowserDownload(downloadUrl, pdfAsset.fileName);
                window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
            }
        } catch (error) {
            console.error('Error exportando PDF:', error);
            alert('Error al generar el PDF. Por favor, intentalo de nuevo.');
        } finally {
            setIsExporting(false);
        }
    }, [pages, heroName, tenantConfig, viewport.isMobile, closePreparedPdf, replacePreparedPdf]);

    const buildPages = () => {
        const bookPages: ReactNode[] = [];

        bookPages.push(
            <Page key="cover" className="cover-page">
                <div
                    className={`h-full flex items-center justify-center ${isImmersiveMobile ? 'p-2' : 'p-3 md:p-4'}`}
                    style={{ backgroundColor: colors.background }}
                >
                    <div className="w-full max-w-[240px] md:max-w-[360px] text-center flex flex-col items-center">
                        <h1
                            className="text-[1.75rem] md:text-4xl font-display font-bold leading-tight"
                            style={{ color: colors.primary }}
                        >
                            La Aventura de {heroName}
                        </h1>

                        <div
                            className="mt-3 md:mt-4 px-4 md:px-6 py-1.5 md:py-2 rounded-full text-white text-sm md:text-lg font-bold"
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

        pages.forEach((page, idx) => {
            bookPages.push(
                <Page key={`img-${idx}`} className="image-page">
                    <div
                        className={`h-full flex items-center justify-center ${isImmersiveMobile ? 'p-1' : 'p-2.5 md:p-3'}`}
                        style={{ backgroundColor: colors.background }}
                    >
                        <div
                            className="w-auto h-full max-w-full max-h-full rounded-lg overflow-hidden bg-white"
                            style={{
                                aspectRatio: '4/5',
                                border: isImmersiveMobile ? 'none' : '1px solid #E5E7EB',
                            }}
                        >
                            {page.imageUrl ? (
                                <img
                                    src={page.imageUrl}
                                    alt={`Ilustracion pagina ${idx + 1}`}
                                    className="w-full h-full object-contain"
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

            bookPages.push(
                <Page key={`text-${idx}`} className="text-page">
                    <div
                        className="h-full flex flex-col justify-between p-3 md:p-4"
                        style={{ backgroundColor: colors.background }}
                    >
                        <div className="flex justify-center mb-2">
                            <div
                                className={`rounded-full flex items-center justify-center font-bold text-white ${
                                    isImmersiveMobile ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm'
                                }`}
                                style={{ backgroundColor: colors.primary }}
                            >
                                {idx + 1}
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center space-y-3">
                            {page.narrative?.caption && (
                                <p
                                    className="text-[13px] md:text-base font-body leading-snug md:leading-relaxed text-center"
                                    style={{ color: INK_BLACK }}
                                >
                                    {page.narrative.caption}
                                </p>
                            )}

                            {page.narrative?.dialogue && (
                                <p
                                    className="text-[13px] md:text-base font-body italic leading-snug md:leading-relaxed text-center"
                                    style={{ color: colors.primary }}
                                >
                                    "{page.narrative.dialogue}"
                                </p>
                            )}
                        </div>

                        <div className="flex justify-center text-base md:text-lg" style={{ color: colors.accent }}>
                            * * *
                        </div>
                    </div>
                </Page>
            );
        });

        bookPages.push(
            <Page key="back-cover-actions" className="back-cover-page">
                <div
                    className={`h-full flex items-center justify-center ${isImmersiveMobile ? 'p-2' : 'p-3 md:p-4'}`}
                    style={{ backgroundColor: colors.background }}
                >
                    <div
                        className="w-full max-w-[220px] md:max-w-[320px] rounded-2xl px-4 py-4 md:px-6 md:py-6 text-center"
                        style={{ backgroundColor: '#FCFBF8' }}
                    >
                        <div className="flex flex-col gap-3 md:gap-4">
                            <button
                                onClick={handleExportPdf}
                                disabled={isExporting}
                                className="w-full px-4 py-2.5 md:px-5 md:py-3 rounded-xl font-display font-bold text-base md:text-xl btn-tactile disabled:opacity-60"
                                style={{
                                    backgroundColor: colors.primary,
                                    border: `3px solid ${INK_BLACK}`,
                                    boxShadow: `4px 4px 0px ${INK_BLACK}`,
                                    color: 'white',
                                }}
                            >
                                {exportButtonLabel}
                            </button>

                            <button
                                onClick={onReset}
                                disabled={isExporting}
                                className="w-full px-4 py-2.5 md:px-5 md:py-3 rounded-xl font-display font-bold text-base md:text-xl btn-tactile disabled:opacity-60"
                                style={{
                                    backgroundColor: colors.accent,
                                    border: `3px solid ${INK_BLACK}`,
                                    boxShadow: `4px 4px 0px ${INK_BLACK}`,
                                    color: INK_BLACK,
                                }}
                            >
                                Nuevo cuento
                            </button>
                        </div>
                    </div>
                </div>
            </Page>
        );

        bookPages.push(
            <Page key="back-cover-copy" className="back-cover-page">
                <div
                    className={`h-full flex items-center justify-center ${isImmersiveMobile ? 'p-2' : 'p-3 md:p-4'}`}
                    style={{ backgroundColor: colors.background }}
                >
                    <div
                        className="w-full max-w-[220px] md:max-w-[320px] rounded-2xl px-4 py-4 md:px-6 md:py-6 text-center"
                        style={{ backgroundColor: '#FCFBF8' }}
                    >
                        <div className="text-2xl md:text-5xl mb-1 md:mb-2">*</div>

                        <h2
                            className="text-2xl md:text-4xl font-display font-bold mb-2"
                            style={{ color: colors.primary }}
                        >
                            ¡Fin!
                        </h2>

                        <p
                            className="text-sm md:text-lg font-body leading-relaxed"
                            style={{ color: INK_BLACK, opacity: 0.7 }}
                        >
                            Esperamos que hayas disfrutado
                            <br />
                            esta aventura magica
                        </p>
                    </div>
                </div>
            </Page>
        );

        return bookPages;
    };

    const bookPagesElements = buildPages();
    const totalPairs = Math.ceil((bookPagesElements.length - 1) / 2);
    const displayPage = Math.max(1, Math.floor((currentPage - 1) / 2) + 1);
    const displayTotal = totalPairs;
    const isFirstPage = currentPage === 0;
    const isLastPage = currentPage >= bookPagesElements.length - 2;
    const pageWidth = Math.floor(bookSize.spreadWidth / 2);
    const pageHeight = Math.floor(bookSize.spreadHeight);
    const canSharePreparedPdf = preparedPdf
        ? canSharePdf(preparedPdf.blob, preparedPdf.fileName)
        : false;

    return (
        <div
            className={`relative ${isImmersiveMobile ? 'overflow-hidden' : 'min-h-screen flex flex-col'}`}
            style={{
                backgroundColor: colors.background,
                minHeight: isImmersiveMobile ? '100dvh' : '100vh',
                height: isImmersiveMobile ? '100dvh' : undefined,
                padding: viewport.isMobile ? `${MOBILE_BOOK_PADDING}px` : undefined,
            }}
        >
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

                        <p className="text-sm text-center font-body" style={{ color: INK_BLACK }}>
                            {exportProgress.message}
                        </p>
                    </div>
                </div>
            )}

            {preparedPdf && (
                <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 px-4">
                    <div
                        className="w-full max-w-md rounded-3xl bg-white p-6"
                        style={{ border: `3px solid ${INK_BLACK}` }}
                    >
                        <h3
                            className="text-xl font-display font-bold text-center mb-3"
                            style={{ color: colors.primary }}
                        >
                            PDF listo
                        </h3>

                        <p
                            className="text-sm md:text-base font-body text-center leading-relaxed mb-5"
                            style={{ color: INK_BLACK }}
                        >
                            En movil te recomendamos usar el guardado nativo del dispositivo. Si el
                            navegador no lo guarda directo, abre el PDF y usa Compartir {'>'} Guardar
                            en Archivos o Descargas.
                        </p>

                        <div className="flex flex-col gap-3">
                            {canSharePreparedPdf && (
                                <button
                                    onClick={handleSharePreparedPdf}
                                    className="w-full px-5 py-3 rounded-xl font-display font-bold text-base btn-tactile"
                                    style={{
                                        backgroundColor: colors.primary,
                                        border: `3px solid ${INK_BLACK}`,
                                        boxShadow: `4px 4px 0px ${INK_BLACK}`,
                                        color: 'white',
                                    }}
                                >
                                    Guardar o compartir
                                </button>
                            )}

                            <button
                                onClick={handleOpenPreparedPdf}
                                className="w-full px-5 py-3 rounded-xl font-display font-bold text-base btn-tactile"
                                style={{
                                    backgroundColor: colors.accent,
                                    border: `3px solid ${INK_BLACK}`,
                                    boxShadow: `4px 4px 0px ${INK_BLACK}`,
                                    color: INK_BLACK,
                                }}
                            >
                                Abrir PDF
                            </button>

                            <button
                                onClick={handleDownloadPreparedPdf}
                                className="w-full px-5 py-3 rounded-xl font-display font-bold text-base btn-tactile"
                                style={{
                                    backgroundColor: 'white',
                                    border: `3px solid ${INK_BLACK}`,
                                    boxShadow: `4px 4px 0px ${INK_BLACK}`,
                                    color: INK_BLACK,
                                }}
                            >
                                Descargar archivo
                            </button>

                            <button
                                onClick={closePreparedPdf}
                                className="text-sm font-body mt-1"
                                style={{ color: INK_BLACK, opacity: 0.65 }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isMobilePortrait ? (
                <div className="h-full flex items-center justify-center">
                    <button
                        onClick={onReset}
                        disabled={isExporting}
                        className="fixed px-3 py-2 rounded-lg font-display font-bold text-sm btn-tactile disabled:opacity-60 z-40"
                        style={{
                            top: `${MOBILE_BOOK_PADDING}px`,
                            right: `${MOBILE_BOOK_PADDING}px`,
                            backgroundColor: 'white',
                            border: `3px solid ${INK_BLACK}`,
                            boxShadow: `3px 3px 0px ${INK_BLACK}`,
                            color: INK_BLACK,
                        }}
                    >
                        Cerrar
                    </button>

                    <div
                        className="w-full max-w-sm rounded-[28px] bg-white px-5 py-6 text-center"
                        style={{
                            border: `3px solid ${INK_BLACK}`,
                            boxShadow: `6px 6px 0px ${INK_BLACK}`,
                        }}
                    >
                        <div
                            className="mx-auto mb-4 w-fit px-4 py-2 rounded-full font-display font-bold text-sm"
                            style={{
                                backgroundColor: colors.accent,
                                border: `2px solid ${INK_BLACK}`,
                                color: INK_BLACK,
                            }}
                        >
                            Formato 16:9
                        </div>

                        <h2
                            className="text-3xl font-display font-bold mb-3"
                            style={{ color: colors.primary }}
                        >
                            Gira el movil
                        </h2>

                        <p
                            className="text-base font-body leading-relaxed"
                            style={{ color: INK_BLACK }}
                        >
                            Este cuento se lee en horizontal y a pantalla completa. Al girar el
                            dispositivo aprovecharas todo el ancho y pasaras pagina tocando los lados.
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {!isImmersiveMobile && (
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
                                    Pagina {displayPage} de {displayTotal}
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
                                    Cerrar
                                </button>
                            </div>
                        </header>
                    )}

                    <main
                        className={`relative flex flex-col items-center justify-center ${
                            isImmersiveMobile ? 'h-full overflow-hidden' : 'flex-1 px-4 pb-8'
                        }`}
                    >
                        {isImmersiveMobile && (
                            <>
                                <div className="absolute left-0 top-1/2 z-20 -translate-y-1/2">
                                    <div
                                        className="rounded-full px-3 py-2 text-sm font-body font-semibold"
                                        style={{
                                            backgroundColor: 'rgba(255,255,255,0.96)',
                                            border: `2px solid ${INK_BLACK}`,
                                            color: INK_BLACK,
                                        }}
                                    >
                                        {displayPage} de {displayTotal}
                                    </div>
                                </div>

                                <div className="absolute right-0 top-1/2 z-20 -translate-y-1/2">
                                    <button
                                        onClick={onReset}
                                        disabled={isExporting}
                                        className="px-3 py-2 rounded-full font-display font-bold text-sm btn-tactile disabled:opacity-60"
                                        style={{
                                            backgroundColor: 'rgba(255,255,255,0.96)',
                                            border: `2px solid ${INK_BLACK}`,
                                            boxShadow: `2px 2px 0px ${INK_BLACK}`,
                                            color: INK_BLACK,
                                        }}
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </>
                        )}

                        <div
                            className="relative rounded-xl"
                            style={{
                                backgroundColor: 'white',
                                border: `${isImmersiveMobile ? 2 : 3}px solid ${INK_BLACK}`,
                                boxShadow: `${isImmersiveMobile ? 4 : 6}px ${isImmersiveMobile ? 4 : 6}px 0px ${INK_BLACK}`,
                                width: `${bookSize.spreadWidth}px`,
                                height: `${bookSize.spreadHeight}px`,
                                maxWidth: isImmersiveMobile ? `calc(100vw - ${MOBILE_BOOK_PADDING * 2}px)` : 'calc(100vw - 24px)',
                                maxHeight: isImmersiveMobile ? `calc(100dvh - ${MOBILE_BOOK_PADDING * 2}px)` : undefined,
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
                                flippingTime={1200}
                                usePortrait={false}
                                startPage={0}
                                startZIndex={0}
                                autoSize={false}
                                maxShadowOpacity={0.3}
                                showPageCorners={!viewport.isMobile}
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

                            {isImmersiveMobile && (
                                <>
                                    {!isFirstPage && (
                                        <div className="pointer-events-none absolute inset-y-0 left-2 flex items-center">
                                            <div
                                                className="rounded-full px-2 py-1 text-sm font-display font-bold"
                                                style={{
                                                    backgroundColor: 'rgba(255,255,255,0.82)',
                                                    border: `2px solid ${INK_BLACK}`,
                                                    color: INK_BLACK,
                                                }}
                                            >
                                                {'<'}
                                            </div>
                                        </div>
                                    )}

                                    {!isLastPage && (
                                        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                                            <div
                                                className="rounded-full px-2 py-1 text-sm font-display font-bold"
                                                style={{
                                                    backgroundColor: 'rgba(255,255,255,0.82)',
                                                    border: `2px solid ${INK_BLACK}`,
                                                    color: INK_BLACK,
                                                }}
                                            >
                                                {'>'}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {!isImmersiveMobile && (
                            <>
                                <footer className="mt-5 flex justify-center items-center gap-4 md:gap-6">
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
                                        {'<'} Anterior
                                    </button>

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
                                        Siguiente {'>'}
                                    </button>
                                </footer>

                                <p
                                    className="mt-2 text-center text-xs font-body"
                                    style={{ color: INK_BLACK, opacity: 0.5 }}
                                >
                                    Haz clic en las esquinas o usa los botones. Teclado: {'<'} {'>'} y
                                    ESC para cerrar
                                </p>
                            </>
                        )}
                    </main>
                </>
            )}

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

        .stf__item {
          border: none !important;
          box-shadow: none !important;
        }

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
