
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'x-fb-url, x-fb-token, Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { unitId, startDate, endDate } = req.query;
  
  // ISSUE 1: Leitura correta dos headers enviados pelo frontend
  const fbUrl = req.headers['x-fb-url'];
  const fbToken = req.headers['x-fb-token'];

  if (!fbUrl || !unitId || !fbToken) {
     return res.status(400).json({ error: "Missing config or credentials" });
  }

  try {
     // ISSUE 3: Filtragem Server-Side no Firebase (Range Query)
     // Evita baixar o banco inteiro. Baixa apenas o período necessário.
     let queryParams = `auth=${fbToken}`;
     
     if (startDate && endDate) {
        // CORREÇÃO CRÍTICA (ISSUE 1): Timezone Offset
        // O servidor roda em UTC. Se não especificarmos o offset, T23:59:59 vira UTC.
        // No Brasil (GMT-3), 23:59 UTC é 20:59 local. Vendas após 21h sumiam do relatório.
        // Forçamos o offset -03:00 para garantir que o timestamp cubra o dia inteiro no Brasil.
        
        const startTs = new Date(`${startDate}T00:00:00-03:00`).getTime();
        const endTs = new Date(`${endDate}T23:59:59-03:00`).getTime();
        
        queryParams += `&orderBy="timestamp"&startAt=${startTs}&endAt=${endTs}`;
     } else {
        // Fallback de segurança: Se não tiver data, limita aos últimos 500
        queryParams += `&orderBy="$key"&limitToLast=500`;
     }

     const salesUrl = `${fbUrl}/data/units/${unitId}/sales.json?${queryParams}`;
     const response = await fetch(salesUrl);
     
     if (!response.ok) throw new Error(`Firebase Fetch Error: ${response.statusText}`);
     
     const data = await response.json();
     const sales = data ? (Array.isArray(data) ? data : Object.values(data)) : [];

     // Processamento leve dos totais
     const report = {
        totalSales: sales.length,
        totalRevenue: sales.reduce((acc: number, s: any) => acc + (s.total || 0), 0),
        lastUpdated: Date.now(),
        fullHistory: sales // Retorna o array filtrado por data
     };

     return res.status(200).json(report);
  } catch (e: any) {
     return res.status(500).json({ error: e.message });
  }
}
