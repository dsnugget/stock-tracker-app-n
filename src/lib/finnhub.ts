// This file now acts as a client for our Next.js API route

const FINNHUB_API_BASE_URL = '/api/finnhub';

const fetchData = async (type: string, params: Record<string, any>) => {
    const url = new URL(FINNHUB_API_BASE_URL, window.location.origin);
    url.searchParams.append('type', type);
    for (const key in params) {
        if (params[key]) {
            url.searchParams.append(key, params[key]);
        }
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch data from API route');
    }
    return response.json();
};

export const getQuote = (symbol: string) => {
    return fetchData('quote', { symbol });
};

export const getCompanyProfile = (symbol: string) => {
    return fetchData('companyProfile', { symbol });
};

export const getCompanyNews = (symbol: string, from: string, to: string) => {
    return fetchData('companyNews', { symbol, from, to });
};

export const symbolSearch = (query: string) => {
    return fetchData('symbolSearch', { query });
};