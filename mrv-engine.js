let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

// Mapeamento atualizado conforme sua estrutura de colunas
const COL = {
    ID: 0, CATEGORIA: 1, ORDEM: 2, NOME: 3, NOME_FULL: 4, 
    ESTOQUE: 5, END: 6, TIPOLOGIAS: 7, ENTREGA: 8, 
    PL_DE: 9, PL_ATE: 10, OBRA: 11, LIMITADOR: 12, 
    REG: 13, CASA_PAULISTA: 14, DOCUMENTOS: 15, 
    DICA: 16, DESC_LONGA: 17, BK_CLI: 24
};

async function iniciarApp() {
    try {
        if (typeof MAPA_GSP !== 'undefined') desenharMapas();
        await carregarPlanilha();
    } catch (err) { console.error("Erro na inicialização:", err); }
}

async function carregarPlanilha() {
    const SHEET_ID = "15V194P2JPGCCPpCTKJsib8sJuCZPgtbNb-rtgNaLS7E";
    const URL_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0&v=${new Date().getTime()}`;
    
    try {
        const response = await fetch(URL_CSV);
        let texto = await response.text();
        const linhas = [];
        let linhaAtual = "", dentroDeAspas = false;

        for (let i = 0; i < texto.length; i++) {
            const char = texto[i];
            if (char === '"') dentroDeAspas = !dentroDeAspas;
            if ((char === '\n' || char === '\r') && !dentroDeAspas) {
                if (linhaAtual.trim()) linhas.push(linhaAtual);
                linhaAtual = "";
            } else { linhaAtual += char; }
        }

        DADOS_PLANILHA = linhas.slice(1).map(linha => {
            const colunas = [];
            let campo = "", aspas = false;
            for (let i = 0; i < linha.length; i++) {
                const char = linha[i];
                if (char === '"') aspas = !aspas;
                else if (char === ',' && !aspas) { colunas.push(campo.trim()); campo = ""; }
                else { campo += char; }
            }
            colunas.push(campo.trim());

            return {
                id_path: colunas[COL.ID]?.toLowerCase().replace(/\s/g, ''),
                tipo: (colunas[COL.CATEGORIA] || "").toUpperCase().includes('COMPLEXO') ? 'N' : 'R',
                ordem: parseInt(colunas[COL.ORDEM]) || 999,
                nome: colunas[COL.NOME],
                nomeFull: colunas[COL.NOME_FULL],
                estoque: colunas[COL.ESTOQUE],
                endereco: colunas[COL.END],
                tipologias_raw: colunas[COL.TIPOLOGIAS],
                entrega: colunas[COL.ENTREGA],
                plantas_de: colunas[COL.PL_DE],
                plantas_ate: colunas[COL.PL_ATE],
                obra: colunas[COL.OBRA],
                limitador: colunas[COL.LIMITADOR],
                reg: colunas[COL.REG],
                casa_paulista: colunas[COL.CASA_PAULISTA],
                doc: colunas[COL.DOCUMENTOS],
                dica: colunas[COL.DICA],
                descLonga: colunas[COL.DESC_LONGA],
                book: colunas[COL.BK_CLI]
            };
        }).filter(i => i.nome);

        DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);
        desenharMapas();
    } catch (e) { console.error("Erro CSV:", e); }
}

function renderizarTabelaTipologia(textoBruto) {
    if (!textoBruto || textoBruto === "-") return "";
    const linhas = textoBruto.split(';');
    let html = `
    <table class="tabela-precos">
        <thead>
            <tr>
                <th>TIPOLOGIA</th>
                <th class="head-destaque">MENOR PREÇO</th>
                <th>AVALIAÇÃO CAIXA</th>
            </tr>
        </thead>
        <tbody>`;

    linhas.forEach(l => {
        const partes = l.split(',');
        if (partes.length >= 3) {
            const f = (v) => isNaN(v) ? v : parseFloat(v).toLocaleString('pt-br', {style: 'currency', currency: 'BRL', maximumFractionDigits: 0});
            html += `<tr>
                <td>${partes[0].trim()}</td>
                <td class="col-destaque">${f(partes[1].trim())}</td>
                <td>${f(partes[2].trim())}</td>
            </tr>`;
        }
    });
    return html + `</tbody></table>`;
}

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    const listaSuperior = listaDaCidade.filter(i => i.nome !== selecionado.nome);
    const urlMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selecionado.endereco)}`;
    
    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao.toUpperCase()}</div>`;
    html += `<div style="margin-bottom:10px;">${listaSuperior.map(item => `
        <button class="${item.tipo === 'N' ? 'separador-complexo-btn' : 'btRes'}" onclick="navegarVitrine('${item.nome}', '${nomeRegiao}')">
            <strong>${item.nome}</strong> ${item.tipo === 'R' ? `<span class="badge-estoque">RESTAM ${item.estoque} UN.</span>` : ''}
        </button>`).join('')}</div><hr style="border:0; border-top:1px solid #ddd; margin:15px 0;">`;

    if (selecionado.tipo === 'R') {
        html += `
        <div class="faixa-laranja">${selecionado.nomeFull}</div>
        <div class="linha-end"><span>${selecionado.endereco}</span><a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a></div>
        <div class="linha-cards">
            <div class="card-mini"><label>REGIÃO</label><span>${selecionado.reg}</span></div>
            <div class="card-mini"><label>ENTREGA</label><span>${selecionado.entrega}</span></div>
            <div class="card-mini"><label>OBRA</label><span>${selecionado.obra}%</span></div>
        </div>
        <div class="linha-cards">
            <div class="card-half"><label>PLANTAS</label><span>De ${selecionado.plantas_de} até ${selecionado.plantas_ate}</span></div>
            <div class="card-half"><label>ESTOQUE</label><span>restam ${selecionado.estoque} un.</span></div>
        </div>
        <div class="linha-cards">
            <div class="card-half"><label>LIMITADOR</label><span>${selecionado.limitador}</span></div>
            <div class="card-half"><label>CASA PAULISTA</label><span>${selecionado.casa_paulista}</span></div>
        </div>`;

        if (selecionado.doc && selecionado.doc !== "-") html += `<div class="doc-vermelho">${selecionado.doc}</div>`;
        html += renderizarTabelaTipologia(selecionado.tipologias_raw);
        if (selecionado.dica) html += `<div class="box-dica"><label>DICA DO CORRETOR</label><p>${selecionado.dica}</p></div>`;
        html += `<a href="${selecionado.book}" target="_blank" class="btn-book">📄 BOOK CLIENTE</a>`;
    } else {
        // Layout Complexo
        html += `<div class="separador-complexo-btn" style="width:100% !important; margin:0 !important; border-radius:4px 4px 0 0; cursor:default; height:36px !important;">${selecionado.nomeFull}</div>`;
        html += `<div style="padding:10px 0;"><p style="font-size:0.65rem; color:#444; display:flex; justify-content:space-between; align-items:center;"><span>📍 ${selecionado.endereco}</span><a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a></p></div>`;
        html += `<div class="box-dica" style="border-left-color: var(--mrv-verde); background:#f9f9f9; margin-top:0;"><label>Sobre o Complexo</label><p>${selecionado.descLonga}</p></div>`;
    }
    painel.innerHTML = html;
}

// Funções de Mapa (Geral)
function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    if (!container || !dados) return;
    if (!interativo) { container.style.cursor = "pointer"; container.onclick = trocarMapas; }
    const pathsHtml = dados.paths.map(p => {
        const idPath = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idPath);
        const clique = interativo ? `onclick="comandoSelecao('${p.id}', '${p.name}')"` : "";
        const classe = temMRV && interativo ? 'commrv' : '';
        return `<path id="${id}-${p.id}" d="${p.d}" class="${classe}" ${clique}></path>`;
    }).join('');
    container.innerHTML = `<svg viewBox="${dados.viewBox}" preserveAspectRatio="xMidYMid meet"><g transform="${dados.transform || ''}">${pathsHtml}</g></svg>`;
}

function desenharMapas() {
    renderizarNoContainer('caixa-a', (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR, true);
    renderizarNoContainer('caixa-b', (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP, false);
}

function comandoSelecao(idPath, nomePath) {
    const imoveis = DADOS_PLANILHA.filter(d => d.id_path === idPath.toLowerCase().replace(/\s/g, ''));
    if (imoveis.length > 0) {
        nomeSelecionado = nomePath;
        document.getElementById('cidade-titulo').innerText = nomePath;
        montarVitrine(imoveis[0], imoveis, nomePath);
    }
}

function trocarMapas() { mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP'; desenharMapas(); }
function navegarVitrine(nome, reg) { const i = DADOS_PLANILHA.find(x => x.nome === nome); if(i) montarVitrine(i, DADOS_PLANILHA.filter(d => d.id_path === i.id_path), reg); }

iniciarApp();
