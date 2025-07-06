
import { NextResponse } from 'next/server';
import { DefaultApi, ApiClient } from 'finnhub';

const apiClient = ApiClient.instance;
const apiKey = apiClient.authentications['api_key'];
apiKey.apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || '';

const finnhubClient = new DefaultApi();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const symbol = searchParams.get('symbol');
  const query = searchParams.get('query');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  try {
    let data;
    switch (type) {
      case 'quote':
        if (!symbol) throw new Error('Symbol is required for quote.');
        data = await new Promise((resolve, reject) => {
          finnhubClient.quote(symbol, (error, res) => {
            if (error) reject(error); else resolve(res);
          });
        });
        break;
      case 'companyProfile':
        if (!symbol) throw new Error('Symbol is required for companyProfile.');
        data = await new Promise((resolve, reject) => {
          finnhubClient.companyProfile2({ symbol }, (error, res) => {
            if (error) reject(error); else resolve(res);
          });
        });
        break;
      case 'companyNews':
        if (!symbol || !from || !to) throw new Error('Symbol, from, and to are required for companyNews.');
        data = await new Promise((resolve, reject) => {
          finnhubClient.companyNews(symbol, from, to, (error, res) => {
            if (error) reject(error); else resolve(res);
          });
        });
        break;
      case 'symbolSearch':
        if (!query) throw new Error('Query is required for symbolSearch.');
        data = await new Promise((resolve, reject) => {
          finnhubClient.symbolSearch(query, (error, res) => {
            if (error) reject(error); else resolve(res);
          });
        });
        break;
      default:
        return NextResponse.json({ error: 'Invalid API type' }, { status: 400 });
    }
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Finnhub API route error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
