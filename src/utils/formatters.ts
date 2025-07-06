export const formatMarketCap = (value: number | string): string => {
    const numInMillions = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numInMillions)) {
        return 'N/A';
    }

    // Convert from millions to actual USD value
    const num = numInMillions * 1_000_000;

    if (num >= 1_000_000_000_000) {
        return (num / 1_000_000_000_000).toFixed(2) + 'T';
    } else if (num >= 1_000_000_000) {
        return (num / 1_000_000_000).toFixed(2) + 'B';
    } else if (num >= 1_000_000) {
        return (num / 1_000_000).toFixed(2) + 'M';
    } else {
        return num.toFixed(2);
    }
};