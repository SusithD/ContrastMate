/**
 * Main Entry Point for Figma Accessibility Auditor Plugin
 * Handles plugin lifecycle and communication with the UI
 */

import { showUI, emit, on } from '@create-figma-plugin/utilities'
import { scanSelection, focusOnNode } from './scanner'
import type {
    PluginMessage,
    ScanOptions,
    ScanResult,
    SelectionChangedMessage,
    ScanResultMessage,
    ErrorMessage
} from './types'

// ============================================================================
// Constants
// ============================================================================

const UI_WIDTH = 380
const UI_HEIGHT = 600

const DEFAULT_SCAN_OPTIONS: ScanOptions = {
    minContrastRatio: 4.5,
    checkLargeText: true,
    includeHiddenLayers: false
}

// ============================================================================
// Plugin Lifecycle
// ============================================================================

export default function () {
    // Show the plugin UI
    showUI({
        width: UI_WIDTH,
        height: UI_HEIGHT,
        title: 'Accessibility Auditor'
    })

    // Listen for messages from UI
    setupMessageHandlers()

    // Listen for selection changes
    setupSelectionListener()

    // Notify UI that plugin is ready
    emit('PLUGIN_READY', {
        hasSelection: figma.currentPage.selection.length > 0,
        selectionCount: figma.currentPage.selection.length
    })

    // Auto-scan on plugin open if there's a selection
    if (figma.currentPage.selection.length > 0) {
        performScan(DEFAULT_SCAN_OPTIONS)
    }
}

// ============================================================================
// Message Handlers
// ============================================================================

function setupMessageHandlers(): void {
    // Handle scan request from UI
    on('SCAN_REQUEST', async (options: ScanOptions) => {
        await performScan(options)
    })

    // Handle rescan request
    on('RESCAN_REQUEST', async () => {
        await performScan(DEFAULT_SCAN_OPTIONS)
    })

    // Handle focus node request from UI
    on('FOCUS_NODE', async (payload: { nodeId: string }) => {
        const result = await focusOnNode(payload.nodeId)
        if (!result.success) {
            emitError(result.error || 'Could not find or focus on the selected layer.')
        }
    })
}

// ============================================================================
// Selection Listener
// ============================================================================

function setupSelectionListener(): void {
    figma.on('selectionchange', () => {
        const selection = figma.currentPage.selection

        const message: SelectionChangedMessage = {
            type: 'SELECTION_CHANGED',
            payload: {
                hasSelection: selection.length > 0,
                selectionCount: selection.length
            }
        }

        emit('SELECTION_CHANGED', message.payload)
    })
}

// ============================================================================
// Scan Functions
// ============================================================================

async function performScan(options: ScanOptions): Promise<void> {
    try {
        // Notify UI that scanning has started
        emit('SCAN_STARTED', null)

        // Perform the scan
        const result = await scanSelection(options)

        // Send results to UI
        const message: ScanResultMessage = {
            type: 'SCAN_RESULT',
            payload: result
        }

        emit('SCAN_RESULT', message.payload)

        // Log stats to console
        console.log(`[Accessibility Auditor] Scanned ${result.totalScanned} text layers in ${result.scanDuration}ms`)
        console.log(`  - Errors: ${result.errorCount}`)
        console.log(`  - Warnings: ${result.warningCount}`)
        console.log(`  - Passed: ${result.passCount}`)

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        emitError(errorMessage)
        console.error('[Accessibility Auditor] Scan error:', error)
    }
}

// ============================================================================
// Error Handling
// ============================================================================

function emitError(message: string, code?: string): void {
    const errorMessage: ErrorMessage = {
        type: 'ERROR',
        payload: { message, code }
    }

    emit('ERROR', errorMessage.payload)
}
