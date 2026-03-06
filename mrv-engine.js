let DADOS_PLANILHA = [];
let pathSelecionado = null;

const COL = {
    ID: 0, TIPO: 1, NOME: 2, ESTOQUE: 3, END: 4, BAIRRO: 5, CIDADE: 6,
    ENTREGA: 7, PRECO: 8, P_DE: 9, P_ATE: 10, OBRA: 11, DICA: 12, BK_CLI: 19
};

async function iniciarApp() {
    await carregarPlanilha();
    desenharIniciais();
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
                tipo: c[COL.TIPO] || "R",
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
                book: limparLinkDrive(c[COL.BK_CLI])
            };
        }).filter(i => i.nome);
        if (typeof gerarListaLateral === 'function') gerarListaLateral();
    } catch (e) { console.error(e); }
}

function desenhar(idContainer, dadosMapa, interativo) {
    const container = document.getElementById(idContainer);
    if (!container) return;
    const pathsHtml = dadosMapa.paths.map(p => {
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === p.id.toLowerCase() && d.tipo !== 'N');
        // Apenas o mapa interativo recebe cliques e hover
        const acoes = interativo ? `onclick="cliqueNoMapa('${p.id}')"` : "";
        return `<path id="${idContainer}-${p.id}" name="${p.name}" d="${p.d}" class="${temMRV && interativo ? 'commrv' : ''}" ${acoes}></path>`;
    }).join('');
    container.innerHTML = `<svg viewBox="${dadosMapa.viewBox}"><g transform="${dadosMapa.transform || ''}">${pathsHtml}</g></svg>`;
}

function desenharIniciais() {
    if (typeof MAPA_GSP !== 'undefined') desenhar('caixa-a', MAPA_GSP, true);
    if (typeof MAPA_INTERIOR !== 'undefined') desenhar('caixa-b', MAPA_INTERIOR, false);
}

function cliqueNoMapa(idPath) {
    const imoveis = DADOS_PLANILHA.filter(d => d.id_path === idPath.toLowerCase() && d.tipo !== 'N');
    const el = document.getElementById(`caixa-a-${idPath}`);
    if (el) destacarNoMapa(el);
    if (imoveis.length > 0) montarVitrine(imoveis[0], imoveis);
}

function destacarNoMapa(el) {
    if (pathSelecionado) pathSelecionado.classList.remove('path-ativo');
    el.classList.add('path-ativo');
    pathSelecionado = el;
    document.getElementById('cidade-titulo').innerText = el.getAttribute('name');
}

function montarVitrine(selecionado, listaDaCidade) {
    const painel = document.getElementById('ficha-tecnica');
    const outros = listaDaCidade.filter(i => i.nome !== selecionado.nome);
    
    // Atualiza o botão na esquerda para "Ativo"
    document.querySelectorAll('.btRes').forEach(b => b.classList.remove('ativo'));
    const btnEsq = document.getElementById(`btn-esq-${selecionado.nome.replace(/[^a-zA-Z0-9]/g, '-')}`);
    if (btnEsq) btnEsq.classList.add('ativo');

    painel.innerHTML = `
        <div class="vitrine-topo">MRV em ${selecionado.cidade}</div>
        <div class="outros-res">
            ${outros.map(o => `<button class="btMini" onclick="navegarVitrine('${o.nome}')">${o.nome}</button>`).join('')}
        </div>
        <div class="detalhe-imovel">
            <h2 style="color:var(--mrv-verde); font-size:1.2rem;">${selecionado.nome}</h2>
            <p style="font-size:0.75rem; color:#666; margin-bottom:10px;">📍 ${selecionado.bairro}</p>
            <div class="ficha-grid">
                <div class="info-box"><label>💰 Preço</label><span>${selecionado.preco}</span></div>
                <div class="info-box"><label>🔑 Entrega</label><span>${selecionado.entrega}</span></div>
                <div class="info-box"><label>📐 Plantas</label><span>${selecionado.plantas}</span></div>
                <div class="info-box"><label>🏗️ Obra</label><span>${selecionado.obra}</span></div>
            </div>
            <div class="info-box" style="background:#fff5e6; margin-top:10px;">
                <label style="color:#d67e00;">💡 Dica do Corretor</label>
                <p style="font-size:0.8rem;">${selecionado.dica}</p>
            </div>
            <a href="${selecionado.book}" target="_blank" class="btn-mini" style="display:block; text-align:center; padding:10px; background:var(--mrv-verde); color:white; text-decoration:none; border-radius:4px; margin-top:15px; font-weight:bold;">📄 Book Cliente</a>
        </div>
    `;
}

function navegarVitrine(nome) {
    const imovel = DADOS_PLANILHA.find(i => i.nome === nome);
    const lista = DADOS_PLANILHA.filter(i => i.id_path === imovel.id_path);
    montarVitrine(imovel, lista);
}

function obterHtmlEstoque(valor, tipo) {
    if (tipo === 'N') return "";
    const n = parseInt(valor);
    if (n < 6 && n > 0) return `<span class="badge-estoque estoque-alerta">SÓ ${valor} UN!</span>`;
    if (valor === "VENDIDO" || n === 0) return `<span class="badge-estoque" style="color:#999">VENDIDO</span>`;
    return `<span class="badge-estoque" style="color:#666">RESTAM ${valor} UN.</span>`;
}

function limparLinkDrive(url) {
    if (!url || !url.includes('drive.google.com')) return url;
    const match = url.match(/\/d\/(.+?)\/|\/d\/(.+?)$|id=(.+?)(&|$)/);
    return match ? `https://drive.google.com/file/d/${match[1]||match[2]||match[3]}/preview` : url;
}
