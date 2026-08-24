/* ============================================================
   UTILS — Vegas Gestão de Folgas e Extras
   ============================================================ */

/* ---------- Toast ---------- */
function toast(msg,tipo){
  let t=document.getElementById('vg-toast');
  if(!t){t=document.createElement('div');t.id='vg-toast';t.className='toast';document.body.appendChild(t);}
  t.textContent=msg;t.className='toast '+(tipo||'')+' on';
  clearTimeout(t._to);t._to=setTimeout(()=>{t.className='toast '+(tipo||'');},3200);
}

/* ---------- Datas ---------- */
const DIAS_SEMANA=['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
const MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function pad(n){return String(n).padStart(2,'0');}
function hojeISO(){const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;}
function agoraISO(){return new Date().toISOString();}
function isoParaBR(iso){ // aaaa-mm-dd -> dd/mm/aaaa
  if(!iso)return'';const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
  return m?`${m[3]}/${m[2]}/${m[1]}`:String(iso);
}
function brParaISO(br){ // dd/mm/aaaa -> aaaa-mm-dd
  const m=/^(\d{2})\/(\d{2})\/(\d{4})/.exec((br||'').trim());
  return m?`${m[3]}-${m[2]}-${m[1]}`:'';
}
function diaSemanaDeISO(iso){
  const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso||''));if(!m)return'';
  const d=new Date(+m[1],+m[2]-1,+m[3]);return DIAS_SEMANA[d.getDay()];
}
function formatarDataHora(iso){try{return new Date(iso).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});}catch(e){return iso||'';}}
function dataBRQualquer(v){ // aceita ISO, Date, dd/mm/aaaa
  if(v==null||v==='')return'';
  if(v instanceof Date&&!isNaN(v))return `${pad(v.getDate())}/${pad(v.getMonth()+1)}/${v.getFullYear()}`;
  const s=String(v).trim();
  if(/^\d{2}\/\d{2}\/\d{4}$/.test(s))return s;
  const iso=/^(\d{4})-(\d{2})-(\d{2})/.exec(s);if(iso)return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const d=new Date(s);if(!isNaN(d))return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
  return s;
}

/* ---------- Cálculo de horas (suporta virada de meia-noite) ---------- */
function normalizaHora(h){
  if(h==null||h==='')return'';
  // Objeto Date (o Sheets pode devolver hora como Date)
  if(h instanceof Date && !isNaN(h))return `${pad(h.getUTCHours())}:${pad(h.getUTCMinutes())}`;
  let s=String(h).trim();
  // ISO com hora: 1899-12-30T22:06:28.000Z  ou  2026-08-24T07:00:00.000Z
  let iso=/T(\d{2}):(\d{2})/.exec(s);
  if(iso)return `${iso[1]}:${iso[2]}`;
  // formatos normais: "22:00", "22h", "22h30", "2200"
  s=s.replace(/[hH]/g,':').replace(/\s/g,'');
  let m=/^(\d{1,2}):?(\d{2})?$/.exec(s);
  if(!m)return'';
  let hh=Math.min(23,+m[1]),mm=m[2]?Math.min(59,+m[2]):0;
  return `${pad(hh)}:${pad(mm)}`;
}
/* exibe uma hora já normalizada (para usar direto no HTML) */
function horaBR(h){return normalizaHora(h);}
function calcularHoras(entrada,saida){
  const e=normalizaHora(entrada),s=normalizaHora(saida);
  if(!e||!s)return{horas:0,viraDia:false,texto:''};
  const[eh,em]=e.split(':').map(Number),[sh,sm]=s.split(':').map(Number);
  let ini=eh*60+em, fim=sh*60+sm, viraDia=false;
  if(fim<=ini){fim+=24*60;viraDia=true;} // atravessou meia-noite
  const min=fim-ini, horas=min/60;
  const hInt=Math.floor(min/60), mRest=min%60;
  const texto = mRest? `${hInt}h${pad(mRest)}` : `${hInt}h`;
  return{horas:+horas.toFixed(2),viraDia,texto,entrada:e,saida:s};
}

/* ---------- Número de registro ---------- */
function proximoNumero(existentes){
  const ano=new Date().getFullYear();
  const doAno=(existentes||[]).map(r=>r.numero||'').filter(n=>n.includes('-'+ano+'-'));
  let max=0;
  doAno.forEach(n=>{const m=/-(\d+)$/.exec(n);if(m)max=Math.max(max,+m[1]);});
  return `${VEGAS_CONFIG.PREFIXO_REG}-${ano}-${String(max+1).padStart(6,'0')}`;
}

/* ============================================================
   PARSER DE MENSAGENS DO WHATSAPP
   Interpreta texto colado e devolve 1+ registros estruturados.
   Reconhece rótulos variados, asteriscos, emojis e blocos.
   ============================================================ */
const ROTULOS = {
  data:       ['data','dia'],
  solicitante:['solicitante','solicitado por','pedido por','quem pediu'],
  posto:      ['posto','local','cliente','unidade'],
  funcionario:['funcionario','funcionário','colaborador','vigilante','nome'],
  funcao:     ['funcao','função','cargo'],
  turno:      ['turno','horario','horário','horas'],
  cobertura:  ['cobertura','tipo'],
  motivo:     ['motivo','obs','observacao','observação'],
};
function _limpa(s){
  return (s||'')
    .replace(/[\*_~`]/g,'')                 // markdown do whats
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,'') // emojis
    .replace(/^[\s\-•>]+/,'').trim();
}
function _achaRotulo(linha){
  const bruto=_limpa(linha);
  const m=/^([^:]{2,40}):\s*(.*)$/.exec(bruto);
  if(!m)return null;
  const chaveRaw=m[1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  for(const campo in ROTULOS){
    if(ROTULOS[campo].some(r=>chaveRaw===r || chaveRaw.startsWith(r)))
      return{campo,valor:m[2].trim(),raw:m[1].trim()};
  }
  return null;
}
function _extraiData(txt){
  // dd/mm(/aaaa) ou "24/08" ; devolve ISO
  const m=/(\d{1,2})[\/\.\-](\d{1,2})(?:[\/\.\-](\d{2,4}))?/.exec(txt||'');
  if(!m)return'';
  let d=+m[1],mo=+m[2],y=m[3]?+m[3]:new Date().getFullYear();
  if(y<100)y+=2000;
  if(d>31&&mo<=31){[d,mo]=[mo,d];}
  return `${y}-${pad(mo)}-${pad(d)}`;
}
function _extraiTurno(txt){
  // "07:00 às 19:00", "07h-19h", "19:00 as 07:00"
  const m=/(\d{1,2}[:h]?\d{0,2})\s*(?:às|as|a|-|até|ate|\/)\s*(\d{1,2}[:h]?\d{0,2})/i.exec(txt||'');
  if(!m)return{entrada:'',saida:''};
  return{entrada:normalizaHora(m[1]),saida:normalizaHora(m[2])};
}
function _extraiTipos(txt){
  const t=(txt||'').toLowerCase();
  const achados=[];
  VEGAS_CONFIG.TIPOS_COBERTURA.forEach(tp=>{
    const chave=tp.toLowerCase();
    if(t.includes(chave))achados.push(tp);
  });
  if(t.includes('ponto fechado')&&!achados.includes('Ponto fechado'))achados.push('Ponto fechado');
  return achados.length?achados:(txt?['Extra']:[]);
}

/* Divide o texto em blocos (um por registro) e monta os registros.
   Suporta:
   - vários blocos separados por linha de "____", "----" ou linha em branco
   - blocos delimitados pela repetição de rótulos (SOLICITANTE/FUNCIONÁRIO)
   - lista numerada "1. Nome — Posto"
   - um único registro
   Cada bloco herda do cabeçalho global (data e campos que vierem antes). */
function parseWhatsApp(texto){
  texto=String(texto||'');
  const linhas=texto.split(/\r?\n/);

  // ----- cabeçalho global: data e campos antes do 1º funcionário -----
  const global={data:'',solicitante:'',posto:'',funcao:'',turno:'',cobertura:'',motivo:''};
  let viuFuncionario=false;
  linhas.forEach(l=>{
    const r=_achaRotulo(l);
    if(!r)return;
    if(r.campo==='funcionario'){viuFuncionario=true;return;}
    if(viuFuncionario)return; // depois do 1º funcionário já é conteúdo de bloco
    if(r.campo==='data')       global.data=_extraiData(r.valor)||global.data;
    if(r.campo==='solicitante')global.solicitante=r.valor;
    if(r.campo==='motivo')     global.motivo=r.valor;
    if(r.campo==='funcao')     global.funcao=r.valor;
    if(r.campo==='turno')      global.turno=r.valor;
    if(r.campo==='cobertura')  global.cobertura=r.valor;
    if(r.campo==='posto')      global.posto=r.valor;
  });
  if(!global.data)global.data=_extraiData(linhas.slice(0,3).join(' '))||'';

  // ----- lista numerada? -----
  const numeradas=[];
  linhas.forEach(l=>{
    const nl=_limpa(l);
    const mn=/^(\d{1,2})[\.\)\-]\s*(.+)$/.exec(nl);
    if(mn && !/:/.test(mn[2])){
      const partes=mn[2].split(/\s+[—\-–|]\s+/);
      numeradas.push({funcionario:partes[0].trim(),posto:(partes[1]||'').trim()});
    }
  });

  const registros=[];
  const mk=(campos)=>{
    const turno=_extraiTurno(campos.turno||global.turno);
    let tipos=_extraiTipos(campos.cobertura||global.cobertura);
    if(!tipos.length){
      const cab=linhas.slice(0,2).join(' ').toLowerCase();
      tipos=_extraiTipos(cab);
      if(!tipos.length && /extra/.test(texto.toLowerCase()))tipos=['Extra'];
    }
    const data=campos.data||global.data;
    registros.push({
      data,
      dia_semana:diaSemanaDeISO(data),
      solicitante:campos.solicitante||global.solicitante,
      posto:campos.posto||global.posto,
      funcionario:campos.funcionario||'',
      funcao:campos.funcao||global.funcao,
      entrada:turno.entrada,
      saida:turno.saida,
      turno_texto:campos.turno||global.turno,
      tipos,
      motivo:campos.motivo||global.motivo
    });
  };

  if(numeradas.length){
    numeradas.forEach(n=>mk(n));
    return registros;
  }

  // ----- divide em blocos por separadores OU por reinício de rótulo -----
  // separadores: linha só com _, -, =, • ou vazia
  const ehSeparador=l=>{const t=_limpa(l);return t===''||/^[_\-=•*.\s]{3,}$/.test(t);};

  let blocos=[];let atual=[];
  linhas.forEach(l=>{
    if(ehSeparador(l)){ if(atual.length){blocos.push(atual);atual=[];} }
    else atual.push(l);
  });
  if(atual.length)blocos.push(atual);

  // Se um "bloco" tiver 2+ funcionários (sem separadores no meio), subdivide
  // sempre que reencontrar o rótulo FUNCIONÁRIO ou SOLICITANTE.
  const subdividir=(bloco)=>{
    const partes=[];let cur=[];let jaTemFunc=false,jaTemSolic=false;
    bloco.forEach(l=>{
      const r=_achaRotulo(l);
      const inicioNovo = r && ((r.campo==='funcionario'&&jaTemFunc)||(r.campo==='solicitante'&&jaTemSolic));
      if(inicioNovo && cur.length){partes.push(cur);cur=[];jaTemFunc=false;jaTemSolic=false;}
      if(r&&r.campo==='funcionario')jaTemFunc=true;
      if(r&&r.campo==='solicitante')jaTemSolic=true;
      cur.push(l);
    });
    if(cur.length)partes.push(cur);
    return partes;
  };

  let blocosFinais=[];
  blocos.forEach(b=>{subdividir(b).forEach(sb=>blocosFinais.push(sb));});

  // extrai campos de cada bloco
  blocosFinais.forEach(bloco=>{
    const campos={};
    bloco.forEach(l=>{
      const r=_achaRotulo(l);if(!r)return;
      if(r.campo==='data')campos.data=_extraiData(r.valor);
      else campos[r.campo]=r.valor;
    });
    // só cria registro se o bloco tiver algo útil (funcionário ou posto)
    if(campos.funcionario||campos.posto)mk(campos);
  });

  // fallback: nada identificado -> tenta um único registro pelo global
  if(!registros.length && (global.posto||global.solicitante))mk({});
  return registros;
}

/* ============================================================
   API  —  Google Apps Script  +  fallback demo (localStorage)
   ============================================================ */
const VegasAPI={
  K:{ extras:'vg_folgas_extras', func:'vg_folgas_funcionarios', postos:'vg_folgas_postos',
      solic:'vg_folgas_solicitantes', hist:'vg_folgas_historico', cfg:'vg_folgas_cfg' },
  _ler(k){try{return JSON.parse(localStorage.getItem(k)||'[]');}catch(e){return[];}},
  _sav(k,v){localStorage.setItem(k,JSON.stringify(v));},

  async _post(p){const b=new URLSearchParams({dados:JSON.stringify(p)});const r=await fetch(VEGAS_CONFIG.API_URL,{method:'POST',body:b});return r.json();},
  async _get(p){const r=await fetch(VEGAS_CONFIG.API_URL+'?'+new URLSearchParams(p));return r.json();},

  /* --- login --- */
  async login(usuario,senha){
    if(VEGAS_CONFIG.MODO_DEMO){
      // acesso único: apenas o administrador
      if(usuario.toLowerCase()==='admin' && senha==='Vegas4747@')
        return {ok:true,token:'DEMO',usuario:'Administrador',papel:'Administrador'};
      return {ok:false,erro:'Usuário ou senha inválidos.'};
    }
    return this._post({acao:'login',usuario,senha});
  },

  /* --- genérico: coleções --- */
  async listar(colecao,token){
    if(VEGAS_CONFIG.MODO_DEMO)return{ok:true,dados:this._ler(this.K[colecao]||('vg_'+colecao))};
    return this._get({acao:'listar',colecao,token});
  },
  async criar(colecao,registro,token){
    if(VEGAS_CONFIG.MODO_DEMO){const a=this._ler(this.K[colecao]);a.unshift(registro);this._sav(this.K[colecao],a);return{ok:true,id:registro.id};}
    return this._post({acao:'criar',colecao,registro,token});
  },
  async criarVarios(colecao,lista,token){
    if(VEGAS_CONFIG.MODO_DEMO){const a=this._ler(this.K[colecao]);lista.forEach(x=>a.unshift(x));this._sav(this.K[colecao],a);return{ok:true,qtd:lista.length};}
    return this._post({acao:'criarVarios',colecao,lista,token});
  },
  async atualizar(colecao,id,campos,token){
    if(VEGAS_CONFIG.MODO_DEMO){const a=this._ler(this.K[colecao]);const i=a.findIndex(x=>x.id===id);if(i>=0){a[i]={...a[i],...campos};this._sav(this.K[colecao],a);}return{ok:true};}
    return this._post({acao:'atualizar',colecao,id,campos,token});
  },
  async excluir(colecao,id,token){
    if(VEGAS_CONFIG.MODO_DEMO){let a=this._ler(this.K[colecao]);a=a.filter(x=>x.id!==id);this._sav(this.K[colecao],a);return{ok:true};}
    return this._post({acao:'excluir',colecao,id,token});
  },
  /* histórico/auditoria (append-only) */
  async logAudit(evento,token){
    if(VEGAS_CONFIG.MODO_DEMO){const a=this._ler(this.K.hist);a.unshift(evento);this._sav(this.K.hist,a);return{ok:true};}
    return this._post({acao:'auditar',evento,token});
  }
};

/* ---------- Sessão ---------- */
const Sessao={
  set(o){sessionStorage.setItem('vg_folgas_sessao',JSON.stringify({...o,t:Date.now()}));},
  get(){try{return JSON.parse(sessionStorage.getItem('vg_folgas_sessao'));}catch(e){return null;}},
  limpar(){sessionStorage.removeItem('vg_folgas_sessao');},
  logado(){const s=this.get();return !!(s&&s.token);},
  papel(){const s=this.get();return s?s.papel:'';},
  pode(acao){const s=this.get();if(!s)return false;const p=VEGAS_CONFIG.PAPEIS[s.papel]||{};return !!(p.tudo||p[acao]);}
};

/* gerar id simples */
function novoId(){return 'id_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);}

/* escape html */
function esc(s){return(s==null?'':String(s)).replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));}

/* classe de badge por status */
function badgeStatus(st){
  const map={'Rascunho':'b-rascunho','Aguardando aprovação':'b-aguardando','Aprovado':'b-aprovado','Recusado':'b-recusado','Pago':'b-pago','Cancelado':'b-cancelado'};
  return `<span class="badge ${map[st]||'b-rascunho'}">${esc(st)}</span>`;
}
