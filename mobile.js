/* ==========================================================================
   DASHBOARD MRV - VERSÃO FINAL CONSOLIDADA v141.3.3 (REVISADA)
   Foco: Correção de ícones Fullscreen e Estabilidade
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. CONFIGURAÇÕES E ESTADOS GLOBAIS
   -------------------------------------------------------------------------- */
const svgNS = "http://www.w3.org/2000/svg";
const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRKdJctOPQjKAtOZSDHyArD_H8SgKIouelAS1vF1d_-13pu7u_ic6J8nP3r0Ijd56WA-mbUmHjb4Me/pub?output=csv';

let mapaAtivo = "GSP";
let regiaoAtivaGeral = null; 
window.dadosGerais = [];

const AJUSTES_MAPA = {
    GSP: { marginRight: "35%", marginLeft: "-70px", scale: "1" },
    INTERIOR: { marginRight: "50%", marginLeft: "-100px", scale: "1.15" }
};

const ALTURA_PADRAO = "28px";

/* --------------------------------------------------------------------------
   2. UTILITÁRIOS E FULLSCREEN (LIMPO)
   -------------------------------------------------------------------------- */
function obterNomeZona(sigla) {
    const s = sigla ? sigla.trim().toUpperCase() : "";
    switch(s) {
        case "ZO": return "Z. OESTE";
        case "ZL": return "Z. LESTE";
        case "ZN": return "Z. NORTE";
        case "ZS": return "Z. SUL";
        case "C":  return "CENTRO";
        default: return ""; 
    }
}

// REMOVIDO: A função que injetava SVGs via JS e travava o tamanho.
// Agora o CSS controla os IDs #svg-expandir e #svg-recolher que já estão no HTML.
function atualizarIconeFullscreen() {
    const svgExpandir = document.getElementById('svg-expandir');
    const svgRecolher = document.getElementById('svg-recolher');
    if (!svgExpandir || !svgRecolher) return;

    const estaFull = document.fullscreenElement || document.webkitFullscreenElement;
    
    if (estaFull) {
        svgExpandir.style.display = 'none';
        svgRecolher.style.display = 'block';
    } else {
        svgExpandir.style.display = 'block';
        svgRecolher.style.display = 'none';
    }
}

function solicitarFullscreen() {
    const elem = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (elem.requestFullscreen) elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    }
}

document.addEventListener('fullscreenchange', atualizarIconeFullscreen);
document.addEventListener('webkitfullscreenchange', atualizarIconeFullscreen);

/* --------------------------------------------------------------------------
   3. PROCESSAMENTO DE DADOS (GOOGLE SHEETS)
   -------------------------------------------------------------------------- */
async function carregarPlanilha() {
    try {
        const res = await fetch(`${URL_PLANILHA}&cache_buster=${Date.now()}`);
        const csv = await res.text();
        const linhas = csv.split(/\r?\n/).filter(l => l.trim() !== "");
        window.dadosGerais = []; 
        linhas.slice(1).forEach((linha) => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (c.length >= 32) { 
                const limpar = (t) => t ? t.replace(/"/g, '').trim() : "";
                if (limpar(c[4]) !== "") {
                    window.dadosGerais.push({
                        id: limpar(c[0]).toLowerCase(),
                        categoria: limpar(c[1]).toUpperCase(),
                        ordem: parseInt(limpar(c[2])) || 9999,
                        zona: limpar(c[3]).toUpperCase(),
                        nomeCurto: limpar(c[4]),
                        endereco: limpar(c[7]),
                        precosRaw: limpar(c[8]),
                        destaqueCampanha: limpar(c[16]), 
                        link: limpar(c[16]), 
                        descLonga: limpar(c[18]),
                        obsImportante: limpar(c[19] || ""), 
                        localizacao: limpar(c[20] || ""),   
                        mobilidade: limpar(c[21] || ""),    
                        culturaLazer: limpar(c[22] || ""),  
                        comercio: limpar(c[23] || ""),      
                        saudeEducacao: limpar(c[24] || ""),
                        bookCliente: limpar(c[25] || ""),
                        bookCorretor: limpar(c[26] || ""),
                        videosRaw: limpar(c[27] || ""), plantasRaw: limpar(c[28] || ""),
                        locImplantaRaw: limpar(c[29] || ""), diversosRaw: limpar(c[30] || ""),
                        estandeVendas: limpar(c[31] || ""), 
                        estoque: limpar(c[6]), entrega: limpar(c[9]),      
                        plantaMin: limpar(c[10]), plantaMax: limpar(c[11]),  
                        obra: limpar(c[12]), limitador: limpar(c[13]), cPaulista: limpar(c[15])   
                    });
                }
            }
        });
        atualizarVisualizacao();
        gerarMenuResidenciais(); 
    } catch (e) { console.error("Erro planilha:", e); }
}

/* --------------------------------------------------------------------------
   4. RENDERIZAÇÃO DA FICHA TÉCNICA
   -------------------------------------------------------------------------- */
function exibirDadosResidencial(info) {
    const elNome = document.getElementById('nome-imovel');
    const elDetalhes = document.getElementById('detalhes-imovel');
    if (elNome) elNome.innerText = info.nomeCurto.toUpperCase();
    
    const tratarLinkDrive = (url) => {
        if (!url) return "#";
        const u = url.trim();
        if (u.includes("drive.google.com")) {
            return u.replace(/\/view.*|\/edit.*|\?usp=sharing/g, "") + "/preview";
        }
        return u;
    };

    const criarCardLink = (titulo, link, icone) => {
        if (!link || link.length < 5) return "";
        const linkSeguro = tratarLinkDrive(link);
        return `<div style="display:flex; align-items:center; background:#fff; border-radius:4px; padding:0 10px; gap:8px; margin-top:6px; height:${ALTURA_PADRAO};">
            <span style="font-size:0.9rem;">${icone}</span>
            <div style="flex-grow:1; font-size:0.75rem; font-weight:bold; color:#333; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${titulo.toUpperCase()}</div>
            <div style="display:flex; gap:4px;">
                <button onclick="window.open('${linkSeguro}','_blank')" style="background:#00713a; color:#fff; border:none; border-radius:4px; padding:0 8px; height:20px; font-size:0.55rem; font-weight:bold; cursor:pointer;">ABRIR</button>
                <button onclick="copyToClipboard('${linkSeguro}')" style="background:#666; color:#fff; border:none; border-radius:4px; padding:0 8px; height:20px; font-size:0.55rem; font-weight:bold; cursor:pointer;">COPIAR</button>
            </div>
        </div>`;
    };

    const processarListaLinks = (rawString, icone) => {
        if (!rawString || !rawString.includes(",")) return "";
        let cards = "";
        rawString.split(";").forEach(item => {
            const partes = item.split(",");
            if (partes.length >= 2) cards += criarCardLink(partes[0].trim(), partes[1].trim(), icone);
        });
        return cards;
    };

    const linkM = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.endereco)}`;
    let html = `<div style="font-size:0.82rem; color:#fff; margin-bottom:12px; font-weight:bold;">📍 ${info.endereco}</div>
        <div style="display:flex; gap:8px; margin-bottom:15px;">
            <button onclick="window.open('${linkM}','_blank')" style="width:70px; height:${ALTURA_PADRAO}; background:#4285F4; color:#fff; border:none; border-radius:4px; font-weight:800; cursor:pointer; font-size:0.7rem;">MAPS</button>
            <button onclick="copyToClipboard('${tratarLinkDrive(info.link)}')" style="width:70px; height:${ALTURA_PADRAO}; background:#444; color:#fff; border:none; border-radius:4px; font-weight:800; cursor:pointer; font-size:0.7rem;">COPIAR</button>
        </div>`;

    if (info.categoria === "COMPLEXO") {
        html += (info.descLonga ? `<div style="font-size:0.82rem; color:#eee; margin-bottom:10px;">${info.descLonga}</div>` : "");
        html += criarCardLink("Book Cliente", info.bookCliente, "📄") + criarCardLink("Book Corretor", info.bookCorretor, "💼");
    } else {
        const camp = (info.destaqueCampanha) ? `<div style="background:#fff; color:#e31c19; height:${ALTURA_PADRAO}; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:0.75rem; border-radius:4px; margin-bottom:8px;">${info.destaqueCampanha.toUpperCase()}</div>` : "";
        const pTxt = (info.plantaMin && info.plantaMax) ? `${info.plantaMin} até ${info.plantaMax} m²` : (info.plantaMin || "---");
        let eH = ""; const eN = parseInt(info.estoque);
        if (!info.estoque) eH = "---"; else if (info.estoque === "-") eH = "CONSULTAR"; else if (eN === 0) eH = `<span style="text-decoration:line-through; color:#bbb;">VENDIDO</span>`; else if (eN < 5) eH = `<span style="color:#e31c19;">APENAS ${eN} UN.</span>`; else eH = `RESTAM ${eN} UN.`;

        const cax = (l, v) => `<div style="background:#444; height:${ALTURA_PADRAO}; border-radius:4px; display:flex; align-items:center; justify-content:space-between; padding:0 8px;"><span style="color:#bbb; font-size:0.55rem; font-weight:bold;">${l}</span><span style="color:#fff; font-size:0.72rem; font-weight:bold;">${v}</span></div>`;
        html += camp + `<div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:8px;">${cax("ENTREGA", info.entrega || "---")}${cax("OBRA", info.obra ? info.obra+'%' : '---')}${cax("PLANTAS", pTxt)}${cax("ESTOQUE", eH)}${cax("LIMITADOR", info.limitador || "---")}${cax("C. PAULISTA", info.cPaulista || "---")}</div>`;

        if (info.precosRaw && info.precosRaw.includes(";")) {
            let pL = ""; info.precosRaw.split(";").slice(1).forEach(l => { const d = l.split(","); if (d.length >= 4) pL += `<div style="display:grid; grid-template-columns:0.5fr 1.2fr 1fr 1fr; gap:4px; padding:6px 0; border-top:1px solid #555;"><span style="color:#fff; font-weight:800; font-size:0.7rem;">${d[0]}</span><span style="background:#ff8c00; color:#fff; font-weight:800; font-size:0.7rem; text-align:center; border-radius:2px;">${d[1]}</span><span style="color:#bbb; font-size:0.6rem; text-align:right;">${d[2]}</span><span style="color:#bbb; font-size:0.6rem; text-align:right;">${d[3]}</span></div>`; });
            html += `<div style="background:#444; border-radius:4px; padding:8px;"><div style="display:grid; grid-template-columns:0.5fr 1.2fr 1fr 1fr; gap:4px; margin-bottom:4px; font-size:0.5rem; color:#bbb; font-weight:bold;"><span>TIPO</span><span style="text-align:center;">MENOR PREÇO</span><span style="text-align:right;">AVAL.</span><span style="text-align:right;">B. PAG.</span></div>${pL}</div>`;
        }

        const criarCardTexto = (titulo, texto, corBorda) => (!texto || texto.length < 3) ? "" : `<div style="margin-top:10px; border-radius:6px; overflow:hidden; border-left:4px solid ${corBorda}; background:#333;"><div style="background:#ddd; padding:4px 10px;"><span style="font-size:0.65rem; font-weight:900; color:#222;">${titulo.toUpperCase()}</span></div><div style="padding:10px; color:#fff; font-size:0.75rem; line-height:1.3;">${texto.toUpperCase()}</div></div>`;
        html += criarCardTexto("⚠️ Observação Importante", info.obsImportante, "#e31c19") + criarCardTexto("📍 Localização", info.localizacao, "#4285F4") + criarCardTexto("🚲 Mobilidade", info.mobilidade, "#ff8c00") + criarCardTexto("🎭 Cultura e Lazer", info.culturaLazer, "#d1147e") + criarCardTexto("🛒 Comércio", info.comercio, "#7b1fa2") + criarCardTexto("🏥 Saúde e Educação", info.saudeEducacao, "#0054a6");
        html += processarListaLinks(info.videosRaw, "🎬") + processarListaLinks(info.plantasRaw, "📐") + processarListaLinks(info.locImplantaRaw, "🏢") + processarListaLinks(info.diversosRaw, "🔗") + criarCardLink("Book Cliente", info.bookCliente, "📄") + criarCardLink("Book Corretor", info.bookCorretor, "💼");
    }
    elDetalhes.innerHTML = html;
}

/* --------------------------------------------------------------------------
   5. INTERAÇÃO COM MAPAS
   -------------------------------------------------------------------------- */
function clicarNoMapa(pathElement, infoSelecionado, pDataRaw = null) {
    solicitarFullscreen();
    const ehVerde = pathElement.getAttribute('data-cor-base') === "#00713a";
    const nomePath = pDataRaw ? pDataRaw.name : pathElement.getAttribute('data-name');
    
    if (!ehVerde && !infoSelecionado) {
        atualizarTextoTopo(nomePath);
        const corOriginal = pathElement.getAttribute('data-cor-base');
        pathElement.style.fill = "#666666"; 
        setTimeout(() => { pathElement.style.fill = corOriginal; atualizarTextoTopo(regiaoAtivaGeral); }, 800); 
        return;
    }
    
    regiaoAtivaGeral = nomePath;
    atualizarTextoTopo(regiaoAtivaGeral);
    document.querySelectorAll('#mapa-container path').forEach(p => { p.setAttribute('data-selecionado', 'false'); p.style.fill = p.getAttribute('data-cor-base'); });
    pathElement.setAttribute('data-selecionado', 'true');
    pathElement.style.fill = "#FF4500"; 
    
    const idRegiao = pathElement.id.replace('mini-', '').toLowerCase();
    const todosDestaRegiao = window.dadosGerais.filter(d => d.id === idRegiao).sort((a, b) => a.ordem - b.ordem);
    const ativo = infoSelecionado || todosDestaRegiao[0];
    
    const containerBotoes = document.getElementById('container-vitrine-botoes');
    if(containerBotoes) {
        containerBotoes.innerHTML = "";
        todosDestaRegiao.forEach(item => {
            if (item.nomeCurto !== (ativo ? ativo.nomeCurto : "")) {
                const btn = document.createElement('div');
                const ehComplexo = item.categoria === "COMPLEXO";
                const corZ = (item.zona === "ZO") ? "#ff8c00" : (item.zona === "ZL") ? "#e31c19" : (item.zona === "ZN") ? "#0054a6" : (item.zona === "ZS") ? "#d1147e" : "#00713a";
                
                btn.className = 'menu-item-mrv' + (ehComplexo ? ' estilo-complexo' : '');
                btn.innerHTML = `<span>${item.nomeCurto.toUpperCase()}</span><span style="opacity:0.8; font-size:0.6rem;">${obterNomeZona(item.zona)}</span>`;
                
                const estiloBase = `height:${ALTURA_PADRAO}; display:flex; align-items:center; justify-content:space-between; padding:0 10px; font-size:0.7rem; margin-bottom:4px; border-radius:4px; cursor:pointer; border-right:4px solid ${corZ};`;
                const cores = ehComplexo 
                    ? `background:${corZ}; color:#fff; font-weight:800;` 
                    : `background:#fff; color:#333;`;

                btn.style.cssText = estiloBase + cores;
                btn.onclick = (e) => { e.stopPropagation(); clicarNoMapa(pathElement, item, pDataRaw); };
                containerBotoes.appendChild(btn);
            }
        });
    }
    if (ativo) exibirDadosResidencial(ativo);
}

function desenharMapa(dados, targetId, ehMin) {
    const container = document.getElementById(targetId);
    if (!container || !dados) return;
    container.innerHTML = "";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", dados.viewBox);
    if (!ehMin) {
        const conf = AJUSTES_MAPA[mapaAtivo];
        svg.style.marginRight = conf.marginRight; svg.style.marginLeft = conf.marginLeft; svg.style.transform = `scale(${conf.scale})`;
    }
    const g = document.createElementNS(svgNS, "g");
    if(dados.transform) g.setAttribute("transform", dados.transform);
    dados.paths.forEach(p => {
        const path = document.createElementNS(svgNS, "path");
        const idL = p.id.toLowerCase();
        const ehMRV = p.class === "commrv" || window.dadosGerais.some(d => d.id === idL);
        path.setAttribute("d", p.d);
        path.setAttribute("id", (ehMin ? 'mini-' : '') + p.id);
        path.setAttribute('data-name', p.name || p.id);
        const corBase = ehMRV ? "#00713a" : "#cccccc";
        path.style.fill = corBase; path.style.stroke = "#fff"; path.style.strokeWidth = (ehMin || !ehMRV) ? "0" : "1.2";
        path.setAttribute('data-cor-base', corBase);
        if (!ehMin) path.onclick = (e) => { e.stopPropagation(); if (p.id === "grandesaopaulo") trocarMapas(); else clicarNoMapa(path, null, p); };
        g.appendChild(path);
    });
    svg.appendChild(g); container.appendChild(svg);
}

function trocarMapas() { solicitarFullscreen(); mapaAtivo = (mapaAtivo === "GSP") ? "INTERIOR" : "GSP"; regiaoAtivaGeral = null; atualizarVisualizacao(); atualizarTextoTopo(null); }
function atualizarVisualizacao() { if (typeof MAPA_GSP !== 'undefined' && typeof MAPA_INTERIOR !== 'undefined') { desenharMapa(mapaAtivo === "GSP" ? MAPA_GSP : MAPA_INTERIOR, "mapa-container", false); desenharMapa(mapaAtivo === "GSP" ? MAPA_INTERIOR : MAPA_GSP, "mapa-minimizado", true); } }
function atualizarTextoTopo(nome) { const indicador = document.getElementById('identificador-cidade'); if (indicador) indicador.innerText = nome ? nome.toUpperCase() : (mapaAtivo === "GSP" ? "GRANDE SP" : "ESTADO DE SP"); }

/* --------------------------------------------------------------------------
   6. MENU LATERAL E EVENTOS
   -------------------------------------------------------------------------- */
function gerarMenuResidenciais() {
    const lista = document.getElementById('lista-residenciais');
    if (!lista) return;
    lista.innerHTML = "";
    [...window.dadosGerais].sort((a,b)=>a.ordem-b.ordem).forEach(info => {
        const li = document.createElement('li');
        const ehComplexo = info.categoria === "COMPLEXO";
        const corZ = (info.zona === "ZO") ? "#ff8c00" : (info.zona === "ZL") ? "#e31c19" : (info.zona === "ZN") ? "#0054a6" : (info.zona === "ZS") ? "#d1147e" : "#00713a";
        
        li.className = 'menu-item-mrv' + (ehComplexo ? ' estilo-complexo' : '');
        li.innerHTML = `<span>${info.nomeCurto.toUpperCase()}</span><span style="opacity:0.8; font-size:0.6rem;">${obterNomeZona(info.zona)}</span>`;
        
        const estiloBase = `height:${ALTURA_PADRAO}; display:flex; align-items:center; justify-content:space-between; padding-left:25px; width:calc(100% + 10px); font-size:0.75rem; margin-bottom:4px; border-radius:4px; cursor:pointer; margin-left:-10px; border-right:5px solid ${corZ};`;
        const cores = ehComplexo 
            ? `background:${corZ}; color:#fff; font-weight:800;` 
            : `background:#fff; color:#333;`;
            
        li.style.cssText = estiloBase + cores;
        
        li.onclick = (e) => { 
            e.stopPropagation(); 
            solicitarFullscreen(); 
            let p = document.getElementById(info.id); 
            if (!p) { 
                trocarMapas(); 
                setTimeout(() => { 
                    let np = document.getElementById(info.id); 
                    if(np) clicarNoMapa(np, info); 
                }, 400); 
            } else clicarNoMapa(p, info); 
            toggleMenu(); 
        };
        lista.appendChild(li);
    });
}

function toggleMenu() { solicitarFullscreen(); const m = document.getElementById('menu-lateral'); if(m) { m.classList.toggle('menu-aberto'); m.classList.toggle('menu-oculto'); } }
function copyToClipboard(t) { if(!t || t==="#") return alert("Link indisponível"); navigator.clipboard.writeText(t).then(()=>alert("Copiado!")); }

window.onload = () => { carregarPlanilha(); atualizarIconeFullscreen(); };

document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-menu')) toggleMenu();
    if (e.target.closest('#btn-fullscreen')) {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) solicitarFullscreen();
        else { if (document.exitFullscreen) document.exitFullscreen(); else if (document.webkitExitFullscreen) document.webkitExitFullscreen(); }
    }
    if (e.target.closest('#mapa-minimizado')) trocarMapas();
});

/* --------------------------------------------------------------------------
   7. CONTROLE DE ORIENTAÇÃO (AVISO PAISAGEM) E ENTRADA
   -------------------------------------------------------------------------- */
function fecharAvisoEAmpliar() {
    solicitarFullscreen();
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => console.log("Trava de tela ignorada."));
    }
    const aviso = document.getElementById('aviso-orientacao');
    if (aviso) aviso.style.display = 'none';
}
