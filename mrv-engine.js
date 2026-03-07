let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = "";
let mapaAtivo = 'GSP';

// Ordem exata das colunas enviada por você
const COL = {
    ID_PATH: 0, TIPO: 1, NOME: 2, ESTOQUE: 3, END: 4, BAIRRO: 5, CIDADE: 6,
    ENTREGA: 7, PRECO: 8, P_DE: 9, P_ATE: 10, OBRA: 11, DICA: 12, OBS: 13,
    BK_CLIENTE: 19, BK_CORRETOR: 20, VID1: 21, VID2: 22,
    LOC_MAPA: 34, IMPLANTACAO: 35
};

async function iniciarApp() {
    console.log("Iniciando Engine v8.5...");
    await carregarPlanilha();
}

async function carregarPlanilha() {
    const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzECvkefpM6aWy0IacqqI6l84_ti6zS1lSjcrgL0J4OcrtWZLb63sh7U1ZTQ4nsqDMeTU5ykl8xtDe/pub?output=csv";
    try {
        const resp = await fetch(`${URL_CSV}&cache=${new Date().getTime()}`);
        if (!resp.ok) throw new Error("Falha no fetch");
        const texto = await resp.text();
        
        const linhas = texto.split(/\r?\n/).filter(l => l.trim().length > 10);
        DADOS_PLANILHA = linhas.slice(1).map(linha => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
            return {
                id_path: (c[COL.ID_PATH] || "").toLowerCase(),
                tipo: c[COL.TIPO], nome: c[COL.NOME], estoque: c[COL.ESTOQUE],
                endereco: c[COL.END], bairro: c[COL.BAIRRO], cidade: c[COL.CIDADE],
                entrega: c[COL.ENTREGA], preco: c[COL.PRECO], 
                plantas: `De ${c[COL.P_DE]} a ${c[COL.P_ATE]}`,
                obra: c[COL.OBRA], dica: c[COL.DICA],
                materiais: [
                    { label: "Book Cliente", url: c[COL.BK_CLIENTE] },
                    { label: "Book Corretor", url: c[COL.BK_CORRETOR] },
                    { label: "Localização", url: c[COL.LOC_MAPA] },
                    { label: "Implantação", url: c[COL.IMPLANTACAO] }
                ]
            };
        }).filter(item => item.nome);

        gerarListaLateral();
        desenharMapas();
    } catch (e) {
        console.error(e);
        document.getElementById('lista-imoveis').innerHTML = "<p style='color:red; padding:10px;'>Erro ao carregar dados da planilha. Verifique a publicação do CSV.</p>";
    }
}

function desenharMapas() {
    if (typeof MAPA_GSP === 'undefined') return;
    const dPrinc = (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR;
    const dSecund = (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP;

    renderizarNoContainer('caixa-a', dPrinc, true);
    renderizarNoContainer('caixa-b', dSecund, false);
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    const pathsHtml = dados.paths.map(p => {
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === p.id.toLowerCase());
        const classe = (temMRV && interativo) ? 'commrv' : '';
        const clique = interativo ? `onclick="comandoSelecao('${p.id}', '${p.name}')"` : `onclick="trocarMapas()"`;
        return `<path id="${id}-${p.id}" d="${p.d}" class="${classe}" ${clique}></path>`;
    }).join('');
    container.innerHTML = `<svg viewBox="${dados.viewBox}">${pathsHtml}</svg>`;
}

function comandoSelecao(id, nome, objDireto = null) {
    if (pathSelecionado) pathSelecionado.classList.remove('path-ativo');
    const el = document.getElementById(`caixa-a-${id}`);
    if (el) { el.classList.add('path-ativo'); pathSelecionado = el; }

    nomeSelecionado = nome;
    document.getElementById('cidade-titulo').innerText = nome;

    const item = objDireto || DADOS_PLANILHA.find(d => d.id_path === id.toLowerCase());
    if (item) montarVitrine(item);
}

function montarVitrine(sel) {
    // Sincroniza botão esquerdo
    document.querySelectorAll('.btRes').forEach(b => b.classList.remove('ativo'));
    const bE = document.getElementById(`btn-esq-${sel.nome.replace(/[^a-zA-Z0-9]/g, '-')}`);
    if (bE) bE.classList.add('ativo');

    const htmlMateriais = sel.materiais.map(m => {
        if (!m.url || m.url.length < 10) return "";
        const linkLimpo = converterLinkDrive(m.url);
        return `
            <div class="material-row">
                <span style="font-size:0.65rem; font-weight:bold;">${m.label}</span>
                <div>
                    <button class="btn-acao btn-abrir" onclick="window.open('${linkLimpo}', '_blank')">Abrir</button>
                    <button class="btn-acao btn-copiar" onclick="copiarLink('${linkLimpo}')">Copiar</button>
                </div>
                <div class="preview-box"><iframe src="${linkLimpo}"></iframe></div>
            </div>`;
    }).join('');

    document.getElementById('ficha-tecnica').innerHTML = `
        <div class="destaque-vitrine"><h2>${sel.nome}</h2></div>
        <div class="info-box"><label>💰 Preço</label><span>${sel.preco}</span></div>
        <div class="info-box"><label>🔑 Entrega</label><span>${sel.entrega}</span></div>
        <div class="info-box"><label>🏗️ Obra</label><span>${sel.obra}%</span></div>
        <div class="info-box" style="background:#fff5e6; border-left:4px solid var(--mrv-laranja);"><label>DICA</label><p style="font-size:0.7rem;">${sel.dica}</p></div>
        <div style="margin-top:15px;">${htmlMateriais}</div>
    `;
}

function converterLinkDrive(url) {
    if (!url.includes('drive.google.com')) return url;
    // Extrai o ID e força o modo /preview para remover menus e botões extras do Google
    const match = url.match(/\/d\/(.+?)\//);
    return match ? `https://drive.google.com/file/d/${match[1]}/preview` : url;
}

function copiarLink(url) {
    navigator.clipboard.writeText(url);
    alert("Link copiado com sucesso!");
}

function trocarMapas() {
    mapaAtivo = (mapaAtivo === 'GSP' ? 'INTERIOR' : 'GSP');
    desenharMapas();
}

function obterHtmlEstoque(v) { return `<span style="font-size:0.6rem; color:#999;">RESTAM ${v} UN.</span>`; }

function gerarListaLateral() {
    const list = document.getElementById('lista-imoveis');
    list.innerHTML = "";
    DADOS_PLANILHA.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'btRes';
        btn.id = `btn-esq-${item.nome.replace(/[^a-zA-Z0-9]/g, '-')}`;
        btn.innerHTML = `<strong>${item.nome}</strong> ${obterHtmlEstoque(item.estoque)}`;
        btn.onclick = () => {
            // Verifica se o mapa correto está ativo antes de selecionar
            const estaGSP = MAPA_GSP.paths.some(p => p.id.toLowerCase() === item.id_path);
            if (estaGSP && mapaAtivo !== 'GSP') { mapaAtivo = 'GSP'; desenharMapas(); }
            if (!estaGSP && mapaAtivo !== 'INTERIOR') { mapaAtivo = 'INTERIOR'; desenharMapas(); }
            setTimeout(() => comandoSelecao(item.id_path, item.cidade, item), 100);
        };
        list.appendChild(btn);
    });
}
