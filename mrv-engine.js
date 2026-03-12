let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

const COL = {
    ID: 0, CATEGORIA: 1, ORDEM: 2, NOME: 3, NOME_FULL: 4, 
    ESTOQUE: 5, END: 6, TIPOLOGIAS: 7, ENTREGA: 8, 
    P_DE: 9, P_ATE: 10, OBRA: 11, DOCUMENTOS: 15, 
    DICA: 16, DESC_LONGA: 17, BK_CLI: 24
};

async function iniciarApp() {
    // 1. Ajuste da Faixa Verde (Título e Tamanho)
    const topo = document.querySelector('.topo-dashboard');
    if (topo) {
        topo.innerText = "RESIDENCIAIS MRV EM SÃO PAULO";
        topo.style.background = "#00713a";
        topo.style.height = "60px";        // Faixa mais larga
        topo.style.lineHeight = "60px";    // Centraliza o texto verticalmente
        topo.style.fontSize = "1.5rem";    // Fonte maior e imponente
        topo.style.fontWeight = "bold";
        topo.style.display = "block";
        topo.style.width = "100%";
        topo.style.textAlign = "center";
        topo.style.color = "white";
    }

    // 2. Garante que o container do mapa não corte o zoom de 15%
    const caixaA = document.getElementById('caixa-a');
    if (caixaA) {
        caixaA.style.overflow = "visible"; 
        caixaA.style.display = "flex";
        caixaA.style.alignItems = "center";
        caixaA.style.justifyContent = "center";
    }

    try {
        if (typeof MAPA_GSP !== 'undefined') desenharMapas();
        await carregarPlanilha();
    } catch (err) { console.error("Erro na inicialização:", err); }
}

async function carregarPlanilha() {
    const SHEET_ID = "15V194P2JPGCCPpCTKJsib8sJuCZPgtbNb-rtgNaLS7E";
    const URL_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0&v=${new Date().getTime()}`;
    
    try {
        const response = await fetch(URL_CSV);
        let texto = await response.text();
        
        // CORREÇÃO: Garante que a última linha (ex: Grand Prix) seja sempre lida
        if (!texto.endsWith('\n')) texto += '\n';

        const linhas = [];
        let linhaAtual = "", dentroDeAspas = false;
        
        for (let i = 0; i < texto.length; i++) {
            const char = texto[i];
            if (char === '"') dentroDeAspas = !dentroDeAspas;
            if ((char === '\n' || char === '\r') && !dentroDeAspas) {
                if (linhaAtual.trim()) linhas.push(linhaAtual);
                linhaAtual = "";
            } else { linhaAtual += char; }
        }

        DADOS_PLANILHA = linhas.slice(1).map(linha => {
            const colunas = [];
            let campo = "", aspas = false;
            for (let i = 0; i < linha.length; i++) {
                const char = linha[i];
                if (char === '"') aspas = !aspas;
                else if (char === ',' && !aspas) { colunas.push(campo.trim()); campo = ""; }
                else { campo += char; }
            }
            colunas.push(campo.trim());

            const catLimpa = colunas[COL.CATEGORIA] ? colunas[COL.CATEGORIA].toUpperCase() : "";
            const ehComplexo = catLimpa.includes('COMPLEXO');

            return {
                id_path: colunas[COL.ID] ? colunas[COL.ID].toLowerCase().replace(/\s/g, '') : "",
                tipo: ehComplexo ? 'N' : 'R',
                ordem: parseInt(colunas[COL.ORDEM]) || 999,
                nome: colunas[COL.NOME] || "",
                cidade: colunas[COL.ID] ? colunas[COL.ID].toUpperCase() : "",
                estoque: colunas[COL.ESTOQUE] || "",
                endereco: colunas[COL.END] || "",
                entrega: colunas[COL.ENTREGA] || "",
                preco: colunas[COL.P_DE] || "Consulte",
                p_de: colunas[COL.P_DE] || "-",
                obra: colunas[COL.OBRA] || "0",
                documentos: colunas[COL.DOCUMENTOS] || "",
                dica: colunas[COL.DICA] || "",
                descLonga: colunas[COL.DESC_LONGA] || "",
                book: colunas[COL.BK_CLI] || ""
            };
        }).filter(i => i.nome && i.nome.length > 2);

        DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);
        if (typeof gerarListaLateral === 'function') gerarListaLateral();
        desenharMapas();
    } catch (e) { console.error("Erro CSV:", e); }
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    if (!container || !dados) return;
    
    if (!interativo) { 
        container.style.cursor = "pointer"; 
        container.onclick = trocarMapas; 
    } else { 
        container.onclick = null; 
    }

    const pathsHtml = dados.paths.map(p => {
        const idPathNormalizado = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idPathNormalizado);
        const isGSP = p.id.toLowerCase() === "grandesaopaulo";
        const clique = interativo ? (isGSP ? `onclick="trocarMapas()"` : `onclick="cliqueNoMapa('${p.id}', '${p.name}', ${temMRV})"`) : "";
        const hover = interativo ? `onmouseover="hoverNoMapa('${p.name}')" onmouseout="resetTitulo()"` : "";
        const classe = (temMRV || isGSP) && interativo ? 'commrv' : '';
        return `<path id="${id}-${p.id}" name="${p.name}" d="${p.d}" class="${classe}" ${clique} ${hover}></path>`;
    }).join('');

    // AUMENTO DE 15% NO MAPA PRINCIPAL (CAIXA-A)
    const zoomStyle = interativo ? 'style="transform: scale(1.15); transform-origin: center; width: 100%; height: 100%;"' : 'style="width: 100%; height: 100%;"';

    container.innerHTML = `
        <svg viewBox="${dados.viewBox}" preserveAspectRatio="xMidYMid meet" ${zoomStyle}>
            <g transform="${dados.transform || ''}">${pathsHtml}</g>
        </svg>`;
}

function desenharMapas() {
    renderizarNoContainer('caixa-a', (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR, true);
    renderizarNoContainer('caixa-b', (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP, false);
}

function cliqueNoMapa(id, nome, temMRV) { if (temMRV) comandoSelecao(id, nome); }

function comandoSelecao(idPath, nomePath, fonte) {
    const idBusca = idPath.toLowerCase().replace(/\s/g, '');
    const imoveis = DADOS_PLANILHA.filter(d => d.id_path === idBusca);
    
    if (imoveis.length > 0) {
        const selecionado = (fonte && fonte.nome) ? fonte : imoveis[0];
        nomeSelecionado = nomePath;
        document.getElementById('cidade-titulo').innerText = nomePath;
        
        if (pathSelecionado) pathSelecionado.classList.remove('path-ativo');
        const el = document.getElementById(`caixa-a-${idPath}`);
        if (el) { el.classList.add('path-ativo'); pathSelecionado = el; }
        
        document.querySelectorAll('.btRes, .separador-complexo-btn').forEach(btn => btn.classList.remove('ativo'));
        
        const idBotao = `btn-esq-${selecionado.nome.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const btnClicado = document.getElementById(idBotao);
        if (btnClicado) btnClicado.classList.add('ativo');
        
        montarVitrine(selecionado, imoveis, nomePath);
    }
}

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    const listaSuperior = listaDaCidade.filter(i => i.nome !== selecionado.nome);
    const urlMaps = `http://google.com/maps?q=${encodeURIComponent(selecionado.endereco)}`;
    
    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao.toUpperCase()}</div><div style="margin-bottom:10px;">${listaSuperior.map(item => {
                const classe = item.tipo === 'N' ? 'separador-complexo-btn' : 'btRes';
                return `<button class="${classe}" onclick="navegarVitrine('${item.nome}', '${nomeRegiao}')"><strong>${item.nome}</strong> ${item.tipo === 'R' ? obterHtmlEstoque(item.estoque, item.tipo) : ''}</button>`;
            }).join('')}</div><div style="padding-top:8px;"><p style="font-size:0.65rem; color:#444; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;"><span>📍 ${selecionado.endereco}</span><a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a></p>`;
    
    if (selecionado.tipo === 'N') {
        const desc = (selecionado.descLonga || "").split('\n').map(p => `<p style="margin-bottom:8px;">${p.trim()}</p>`).join('');
        html += `<div class="box-argumento" style="border-left-color: #00713a; background:#f9f9f9;"><label>Sobre o Complexo</label>${desc}</div>`;
    } else {
        html += `<table class="tabela-mrv"><thead><tr><th>PLANTA</th><th class="laranja">PREÇO A PARTIR</th><th>ENTREGA</th></tr></thead><tbody><tr><td>${selecionado.p_de}</td><td class="destaque">${selecionado.preco}</td><td>${selecionado.entrega}</td></tr></tbody></table><div class="info-box"><label>Status da Obra</label><span>${selecionado.obra}%</span></div>${selecionado.documentos ? `<div class="box-documentos" style="margin-top:8px;"><span>${selecionado.documentos}</span></div>` : ''}${selecionado.dica ? `<div class="box-argumento box-dica"><label>Dica do Corretor</label><p>${selecionado.dica}</p></div>` : ''}<a href="${selecionado.book}" target="_blank" class="btRes" style="background:#00713a; color:white; justify-content:center; font-weight:bold; margin-top:10px; border:none; width:100% !important; height:35px !important; display:flex; align-items:center;">📄 BOOK CLIENTE</a>`;
    }
    painel.innerHTML = html;
}

function navegarVitrine(nome, nomeRegiao) { 
    const imovel = DADOS_PLANILHA.find(i => i.nome === nome); 
    if (imovel) comandoSelecao(imovel.id_path, nomeRegiao, imovel); 
}

function hoverNoMapa(nome) { document.getElementById('cidade-titulo').innerText = nome; }
function resetTitulo() { document.getElementById('cidade-titulo').innerText = nomeSelecionado || "Selecione uma região"; }

function trocarMapas() { 
    mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP'; 
    desenharMapas(); 
    limparInterface(); 
}

function limparInterface() {
    nomeSelecionado = ""; 
    pathSelecionado = null;
    document.getElementById('cidade-titulo').innerText = "Selecione uma região no mapa ou na lista";
    document.getElementById('ficha-tecnica').innerHTML = `<div style="text-align:center; color:#ccc; margin-top:100px;"><p style="font-size: 30px;">📍</p><p>Clique em algum Residencial ou em alguma região verde do mapa</p></div>`;
    document.querySelectorAll('.btRes, .separador-complexo-btn').forEach(btn => btn.classList.remove('ativo'));
}

function obterHtmlEstoque(valor, tipo) { 
    if (tipo === 'N') return ""; 
    const clean = valor ? valor.toString().toUpperCase().trim() : ""; 
    if (clean === "VENDIDO" || clean === "0") return `<span class="badge-estoque" style="color:#999">VENDIDO</span>`; 
    return `<span class="badge-estoque">RESTAM ${valor} UN.</span>`; 
}

iniciarApp();
