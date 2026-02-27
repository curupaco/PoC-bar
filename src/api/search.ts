
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'x-fb-url, x-fb-token, Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { unitId, term } = req.query;
  const fbUrl = req.headers['x-fb-url'];
  const fbToken = req.headers['x-fb-token'];

  if (!fbUrl || !unitId || !fbToken || !term) {
     return res.status(400).json({ error: "Parâmetros inválidos" });
  }

  try {
     // Busca Híbrida: Baixa os últimos 2000 registros para busca textual rápida
     // (Limitar a 2000 previne timeout da function enquanto permite busca profunda)
     const queryParams = `auth=${fbToken}&orderBy="$key"&limitToLast=2000`;
     const salesUrl = `${fbUrl}/data/units/${unitId}/sales.json?${queryParams}`;
     
     const response = await fetch(salesUrl);
     if (!response.ok) throw new Error("Erro ao acessar banco de dados");
     
     const data = await response.json();
     const allSales = data ? (Array.isArray(data) ? data : Object.values(data)) : [];

     const lowerTerm = term.toLowerCase();
     
     // Filtragem em Memória (Edge)
     const results = allSales.filter((s: any) => {
        if (s.deleted) return false; // Ignora deletados na busca padrão
        
        const customer = (s.customerName || '').toLowerCase();
        const tab = (s.tabName || '').toLowerCase();
        const id = (s.id || '').toLowerCase();
        
        return customer.includes(lowerTerm) || tab.includes(lowerTerm) || id.includes(lowerTerm);
     });

     // Retorna no máximo 50 resultados para não pesar o frontend
     return res.status(200).json(results.slice(0, 50));
  } catch (e: any) {
     return res.status(500).json({ error: e.message });
  }
}
