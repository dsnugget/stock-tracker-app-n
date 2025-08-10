# Supabase Setup Instructions

## Environment Variables Needed

Create a `.env.local` file in your project root with the following variables:

```bash
# Finnhub API (existing)
NEXT_PUBLIC_FINNHUB_API_KEY=your_finnhub_api_key_here

# Supabase Configuration (new)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Supabase Project Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new project
4. Choose a database password (save it!)

### 2. Get API Keys
1. In your Supabase dashboard, go to Settings > API
2. Copy the "Project URL" to `NEXT_PUBLIC_SUPABASE_URL`
3. Copy the "anon public" key to `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Database Setup
Run these SQL commands in the Supabase SQL editor:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create portfolios table
CREATE TABLE public.portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create portfolio_stocks table
CREATE TABLE public.portfolio_stocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  quantity DECIMAL(15,6) NOT NULL,
  purchase_price DECIMAL(15,2) NOT NULL,
  purchase_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_watchlists table
CREATE TABLE public.user_watchlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  symbols TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.user_watchlists (
  user_id UUID TEXT PRIMARY KEY,
  symbols TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies
-- Portfolios: Users can only access their own portfolios
CREATE POLICY "Users can view own portfolios" ON public.portfolios
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolios" ON public.portfolios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios" ON public.portfolios
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolios" ON public.portfolios
  FOR DELETE USING (auth.uid() = user_id);

-- Portfolio Stocks: Users can only access stocks in their portfolios
CREATE POLICY "Users can view own portfolio stocks" ON public.portfolio_stocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.portfolios 
      WHERE portfolios.id = portfolio_stocks.portfolio_id 
      AND portfolios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert into own portfolios" ON public.portfolio_stocks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.portfolios 
      WHERE portfolios.id = portfolio_stocks.portfolio_id 
      AND portfolios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own portfolio stocks" ON public.portfolio_stocks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.portfolios 
      WHERE portfolios.id = portfolio_stocks.portfolio_id 
      AND portfolios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own portfolio stocks" ON public.portfolio_stocks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.portfolios 
      WHERE portfolios.id = portfolio_stocks.portfolio_id 
      AND portfolios.user_id = auth.uid()
    )
  );

-- User Watchlists: Users can only access their own watchlists
CREATE POLICY "Users can view own watchlists" ON public.user_watchlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlists" ON public.user_watchlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlists" ON public.user_watchlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlists" ON public.user_watchlists
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_watchlists ENABLE ROW LEVEL SECURITY;

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON public.portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_stocks_updated_at
  BEFORE UPDATE ON public.portfolio_stocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_watchlists_updated_at
  BEFORE UPDATE ON public.user_watchlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4. Email Configuration
1. In Supabase dashboard, go to Authentication > Settings
2. Configure email templates (optional)
3. For production, configure SMTP settings

## Testing Authentication

After setup, you can:
1. Visit `/auth/signup` to create a new account
2. Check your email for confirmation
3. Visit `/auth/login` to sign in
4. The header will show user menu when logged in

## Next Steps

Once authentication is working, we can:
1. Create portfolio management pages
2. Migrate existing watchlist to user-specific data
3. Add portfolio CRUD operations
4. Implement portfolio performance tracking
