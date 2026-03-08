let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

// MAPEAMENTO RÍGIDO (A=0, B=1, C=2, D=3...)
const COL = {
    ID: 0,          // ID_PATH
    TIPO: 1,        // CATEGORIA
    ORDEM: 2,       // ORDEM
    NOME: 3,        // NOME_CURTO (Coluna D)
    NOME_FULL: 4,   // NOME_FULL (Coluna E)
    ESTOQUE: 5,     // ESTOQUE (Coluna F)
    END: 6,         // ENDERECO (Coluna G)
    PRECO: 7,       // PRECO (Coluna H)
    ENTREGA: 8,     // ENTREGA (Coluna I)
    P_DE: 9,        // PLANTAS_DE (Coluna J)
    P_ATE: 10,      // PLANTAS_ATE (Coluna K)
    OBRA: 11,       // STATUS_OBRA (Coluna L)
    DICA: 12,       // DICA_CURTA (Coluna M)
    BK_CLI: 20      // BOOK_CLIENTE (Coluna U)
};

async function iniciarApp() {
    await carregarPlanilha();
}

async function carregarPlanilha() {
    const SHEET_ID = "15V194P2JPGCCPpCTKJsib8sJuCZPgtbNb-rtgNaLS7E";
    const URL_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
    
    try {
        const response = await fetch(`${URL_CSV}&v=${new Date().getTime()}`);
        const texto = await response.text();
        const linhas = texto.split(/\r?\n/).filter(l => l.trim() !== "");
        
        DADOS_PLANILHA = linhas.slice(1).map(linha => {
            // REGEX AVANÇADA: Garante que vírgulas dentro de aspas não quebrem a contagem das colunas
            const c = linha.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
            const colunas = c.map(v => v.trim().replace(/^"|"$/g, ''));
            
            // Validação: Se a coluna de nome (3) parece um texto de descrição (muito longo), 
            // algo deu errado no split desta linha específica.
            const nomeBruto = colunas[COL.NOME] || "";
            
            return {
                id_path: colunas[COL.ID]?.toLowerCase() || "",
                tipo: (colunas[COL.TIPO] === 'COMPLEXO' || colunas[COL.TIPO] === 'N') ? 'N' : 'R',
                ordem: parseInt(colunas[COL.ORDEM]) || 999,
                nome: nomeBruto.length > 40 ? "Erro na Linha" : nomeBruto, // Trava de segurança
                nomeFull: colunas[COL.NOME_FULL] || nomeBruto,
                estoque: colunas[COL.ESTOQUE] || "",
                endereco: colunas[COL.END] || "",
                cidade: colunas[COL.ID] ? colunas[COL.ID].toUpperCase() : "", 
                entrega: colunas[COL.ENTREGA] || "",
                preco: colunas[COL.PRECO] || "",
                plantas: (colunas[COL.P_DE] || colunas[COL.P_ATE]) ? `De ${colunas[COL.P_DE]} a ${colunas[COL.P_ATE]}` : "Consulte",
                obra: colunas[COL.OBRA] || "0",
                dica: colunas[COL.DICA] || "",
                book: limparLinkDrive(colunas[COL.BK_CLI] || "")
            };
        }).filter(i => i.id_path !== "" && i.nome !== "Erro na Linha");

        DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);

        if (typeof gerarListaLateral === 'function') gerarListaLateral();
        desenharMapas();
    } catch (e) { console.error("Erro no processamento:", e); }
}

function obterHtmlEstoque(valor, tipo) {
    if (tipo === 'N') return "";
    const cleanVal = valor ? valor.toString().toUpperCase().trim() : "";
    if (cleanVal === "" || cleanVal === "NULL" || cleanVal === "CONSULTAR") 
        return `<span class="badge-estoque" style="color:#666">CONSULTAR</span>`;
    if (cleanVal === "VENDIDO" || cleanVal === "0") 
        return `<span class="badge-estoque" style="color:#999">VENDIDO</span>`;
    
    const n = parseInt(valor);
    if (!isNaN(n)) {
        if (n < 6 && n > 0) return `<span class="badge-estoque" style="color:#e31010;">SÓ ${n} UN!</span>`;
        return `<span class="badge-estoque">RESTAM ${n} UN.</span>`;
    }
    return `<span class="badge-estoque">${valor}</span>`;
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    if (!container) return;
    const pathsHtml = dados.paths.map(p => {
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === p.id.toLowerCase());
        let acaoClique = interativo ? (p.id.toLowerCase() === 'grandesaopaulo' && mapaAtivo === 'INTERIOR' ? `onclick="trocarMapas()"` : `onclick="cliqueNoMapa('${p.id}', '${p.name}', ${temMRV})"`) : "";
        const acoesHover = interativo ? `onmouseover="hoverNoMapa('${p.name}')" onmouseout="resetTitulo()"` : "";
        return `<path id="${id}-${p.id}" name="${p.name}" d="${p.d}" class="${temMRV && interativo ? 'commrv' : ''}" ${acaoClique} ${acoesHover}></path>`;
    }).join('');
    const zoom = interativo ? 'scale(1.2)' : 'scale(0.9)';
    container.innerHTML = `<svg viewBox="${dados.viewBox}" style="transform: ${zoom}; transform-origin: center;"><g transform="${dados.transform || ''}">${pathsHtml}</g></svg>`;
    if (!interativo) { container.onclick = trocarMapas; container.style.cursor = "pointer"; }
}

function desenharMapas() {
    const dadosCima = (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR;
    const dadosBaixo = (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP;
    renderizarNoContainer('caixa-a', dadosCima, true);
    renderizarNoContainer('caixa-b', dadosBaixo, false);
}

function hoverNoMapa(nome) { document.getElementById('cidade-titulo').innerText = nome; }
function resetTitulo() { document.getElementById('cidade-titulo').innerText = nomeSelecionado; }
function cliqueNoMapa(id, nome, temMRV) { if (!temMRV) return; nomeSelecionado = nome; comandoSelecao(id, nome, 'mapa'); }

function comandoSelecao(idPath, nomePath, fonte) {
    const estaNoGSP = MAPA_GSP.paths.some(p => p.id.toLowerCase() === idPath.toLowerCase());
    const estaNoInterior = MAPA_INTERIOR.paths.some(p => p.id.toLowerCase() === idPath.toLowerCase());
    if ((estaNoGSP && mapaAtivo !== 'GSP') || (estaNoInterior && mapaAtivo !== 'INTERIOR')) {
        mapaAtivo = estaNoGSP ? 'GSP' : 'INTERIOR';
        desenharMapas();
    }
    setTimeout(() => {
        const el = document.getElementById(`caixa-a-${idPath}`);
        if (el) {
            if (pathSelecionado) pathSelecionado.classList.remove('path-ativo');
            el.classList.add('path-ativo');
            pathSelecionado = el;
        }
    }, 50);
    nomeSelecionado = nomePath;
    document.getElementById('cidade-titulo').innerText = nomePath;
    const imoveis = DADOS_PLANILHA.filter(d => d.id_path === idPath.toLowerCase());
    if (imoveis.length > 0) {
        const selecionado = (fonte && fonte.nome) ? fonte : imoveis[0];
        montarVitrine(selecionado, imoveis, nomePath);
    }
}

function trocarMapas() { mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP'; limparSelecao(); desenharMapas(); }

function limparSelecao() {
    pathSelecionado = null; nomeSelecionado = "";
    document.querySelectorAll('.btRes').forEach(b => b.classList.remove('ativo'));
    document.getElementById('cidade-titulo').innerText = "";
    document.getElementById('ficha-tecnica').innerHTML = `<div style="text-align:center; color:#ccc; margin-top:100px;"><p style="font-size:30px;">📍</p><p>Selecione um empreendimento</p></div>`;
}

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    const outros = listaDaCidade.filter(i => i.nome !== selecionado.nome && i.tipo !== 'N');
    
    document.querySelectorAll('.btRes').forEach(b => b.classList.remove('ativo'));
    const idLimpo = selecionado.nome.replace(/[^a-zA-Z0-9]/g, '-');
    const btnEsq = document.getElementById(`btn-esq-${idLimpo}`);
    if (btnEsq) btnEsq.classList.add('ativo');

    painel.innerHTML = `
        <div class="vitrine-topo notranslate">${selecionado.nomeFull}</div>
        <div style="margin-bottom:15px;">
            ${outros.map(o => `<button class="btRes notranslate" onclick="navegarVitrine('${o.nome}', '${nomeRegiao}')"><strong class="notranslate">${o.nome}</strong> ${obterHtmlEstoque(o.estoque, o.tipo)}</button>`).join('')}
        </div>
        <div style="border-top:1px solid #eee; padding-top:15px;">
            <div class="btRes ativo notranslate" style="cursor:default; margin-bottom:10px;">
                <strong class="notranslate">${selecionado.nome}</strong> ${obterHtmlEstoque(selecionado.estoque, selecionado.tipo)}
            </div>
            <p style="font-size:0.7rem; color:#666; margin-bottom:10px;">📍 ${selecionado.endereco}</p>
            <div class="ficha-grid">
                <div class="info-box"><label>💰 Preço</label><span>${selecionado.preco}</span></div>
                <div class="info-box"><label>🔑 Entrega</label><span>${selecionado.entrega}</span></div>
                <div class="info-box"><label>📐 Plantas</label><span>${selecionado.plantas}</span></div>
                <div class="info-box"><label>🏗️ Obra</label><span>${selecionado.obra}%</span></div>
            </div>
            <div class="info-box" style="background:#fff5e6; margin-top:10px; border-left: 3px solid var(--mrv-laranja);">
                <label style="color:#d67e00;">💡 Dica do Corretor</label>
                <p style="font-size:0.75rem;">${selecionado.dica}</p>
            </div>
            <a href="${selecionado.book}" target="_blank" class="btRes" style="background:var(--mrv-verde); color:white; justify-content:center; font-weight:bold; margin-top:15px; border:none;">📄 Book Cliente</a>
        </div>`;
}

function navegarVitrine(nome, nomeRegiao) {
    const imovel = DADOS_PLANILHA.find(i => i.nome === nome);
    const lista = DADOS_PLANILHA.filter(i => i.id_path === imovel.id_path);
    montarVitrine(imovel, lista, nomeRegiao);
}

function limparLinkDrive(url) {
    if (!url || !url.includes('drive.google.com')) return url;
    const match = url.match(/\/d\/(.+?)\/|\/d\/(.+?)$|id=(.+?)(&|$)/);
    return match ? `https://drive.google.com/file/d/${match[1]||match[2]||match[3]}/preview` : url;
}
