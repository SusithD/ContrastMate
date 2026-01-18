/**
 * Reusable UI Components for Accessibility Auditor
 */

import { h, Fragment, JSX } from 'preact'
import type { TextLayerData, FilterMode, ScanResult, WCAGLevel } from './types'
import { formatContrastRatio, rgbToHex } from './contrast'
import {
    IconCheck,
    IconX,
    IconAlertTriangle,
    IconType,
    IconZoomIn,
    IconFontMissing,
    IconChevronRight,
    IconInfo
} from './icons'

// ============================================================================
// Stats Summary Component
// ============================================================================

interface StatsSummaryProps {
    result: ScanResult
}

export function StatsSummary({ result }: StatsSummaryProps): JSX.Element {
    return (
        <div className="flex gap-3 p-4 bg-figma-bg-secondary rounded-xl">
            <div className="stat-card stat-card--error flex-1">
                <span className="stat-card__value">{result.errorCount}</span>
                <span className="stat-card__label">Errors</span>
            </div>
            <div className="stat-card stat-card--warning flex-1">
                <span className="stat-card__value">{result.warningCount}</span>
                <span className="stat-card__label">Warnings</span>
            </div>
            <div className="stat-card stat-card--pass flex-1">
                <span className="stat-card__value">{result.passCount}</span>
                <span className="stat-card__label">Passed</span>
            </div>
        </div>
    )
}

// ============================================================================
// Filter Bar Component
// ============================================================================

interface FilterBarProps {
    filterMode: FilterMode
    onFilterChange: (mode: FilterMode) => void
    totalCount: number
    errorCount: number
    warningCount: number
    passCount: number
}

export function FilterBar({
    filterMode,
    onFilterChange,
    totalCount,
    errorCount,
    warningCount,
    passCount
}: FilterBarProps): JSX.Element {
    const filters: { mode: FilterMode; label: string; count: number }[] = [
        { mode: 'all', label: 'All', count: totalCount },
        { mode: 'errors', label: 'Errors', count: errorCount },
        { mode: 'warnings', label: 'Warnings', count: warningCount },
        { mode: 'passed', label: 'Passed', count: passCount }
    ]

    const handleKeyDown = (event: KeyboardEvent, currentIndex: number) => {
        const modes = filters.map(f => f.mode)
        let newIndex = currentIndex

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault()
            newIndex = (currentIndex + 1) % modes.length
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault()
            newIndex = (currentIndex - 1 + modes.length) % modes.length
        } else if (event.key === 'Home') {
            event.preventDefault()
            newIndex = 0
        } else if (event.key === 'End') {
            event.preventDefault()
            newIndex = modes.length - 1
        } else {
            return
        }

        onFilterChange(modes[newIndex])
        // Focus the new button
        const buttons = document.querySelectorAll('[role="tab"]')
        if (buttons[newIndex]) {
            (buttons[newIndex] as HTMLElement).focus()
        }
    }

    return (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto" role="tablist" aria-label="Filter layers">
            {filters.map(({ mode, label, count }, index) => (
                <button
                    key={mode}
                    role="tab"
                    aria-selected={filterMode === mode}
                    aria-controls="layer-list"
                    aria-label={`${label} layers: ${count} items`}
                    tabIndex={filterMode === mode ? 0 : -1}
                    onClick={() => onFilterChange(mode)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className={`filter-btn whitespace-nowrap ${filterMode === mode ? 'filter-btn--active' : ''
                        }`}
                >
                    {label}
                    <span className="opacity-60">({count})</span>
                </button>
            ))}
        </div>
    )
}

// ============================================================================
// Search Bar Component
// ============================================================================

interface SearchBarProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

export function SearchBar({
    value,
    onChange,
    placeholder = 'Search layers...'
}: SearchBarProps): JSX.Element {
    return (
        <div className="relative px-4">
            <label htmlFor="layer-search" className="sr-only">
                Search layers by name, text, or font
            </label>
            <input
                id="layer-search"
                type="text"
                value={value}
                onInput={(e) => onChange((e.target as HTMLInputElement).value)}
                placeholder={placeholder}
                aria-label="Search layers by name, text, or font"
                className="w-full px-4 py-2 pl-10 bg-figma-bg-tertiary border border-figma-border-subtle rounded-lg text-sm text-figma-text-primary placeholder-figma-text-tertiary focus:outline-none focus:border-figma-brand-primary transition-colors"
            />
            <svg
                className="absolute left-7 top-1/2 transform -translate-y-1/2 text-figma-text-tertiary"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
            >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
        </div>
    )
}

// ============================================================================
// Color Swatch Component
// ============================================================================

interface ColorSwatchProps {
    color: { r: number; g: number; b: number; a?: number }
    size?: number
}

export function ColorSwatch({ color, size = 20 }: ColorSwatchProps): JSX.Element {
    const hex = rgbToHex(color)
    const alpha = color.a ?? 1

    return (
        <div
            className="color-swatch"
            style={{
                width: size,
                height: size,
                backgroundColor: hex,
                opacity: alpha
            }}
            title={`${hex} (${Math.round(alpha * 100)}% opacity)`}
        />
    )
}

// ============================================================================
// WCAG Badge Component
// ============================================================================

interface WCAGBadgeProps {
    level: WCAGLevel
    contrastRatio: number
}

export function WCAGBadge({ level, contrastRatio }: WCAGBadgeProps): JSX.Element {
    const getStatusClass = () => {
        switch (level) {
            case 'AAA':
                return 'status-badge--aaa'
            case 'AA':
            case 'AA-Large':
                return 'status-badge--aa'
            case 'FAIL':
                return 'status-badge--fail'
        }
    }

    const getIcon = () => {
        switch (level) {
            case 'AAA':
            case 'AA':
            case 'AA-Large':
                return <IconCheck size={10} />
            case 'FAIL':
                return <IconX size={10} />
        }
    }

    return (
        <div className="flex items-center gap-2">
            <span className={`status-badge ${getStatusClass()}`}>
                {getIcon()}
                {level}
            </span>
            <span className="contrast-display">
                {formatContrastRatio(contrastRatio)}
            </span>
        </div>
    )
}

// ============================================================================
// Layer Card Component
// ============================================================================

interface LayerCardProps {
    layer: TextLayerData
    onClick: () => void
    isSelected?: boolean
}

export function LayerCard({ layer, onClick, isSelected }: LayerCardProps): JSX.Element {
    const getCardClass = () => {
        if (layer.issueType === 'contrast-fail') return 'layer-card--error'
        if (layer.issueType === 'missing-font' || layer.issueType === 'no-background') {
            return 'layer-card--warning'
        }
        return 'layer-card--pass'
    }

    const getStatusIcon = () => {
        switch (layer.issueType) {
            case 'contrast-fail':
                return <IconX size={14} className="text-figma-brand-error" />
            case 'missing-font':
                return <IconFontMissing size={14} className="text-figma-brand-warning" />
            case 'no-background':
                return <IconAlertTriangle size={14} className="text-figma-brand-warning" />
            case 'none':
                return <IconCheck size={14} className="text-figma-brand-success" />
        }
    }

    const getStatusLabel = () => {
        switch (layer.issueType) {
            case 'contrast-fail':
                return 'Contrast error'
            case 'missing-font':
                return 'Missing font'
            case 'no-background':
                return 'No background detected'
            case 'none':
                return 'Passes accessibility'
        }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onClick()
        }
    }

    return (
        <button
            type="button"
            className={`layer-card ${getCardClass()} ${isSelected ? 'ring-2 ring-figma-brand-primary' : ''
                } animate-in`}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            aria-label={`${getStatusLabel()}: ${layer.name} in ${layer.parentName}. Contrast ratio ${layer.contrastRatio.toFixed(2)}:1, WCAG ${layer.wcagLevel}`}
            aria-pressed={isSelected}
        >
            {/* Header Row */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    {getStatusIcon()}
                    <div className="min-w-0">
                        <h3 className="text-sm font-medium text-figma-text-primary truncate">
                            {layer.name}
                        </h3>
                        <p className="text-2xs text-figma-text-tertiary">
                            in {layer.parentName}
                        </p>
                    </div>
                </div>
                <IconZoomIn size={14} className="text-figma-text-tertiary flex-shrink-0 mt-1" />
            </div>

            {/* Text Preview */}
            <div className="flex items-center gap-2 p-2 bg-figma-bg-primary rounded-md">
                <IconType size={12} className="text-figma-text-tertiary flex-shrink-0" />
                <span className="text-xs text-figma-text-secondary truncate">
                    "{layer.characters}"
                </span>
            </div>

            {/* Color & Contrast Info */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <ColorSwatch color={layer.textColor} size={16} />
                    <span className="text-2xs text-figma-text-tertiary">on</span>
                    {layer.backgroundColor ? (
                        <ColorSwatch color={layer.backgroundColor} size={16} />
                    ) : (
                        <span className="text-2xs text-figma-text-tertiary italic">
                            No bg
                        </span>
                    )}
                </div>
                <WCAGBadge level={layer.wcagLevel} contrastRatio={layer.contrastRatio} />
            </div>

            {/* Font Info */}
            <div className="flex items-center justify-between text-2xs text-figma-text-tertiary">
                <span className="flex items-center gap-1">
                    {layer.fontInfo.isMissing && (
                        <IconAlertTriangle size={10} className="text-figma-brand-warning" />
                    )}
                    {layer.fontInfo.fontFamily} {layer.fontInfo.fontStyle}
                </span>
                <span>
                    {layer.fontInfo.fontSize}px
                    {layer.isLargeText && (
                        <span className="ml-1 text-figma-brand-secondary">(Large)</span>
                    )}
                </span>
            </div>

            {/* Warning Messages */}
            {layer.fontInfo.isMissing && (
                <div className="flex items-center gap-2 p-2 bg-figma-brand-warning/10 border border-figma-brand-warning/30 rounded-md">
                    <IconAlertTriangle size={12} className="text-figma-brand-warning flex-shrink-0" />
                    <span className="text-2xs text-figma-brand-warning">
                        Font "{layer.fontInfo.fontFamily}" is not installed
                    </span>
                </div>
            )}

            {layer.issueType === 'no-background' && (
                <div className="flex items-center gap-2 p-2 bg-figma-brand-warning/10 border border-figma-brand-warning/30 rounded-md">
                    <IconAlertTriangle size={12} className="text-figma-brand-warning flex-shrink-0" />
                    <span className="text-2xs text-figma-brand-warning">
                        No background detected — contrast calculated against white
                    </span>
                </div>
            )}
        </button>
    )
}

// ============================================================================
// Layer List Component
// ============================================================================

interface LayerListProps {
    layers: TextLayerData[]
    selectedId: string | null
    onLayerClick: (layer: TextLayerData) => void
}

export function LayerList({ layers, selectedId, onLayerClick }: LayerListProps): JSX.Element {
    if (layers.length === 0) {
        return (
            <div id="layer-list" className="empty-state" role="region" aria-label="Layer results">
                <IconType size={48} className="empty-state__icon" />
                <h3 className="empty-state__title">No layers match your filter</h3>
                <p className="empty-state__description">
                    Try adjusting your filters or search query to see more results.
                </p>
            </div>
        )
    }

    return (
        <div
            id="layer-list"
            className="flex flex-col gap-3 px-4 pb-4"
            role="region"
            aria-label="Layer results"
            aria-live="polite"
        >
            {layers.map((layer, index) => (
                <LayerCard
                    key={layer.id}
                    layer={layer}
                    onClick={() => onLayerClick(layer)}
                    isSelected={selectedId === layer.id}
                />
            ))}
        </div>
    )
}

// ============================================================================
// Loading State Component
// ============================================================================

interface LoadingStateProps {
    scannedCount?: number
}

export function LoadingState({ scannedCount }: LoadingStateProps): JSX.Element {
    return (
        <div className="flex flex-col items-center justify-center py-16">
            <div className="loading-spinner mb-4" />
            <p className="text-sm text-figma-text-secondary">
                {scannedCount !== undefined && scannedCount > 0
                    ? `Scanning layers... (${scannedCount} scanned)`
                    : 'Scanning layers...'}
            </p>
        </div>
    )
}

// ============================================================================
// Empty Selection State Component
// ============================================================================

interface EmptySelectionStateProps {
    onScanPage: () => void
}

export function EmptySelectionState({ onScanPage }: EmptySelectionStateProps): JSX.Element {
    return (
        <div className="empty-state">
            <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                fill="none"
                className="empty-state__icon"
            >
                <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                <path
                    d="M32 24v16M24 32h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </svg>
            <h3 className="empty-state__title">No Selection</h3>
            <p className="empty-state__description">
                Select layers in Figma to scan them for accessibility issues, or scan the entire page.
            </p>
            <button
                onClick={onScanPage}
                className="btn btn--primary mt-4"
            >
                Scan Entire Page
            </button>
        </div>
    )
}

// ============================================================================
// No Results State Component
// ============================================================================

export function NoResultsState(): JSX.Element {
    return (
        <div className="empty-state">
            <IconCheck size={48} className="empty-state__icon text-figma-brand-success" />
            <h3 className="empty-state__title">No Text Layers Found</h3>
            <p className="empty-state__description">
                The selected area doesn't contain any text layers to analyze.
            </p>
        </div>
    )
}

// ============================================================================
// Header Component
// ============================================================================

interface HeaderProps {
    onRescan: () => void
    onInfoClick: () => void
    isScanning: boolean
    lastScanTime?: number
}

export function Header({ onRescan, onInfoClick, isScanning, lastScanTime }: HeaderProps): JSX.Element {
    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="flex items-center justify-between px-4 py-3 bg-figma-bg-secondary border-b border-figma-border-subtle">
            <div className="flex items-center gap-2">
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-figma-brand-primary"
                >
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="8" r="2" fill="currentColor" />
                    <path d="M12 10v4" stroke="currentColor" strokeWidth="2" />
                    <path d="M8 15l4-1 4 1" stroke="currentColor" strokeWidth="2" />
                    <path d="M8 19l2-4" stroke="currentColor" strokeWidth="2" />
                    <path d="M16 19l-2-4" stroke="currentColor" strokeWidth="2" />
                </svg>
                <div>
                    <h1 className="text-sm font-semibold text-figma-text-primary">
                        ContrastMate
                    </h1>
                    {lastScanTime && (
                        <p className="text-2xs text-figma-text-tertiary">
                            Last scan: {formatTime(lastScanTime)}
                        </p>
                    )}
                </div>
            </div>
            <button
                onClick={onRescan}
                disabled={isScanning}
                className={`btn btn--secondary ${isScanning ? 'animate-pulse' : ''}`}
                title="Re-scan selection"
                aria-label={isScanning ? 'Scanning in progress' : 'Re-scan selection'}
            >
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={isScanning ? 'animate-spin' : ''}
                >
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                {isScanning ? 'Scanning...' : 'Re-scan'}
            </button>
            <button
                onClick={onInfoClick}
                className="btn btn--ghost p-2"
                title="About ContrastMate"
                aria-label="About ContrastMate"
            >
                <IconInfo size={16} />
            </button>
        </div>
    )
}

// ============================================================================
// About Modal Component
// ============================================================================

interface AboutModalProps {
    isOpen: boolean
    onClose: () => void
}

export function AboutModal({ isOpen, onClose }: AboutModalProps): JSX.Element | null {
    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in"
            onClick={onClose}
        >
            <div
                className="bg-figma-bg-secondary rounded-xl shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 slide-in-from-bottom-4"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-labelledby="about-title"
                aria-modal="true"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-figma-border-subtle">
                    <h2 id="about-title" className="text-lg font-semibold text-figma-text-primary">
                        About ContrastMate
                    </h2>
                    <button
                        onClick={onClose}
                        className="btn btn--ghost p-2 hover:bg-figma-bg-tertiary rounded-lg transition-colors"
                        aria-label="Close about dialog"
                    >
                        <IconX size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Logo & Version */}
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 mb-3 bg-figma-brand-primary/10 rounded-xl">
                            <svg
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill="none"
                                className="text-figma-brand-primary"
                            >
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                <circle cx="12" cy="8" r="2" fill="currentColor" />
                                <path d="M12 10v4" stroke="currentColor" strokeWidth="2" />
                                <path d="M8 15l4-1 4 1" stroke="currentColor" strokeWidth="2" />
                                <path d="M8 19l2-4" stroke="currentColor" strokeWidth="2" />
                                <path d="M16 19l-2-4" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-figma-text-primary mb-1">ContrastMate</h3>
                        <p className="text-sm text-figma-text-tertiary">Version 1.0.0</p>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <p className="text-sm text-figma-text-secondary leading-relaxed">
                            A professional WCAG contrast checker for Figma designs. Scan your text layers
                            and ensure they meet accessibility standards (AA/AAA compliance).
                        </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-figma-text-primary uppercase tracking-wide">
                            Features
                        </h4>
                        <ul className="space-y-1.5 text-sm text-figma-text-secondary">
                            <li className="flex items-start gap-2">
                                <IconCheck size={14} className="text-figma-brand-success mt-0.5 flex-shrink-0" />
                                <span>Real-time WCAG 2.1 contrast checking</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <IconCheck size={14} className="text-figma-brand-success mt-0.5 flex-shrink-0" />
                                <span>AA & AAA level compliance detection</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <IconCheck size={14} className="text-figma-brand-success mt-0.5 flex-shrink-0" />
                                <span>Large text threshold calculation</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <IconCheck size={14} className="text-figma-brand-success mt-0.5 flex-shrink-0" />
                                <span>Full keyboard accessibility</span>
                            </li>
                        </ul>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-figma-border-subtle" />

                    {/* Author */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-figma-text-primary uppercase tracking-wide">
                            Created By
                        </h4>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-figma-brand-primary/10 flex items-center justify-center">
                                <span className="text-lg font-bold text-figma-brand-primary">SD</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-figma-text-primary">
                                    Susith Deshan Alwis
                                </p>
                                <p className="text-xs text-figma-text-tertiary">Developer & Designer</p>
                            </div>
                        </div>

                        {/* Contact Links */}
                        <div className="flex gap-2">
                            <a
                                href="https://github.com/SusithD"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 btn btn--secondary text-xs justify-center"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                </svg>
                                GitHub
                            </a>
                            <a
                                href="mailto:iamsusithalwis@gmail.com"
                                className="flex-1 btn btn--secondary text-xs justify-center"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                    <polyline points="22,6 12,13 2,6"/>
                                </svg>
                                Email
                            </a>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-figma-bg-tertiary border-t border-figma-border-subtle rounded-b-xl">
                    <p className="text-2xs text-center text-figma-text-tertiary">
                        Made with ❤️ for the Figma community • MIT License
                    </p>
                </div>
            </div>
        </div>
    )
}
