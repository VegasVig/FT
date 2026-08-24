/* ============================================================
   CONFIGURAÇÃO — Vegas Gestão de Folgas e Extras
   >>> Cole a URL do Google Apps Script em API_URL após publicar.
       Enquanto vazio, roda em MODO DEMONSTRAÇÃO (localStorage). <<<
   ============================================================ */
const VEGAS_CONFIG = {
  API_URL: "",  // ex.: "https://script.google.com/macros/s/AKfy.../exec"

  EMPRESA: "VEGAS VIGILÂNCIA",
  PREFIXO_REG: "EXT",          // EXT-2026-000001
  LOGO_BRANCA: "assets/logo-vegas-branca.png",
  LOGO_ESCURA: "assets/logo-vegas-escura.png",

  STATUS: ["Rascunho","Aguardando aprovação","Aprovado","Recusado","Pago","Cancelado"],
  TIPOS_COBERTURA: ["Extra","Folga trabalhada","Cobertura","Substituição","Ponto fechado","Outro"],
  FUNCOES: ["Vigilante","Vigilante Líder","Supervisor","Freelance","Outros"],
  MOTIVOS: ["Sem efetivo","Falta de funcionário","Reciclagem","Afastamento","Férias","Folga","Falta injustificada","Atestado","Outro"],
  STATUS_FUNC: ["Ativo","Inativo","Férias","Afastado"],

  // Papéis de acesso e permissões
  PAPEIS: {
    "Administrador": { tudo:true },
    "Supervisor":   { criar:true, consultar:true, coberturas:true, relatorios:true },
    "Consulta":     { consultar:true }
  }
};
VEGAS_CONFIG.MODO_DEMO = !VEGAS_CONFIG.API_URL;
