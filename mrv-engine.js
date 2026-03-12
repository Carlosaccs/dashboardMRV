function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    if(!painel) return;
    
    // Filtra para mostrar os outros empreendimentos da mesma região no topo
    const listaSuperior = listaDaCidade.filter(i => i.nome !== selecionado.nome);
    const urlMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selecionado.endereco)}`;
    
    // Cabeçalho da Vitrine
    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao.toUpperCase()}</div>`;
    
    // Botões de navegação rápida (outros da mesma região)
    if (listaSuperior.length > 0) {
        html += `<div style="margin-bottom:10px;">${listaSuperior.map(item => {
            const classe = item.tipo === 'N' ? 'separador-complexo-btn' : 'btRes';
            return `<button class="${classe}" onclick="navegarVitrine('${item.nome}', '${nomeRegiao}')">
                        <strong>${item.nome}</strong> ${item.tipo === 'R' ? obterHtmlEstoque(item.estoque, item.tipo) : ''}
                    </button>`;
        }).join('')}</div>`;
    }

    // Linha divisória para limpar o olhar
    html += `<hr class="divisor-vitrine">`;

    if (selecionado.tipo === 'N') {
        // --- CENÁRIO COMPLEXO ---
        html += `<div class="titulo-complexo-vitrine">${selecionado.nomeFull}</div>`;
        html += `<div class="endereco-vitrine">
                    <span>📍 ${selecionado.endereco}</span>
                    <a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a>
                 </div>`;
        const desc = (selecionado.descLonga || "").split('\n').map(p => `<p>${p.trim()}</p>`).join('');
        html += `<div class="box-argumento-full"><label>Sobre o Complexo</label>${desc}</div>`;
    
    } else {
        // --- CENÁRIO RESIDENCIAL ---
        // Título escuro para o nome do Residencial
        html += `<div class="titulo-residencial-vitrine">${selecionado.nome}</div>`;
        
        // Tabela de Preços logo abaixo do título
        html += `
        <table class="tabela-mrv">
            <thead>
                <tr>
                    <th>PLANTA</th>
                    <th class="laranja">PREÇO A PARTIR</th>
                    <th>ENTREGA</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${selecionado.p_de}</td>
                    <td class="destaque">${selecionado.preco}</td>
                    <td>${selecionado.entrega}</td>
                </tr>
            </tbody>
        </table>`;

        // Endereço e Botão Maps
        html += `<div class="endereco-vitrine">
                    <span>📍 ${selecionado.endereco}</span>
                    <a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a>
                 </div>`;

        // Barra de Progresso da Obra
        html += `
        <div class="info-box">
            <label>Status da Obra</label>
            <div style="flex:1; margin: 0 10px; background:#eee; height:8px; border-radius:4px; overflow:hidden;">
                <div style="width:${selecionado.obra}%; background:var(--mrv-verde); height:100%;"></div>
            </div>
            <span>${selecionado.obra}%</span>
        </div>`;

        // Dica do Corretor (se houver)
        if (selecionado.dica) {
            html += `<div class="box-argumento box-dica"><label>Dica do Corretor</label><p>${selecionado.dica}</p></div>`;
        }

        // Botão de Book do Cliente
        if (selecionado.book && selecionado.book.length > 5) {
            html += `
            <a href="${selecionado.book}" target="_blank" class="btRes" 
               style="background:var(--mrv-verde); color:white; justify-content:center; font-weight:bold; margin-top:12px; border:none; width:100% !important; height:38px !important;">
               📄 ABRIR BOOK CLIENTE
            </a>`;
        }
    }
    
    painel.innerHTML = html;
}
