
# 🍺 Botequista - Documentação Oficial do Sistema

O Botequista é um ecossistema de gestão para bares focado em **alta disponibilidade** e **integridade financeira**. Esta documentação serve como guia técnico e operacional para proprietários e administradores.

---

## 🚀 1. Arquitetura de Nuvem e Dados

O sistema utiliza uma abordagem **Stateless-First**, o que significa que nenhum dado sensível reside apenas no navegador do usuário.

### 1.1 Persistência (Firebase)
- **Sincronização Ativa**: O sistema salva o estado global (Produtos, Vendas, Mesas e Turnos) automaticamente a cada 1.5 segundos após qualquer alteração.
- **Criptografia AES-256**: Todos os dados são criptografados com a sua **Senha Master (`Tc@00216587`)** antes de saírem do seu dispositivo. Nem mesmo o provedor do banco de dados consegue ler o seu faturamento sem esta chave.

### 1.2 Segurança e Acesso
- **Usuário Admin**: Único com acesso total ao sistema (Reset, Exclusão de Histórico e Gestão de Usuários).
- **Permissões Granulares**: Cada colaborador pode ter acessos restritos (ex: pode vender, mas não pode ver relatórios financeiros).

---

## 🛠 2. Operação de Turnos e Mesas

O Botequista separa o **fluxo financeiro** do **fluxo operacional** para permitir máxima flexibilidade.

### 2.1 O Conceito de Independência
Diferente de sistemas legados, o Botequista permite que você **feche um turno (caixa)** sem precisar encerrar a conta dos clientes que ainda estão bebendo.
- **Turno**: Representa a responsabilidade de um operador e o dinheiro físico na gaveta.
- **Mesa/Comanda**: Representa o consumo pendente do cliente.
- **Troca de Equipe**: Quando o operador A encerra seu turno, ele faz a conferência da gaveta. O operador B abre um novo turno e as mesas abertas continuam lá para serem finalizadas no futuro.

### 2.2 Controle de Caixa (Tesouraria)
- **Fundo de Troco**: Informado na abertura do turno.
- **Sangrias e Suprimentos**: Use a aba **Tesouraria** para mover dinheiro entre o Caixa Primário (gaveta) e o Caixa Secundário (cofre/reserva) sem fechar o turno.

---

## 📊 3. Regras de Negócio e Relatórios

### 3.1 Gestão de Fiados (Pendura)
- **Identificação**: Fiados exigem obrigatoriamente o nome do cliente.
- **Alerta de Risco**: Defina em Ajustes um valor de limite. Se os fiados totais passarem disso, um alerta visual ⚠️ surgirá no menu lateral.
- **Quitação**: O sistema permite abater dívidas diretamente nos relatórios, gerando uma entrada de caixa correspondente.

### 3.2 Venda por Peso
- **Padronização**: O sistema trabalha internamente com **gramas**.
- **Lançamento**: No PDV, ao selecionar um item pesável, informe o peso em gramas (ex: `500` para meio quilo). O Botequista converte automaticamente baseado no preço/kg.

---

## ☁️ 4. Deploy e Recuperação

O sistema foi desenhado para ser indestrutível se configurado corretamente.

### 4.1 Variáveis de Ambiente (Vercel/Cloud)
Adicione as chaves abaixo no seu painel de deploy para conexão automática:
1. `FIREBASE_URL`: Link do seu Realtime Database.
2. `FIREBASE_API_KEY`: Chave de API do seu projeto Firebase.

### 4.2 Backup Externo
Embora o Firebase seja o banco principal, você pode configurar um **GitHub Token** para salvar cópias de segurança em Gists privados, criando uma redundância total dos dados do seu bar.

---

## 💡 5. Dicas de Performance
- **Favoritos**: Mantenha no máximo 12 itens favoritos. Eles são os botões grandes no topo do PDV.
- **Categorias**: Use nomes curtos (ex: "DOSES" em vez de "DOSES DE WHISKY E CACHAÇA") para melhor visualização no celular.
- **Offline**: O Botequista é um PWA. Se a internet cair, você pode continuar lançando itens, mas evite fechar a aba até que a conexão volte (indicador 🟢 no topo).
