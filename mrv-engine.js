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
    console.log("Iniciando App...");
    await carregarPlanilha();
}

async function carregarPlanilha() {
    const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzECvkefpM6aWy0IacqqI6l84_ti6zS1lSjcrgL0J4OcrtWZLb63sh7U1ZTQ4nsqDMeTU5ykl8xtDe/pub?output=csv";
    try {
        const resp = await fetch(`${URL_CSV}&v=${new Date().getTime()}`);
        if (!resp.ok) throw new Error("Erro ao acessar planilha");
        const texto = await resp.text();
        const linhas = texto.split(/\r?\n/).filter(l => l.trim() !== "");
        
        DADOS_PLANILHA = linhas.slice(1).map(linha => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
            return {
                id_path: (c[COL.ID] || "").toLowerCase(),
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

        console.log("Planilha carregada:", DADOS_PLANILHA.length, "itens");
        gerarListaLateral();
        desenharMapas();
    } catch (e) {
        console.error(e);
        document.getElementById('lista-imoveis').innerHTML = "<p style='color:red; padding:10px;'>Erro ao carregar dados da planilha.</p>";
    }
}

function desenharMapas() {
    // Verifica se as variáveis do mrv-data.js existem
    if (typeof MAPA_GSP === 'undefined' || typeof MAPA_INTERIOR === 'undefined') {
        alert("Erro: Dados do mapa (mrv-data.js) não encontrados!");
        return;
    }
    const dC = (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR;
    const dB = (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP;
    
    renderizarNoContainer('caixa-a', dC, true);
    renderizarNoContainer('caixa-b', dB, false);
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    if (!container) return;

    const pathsHtml = dados.paths.map(p => {
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === p.id.toLowerCase());
        const classe = (temMRV && interativo) ? 'commrv' : '';
        
        // Atributos de evento injetados para evitar falhas de escopo
        const acaoClique = interativo ? 
            `onclick="window.cliqueNoMapa('${p.id}', '${p.name}', ${temMRV})"` : 
            `onclick="window.trocarMapas()"`;
            
        const acaoHover = interativo ?
            `onmouseover="window.hoverMapa('${p.name}')" onmouseout="window.resetMapa()"` : "";

        return `<path id="${id}-${p.id}" d="${p.d}" class="${classe}" ${acaoClique} ${acaoHover}></path>`;
    }).join('');
    
    container.innerHTML = `<svg viewBox="${dados.viewBox}" preserveAspectRatio="xMidYMid meet"><g transform="${dados.transform || ''}">${pathsHtml}</g></svg>`;
}

// Funções globais para garantir que o 'onclick' no HTML as encontre
window.hoverMapa = function(n) { document.getElementById('cidade-titulo').innerText = n; };
window.resetMapa = function() { document.getElementById('cidade-titulo').innerText = nomeSelecionado || "SELECIONE UMA REGIÃO NO MAPA"; };

window.cliqueNoMapa = function(id, nome, temMRV) {
    if (!temMRV) return;
    window.comandoSelecao(id, nome);
};

window.comandoSelecao = function(idPath, nomePath) {
    const el = document.getElementById(`caixa-a-${idPath}`);
    if (pathSelecionado) pathSelecionado.classList.remove('path-ativo');
    if (el) {
        el.classList.add('path-ativo');
        pathSelecionado = el;
    }
    nomeSelecionado = nomePath;
    document.getElementById('cidade-titulo').innerText = nomePath;

    const imoveis = DADOS_PLANILHA.filter(d => d.id_path === idPath.toLowerCase());
    if (imoveis.length > 0) montarVitrine(imoveis[0]);
};

window.trocarMapas = function() {
    mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP';
    nomeSelecionado = "";
    document.getElementById('cidade-titulo').innerText = "SELECIONE UMA REGIÃO";
    desenharMapas();
};

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
                    <button class="btn-acao btn-copiar" onclick="navigator.clipboard.writeText('${m.url}');alert('Link Copiado!')">Copiar</button>
                </div>
                <div class="preview-box"><iframe src="${m.url}"></iframe></div>
            </div>`).join('');

    document.getElementById('ficha-tecnica').innerHTML = `
        <div class="destaque-vitrine"><h2>${sel.nome}</h2></div>
        <p style="font-size:0.75rem; margin-bottom:12px;">📍 ${sel.endereco} - ${sel.bairro}</p>
        <div class="info-box"><label>💰 Preço</label><span>${sel.preco}</span></div>
        <div class="info-box"><label>🔑 Entrega</label><span>${sel.entrega}</span></div>
        <div class="info-box" style="background:#fff5e6; border-left:4px solid var(--mrv-laranja);"><label style="color:#d67e00;">DICA</label><p style="font-size:0.75rem;">${sel.dica}</p></div>
        <div style="margin-top:20px;"><p style="font-size:0.6rem; font-weight:bold; color:#999; margin-bottom:5px; text-transform:uppercase;">Materiais de Venda</p>${htmlMateriais}</div>
    `;
}

function gerarListaLateral() {
    const list = document.getElementById('lista-imoveis');
    if (!list) return;
    list.innerHTML = "";
    DADOS_PLANILHA.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'btRes';
        btn.id = `btn-esq-${item.nome.replace(/\s+/g, '')}`;
        btn.innerHTML = `<strong>${item.nome}</strong>`;
        btn.onclick = (e) => {
            const estaGSP = MAPA_GSP.paths.some(p => p.id.toLowerCase() === item.id_path);
            if ((estaGSP && mapaAtivo !== 'GSP') || (!estaGSP && mapaAtivo !== 'INTERIOR')) {
                mapaAtivo = estaGSP ? 'GSP' : 'INTERIOR';
                desenharMapas();
            }
            setTimeout(() => window.comandoSelecao(item.id_path, item.cidade), 100);
        };
        list.appendChild(btn);
    });
}

function limparLink(url) {
    if (!url || !url.includes('drive.google.com')) return url;
    const id = url.match(/\/d\/(.+?)\/|\/d\/(.+?)$|id=(.+?)(&|$)/);
    return id ? `https://drive.google.com/file/d/${id[1]||id[2]||id[3]}/preview` : url;
}

window.onload = iniciarApp;
