
# 🍺 Botequista - Guia de Deploy Profissional

O Botequista foi construído com arquitetura de nuvem resiliente para garantir que você tenha o controle total do seu bar em qualquer lugar do mundo.

---

## 🚀 1. Deploy Instantâneo (GitHub -> Vercel)

Para que o sistema conecte automaticamente com seu banco de dados sem mexer no código a cada commit, configure as **Environment Variables** na Vercel:

### 1.1 Configuração na Vercel
No painel do projeto (Project Settings -> Environment Variables), adicione estas chaves:

1.  **`FIREBASE_URL`**: O endereço do seu **Banco de Dados**.
    - Ex: `https://meu-bar-default-rtdb.firebaseio.com`
2.  **`FIREBASE_API_KEY`**: A **Chave do Banco de Dados** do seu projeto.
    - Ex: `AIzaSyB123...` (Obrigatória para sincronização na nuvem).

**IMPORTANTE:** O sistema detecta essas chaves automaticamente se configuradas no ambiente. No app (aba Ajustes), o campo **"Chave do Banco de Dados"** refere-se exclusivamente à chave necessária para a persistência dos dados.

---

## 🛠 2. Segurança e Dados

### 2.1 A Senha Master (`REMOVED_FIREBASE_PASSWORD`)
Esta senha é usada para criptografar os dados antes de enviá-los para o Banco de Dados. Ela garante que seus preços e faturamento fiquem protegidos.

### 2.2 Sincronização em Tempo Real
- O app salva automaticamente a cada 3 segundos após qualquer alteração relevante.
- O status da conexão é indicado pela "luz" no topo: 🟢 (Sucesso) ou 🔴 (Erro/Desconectado).

---

## 📊 3. Padrões de Operação

- **Regras de Negócio:** O alerta de pendura (⚠️) é configurado em Ajustes. Ele ajuda a monitorar o risco de crédito global do bar.
- **Peso:** No PDV, informe gramas (ex: 500 para 0,5kg). O cálculo é automático baseado no preço/kg.
- **Fechamento:** O turno deve ser encerrado diariamente para consolidar o caixa físico com o digital.
