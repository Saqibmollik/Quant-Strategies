// utils/chartHelpers.ts

/**
 * Formats a number into a string, representing millions with an 'M' suffix.
 * e.g., 1,500,000 becomes "$1.5M"
 * @param value The number to format.
 * @returns A formatted string.
 */
export const formatMillions = (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '$0';
    if (Math.abs(num) < 1_000_000) {
        return `$${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }
    const millions = num / 1_000_000;
    return `$${millions.toFixed(1)}M`;
};
