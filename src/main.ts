/**
 * Main Entry Point for Figma ContrastMate Plugin
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
    ScanProgressMessage,
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
        title: 'ContrastMate'
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
        try {
            await performScan(options)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to perform scan'
            emitError(errorMessage)
            console.error('[ContrastMate] SCAN_REQUEST error:', error)
        }
    })

    // Handle rescan request
    on('RESCAN_REQUEST', async () => {
        try {
            await performScan(DEFAULT_SCAN_OPTIONS)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to rescan'
            emitError(errorMessage)
            console.error('[ContrastMate] RESCAN_REQUEST error:', error)
        }
    })

    // Handle focus node request from UI
    on('FOCUS_NODE', async (payload: { nodeId: string }) => {
        try {
            // Validate input
            if (!payload?.nodeId || typeof payload.nodeId !== 'string') {
                emitError('Invalid node ID provided')
                return
            }

            const result = await focusOnNode(payload.nodeId)
            if (!result.success) {
                emitError(result.error || 'Could not find or focus on the selected layer.')
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to focus on node'
            emitError(errorMessage)
            console.error('[ContrastMate] FOCUS_NODE error:', error)
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

        // Add progress callback to options
        const optionsWithProgress: ScanOptions = {
            ...options,
            onProgress: (scanned: number) => {
                emit('SCAN_PROGRESS', { scanned })
            }
        }

        // Perform the scan with progress reporting
        const result = await scanSelection(optionsWithProgress)

        // Send results to UI
        const message: ScanResultMessage = {
            type: 'SCAN_RESULT',
            payload: result
        }

        emit('SCAN_RESULT', message.payload)

        // Log stats to console
        const timeoutWarning = result.timedOut ? ' (TIMEOUT)' : ''
        console.log(`[ContrastMate] Scanned ${result.totalScanned} text layers in ${result.scanDuration}ms${timeoutWarning}`)
        console.log(`  - Errors: ${result.errorCount}`)
        console.log(`  - Warnings: ${result.warningCount}`)
        console.log(`  - Passed: ${result.passCount}`)

        if (result.timedOut) {
            console.warn('[ContrastMate] Scan was terminated due to timeout. Results may be incomplete.')
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        emitError(errorMessage)
        console.error('[ContrastMate] Scan error:', error)
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
