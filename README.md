# Vegas Vigilância — Gestão de Folgas Trabalhadas e Extras

Sistema web para substituir o controle por WhatsApp: cadastrar, importar, aprovar, acompanhar e gerar relatórios de folgas trabalhadas, extras, coberturas e substituições.

## Destaque: importação de texto do WhatsApp
Cole a mensagem recebida (com um ou vários funcionários) em **Importar Texto → Processar texto**. O sistema separa cada funcionário em um registro, calcula as horas (inclusive turnos que viram a meia-noite), mostra uma tela de conferência editável e cadastra todos de uma vez.

## Acesso
- Usuário único: **admin** — senha **Vegas4747@** (perfil Administrador com acesso total).
- Em modo demonstração a senha funciona direto no navegador; em produção fica no Google Apps Script.
- O acesso é restrito a um único usuário por decisão do cliente, já que o sistema envolve valores financeiros.

## Módulos (menu lateral)
Dashboard · Folgas/Extras · Novo Extra · Importar Texto · Funcionários · Postos · Solicitantes · Pagamentos · Relatórios · Calendário · Histórico · Configurações.

## Como testar agora (modo demonstração)
Sirva a pasta e abra `login.html`. Ex.:
```
cd folgas
python3 -m http.server 8000
```
Acesse `http://localhost:8000/login.html` e entre com **admin / Vegas4747@**. Os dados ficam no navegador (localStorage) só para testar.

## Produção (Google Sheets)
Siga `backend/INSTRUCOES-BACKEND.md`: crie a planilha, publique o `Code.gs` como Web App e cole a URL em `config.js` (`API_URL`). O modo demonstração desliga sozinho.

## Publicar o site (GitHub Pages / Netlify / Vercel)
São arquivos estáticos. Coloque todos os arquivos e a pasta `assets/` na raiz do repositório/hospedagem. O `login.html` é a porta de entrada (defina-o como página inicial, ou acesse `/login.html`).

## Estrutura
```
login.html · dashboard.html · extras.html · novo.html · importar.html
funcionarios.html · postos.html · solicitantes.html
pagamentos.html · relatorios.html · calendario.html · historico.html · config.html
config.js  ← edite a API_URL em produção
utils.js (parser, horas, API), app.js (menu/sessão), pdf.js, styles.css
assets/  → logotipos
backend/ → Code.gs + INSTRUCOES-BACKEND.md
```

## Valores
Por decisão do cliente, os valores são **manuais** (campo de R$). O sistema não assume regras trabalhistas nem calcula automaticamente. Em Configurações há campos de referência (hora normal, extra, plantão, adicional noturno) apenas para consulta ao preencher.

## Segurança e auditoria
Login com token, histórico de auditoria somente-adição (quem criou/editou/aprovou/recusou/pagou, com data e hora), e credenciais fora do navegador em produção.

## Responsivo
Funciona em computador, tablet e celular. No celular o menu vira gaveta e as tabelas viram cards.

## Evoluções possíveis
Fotos/anexos, e-mail automático de aprovação, gráficos financeiros mais ricos, múltiplos usuários com perfis. É só pedir.
