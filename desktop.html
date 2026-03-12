<!DOCTYPE html>
<html lang="pt-br" class="notranslate">
<head>
    <meta charset="UTF-8">
    <meta name="google" content="notranslate">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard MRV SP - v9.6</title>
    <link rel="stylesheet" href="style.css">
    <style>
        /* Ajuste da Faixa Verde (Reduzida em 30%) */
        .header {
            background-color: #00713a !important;
            height: 56px !important; /* Altura reduzida */
            line-height: 56px !important; 
            font-size: 1.4rem !important;
            font-weight: bold !important;
            text-align: center !important;
            color: white !important;
            display: block !important;
            border: none !important;
        }

        /* Remove a cor cinza e bordas da caixa do mapa */
        #caixa-a {
            background: none !important;
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        
        .wrapper {
            height: calc(100vh - 56px);
        }
    </style>
</head>
<body>

    <div class="header">RESIDENCIAIS MRV EM SÃO PAULO</div>

    <div class="wrapper">
        <aside class="sidebar-esq" id="lista-imoveis">
            <div style="padding:20px; color:#666; font-size: 0.8rem;">Carregando...</div>
        </aside>
        
        <main class="conteudo-centro">
            <div id="cidade-titulo">Passe o mouse ou selecione uma cidade</div> 
            <div id="caixa-a"></div> 
            <div id="caixa-b"></div> 
        </main>

        <aside class="sidebar-dir" id="ficha-tecnica">
            <div style="text-align:center; color:#ccc; margin-top:100px;">
                <p style="font-size: 30px;">📍</p>
                <p>Clique em algum Residencial ou em alguma região verde do mapa</p>
            </div>
        </aside>
    </div>

    <script src="mrv-data.js"></script>
    <script src="mrv-engine.js"></script>
    
    <script>
        function gerarListaLateral() {
            const list = document.getElementById('lista-imoveis');
            if (!list) return;
            list.innerHTML = ""; 
            
            DADOS_PLANILHA.forEach(item => {
                if (!item.nome) return;
                const btn = document.createElement('button');
                const idLimpo = item.nome.replace(/[^a-zA-Z0-9]/g, '-');
                btn.id = `btn-esq-${idLimpo}`;
                
                if (item.tipo === 'N') {
                    btn.className = "separador-complexo-btn notranslate";
                    btn.innerHTML = `<strong>${item.nome.toUpperCase()}</strong>`;
                } else {
                    btn.className = "btRes notranslate";
                    btn.innerHTML = `<strong class="notranslate">${item.nome}</strong> ${obterHtmlEstoque(item.estoque, item.tipo)}`;
                }
                
                btn.onclick = () => {
                    if (typeof comandoSelecao === 'function') {
                        comandoSelecao(item.id_path, item.cidade, item);
                    }
                };
                list.appendChild(btn);
            });
        }

        window.onload = function() {
            if (typeof iniciarApp === 'function') iniciarApp();
        };
    </script>
</body>
</html>
