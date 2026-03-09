let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

const COL = {
    ID: 0, TIPO: 1, ORDEM: 2, NOME: 3, NOME_FULL: 4, 
    ESTOQUE: 5, END: 6, PRECO: 7, ENTREGA: 8, 
    P_DE: 9, P_ATE: 10, OBRA: 11, DICA: 12, 
    DESC_LONGA: 13, 
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
        
        const linhas = [];
        let linhaAtual = "";
        let dentroDeAspas = false;

        for (let i = 0; i < texto.length; i++) {
            const char = texto[i];
            if (char === '"') dentroDeAspas = !dentroDeAspas;
            if ((char === '\n' || char === '\r') && !dentroDeAspas) {
                if (linhaAtual.trim()) linhas.push(linhaAtual);
                linhaAtual = "";
            } else {
                linhaAtual += char;
            }
        }
        if (linhaAtual.trim()) linhas.push(linhaAtual);

        DADOS_PLANILHA = linhas.slice(1).map(linha => {
            const colunas = [];
            let campo = "";
            let aspas = false;

            for (let i = 0; i < linha.length; i++) {
                const char = linha[i];
                if (char === '"') aspas = !aspas;
                else if (char === ',' && !aspas) {
                    colunas.push(campo.trim());
                    campo = "";
                } else {
                    campo += char;
                }
            }
            colunas.push(campo.trim());

            const idLimpo = colunas[COL.ID] ? colunas[COL.ID].toLowerCase().replace(/\s/g, '') : "";

            return {
                id_path: idLimpo,
                tipo: (colunas[COL.TIPO] === 'COMPLEXO' || colunas[COL.TIPO] === 'N') ? 'N' : 'R',
                ordem: parseInt(colunas[COL.ORDEM]) || 999,
                nome: colunas[COL.NOME] || "",
                nomeFull: colunas[COL.NOME_FULL] || colunas[COL.NOME],
                estoque: colunas[COL.ESTOQUE] || "",
                endereco: colunas[COL.END] || "",
                cidade: colunas[COL.ID] ? colunas[COL.ID].toUpperCase() : "", 
                entrega: colunas[COL.ENTREGA] || "",
                preco: colunas[COL.PRECO] || "",
                plantas: (colunas[COL.P_DE] || colunas[COL.P_ATE]) ? `De ${colunas[COL.P_DE]} a ${colunas[COL.P_ATE]}` : "Consulte",
                obra: colunas[COL.OBRA] || "0",
                dica: colunas[COL.DICA] || "",
                descLonga: colunas[COL.DESC_LONGA] || "",
                book: limparLinkDrive(colunas[COL.BK_CLI] || "")
            };
        }).filter(i => i.id_path !== "" && i.nome.length > 2);

        DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);
        if (typeof gerarListaLateral === 'function') gerarListaLateral();
        desenharMapas(); 

    } catch (e) { 
        console.error("Erro no carregamento:", e);
        desenharMapas();
    }
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    if (!container || !dados) return;

    const pathsHtml = dados.paths.map(p => {
        const idPathNormalizado = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idPathNormalizado);
        const isGSP = p.name.toLowerCase().includes("grande são paulo") || p.id.toLowerCase() === "grandesaopaulo";
        const idAttr = isGSP ? 'id="grandesaopaulo"' : `id="${id}-${p.id}"`;
        
        let clique = interativo ? (isGSP ? `onclick="trocarMapas()"` : `onclick="cliqueNoMapa('${p.id}', '${p.name}', ${temMRV})"`) : "";
        const hover = interativo ? `onmouseover="hoverNoMapa('${p.name}')" onmouseout="resetTitulo()"` : "";
        const classe = (temMRV || isGSP) && interativo ? 'commrv' : '';
        
        return `<path ${idAttr} name="${p.name}" d="${p.d}" class="${classe}" ${clique} ${hover}></path>`;
    }).join('');

    const zoom = interativo ? 'scale(1.2)' : 'scale(0.9)';
    container.innerHTML = `<svg viewBox="${dados.viewBox}" style="transform: ${zoom}; transform-origin: center;"><g transform="${dados.transform || ''}">${pathsHtml}</g></svg>`;
    
    if (!interativo) {
        container.onclick = trocarMapas;
        container.style.cursor = "pointer";
    }
}

function desenharMapas() {
    const cima = (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR;
    const baixo = (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP;
    renderizarNoContainer('caixa-a', cima, true);
    renderizarNoContainer('caixa-b', baixo, false);
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
        
        const gspCheck = MAPA_GSP.paths.some(p => p.id.toLowerCase().replace(/\s/g, '') === idBusca);
        if (gspCheck && mapaAtivo !== 'GSP') { mapaAtivo = 'GSP'; desenharMapas(); }
        else if (!gspCheck && mapaAtivo !== 'INTERIOR') { mapaAtivo = 'INTERIOR'; desenharMapas(); }

        nomeSelecionado = nomePath;
        const titulo = document.getElementById('cidade-titulo');
        if (titulo) titulo.innerText = nomePath;
        
        if (pathSelecionado) pathSelecionado.classList.remove('path-ativo');
        const el = document.getElementById(`caixa-a-${idPath}`) || document.getElementById('grandesaopaulo');
        if (el) { el.classList.add('path-ativo'); pathSelecionado = el; }
        
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

    const urlMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selecionado.endereco)}`;

    let html = `
        <div class="vitrine-topo notranslate">MRV EM ${nomeRegiao.toUpperCase()}</div>
        <div style="margin-bottom:15px;">
            ${outros.map(o => `<button class="btRes notranslate" onclick="navegarVitrine('${o.nome}', '${nomeRegiao}')"><strong class="notranslate">${o.nome}</strong> ${obterHtmlEstoque(o.estoque, o.tipo)}</button>`).join('')}
        </div>
        <div class="separador-complexo-btn notranslate">${selecionado.nome.toUpperCase()}</div>
        <div style="padding-top:10px;">
            <p style="font-size:0.75rem; color:#444; margin-bottom:12px; font-weight:500; display: flex; align-items: center; justify-content: space-between;">
                <span>📍 ${selecionado.endereco}</span>
                <a href="${urlMaps}" target="_blank" class="btn-maps">🗺️ Abrir Maps</a>
            </p>
    `;

    if (selecionado.tipo === 'N') {
        // Lógica de Parágrafos: Separa por quebra de linha e envolve em <p>
        const textoProcessado = selecionado.descLonga
            .split('\n')
            .filter(paragrafo => paragrafo.trim() !== '')
            .map(paragrafo => `<p>${paragrafo.trim()}</p>`)
            .join('');

        html += `<div class="desc-longa-texto">${textoProcessado || "Descrição em breve."}</div>`;
    } else {
        html += `
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

    html += `</div>`;
    painel.innerHTML = html;
}

function navegarVitrine(nome, nomeRegiao) {
    const imovel = DADOS_PLANILHA.find(i => i.nome === nome);
    if (!imovel) return;
    const lista = DADOS_PLANILHA.filter(i => i.id_path === imovel.id_path);
    montarVitrine(imovel, lista, nomeRegiao);
}

function hoverNoMapa(nome) { 
    const t = document.getElementById('cidade-titulo');
    if (t) t.innerText = nome; 
}

function resetTitulo() { 
    const t = document.getElementById('cidade-titulo');
    if (t) t.innerText = nomeSelecionado || "Selecione uma região"; 
}

function trocarMapas() { 
    mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP'; 
    desenharMapas(); 
    limparSelecao();
}

function limparSelecao() {
    pathSelecionado = null; nomeSelecionado = "";
    const t = document.getElementById('cidade-titulo');
    if (t) t.innerText = "Selecione uma região";
    document.querySelectorAll('.btRes').forEach(b => b.classList.remove('ativo'));
    const p = document.getElementById('ficha-tecnica');
    if (p) p.innerHTML = '<div class="vitrine-topo">Aguardando Seleção</div>';
}

function obterHtmlEstoque(valor, tipo) {
    if (tipo === 'N') return "";
    const clean = valor ? valor.toString().toUpperCase().trim() : "";
    if (clean === "" || clean === "NULL" || clean.length > 15) return `<span class="badge-estoque" style="color:#666">CONSULTAR</span>`;
    if (clean === "VENDIDO" || clean === "0") return `<span class="badge-estoque" style="color:#999">VENDIDO</span>`;
    const n = parseInt(valor);
    if (!isNaN(n)) {
        if (n < 6 && n > 0) return `<span class="badge-estoque" style="color:#e31010;">SÓ ${n} UN!</span>`;
        return `<span class="badge-estoque">RESTAM ${n} UN.</span>`;
    }
    return `<span class="badge-estoque">${valor}</span>`;
}

function limparLinkDrive(url) {
    if (!url || !url.includes('drive.google.com')) return url;
    const m = url.match(/\/d\/(.+?)\/|\/d\/(.+?)$|id=(.+?)(&|$)/);
    return m ? `https://drive.google.com/file/d/${m[1]||m[2]||m[3]}/preview` : url;
}
