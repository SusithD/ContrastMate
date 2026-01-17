/**
 * Scanning Engine for Figma Accessibility Auditor
 * Recursively scans layers to extract text information and calculate contrast ratios
 */

import type {
    TextLayerData,
    FontInfo,
    LineHeightInfo,
    RGBA,
    ScanResult,
    ScanOptions,
    AccessibilityIssueType
} from './types'

import {
    calculateContrastRatioWithAlpha,
    isLargeText,
    getWCAGLevel,
    passesWCAG_AA,
    parseFontWeight
} from './contrast'

// ============================================================================
// Default Colors
// ============================================================================

const DEFAULT_BACKGROUND: RGBA = { r: 1, g: 1, b: 1, a: 1 } // White
const FIGMA_CANVAS_COLOR: RGBA = { r: 0.898, g: 0.898, b: 0.898, a: 1 } // Figma default canvas

// ============================================================================
// Font Extraction
// ============================================================================

/**
 * Extract font information from a TextNode
 * Uses figma.getStyleById to identify fonts from libraries if applicable
 */
async function extractFontInfo(node: TextNode): Promise<FontInfo> {
    let fontFamily = 'Unknown'
    let fontWeight: number | string = 400
    let fontStyle = 'normal'
    let isMissing = false
    let fontSize = 12
    let lineHeight: LineHeightInfo = { value: 0, unit: 'AUTO' }
    let letterSpacing = 0

    // 1. Check if the node uses a Text Style (potentially from a library)
    if (node.textStyleId && node.textStyleId !== figma.mixed) {
        try {
            const style = figma.getStyleById(node.textStyleId as string) as TextStyle
            if (style) {
                fontFamily = style.fontName.family
                fontStyle = style.fontName.style
                fontSize = style.fontSize
                lineHeight = {
                    value: style.lineHeight.unit === 'AUTO' ? 0 : style.lineHeight.value,
                    unit: style.lineHeight.unit
                }
                fontWeight = parseFontWeightFromStyle(style.fontName.style)

                // Check if this specific font is available locally
                isMissing = await checkFontMissing(style.fontName)
            }
        } catch (e) {
            console.warn('Failed to fetch text style:', e)
        }
    }

    // 2. Handle specific font properties (overrides or if no style is applied)
    if (fontFamily === 'Unknown') {
        const fontName = node.fontName
        if (fontName !== figma.mixed) {
            fontFamily = fontName.family
            fontStyle = fontName.style
            fontWeight = parseFontWeightFromStyle(fontName.style)
            isMissing = await checkFontMissing(fontName)
        } else {
            // Handle mixed fonts - get the first one for the preview
            const firstFont = node.getRangeFontName(0, 1) as FontName
            if (firstFont) {
                fontFamily = firstFont.family
                fontStyle = firstFont.style
                fontWeight = parseFontWeightFromStyle(firstFont.style)
                isMissing = await checkFontMissing(firstFont)
            }
        }
    }

    // Font Size
    if (node.fontSize !== figma.mixed) {
        fontSize = node.fontSize
    } else {
        fontSize = node.getRangeFontSize(0, 1) as number
    }

    // Line Height
    if (node.lineHeight !== figma.mixed) {
        lineHeight = {
            value: node.lineHeight.unit === 'AUTO' ? 0 : node.lineHeight.value,
            unit: node.lineHeight.unit
        }
    }

    // Letter Spacing
    if (node.letterSpacing !== figma.mixed) {
        const ls = node.letterSpacing
        if (ls.unit === 'PIXELS') {
            letterSpacing = ls.value
        } else if (ls.unit === 'PERCENT') {
            letterSpacing = (ls.value / 100) * fontSize
        }
    }

    return {
        fontFamily,
        fontSize,
        fontWeight,
        lineHeight,
        letterSpacing,
        fontStyle,
        isMissing
    }
}



/**
 * Parse font weight from Figma font style string
 */
function parseFontWeightFromStyle(style: string): number {
    const normalized = style.toLowerCase()

    if (normalized.includes('black') || normalized.includes('heavy')) return 900
    if (normalized.includes('extrabold') || normalized.includes('ultrabold')) return 800
    if (normalized.includes('bold')) return 700
    if (normalized.includes('semibold') || normalized.includes('demibold')) return 600
    if (normalized.includes('medium')) return 500
    if (normalized.includes('regular') || normalized.includes('normal')) return 400
    if (normalized.includes('light')) return 300
    if (normalized.includes('extralight') || normalized.includes('ultralight')) return 200
    if (normalized.includes('thin') || normalized.includes('hairline')) return 100

    return 400 // Default to regular
}



// ============================================================================
// Color Extraction
// ============================================================================

/**
 * Extract text fill color from a TextNode
 */
function extractTextColor(node: TextNode): RGBA {
    const fills = node.fills

    if (fills === figma.mixed || !Array.isArray(fills) || fills.length === 0) {
        return { r: 0, g: 0, b: 0, a: 1 } // Default to black
    }

    // Get the first visible solid fill
    for (const fill of fills) {
        if (fill.visible !== false && fill.type === 'SOLID') {
            const color = fill.color
            const opacity = fill.opacity ?? 1
            return {
                r: color.r,
                g: color.g,
                b: color.b,
                a: opacity
            }
        }
    }

    return { r: 0, g: 0, b: 0, a: 1 } // Default to black
}

/**
 * Find the background color for a text node
 * Checks parent frames and sibling layers for backgrounds
 */
function findBackgroundColor(node: TextNode): RGBA | null {
    // Start with the parent and work our way up
    let current: BaseNode | null = node.parent

    while (current && current.type !== 'PAGE' && current.type !== 'DOCUMENT') {
        // Check if current node has a solid fill
        if ('fills' in current) {
            const fills = current.fills
            if (fills && fills !== figma.mixed && Array.isArray(fills)) {
                for (const fill of fills) {
                    if (fill.visible !== false && fill.type === 'SOLID') {
                        const color = fill.color
                        const opacity = fill.opacity ?? 1
                        return {
                            r: color.r,
                            g: color.g,
                            b: color.b,
                            a: opacity
                        }
                    }
                }
            }
        }

        // Check for sibling layers behind this node
        const siblingBg = findSiblingBackground(node, current)
        if (siblingBg) return siblingBg

        current = current.parent
    }

    // If we reach the page, check page background
    if (current && current.type === 'PAGE') {
        const page = current as PageNode
        if (page.backgrounds && page.backgrounds.length > 0) {
            const bg = page.backgrounds[0]
            if (bg.type === 'SOLID' && bg.visible !== false) {
                return {
                    r: bg.color.r,
                    g: bg.color.g,
                    b: bg.color.b,
                    a: bg.opacity ?? 1
                }
            }
        }
    }

    return null // No background found
}

/**
 * Find a sibling layer that could serve as background
 */
function findSiblingBackground(textNode: TextNode, parent: BaseNode): RGBA | null {
    if (!('children' in parent)) return null

    const parentWithChildren = parent as ChildrenMixin & BaseNode
    const children = parentWithChildren.children
    const textIndex = children.indexOf(textNode as SceneNode)

    if (textIndex <= 0) return null

    // Check layers below this text node (lower index = below)
    for (let i = textIndex - 1; i >= 0; i--) {
        const sibling = children[i]

        // Check if sibling overlaps with text node
        if (!checkOverlap(textNode, sibling as SceneNode)) continue

        // Check if sibling has a solid fill
        if ('fills' in sibling) {
            const fills = sibling.fills
            if (fills && fills !== figma.mixed && Array.isArray(fills)) {
                for (const fill of fills) {
                    if (fill.visible !== false && fill.type === 'SOLID') {
                        const color = fill.color
                        const opacity = fill.opacity ?? 1
                        return {
                            r: color.r,
                            g: color.g,
                            b: color.b,
                            a: opacity
                        }
                    }
                }
            }
        }
    }

    return null
}

/**
 * Check if two nodes overlap
 */
function checkOverlap(node1: SceneNode, node2: SceneNode): boolean {
    try {
        const bounds1 = node1.absoluteBoundingBox
        const bounds2 = node2.absoluteBoundingBox

        if (!bounds1 || !bounds2) return false

        // Check for intersection
        return !(
            bounds1.x + bounds1.width <= bounds2.x ||
            bounds2.x + bounds2.width <= bounds1.x ||
            bounds1.y + bounds1.height <= bounds2.y ||
            bounds2.y + bounds2.height <= bounds1.y
        )
    } catch {
        return false
    }
}

// ============================================================================
// Text Content Extraction
// ============================================================================

/**
 * Truncate text for display
 */
function truncateText(text: string, maxLength = 50): string {
    const cleaned = text.replace(/\s+/g, ' ').trim()
    if (cleaned.length <= maxLength) return cleaned
    return cleaned.substring(0, maxLength - 3) + '...'
}

/**
 * Get parent name for display
 */
function getParentName(node: BaseNode): string {
    if (!node.parent) return 'Root'
    if (node.parent.type === 'PAGE') return 'Page'
    if ('name' in node.parent) return node.parent.name
    return 'Unknown'
}

// ============================================================================
// Font Missing Detection
// ============================================================================

/**
 * Check if a font is missing (not installed)
 */
async function checkFontMissing(fontName: FontName): Promise<boolean> {
    try {
        await figma.loadFontAsync(fontName)
        return false // Font loaded successfully, not missing
    } catch {
        return true // Font failed to load, is missing
    }
}

// ============================================================================
// Main Scanning Engine
// ============================================================================

/**
 * Recursively scan a node tree for text layers
 */
async function scanNodeRecursive(
    node: SceneNode,
    textLayers: TextLayerData[],
    options: ScanOptions
): Promise<void> {
    // Skip hidden layers if option is set
    if (!options.includeHiddenLayers && 'visible' in node && !node.visible) {
        return
    }

    // Process text nodes
    if (node.type === 'TEXT') {
        const textData = await processTextNode(node, options)
        if (textData) {
            textLayers.push(textData)
        }
    }

    // Recursively process children
    if ('children' in node) {
        const children = (node as ChildrenMixin).children
        for (const child of children) {
            await scanNodeRecursive(child as SceneNode, textLayers, options)
        }
    }
}

/**
 * Process a single text node and extract all relevant data
 */
async function processTextNode(
    node: TextNode,
    options: ScanOptions
): Promise<TextLayerData | null> {
    // Skip empty text nodes
    if (!node.characters.trim()) {
        return null
    }

    // Extract font info (awaiting the async result)
    const fontInfo = await extractFontInfo(node)

    // Extract colors
    const textColor = extractTextColor(node)
    const backgroundColor = findBackgroundColor(node)

    // Calculate contrast
    let contrastRatio = 0
    let issueType: AccessibilityIssueType = 'none'

    if (backgroundColor) {
        contrastRatio = calculateContrastRatioWithAlpha(textColor, backgroundColor)
    } else {
        // No background found - use default and flag as warning
        contrastRatio = calculateContrastRatioWithAlpha(textColor, DEFAULT_BACKGROUND)
        issueType = 'no-background'
    }

    // Determine if large text
    const largeText = isLargeText(fontInfo.fontSize, fontInfo.fontWeight)

    // Determine WCAG level
    const wcagLevel = getWCAGLevel(contrastRatio, largeText)

    // Check for accessibility issues
    if (fontInfo.isMissing) {
        issueType = 'missing-font'
    } else if (!passesWCAG_AA(contrastRatio, largeText)) {
        issueType = 'contrast-fail'
    }

    // Get position and size
    const bounds = node.absoluteBoundingBox

    return {
        id: node.id,
        name: node.name,
        characters: truncateText(node.characters),
        fullCharacters: node.characters,
        fontInfo,
        textColor,
        backgroundColor,
        contrastRatio,
        wcagLevel,
        isLargeText: largeText,
        position: {
            x: bounds?.x ?? 0,
            y: bounds?.y ?? 0
        },
        size: {
            width: bounds?.width ?? 0,
            height: bounds?.height ?? 0
        },
        parentName: getParentName(node),
        hasAccessibilityIssue: issueType !== 'none',
        issueType
    }
}

/**
 * Main scan function - scans the current selection with timeout protection
 */
export async function scanSelection(options: ScanOptions): Promise<ScanResult> {
    const startTime = Date.now()
    const timeout = options.timeout ?? 30000 // Default 30 second timeout
    const textLayers: TextLayerData[] = []
    let timedOut = false
    let lastProgressReport = 0
    const progressInterval = 100 // Report progress every 100ms

    // Helper to check if we've exceeded timeout
    const checkTimeout = (): boolean => {
        const elapsed = Date.now() - startTime
        if (elapsed > timeout) {
            console.warn(`[Accessibility Auditor] Scan timeout after ${elapsed}ms (limit: ${timeout}ms)`)
            timedOut = true
            return true
        }
        return false
    }

    // Helper to report progress
    const reportProgress = (force = false): void => {
        const now = Date.now()
        if (force || now - lastProgressReport > progressInterval) {
            options.onProgress?.(textLayers.length)
            lastProgressReport = now
        }
    }

    const selection = figma.currentPage.selection

    if (selection.length === 0) {
        // No selection - scan entire page
        for (const child of figma.currentPage.children) {
            if (checkTimeout()) break
            await scanNodeRecursive(child, textLayers, options)
            reportProgress()
        }
    } else {
        // Scan selected nodes
        for (const node of selection) {
            if (checkTimeout()) break
            await scanNodeRecursive(node, textLayers, options)
            reportProgress()
        }
    }

    // Final progress report
    reportProgress(true)

    // Calculate statistics
    const errorCount = textLayers.filter(t => t.issueType === 'contrast-fail').length
    const warningCount = textLayers.filter(t =>
        t.issueType === 'missing-font' || t.issueType === 'no-background'
    ).length
    const passCount = textLayers.filter(t => t.issueType === 'none').length

    return {
        textLayers,
        totalScanned: textLayers.length,
        errorCount,
        warningCount,
        passCount,
        scanDuration: Date.now() - startTime,
        timestamp: Date.now(),
        timedOut
    }
}

/**
 * Focus on a specific node in the Figma canvas
 * Returns success status and optional error message
 */
export async function focusOnNode(nodeId: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Use async version to support cross-page access
        const node = await figma.getNodeByIdAsync(nodeId)

        if (!node) {
            console.warn(`Node with ID ${nodeId} not found. It may have been deleted.`)
            return {
                success: false,
                error: 'Layer was not found. It may have been deleted or moved.'
            }
        }

        // Check if node is a SceneNode (can be selected and has bounds)
        if (!('absoluteBoundingBox' in node)) {
            console.warn(`Node ${node.name} (${nodeId}) cannot be focused (not a scene node)`)
            return {
                success: false,
                error: `Cannot focus on "${node.name}". This type of layer cannot be selected.`
            }
        }

        // Check if node has valid bounds
        if (!node.absoluteBoundingBox) {
            console.warn(`Node ${node.name} (${nodeId}) has no position information`)
            return {
                success: false,
                error: `Cannot focus on "${node.name}". Layer has no position information.`
            }
        }

        // Find the page containing this node
        let parent: BaseNode | null = node.parent
        while (parent && parent.type !== 'PAGE') {
            parent = parent.parent
        }

        // Switch to the correct page if needed
        if (parent && parent.type === 'PAGE' && figma.currentPage.id !== parent.id) {
            figma.currentPage = parent as PageNode
        }

        // Focus and select the node
        figma.viewport.scrollAndZoomIntoView([node as SceneNode])
        figma.currentPage.selection = [node as SceneNode]
        return { success: true }
    } catch (error) {
        console.error(`Error focusing on node ${nodeId}:`, error)
        return {
            success: false,
            error: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
    }
}
