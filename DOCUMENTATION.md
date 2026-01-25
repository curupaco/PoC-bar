
# 🍺 Botequista Pro - Documentação Técnica e Operacional
**Versão:** 4.2.5 (Stable)  
**Desenvolvedor:** Senior Frontend Engineer  
**Stack:** React 19, TypeScript, Firebase Realtime DB, TailwindCSS, Vercel Edge Functions.

---

## 1. Visão Geral
O **Botequista** é uma plataforma de gestão de PDV (Ponto de Venda) especializada para bares e restaurantes que operam com alta rotatividade e necessidade de controle de fiados ("Penduras"). O sistema é focado em performance, operando como um PWA (Progressive Web App) capaz de funcionar offline e sincronizar dados em tempo real quando há conexão.

---

## 2. Arquitetura de Dados

### A. Estrutura Multi-Tenant (Franquias)
O sistema utiliza um modelo de isolamento por unidade ("Bar").
- **Dados Globais:** `users/` e `units/`. Armazenam a base de colaboradores e a lista de unidades físicas.
- **Dados Locais:** Localizados em `data/units/{unit_id}/`. Contêm produtos, vendas, comandas abertas, turnos e logs de tesouraria específicos daquela unidade.

### B. Motor de Sincronização (`useSync.ts`)
Utiliza uma estratégia de *Polling* otimizado (10s) e *Hash Comparison* para evitar re-renders desnecessários.
- **Persistência Local:** O sistema mantém um "Mirror" no `localStorage` para permitir o carregamento instantâneo e funcionamento em áreas de sombra de rede.

---

## 3. Módulos do Sistema

### 🛒 Ponto de Venda (POS)
- **Mesas Abertas:** Gerenciamento dinâmico de comandas com nomes personalizados.
- **Venda Rápida:** Lançamento direto sem necessidade de abrir mesa.
- **Venda por Peso (KG):** Aciona teclado numérico de gramas, calculando o preço proporcional instantaneamente.
- **Adicionais (Upsell):** Menus de modificadores (ex: gelo, limão, borda) que podem ser obrigatórios ou opcionais por categoria.
- **Split Payment:** Permite pagar uma única conta com múltiplos métodos (ex: R$ 50 no PIX e R$ 20 no Dinheiro).

### 📊 Relatórios e Inteligência
- **Fechamento de Turno:** Gera um "Cupom de Auditoria" em PNG que pode ser compartilhado via WhatsApp.
- **Curva ABC de Produtos:** Ranking de faturamento por item.
- **Gestão de Penduras:** Carteira ativa de devedores com histórico de débitos e quitações vinculadas ao nome do cliente.
- **Mapa de Calor Operacional:** Gráfico de volume de vendas por hora para ajuste de escala de funcionários.

### 👥 Gestão de Equipe (RBAC)
Sistema de permissões baseado em funções (*Role-Based Access Control*):
- **admin:** Acesso total irrestrito.
- **Módulos:** Permissões granulares para ver Dashboard, PDV, Histórico, etc.
- **Ações Críticas:** Permissões específicas para anular vendas, excluir produtos ou gerenciar backups.

---

## 4. Segurança e Auditoria

### A. Criptografia (`cryptoService.ts`)
- **Senhas:** Armazenadas utilizando hash SHA-256.
- **Dados Sensíveis:** Suporte nativo para criptografia AES-256 em backups locais e remotos.

### B. Auditoria de Caixa
Cada movimentação entre o cofre e a gaveta de troco é registrada com:
- ID da transação.
- Timestamp de Brasília (GMT-3).
- Usuário responsável.
- Origem e Destino do valor.

---

## 5. Instalação e PWA

### Configuração Android/iOS
O sistema está configurado para ser instalado como um aplicativo nativo.
- **Ícone Transparente:** Utiliza ícones de fluência com canal alfa para integração estética no launcher do celular.
- **Service Worker:** Cache agressivo de assets estáticos (Tailwind, Fontes, Ícones) para carregamento rápido.

### Resolução de Problemas (404 NOT FOUND)
Se o app exibir erro 404 ao abrir:
1. Verifique se o `manifest.json` aponta para a `start_url: "/"`.
2. Limpe o cache do Chrome no Android e reinstale via menu "Instalar Aplicativo".

---

## 6. API de Feedback (GitHub Integration)
Localizada em `api/feedback.ts` (Vercel Function).
- **Timezone Fix:** As issues são criadas no GitHub com o horário de Brasília forçado (`America/Sao_Paulo`), resolvendo o problema de fuso horário do servidor UTC.
- **Variáveis Necessárias:**
  - `GITHUB_TOKEN`: PAT Classic com permissão de `repo`.
  - `GITHUB_OWNER`: Nome do usuário no GitHub.
  - `GITHUB_REPO`: Nome do repositório de destino.

---

## 7. Guia de Manutenção

### Reset de Fábrica
Apenas disponível para usuários com permissão `full_reset`. Apaga todos os dados do nó da unidade no Firebase. **Ação irreversível.**

### Backup Externo
Recomenda-se exportar o arquivo JSON semanalmente através da aba **Ajustes > Baixar Backup Completo**. Este arquivo pode ser restaurado em qualquer nova instalação do Botequista.

---
*Documentação atualizada em: Março de 2024*
