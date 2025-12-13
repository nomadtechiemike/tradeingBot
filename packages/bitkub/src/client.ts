import crypto from 'crypto';

export interface BitkubTicker {
  last: number;
  lowestAsk: number;
  highestBid: number;
  percentChange: number;
  baseVolume: number;
  quoteVolume: number;
  isFrozen: number;
  high24hr: number;
  low24hr: number;
}

export interface BitkubTickerResponse {
  error: number;
  result: {
    [key: string]: BitkubTicker;
  };
}

/**
 * Public Bitkub API client (no auth required)
 */
export class BitkubPublicClient {
  private baseUrl = 'https://api.bitkub.com/api/market';

  /**
   * Fetch ticker data for a trading pair
   */
  async getTicker(pair: string): Promise<BitkubTicker | null> {
    try {
      const response = await fetch(`${this.baseUrl}/ticker?sym=${pair}`);
      const data = (await response.json()) as BitkubTickerResponse;

      if (data.error !== 0) {
        console.error(`Bitkub API error: ${data.error}`);
        return null;
      }

      return data.result[pair] || null;
    } catch (error) {
      console.error('Failed to fetch Bitkub ticker:', error);
      return null;
    }
  }

  /**
   * Fetch tickers for multiple pairs
   */
  async getMultipleTickers(pairs: string[]): Promise<Map<string, BitkubTicker>> {
    const results = new Map<string, BitkubTicker>();

    const promises = pairs.map((pair) =>
      this.getTicker(pair).then((ticker) => {
        if (ticker) {
          results.set(pair, ticker);
        }
      })
    );

    await Promise.all(promises);
    return results;
  }
}

/**
 * Private Bitkub API client (requires authentication)
 * Scaffold for later live mode implementation
 */
export class BitkubPrivateClient {
  private baseUrl = 'https://api.bitkub.com/api';
  private apiKey: string;
  private apiSecret: string;

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  /**
   * Generate HMAC signature for private API calls
   */
  private generateSignature(payload: string): string {
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Placeholder for placing orders (live mode)
   */
  async placeOrder(
    pair: string,
    side: 'buy' | 'sell',
    amount: number,
    price: number
  ): Promise<any> {
    console.warn('Live trading not enabled. This would place a real order.');
    // Implementation deferred - requires proper API setup
    throw new Error('Live trading disabled in v1');
  }

  /**
   * Placeholder for getting account balance (live mode)
   */
  async getBalance(): Promise<any> {
    console.warn('Live trading not enabled. This would fetch real balance.');
    // Implementation deferred
    throw new Error('Live trading disabled in v1');
  }

  /**
   * Placeholder for cancelling orders (live mode)
   */
  async cancelOrder(orderId: number): Promise<any> {
    console.warn('Live trading not enabled.');
    throw new Error('Live trading disabled in v1');
  }
}

/**
 * Bitkub API factory
 */
export class BitkubClient {
  private publicClient: BitkubPublicClient;
  private privateClient: BitkubPrivateClient | null;

  constructor(apiKey?: string, apiSecret?: string) {
    this.publicClient = new BitkubPublicClient();
    this.privateClient = apiKey && apiSecret ? new BitkubPrivateClient(apiKey, apiSecret) : null;
  }

  getPublic(): BitkubPublicClient {
    return this.publicClient;
  }

  getPrivate(): BitkubPrivateClient | null {
    return this.privateClient;
  }

  isLiveEnabled(): boolean {
    return this.privateClient !== null;
  }
}
