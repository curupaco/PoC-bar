import { rateLimit } from './rateLimiter';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'x-fb-url, x-fb-token, Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Rate Limiting
  const ipRaw = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket.remoteAddress || '127.0.0.1';
  const ip = Array.isArray(ipRaw) ? ipRaw[0] : (typeof ipRaw === 'string' ? ipRaw.split(',')[0].trim() : '127.0.0.1');
  const { isLimited, remaining, reset } = rateLimit(ip, 30, 60 * 1000); // 30 req/min
  
  res.setHeader('X-RateLimit-Limit', '30');
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(reset / 1000)));

  if (isLimited) {
     return res.status(429).json({ error: "Excesso de requisições. Por favor, tente novamente mais tarde." });
  }
  
  const { unitId } = req.query;
  const fbUrl = req.headers['x-fb-url'];
  const fbToken = req.headers['x-fb-token'];

  if (!fbUrl || !unitId || !fbToken) {
     return res.status(400).json({ error: "Missing config" });
  }

  try {
     // Busca as vendas que possuem método 'Pendura' ou são quitações
     // Para performance, baixamos os últimos 2000 registros para calcular o saldo de devedores ativos
     const salesUrl = `${fbUrl}/data/units/${unitId}/sales.json?auth=${fbToken}&orderBy="$key"&limitToLast=2000`;
     const response = await fetch(salesUrl);
     const data = await response.json();
     const sales = data ? (Array.isArray(data) ? data : Object.values(data)) : [];

     const debts: Record<string, number> = {};
     sales.forEach((s: any) => {
        if (s.deleted || !s.customerName) return;
        const name = s.customerName.trim().toUpperCase();
        let amt = 0;
        if (s.payments) {
          const pPart = s.payments.find((p: any) => p.method === 'Pendura');
          if(pPart) amt = pPart.amount;
        } else if (s.paymentMethod === 'Pendura') {
          amt = s.total;
        }
        if (amt > 0) debts[name] = (debts[name] || 0) + amt;
        if (s.items?.some((i: any) => i.productId === 'quitacao')) {
          debts[name] = (debts[name] || 0) - s.total;
        }
     });

     const activeDebtors = Object.entries(debts)
        .filter(([_, balance]) => balance > 0.1)
        .map(([name]) => name);

     return res.status(200).json({ debtors: activeDebtors });
  } catch (e: any) {
     return res.status(500).json({ error: e.message });
  }
}
