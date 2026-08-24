/*************************************************************
 * VEGAS VIGILÂNCIA — Gestão de Folgas e Extras (Backend)
 * Google Apps Script + Google Sheets
 * >>> Veja INSTRUCOES-BACKEND.md para publicar <<<
 *************************************************************/

// Uma aba por coleção
var ABAS = {
  extras:'Extras', func:'Funcionarios', postos:'Postos',
  solic:'Solicitantes', hist:'Historico', cfg:'Config'
};

// Colunas de cada aba (ordem = cabeçalho)
var COLUNAS = {
  extras:['id','numero','data','dia_semana','solicitante','posto','funcionario','funcao',
    'entrada','saida','horas','horas_texto','vira_dia','tipos','motivo','valor','valor_aprovado',
    'observacoes','status','criado_por','criado_em','aprovado_por','aprovado_em',
    'recusado_por','recusado_em','motivo_recusa','pago_por','pago_em'],
  func:['id','nome','matricula','cpf','funcao','telefone','admissao','status','observacoes','criado_em'],
  postos:['id','nome','codigo','cliente','endereco','supervisor','status','observacoes','criado_em'],
  solic:['id','nome','cargo','telefone','email','status','criado_em'],
  hist:['id','quando','usuario','papel','acao','alvo','detalhe'],
  cfg:['id','hora_normal','hora_extra','plantao','ad_noturno','outros']
};

function _json(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
function _props(){return PropertiesService.getScriptProperties();}
function _ss(){var id=_props().getProperty('SHEET_ID');return id?SpreadsheetApp.openById(id):SpreadsheetApp.getActiveSpreadsheet();}
function _aba(colecao){
  var nome=ABAS[colecao];if(!nome)throw new Error('coleção inválida');
  var ss=_ss();var sh=ss.getSheetByName(nome);
  if(!sh){sh=ss.insertSheet(nome);sh.appendRow(COLUNAS[colecao]);sh.setFrozenRows(1);_formatarTexto(sh,colecao);}
  if(sh.getLastRow()===0){sh.appendRow(COLUNAS[colecao]);sh.setFrozenRows(1);_formatarTexto(sh,colecao);}
  return sh;
}
/* Força as colunas de data/hora a formato TEXTO, para o Sheets não
   converter "22:00" em data/hora (causa do bug 1899-12-30T...) */
function _formatarTexto(sh,colecao){
  var cols=COLUNAS[colecao];
  var alvo=['data','entrada','saida','criado_em','aprovado_em','recusado_em','pago_em','admissao','quando','horas_texto'];
  cols.forEach(function(c,i){
    if(alvo.indexOf(c)>=0){ sh.getRange(1,i+1,1000,1).setNumberFormat('@'); }
  });
}
function _tokenValido(t){return t && t===_props().getProperty('SESSION_TOKEN');}
function _novoToken(){var t=Utilities.getUuid().replace(/-/g,'');_props().setProperty('SESSION_TOKEN',t);return t;}

/* serializa/deserializa campos especiais (tipos = array) */
function _serial(colecao,obj){
  var o={};COLUNAS[colecao].forEach(function(c){var v=obj[c];if(c==='tipos'&&Array.isArray(v))v=v.join('|');o[c]=(v==null?'':v);});return o;
}
function _deserial(colecao,row,head){
  var o={};head.forEach(function(k,i){var v=row[i];if(k==='tipos'&&typeof v==='string')v=v?v.split('|'):[];o[k]=v;});return o;
}

function doGet(e){
  var p=e.parameter||{};
  if(p.acao==='listar'){
    if(!_tokenValido(p.token))return _json({ok:false,erro:'nao_autorizado'});
    return _json({ok:true,dados:_listar(p.colecao)});
  }
  return _json({ok:true,status:'online',sistema:'Vegas Folgas'});
}
function doPost(e){
  var payload;try{payload=JSON.parse(e.parameter.dados);}catch(err){return _json({ok:false,erro:'payload_invalido'});}
  var a=payload.acao;
  if(a==='login')return _json(_login(payload.usuario,payload.senha));
  if(a==='auditar')return _json(_criar('hist',payload.evento)); // auditoria é livre p/ append
  if(!_tokenValido(payload.token) && a!=='auditar')return _json({ok:false,erro:'nao_autorizado'});
  if(a==='criar')return _json(_criar(payload.colecao,payload.registro));
  if(a==='criarVarios')return _json(_criarVarios(payload.colecao,payload.lista));
  if(a==='atualizar')return _json(_atualizar(payload.colecao,payload.id,payload.campos));
  if(a==='excluir')return _json(_excluir(payload.colecao,payload.id));
  return _json({ok:false,erro:'acao_desconhecida'});
}

function _criar(colecao,reg){
  var sh=_aba(colecao);var o=_serial(colecao,reg);
  sh.appendRow(COLUNAS[colecao].map(function(c){return o[c];}));
  return {ok:true,id:reg.id};
}
function _criarVarios(colecao,lista){
  var sh=_aba(colecao);var cols=COLUNAS[colecao];
  var linhas=lista.map(function(reg){var o=_serial(colecao,reg);return cols.map(function(c){return o[c];});});
  if(linhas.length)sh.getRange(sh.getLastRow()+1,1,linhas.length,cols.length).setValues(linhas);
  return {ok:true,qtd:linhas.length};
}
function _listar(colecao){
  var sh=_aba(colecao);var dados=sh.getDataRange().getValues();var head=dados.shift();
  return dados.map(function(r){return _deserial(colecao,r,head);}).reverse();
}
function _atualizar(colecao,id,campos){
  var sh=_aba(colecao);var dados=sh.getDataRange().getValues();var head=dados[0];var ci=head.indexOf('id');
  for(var r=1;r<dados.length;r++){
    if(String(dados[r][ci])===String(id)){
      for(var k in campos){var c=head.indexOf(k);if(c>=0){var v=campos[k];if(k==='tipos'&&Array.isArray(v))v=v.join('|');sh.getRange(r+1,c+1).setValue(v);}}
      return {ok:true};
    }
  }
  return {ok:false,erro:'nao_encontrado'};
}
function _excluir(colecao,id){
  var sh=_aba(colecao);var dados=sh.getDataRange().getValues();var head=dados[0];var ci=head.indexOf('id');
  for(var r=1;r<dados.length;r++){if(String(dados[r][ci])===String(id)){sh.deleteRow(r+1);return {ok:true};}}
  return {ok:false,erro:'nao_encontrado'};
}

function _login(usuario,senha){
  var pr=_props();var u=pr.getProperty('ADMIN_USER'),s=pr.getProperty('ADMIN_PASS');
  if(!u||!s)return {ok:false,erro:'Credenciais não configuradas.'};
  if(usuario===u && senha===s)return {ok:true,token:_novoToken(),usuario:'Administrador',papel:'Administrador'};
  return {ok:false,erro:'Usuário ou senha inválidos.'};
}

/* Rode 1x no editor para configurar acesso e criar as abas */
function configurarInicial(){
  var pr=PropertiesService.getScriptProperties();
  pr.setProperty('ADMIN_USER','admin');        // usuário único
  pr.setProperty('ADMIN_PASS','Vegas4747@');   // senha (envolve valores!)
  // Se o script NÃO estiver vinculado à planilha, cole o ID aqui:
  // pr.setProperty('SHEET_ID','COLE_O_ID_AQUI');
  for(var c in ABAS)_aba(c);
  Logger.log('Configuração concluída. Abas criadas e acesso definido (admin / Vegas4747@).');
}
