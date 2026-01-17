/**
 * Core types for the Accessibility Auditor Figma Plugin
 */

// ============================================================================
// Color Types
// ============================================================================

export interface RGBA {
    r: number // 0-1
    g: number // 0-1
    b: number // 0-1
    a: number // 0-1
}

export interface RGB {
    r: number // 0-1
    g: number // 0-1
    b: number // 0-1
}

// ============================================================================
// Font Types
// ============================================================================

export interface FontInfo {
    fontFamily: string
    fontSize: number
    fontWeight: number | string
    lineHeight: LineHeightInfo
    letterSpacing: number
    fontStyle: string
    isMissing: boolean // True if font is not installed
}

export interface LineHeightInfo {
    value: number
    unit: 'PIXELS' | 'PERCENT' | 'AUTO'
}

// ============================================================================
// Text Layer Types
// ============================================================================

export interface TextLayerData {
    id: string
    name: string
    characters: string // Actual text content (truncated for display)
    fullCharacters: string // Full text content
    fontInfo: FontInfo
    textColor: RGBA
    backgroundColor: RGBA | null
    contrastRatio: number
    wcagLevel: WCAGLevel
    isLargeText: boolean
    position: {
        x: number
        y: number
    }
    size: {
        width: number
        height: number
    }
    parentName: string
    hasAccessibilityIssue: boolean
    issueType: AccessibilityIssueType
}

// ============================================================================
// WCAG Types
// ============================================================================

export type WCAGLevel = 'AAA' | 'AA' | 'AA-Large' | 'FAIL'

export type AccessibilityIssueType =
    | 'none'
    | 'contrast-fail'
    | 'missing-font'
    | 'no-background'

// ============================================================================
// Scan Result Types
// ============================================================================

export interface ScanResult {
    textLayers: TextLayerData[]
    totalScanned: number
    errorCount: number
    warningCount: number
    passCount: number
    scanDuration: number // milliseconds
    timestamp: number
    timedOut?: boolean // True if scan was terminated due to timeout
}

export interface ScanOptions {
    minContrastRatio: number
    checkLargeText: boolean
    includeHiddenLayers: boolean
    timeout?: number // Maximum scan duration in milliseconds (default: 30000)
    onProgress?: (scanned: number, estimated?: number) => void // Progress callback
}

export interface ScanProgress {
    scanned: number
    estimated?: number
    percentComplete?: number
}

// ============================================================================
// Message Types (Main ↔ UI Communication)
// ============================================================================

export type MessageType =
    | 'SCAN_REQUEST'
    | 'SCAN_RESULT'
    | 'SCAN_PROGRESS'
    | 'SCAN_STARTED'
    | 'FOCUS_NODE'
    | 'SELECTION_CHANGED'
    | 'PLUGIN_READY'
    | 'ERROR'
    | 'RESCAN_REQUEST'

export interface PluginMessage {
    type: MessageType
    payload?: unknown
}

export interface ScanRequestMessage extends PluginMessage {
    type: 'SCAN_REQUEST'
    payload: ScanOptions
}

export interface ScanResultMessage extends PluginMessage {
    type: 'SCAN_RESULT'
    payload: ScanResult
}

export interface ScanProgressMessage extends PluginMessage {
    type: 'SCAN_PROGRESS'
    payload: ScanProgress
}

export interface FocusNodeMessage extends PluginMessage {
    type: 'FOCUS_NODE'
    payload: {
        nodeId: string
    }
}

export interface SelectionChangedMessage extends PluginMessage {
    type: 'SELECTION_CHANGED'
    payload: {
        hasSelection: boolean
        selectionCount: number
    }
}

export interface ErrorMessage extends PluginMessage {
    type: 'ERROR'
    payload: {
        message: string
        code?: string
    }
}

// ============================================================================
// UI State Types
// ============================================================================

export type FilterMode = 'all' | 'errors' | 'warnings' | 'passed'

export type SortMode = 'contrast' | 'name' | 'font-size' | 'layer-order'

export interface UIState {
    isScanning: boolean
    scanResult: ScanResult | null
    filterMode: FilterMode
    sortMode: SortMode
    searchQuery: string
    selectedLayerId: string | null
    hasSelection: boolean
}
