/* ============================================================
   PDF.JS — Relatórios e registros em PDF (jsPDF)
   ============================================================ */
const COR={preto:[22,23,25],grafite:[42,45,49],prata:[158,164,173],texto:[28,30,33],suave:[92,98,107],linha:[224,227,232],cinza:[245,246,248]};

function _cab(doc,PW,MX,titulo,sub){
  doc.setFillColor(...COR.preto);doc.rect(0,0,PW,26,'F');
  doc.setFillColor(...COR.prata);doc.rect(0,26,PW,1.1,'F');
  doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(17);
  doc.text('VEGAS',MX,12);
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(...COR.prata);
  doc.text('VIGILÂNCIA E SEGURANÇA',MX,17);
  doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(10);
  doc.text(titulo,PW-MX,11,{align:'right'});
  doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(...COR.prata);
  doc.text(sub||'',PW-MX,16,{align:'right'});
  doc.setTextColor(200,204,210);doc.setFontSize(7);
  doc.text('Emitido: '+formatarDataHora(agoraISO()),PW-MX,20.5,{align:'right'});
}
function _rod(doc,PW,PH,MX,pag){
  doc.setDrawColor(...COR.linha);doc.setLineWidth(0.2);doc.line(MX,PH-12,PW-MX,PH-12);
  doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(...COR.suave);
  doc.text('Vegas Vigilância e Segurança — Documento gerado eletronicamente',MX,PH-8);
  doc.text('Página '+pag,PW-MX,PH-8,{align:'right'});
}

/* ---------- PDF de UM registro ---------- */
function pdfRegistro(reg,baixar){
  const{jsPDF}=window.jspdf;const doc=new jsPDF('p','mm','a4');
  const PW=210,PH=297,MX=16;let y=34;
  _cab(doc,PW,MX,'FICHA DE EXTRA',reg.numero||'');
  function secao(t){doc.setFillColor(...COR.grafite);doc.rect(MX,y,PW-2*MX,7,'F');doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(255,255,255);doc.text(t.toUpperCase(),MX+3,y+4.8);y+=9;}
  function campo(lab,val,span){const colW=PW-2*MX;const w=span===2?colW:colW/2;const x=this&&this._x||MX;}
  // simplificado: par label/valor em 2 colunas
  const pares=[
    ['Nº do registro',reg.numero],['Status',reg.status],
    ['Data',dataBRQualquer(reg.data)],['Dia da semana',reg.dia_semana],
    ['Solicitante',reg.solicitante],['Posto',reg.posto],
    ['Funcionário',reg.funcionario],['Função',reg.funcao],
    ['Entrada',reg.entrada],['Saída',reg.saida],
    ['Horas',reg.horas_texto||(reg.horas+'h')],['Atravessa meia-noite',reg.vira_dia?'Sim':'Não'],
    ['Tipo de cobertura',(reg.tipos||[]).join(', ')],['Motivo',reg.motivo],
    ['Valor estimado',reg.valor?('R$ '+reg.valor):'—'],['Valor aprovado',reg.valor_aprovado?('R$ '+reg.valor_aprovado):'—'],
  ];
  secao('Dados do registro');
  const colW=PW-2*MX;let x=MX,linhaY=y;
  pares.forEach((p,i)=>{
    const w=colW/2;
    doc.setFillColor(...COR.cinza);doc.rect(x,linhaY,w-2,13,'F');
    doc.setDrawColor(...COR.linha);doc.setLineWidth(0.2);doc.rect(x,linhaY,w-2,13,'S');
    doc.setFont('helvetica','bold');doc.setFontSize(6.5);doc.setTextColor(...COR.suave);
    doc.text(String(p[0]).toUpperCase(),x+2.5,linhaY+4.5);
    doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(...COR.texto);
    doc.text(doc.splitTextToSize(p[1]?String(p[1]):'—',w-6),x+2.5,linhaY+9.5);
    if(i%2===0){x=MX+w;}else{x=MX;linhaY+=13;}
  });
  y=linhaY+ (pares.length%2? 13:0) +6;
  if(reg.observacoes){secao('Observações');doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(...COR.texto);doc.text(doc.splitTextToSize(reg.observacoes,PW-2*MX),MX,y+2);y+=16;}
  // aprovação
  secao('Aprovação e auditoria');
  doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(...COR.texto);
  const linhasAud=[
    'Criado por: '+(reg.criado_por||'—')+'   em '+(reg.criado_em?formatarDataHora(reg.criado_em):'—'),
    'Aprovado por: '+(reg.aprovado_por||'—')+(reg.aprovado_em?('   em '+formatarDataHora(reg.aprovado_em)):''),
    reg.recusado_por?('Recusado por: '+reg.recusado_por+'   Motivo: '+(reg.motivo_recusa||'—')):'',
    reg.pago_por?('Pago por: '+reg.pago_por+'   em '+formatarDataHora(reg.pago_em||'')):'',
  ].filter(Boolean);
  linhasAud.forEach((l,i)=>doc.text(l,MX,y+2+i*5));
  y+=linhasAud.length*5+16;
  doc.setDrawColor(...COR.texto);doc.setLineWidth(0.3);
  doc.line(MX,y,MX+70,y);doc.line(PW-MX-70,y,PW-MX,y);
  doc.setFontSize(7.5);doc.setTextColor(...COR.suave);
  doc.text('Responsável — Vegas Vigilância',MX,y+4);doc.text('Assinatura',PW-MX-70,y+4);
  _rod(doc,PW,PH,MX,1);
  const nome=`Extra_${(reg.numero||'reg')}.pdf`;
  if(baixar)doc.save(nome);
  return{doc,nome};
}

/* ---------- PDF de RELATÓRIO (vários registros) ---------- */
function pdfRelatorio(registros,meta,baixar){
  const{jsPDF}=window.jspdf;const doc=new jsPDF('l','mm','a4'); // paisagem p/ tabela
  const PW=297,PH=210,MX=12;let y=32,pag=1;
  _cab(doc,PW,MX,'RELATÓRIO DE FOLGAS E EXTRAS',meta.periodo||'');
  // subtítulo com filtros
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(...COR.suave);
  doc.text(meta.subtitulo||'',MX,y);y+=6;

  const cols=[
    {t:'Nº',w:30},{t:'Data',w:20},{t:'Funcionário',w:44},{t:'Função',w:26},
    {t:'Posto',w:34},{t:'Turno',w:26},{t:'Horas',w:14},{t:'Tipo',w:28},{t:'Status',w:28},{t:'Valor',w:22}
  ];
  function cabTab(){
    doc.setFillColor(...COR.grafite);doc.rect(MX,y,PW-2*MX,7,'F');
    doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(255,255,255);
    let x=MX+2;cols.forEach(c=>{doc.text(c.t.toUpperCase(),x,y+4.7);x+=c.w;});
    y+=7;
  }
  cabTab();
  doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(...COR.texto);
  let totalHoras=0,totalEst=0,totalAprov=0,totalPago=0;
  registros.forEach((r,i)=>{
    if(y>PH-24){_rod(doc,PW,PH,MX,pag);doc.addPage('l');pag++;y=20;_cab(doc,PW,MX,'RELATÓRIO DE FOLGAS E EXTRAS',meta.periodo||'');y=32;cabTab();doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(...COR.texto);}
    if(i%2===0){doc.setFillColor(...COR.cinza);doc.rect(MX,y,PW-2*MX,6.5,'F');}
    let x=MX+2;
    const vals=[r.numero,dataBRQualquer(r.data),r.funcionario,r.funcao,r.posto,
      (r.entrada||'')+'-'+(r.saida||''),(r.horas_texto||(r.horas||0)+'h'),(r.tipos||[]).join(','),r.status,(r.valor?('R$'+r.valor):'—')];
    cols.forEach((c,ci)=>{const txt=doc.splitTextToSize(String(vals[ci]==null?'':vals[ci]),c.w-2)[0]||'';doc.text(txt,x,y+4.4);x+=c.w;});
    y+=6.5;
    totalHoras+=(+r.horas||0);
    totalEst+=parseFloat(String(r.valor||'0').replace(',','.'))||0;
    if(r.status==='Aprovado'||r.status==='Pago')totalAprov+=parseFloat(String(r.valor_aprovado||r.valor||'0').replace(',','.'))||0;
    if(r.status==='Pago')totalPago+=parseFloat(String(r.valor_aprovado||r.valor||'0').replace(',','.'))||0;
  });
  y+=4;
  doc.setDrawColor(...COR.linha);doc.line(MX,y,PW-MX,y);y+=6;
  doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.setTextColor(...COR.texto);
  doc.text(`Total de registros: ${registros.length}`,MX,y);
  doc.text(`Total de horas: ${totalHoras.toFixed(1)}h`,MX+70,y);
  doc.text(`Estimado: R$ ${totalEst.toFixed(2)}`,MX+140,y);
  doc.text(`Aprovado: R$ ${totalAprov.toFixed(2)}`,MX+200,y);
  y+=6;doc.text(`Pago: R$ ${totalPago.toFixed(2)}`,MX+200,y);
  _rod(doc,PW,PH,MX,pag);
  const nome=`Relatorio_Vegas_${(meta.periodo||'').replace(/[^\w]+/g,'_')}.pdf`;
  if(baixar)doc.save(nome);
  return{doc,nome};
}
