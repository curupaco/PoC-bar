// Serverless function para Vercel: /api/rede/sales
export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'Token de autorização obrigatório' });
  }

  const { parentCompanyNumber, subsidiaries, startDate, endDate } = req.query;
  const baseUrl = process.env.VITE_REDE_BASE_URL || process.env.REDE_BASE_URL || 'https://rl7-sandbox-api.useredecloud.com.br';

  try {
    const queryParams = new URLSearchParams({
      parentCompanyNumber: String(parentCompanyNumber || '13381369'),
      subsidiaries: String(subsidiaries || '13381369'),
      startDate: String(startDate || ''),
      endDate: String(endDate || ''),
    });

    const response = await fetch(`${baseUrl}/merchant-statement/v1/sales?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erro ao consultar vendas Rede' });
  }
}

