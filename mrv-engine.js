let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

// 1. NOVO MAPEAMENTO DE COLUNAS (Baseado na Planilha DashboardMRV_SP_2)
const COL = {
    ID: 0, TIPO: 1, NOME: 2, ESTOQUE: 3, END: 4, BAIRRO: 5, CIDADE: 6,
    ENTREGA: 7, PRECO: 8, P_DE: 9, P_ATE: 10, OBRA: 11, DICA: 12,
    BK_CLI: 19, BK_COR: 20, LOC: 34, IMPLANT: 35 // Confirmar se LOC e IMPLANT são 34 e 35 na nova contagem
};

async function iniciarApp() { await carregarPlanilha(); }

async function carregarPlanilha() {
    // Certifique-se de que esta URL é a da planilha "DashboardMRV_SP_2" publicada em CSV
    const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzECvkefpM6aWy0IacqqI6l84_ti6zS1lSjcrgL0J4OcrtWZLb63sh7U1ZTQ4nsqDMeTU5ykl8xtDe/pub?output=csv";
    
    try {
        const response = await fetch(`${URL_CSV}&v=${new Date().getTime()}`);
        const texto = await response.text();
        const linhas = texto.split(/\r?\n/).filter(l => l.trim() !== "");
        
        DADOS_PLANILHA = linhas.slice(1).map(linha => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
            
            return {
                id_path: c[COL.ID]?.toLowerCase(),
                tipo: c[COL.TIPO]?.toUpperCase() || "R", // R = Residencial, L = Lançamento, N = Nome de Grupo
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
                materiais: [
                    { rotulo: "📄 Book Cliente", link: limparLinkDrive(c[COL.BK_CLI]) },
                    { rotulo: "🔑 Book Corretor", link: limparLinkDrive(c[COL.BK_COR]) },
                    { rotulo: "📍 Localização", link: limparLinkDrive(c[COL.LOC]) },
                    { rotulo: "🏗️ Implantação", link: limparLinkDrive(c[COL.IMPLANT]) }
                ]
            };
        }).filter(i => i.nome);

        if (typeof gerarListaLateral === 'function') gerarListaLateral();
        desenharMapas();
    } catch (e) { console.error("Erro na carga:", e); }
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
        let clk = interativo ? (p.id.toLowerCase() === 'grandesaopaulo' && mapaAtivo === 'INTERIOR' ? `onclick="trocarMapas()"` : `onclick="cliqueNoMapa('${p.id}', '${p.name}', ${temMRV})"`) : "";
        const hvr = interativo ? `onmouseover="hoverNoMapa('${p.name}')" onmouseout="resetTitulo()"` : "";
        return `<path id="${id}-${p.id}" name="${p.name}" d="${p.d}" class="${temMRV && interativo ? 'commrv' : ''}" ${clk} ${hvr}></path>`;
    }).join('');
    const zoom = interativo ? 'scale(1.2)' : 'scale(0.9)';
    container.innerHTML = `<svg viewBox="${dados.viewBox}" style="transform: ${zoom}; transform-origin: center;"><g transform="${dados.transform || ''}">${pathsHtml}</g></svg>`;
    if (!interativo) { container.onclick = trocarMapas; container.style.cursor = "pointer"; }
}

function hoverNoMapa(n) { document.getElementById('cidade-titulo').innerText = n; }
function resetTitulo() { document.getElementById('cidade-titulo').innerText = nomeSelecionado; }

function cliqueNoMapa(id, nome, temMRV) {
    if (!temMRV) return; 
    nomeSelecionado = nome;
    comandoSelecao(id, nome, 'mapa');
}

function comandoSelecao(idPath, nomePath, fonte) {
    const estaGSP = MAPA_GSP.paths.some(p => p.id.toLowerCase() === idPath.toLowerCase());
    if ((estaGSP && mapaAtivo !== 'GSP') || (!estaGSP && mapaAtivo !== 'INTERIOR')) {
        mapaAtivo = estaGSP ? 'GSP' : 'INTERIOR';
        desenharMapas();
    }
    setTimeout(() => {
        const el = document.getElementById(`caixa-a-${idPath}`);
        if (el) { if (pathSelecionado) pathSelecionado.classList.remove('path-ativo'); el.classList.add('path-ativo'); pathSelecionado = el; }
    }, 50);
    nomeSelecionado = nomePath;
    document.getElementById('cidade-titulo').innerText = nomePath;
    const imovs = DADOS_PLANILHA.filter(d => d.id_path === idPath.toLowerCase());
    if (imovs.length > 0) {
        const sel = (fonte && fonte.nome) ? fonte : imovs.sort((a,b) => a.nome.localeCompare(b.nome))[0];
        montarVitrine(sel, imovs, nomePath);
    }
}

function montarVitrine(sel, lista, regiao) {
    const outros = lista.filter(i => i.nome !== sel.nome);
    document.querySelectorAll('.btRes').forEach(b => b.classList.remove('ativo'));
    const bE = document.getElementById(`btn-esq-${sel.nome.replace(/[^a-zA-Z0-9]/g, '-')}`);
    if (bE) bE.classList.add('ativo');

    const botoesMateriais = sel.materiais.map(m => {
        if (!m.link || m.link.length < 15) return "";
        return `<a href="${m.link}" target="_blank" class="btRes" style="background:var(--mrv-verde); color:white; justify-content:center; font-weight:bold; margin-top:5px; border:none; height: 32px; font-size:0.65rem;">${m.rotulo}</a>`;
    }).join('');

    document.getElementById('ficha-tecnica').innerHTML = `
        <div class="vitrine-topo">MRV em ${regiao}</div>
        <div class="container-outros">
            ${outros.map(o => `<button class="btRes" onclick="navegarVitrine('${o.nome}', '${regiao}')"><strong>${o.nome}</strong> ${obterHtmlEstoque(o.estoque, o.tipo)}</button>`).join('')}
        </div>
        <div class="destaque-vitrine">
            <h2>${sel.nome}</h2>
            <div style="display:inline; margin-left:10px;">${obterHtmlEstoque(sel.estoque, sel.tipo)}</div>
        </div>
        <p style="font-size:0.7rem; color:#444; margin-bottom:8px; font-weight: 500;">📍 ${sel.endereco}</p>
        <div class="ficha-grid">
            <div class="info-box"><label>💰 Preço</label><span>${sel.preco}</span></div>
            <div class="info-box"><label>🔑 Entrega</label><span>${sel.entrega}</span></div>
            <div class="info-box"><label>📐 Plantas</label><span>${sel.plantas}</span></div>
            <div class="info-box"><label>🏗️ Obra</label><span>${sel.obra}%</span></div>
        </div>
        <div class="info-box" style="background:#fff5e6; border-left: 4px solid var(--mrv-laranja);">
            <label style="color:#d67e00;">DICA</label>
            <p style="font-size:0.7rem; line-height: 1.2;">${sel.dica}</p>
        </div>
        <div style="margin-top:10px;">
            <p style="font-size:0.55rem; font-weight:bold; color:#999; margin-bottom:4px; text-transform:uppercase;">Materiais:</p>
            ${botoesMateriais}
        </div>
    `;
}

function navegarVitrine(n, r) { const imov = DADOS_PLANILHA.find(i => i.nome === n); const lst = DADOS_PLANILHA.filter(i => i.id_path === imov.id_path); montarVitrine(imov, lst, r); }

// 2. NOVA REGRA PARA LANÇAMENTOS (L)
function obterHtmlEstoque(v, t) {
    if (t === 'N') return ""; // Nome do Grupo
    if (t === 'L') return `<span class="badge-estoque" style="color:var(--mrv-laranja); border-color:var(--mrv-laranja);">LANÇAMENTO</span>`;
    
    const n = parseInt(v);
    if (isNaN(n) || n === 0 || v === "VENDIDO") return `<span class="badge-estoque" style="color:#999; text-decoration: line-through;">VENDIDO</span>`;
    if (n < 6) return `<span class="badge-estoque" style="color:#e31010;">SÓ ${v} UN!</span>`;
    
    return `<span class="badge-estoque" style="color:#666;">${v} UN.</span>`;
}

function limparLinkDrive(url) {
    if (!url || !url.includes('drive.google.com')) return url;
    const match = url.match(/\/d\/(.+?)\/|\/d\/(.+?)$|id=(.+?)(&|$)/);
    return match ? `https://drive.google.com/file/d/${match[1]||match[2]||match[3]}/preview` : url;
}

function trocarMapas() { mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP'; limparSelecao(); desenharMapas(); }

function limparSelecao() {
    pathSelecionado = null; nomeSelecionado = "";
    document.querySelectorAll('.btRes').forEach(b => b.classList.remove('ativo'));
    document.getElementById('cidade-titulo').innerText = "";
    document.getElementById('ficha-tecnica').innerHTML = `<div style="text-align:center; color:#ccc; margin-top:100px;"><p style="font-size:30px;">📍</p><p>Selecione uma região verde no mapa.</p></div>`;
}
