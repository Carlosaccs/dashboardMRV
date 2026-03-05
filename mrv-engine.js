let DADOS_PLANILHA = [];
let pathSelecionado = null;
let regiaoAtual = "gsp";

// Mapeamento das colunas baseado na sua lista
const COL = {
    ID: 0, TIPO: 1, NOME: 2, ESTOQUE: 3, END: 4, BAIRRO: 5, CIDADE: 6,
    ENTREGA: 7, PRECO: 8, P_DE: 9, P_ATE: 10, OBRA: 11, DICA: 12, OBS: 13,
    LOC: 14, MOB: 15, CULT: 16, COM: 17, SAU: 18,
    BK_CLI: 19, BK_COR: 20, VID1: 21, VID2: 22,
    V_VAR: 23, V_SEM: 24, V_GAR: 25, 
    P_A: 26, P_B: 27, P_C: 28, P_D: 29, P_E: 30, P_F: 31, P_G: 32, P_H: 33,
    MAP_LOC: 34, MAP_IMP: 35,
    DIV: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45] // Diversos 1 ao 10
};

async function carregarPlanilha() {
    const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzECvkefpM6aWy0IacqqI6l84_ti6zS1lSjcrgL0J4OcrtWZLb63sh7U1ZTQ4nsqDMeTU5ykl8xtDe/pub?output=csv";
    try {
        const response = await fetch(`${URL_CSV}&v=${new Date().getTime()}`);
        const texto = await response.text();
        const linhas = texto.split(/\r?\n/).filter(l => l.trim() !== "");
        
        DADOS_PLANILHA = linhas.slice(1).map(linha => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
            return {
                id_path: c[COL.ID]?.toLowerCase(),
                tipo: c[COL.TIPO]?.toUpperCase() || "R",
                nome: c[COL.NOME],
                estoque: c[COL.ESTOQUE],
                endereco: `${c[COL.END]}, ${c[COL.BAIRRO]}`,
                cidade: c[COL.CIDADE],
                entrega: c[COL.ENTREGA],
                preco: c[COL.PRECO],
                plantas: `De ${c[COL.P_DE]} a ${c[COL.P_ATE]}`,
                obra: c[COL.OBRA],
                dica: c[COL.DICA],
                obs: c[COL.OBS],
                links: {
                    bookCli: c[COL.BK_CLI], bookCor: c[COL.BK_COR],
                    vid1: c[COL.VID1], vid2: c[COL.VID2],
                    varanda: c[COL.V_VAR], semVar: c[COL.V_SEM], garden: c[COL.V_GAR],
                    pA: c[COL.P_A], pB: c[COL.P_B], imp: c[COL.MAP_IMP]
                }
            };
        }).filter(i => i.nome);
        gerarListaLateral();
    } catch (e) { console.error("Erro:", e); }
}

function obterHtmlEstoque(valor, tipo) {
    if (tipo === 'N') return "";
    if (tipo === 'L') return `<span class="badge-L">LANÇAMENTO</span>`;
    const n = parseInt(valor);
    if (valor === "VENDIDO" || n === 0) return `<span class="badge-V">VENDIDO</span>`;
    return `<span class="badge-R">RESTAM ${valor} UN.</span>`;
}
