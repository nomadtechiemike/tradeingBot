export async function fetchTicker(pair: string) {
  // Bitkub public API simple implementation
  // pair example: BTC_THB -> convert
  const map: Record<string,string> = { 'BTC/THB': 'BTC_THB', 'ETH/THB': 'ETH_THB' };
  const symbol = map[pair] || 'BTC_THB';
  const url = `https://api.bitkub.com/api/exchange/ticker`; // returns all tickers
  const res = await fetch(url);
  const data = await res.json();
  const key = symbol.toLowerCase();
  const item = data[symbol.toLowerCase()];
  if (!item) throw new Error('no data');
  return {
    last: Number(item.last),
    bestBid: Number(item.highestBid),
    bestAsk: Number(item.lowestAsk),
    timestamp: Date.now(),
  };
}
