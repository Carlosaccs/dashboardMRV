function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    if (!painel) return;

    // Filtra para mostrar na lista todos os outros empreendimentos da mesma região
    const outros = listaDaCidade.filter(i => i.nome !== selecionado.nome);
    
    // Sincroniza o destaque na lista da esquerda
    document.querySelectorAll('.btRes').forEach(b => b.classList.remove('ativo'));
    const idLimpo = selecionado.nome.replace(/[^a-zA-Z0-9]/g, '-');
    const btnEsq = document.getElementById(`btn-esq-${idLimpo}`);
    if (btnEsq) btnEsq.classList.add('ativo');

    painel.innerHTML = `
        <div class="vitrine-topo notranslate">MRV EM ${nomeRegiao.toUpperCase()}</div>
        
        <div style="margin-bottom:15px;">
            ${outros.map(o => `
                <button class="btRes notranslate" onclick="navegarVitrine('${o.nome}', '${nomeRegiao}')">
                    <strong class="notranslate">${o.nome}</strong> 
                    ${obterHtmlEstoque(o.estoque, o.tipo)}
                </button>
            `).join('')}
        </div>

        <div class="separador-complexo-btn notranslate" style="margin-top:20px; cursor:default;">
            ${selecionado.nome.toUpperCase()}
        </div>

        <div style="padding-top:10px;">
            <p style="font-size:0.7rem; color:#666; margin-bottom:10px;">📍 ${selecionado.endereco}</p>
            
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

            <a href="${selecionado.book}" target="_blank" class="btRes" style="background:#00713a; color:white; justify-content:center; font-weight:bold; margin-top:15px; border:none; width:100% !important;">
                📄 Book Cliente
            </a>
        </div>
    `;
}
