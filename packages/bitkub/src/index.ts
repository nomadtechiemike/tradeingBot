import fetch from 'node-fetch';

export async function fetchTicker(pair: string) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/72a915f4-fce9-4fec-86e0-24d9a811a6e8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'packages/bitkub/src/index.ts:3',message:'fetchTicker called',data:{pair},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
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
  const result = {
    last: Number(item.last),
    bestBid: Number(item.highestBid),
    bestAsk: Number(item.lowestAsk),
    timestamp: Date.now(),
  };
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/72a915f4-fce9-4fec-86e0-24d9a811a6e8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'packages/bitkub/src/index.ts:18',message:'fetchTicker success',data:{pair,last:result.last},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  return result;
}
