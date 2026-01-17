/**
 * WCAG 2.1 Contrast Calculation Utilities
 * Implements the official WCAG relative luminance and contrast ratio algorithms
 */

import type { RGB, RGBA, WCAGLevel } from './types'

// ============================================================================
// Constants
// ============================================================================

/** WCAG 2.1 minimum contrast ratios */
export const WCAG_THRESHOLDS = {
    AA_NORMAL: 4.5,
    AA_LARGE: 3.0,
    AAA_NORMAL: 7.0,
    AAA_LARGE: 4.5
} as const

/** Large text threshold in points (14pt bold or 18pt regular) */
export const LARGE_TEXT_THRESHOLD = {
    BOLD_PT: 14,
    REGULAR_PT: 18,
    BOLD_PX: 18.67, // 14pt * 1.333 (approximate)
    REGULAR_PX: 24 // 18pt * 1.333 (approximate)
} as const

// ============================================================================
// Color Conversion
// ============================================================================

/**
 * Convert a Figma color (0-1 range) to an sRGB value (0-1 range)
 * Figma colors are already in 0-1 range, so we just need to ensure proper bounds
 */
export function clampColor(value: number): number {
    return Math.max(0, Math.min(1, value))
}

/**
 * Convert RGB to linear RGB for luminance calculation
 * This applies the sRGB gamma correction
 */
export function sRGBToLinear(value: number): number {
    const v = clampColor(value)
    return v <= 0.04045
        ? v / 12.92
        : Math.pow((v + 0.055) / 1.055, 2.4)
}

/**
 * Convert hex color string to RGB values (0-1 range)
 */
export function hexToRGB(hex: string): RGB {
    const cleaned = hex.replace('#', '')
    const r = parseInt(cleaned.substring(0, 2), 16) / 255
    const g = parseInt(cleaned.substring(2, 4), 16) / 255
    const b = parseInt(cleaned.substring(4, 6), 16) / 255
    return { r, g, b }
}

/**
 * Convert RGB values (0-1 range) to hex color string
 */
export function rgbToHex(rgb: RGB | RGBA): string {
    const toHex = (v: number) => {
        const hex = Math.round(clampColor(v) * 255).toString(16)
        return hex.length === 1 ? '0' + hex : hex
    }
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
}

// ============================================================================
// Luminance Calculation
// ============================================================================

/**
 * Calculate relative luminance according to WCAG 2.1
 * @see https://www.w3.org/WAI/GL/wiki/Relative_luminance
 * 
 * Formula: L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 * Where R, G, B are the linear RGB values
 */
export function calculateRelativeLuminance(color: RGB | RGBA): number {
    const r = sRGBToLinear(color.r)
    const g = sRGBToLinear(color.g)
    const b = sRGBToLinear(color.b)

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// ============================================================================
// Contrast Ratio Calculation
// ============================================================================

/**
 * Calculate contrast ratio between two colors according to WCAG 2.1
 * @see https://www.w3.org/WAI/GL/wiki/Contrast_ratio
 * 
 * Formula: (L1 + 0.05) / (L2 + 0.05)
 * Where L1 is the lighter luminance and L2 is the darker luminance
 */
export function calculateContrastRatio(
    foreground: RGB | RGBA,
    background: RGB | RGBA
): number {
    const lum1 = calculateRelativeLuminance(foreground)
    const lum2 = calculateRelativeLuminance(background)

    const lighter = Math.max(lum1, lum2)
    const darker = Math.min(lum1, lum2)

    return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Calculate contrast ratio with alpha compositing
 * When the foreground has transparency, we need to composite it over the background
 */
export function calculateContrastRatioWithAlpha(
    foreground: RGBA,
    background: RGBA
): number {
    // If foreground is fully opaque, use simple contrast calculation
    if (foreground.a >= 0.999) {
        return calculateContrastRatio(foreground, background)
    }

    // Composite the foreground over the background
    const composited = blendColors(foreground, background)

    return calculateContrastRatio(composited, background)
}

/**
 * Blend a foreground color with alpha over a background color
 * Uses standard alpha compositing formula
 */
export function blendColors(foreground: RGBA, background: RGBA): RGB {
    const a = foreground.a

    return {
        r: foreground.r * a + background.r * (1 - a),
        g: foreground.g * a + background.g * (1 - a),
        b: foreground.b * a + background.b * (1 - a)
    }
}

// ============================================================================
// WCAG Level Determination
// ============================================================================

/**
 * Determine if text is considered "large" by WCAG standards
 * Large text: 14pt (18.67px) bold or 18pt (24px) regular
 */
export function isLargeText(
    fontSize: number,
    fontWeight: number | string
): boolean {
    const weight = typeof fontWeight === 'string'
        ? parseFontWeight(fontWeight)
        : fontWeight

    const isBold = weight >= 700

    if (isBold) {
        return fontSize >= LARGE_TEXT_THRESHOLD.BOLD_PX
    }

    return fontSize >= LARGE_TEXT_THRESHOLD.REGULAR_PX
}

/**
 * Parse font weight string to numeric value
 */
export function parseFontWeight(weight: string): number {
    const weightMap: Record<string, number> = {
        'thin': 100,
        'hairline': 100,
        'extralight': 200,
        'ultralight': 200,
        'light': 300,
        'normal': 400,
        'regular': 400,
        'medium': 500,
        'semibold': 600,
        'demibold': 600,
        'bold': 700,
        'extrabold': 800,
        'ultrabold': 800,
        'black': 900,
        'heavy': 900
    }

    const normalized = weight.toLowerCase().replace(/[^a-z]/g, '')
    return weightMap[normalized] ?? 400
}

/**
 * Determine WCAG compliance level based on contrast ratio and text size
 */
export function getWCAGLevel(
    contrastRatio: number,
    isLarge: boolean
): WCAGLevel {
    if (isLarge) {
        if (contrastRatio >= WCAG_THRESHOLDS.AAA_LARGE) return 'AAA'
        if (contrastRatio >= WCAG_THRESHOLDS.AA_LARGE) return 'AA-Large'
        return 'FAIL'
    }

    if (contrastRatio >= WCAG_THRESHOLDS.AAA_NORMAL) return 'AAA'
    if (contrastRatio >= WCAG_THRESHOLDS.AA_NORMAL) return 'AA'
    return 'FAIL'
}

/**
 * Check if a contrast ratio passes WCAG AA for the given text size
 */
export function passesWCAG_AA(
    contrastRatio: number,
    isLarge: boolean
): boolean {
    const threshold = isLarge
        ? WCAG_THRESHOLDS.AA_LARGE
        : WCAG_THRESHOLDS.AA_NORMAL

    return contrastRatio >= threshold
}

/**
 * Check if a contrast ratio passes WCAG AAA for the given text size
 */
export function passesWCAG_AAA(
    contrastRatio: number,
    isLarge: boolean
): boolean {
    const threshold = isLarge
        ? WCAG_THRESHOLDS.AAA_LARGE
        : WCAG_THRESHOLDS.AAA_NORMAL

    return contrastRatio >= threshold
}

// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Format contrast ratio for display (e.g., "4.50:1")
 */
export function formatContrastRatio(ratio: number): string {
    return `${ratio.toFixed(2)}:1`
}

/**
 * Get a human-readable color description
 */
export function getColorDescription(color: RGBA): string {
    const hex = rgbToHex(color)
    const alpha = color.a < 1 ? ` (${Math.round(color.a * 100)}% opacity)` : ''
    return `${hex}${alpha}`
}

/**
 * Get suggested minimum contrast for WCAG AA compliance
 */
export function getSuggestedContrast(isLarge: boolean): string {
    return isLarge
        ? `${WCAG_THRESHOLDS.AA_LARGE}:1`
        : `${WCAG_THRESHOLDS.AA_NORMAL}:1`
}
