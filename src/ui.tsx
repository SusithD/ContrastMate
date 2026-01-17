/**
 * Accessibility Auditor - Main UI Component
 * React/Preact UI with Tailwind CSS for Figma plugin
 */

import { h } from 'preact'
import { useState, useEffect, useCallback, useMemo } from 'preact/hooks'
import { render } from '@create-figma-plugin/ui'
import { emit, on } from '@create-figma-plugin/utilities'
import './styles.css'

import type {
    TextLayerData,
    ScanResult,
    FilterMode,
    ScanOptions
} from './types'

import {
    Header,
    StatsSummary,
    FilterBar,
    SearchBar,
    LayerList,
    LoadingState,
    EmptySelectionState,
    NoResultsState
} from './components'

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_SCAN_OPTIONS: ScanOptions = {
    minContrastRatio: 4.5,
    checkLargeText: true,
    includeHiddenLayers: false
}

// ============================================================================
// Main App Component
// ============================================================================

function App(): h.JSX.Element {
    // State
    const [isScanning, setIsScanning] = useState(false)
    const [scanResult, setScanResult] = useState<ScanResult | null>(null)
    const [filterMode, setFilterMode] = useState<FilterMode>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
    const [hasSelection, setHasSelection] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // ============================================================================
    // Event Handlers
    // ============================================================================

    // Handle incoming messages from main thread
    useEffect(() => {
        // Plugin ready message
        on('PLUGIN_READY', (payload: { hasSelection: boolean; selectionCount: number }) => {
            setHasSelection(payload.hasSelection)
        })

        // Scan started
        on('SCAN_STARTED', () => {
            setIsScanning(true)
            setError(null)
        })

        // Scan result
        on('SCAN_RESULT', (result: ScanResult) => {
            setScanResult(result)
            setIsScanning(false)
            setError(null)
        })

        // Selection changed
        on('SELECTION_CHANGED', (payload: { hasSelection: boolean; selectionCount: number }) => {
            setHasSelection(payload.hasSelection)
        })

        // Error
        on('ERROR', (payload: { message: string }) => {
            setError(payload.message)
            setIsScanning(false)
        })
    }, [])

    // ============================================================================
    // Actions
    // ============================================================================

    const handleRescan = useCallback(() => {
        setIsScanning(true)
        setError(null)
        emit('RESCAN_REQUEST', null)
    }, [])

    const handleScanPage = useCallback(() => {
        setIsScanning(true)
        setError(null)
        emit('SCAN_REQUEST', DEFAULT_SCAN_OPTIONS)
    }, [])

    const handleLayerClick = useCallback((layer: TextLayerData) => {
        setSelectedLayerId(layer.id)
        emit('FOCUS_NODE', { nodeId: layer.id })
    }, [])

    const handleFilterChange = useCallback((mode: FilterMode) => {
        setFilterMode(mode)
    }, [])

    const handleSearchChange = useCallback((query: string) => {
        setSearchQuery(query)
    }, [])

    // ============================================================================
    // Filtered & Sorted Layers
    // ============================================================================

    const filteredLayers = useMemo(() => {
        if (!scanResult) return []

        let layers = [...scanResult.textLayers]

        // Apply filter
        switch (filterMode) {
            case 'errors':
                layers = layers.filter(l => l.issueType === 'contrast-fail')
                break
            case 'warnings':
                layers = layers.filter(l =>
                    l.issueType === 'missing-font' || l.issueType === 'no-background'
                )
                break
            case 'passed':
                layers = layers.filter(l => l.issueType === 'none')
                break
        }

        // Apply search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            layers = layers.filter(l =>
                l.name.toLowerCase().includes(query) ||
                l.characters.toLowerCase().includes(query) ||
                l.fontInfo.fontFamily.toLowerCase().includes(query) ||
                l.parentName.toLowerCase().includes(query)
            )
        }

        // Sort by contrast ratio (lowest first for errors)
        layers.sort((a, b) => {
            // Errors first
            if (a.issueType === 'contrast-fail' && b.issueType !== 'contrast-fail') return -1
            if (b.issueType === 'contrast-fail' && a.issueType !== 'contrast-fail') return 1
            // Then warnings
            if ((a.issueType === 'missing-font' || a.issueType === 'no-background') &&
                b.issueType === 'none') return -1
            if ((b.issueType === 'missing-font' || b.issueType === 'no-background') &&
                a.issueType === 'none') return 1
            // Sort by contrast ratio within same category
            return a.contrastRatio - b.contrastRatio
        })

        return layers
    }, [scanResult, filterMode, searchQuery])

    // ============================================================================
    // Render
    // ============================================================================

    return (
        <div className="flex flex-col h-full bg-figma-bg-primary">
            {/* Header */}
            <Header
                onRescan={handleRescan}
                isScanning={isScanning}
                lastScanTime={scanResult?.timestamp}
            />

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Error State */}
                {error && (
                    <div className="mx-4 mt-4 p-3 bg-figma-brand-error/15 border border-figma-brand-error/30 rounded-lg">
                        <div className="flex items-start gap-2">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="text-figma-brand-error flex-shrink-0 mt-0.5"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            <p className="text-xs text-figma-brand-error">{error}</p>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isScanning && <LoadingState />}

                {/* No Scan Result Yet */}
                {!isScanning && !scanResult && (
                    <EmptySelectionState onScanPage={handleScanPage} />
                )}

                {/* Scan Results */}
                {!isScanning && scanResult && (
                    <>
                        {/* Stats Summary */}
                        <div className="p-4">
                            <StatsSummary result={scanResult} />
                        </div>

                        {scanResult.totalScanned === 0 ? (
                            <NoResultsState />
                        ) : (
                            <>
                                {/* Filter Bar */}
                                <FilterBar
                                    filterMode={filterMode}
                                    onFilterChange={handleFilterChange}
                                    totalCount={scanResult.totalScanned}
                                    errorCount={scanResult.errorCount}
                                    warningCount={scanResult.warningCount}
                                    passCount={scanResult.passCount}
                                />

                                {/* Search Bar */}
                                <div className="py-2">
                                    <SearchBar
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        placeholder="Search by name, text, or font..."
                                    />
                                </div>

                                {/* Results Count */}
                                <div className="px-4 py-2 text-2xs text-figma-text-tertiary">
                                    Showing {filteredLayers.length} of {scanResult.totalScanned} layers
                                    {scanResult.scanDuration && (
                                        <span className="ml-2">
                                            • Scanned in {scanResult.scanDuration}ms
                                        </span>
                                    )}
                                </div>

                                {/* Layer List */}
                                <LayerList
                                    layers={filteredLayers}
                                    selectedId={selectedLayerId}
                                    onLayerClick={handleLayerClick}
                                />
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 bg-figma-bg-secondary border-t border-figma-border-subtle">
                <span className="text-2xs text-figma-text-tertiary">
                    WCAG 2.1 AA/AAA Compliant
                </span>
                <a
                    href="https://www.w3.org/WAI/WCAG21/quickref/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-2xs text-figma-brand-primary hover:underline"
                >
                    Learn more about WCAG
                </a>
            </div>
        </div>
    )
}

// ============================================================================
// Render App
// ============================================================================

export default render(App)
