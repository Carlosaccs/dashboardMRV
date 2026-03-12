let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

// Mapeamento fixo das colunas conforme seu print
const COL = {
    ID: 0, CATEGORIA: 1, ORDEM: 2, NOME: 3, NOME_FULL: 4, 
    ESTOQUE: 5, ENDERECO: 6, TIPOLOGIAS: 7, ENTREGA: 8, 
    OBRA: 11, DOCUMENTOS: 15, DICA: 16, DESC_LONGA: 17, BK_CLI: 24
};

async function iniciarApp() {
    try {
        if (typeof MAPA_GSP !== 'undefined') desenharMapas();
        await carregarPlanilha();
    } catch (err) { console.error("Erro fatal:", err); }
}

async function carregarPlanilha() {
    const SHEET_ID = "15V194P2JPGCCPpCTKJsib8sJuCZPgtbNb-rtgNaLS7E";
    const URL_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0&v=${new Date().getTime()}`;
    
    try {
        const response = await fetch(URL_CSV);
        const texto = await response.text();
        const linhas = texto.split(/\r?\n/); // Divisão simples de linhas

        DADOS_PLANILHA = linhas.slice(1).map(linha => {
            // Regex para separar colunas respeitando aspas
            const colunas = linha.split(/,(?=(?:(?:[^"]*"){2})*[^ Chin]*$)/).map(c => c.replace(/^"|"$/g, '').trim());

            if (!colunas[COL.NOME]) return null;

            const categoria = (colunas[COL.CATEGORIA] || "").toUpperCase();
            const ehComplexo = categoria.includes("COMPLEXO") || (colunas[COL.NOME].toUpperCase().includes("GRAND PRIX"));

            return {
                id_path: (colunas[COL.ID] || "interlagos").toLowerCase().replace(/\s/g, ''),
                tipo: ehComplexo ? 'N' : 'R',
                ordem: parseInt(colunas[COL.ORDEM]) || 999,
                nome: colunas[COL.NOME],
                endereco: colunas[COL.ENDERECO] || "Consulte endereço",
                estoque: colunas[COL.ESTOQUE] || "0",
                entrega: colunas[COL.ENTREGA] || "Sob consulta",
                preco: colunas[COL.TIPOLOGIAS] || "Consulte",
                p_de: colunas[COL.TIPOLOGIAS] || "-",
                obra: colunas[COL.OBRA] || "0",
                documentos: colunas[COL.DOCUMENTOS] || "",
                dica: colunas[COL.DICA] || "",
                descLonga: colunas[COL.DESC_LONGA] || "",
                book: colunas[COL.BK_CLI] || "#"
            };
        }).filter(item => item !== null);

        console.log("Imóveis carregados:", DADOS_PLANILHA.length);
        DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);
        
        if (typeof gerarListaLateral === 'function') gerarListaLateral();
        desenharMapas();
    } catch (e) { 
        console.error("Erro ao ler CSV:", e);
        document.body.innerHTML += "<div style='color:red; position:fixed; top:0;'>Erro ao carregar dados da planilha.</div>";
    }
}

// Funções de clique e mapa (essenciais para funcionar)
function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    if (!container || !dados) return;
    const pathsHtml = dados.paths.map(p => {
        const idPathNormalizado = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idPathNormalizado);
        const classe = (temMRV || p.id === "grandesaopaulo") && interativo ? 'commrv' : '';
        const clique = interativo ? (p.id === "grandesaopaulo" ? `onclick="trocarMapas()"` : `onclick="cliqueNoMapa('${p.id}', '${p.name}', ${temMRV})"`) : "";
        return `<path id="${id}-${p.id}" name="${p.name}" d="${p.d}" class="${classe}" ${clique}></path>`;
    }).join('');
    container.innerHTML = `<svg viewBox="${dados.viewBox}"><g>${pathsHtml}</g></svg>`;
}

function desenharMapas() {
    renderizarNoContainer('caixa-a', (mapaAtivo === 'GSP' ? MAPA_GSP : MAPA_INTERIOR), true);
    renderizarNoContainer('caixa-b', (mapaAtivo === 'GSP' ? MAPA_INTERIOR : MAPA_GSP), false);
}

function cliqueNoMapa(id, nome, temMRV) { if (temMRV) comandoSelecao(id, nome); }

function comandoSelecao(idPath, nomePath, fonte) {
    const imoveis = DADOS_PLANILHA.filter(d => d.id_path === idPath.toLowerCase().replace(/\s/g, ''));
    if (imoveis.length > 0) {
        const selecionado = fonte || imoveis[0];
        document.getElementById('cidade-titulo').innerText = nomePath;
        montarVitrine(selecionado, imoveis, nomePath);
    }
}

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    const listaSuperior = listaDaCidade.filter(i => i.nome !== selecionado.nome);
    
    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao.toUpperCase()}</div><div style="margin-bottom:10px;">${listaSuperior.map(item => {
        const classe = item.tipo === 'N' ? 'separador-complexo-btn' : 'btRes';
        return `<button class="${classe}" onclick="navegarVitrine('${item.nome}', '${nomeRegiao}')"><strong>${item.nome}</strong></button>`;
    }).join('')}</div>`;
    
    if (selecionado.tipo === 'N') {
        html += `<div class="box-argumento" style="background:#f9f9f9;"><label>Sobre o Complexo</label><p>${selecionado.descLonga}</p></div>`;
    } else {
        html += `<table class="tabela-mrv"><thead><tr><th>PLANTA</th><th>PREÇO</th></tr></thead><tbody><tr><td>${selecionado.p_de}</td><td>${selecionado.preco}</td></tr></tbody></table>`;
    }
    painel.innerHTML = html;
}

function navegarVitrine(nome, nomeRegiao) {
    const imovel = DADOS_PLANILHA.find(i => i.nome === nome);
    if (imovel) comandoSelecao(imovel.id_path, nomeRegiao, imovel);
}

function trocarMapas() { 
    mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP'; 
    desenharMapas(); 
}

iniciarApp();
