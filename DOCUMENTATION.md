
# 🍺 Botequista - Documentação Oficial do Sistema

O Botequista é um ecossistema de gestão para bares focado em **alta disponibilidade**, **estética funcional** e **integridade financeira total**. Esta documentação serve como guia técnico e operacional para proprietários e administradores.

---

## 🚀 1. Arquitetura de Nuvem e Dados

O sistema utiliza uma abordagem **Stateless-First**, garantindo que seus dados estejam seguros e sincronizados em tempo real.

### 1.1 Persistência (Firebase)
- **Sincronização Ativa**: O sistema salva o estado global (Produtos, Vendas, Mesas e Turnos) automaticamente a cada 1.5 segundos após qualquer alteração.
- **Criptografia AES-256**: Todos os dados são criptografados com a sua **Senha Master (`Tc@00216587`)** antes de saírem do seu dispositivo. Isso garante privacidade total contra acessos externos.

### 1.2 Status de Conexão
- No topo da tela, o indicador de sincronização mostra o estado da sua conexão:
  - 🟢 **Sincronizado**: Tudo salvo na nuvem.
  - 🟠 **Pendente**: Salvando alterações recentes.
  - 🔴 **Erro**: Falha de conexão (verifique sua internet).

---

## 🛠 2. Operação de Turnos e Mesas

O Botequista separa o **fluxo de caixa** (responsabilidade do operador) do **fluxo de consumo** (conta do cliente).

### 2.1 Turnos (Operação)
- Representa o "caixa aberto". O operador deve abrir um turno informando o fundo de reserva e troco.
- **Fechamento**: Exige a conferência física do dinheiro. O sistema calcula a diferença (Quebra de Caixa) automaticamente.

### 2.2 Mesas e Comandas
- O bar pode operar com inúmeras mesas abertas simultaneamente.
- **Independência**: Você pode fechar um turno e abrir outro sem precisar fechar as mesas dos clientes que ainda estão consumindo. As mesas "migram" para o próximo turno automaticamente.

---

## 💰 3. Ponto de Venda (PDV) e Regras Financeiras

O PDV conta com travas de segurança para evitar prejuízos operacionais.

### 3.1 Validação Estrita de Pagamento
- **Trava de Recebimento**: O sistema impede o fechamento de qualquer comanda se o **Total Pago** for menor que o **Total da Conta**.
- Caso o valor seja insuficiente, um alerta vermelho indicará quanto falta para completar o pagamento.
- **Troco**: O cálculo de troco é exibido automaticamente apenas para pagamentos em **Dinheiro**.

### 3.2 Venda por Peso
- Itens como porções por quilo ou refeições utilizam a escala de **Gramas**.
- Ao lançar, informe o valor em gramas (ex: `500` para 0,5kg). O sistema faz o cálculo monetário instantâneo.

---

## 📊 4. Gestão de Fiados (Pendura)

A gestão de crédito é um dos pilares de segurança do Botequista.

### 4.1 Identificação Obrigatória
- Para lançar uma venda como **Pendura**, é obrigatório informar o nome do cliente.
- O mesmo vale para **Quitações** (quando o cliente vem apenas para pagar uma dívida antiga).

### 4.2 Saldo Histórico (Real)
- O saldo exibido no relatório de "Penduras" não se limita ao turno atual. Ele varre **todo o histórico de vendas** para encontrar o débito real do cliente, subtraindo todas as quitações já realizadas.

### 4.3 Alerta de Risco
- Em **Ajustes**, você define o limite máximo de fiados que o bar suporta. Se a soma de todas as penduras do bar ultrapassar esse valor, um ícone de alerta ⚠️ aparecerá permanentemente no menu **Relatórios**.

---

## 👤 5. Gestão de Equipe

O sistema permite criar usuários com níveis de acesso específicos:
- **Administradores**: Acesso total, incluindo exclusão de vendas e reset de sistema.
- **Operadores**: Acesso limitado ao PDV e abertura/fechamento de turnos.
- **Segurança de Senha**: No painel de Equipe, o administrador pode visualizar as senhas atuais dos colaboradores caso eles as esqueçam.

---

## ☁️ 6. Deploy e Manutenção

### 6.1 Variáveis de Ambiente
Para rodar em servidores próprios (Vercel/Netlify), configure:
- `FIREBASE_URL`: Endpoint do Realtime Database.
- `FIREBASE_API_KEY`: Chave de autenticação do Google.

### 6.2 Limpeza de Dados
Na aba de **Ajustes**, existem comandos de "limpeza pesada" para preparar o bar para uma nova temporada ou zerar o cardápio. **Atenção**: Estas ações são irreversíveis e exigem nível de Administrador.

---
**Botequista v3.0** - *Gestão de Bar Inteligente e Segura.*
