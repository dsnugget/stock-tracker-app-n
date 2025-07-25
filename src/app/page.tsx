
'use client';

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { getQuote, getCompanyProfile, getCompanyNews, symbolSearch } from '../lib/finnhub';
import { formatMarketCap } from '../utils/formatters';

// Default watchlist symbols
const defaultWatchlistSymbols = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'META', 'AVGO', 'GOOGL', 'GOOG', 'TSLA', 'COST', 'WMT', 'PLTR'];

export default function Home() {
    const [watchlist, setWatchlist] = useState<any[]>([]);
    const [selectedStock, setSelectedStock] = useState<any>(null);
    const [newTicker, setNewTicker] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [news, setNews] = useState<any[]>([]);
    const [dividendInfo, setDividendInfo] = useState<string>('N/A'); // Always N/A for free tier
    const [nextEarningsDate, setNextEarningsDate] = useState<string>('N/A'); // Always N/A for free tier
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true); // Correctly declared loading state
    const inputRef = useRef<HTMLInputElement>(null);

    // Function to fetch all necessary data for a symbol
    const fetchStockData = async (symbol: string) => {
        try {
            const quote: any = await getQuote(symbol);
            const profile: any = await getCompanyProfile(symbol);
            // Check if quote data is valid (e.g., not empty or error)
            if (!quote || quote.c === 0) {
                throw new Error(`No data found for ${symbol}`);
            }
            return { ...quote, ...profile, symbol }; // Combine all data
        } catch (error: any) {
            console.error(`Error fetching data for ${symbol}:`, error);
            setError(`Could not fetch data for ${symbol}. Please check the ticker.`);
            return { symbol, name: symbol, c: 'N/A', dp: 0, error: true };
        }
    };

    // Load watchlist from localStorage on initial render
    useEffect(() => {
        const loadWatchlist = async () => {
            setLoading(true); // Set loading to true at the start
            let storedSymbols: string[] = [];
            if (typeof window !== 'undefined') {
                const storedWatchlist = localStorage.getItem('stockWatchlist');
                if (storedWatchlist) {
                    storedSymbols = JSON.parse(storedWatchlist);
                } else {
                    storedSymbols = defaultWatchlistSymbols;
                }
            }

            const fetchedWatchlistData = [];
            for (const symbol of storedSymbols) {
                try {
                    const quote: any = await getQuote(symbol);
                    const profile: any = await getCompanyProfile(symbol);
                    fetchedWatchlistData.push({
                        symbol,
                        price: quote.c,
                        change: quote.dp,
                        active: false,
                        logo: profile.logo
                    });
                } catch (error) {
                    console.error(`Error fetching quote for ${symbol}:`, error);
                    fetchedWatchlistData.push({ symbol, price: 'N/A', change: 0, active: false, logo: '' });
                }
            }

            // Sort the watchlist data alphabetically by symbol
            fetchedWatchlistData.sort((a, b) => a.symbol.localeCompare(b.symbol));
            setWatchlist(fetchedWatchlistData);

            // Select the first stock if available
            if (fetchedWatchlistData.length > 0) {
                const firstStockSymbol = fetchedWatchlistData[0].symbol;
                await handleSelectStock(firstStockSymbol); // Await this to ensure data is loaded before setting loading to false
            } else {
                setLoading(false); // No stocks to load, so set loading to false
            }
        };

        loadWatchlist();
    }, []);

    // Save watchlist to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined' && watchlist.length > 0) {
            const symbolsToStore = watchlist.map(stock => stock.symbol);
            localStorage.setItem('stockWatchlist', JSON.stringify(symbolsToStore));
        }
    }, [watchlist]);

    const handleSelectStock = async (symbol: string) => {
        setError(null); // Clear previous errors
        // Prevent re-fetching if already selected
        if (selectedStock && selectedStock.symbol === symbol) {
            setLoading(false); // If already selected, stop loading
            return;
        }

        setLoading(true); // Set loading to true when selecting a new stock
        const stockDetails = await fetchStockData(symbol);
        if (!stockDetails.error) {
            setSelectedStock(stockDetails);

            // Fetch news for the selected stock
            const today = new Date().toISOString().slice(0, 10);
            const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
            try {
                console.log(`Fetching news for ${symbol} from ${lastWeek} to ${today}`);
                const companyNews: any = await getCompanyNews(symbol, lastWeek, today);
                console.log(`Finnhub News Response for ${symbol}:`, companyNews);
                setNews(companyNews.slice(0, 10)); // Get top 10 news
            } catch (newsError) {
                console.error(`Error fetching news for ${symbol}:`, newsError);
                setNews([]);
            }

            // Dividend and Earnings data are not reliably available on free tier
            setDividendInfo('N/A');
            setNextEarningsDate('N/A');
        }

        // Update the active state in the watchlist
        setWatchlist(prevWatchlist => {
            const updatedList = prevWatchlist.map(stock => ({ 
                ...stock, 
                active: stock.symbol === symbol 
            }));
            return updatedList.sort((a, b) => a.symbol.localeCompare(b.symbol)); // Re-sort after updating active state
        });
        setLoading(false); // Set loading to false after all data is fetched
    };

    const handleAddTicker = async () => {
        setError(null); // Clear previous errors
        const symbol = newTicker.trim().toUpperCase();
        if (!symbol) {
            setError('Please enter a ticker symbol.');
            return;
        }

        if (watchlist.some(stock => stock.symbol === symbol)) {
            setError(`${symbol} is already in your watchlist.`);
            return;
        }

        const stockData = await fetchStockData(symbol);
        if (!stockData.error) {
            setWatchlist(prevWatchlist => {
                const updatedList = [...prevWatchlist, { symbol, price: stockData.c, change: stockData.dp, active: false, logo: stockData.logo }];
                return updatedList.sort((a, b) => a.symbol.localeCompare(b.symbol)); // Sort after adding new stock
            });
            setNewTicker(''); // Clear input
            handleSelectStock(symbol); // Select the newly added stock
            setShowSuggestions(false); // Hide suggestions after adding
        }
    };

    const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewTicker(value);
        if (value.length > 1) {
            try {
                console.log(`Searching for symbol: ${value}`);
                const result: any = await symbolSearch(value);
                console.log(`Symbol Search Response for ${value}:`, result);

                // Filter for common stock types and limit to top 5
                const filteredSuggestions = result.result.filter((item: any) => 
                    ['Common Stock', 'ADR', 'REIT'].includes(item.type)
                ).slice(0, 5);
                console.log(`Filtered Suggestions for ${value}:`, filteredSuggestions);
                setSuggestions(filteredSuggestions);
                setShowSuggestions(true);
            } catch (searchError) {
                console.error('Error fetching symbol suggestions:', searchError);
                setSuggestions([]);
                setShowSuggestions(false);
            }
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSelectSuggestion = (symbol: string) => {
        setNewTicker(symbol);
        setShowSuggestions(false);
        setSuggestions([]); // Clear suggestions
    };

    const handleRemoveTicker = (symbolToRemove: string) => {
        setWatchlist(prevWatchlist => {
            const updatedWatchlist = prevWatchlist.filter(stock => stock.symbol !== symbolToRemove);
            // No need to sort here, as the other updates will trigger a sort
            return updatedWatchlist;
        });

        // If the removed stock was selected, select the first in the new list or clear selection
        if (selectedStock && selectedStock.symbol === symbolToRemove) {
            if (watchlist.length > 1) { // Check if there are other stocks left
                const remainingStocks = watchlist.filter(stock => stock.symbol !== symbolToRemove);
                if (remainingStocks.length > 0) {
                    handleSelectStock(remainingStocks[0].symbol);
                } else {
                    setSelectedStock(null);
                    setNews([]);
                }
            } else {
                setSelectedStock(null);
                setNews([]); // Clear news if no stock is selected
            }
        }
    };

    const handleRefreshSelectedStockPrice = async () => {
        if (selectedStock && selectedStock.symbol) {
            setError(null); // Clear previous errors
            setLoading(true); // Show loading spinner during refresh
            try {
                const quote: any = await getQuote(selectedStock.symbol);
                console.log(`Refresh Quote Response for ${selectedStock.symbol}:`, quote); // Log the response
                if (typeof quote.c === 'number') {
                    setSelectedStock(prev => ({
                        ...prev,
                        c: quote.c,
                        dp: quote.dp,
                        h: quote.h, // Update high
                        l: quote.l, // Update low
                        o: quote.o, // Update open
                        pc: quote.pc // Update previous close
                    }));
                } else {
                    setError(`Failed to get updated price for ${selectedStock.symbol}.`);
                }
            } catch (refreshError) {
                console.error(`Error refreshing price for ${selectedStock.symbol}:`, refreshError);
                setError(`Failed to refresh price for ${selectedStock.symbol}.`);
            } finally {
                setLoading(false); // Hide loading spinner after refresh attempt
            }
        }
    };

    return (
        <>
            <Head>
                <title>Advanced Stock Tracker</title>
            </Head>
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h2 className="h5">My Watchlist</h2>
                    <div className="input-group mt-3 position-relative">
                        <input 
                            type="text" 
                            className="form-control form-control-sm ticker-input-blue-border" 
                            placeholder="Add Ticker..." 
                            value={newTicker}
                            onChange={handleInputChange}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleAddTicker();
                                }
                            }}
                            ref={inputRef}
                        />
                        <button className="btn btn-sm btn-outline-secondary" type="button" onClick={handleAddTicker}>+</button>
                        {showSuggestions && suggestions.length > 0 && (
                            <ul className="list-group position-absolute w-100" style={{ zIndex: 1000, top: '100%' }}>
                                {suggestions.map((sugg) => (
                                    <li 
                                        key={sugg.symbol} 
                                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                                        onClick={() => handleSelectSuggestion(sugg.symbol)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <span>{sugg.symbol}</span>
                                        <small className="text-muted">{sugg.description}</small>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    {error && <div className="text-danger mt-2" style={{ fontSize: '0.8rem' }}>{error}</div>}
                </div>
                <ul className="watchlist">
                    {watchlist.map(stock => (
                        <li key={stock.symbol} className={`watchlist-item ${stock.active ? 'active' : ''}`} onClick={() => handleSelectStock(stock.symbol)}>
                            <div className="d-flex align-items-center flex-grow-1">
                                {stock.logo && <img src={stock.logo} alt={`${stock.symbol} Logo`} className="company-logo-small" />}
                                <span className="symbol me-2">{stock.symbol}</span>
                                <span className="price-details me-2">
                                    {typeof stock.price === 'number' ? `$${stock.price.toFixed(2)}` : 'N/A'}
                                </span>
                                {typeof stock.change === 'number' && (
                                    <span className={stock.change > 0 ? 'text-success' : 'text-danger'}>{stock.change.toFixed(2)}%</span>
                                )}
                            </div>
                            <button 
                                className="btn btn-sm btn-outline-danger ms-2"
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent selecting the stock when clicking delete
                                    handleRemoveTicker(stock.symbol);
                                }}
                            >
                                &times;
                            </button>
                        </li>
                    ))}
                </ul>
            </aside>

            <main className="main-content">
                {loading ? (
                    <div className="loading-spinner">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2">Loading stock data...</p>
                    </div>
                ) : (
                    selectedStock ? (
                        !selectedStock.error ? (
                            <>
                                <div className="company-header d-flex align-items-center">
                                    {selectedStock.logo && <img src={selectedStock.logo} alt={`${selectedStock.symbol} Logo`} className="company-logo-large" />}
                                    <h1 className="display-5 mb-0 me-3">{selectedStock.name} ({selectedStock.ticker})</h1>
                                    {typeof selectedStock.c === 'number' && (
                                        <span className="current-price-header bg-black px-2 py-1 rounded me-2 text-white">
                                            ${selectedStock.c.toFixed(2)}
                                        </span>
                                    )}
                                    {typeof selectedStock.dp === 'number' && (
                                        <span className={`${selectedStock.dp > 0 ? 'text-success' : 'text-danger'} bg-black px-2 py-1 rounded fw-bold`}>
                                            {selectedStock.dp.toFixed(2)}%
                                        </span>
                                    )}
                                    <button 
                                        className="btn btn-sm btn-outline-secondary ms-3 refresh-btn"
                                        onClick={handleRefreshSelectedStockPrice}
                                        title="Refresh current stock price"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-clockwise" viewBox="0 0 16 16">
                                            <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
                                            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
                                        </svg>
                                    </button>
                                </div>
                                <div className="company-details">
                                    <h3 className="mb-4">Key Details</h3>
                                    <div className="row">
                                        <div className="col-6 col-md-3">
                                            <div className="detail-item-card">
                                                <p className="text-muted mb-1">Market Cap</p>
                                                <h5>{formatMarketCap(selectedStock.marketCapitalization)}</h5>
                                            </div>
                                        </div>
                                        <div className="col-6 col-md-3">
                                            <div className="detail-item-card">
                                                <p className="text-muted mb-1">Industry</p>
                                                <h5>{selectedStock.finnhubIndustry}</h5>
                                            </div>
                                        </div>
                                        <div className="col-6 col-md-3">
                                            <div className="detail-item-card">
                                                <p className="text-muted mb-1">High</p>
                                                <h5>{typeof selectedStock.h === 'number' ? `$${selectedStock.h.toFixed(2)}` : 'N/A'}</h5>
                                            </div>
                                        </div>
                                        <div className="col-6 col-md-3">
                                            <div className="detail-item-card">
                                                <p className="text-muted mb-1">Low</p>
                                                <h5>{typeof selectedStock.l === 'number' ? `$${selectedStock.l.toFixed(2)}` : 'N/A'}</h5>
                                            </div>
                                        </div>
                                        <div className="col-6 col-md-3">
                                            <div className="detail-item-card">
                                                <p className="text-muted mb-1">Open</p>
                                                <h5>{typeof selectedStock.o === 'number' ? `$${selectedStock.o.toFixed(2)}` : 'N/A'}</h5>
                                            </div>
                                        </div>
                                        <div className="col-6 col-md-3">
                                            <div className="detail-item-card">
                                                <p className="text-muted mb-1">Previous Close</p>
                                                <h5>{typeof selectedStock.pc === 'number' ? `$${selectedStock.pc.toFixed(2)}` : 'N/A'}</h5>
                                            </div>
                                        </div>
                                        <div className="col-6 col-md-3">
                                            <div className="detail-item-card">
                                                <p className="text-muted mb-1">Country</p>
                                                <h5>{selectedStock.country}</h5>
                                            </div>
                                        </div>
                                        <div className="col-6 col-md-3">
                                            <div className="detail-item-card">
                                                <p className="text-muted mb-1">Exchange</p>
                                                <h5>{selectedStock.exchange === 'NASDAQ NMS - GLOBAL MARKET' ? 'NASDAQ' : selectedStock.exchange}</h5>
                                            </div>
                                        </div>
                                        <div className="col-6 col-md-3">
                                            <div className="detail-item-card">
                                                <p className="text-muted mb-1">IPO Date</p>
                                                <h5>{selectedStock.ipo?.slice(0, 10)}</h5>
                                            </div>
                                        </div>
                                        <div className="col-6 col-md-3">
                                            <div className="detail-item-card">
                                                <p className="text-muted mb-1">Currency</p>
                                                <h5>{selectedStock.currency}</h5>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* News Section */}
                                {news.length > 0 && (
                                    <div className="news-section mt-4">
                                        <h3 className="mb-4">Latest News</h3>
                                        {news.map((article, index) => (
                                            article.image && ( // Conditional rendering based on image availability
                                                <div key={index} className="news-item d-flex align-items-center">
                                                    {article.image && <img src={article.image} alt="News Thumbnail" className="news-thumbnail me-3" />}
                                                    <div>
                                                        <h6><a href={article.url} target="_blank" rel="noopener noreferrer">{article.headline}</a></h6>
                                                        <small>{new Date(article.datetime * 1000).toLocaleString()} {new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' }).formatToParts(new Date(article.datetime * 1000)).find(part => part.type === 'timeZoneName')?.value} - {article.source}</small>
                                                    </div>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center text-danger">Failed to load data for {selectedStock.symbol}.</div>
                        )
                    ) : (
                        <div className="text-center text-muted">Select a stock to view details.</div>
                    )
                )}
            </main>
        </>
    );
}
