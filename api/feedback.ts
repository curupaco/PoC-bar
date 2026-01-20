
export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { type, description, user } = req.body;
  
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    console.error('Missing Env Vars:', { hasToken: !!token, hasOwner: !!owner, hasRepo: !!repo });
    return res.status(500).json({ error: 'Erro de Configuração do Servidor (Variáveis Vercel Ausentes)' });
  }

  console.log(`[Feedback API] Iniciando envio de issue para ${owner}/${repo} (User: ${user})`);

  const title = `[APP REPORT] ${type === 'bug' ? '🐞 BUG' : '💡 FEATURE'} - ${new Date().toLocaleDateString('pt-BR')}`;
  const body = `
### Relato do Usuário
**Tipo:** ${type === 'bug' ? 'Erro Encontrado' : 'Sugestão de Melhoria'}
**Reportado por:** ${user || 'Anônimo'}
**Data:** ${new Date().toLocaleString('pt-BR')}

---
### Descrição
${description}

---
*Gerado automaticamente via Botequista App*
  `;

  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, body, labels: [type === 'bug' ? 'bug' : 'enhancement'] })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('GitHub API Error:', errorData);
      throw new Error(errorData.message || 'Recusa do GitHub');
    }

    const data = await response.json();
    console.log(`[Feedback API] Sucesso! Issue criada: ${data.html_url}`);
    return res.status(200).json({ success: true, url: data.html_url });
  } catch (error: any) {
    console.error('Function Error:', error);
    return res.status(500).json({ error: error.message || 'Erro Interno no Processamento' });
  }
}
