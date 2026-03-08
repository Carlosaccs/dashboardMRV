let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

// MAPEAMENTO BASEADO NA SUA PLANILHA (image_5ae96f.jpg)
const COL = {
    ID: 0,          // Coluna A: ID_PATH
    TIPO: 1,        // Coluna B: CATEGORIA
    ORDEM: 2,       // Coluna C: ORDEM
    NOME: 3,        // Coluna D: NOME_CURTO (O que vai no botão)
    NOME_FULL: 4,   // Coluna E: NOME_FULL (O que vai no título verde)
    ESTOQUE: 5,     // Coluna F: ESTOQUE
    END: 6,         // Coluna G: ENDERECO
    PRECO: 7,       // Coluna H: PRECO
    ENTREGA: 8,     // Coluna I: ENTREGA
    P_DE: 9,        // Coluna J: PLANTAS_DE
    P_ATE: 10,      // Coluna K: PLANTAS_ATE
    OBRA: 11,       // Coluna L: STATUS_OBRA
    DICA: 12,       // Coluna M: DICA_CURTA
    BK_CLI: 20      // Coluna U: BOOK_CLIENTE
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
            // Esta regex separa por vírgula, mas mantém o que está entre aspas intacto
            const colunas = linha.match(/(".*?"|[^",\r\n]+)(?=\s*,|\s*$)/g) || [];
            const c = colunas.map(v => v.trim().replace(/^"|"$/g, ''));
            
            const nomeCurto = c[COL.NOME] || "";

            return {
                id_path: c[COL.ID]?.toLowerCase() || "",
                tipo: (c[COL.TIPO] === 'COMPLEXO' || c[COL.TIPO] === 'N') ? 'N' : 'R',
                ordem: parseInt(c[COL.ORDEM]) || 999,
                nome: nomeCurto,
                nomeFull: c[COL.NOME_FULL] || nomeCurto,
                estoque: c[COL.ESTOQUE] || "",
                endereco: c[COL.END] || "",
                cidade: c[COL.ID] ? c[COL.ID].toUpperCase() : "", 
                entrega: c[COL.ENTREGA] || "",
                preco: c[COL.PRECO] || "",
                plantas: (c[COL.P_DE] || c[COL.P_ATE]) ? `De ${c[COL.P_DE]} a ${c[COL.P_ATE]}` : "Consulte",
                obra: c[COL.OBRA] || "0",
                dica: c[COL.DICA] || "",
                book: limparLinkDrive(c[COL.BK_CLI] || "")
            };
        }).filter(i => i.id_path !== "" && i.nome.length > 0 && i.nome.length < 45); // Descarta nomes gigantes que são erros

        DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);

        if (typeof gerarListaLateral === 'function') gerarListaLateral();
        desenharMapas();
    } catch (e) { console.error("Erro no processamento:", e); }
}

function obterHtmlEstoque(valor, tipo) {
    if (tipo === 'N') return "";
    const cleanVal = valor ? valor.toString().toUpperCase().trim() : "";
    if (cleanVal === "" || cleanVal === "NULL" || cleanVal === "CONSULTAR") 
        return `<span class="badge-estoque" style="color:#666">CONSULTAR</span>`;
    if (cleanVal === "VENDIDO" || cleanVal === "0") 
        return `<span class="badge-estoque" style="color:#999">VENDIDO</span>`;
    
    const n = parseInt(valor);
    if (!isNaN(n)) {
        if (n < 6 && n > 0) return `<span class="badge-estoque" style="color:#e31010;">SÓ ${n} UN!</span>`;
        return `<span class="badge-estoque">RESTAM ${n} UN.</span>`;
    }
    return `<span class="badge-estoque">${valor}</span>`;
}

// ... (Manter funções de mapa, trocarMapas e renderizarNoContainer do código anterior)

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    const outros = listaDaCidade.filter(i => i.nome !== selecionado.nome && i.tipo !== 'N');
    
    document.querySelectorAll('.btRes').forEach(b => b.classList.remove('ativo'));
    const idLimpo = selecionado.nome.replace(/[^a-zA-Z0-9]/g, '-');
    const btnEsq = document.getElementById(`btn-esq-${idLimpo}`);
    if (btnEsq) btnEsq.classList.add('ativo');

    painel.innerHTML = `
        <div class="vitrine-topo notranslate">${selecionado.nomeFull}</div>
        <div style="margin-bottom:15px;">
            ${outros.map(o => `<button class="btRes notranslate" onclick="navegarVitrine('${o.nome}', '${nomeRegiao}')"><strong class="notranslate">${o.nome}</strong> ${obterHtmlEstoque(o.estoque, o.tipo)}</button>`).join('')}
        </div>
        <div style="border-top:1px solid #eee; padding-top:15px;">
            <div class="btRes ativo notranslate" style="cursor:default; margin-bottom:10px;">
                <strong class="notranslate">${selecionado.nome}</strong> ${obterHtmlEstoque(selecionado.estoque, selecionado.tipo)}
            </div>
            <p style="font-size:0.7rem; color:#666; margin-bottom:10px;">📍 ${selecionado.endereco}</p>
            <div class="ficha-grid">
                <div class="info-box"><label>💰 Preço</label><span>${selecionado.preco}</span></div>
                <div class="info-box"><label>🔑 Entrega</label><span>${selecionado.entrega}</span></div>
                <div class="info-box"><label>📐 Plantas</label><span>${selecionado.plantas}</span></div>
                <div class="info-box"><label>🏗️ Obra</label><span>${selecionado.obra}%</span></div>
            </div>
            <div class="info-box" style="background:#fff5e6; margin-top:10px; border-left: 3px solid var(--mrv-laranja);">
                <label style="color:#d67e00;">💡 Dica do Corretor</label>
                <p style="font-size:0.75rem;">${selecionado.dica}</p>
            </div>
            <a href="${selecionado.book}" target="_blank" class="btRes" style="background:var(--mrv-verde); color:white; justify-content:center; font-weight:bold; margin-top:15px; border:none;">📄 Book Cliente</a>
        </div>`;
}

// Funções restantes
function navegarVitrine(nome, nomeRegiao) {
    const imovel = DADOS_PLANILHA.find(i => i.nome === nome);
    const lista = DADOS_PLANILHA.filter(i => i.id_path === imovel.id_path);
    montarVitrine(imovel, lista, nomeRegiao);
}
function limparLinkDrive(url) {
    if (!url || !url.includes('drive.google.com')) return url;
    const match = url.match(/\/d\/(.+?)\/|\/d\/(.+?)$|id=(.+?)(&|$)/);
    return match ? `https://drive.google.com/file/d/${match[1]||match[2]||match[3]}/preview` : url;
}
