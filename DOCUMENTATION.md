
# 🍺 Botequista - Guia de Deploy Profissional

O Botequista foi construído com arquitetura de nuvem resiliente para garantir que você tenha o controle total do seu bar em qualquer lugar do mundo.

---

## 🚀 1. Deploy Instantâneo (GitHub -> Vercel)

Para que o sistema conecte automaticamente com seu banco de dados sem mexer no código, siga estes passos:

### 1.1 Configuração na Vercel
No painel da Vercel (Project Settings -> Environment Variables), adicione esta chave:

1.  **`FIREBASE_URL`**: O endereço do seu Firebase Realtime Database.
    - Ex: `https://meu-bar-default-rtdb.firebaseio.com`

### 1.2 Por que isso funciona?
O sistema está programado para priorizar essas variáveis de ambiente. Ao fazer o deploy, a Vercel injeta esses valores, tornando a integração invisível e segura.

---

## 🛠 2. Segurança e Dados

### 2.1 A Senha Master (`Tc@00216587`)
Esta senha é o coração da segurança do seu bar. Ela é usada para:
- Criptografar os dados antes de enviá-los para a nuvem.
- Validar a conexão inicial de novos dispositivos.
- **Dica:** Não altere esta chave a menos que tenha conhecimento técnico, pois ela protege a integridade do seu banco de dados.

### 2.2 Sincronização Multi-Aparelho
- O sistema usa um mecanismo de **Polling Inteligente**.
- A cada 15 segundos, o app verifica se houve mudanças feitas por outros funcionários em outros celulares.
- O salvamento é automático (debounced) a cada 3 segundos após qualquer alteração.

---

## 📊 3. Manutenção e Backups

### 3.1 Backup Secundário (GitHub Gists)
Além do Firebase, recomendamos configurar o backup via GitHub nos Ajustes.
- Isso cria um arquivo `.json` privado na sua conta do GitHub.
- É a sua garantia final contra qualquer falha catastrófica de banco de dados.

### 3.2 Exportação Manual
- Sempre que desejar, você pode baixar o estado completo do seu bar clicando em **Exportar JSON** nos Ajustes. Este arquivo pode ser reimportado em qualquer instalação limpa do Botequista.

---

## 📋 4. Padrões de Operação

- **Moeda:** Sempre use a vírgula para centavos. O sistema formata automaticamente para `R$`.
- **Peso:** O PDV espera gramas (números inteiros). O cálculo de preço é automático baseado no preço/kg cadastrado.
- **Turnos:** O fechamento de turno é o momento mais importante. Ele consolida as vendas em dinheiro e valida o fundo de troco.
