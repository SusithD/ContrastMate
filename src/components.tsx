/**
 * Reusable UI Components for Accessibility Auditor
 */

import { h, JSX } from 'preact'
import type { TextLayerData, FilterMode, ScanResult, WCAGLevel } from './types'
import { formatContrastRatio, rgbToHex } from './contrast'
import {
    IconCheck,
    IconX,
    IconAlertTriangle,
    IconType,
    IconZoomIn,
    IconFontMissing,
    IconChevronRight
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

    return (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto">
            {filters.map(({ mode, label, count }) => (
                <button
                    key={mode}
                    onClick={() => onFilterChange(mode)}
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
            <input
                type="text"
                value={value}
                onInput={(e) => onChange((e.target as HTMLInputElement).value)}
                placeholder={placeholder}
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

    return (
        <div
            className={`layer-card ${getCardClass()} ${isSelected ? 'ring-2 ring-figma-brand-primary' : ''
                } animate-in`}
            onClick={onClick}
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
        </div>
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
            <div className="empty-state">
                <IconType size={48} className="empty-state__icon" />
                <h3 className="empty-state__title">No layers match your filter</h3>
                <p className="empty-state__description">
                    Try adjusting your filters or search query to see more results.
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-3 px-4 pb-4">
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

export function LoadingState(): JSX.Element {
    return (
        <div className="flex flex-col items-center justify-center py-16">
            <div className="loading-spinner mb-4" />
            <p className="text-sm text-figma-text-secondary">Scanning layers...</p>
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
    isScanning: boolean
    lastScanTime?: number
}

export function Header({ onRescan, isScanning, lastScanTime }: HeaderProps): JSX.Element {
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
                        Accessibility Auditor
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
        </div>
    )
}
