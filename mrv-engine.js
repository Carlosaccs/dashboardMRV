let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

// ORDEM DA PLANILHA INFORMADA PELO USUÁRIO
const COL = {
    ID: 0, TIPO: 1, NOME: 2, ESTOQUE: 3, END: 4, BAIRRO: 5, CIDADE: 6,
    ENTREGA: 7, PRECO: 8, P_DE: 9, P_ATE: 10, OBRA: 11, DICA: 12, OBS: 13,
    LOC: 14, MOB: 15, LAZER: 16, COM: 17, SAUDE: 18,
    BK_CLI: 19, BK_COR: 20, VID1: 21, VID2: 22,
    MAPA_LOC: 34, MAPA_IMP: 35
};

async function iniciarApp() {
    await carregarPlanilha();
}

async function carregarPlanilha() {
    const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzECvkefpM6aWy0IacqqI6l84_ti6zS1lSjcrgL0J4OcrtWZLb63sh7U1ZTQ4nsqDMeTU5ykl8xtDe/pub?output=csv";
    try {
        const response = await fetch(`${URL_CSV}&v=${new Date().getTime()}`);
        const texto = await response.text();
        const linhas = texto.split(/\r?\n/).filter(l => l.trim() !== "");
        
        DADOS_PLANILHA = linhas.slice(1).map(linha => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
            return {
                id_path: c[COL.ID]?.toLowerCase(),
                tipo: c[COL.TIPO],
                nome: c[COL.NOME],
                estoque: c[COL.ESTOQUE],
                endereco: c[COL.END],
                bairro: c[COL.BAIRRO],
                cidade: c[COL.CIDADE],
                entrega: c[COL.ENTREGA],
                preco: c[COL.PRECO],
                plantas: `De ${c[COL.P_DE]} a ${c[COL.P_ATE]}`,
                obra: c[COL.OBRA],
                dica: c[COL.DICA],
                extras: [
                    { lab: "Localização", val: c[COL.LOC] },
                    { lab: "Mobilidade", val: c[COL.MOB] },
                    { lab: "Lazer/Cultura", val: c[COL.LAZER] },
                    { lab: "Comércio", val: c[COL.COM] },
                    { lab: "Saúde/Educação", val: c[COL.SAUDE] }
                ],
                materiais: [
                    { lab: "📄 Book Cliente", url: limparLink(c[COL.BK_CLI]) },
                    { lab: "🔑 Book Corretor", url: limparLink(c[COL.BK_COR]) },
                    { lab: "📍 Localização (Link)", url: limparLink(c[COL.MAPA_LOC]) },
                    { lab: "🏗️ Implantação", url: limparLink(c[COL.MAPA_IMP]) },
                    { lab: "🎬 Vídeo 1", url: limparLink(c[COL.VID1]) }
                ]
            };
        }).filter(i => i.nome);

        gerarListaLateral();
        desenharMapas();
    } catch (e) { console.error("Erro no carregamento:", e); }
}

function desenharMapas() {
    const dC = (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR;
    const dB = (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP;
    renderizarNoContainer('caixa-a', dC, true);
    renderizarNoContainer('caixa-b', dB, false);
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    const pathsHtml = dados.paths.map(p => {
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === p.id.toLowerCase());
        const clk = interativo ? `onclick="cliqueNoMapa('${p.id}', '${p.name}', ${temMRV})"` : `onclick="trocarMapas()"`;
        return `<path id="${id}-${p.id}" d="${p.d}" class="${temMRV && interativo ? 'commrv' : ''}" ${clk}></path>`;
    }).join('');
    container.innerHTML = `<svg viewBox="${dados.viewBox}"><g transform="${dados.transform || ''}">${pathsHtml}</g></svg>`;
}

function cliqueNoMapa(id, nome, temMRV) {
    if (!temMRV) return;
    nomeSelecionado = nome;
    document.getElementById('cidade-titulo').innerText = nome;
    
    if (pathSelecionado) pathSelecionado.classList.remove('path-ativo');
    const el = document.getElementById(`caixa-a-${id}`);
    if (el) { el.classList.add('path-ativo'); pathSelecionado = el; }

    const imoveis = DADOS_PLANILHA.filter(d => d.id_path === id.toLowerCase());
    montarVitrine(imoveis[0], imoveis, nome);
}

function trocarMapas() {
    mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP';
    document.getElementById('ficha-tecnica').innerHTML = "";
    desenharMapas();
}

function montarVitrine(sel, lista, regiao) {
    document.querySelectorAll('.btRes').forEach(b => b.classList.remove('ativo'));
    const bE = document.getElementById(`btn-esq-${sel.nome.replace(/\s+/g, '')}`);
    if (bE) bE.classList.add('ativo');

    let htmlExtras = sel.extras.filter(e => e.val && e.val.length > 2)
        .map(e => `<div class="info-box"><label>${e.lab}</label><span>${e.val}</span></div>`).join('');

    let htmlMateriais = sel.materiais.filter(m => m.url && m.url.length > 10)
        .map(m => `
            <div class="material-row">
                <span class="material-label">${m.lab}</span>
                <div style="display:flex;">
                    <button class="btn-acao btn-abrir" onclick="window.open('${m.url}','_blank')">Abrir</button>
                    <button class="btn-acao btn-copiar" onclick="copiarLink('${m.url}')">Copiar</button>
                </div>
                <div class="preview-box"><iframe src="${m.url}"></iframe></div>
            </div>`).join('');

    document.getElementById('ficha-tecnica').innerHTML = `
        <div class="destaque-vitrine">
            <h2>${sel.nome}</h2>
            <div style="font-size:0.7rem; margin-top:5px;">${obterHtmlEstoque(sel.estoque, sel.tipo)}</div>
        </div>
        <p style="font-size:0.75rem; margin-bottom:10px;">📍 ${sel.endereco} - <strong>${sel.bairro}</strong></p>
        
        <div class="ficha-grid">
            <div class="info-box"><label>💰 Preço</label><span>${sel.preco}</span></div>
            <div class="info-box"><label>🔑 Entrega</label><span>${sel.entrega}</span></div>
            <div class="info-box"><label>📐 Plantas</label><span>${sel.plantas}</span></div>
            <div class="info-box"><label>🏗️ Obra</label><span>${sel.obra}%</span></div>
        </div>

        <div class="info-box" style="background:#fff5e6; border-left:4px solid var(--mrv-laranja);">
            <label style="color:#d67e00;">DICA</label>
            <p style="font-size:0.75rem;">${sel.dica}</p>
        </div>

        <div style="margin-top:15px;">
            ${htmlExtras}
        </div>

        <div style="margin-top:20px;">
            <p style="font-size:0.6rem; font-weight:bold; color:#999; margin-bottom:8px; text-transform:uppercase;">Materiais de Venda</p>
            ${htmlMateriais}
        </div>
    `;
}

function gerarListaLateral() {
    const list = document.getElementById('lista-imoveis');
    list.innerHTML = "";
    DADOS_PLANILHA.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'btRes';
        btn.id = `btn-esq-${item.nome.replace(/\s+/g, '')}`;
        btn.innerHTML = `<strong>${item.nome}</strong> ${obterHtmlEstoque(item.estoque, item.tipo)}`;
        btn.onclick = () => {
            cliqueNoMapa(item.id_path, item.cidade, true);
            montarVitrine(item, DADOS_PLANILHA.filter(d => d.id_path === item.id_path), item.cidade);
        };
        list.appendChild(btn);
    });
}

function obterHtmlEstoque(v, t) {
    if (t === 'N') return "";
    const n = parseInt(v);
    if (n < 6 && n > 0) return `<span style="color:#e31010; font-weight:bold;">SÓ ${v} UN!</span>`;
    if (v === "VENDIDO" || n === 0) return `<span style="color:#999; font-weight:bold;">VENDIDO</span>`;
    return `<span style="color:#666; font-weight:bold;">RESTAM ${v} UN.</span>`;
}

function limparLink(url) {
    if (!url || !url.includes('drive.google.com')) return url;
    const id = url.match(/\/d\/(.+?)\/|\/d\/(.+?)$|id=(.+?)(&|$)/);
    return id ? `https://drive.google.com/file/d/${id[1]||id[2]||id[3]}/preview` : url;
}

function copiarLink(url) {
    navigator.clipboard.writeText(url).then(() => alert("Link copiado para a área de transferência!"));
}

window.onload = iniciarApp;
