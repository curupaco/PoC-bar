// Serverless function para Vercel: /api/rede/token
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientId = process.env.VITE_REDE_CLIENT_ID || process.env.REDE_CLIENT_ID || 'be7a7df7-a255-4139-be1e-5d1405b7c7b8';
  const clientSecret = process.env.VITE_REDE_CLIENT_SECRET || process.env.REDE_CLIENT_SECRET || 'N3Myj35aeS';
  const baseUrl = process.env.VITE_REDE_BASE_URL || process.env.REDE_BASE_URL || 'https://rl7-sandbox-api.useredecloud.com.br';

  try {
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch(`${baseUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erro ao gerar token Rede' });
  }
}

