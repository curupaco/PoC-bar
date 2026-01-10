
# 🍺 Botequista - Documentação Oficial

Este sistema foi projetado para ser "Zero Config" após o primeiro deploy.

---

## 🚀 1. Guia de Deploy (GitHub -> Vercel)

Para que o sistema funcione perfeitamente na Vercel integrando com seu Banco de Dados, siga estes passos:

### 1.1 Variáveis de Ambiente
No painel da Vercel (Project Settings -> Environment Variables), adicione:
1.  `FIREBASE_URL`: O link do seu Firebase Realtime Database (ex: `https://meu-projeto.firebaseio.com`).
2.  `API_KEY`: Sua chave de API do Google Gemini (para os insights de IA).

### 1.2 Por que isso é importante?
Ao adicionar essas chaves na Vercel, o sistema as injetará automaticamente no código. Você não precisará alterar nada nos arquivos `.ts` ou `.tsx`. O próximo commit no GitHub atualizará o sistema mantendo a conexão segura.

---

## 🛠 2. Documentação Técnica

### 2.1 Padrão Monetário Brasileiro
O sistema utiliza rigorosamente a vírgula (`,`) para entradas e o formato `R$ 0,00` para exibição.
- Internamente, as entradas são convertidas de `string` com vírgula para `number` (float) para cálculos.
- A exibição utiliza `Intl.NumberFormat('pt-BR')`.

### 2.2 Divisão de Conta (Lógica de Resiliência)
- O sistema gerencia pagamentos parciais através de um estado temporário (`currentPayments`).
- **Resiliência**: Se o operador sair da tela de fechamento ou trocar de mesa sem finalizar, esse estado é limpo, garantindo que o saldo devedor da mesa volte a ser o total original, evitando perdas financeiras por "pagamentos fantasmas".

---

## 📋 3. Guia Operacional (Day-to-Day)

- **Abertura de Turno**: Informe o troco inicial. Isso é essencial para o relatório de fechamento.
- **Penduras**: Ao quitar uma pendura, o sistema gera automaticamente uma entrada no Caixa do turno atual.
- **Peso**: Digite gramas puras (ex: 350) para produtos vendidos por quilo.
