let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

// MAPEAMENTO BASEADO NA SUA LISTA ATUAL
const COL = {
    ID: 0,          // ID_PATH
    TIPO: 1,        // CATEGORIA (R ou COMPLEXO)
    ORDEM: 2,       // ORDEM
    NOME: 3,        // NOME_CURTO (Para os botões)
    NOME_FULL: 4,   // NOME_FULL (Para o título da ficha)
    ESTOQUE: 5,     // ESTOQUE
    END: 6,         // ENDERECO
    PRECO: 7,       // PRECO
    ENTREGA: 8,     // ENTREGA
    P_DE: 9,        // PLANTAS_DE
    P_ATE: 10,      // PLANTAS_ATE
    OBRA: 11,       // STATUS_OBRA
    DICA: 12,       // DICA_CURTA
    DESC: 13,       // DESCRICAO_LONGA
    BOOK: 20        // BOOK_CLIENTE (Coluna U)
};

async function iniciarApp() { await carregarPlanilha(); }

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
                tipo: c[COL.TIPO] === 'COMPLEXO' ? 'N' : 'R', // Mantendo sua lógica de 'N' para separador
                ordem: parseInt(c[COL.ORDEM]) || 999,
                nome: c[COL.NOME],
                nomeFull: c[COL.NOME_FULL],
                estoque: c[COL.ESTOQUE],
                endereco: c[COL.END],
                preco: c[COL.PRECO],
                entrega: c[COL.ENTREGA],
                plantas: `De ${c[COL.P_DE]} a ${c[COL.P_ATE]}`,
                obra: c[COL.OBRA],
                dica: c[COL.DICA],
                desc: c[COL.DESC],
                book: limparLinkDrive(c[COL.BOOK])
            };
        }).filter(i => i.nome);

        // Ordena pela coluna ORDEM antes de gerar a lista
        DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);

        if (typeof gerarListaLateral === 'function') gerarListaLateral();
        desenharMapas();
    } catch (e) { console.error("Erro:", e); }
}

// MANTENHA SUAS FUNÇÕES ORIGINAIS DE MAPA (desenharMapas, renderizarNoContainer, etc.) IGUAIS
// Pois você confirmou que os mapas estão funcionando perfeitamente.

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    const outros = listaDaCidade.filter(i => i.nome !== selecionado.nome && i.tipo !== 'N');
    
    // CORREÇÃO DO DESTAQUE: Limpa e aplica a classe 'ativo'
    document.querySelectorAll('.btRes').forEach(b => b.classList.remove('ativo'));
    const idBotao = `btn-esq-${selecionado.nome.replace(/[^a-zA-Z0-9]/g, '-')}`;
    const btnEsq = document.getElementById(idBotao);
    if (btnEsq) btnEsq.classList.add('ativo');

    painel.innerHTML = `
        <div class="vitrine-topo">${selecionado.nomeFull || selecionado.nome}</div>
        <div style="margin-bottom:15px;">
            ${outros.map(o => `<button class="btRes" onclick="navegarVitrine('${o.nome}', '${nomeRegiao}')"><strong>${o.nome}</strong> ${obterHtmlEstoque(o.estoque, o.tipo)}</button>`).join('')}
        </div>
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

// MANTENHA AS DEMAIS FUNÇÕES (navegarVitrine, trocarMapas, etc.) COMO ESTÃO.
