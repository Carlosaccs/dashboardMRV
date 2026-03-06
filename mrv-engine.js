let DADOS_PLANILHA = [];
let pathSelecionado = null;
let mapaAtivo = 'GSP'; // Controla qual mapa está em cima

async function iniciarApp() {
    await carregarPlanilha();
    desenharMapas();
}

// ... (Função carregarPlanilha permanece igual à anterior)

function desenharMapas() {
    const dadosCima = (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR;
    const dadosBaixo = (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP;

    // Mapa de Cima: 10% maior via CSS/Scale e INTERATIVO
    renderizarNoContainer('caixa-a', dadosCima, true);
    // Mapa de Baixo: APENAS BOTÃO DE TROCA
    renderizarNoContainer('caixa-b', dadosBaixo, false);
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    if (!container) return;
    
    const pathsHtml = dados.paths.map(p => {
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === p.id.toLowerCase());
        const acoes = interativo ? `onclick="cliqueNoMapa('${p.id}', '${p.name}')" onmouseover="hoverNoMapa('${p.name}')"` : "";
        return `<path id="${id}-${p.id}" name="${p.name}" d="${p.d}" class="${temMRV && interativo ? 'commrv' : ''}" ${acoes}></path>`;
    }).join('');

    container.innerHTML = `<svg viewBox="${dados.viewBox}" style="transform: ${interativo ? 'scale(1.1)' : 'scale(1)'}; transform-origin: center;">
        <g transform="${dados.transform || ''}">${pathsHtml}</g>
    </svg>`;
    
    // Se for o de baixo, vira um botão de troca
    if (!interativo) {
        container.onclick = trocarMapas;
        container.style.cursor = "pointer";
    } else {
        container.onclick = null;
        container.style.cursor = "default";
    }
}

function trocarMapas() {
    mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP';
    
    // Limpa seleções
    pathSelecionado = null;
    document.querySelectorAll('.btRes').forEach(b => b.classList.remove('ativo'));
    document.getElementById('cidade-titulo').innerText = "SELECIONE UMA REGIÃO NO MAPA";
    document.getElementById('ficha-tecnica').innerHTML = `<div style="text-align:center; color:#ccc; margin-top:100px;"><p>Clique num residencial ou em uma região verde do mapa</p></div>`;
    
    desenharMapas();
}

function hoverNoMapa(nome) {
    // Apenas atualiza o texto se nada estiver clicado (laranja)
    if (!pathSelecionado) {
        document.getElementById('cidade-titulo').innerText = nome;
    }
}

function cliqueNoMapa(idPath, nomePath) {
    const imoveis = DADOS_PLANILHA.filter(d => d.id_path === idPath.toLowerCase() && d.tipo !== 'N');
    const el = document.getElementById(`caixa-a-${idPath}`);
    
    if (el) {
        if (pathSelecionado) pathSelecionado.classList.remove('path-ativo');
        el.classList.add('path-ativo');
        pathSelecionado = el;
    }
    
    document.getElementById('cidade-titulo').innerText = nomePath;
    
    if (imoveis.length > 0) {
        // Por padrão, seleciona o primeiro por ordem alfabética se for clique no mapa
        const ordenados = imoveis.sort((a, b) => a.nome.localeCompare(b.nome));
        montarVitrine(ordenados[0], ordenados, nomePath);
    }
}

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    const outros = listaDaCidade.filter(i => i.nome !== selecionado.nome);
    
    // Título dinâmico conforme sua regra
    const tituloTopo = `MRV em ${nomeRegiao}`;

    painel.innerHTML = `
        <div class="vitrine-topo">${tituloTopo}</div>
        <div class="lista-mini-botoes">
            ${outros.map(o => `
                <button class="btRes" onclick="navegarVitrine('${o.nome}', '${nomeRegiao}')">
                    <strong>${o.nome}</strong> ${obterHtmlEstoque(o.estoque, o.tipo)}
                </button>
            `).join('')}
        </div>
        <div class="detalhe-imovel">
            <h2 style="color:var(--mrv-verde); font-size:1.1rem; margin-bottom:2px;">${selecionado.nome}</h2>
            <div style="margin-bottom:10px;">${obterHtmlEstoque(selecionado.estoque, selecionado.tipo)}</div>
            <p style="font-size:0.7rem; color:#666; margin-bottom:10px;">📍 ${selecionado.endereco}</p>
            <div class="ficha-grid">
                <div class="info-box"><label>💰 Preço</label><span>${selecionado.preco}</span></div>
                <div class="info-box"><label>🔑 Entrega</label><span>${selecionado.entrega}</span></div>
            </div>
            <div class="info-box" style="background:#fff5e6; margin-top:10px; border-left: 3px solid var(--mrv-laranja);">
                <label style="color:#d67e00;">💡 Dica do Corretor</label>
                <p style="font-size:0.75rem;">${selecionado.dica}</p>
            </div>
            <a href="${selecionado.book}" target="_blank" class="btn-link" style="display:block; text-align:center; padding:10px; background:var(--mrv-verde); color:white; text-decoration:none; border-radius:4px; margin-top:15px; font-weight:bold; font-size:0.8rem;">📄 Book Cliente</a>
        </div>
    `;
}

function navegarVitrine(nome, nomeRegiao) {
    const imovel = DADOS_PLANILHA.find(i => i.nome === nome);
    const lista = DADOS_PLANILHA.filter(i => i.id_path === imovel.id_path);
    montarVitrine(imovel, lista, nomeRegiao);
}

function obterHtmlEstoque(valor, tipo) {
    if (tipo === 'N') return "";
    const n = parseInt(valor);
    if (n < 6 && n > 0) return `<span class="badge-estoque" style="color:#e31010; font-weight:800;">SÓ ${valor} UN!</span>`;
    if (valor === "VENDIDO" || n === 0) return `<span class="badge-estoque" style="color:#999">VENDIDO</span>`;
    return `<span class="badge-estoque" style="color:#666">RESTAM ${valor} UN.</span>`;
}
