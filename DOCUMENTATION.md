
# 🍺 Botequista - Guia de Deploy Profissional

O Botequista foi construído com arquitetura de nuvem resiliente para garantir que você tenha o controle total do seu bar em qualquer lugar do mundo.

---

## 🚀 1. Deploy Instantâneo (GitHub -> Vercel)

Para que o sistema conecte automaticamente com seu banco de dados e inteligência artificial sem mexer no código a cada commit, configure as **Environment Variables** na Vercel:

### 1.1 Configuração na Vercel
No painel do projeto (Project Settings -> Environment Variables), adicione estas chaves:

1.  **`FIREBASE_URL`**: O endereço do seu Firebase Realtime Database.
    - Ex: `https://meu-bar-default-rtdb.firebaseio.com`
2.  **`FIREBASE_API_KEY`**: A chave de API Web do seu projeto Firebase.
    - Ex: `AIzaSyB123...` (Obrigatória para sincronização automática na nuvem).
3.  **`API_KEY`**: Sua chave da Google Gemini API para os insights de IA.

**IMPORTANTE:** O sistema está programado para detectar essas chaves automaticamente. Se elas estiverem configuradas na Vercel, o app abrirá sincronizado em todos os aparelhos sem nenhuma ação adicional.

---

## 🛠 2. Segurança e Dados

### 2.1 A Senha Master (`Tc@00216587`)
Esta senha é usada para criptografar os dados antes de enviá-los para o Firebase. Ela garante que mesmo se alguém acessar seu banco, não conseguirá ler seus preços e faturamento sem a chave.

### 2.2 Sincronização em Tempo Real
- O app salva automaticamente a cada 3 segundos após qualquer alteração relevante.
- O status da conexão é indicado pela "luz" no cabeçalho: 🟢 (Sucesso) ou 🔴 (Erro/Desconectado).

---

## 📊 3. Padrões de Operação

- **Regras de Negócio:** O alerta de pendura (⚠️) é global. Configure-o em Ajustes para monitorar o risco de crédito do bar.
- **Peso:** No PDV, o sistema espera gramas (números inteiros). O cálculo de preço é automático baseado no preço/kg cadastrado. Use o ícone **✎** à esquerda do peso para correções rápidas.
- **Fechamento:** O turno deve ser fechado pelo gerente para consolidar as vendas em dinheiro na tesouraria.
