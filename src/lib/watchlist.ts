'use client';

import { supabase } from './supabase';

// Fetch the user's watchlist symbols. If none exists, optionally initialize with defaults
export async function getOrCreateUserWatchlist(userId: string) {
  // First try to read
  let { data, error } = await supabase
    .from('user_watchlists')
    .select('symbols')
    .eq('user_id', userId)
    .maybeSingle();

  // If not present, create idempotently using upsert with ignoreDuplicates
  if (!data) {
    const { error: upsertError } = await supabase
      .from('user_watchlists')
      .upsert({ user_id: userId, symbols: [] }, { onConflict: 'user_id', ignoreDuplicates: true });
    if (upsertError) throw upsertError;
    // Re-read to return a consistent shape
    ({ data, error } = await supabase
      .from('user_watchlists')
      .select('symbols')
      .eq('user_id', userId)
      .maybeSingle());
  }

  if (error) throw error;
  return (data?.symbols as string[]) || [];
}

export async function addSymbolToWatchlist(userId: string, symbol: string) {
  const current = await getOrCreateUserWatchlist(userId);
  if (current.includes(symbol)) return current;
  const updated = [...current, symbol];
  const { error } = await supabase
    .from('user_watchlists')
    .upsert({ user_id: userId, symbols: updated }, { onConflict: 'user_id' });
  if (error) throw error;
  return updated;
}

export async function removeSymbolFromWatchlist(userId: string, symbol: string) {
  const current = await getOrCreateUserWatchlist(userId);
  const updated = current.filter((s) => s !== symbol);
  const { error } = await supabase
    .from('user_watchlists')
    .upsert({ user_id: userId, symbols: updated }, { onConflict: 'user_id' });
  if (error) throw error;
  return updated;
}


