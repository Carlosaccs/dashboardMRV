let DADOS_BASE = [];
let mapaAtivo = 'GSP';

// Colunas exatas
const COL = { ID: 0, NOME: 2, EST: 3, PRECO: 8, ENTREGA: 7, OBRA: 11, DICA: 12, BK_CLI: 19, BK_COR: 20, LOC: 34, IMP: 35 };

async function iniciarApp() {
    const URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzECvkefpM6aWy0IacqqI6l84_ti6zS1lSjcrgL0J4OcrtWZLb63sh7U1ZTQ4nsqDMeTU5ykl8xtDe/pub?output=csv";
    try {
        const res = await fetch(`${URL}&nocache=${Date.now()}`);
        const csv = await res.text();
        const linhas = csv.split(/\r?\n/).filter(l => l.split(',').length > 5);
        
        DADOS_BASE = linhas.slice(1).map(linha => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
            return {
                id: (c[COL.ID] || "").toLowerCase(),
                nome: c[COL.NOME],
                estoque: c[COL.EST],
                preco: c[COL.PRECO],
                entrega: c[COL.ENTREGA],
                obra: c[COL.OBRA],
                dica: c[COL.DICA],
                links: [
                    { t: "Book Cliente", u: converterDrive(c[COL.BK_CLI]) },
                    { t: "Book Corretor", u: converterDrive(c[COL.BK_COR]) },
                    { t: "Localização", u: converterDrive(c[COL.LOC]) },
                    { t: "Implantação", u: converterDrive(c[COL.IMP]) }
                ]
            };
        }).filter(d => d.id);

        render();
    } catch (e) {
        document.getElementById('lista-imoveis').innerHTML = "Erro ao carregar CSV.";
    }
}

function render() {
    // Lista Lateral
    const list = document.getElementById('lista-imoveis');
    list.innerHTML = DADOS_BASE.map(d => `
        <button class="btRes" id="btn-${d.id}" onclick="selecionar('${d.id}')">
            <b>${d.nome}</b> <span>${d.estoque} UN</span>
        </button>
    `).join('');
    
    desenhar();
}

function desenhar() {
    const p = (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR;
    const s = (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP;
    
    document.getElementById('caixa-a').innerHTML = gerarSVG(p, true);
    document.getElementById('caixa-b').innerHTML = gerarSVG(s, false);
}

function gerarSVG(dados, interativo) {
    const pths = dados.paths.map(p => {
        const idL = p.id.toLowerCase();
        const tem = DADOS_BASE.some(d => d.id === idL);
        const clk = interativo ? `onclick="selecionar('${p.id}')"` : `onclick="trocar()"`;
        return `<path id="${p.id}" d="${p.d}" class="${tem && interativo ? 'commrv' : ''}" ${clk}></path>`;
    }).join('');
    return `<svg viewBox="${dados.viewBox}" preserveAspectRatio="xMidYMid meet">${pths}</svg>`;
}

function selecionar(id) {
    id = id.toLowerCase();
    document.querySelectorAll('path').forEach(p => p.classList.remove('path-ativo'));
    const el = document.getElementById(id);
    if(el) el.classList.add('path-ativo');

    const item = DADOS_BASE.find(d => d.id === id);
    if(item) {
        document.getElementById('cidade-titulo').innerText = item.nome;
        document.querySelectorAll('.btRes').forEach(b => b.classList.remove('ativo'));
        const b = document.getElementById(`btn-${id}`);
        if(b) b.classList.add('ativo');

        const mats = item.links.map(l => {
            if(!l.u || l.u.length < 20) return "";
            return `
                <div class="mat-row">
                    <span style="font-size:0.65rem; font-weight:bold;">${l.t}</span>
                    <div>
                        <a href="${l.u}" target="_blank" class="btn-mrv abrir">Abrir</a>
                        <button class="btn-mrv copiar" onclick="copiar('${l.u}')">Copiar</button>
                    </div>
                    <div class="preview-pop"><iframe src="${l.u}"></iframe></div>
                </div>`;
        }).join('');

        document.getElementById('ficha-tecnica').innerHTML = `
            <div class="card-header"><b>${item.nome}</b></div>
            <div class="info-box"><label>VALOR</label><span>${item.preco}</span></div>
            <div class="info-box"><label>ENTREGA</label><span>${item.entrega}</span></div>
            <div class="info-box"><label>OBRA</label><span>${item.obra}%</span></div>
            <div class="info-box" style="border-left:4px solid orange;"><label>DICA</label><p style="font-size:0.65rem;">${item.dica}</p></div>
            <div style="margin-top:10px;">${mats}</div>
        `;
    }
}

function converterDrive(u) {
    if(!u || !u.includes('drive.google.com')) return u;
    const id = u.match(/\/d\/(.+?)\//) || u.match(/id=(.+?)(&|$)/);
    return id ? `https://drive.google.com/file/d/${id[1]}/preview` : u;
}

function copiar(u) { navigator.clipboard.writeText(u); alert("Link Copiado!"); }
function trocar() { mapaAtivo = (mapaAtivo === 'GSP' ? 'INTERIOR' : 'GSP'); desenhar(); }

window.onload = iniciarApp;
