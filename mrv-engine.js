let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

const COL = {
    ID: 0, TIPO: 1, NOME: 2, ESTOQUE: 3, END: 4, BAIRRO: 5, CIDADE: 6,
    ENTREGA: 7, PRECO: 8, P_DE: 9, P_ATE: 10, OBRA: 11, DICA: 12, BK_CLI: 19
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
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
            return {
                id_path: c[COL.ID]?.toLowerCase(),
                tipo: c[COL.TIPO] || "R",
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
                book: limparLinkDrive(c[COL.BK_CLI])
            };
        }).filter(i => i.nome);

        if (typeof gerarListaLateral === 'function') gerarListaLateral();
        desenharMapas();
    } catch (e) { console.error("Erro:", e); }
}

function obterHtmlEstoque(valor, tipo) {
    if (tipo === 'N') return "";
    if (!valor || valor.trim() === "") return `<span class="badge-estoque" style="color:#666">CONSULTAR</span>`;
    
    const n = parseInt(valor);
    if (valor.toUpperCase() === "VENDIDO" || n === 0) return `<span class="badge-estoque" style="color:#999">VENDIDO</span>`;
    if (n < 6 && n > 0) return `<span class="badge-estoque" style="color:#e31010;">SÓ ${valor} UN!</span>`;
    return `<span class="badge-estoque">RESTAM ${valor} UN.</span>`;
}

function desenharMapas() {
    const dadosCima = (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR;
    const dadosBaixo = (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP;
    renderizarNoContainer('caixa-a', dadosCima, true);
    renderizarNoContainer('caixa-b', dadosBaixo, false);
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
        // Se a fonte do clique for um objeto de dados (vindo da lista lateral)
        let selecionado = (fonte && fonte.nome) ? fonte : null;
        
        // Se não tiver um selecionado específico (clique no mapa), pega o primeiro Tipo N ou o primeiro Residencial
        if (!selecionado) {
            selecionado = imoveis.find(i => i.tipo === 'N') || imoveis.sort((a,b) => a.nome.localeCompare(b.nome))[0];
        }
        
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
    
    // Filtra os outros itens (exclui o que está aberto agora)
    const outros = listaDaCidade.filter(i => i.nome !== selecionado.nome);
    
    document.querySelectorAll('.btRes').forEach(b => b.classList.remove('ativo'));
    const btnEsq = document.getElementById(`btn-esq-${selecionado.nome.replace(/[^a-zA-Z0-9]/g, '-')}`);
    if (btnEsq) btnEsq.classList.add('ativo');

    // Cabeçalho da Vitrine
    let htmlVitrine = `<div class="vitrine-topo">MRV em ${nomeRegiao}</div>`;
    
    // Lista de Botões de Navegação na Vitrine
    htmlVitrine += `<div style="margin-bottom:15px;">
        ${outros.map(o => `<button class="btRes" onclick="navegarVitrine('${o.nome}', '${nomeRegiao}')"><strong>${o.nome}</strong> ${obterHtmlEstoque(o.estoque, o.tipo)}</button>`).join('')}
    </div>`;

    // Conteúdo Principal (O que muda se for Tipo N ou R)
    if (selecionado.tipo === 'N') {
        // VISUAL PARA CONJUNTO/CIDADE (TIPO N)
        htmlVitrine += `
            <div style="border-top:1px solid #eee; padding-top:15px;">
                <div class="btRes ativo" style="cursor:default; margin-bottom:10px;">
                    <strong>${selecionado.nome}</strong>
                </div>
                <div class="info-box" style="background:#fff; margin-top:10px; border: 1px solid #ddd; line-height: 1.6;">
                    <label style="color:var(--mrv-verde); margin-bottom:10px; font-size:0.7rem;">SOBRE O COMPLEXO</label>
                    <p style="font-size:0.85rem; color:#444; text-align:justify;">${selecionado.dica || "Informações sobre este complexo em breve."}</p>
                </div>
                ${selecionado.book ? `<a href="${selecionado.book}" target="_blank" class="btRes" style="background:var(--mrv-verde); color:white; justify-content:center; font-weight:bold; margin-top:15px; border:none;">📄 Ver Apresentação do Complexo</a>` : ""}
            </div>`;
    } else {
        // VISUAL PARA RESIDENCIAL COMUM (TIPO R)
        htmlVitrine += `
            <div style="border-top:1px solid #eee; padding-top:15px;">
                <div class="btRes ativo" style="cursor:default; margin-bottom:10px;">
                    <strong>${selecionado.nome}</strong> ${obterHtmlEstoque(selecionado.estoque, selecionado.tipo)}
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

    painel.innerHTML = htmlVitrine;
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
