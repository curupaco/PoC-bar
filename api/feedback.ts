
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { type, description, user } = req.body;
  
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    return res.status(500).json({ error: 'Server misconfiguration: Missing GitHub Env Vars' });
  }

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
      const errorData = await response.json();
      throw new Error(errorData.message || 'Falha ao criar issue no GitHub');
    }

    const data = await response.json();
    return res.status(200).json({ success: true, url: data.html_url });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
