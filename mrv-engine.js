let DADOS_PLANILHA = [];
let pathSelecionado = null;
let mapaAtivo = 'GSP';

// ORDEM EXATA DA SUA PLANILHA (Início em 0)
const COL = {
    ID_PATH: 0, TIPO: 1, NOME: 2, ESTOQUE: 3, END: 4, BAIRRO: 5, CIDADE: 6,
    ENTREGA: 7, PRECO: 8, P_DE: 9, P_ATE: 10, OBRA: 11, DICA: 12, OBS: 13,
    BK_CLIENTE: 19, BK_CORRETOR: 20, VID1: 21, VID2: 22,
    LOC_MAPA: 34, IMPLANTACAO: 35
};

async function iniciarApp() {
    await carregarPlanilha();
}

async function carregarPlanilha() {
    const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzECvkefpM6aWy0IacqqI6l84_ti6zS1lSjcrgL0J4OcrtWZLb63sh7U1ZTQ4nsqDMeTU5ykl8xtDe/pub?output=csv";
    try {
        const resp = await fetch(`${URL_CSV}&cache=${new Date().getTime()}`);
        const texto = await resp.text();
        
        // Split robusto para CSV (ignora vírgulas dentro de aspas)
        const linhas = texto.split(/\r?\n/).filter(l => l.trim().length > 5);
        
        DADOS_PLANILHA = linhas.slice(1).map(linha => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
            return {
                id_path: (c[COL.ID_PATH] || "").toLowerCase().trim(),
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
                materiais: [
                    { label: "Book Cliente", url: c[COL.BK_CLIENTE] },
                    { label: "Book Corretor", url: c[COL.BK_CORRETOR] },
                    { label: "Mapa Localização", url: c[COL.LOC_MAPA] },
                    { label: "Implantação", url: c[COL.IMPLANTACAO] }
                ]
            };
        }).filter(item => item.nome);

        gerarListaLateral();
        desenharMapas();
    } catch (e) {
        console.error("Erro Crítico:", e);
        document.getElementById('lista-imoveis').innerHTML = "<p style='color:red; padding:10px;'>Erro ao carregar dados. Verifique a internet ou a planilha.</p>";
    }
}

function desenharMapas() {
    if (typeof MAPA_GSP === 'undefined') return;
    const princ = (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR;
    const secund = (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP;

    renderizarSVG('caixa-a', princ, true);
    renderizarSVG('caixa-b', secund, false);
}

function renderizarSVG(containerId, dados, interativo) {
    const container = document.getElementById(containerId);
    const paths = dados.paths.map(p => {
        const idLimpo = p.id.toLowerCase().trim();
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idLimpo);
        const acao = interativo ? 
            `onclick="comandoSelecao('${p.id}', '${p.name}')"` : 
            `onclick="alternarMapas()"`;
        return `<path id="${containerId}-${p.id}" d="${p.d}" class="${temMRV && interativo ? 'commrv' : ''}" ${acao}></path>`;
    }).join('');
    
    container.innerHTML = `<svg viewBox="${dados.viewBox}" preserveAspectRatio="xMidYMid meet">${paths}</svg>`;
}

function comandoSelecao(id, nome, objDireto = null) {
    if (pathSelecionado) pathSelecionado.classList.remove('path-ativo');
    const el = document.getElementById(`caixa-a-${id}`);
    if (el) { el.classList.add('path-ativo'); pathSelecionado = el; }

    document.getElementById('cidade-titulo').innerText = nome;
    const item = objDireto || DADOS_PLANILHA.find(d => d.id_path === id.toLowerCase().trim());
    if (item) montarVitrine(item);
}

function montarVitrine(item) {
    // Ativa botão na lista lateral
    document.querySelectorAll('.btRes').forEach(b => b.classList.remove('ativo'));
    const btnEsq = document.getElementById(`btn-esq-${item.nome.replace(/[^a-zA-Z0-9]/g, '-')}`);
    if (btnEsq) btnEsq.classList.add('ativo');

    // Gera botões de materiais com Preview
    const htmlMats = item.materiais.map(m => {
        if (!m.url || m.url.length < 10) return "";
        const urlLimpa = formatarLinkDrive(m.url);
        return `
            <div class="material-row">
                <span style="font-size:0.65rem; font-weight:bold; color:#444;">${m.label}</span>
                <div>
                    <a href="${urlLimpa}" target="_blank" class="btn-acao btn-abrir">ABRIR</a>
                    <button class="btn-acao btn-copiar" onclick="copiarLink('${urlLimpa}')">COPIAR</button>
                </div>
                <div class="preview-thumb"><iframe src="${urlLimpa}"></iframe></div>
            </div>`;
    }).join('');

    document.getElementById('ficha-tecnica').innerHTML = `
        <div class="destaque-vitrine"><h2>${item.nome}</h2></div>
        <div class="info-box"><label>💰 Valor</label><span>${item.preco}</span></div>
        <div class="info-box"><label>🔑 Entrega</label><span>${item.entrega}</span></div>
        <div class="info-box"><label>🏗️ Obra</label><span>${item.obra}%</span></div>
        <div class="info-box" style="background:#fff5e6; border-left:4px solid var(--mrv-laranja);">
            <label>DICA DO CORRETOR</label>
            <p style="font-size:0.7rem; line-height:1.2;">${item.dica}</p>
        </div>
        <div style="margin-top:15px;">
            <p style="font-size:0.6rem; font-weight:bold; color:#999; margin-bottom:5px;">DOWNLOADS E LINKS</p>
            ${htmlMats}
        </div>
    `;
}

function formatarLinkDrive(url) {
    if (!url.includes('drive.google.com')) return url;
    // Converte para /preview (mais limpo e permite iframe)
    const id = url.match(/\/d\/(.+?)\//);
    return id ? `https://drive.google.com/file/d/${id[1]}/preview` : url;
}

function copiarLink(url) {
    navigator.clipboard.writeText(url);
    alert("Link copiado!");
}

function alternarMapas() {
    mapaAtivo = (mapaAtivo === 'GSP' ? 'INTERIOR' : 'GSP');
    desenharMapas();
}

function gerarListaLateral() {
    const list = document.getElementById('lista-imoveis');
    list.innerHTML = "";
    DADOS_PLANILHA.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'btRes';
        btn.id = `btn-esq-${item.nome.replace(/[^a-zA-Z0-9]/g, '-')}`;
        btn.innerHTML = `<strong>${item.nome}</strong> <span style="font-size:0.6rem; color:#999;">${item.estoque} UN.</span>`;
        btn.onclick = () => {
            // Se o item for de outro mapa, troca antes
            const noGSP = MAPA_GSP.paths.some(p => p.id.toLowerCase() === item.id_path);
            if (noGSP && mapaAtivo !== 'GSP') { mapaAtivo = 'GSP'; desenharMapas(); }
            if (!noGSP && mapaAtivo !== 'INTERIOR') { mapaAtivo = 'INTERIOR'; desenharMapas(); }
            setTimeout(() => comandoSelecao(item.id_path, item.cidade, item), 50);
        };
        list.appendChild(btn);
    });
}
