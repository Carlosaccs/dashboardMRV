// ... (mantenha o topo igual)

async function carregarPlanilha() {
    const SHEET_ID = "15V194P2JPGCCPpCTKJsib8sJuCZPgtbNb-rtgNaLS7E";
    const URL_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0&v=${new Date().getTime()}`;
    
    try {
        const response = await fetch(URL_CSV);
        let texto = await response.text();
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

            const catRaw = colunas[COL.CATEGORIA] ? colunas[COL.CATEGORIA].toUpperCase() : "";
            const ehComplexo = (catRaw.includes('COMPLEXO') || catRaw === 'N');

            // --- CORREÇÃO DE SEGURANÇA ---
            let idExtraido = colunas[COL.ID] ? colunas[COL.ID].toLowerCase().replace(/\s/g, '') : "";
            // Se o ID estiver vazio (como no seu print), usa o nome curto como ID temporário para não sumir
            if (!idExtraido && colunas[COL.NOME]) {
                idExtraido = colunas[COL.NOME].toLowerCase().replace(/\s/g, '');
            }

            return {
                id_path: idExtraido,
                tipo: ehComplexo ? 'N' : 'R',
                ordem: parseInt(colunas[COL.ORDEM]) || 999,
                nome: colunas[COL.NOME] || "",
                cidade: colunas[COL.ID] ? colunas[COL.ID].toUpperCase() : "REGIAO",
                estoque: colunas[COL.ESTOQUE] || "",
                endereco: colunas[COL.END] || "",
                entrega: colunas[COL.ENTREGA] || "",
                preco: colunas[COL.PRECO] || "Consulte",
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

// ... (Restante do código igual)
