/* ============================================================
   APP.JS — Shell da aplicação (layout, menu, sessão)
   Cada página HTML define window.PAGINA (id do menu) e chama
   montarShell(). O conteúdo é renderizado por paginas.js.
   ============================================================ */

// proteção de rota
if(!Sessao.logado() && !location.pathname.endsWith('login.html') && location.pathname!=='/' ){
  location.href='login.html';
}

const MENU=[
  {id:'dashboard',  ic:'🏠', txt:'Dashboard',                arq:'dashboard.html'},
  {id:'extras',     ic:'📋', txt:'Folgas / Extras',          arq:'extras.html'},
  {id:'novo',       ic:'➕', txt:'Novo Extra',               arq:'novo.html',    perm:'criar'},
  {id:'importar',   ic:'📥', txt:'Importar Texto',           arq:'importar.html',perm:'criar'},
  {sep:true},
  {id:'funcionarios',ic:'👷',txt:'Funcionários',            arq:'funcionarios.html'},
  {id:'postos',     ic:'🏢', txt:'Postos',                   arq:'postos.html'},
  {id:'solicitantes',ic:'👤',txt:'Solicitantes',            arq:'solicitantes.html'},
  {sep:true},
  {id:'pagamentos', ic:'💰', txt:'Pagamentos',               arq:'pagamentos.html'},
  {id:'relatorios', ic:'📊', txt:'Relatórios',               arq:'relatorios.html'},
  {id:'calendario', ic:'📅', txt:'Calendário',               arq:'calendario.html'},
  {id:'historico',  ic:'🕐', txt:'Histórico',                arq:'historico.html'},
  {id:'config',     ic:'⚙️', txt:'Configurações',            arq:'config.html',  perm:'tudo'},
];

function montarShell(){
  const s=Sessao.get()||{usuario:'—',papel:'—'};
  const pagina=window.PAGINA||'dashboard';

  const itens=MENU.map(m=>{
    if(m.sep)return '<div class="sep"></div>';
    if(m.perm && !Sessao.pode(m.perm))return '';
    const ativo=m.id===pagina?'ativo':'';
    return `<a href="${m.arq}" class="${ativo}"><span class="ic">${m.ic}</span> ${m.txt}</a>`;
  }).join('');

  const iniciais=(s.usuario||'U').split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();

  const app=document.createElement('div');
  app.className='app';
  app.innerHTML=`
    <div class="overlay-mob" id="ovMob" onclick="fecharMenu()"></div>
    <aside class="sidebar" id="sidebar">
      <div class="logo-area">
        <img src="${VEGAS_CONFIG.LOGO_BRANCA}" alt="Vegas Vigilância">
        <div class="sub">Gestão de Folgas & Extras</div>
      </div>
      <nav class="nav">${itens}
        <div class="sep"></div>
        <a href="#" onclick="sair();return false;"><span class="ic">🚪</span> Sair</a>
      </nav>
      <div class="rodape-side">© ${new Date().getFullYear()} Vegas Vigilância</div>
    </aside>
    <div class="conteudo">
      <header class="topbar">
        <button class="menu-btn" onclick="abrirMenu()">☰</button>
        <h1 id="tituloPagina">${(MENU.find(m=>m.id===pagina)||{}).txt||'Dashboard'}</h1>
        <div class="topbar-busca">
          <span class="lupa">🔎</span>
          <input type="search" id="buscaGlobal" placeholder="Pesquisar funcionário, posto ou nº do registro…">
        </div>
        <div class="user">
          <div class="info"><b>${esc(s.usuario)}</b><span>${esc(s.papel)}</span></div>
          <div class="av">${esc(iniciais)}</div>
        </div>
      </header>
      <main class="pagina" id="conteudoPagina"></main>
    </div>
    <div class="overlay-load" id="ovLoad"><div class="spinner"></div><div id="ovLoadTxt">Carregando…</div></div>`;
  document.body.appendChild(app);

  // busca global -> vai para lista de extras filtrada
  const bg=document.getElementById('buscaGlobal');
  if(bg)bg.addEventListener('keydown',e=>{if(e.key==='Enter'){location.href='extras.html?q='+encodeURIComponent(bg.value);}});
}

function abrirMenu(){document.getElementById('sidebar').classList.add('on');document.getElementById('ovMob').classList.add('on');}
function fecharMenu(){document.getElementById('sidebar').classList.remove('on');document.getElementById('ovMob').classList.remove('on');}
function sair(){Sessao.limpar();location.href='login.html';}

function carregando(on,txt){
  const o=document.getElementById('ovLoad');if(!o)return;
  if(txt)document.getElementById('ovLoadTxt').textContent=txt;
  o.classList.toggle('on',!!on);
}

/* helper: pega query string */
function qs(nome){return new URLSearchParams(location.search).get(nome)||'';}

/* helper: registra auditoria */
async function auditar(acao,alvo,detalhe){
  const s=Sessao.get()||{};
  await VegasAPI.logAudit({
    id:novoId(), quando:agoraISO(), usuario:s.usuario||'—', papel:s.papel||'—',
    acao, alvo:alvo||'', detalhe:detalhe||''
  }, s.token);
}

/* helper: exportar CSV */
function exportarCSV(nome,cabecalhos,linhas){
  const sep=';';
  const esc=v=>{v=(v==null?'':String(v)).replace(/"/g,'""');return /[";\n]/.test(v)?`"${v}"`:v;};
  let csv=cabecalhos.map(esc).join(sep)+'\n';
  linhas.forEach(l=>{csv+=l.map(esc).join(sep)+'\n';});
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=nome;a.click();
}
