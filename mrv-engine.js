let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

const COL = {
    ID: 0, TIPO: 1, NOME: 2, ESTOQUE: 3, END: 4, BAIRRO: 5, CIDADE: 6,
    ENTREGA: 7, PRECO: 8, P_DE: 9, P_ATE: 10, OBRA: 11, DICA: 12,
    BK_CLI: 19, BK_COR: 20, VID1: 21, VID2: 22, MAPA_LOC: 34, MAPA_IMP: 35
};

async function iniciarApp() {
    await carregarPlanilha();
}

async function carregarPlanilha() {
    const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzECvkefpM6aWy0IacqqI6l84_ti6zS1lSjcrgL0J4OcrtWZLb63sh7U1ZTQ4nsqDMeTU5ykl8xtDe/pub?output=csv";
    try {
        const resp = await fetch(`${URL_CSV}&v=${new Date().getTime()}`);
        const texto = await resp.text();
        const linhas = texto.split(/\r?\n/).filter(l => l.trim() !== "");
        
        DADOS_PLANILHA = linhas.slice(1).map(linha => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
            return {
                id_path: c[COL.ID]?.toLowerCase(),
                tipo: c[COL.TIPO], nome: c[COL.NOME], estoque: c[COL.ESTOQUE],
                endereco: c[COL.END], bairro: c[COL.BAIRRO], cidade: c[COL.CIDADE],
                entrega: c[COL.ENTREGA], preco: c[COL.PRECO], 
                plantas: `De ${c[COL.P_DE]} a ${c[COL.P_ATE]}`,
                obra: c[COL.OBRA], dica: c[COL.DICA],
                materiais: [
                    { lab: "📄 Book Cliente", url: limparLink(c[COL.BK_CLI]) },
                    { lab: "🔑 Book Corretor", url: limparLink(c[COL.BK_COR]) },
                    { lab: "📍 Localização", url: limparLink(c[COL.MAPA_LOC]) },
                    { lab: "🏗️ Implantação", url: limparLink(c[COL.MAPA_IMP]) }
                ]
            };
        }).filter(i => i.nome);

        gerarListaLateral();
        desenharMapas();
    } catch (e) { console.error("Erro CSV:", e); }
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
        const classe = temMRV && interativo ? 'commrv' : '';
        // Injetando eventos diretamente no HTML para máxima compatibilidade
        const eventos = interativo ? 
            `onclick="cliqueNoMapa('${p.id}', '${p.name}', ${temMRV})" onmouseover="document.getElementById('cidade-titulo').innerText='${p.name}'" onmouseout="document.getElementById('cidade-titulo').innerText=nomeSelecionado"` : 
            `onclick="trocarMapas()"`;
        
        return `<path id="${id}-${p.id}" d="${p.d}" class="${classe}" ${eventos}></path>`;
    }).join('');
    
    container.innerHTML = `<svg viewBox="${dados.viewBox}" preserveAspectRatio="xMidYMid meet"><g transform="${dados.transform || ''}">${pathsHtml}</g></svg>`;
    
    if(!interativo) {
        container.onclick = trocarMapas;
    } else {
        container.onclick = null;
    }
}

function cliqueNoMapa(id, nome, temMRV) {
    if (!temMRV) return;
    comandoSelecao(id, nome);
}

function comandoSelecao(idPath, nomePath) {
    const el = document.getElementById(`caixa-a-${idPath}`);
    if (el) {
        if (pathSelecionado) pathSelecionado.classList.remove('path-ativo');
        el.classList.add('path-ativo');
        pathSelecionado = el;
    }
    nomeSelecionado = nomePath;
    document.getElementById('cidade-titulo').innerText = nomePath;

    const imoveis = DADOS_PLANILHA.filter(d => d.id_path === idPath.toLowerCase());
    if (imoveis.length > 0) montarVitrine(imoveis[0]);
}

function montarVitrine(sel) {
    document.querySelectorAll('.btRes').forEach(b => b.classList.remove('ativo'));
    const bE = document.getElementById(`btn-esq-${sel.nome.replace(/\s+/g, '')}`);
    if (bE) bE.classList.add('ativo');

    const htmlMateriais = sel.materiais.filter(m => m.url && m.url.length > 10)
        .map(m => `
            <div class="material-row">
                <span style="font-size:0.65rem; font-weight:bold;">${m.lab}</span>
                <div>
                    <button class="btn-acao btn-abrir" onclick="window.open('${m.url}','_blank')">Abrir</button>
                    <button class="btn-acao btn-copiar" onclick="navigator.clipboard.writeText('${m.url}');alert('Copiado!')">Copiar</button>
                </div>
                <div class="preview-box"><iframe src="${m.url}"></iframe></div>
            </div>`).join('');

    document.getElementById('ficha-tecnica').innerHTML = `
        <div class="destaque-vitrine"><h2>${sel.nome}</h2></div>
        <p style="font-size:0.7rem; margin-bottom:10px;">📍 ${sel.endereco} - ${sel.bairro}</p>
        <div class="info-box"><label>💰 Preço</label><span>${sel.preco}</span></div>
        <div class="info-box"><label>🔑 Entrega</label><span>${sel.entrega}</span></div>
        <div class="info-box" style="background:#fff5e6; border-left:4px solid var(--mrv-laranja);"><label>DICA</label><p style="font-size:0.75rem;">${sel.dica}</p></div>
        <div style="margin-top:15px;">${htmlMateriais}</div>
    `;
}

function gerarListaLateral() {
    const list = document.getElementById('lista-imoveis');
    list.innerHTML = "";
    DADOS_PLANILHA.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'btRes';
        btn.id = `btn-esq-${item.nome.replace(/\s+/g, '')}`;
        btn.innerHTML = `<strong>${item.nome}</strong>`;
        // Forçando o clique no botão
        btn.onclick = (e) => {
            e.preventDefault();
            const estaGSP = MAPA_GSP.paths.some(p => p.id.toLowerCase() === item.id_path);
            if ((estaGSP && mapaAtivo !== 'GSP') || (!estaGSP && mapaAtivo !== 'INTERIOR')) {
                mapaAtivo = estaGSP ? 'GSP' : 'INTERIOR';
                desenharMapas();
            }
            setTimeout(() => comandoSelecao(item.id_path, item.cidade), 100);
        };
        list.appendChild(btn);
    });
}

function trocarMapas() {
    mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP';
    nomeSelecionado = "";
    document.getElementById('cidade-titulo').innerText = "SELECIONE UMA REGIÃO";
    desenharMapas();
}

function limparLink(url) {
    if (!url || !url.includes('drive.google.com')) return url;
    const id = url.match(/\/d\/(.+?)\/|\/d\/(.+?)$|id=(.+?)(&|$)/);
    return id ? `https://drive.google.com/file/d/${id[1]||id[2]||id[3]}/preview` : url;
}

window.onload = iniciarApp;
