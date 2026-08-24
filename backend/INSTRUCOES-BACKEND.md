# Backend — Google Apps Script (passo a passo)

O sistema já roda em **modo demonstração** (dados no navegador) para você testar. Para produção — salvando no Google Sheets — siga os passos. Leva ~10 min e é gratuito.

## 1. Crie a planilha
Acesse https://sheets.google.com, crie uma planilha (ex.: **Folgas Vegas**). As abas (Extras, Funcionarios, Postos, Solicitantes, Historico, Config) são criadas automaticamente.

## 2. Abra o Apps Script
Na planilha: **Extensões → Apps Script**. Apague o código existente, cole todo o `Code.gs` desta pasta e salve.

## 3. Configure acesso (senha)
Na função `configurarInicial()` (no fim do arquivo), o usuário já vem como **admin** e a senha como **Vegas4747@**. Troque a senha se quiser. Selecione a função `configurarInicial` no topo e clique em **Executar** (▶). Autorize quando o Google pedir. Isso cria as abas e grava a senha nas Script Properties (fora do site).

## 4. Publique como Web App
**Implantar → Nova implantação → App da Web**:
- Executar como: **Eu**
- Quem pode acessar: **Qualquer pessoa**

Implante, autorize e copie a **URL** (termina em `/exec`).

## 5. Ligue o site ao backend
Abra `config.js` e cole a URL em `API_URL`:
```js
API_URL: "https://script.google.com/macros/s/SEU_ID/exec",
```
Salve. O modo demonstração desliga sozinho e tudo passa a salvar no Google Sheets.

## 6. Teste
Faça login com **admin / Vegas4747@**, cadastre um extra e confira se aparece na planilha.

---

## Segurança
- A senha fica no servidor do Google (Script Properties), nunca no site.
- Só o **admin** tem acesso (decisão adotada por envolver valores financeiros).
- Leitura/edição exigem token obtido no login.
- O histórico/auditoria é somente-adição (não é apagado pelo sistema).

## Atualizar o código
Após editar o `Code.gs`: **Implantar → Gerenciar implantações → Editar → Nova versão → Implantar**. A URL continua a mesma.

## Trocar a senha
Edite `ADMIN_PASS` em `configurarInicial()` e rode a função de novo.

## Observação sobre "tipos"
O campo de tipo de cobertura aceita vários valores; na planilha eles são gravados separados por `|` (ex.: `Extra|Ponto fechado`). O sistema converte automaticamente.
