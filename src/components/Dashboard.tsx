'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getQuote, getCompanyProfile, getCompanyNews, symbolSearch } from '../lib/finnhub';
import { formatMarketCap } from '../utils/formatters';
import { getOrCreateUserWatchlist, addSymbolToWatchlist, removeSymbolFromWatchlist } from '../lib/watchlist';

const defaultWatchlistSymbols = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'META', 'AVGO', 'GOOGL', 'GOOG', 'TSLA', 'COST', 'WMT', 'PLTR'];

export default function Dashboard() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [newTicker, setNewTicker] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [news, setNews] = useState<any[]>([]);
  const [dividendInfo, setDividendInfo] = useState<string>('N/A');
  const [nextEarningsDate, setNextEarningsDate] = useState<string>('N/A');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchStockData = async (symbol: string) => {
    try {
      const quote: any = await getQuote(symbol);
      const profile: any = await getCompanyProfile(symbol);
      if (!quote || quote.c === 0) {
        throw new Error(`No data found for ${symbol}`);
      }
      return { ...quote, ...profile, symbol };
    } catch (error: any) {
      console.error(`Error fetching data for ${symbol}:`, error);
      setError(`Could not fetch data for ${symbol}. Please check the ticker.`);
      return { symbol, name: symbol, c: 'N/A', dp: 0, error: true };
    }
  };

  useEffect(() => {
    if (!user) return;
    const loadWatchlist = async () => {
      setLoading(true);
      let storedSymbols: string[] = await getOrCreateUserWatchlist(user.id);
      const fetchedWatchlistData: any[] = [];
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
      setWatchlist(fetchedWatchlistData.sort((a,b)=>a.symbol.localeCompare(b.symbol)));
      if (fetchedWatchlistData.length > 0) {
        await handleSelectStock(fetchedWatchlistData[0].symbol);
      } else {
        setLoading(false);
      }
    };
    loadWatchlist();
  }, [user]);

  const handleSelectStock = async (symbol: string) => {
    setError(null);
    if (selectedStock && selectedStock.symbol === symbol) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const stockDetails = await fetchStockData(symbol);
    if (!stockDetails.error) {
      setSelectedStock(stockDetails);
      const today = new Date().toISOString().slice(0, 10);
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      try {
        const companyNews: any = await getCompanyNews(symbol, lastWeek, today);
        setNews(companyNews.slice(0, 10));
      } catch (newsError) {
        console.error(`Error fetching news for ${symbol}:`, newsError);
        setNews([]);
      }
      setDividendInfo('N/A');
      setNextEarningsDate('N/A');
    }
    setWatchlist(prev => prev.map(s => ({...s, active: s.symbol === symbol})).sort((a,b)=>a.symbol.localeCompare(b.symbol)));
    setLoading(false);
  };

  const handleAddTicker = async () => {
    setError(null);
    const symbol = newTicker.trim().toUpperCase();
    if (!symbol) { setError('Please enter a ticker symbol.'); return; }
    if (watchlist.some(s => s.symbol === symbol)) { setError(`${symbol} is already in your watchlist.`); return; }
    const stockData = await fetchStockData(symbol);
    if (!stockData.error) {
      setWatchlist(prev => {
        const updated = [...prev, { symbol, price: stockData.c, change: stockData.dp, active: false, logo: stockData.logo }].sort((a,b)=>a.symbol.localeCompare(b.symbol));
        return updated;
      });
      if (user) { try { await addSymbolToWatchlist(user.id, symbol); } catch(e) { console.error(e); } }
      setNewTicker('');
      handleSelectStock(symbol);
      setShowSuggestions(false);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewTicker(value);
    if (value.length > 1) {
      try {
        const result: any = await symbolSearch(value);
        const filteredSuggestions = result.result.filter((item: any) => ['Common Stock', 'ADR', 'REIT'].includes(item.type)).slice(0, 5);
        setSuggestions(filteredSuggestions);
        setShowSuggestions(true);
      } catch {
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
    setSuggestions([]);
  };

  const handleRemoveTicker = (symbolToRemove: string) => {
    setWatchlist(prev => prev.filter(s => s.symbol !== symbolToRemove).sort((a,b)=>a.symbol.localeCompare(b.symbol)));
    if (user) { removeSymbolFromWatchlist(user.id, symbolToRemove).catch(console.error); }
    if (selectedStock && selectedStock.symbol === symbolToRemove) {
      const remaining = watchlist.filter(s => s.symbol !== symbolToRemove);
      if (remaining.length > 0) { handleSelectStock(remaining[0].symbol); }
      else { setSelectedStock(null); setNews([]); }
    }
  };

  const handleRefreshSelectedStockPrice = async () => {
    if (selectedStock && selectedStock.symbol) {
      setError(null);
      setLoading(true);
      try {
        const quote: any = await getQuote(selectedStock.symbol);
        if (typeof quote.c === 'number') {
          setSelectedStock(prev => ({ ...prev, c: quote.c, dp: quote.dp, h: quote.h, l: quote.l, o: quote.o, pc: quote.pc }));
        } else { setError(`Failed to get updated price for ${selectedStock.symbol}.`); }
      } catch {
        setError(`Failed to refresh price for ${selectedStock.symbol}.`);
      } finally { setLoading(false); }
    }
  };

  return (
    <>
      <button className="mobile-sidebar-toggle d-md-none" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="input-group mt-3 position-relative">
            <input type="text" className="form-control form-control-sm ticker-input-blue-border" placeholder="Add Ticker Sybmol" value={newTicker} onChange={handleInputChange} onKeyPress={(e) => { if (e.key === 'Enter') { handleAddTicker(); } }} ref={inputRef} />
            <button className="btn btn-sm btn-outline-secondary" type="button" onClick={handleAddTicker}>+</button>
            {showSuggestions && suggestions.length > 0 && (
              <ul className="list-group position-absolute w-100" style={{ zIndex: 1000, top: '100%' }}>
                {suggestions.map((sugg) => (
                  <li key={sugg.symbol} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center" onClick={() => handleSelectSuggestion(sugg.symbol)} style={{ cursor: 'pointer' }}>
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
                <span className="price-details me-2">{typeof stock.price === 'number' ? `$${stock.price.toFixed(2)}` : 'N/A'}</span>
                {typeof stock.change === 'number' && (<span className={stock.change > 0 ? 'text-success' : 'text-danger'}>{stock.change.toFixed(2)}%</span>)}
              </div>
              <button className="btn btn-sm btn-outline-danger ms-2" onClick={(e) => { e.stopPropagation(); handleRemoveTicker(stock.symbol); }}>&times;</button>
            </li>
          ))}
        </ul>
      </aside>

      <main className="main-content">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
            <p className="mt-2">Loading stock data...</p>
          </div>
        ) : (
          selectedStock ? (
            !selectedStock.error ? (
              <>
                <div className="company-header d-flex align-items-center">
                  {selectedStock.logo && <img src={selectedStock.logo} alt={`${selectedStock.symbol} Logo`} className="company-logo-large" />}
                  <h1 className="display-5 mb-0 me-3">{selectedStock.name} ({selectedStock.ticker})</h1>
                  {typeof selectedStock.c === 'number' && (<span className="current-price-header bg-black px-2 py-1 rounded me-2 text-white">${selectedStock.c.toFixed(2)}</span>)}
                  {typeof selectedStock.dp === 'number' && (<span className={`${selectedStock.dp > 0 ? 'text-success' : 'text-danger'} bg-black px-2 py-1 rounded fw-bold`}>{selectedStock.dp.toFixed(2)}%</span>)}
                  <button className="btn btn-sm btn-outline-secondary ms-3 refresh-btn" onClick={handleRefreshSelectedStockPrice} title="Refresh current stock price">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-clockwise" viewBox="0 0 16 16"><path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/></svg>
                  </button>
                </div>
                <div className="company-details">
                  <h3 className="mb-4">Key Details</h3>
                  <div className="row">
                    <div className="col-6 col-md-3"><div className="detail-item-card"><p className="text-muted mb-1">Market Cap</p><h5>{formatMarketCap(selectedStock.marketCapitalization)}</h5></div></div>
                    <div className="col-6 col-md-3"><div className="detail-item-card"><p className="text-muted mb-1">Industry</p><h5>{selectedStock.finnhubIndustry}</h5></div></div>
                    <div className="col-6 col-md-3"><div className="detail-item-card"><p className="text-muted mb-1">High</p><h5>{typeof selectedStock.h === 'number' ? `$${selectedStock.h.toFixed(2)}` : 'N/A'}</h5></div></div>
                    <div className="col-6 col-md-3"><div className="detail-item-card"><p className="text-muted mb-1">Low</p><h5>{typeof selectedStock.l === 'number' ? `$${selectedStock.l.toFixed(2)}` : 'N/A'}</h5></div></div>
                    <div className="col-6 col-md-3"><div className="detail-item-card"><p className="text-muted mb-1">Open</p><h5>{typeof selectedStock.o === 'number' ? `$${selectedStock.o.toFixed(2)}` : 'N/A'}</h5></div></div>
                    <div className="col-6 col-md-3"><div className="detail-item-card"><p className="text-muted mb-1">Previous Close</p><h5>{typeof selectedStock.pc === 'number' ? `$${selectedStock.pc.toFixed(2)}` : 'N/A'}</h5></div></div>
                    <div className="col-6 col-md-3"><div className="detail-item-card"><p className="text-muted mb-1">Country</p><h5>{selectedStock.country}</h5></div></div>
                    <div className="col-6 col-md-3"><div className="detail-item-card"><p className="text-muted mb-1">Exchange</p><h5>{selectedStock.exchange === 'NASDAQ NMS - GLOBAL MARKET' ? 'NASDAQ' : selectedStock.exchange}</h5></div></div>
                  </div>
                </div>
                {news.length > 0 && (
                  <div className="news-section mt-4">
                    <h3 className="mb-3">Latest News</h3>
                    {news.map((article, index) => (
                      <div key={index} className="news-item">
                        <h6><a href={article.url} target="_blank" rel="noopener noreferrer">{article.headline}</a></h6>
                        <small>{new Date(article.datetime * 1000).toLocaleString()} {new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' }).formatToParts(new Date(article.datetime * 1000)).find(part => part.type === 'timeZoneName')?.value}{' — Source: '} {article.source}</small>
                      </div>
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


