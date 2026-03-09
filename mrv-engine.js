let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

const COL = {
    ID: 0, TIPO: 1, ORDEM: 2, NOME: 3, NOME_FULL: 4, 
    ESTOQUE: 5, END: 6, PRECO: 7, ENTREGA: 8, 
    P_DE: 9, P_ATE: 10, OBRA: 11, DICA: 12, 
    DESC_LONGA: 13, // Coluna para o texto do complexo
    BK_CLI: 20
};

async function iniciarApp() {
    try {
        if (typeof MAPA_GSP !== 'undefined') {
            desenharMapas();
        }
        await carregarPlanilha();
    } catch (err) {
        console.error("Erro na inicialização:", err);
    }
}

async function carregarPlanilha() {
    const SHEET_ID = "15V194P2JPGCCPpCTKJsib8sJuCZPgtbNb-rtgNaLS7E";
    const URL_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
    
    try {
        const response = await fetch(`${URL_CSV}&v=${new Date().getTime()}`);
        let texto = await response.text();
        
        texto = texto.replace(/"([^"]*)"/g, (m, p1) => p1.replace(/\r?\n|\r/g, " "));
        const linhas = texto.split(/\r?\n/).filter(l => l.trim() !== "");
        
        DADOS_PLANILHA = linhas.slice(1).map(linha => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
            const idLimpo = c[COL.ID] ? c[COL.ID].toLowerCase().replace(/\s/g, '') : "";

            return {
                id_path: idLimpo,
                tipo: (c[COL.TIPO] === 'COMPLEXO' || c[COL.TIPO] === 'N') ? 'N' : 'R',
                ordem: parseInt(c[COL.ORDEM]) || 999,
                nome: c[COL.NOME] || "",
                nomeFull: c[COL.NOME_FULL] || c[COL.NOME],
                estoque: c[COL.ESTOQUE] || "",
                endereco: c[COL.END] || "",
                cidade: c[COL.ID] ? c[COL.ID].toUpperCase() : "", 
                entrega: c[COL.ENTREGA] || "",
                preco: c[COL.PRECO] || "",
                plantas: (c[COL.P_DE] || c[COL.P_ATE]) ? `De ${c[COL.P_DE]} a ${c[COL.P_ATE]}` : "Consulte",
                obra: c[COL.OBRA] || "0",
                dica: c[COL.DICA] || "",
                descLonga: c[COL.DESC_LONGA] || "",
                book: limparLinkDrive(c[COL.BK_CLI] || "")
            };
        }).filter(i => i.id_path !== "" && i.nome.length > 2);

        DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);

        if (typeof gerarListaLateral === 'function') gerarListaLateral();
        desenharMapas(); 

    } catch (e) { 
        console.error("Erro no carregamento dos dados:", e);
        desenharMapas();
    }
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    if (!container || !dados) return;

    const pathsHtml = dados.paths.map(p => {
        const idPathNormalizado = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idPathNormalizado);
        
        const isGrandeSP = p.name.toLowerCase().includes("grande são paulo") || p.id.toLowerCase() === "grandesaopaulo";
        const idAtributo = isGrandeSP ? 'id="grandesaopaulo"' : `id="${id}-${p.id}"`;
        
        let acaoClique = "";
        if (interativo) {
            if (isGrandeSP) {
                acaoClique = `onclick="trocarMapas()"`;
            } else {
                acaoClique = `onclick="cliqueNoMapa('${p.id}', '${p.name}', ${temMRV})"`;
            }
        }

        const acoesHover = interativo ? `onmouseover="hoverNoMapa('${p.name}')" onmouseout="resetTitulo()"` : "";
        const classeExtra = (temMRV || isGrandeSP) && interativo ? 'commrv' : '';
        
        return `<path ${idAtributo} name="${p.name}" d="${p.d}" class="${classeExtra}" ${acaoClique} ${acoesHover}></path>`;
    }).join('');

    const zoom = interativo ? 'scale(1.2)' : 'scale(0.9)';
    container.innerHTML = `<svg viewBox="${dados.viewBox}" style="transform: ${zoom}; transform-origin: center;"><g transform="${dados.transform || ''}">${pathsHtml}</g></svg>`;
    
    if (!interativo) {
        container.onclick = trocarMapas;
        container.style.cursor = "pointer";
    }
}

function desenharMapas() {
    const dadosCima = (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR;
    const dadosBaixo = (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP;
    renderizarNoContainer('caixa-a', dadosCima, true);
    renderizarNoContainer('caixa-b', dadosBaixo, false);
}

function cliqueNoMapa(id, nome, temMRV) {
    if (!temMRV) return;
    comandoSelecao(id, nome);
}

function comandoSelecao(idPath, nomePath, fonte) {
    const idBusca = idPath.toLowerCase().replace(/\s/g, '');
    const imoveis = DADOS_PLANILHA.filter(d => d.id_path === idBusca);
    
    if (imoveis.length > 0) {
        const selecionado = (fonte && fonte.nome) ? fonte : imoveis[0];
        
        // --- TROCA DE MAPA AUTOMÁTICA ---
        const estaNaGrandeSP = MAPA_GSP.paths.some(p => p.id.toLowerCase().replace(/\s/g, '') === idBusca);
        if (estaNaGrandeSP && mapaAtivo !== 'GSP') {
            mapaAtivo = 'GSP';
            desenharMapas();
        } else if (!estaNaGrandeSP && mapaAtivo !== 'INTERIOR') {
            mapaAtivo = 'INTERIOR';
            desenharMapas();
        }

        nomeSelecionado = nomePath;
        const titulo = document.getElementById('cidade-titulo');
        if (titulo) titulo.innerText = nomePath;
        
        if (pathSelecionado) pathSelecionado.classList.remove('path-ativo');
        const el = document.getElementById(`caixa-a-${idPath}`) || document.getElementById('grandesaopaulo');
        if (el) {
            el.classList.add('path-ativo');
            pathSelecionado = el;
        }
        
        montarVitrine(selecionado, imoveis, nomePath);
    }
}

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    if (!painel) return;

    const outros = listaDaCidade.filter(i => i.nome !== selecionado.nome && i.tipo !== 'N');
    
    document.querySelectorAll('.btRes').forEach(b => b.classList.remove('ativo'));
    const idLimpo = selecionado.nome.replace(/[^a-zA-Z0-9]/g, '-');
    const btnEsq = document.getElementById(`btn-esq-${idLimpo}`);
    if (btnEsq) btnEsq.classList.add('ativo');

    let htmlBase = `
        <div class="vitrine-topo notranslate">MRV EM ${nomeRegiao.toUpperCase()}</div>
        <div style="margin-bottom:15px;">
            ${outros.map(o => `<button class="btRes notranslate" onclick="navegarVitrine('${o.nome}', '${nomeRegiao}')"><strong class="notranslate">${o.nome}</strong> ${obterHtmlEstoque(o.estoque, o.tipo)}</button>`).join('')}
        </div>
        <div class="separador-complexo-btn notranslate">
            ${selecionado.nome.toUpperCase()}
        </div>
        <div style="padding-top:10px;">
            <p style="font-size:0.7rem; color:#666; margin-bottom:10px;">📍 ${selecionado.endereco}</p>
    `;

    if (selecionado.tipo === 'N') {
        htmlBase += `
            <div class="info-box" style="background:#f9f9f9; border-left: 3px solid #333; min-height:100px;">
                <label>Sobre o Complexo</label>
                <p style="font-size:0.75rem; line-height:1.4; color:#444; padding-top:5px;">${selecionado.descLonga || "Descrição do complexo disponível em breve."}</p>
            </div>
        `;
    } else {
        htmlBase += `
            <div class="ficha-grid">
                <div class="info-box"><label>💰 Preço</label><span>${selecionado.preco}</span></div>
                <div class="info-box"><label>🔑 Entrega</label><span>${selecionado.entrega}</span></div>
                <div class="info-box"><label>📐 Plantas</label><span>${selecionado.plantas}</span></div>
                <div class="info-box"><label>🏗️ Obra</label><span>${selecionado.obra}%</span></div>
            </div>
            <div class="info-box" style="background:#fff5e6; margin-top:10px; border-left: 3px solid #f37021;">
                <label style="color:#d67e00;">💡 Dica do Corretor</label>
                <p style="font-size:0.75rem;">${selecionado.dica}</p>
            </div>
            <a href="${selecionado.book}" target="_blank" class="btRes" style="background:#00713a; color:white; justify-content:center; font-weight:bold; margin-top:15px; border:none; width:100% !important;">📄 Book Cliente</a>
        `;
    }

    htmlBase += `</div>`;
    painel.innerHTML = htmlBase;
}

function navegarVitrine(nome, nomeRegiao) {
    const imovel = DADOS_PLANILHA.find(i => i.nome === nome);
    if (!imovel) return;
    const lista = DADOS_PLANILHA.filter(i => i.id_path === imovel.id_path);
    montarVitrine(imovel, lista, nomeRegiao);
}

function hoverNoMapa(nome) { 
    const titulo = document.getElementById('cidade-titulo');
    if (titulo) titulo.innerText = nome; 
}

function resetTitulo() { 
    const titulo = document.getElementById('cidade-titulo');
    if (titulo) titulo.innerText = nomeSelecionado || "Selecione uma região"; 
}

function trocarMapas() { 
    mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP'; 
    desenharMapas(); 
    limparSelecao();
}

function limparSelecao() {
    pathSelecionado = null;
    nomeSelecionado = "";
    const titulo = document.getElementById('cidade-titulo');
    if (titulo) titulo.innerText = "Selecione uma região";
    document.querySelectorAll('.btRes').forEach(b => b.classList.remove('ativo'));
    const painel = document.getElementById('ficha-tecnica');
    if (painel) painel.innerHTML = '<div class="vitrine-topo">Aguardando Seleção</div>';
}

function obterHtmlEstoque(valor, tipo) {
    if (tipo === 'N') return "";
    const cleanVal = valor ? valor.toString().toUpperCase().trim() : "";
    if (cleanVal === "" || cleanVal === "NULL" || cleanVal.length > 15) return `<span class="badge-estoque" style="color:#666">CONSULTAR</span>`;
    if (cleanVal === "VENDIDO" || cleanVal === "0") return `<span class="badge-estoque" style="color:#999">VENDIDO</span>`;
    const n = parseInt(valor);
    if (!isNaN(n)) {
        if (n < 6 && n > 0) return `<span class="badge-estoque" style="color:#e31010;">SÓ ${n} UN!</span>`;
        return `<span class="badge-estoque">RESTAM ${n} UN.</span>`;
    }
    return `<span class="badge-estoque">${valor}</span>`;
}

function limparLinkDrive(url) {
    if (!url || !url.includes('drive.google.com')) return url;
    const match = url.match(/\/d\/(.+?)\/|\/d\/(.+?)$|id=(.+?)(&|$)/);
    return match ? `https://drive.google.com/file/d/${match[1]||match[2]||match[3]}/preview` : url;
}
