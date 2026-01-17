/**
 * Unit tests for contrast calculation functions
 */

import { describe, it, expect } from 'vitest'
import {
    calculateContrastRatio,
    getWCAGLevel,
    passesWCAG_AA,
    passesWCAG_AAA,
    isLargeText,
    calculateRelativeLuminance,
    formatContrastRatio
} from './contrast'
import type { RGB } from './types'

describe('calculateRelativeLuminance', () => {
    it('should calculate correct luminance for black', () => {
        const black: RGB = { r: 0, g: 0, b: 0 }
        expect(calculateRelativeLuminance(black)).toBe(0)
    })

    it('should calculate correct luminance for white', () => {
        const white: RGB = { r: 1, g: 1, b: 1 }
        expect(calculateRelativeLuminance(white)).toBe(1)
    })

    it('should calculate correct luminance for mid-gray', () => {
        const gray: RGB = { r: 0.5, g: 0.5, b: 0.5 }
        const luminance = calculateRelativeLuminance(gray)
        // Mid-gray should have luminance around 0.2126
        expect(luminance).toBeCloseTo(0.2126, 2)
    })

    it('should handle pure red', () => {
        const red: RGB = { r: 1, g: 0, b: 0 }
        const luminance = calculateRelativeLuminance(red)
        expect(luminance).toBeCloseTo(0.2126, 4)
    })

    it('should handle pure green', () => {
        const green: RGB = { r: 0, g: 1, b: 0 }
        const luminance = calculateRelativeLuminance(green)
        expect(luminance).toBeCloseTo(0.7152, 4)
    })

    it('should handle pure blue', () => {
        const blue: RGB = { r: 0, g: 0, b: 1 }
        const luminance = calculateRelativeLuminance(blue)
        expect(luminance).toBeCloseTo(0.0722, 4)
    })
})

describe('calculateContrastRatio', () => {
    it('should return 21:1 for black on white', () => {
        const black: RGB = { r: 0, g: 0, b: 0 }
        const white: RGB = { r: 1, g: 1, b: 1 }
        expect(calculateContrastRatio(black, white)).toBeCloseTo(21, 1)
    })

    it('should return 21:1 for white on black', () => {
        const black: RGB = { r: 0, g: 0, b: 0 }
        const white: RGB = { r: 1, g: 1, b: 1 }
        expect(calculateContrastRatio(white, black)).toBeCloseTo(21, 1)
    })

    it('should return 1:1 for same colors', () => {
        const gray: RGB = { r: 0.5, g: 0.5, b: 0.5 }
        expect(calculateContrastRatio(gray, gray)).toBe(1)
    })

    it('should calculate correct ratio for typical text colors', () => {
        // Dark gray (#333333) on white
        const darkGray: RGB = { r: 0.2, g: 0.2, b: 0.2 }
        const white: RGB = { r: 1, g: 1, b: 1 }
        const ratio = calculateContrastRatio(darkGray, white)
        // Should be around 12.6:1
        expect(ratio).toBeGreaterThan(12)
        expect(ratio).toBeLessThan(13)
    })

    it('should handle edge case with very similar colors', () => {
        const color1: RGB = { r: 0.5, g: 0.5, b: 0.5 }
        const color2: RGB = { r: 0.51, g: 0.51, b: 0.51 }
        const ratio = calculateContrastRatio(color1, color2)
        expect(ratio).toBeGreaterThan(1)
        expect(ratio).toBeLessThan(1.1)
    })
})

describe('isLargeText', () => {
    it('should return true for 24px regular text', () => {
        expect(isLargeText(24, 400)).toBe(true)
    })

    it('should return true for 18.67px bold text', () => {
        expect(isLargeText(18.67, 700)).toBe(true)
    })

    it('should return false for 12px regular text', () => {
        expect(isLargeText(12, 400)).toBe(false)
    })

    it('should return false for 16px regular text', () => {
        expect(isLargeText(16, 400)).toBe(false)
    })

    it('should handle edge case at threshold for regular text', () => {
        expect(isLargeText(24, 400)).toBe(true)
        expect(isLargeText(23.99, 400)).toBe(false)
    })

    it('should handle bold text at threshold', () => {
        expect(isLargeText(18.67, 700)).toBe(true)
        expect(isLargeText(18.66, 700)).toBe(false)
    })

    it('should handle non-standard font weights', () => {
        expect(isLargeText(18.67, 600)).toBe(false) // semi-bold, not >= 700
        expect(isLargeText(18.67, 500)).toBe(false) // medium
        expect(isLargeText(18.67, 800)).toBe(true) // extra-bold >= 700
    })
})

describe('passesWCAG_AA', () => {
    it('should pass for 4.5:1 normal text', () => {
        expect(passesWCAG_AA(4.5, false)).toBe(true)
    })

    it('should fail for 4.4:1 normal text', () => {
        expect(passesWCAG_AA(4.4, false)).toBe(false)
    })

    it('should pass for 3:1 large text', () => {
        expect(passesWCAG_AA(3.0, true)).toBe(true)
    })

    it('should fail for 2.9:1 large text', () => {
        expect(passesWCAG_AA(2.9, true)).toBe(false)
    })

    it('should handle exact threshold values', () => {
        expect(passesWCAG_AA(4.5, false)).toBe(true)
        expect(passesWCAG_AA(3.0, true)).toBe(true)
    })
})

describe('passesWCAG_AAA', () => {
    it('should pass for 7:1 normal text', () => {
        expect(passesWCAG_AAA(7.0, false)).toBe(true)
    })

    it('should fail for 6.9:1 normal text', () => {
        expect(passesWCAG_AAA(6.9, false)).toBe(false)
    })

    it('should pass for 4.5:1 large text', () => {
        expect(passesWCAG_AAA(4.5, true)).toBe(true)
    })

    it('should fail for 4.4:1 large text', () => {
        expect(passesWCAG_AAA(4.4, true)).toBe(false)
    })

    it('should handle exact threshold values', () => {
        expect(passesWCAG_AAA(7.0, false)).toBe(true)
        expect(passesWCAG_AAA(4.5, true)).toBe(true)
    })
})

describe('getWCAGLevel', () => {
    it('should return AAA for high contrast normal text', () => {
        expect(getWCAGLevel(10.0, false)).toBe('AAA')
    })

    it('should return AA for medium contrast normal text', () => {
        expect(getWCAGLevel(5.0, false)).toBe('AA')
    })

    it('should return FAIL for low contrast normal text', () => {
        expect(getWCAGLevel(3.0, false)).toBe('FAIL')
    })

    it('should return AAA for high contrast large text', () => {
        expect(getWCAGLevel(6.0, true)).toBe('AAA')
    })

    it('should return AA-Large for medium contrast large text', () => {
        expect(getWCAGLevel(3.5, true)).toBe('AA-Large')
    })

    it('should return FAIL for low contrast large text', () => {
        expect(getWCAGLevel(2.0, true)).toBe('FAIL')
    })

    it('should handle edge cases at thresholds', () => {
        expect(getWCAGLevel(7.0, false)).toBe('AAA')
        expect(getWCAGLevel(4.5, false)).toBe('AA')
        expect(getWCAGLevel(3.0, true)).toBe('AA-Large')
    })
})

describe('formatContrastRatio', () => {
    it('should format whole numbers correctly', () => {
        expect(formatContrastRatio(21)).toBe('21.00:1')
    })

    it('should format decimals with 2 places', () => {
        expect(formatContrastRatio(4.5)).toBe('4.50:1')
    })

    it('should round to 2 decimal places', () => {
        expect(formatContrastRatio(4.567)).toBe('4.57:1')
    })

    it('should handle small numbers', () => {
        expect(formatContrastRatio(1.05)).toBe('1.05:1')
    })

    it('should handle minimum contrast', () => {
        expect(formatContrastRatio(1.0)).toBe('1.00:1')
    })

    it('should handle maximum contrast', () => {
        expect(formatContrastRatio(21.0)).toBe('21.00:1')
    })
})
