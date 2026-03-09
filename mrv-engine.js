let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

// Mapeamento rigoroso das colunas
const COL = {
    ID: 0, CAT: 1, ORD: 2, NOME: 3, FULL: 4, EST: 5, END: 6, PRE: 7, ENT: 8, 
    P_DE: 9, P_ATE: 10, OBR: 11, DOC: 12, DIC: 13, DESC: 14, OBS: 15, 
    LOC: 16, MOB: 17, CUL: 18, COM: 19, SAU: 20, BK: 21
};

async function iniciarApp() {
    try {
        if (typeof MAPA_GSP !== 'undefined') desenharMapas();
        await carregarPlanilha();
    } catch (err) {
        console.error("Falha ao iniciar:", err);
    }
}

async function carregarPlanilha() {
    const SHEET_ID = "15V194P2JPGCCPpCTKJsib8sJuCZPgtbNb-rtgNaLS7E";
    const URL_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
    
    try {
        const response = await fetch(`${URL_CSV}&v=${new Date().getTime()}`);
        const csvText = await response.text();
        
        const linhasString = csvText.split(/\r?\n/);
        DADOS_PLANILHA = linhasString.slice(1).map(linha => {
            const col = parseCSVLine(linha);
            if (col.length < 5) return null;

            return {
                id_path: (col[COL.ID] || "").toLowerCase().replace(/\s/g, ''),
                tipo: (col[COL.CAT] === 'COMPLEXO' || col[COL.CAT] === 'N') ? 'N' : 'R',
                ordem: parseInt(col[COL.ORD]) || 999,
                nome: col[COL.NOME] || "",
                estoque: col[COL.EST] || "",
                endereco: col[COL.END] || "",
                entrega: col[COL.ENT] || "",
                preco: col[COL.PRE] || "",
                plantas: (col[COL.P_DE] || col[COL.P_ATE]) ? `De ${col[COL.P_DE]} a ${col[COL.P_ATE]}` : "Consulte",
                obra: col[COL.OBR] || "0",
                documentos: col[COL.DOC] || "",
                dica: col[COL.DIC] || "",
                obs: col[COL.OBS] || "",
                localizacao: col[COL.LOC] || "",
                mobilidade: col[COL.MOB] || "",
                cultura: col[COL.CUL] || "",
                comercio: col[COL.COM] || "",
                saude: col[COL.SAU] || "",
                descLonga: col[COL.DESC] || "",
                book: limparLinkDrive(col[COL.BK] || "")
            };
        }).filter(i => i !== null && i.nome !== "");

        DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);
        
        // Dispara a montagem da interface
        gerarListaLateral();
        desenharMapas(); 

    } catch (e) { 
        console.error("Erro CSV:", e);
    }
}

function parseCSVLine(text) {
    const res = [];
    let cell = '';
    let inQuote = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') inQuote = !inQuote;
        else if (c === ',' && !inQuote) {
            res.push(cell.trim());
            cell = '';
        } else cell += c;
    }
    res.push(cell.trim());
    return res;
}

function gerarListaLateral() {
    const container = document.querySelector('.sidebar-esq');
    if (!container) return;
    
    container.innerHTML = DADOS_PLANILHA.map(item => {
        if (item.tipo === 'N') {
            return `<button class="separador-complexo-btn" onclick="comandoSelecao('${item.id_path}', '${item.nome}', true)">${item.nome.toUpperCase()}</button>`;
        }
        return `<button class="btRes" onclick="comandoSelecao('${item.id_path}', '${item.nome}', true, '${item.nome}')">
                    <strong>${item.nome}</strong> ${obterHtmlEstoque(item.estoque, item.tipo)}
                </button>`;
    }).join('');
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    if (!container || !dados) return;

    const pathsHtml = dados.paths.map(p => {
        const idPathNorm = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idPathNorm);
        const isGSP = p.name.toLowerCase().includes("grande são paulo") || p.id.toLowerCase() === "grandesaopaulo";
        const idAttr = isGSP ? 'id="grandesaopaulo"' : `id="${id}-${p.id}"`;
        
        let clique = interativo ? (isGSP ? `onclick="trocarMapas()"` : `onclick="cliqueNoMapa('${p.id}', '${p.name}', ${temMRV})"`) : "";
        const hover = interativo ? `onmouseover="hoverNoMapa('${p.name}')" onmouseout="resetTitulo()"` : "";
        const classe = (temMRV || isGSP) && interativo ? 'commrv' : '';
        
        return `<path ${idAttr} name="${p.name}" d="${p.d}" class="${classe}" ${clique} ${hover}></path>`;
    }).join('');

    container.innerHTML = `<svg viewBox="${dados.viewBox}" style="transform: ${interativo ? 'scale(1.2)' : 'scale(0.9)'}; transform-origin: center;"><g>${pathsHtml}</g></svg>`;
}

function desenharMapas() {
    const cima = (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR;
    const baixo = (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP;
    renderizarNoContainer('caixa-a', cima, true);
    renderizarNoContainer('caixa-b', baixo, false);
}

function cliqueNoMapa(id, nome, temMRV) {
    if (temMRV) comandoSelecao(id, nome);
}

function comandoSelecao(idPath, nomePath, daLista = false, nomeImovel = null) {
    const idBusca = idPath.toLowerCase().replace(/\s/g, '');
    const imoveis = DADOS_PLANILHA.filter(d => d.id_path === idBusca);
    
    if (imoveis.length > 0) {
        let selecionado = (nomeImovel) ? imoveis.find(i => i.nome === nomeImovel) || imoveis[0] : imoveis[0];

        nomeSelecionado = nomePath;
        document.getElementById('cidade-titulo').innerText = nomePath;
        
        if (pathSelecionado) pathSelecionado.classList.remove('path-ativo');
        const el = document.getElementById(`caixa-a-${idPath}`) || document.getElementById('grandesaopaulo');
        if (el) { el.classList.add('path-ativo'); pathSelecionado = el; }
        
        montarVitrine(selecionado, imoveis, nomePath);
    }
}

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    const listaRestante = listaDaCidade.filter(i => i.nome !== selecionado.nome);
    const urlMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selecionado.endereco)}`;

    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao.toUpperCase()}</div><div style="margin-bottom:10px;">`;
    html += listaRestante.map(item => `<button class="${item.tipo === 'N' ? 'separador-complexo-btn' : 'btRes'}" onclick="navegarVitrine('${item.nome}', '${nomeRegiao}')"><strong>${item.nome}</strong> ${obterHtmlEstoque(item.estoque, item.tipo)}</button>`).join('');
    html += `</div><button class="${selecionado.tipo === 'N' ? 'separador-complexo-btn' : 'btRes'} ativo"><strong>${selecionado.nome}</strong> ${obterHtmlEstoque(selecionado.estoque, selecionado.tipo)}</button>`;

    html += `<div style="padding-top:8px;"><p style="font-size:0.68rem; color:#444; margin-bottom:8px; display: flex; align-items: center; justify-content: space-between;"><span>📍 ${selecionado.endereco}</span><a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a></p>`;

    if (selecionado.tipo === 'N') {
        const desc = selecionado.descLonga.split('\n').filter(p => p.trim() !== '').map(p => `<p style="font-size:0.75rem; margin-bottom:10px; text-align:justify;">${p.trim()}</p>`).join('');
        html += `<div style="padding:10px; background:#fdfdfd; border:1px solid #eee; border-radius:4px;">${desc || "Descrição em breve."}</div>`;
    } else {
        html += `<div class="ficha-grid">
            <div class="info-box"><label>Menor Preço</label><span>${selecionado.preco}</span></div>
            <div class="info-box"><label>Entrega</label><span>${selecionado.entrega}</span></div>
            <div class="info-box"><label>Plantas</label><span>${selecionado.plantas}</span></div>
            <div class="info-box"><label>Obra</label><span>${selecionado.obra}%</span></div>
            ${selecionado.documentos ? `<div class="box-documentos"><span>${selecionado.documentos}</span></div>` : ''}
        </div>
        ${selecionado.dica ? `<div class="box-argumento box-dica"><label>DICA:</label><p>${selecionado.dica}</p></div>` : ''}
        ${selecionado.obs ? `<div class="box-argumento box-obs"><label>OBSERVAÇÃO:</label><p>${selecionado.obs}</p></div>` : ''}
        ${selecionado.localizacao ? `<div class="box-argumento box-infra"><label>LOCALIZAÇÃO:</label><p>${selecionado.localizacao}</p></div>` : ''}
        ${selecionado.mobilidade ? `<div class="box-argumento box-infra"><label>MOBILIDADE:</label><p>${selecionado.mobilidade}</p></div>` : ''}
        ${selecionado.cultura ? `<div class="box-argumento box-infra"><label>LAZER E CULTURA:</label><p>${selecionado.cultura}</p></div>` : ''}
        ${selecionado.comercio ? `<div class="box-argumento box-infra"><label>COMÉRCIO:</label><p>${selecionado.comercio}</p></div>` : ''}
        ${selecionado.saude ? `<div class="box-argumento box-infra"><label>SAÚDE E EDUCAÇÃO:</label><p>${selecionado.saude}</p></div>` : ''}
        <a href="${selecionado.book}" target="_blank" class="btRes" style="background:#00713a; color:white; justify-content:center; font-weight:bold; margin-top:12px; border:none; width:100% !important;">📄 BOOK CLIENTE</a>`;
    }
    painel.innerHTML = html + `</div>`;
}

function navegarVitrine(nome, nomeRegiao) {
    const imovel = DADOS_PLANILHA.find(i => i.nome === nome);
    if (imovel) {
        const lista = DADOS_PLANILHA.filter(i => i.id_path === imovel.id_path);
        montarVitrine(imovel, lista, nomeRegiao);
    }
}

function hoverNoMapa(nome) { document.getElementById('cidade-titulo').innerText = nome; }
function resetTitulo() { document.getElementById('cidade-titulo').innerText = nomeSelecionado || "Selecione uma região"; }

function trocarMapas() { 
    mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP'; 
    desenharMapas(); 
    limparSelecao();
}

function limparSelecao() {
    pathSelecionado = null; nomeSelecionado = "";
    document.getElementById('cidade-titulo').innerText = "Selecione uma região";
    document.getElementById('ficha-tecnica').innerHTML = '<div class="vitrine-topo">Aguardando Seleção</div>';
}

function obterHtmlEstoque(valor, tipo) {
    if (tipo === 'N') return "";
    const clean = (valor || "").toString().toUpperCase().trim();
    if (!clean || clean === "NULL") return `<span class="badge-estoque" style="color:#666">CONSULTAR</span>`;
    if (clean === "VENDIDO" || clean === "0") return `<span class="badge-estoque" style="color:#999">VENDIDO</span>`;
    const n = parseInt(valor);
    if (!isNaN(n)) return n < 6 ? `<span class="badge-estoque" style="color:#e31010;">SÓ ${n} UN!</span>` : `<span class="badge-estoque">RESTAM ${n} UN.</span>`;
    return `<span class="badge-estoque">${valor}</span>`;
}

function limparLinkDrive(url) {
    if (!url || !url.includes('drive.google.com')) return url;
    const m = url.match(/\/d\/(.+?)\/|\/d\/(.+?)$|id=(.+?)(&|$)/);
    return m ? `https://drive.google.com/file/d/${m[1]||m[2]||m[3]}/preview` : url;
}
