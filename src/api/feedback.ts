
export default async function handler(req: any, res: any) {
  // Configuração de CORS para permitir requisições do próprio domínio
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
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

  try {
    const { type, description, user, view, device } = req.body;
    
    // PREMISSA DE SEGURANÇA: Uso estrito de variáveis de ambiente do servidor (Vercel)
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;

    // Validação de Configuração do Servidor
    if (!token || !owner || !repo) {
      console.error('[Feedback API] Erro: Variáveis de ambiente GITHUB_* não configuradas na Vercel.');
      return res.status(500).json({ 
        error: 'Erro de configuração no servidor. O administrador deve configurar as chaves do GitHub.' 
      });
    }

    // Ajuste de Fuso Horário para Brasil (GMT-3)
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const fullTimeStr = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    const title = `[APP REPORT] ${type === 'bug' ? '🐞 BUG' : '💡 FEATURE'} - ${dateStr}`;
    const body = `
### 📝 Relato do Usuário
**Tipo:** ${type === 'bug' ? 'Erro Encontrado' : 'Sugestão de Melhoria'}
**Reportado por:** @${user || 'Anônimo'}
**Módulo Operacional:** ${view || 'N/A'}
**Plataforma:** ${device || 'N/A'}
**Data/Hora (Brasília):** ${fullTimeStr}

---
### 🔍 Descrição
${description}

---
*Gerado automaticamente via Botequista Pro Diagnostics*
    `;

    // Chamada à API do GitHub
    const githubResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        title, 
        body, 
        labels: [type === 'bug' ? 'bug' : 'enhancement', (device?.toLowerCase().includes('mobile') ? 'mobile' : 'desktop')] 
      })
    });

    if (!githubResponse.ok) {
      const errorText = await githubResponse.text();
      console.error('[Feedback API] GitHub Error:', errorText);
      throw new Error(`GitHub recusou a conexão: ${githubResponse.status}`);
    }

    const data = await githubResponse.json();
    return res.status(200).json({ success: true, url: data.html_url });

  } catch (error: any) {
    console.error('[Feedback API] Exception:', error);
    return res.status(500).json({ error: error.message || 'Erro interno ao processar feedback.' });
  }
}
