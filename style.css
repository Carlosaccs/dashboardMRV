:root {
    --mrv-verde: #00713a;
    --mrv-laranja: #ff8c00;
    --vermelho-mrv: #e31010;
    --texto-escuro: #333;
}

* { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
body { display: flex; flex-direction: column; height: 100vh; overflow: hidden; background: white; }

/* FAIXA VERDE CENTRALIZADA */
.header { 
    background-color: var(--mrv-verde) !important; 
    color: white !important; 
    height: 56px !important; 
    line-height: 56px !important; 
    font-size: 1.4rem !important;
    font-weight: bold !important; 
    text-align: center !important;
    width: 100%;
    display: block !important;
}

.wrapper { 
    display: flex; 
    flex: 1; 
    height: calc(100vh - 56px); 
    overflow: hidden; 
}

/* Barra Lateral Esquerda */
.sidebar-esq { width: 280px; border-right: 1px solid #ddd; overflow-y: auto; padding: 10px 0; background: #f8f9fa; flex-shrink: 0; }

.separador-complexo-btn, .btRes {
    width: 92% !important;
    margin: 4px auto !important;
    min-height: 28px !important;
    display: flex !important;
    align-items: center !important;
    padding: 4px 8px !important;
    border-radius: 4px;
    font-size: 0.68rem;
    cursor: pointer;
    border: 1px solid #ddd;
    transition: 0.2s;
    text-align: left;
}

.separador-complexo-btn { background: #333 !important; color: white !important; justify-content: center !important; font-weight: bold; text-transform: uppercase; border: none !important; }
.btRes { background: #fff; border-left: 4px solid var(--mrv-verde) !important; justify-content: space-between; color: var(--texto-escuro); }

.btRes:hover { background-color: #e0e0e0 !important; border: 1px solid var(--mrv-verde) !important; }
.btRes.ativo { background-color: var(--mrv-laranja) !important; color: white !important; border: 1px solid var(--mrv-verde) !important; }
.btRes.ativo strong { color: white !important; }

.badge-estoque { font-size: 0.62rem; font-weight: bold; white-space: nowrap; }

/* Área Central */
.conteudo-centro { flex: 1; display: flex; flex-direction: column; background: #fff; overflow: hidden; }
#cidade-titulo { background: #eee; padding: 4px; text-align: center; font-weight: bold; font-size: 0.7rem; color: #555; height: 28px; display: flex; align-items: center; justify-content: center; }

#caixa-a { 
    flex: 1.3; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    padding: 10px; 
    overflow: hidden; 
    background: transparent !important; 
    border: none !important; 
}

#caixa-b { flex: 0.45; display: flex; align-items: center; justify-content: center; padding: 10px; background: white; overflow: hidden; }

/* MAPAS */
svg { width: 100% !important; height: 100% !important; max-width: 100%; max-height: 100%; display: block; }
path { fill: #777; stroke: #ffffff; stroke-width: 0.8; pointer-events: all; transition: 0.2s; }
path.commrv { fill: var(--mrv-verde) !important; cursor: pointer; }
path:not(.commrv):hover { fill: #bbb !important; }
path.commrv:hover, path.path-ativo { fill: var(--mrv-laranja) !important; stroke: #000 !important; stroke-width: 1px !important; }

/* Vitrine Direita */
.sidebar-dir { width: 480px; border-left: 1px solid #ddd; overflow-y: auto; padding: 10px; flex-shrink: 0; background: #fff; }
.vitrine-topo { background: var(--mrv-verde); color: white; padding: 8px; text-align: center; font-weight: bold; border-radius: 4px; margin-bottom: 10px; font-size: 0.75rem; text-transform: uppercase; }

/* TABELA DE PREÇOS */
.tabela-mrv { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 0.7rem; border: 1px solid #ddd; }
.tabela-mrv th { background: #e0e0e0; padding: 6px; font-weight: 800; border: 1px solid #fff; text-transform: uppercase; }
.tabela-mrv th.laranja { background: var(--mrv-laranja); color: #000; }
.tabela-mrv td { padding: 6px; border: 1px solid #fff; text-align: center; background: #f8f8f8; }
.tabela-mrv td.destaque { background: #fff3d6; font-weight: 800; color: var(--mrv-verde); }

.info-box { background: #f2f2f2; padding: 6px 10px; border-radius: 4px; border: 1px solid #e5e5e5; display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; }
.info-box label { font-size: 0.55rem; color: #666; font-weight: bold; text-transform: uppercase; }
.info-box span { font-size: 0.7rem; font-weight: 700; color: #333; }

.box-argumento { margin-top: 6px; padding: 10px; border-radius: 4px; border-left: 4px solid #ddd; }
.box-argumento label { display: block; font-size: 0.52rem; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
.box-argumento p { font-size: 0.72rem; color: #444; line-height: 1.4; }
.box-dica { background: #fffde6; border-left-color: #f3d221; }

.btn-maps { display: inline-flex; align-items: center; background: #4285F4; color: white !important; text-decoration: none; padding: 4px 8px; border-radius: 4px; font-size: 0.65rem; font-weight: bold; }
