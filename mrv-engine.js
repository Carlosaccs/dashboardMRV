let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

// MAPEAMENTO REVISADO PARA A TABELA "Y"
const COL = {
    ID: 0,
    CATEGORIA: 1,
    ORDEM: 2,
    NOME_CURTO: 3,
    NOME_FULL: 4,
    ESTOQUE: 5,
    END: 6,
    PRECO: 7,
    ENTREGA: 8,
    P_DE: 9,
    P_ATE: 10,
    OBRA: 11,
    DICA: 12,
    DESC_LONGA: 13,
    BK_CLI: 20 // Coluna U (21ª coluna)
};

async function iniciarApp() {
    await carregarPlanilha();
}

async function carregarPlanilha() {
    const SHEET_ID = "15V194P2JPGCCPpCTKJsib8sJuCZPgtbNb-rtgNaLS7E";
    const URL_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
    
    try {
        const response = await fetch(`${URL_CSV}&v=${new Date().getTime()}`);
        const texto = await response.text();
        const linhas = texto.split(/\r?\n/).filter(l => l.trim() !== "");
        
        DADOS_PLANILHA = linhas.slice(1).map(linha => {
            // Regex para lidar com vírgulas dentro de aspas na planilha
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
            return {
                id_path: c[COL.ID]?.toLowerCase() || "",
                categoria: (c[COL.CATEGORIA] || "RESIDENCIAL").toUpperCase(),
                ordem: parseInt(c[COL.ORDEM]) || 999,
                nome: c[COL.NOME_CURTO] || "Sem Nome",
                nomeFull: c[COL.NOME_FULL] || "",
                estoque: c[COL.ESTOQUE] || "",
                endereco: c[COL.END] || "",
                preco: c[COL.PRECO] || "",
                entrega: c[COL.ENTREGA] || "",
                plantas: (c[COL.P_DE] && c[COL.P_ATE]) ? `De ${c[COL.P_DE]} a ${c[COL.P_ATE]}` : "Consulte",
                obra: c[COL.OBRA] || "0",
                dica: c[COL.DICA] || "",
                descricaoLonga: c[COL.DESC_LONGA] || "",
                book: limparLinkDrive(c[COL.BK_CLI])
            };
        }).filter(i => i.nome !== "Sem Nome");

        if (typeof gerarListaLateral === 'function') gerarListaLateral();
        desenharMapas();
    } catch (e) { 
        console.error("Erro crítico na carga:", e); 
    }
}

function obterHtmlEstoque(valor, cat) {
    if (cat === 'COMPLEXO') return "";
    if (!valor || valor === "0" || valor === "") return `<span class="badge-estoque" style="color:#666">CONSULTAR</span>`;
    const n = parseInt(valor);
    if (valor.toUpperCase() === "VENDIDO" || n === 0) return `<span class="badge-estoque" style="color:#999">VENDIDO</span>`;
    if (!isNaN(n) && n < 6) return `<span class="badge-estoque" style="color:#e31010;">SÓ ${valor} UN!</span>`;
    return `<span class="badge-estoque">RESTAM ${valor} UN.</span>`;
}

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    if (!painel) return;

    document.querySelectorAll('.btRes').forEach(b => b.classList.remove('ativo'));
    const btnEsq = document.getElementById(`btn-esq-${selecionado.nome.replace(/[^a-zA-Z0-9]/g, '-')}`);
    if (btnEsq) btnEsq.classList.add('ativo');

    let html = `<div class="vitrine-topo">${selecionado.nomeFull || selecionado.nome}</div>`;

    if (selecionado.categoria === 'COMPLEXO') {
        html += `
            <div style="padding-top:10px;">
                <div class="info-box" style="background:#fff; border: 1px solid #ddd; line-height: 1.6;">
                    <label style="color:var(--mrv-verde); margin-bottom:8px; font-size:0.65rem; display:block;">SOBRE O COMPLEXO</label>
                    <p style="font-size:0.8rem; color:#444; text-align:justify; margin:0;">${selecionado.descricaoLonga || "Descrição em breve."}</p>
                </div>
                ${selecionado.book ? `<a href="${selecionado.book}" target="_blank" class="btRes" style="background:var(--mrv-verde); color:white; justify-content:center; font-weight:bold; margin-top:15px; border:none; display:flex;">📄 Ver Apresentação</a>` : ""}
            </div>`;
    } else {
        html += `
            <div style="padding-top:10px;">
                <div class="btRes ativo" style="cursor:default; margin-bottom:10px; background:white !important; color:var(--mrv-laranja) !important; border:1px solid var(--mrv-laranja) !important; display:flex; justify-content:space-between; align-items:center;">
                    <strong>Estoque Atual:</strong> ${obterHtmlEstoque(selecionado.estoque, selecionado.categoria)}
                </div>
                <p style="font-size:0.65rem; color:#666; margin-bottom:8px;">📍 ${selecionado.endereco}</p>
                <div class="ficha-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
                    <div class="info-box"><label>💰 Preço</label><span>${selecionado.preco}</span></div>
                    <div class="info-box"><label>🔑 Entrega</label><span>${selecionado.entrega}</span></div>
                    <div class="info-box"><label>📐 Plantas</label><span>${selecionado.plantas}</span></div>
                    <div class="info-box"><label>🏗️ Obra</label><span>${selecionado.obra}%</span></div>
                </div>
                <div class="info-box" style="background:#fff5e6; margin-top:10px; border-left: 3px solid var(--mrv-laranja);">
                    <label style="color:#d67e00; display:block; margin-bottom:4px;">💡 Dica do Corretor</label>
                    <p style="font-size:0.72rem; margin:0;">${selecionado.dica}</p>
                </div>
                ${selecionado.book ? `<a
