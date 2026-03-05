// Configurações e Estado Global
let DADOS_PLANILHA = [];
let pathSelecionado = null;
let regiaoAtual = "gsp";

// Função para formatar o estoque visualmente
function obterHtmlEstoque(valor, tipo) {
    if (tipo === 'N') return ""; // Grupos não mostram estoque
    
    let num = parseInt(valor);
    let texto = "";
    let classe = "estoque-status";

    if (tipo === 'L') {
        texto = isNaN(num) ? "LANÇAMENTO" : `LANÇAMENTO (${num} un.)`;
        classe += " estoque-lancamento";
    } else {
        if (valor === "VENDIDO" || num === 0) {
            texto = "VENDIDO";
            classe += " estoque-vendido";
        } else if (num < 6) {
            texto = `restam ${num} un.`;
            classe += " estoque-alerta";
        } else {
            texto = `restam ${num} un.`;
        }
    }
    return `<span class="${classe}">${texto}</span>`;
}

// Limpeza de links do Google Drive para Preview
function limparLinkDrive(url) {
    if (!url || typeof url !== 'string' || !url.includes('drive.google.com')) return url;
    const match = url.match(/\/d\/(.+?)\/|\/d\/(.+?)$|id=(.+?)(&|$)/);
    const id = match ? (match[1] || match[2] || match[3]) : null;
    return id ? `https://drive.google.com/file/d/${id}/preview` : url;
}

// Copiar link para o clipboard com Toast
function copiarLink(url, nome) {
    navigator.clipboard.writeText(url).then(() => {
        const x = document.getElementById("toast");
        x.innerText = `${nome} copiado!`;
        x.className = "show";
        setTimeout(() => { x.className = ""; }, 2000);
    });
}
