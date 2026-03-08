let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

// AJUSTE AS COLUNAS AQUI DE ACORDO COM SUA PLANILHA REAL
// Se a coluna A é 0, B é 1, C é 2...
const COL = {
    ID: 0,        // Coluna A (ex: pirituba)
    TIPO: 1,      // Coluna B (ex: R ou N)
    NOME: 2,      // Coluna C (Nome Curto para os botões)
    NOME_FULL: 3, // Coluna D (Nome Completo para a ficha)
    ESTOQUE: 4,   // Coluna E
    END: 5,       // Coluna F
    BAIRRO: 6,    // Coluna G
    CIDADE: 7,    // Coluna H
    ENTREGA: 8,   // Coluna I
    PRECO: 9,     // Coluna J
    P_DE: 10,     // Coluna K
    P_ATE: 11,    // Coluna L
    OBRA: 12,     // Coluna M
    DICA: 13,     // Coluna N
    BK_CLI: 19    // Coluna T (Ajuste se for outra)
};

async function iniciarApp() { await carregarPlanilha(); }

async function carregarPlanilha() {
    const SHEET_ID = "15V194P2JPGCCPpCTKJsib8sJuCZPgtbNb-rtgNaLS7E";
    const URL_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
    
    try {
        const response = await fetch(`${URL_CSV}&v=${new Date().getTime()}`);
        const texto = await response.text();
        // Divide as linhas corretamente
        const linhas = texto.split(/\r?\n/).filter(l => l.trim() !== "");
        
        DADOS_PLANILHA = linhas.slice(1).map(linha => {
            // Regex para não quebrar em vírgulas dentro de aspas
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
            
            return {
                id_path: c[COL.ID]?.toLowerCase(),
                tipo: c[COL.TIPO] || "R",
                nome: c[COL.NOME],
                nomeExibicao: c[COL.NOME_FULL] || c[COL.NOME], // Usa o nome completo na ficha
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

// MANTENHA TODAS AS SUAS FUNÇÕES ORIGINAIS DE MAPA ABAIXO (desenharMapas, renderizarNoContainer, etc.)
// Elas estão corretas nos seus códigos anteriores.

function obterHtmlEstoque(valor, tipo) {
    if (tipo === 'N') return "";
    if (!valor || valor.trim() === "" || valor === "0") return `<span class="badge-estoque" style="color:#666">CONSULTAR</span>`;
    const n = parseInt(valor);
    if (valor.toUpperCase() === "VENDIDO" || n === 0) return `<span class="badge-estoque" style="color:#999">VENDIDO</span>`;
    if (n < 6) return `<span class="badge-estoque" style="color:#e31010;">SÓ ${valor} UN!</span>`;
    return `<span class="badge-estoque">RESTAM ${valor} UN.</span>`;
}

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    const outros = listaDaCidade.filter(i => i.nome !== selecionado.nome && i.tipo !== 'N');
    
    document.querySelectorAll('.btRes').forEach(b => b.classList.remove('ativo'));
    // Busca o botão pelo ID sanitizado
    const idBotao = `btn-esq-${selecionado.nome.replace(/[^a-zA-Z0-9]/g, '-')}`;
    const btnEsq = document.getElementById(idBotao);
    if (btnEsq) btnEsq.classList.add('ativo');

    painel.innerHTML = `
        <div class="vitrine-topo">${selecionado.nomeExibicao}</div>
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
// Restante das funções (cliqueNoMapa, comandoSelecao, etc.) permanecem iguais ao seu original.
