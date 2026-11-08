"""Roda as baterias de teste da página num navegador sem janela, com banco e Claude simulados.

Uso:  python artefato/testes/rodar_testes.py
      CANAL=chrome python artefato/testes/rodar_testes.py   (usa o Chrome instalado em vez do Chromium do Playwright)

Precisa de: pip install playwright  e  python -m playwright install chromium  (ou CANAL=chrome).
Sai com código 1 se alguma verificação falhar.
"""
import functools, http.server, json, os, shutil, socketserver, subprocess, sys, tempfile, threading

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(AQUI))
PAGINA = os.path.join(RAIZ, "artefato", "gestao-financeira.html")
SEED = os.path.join(AQUI, "seed_teste.json")

def monta(pasta):
    subprocess.run([sys.executable, os.path.join(AQUI, "build_harness.py"), PAGINA, SEED, os.path.join(pasta, "index.html")],
                   check=True, stdout=subprocess.DEVNULL)
    for f in os.listdir(AQUI):
        if f.endswith(".js"): shutil.copy(os.path.join(AQUI, f), pasta)

class Quieto(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

def serve(pasta):
    h = functools.partial(Quieto, directory=pasta)
    srv = socketserver.TCPServer(("127.0.0.1", 0), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, srv.server_address[1]

PRONTO = "() => typeof S !== 'undefined' && S.cfg && S.loaded && S.loaded.size >= COLLS.length"
CARREGA = """async src => new Promise((ok, erro) => { const s = document.createElement('script'); s.src = src + '?t=' + Date.now(); s.onload = ok; s.onerror = () => erro(new Error('não carregou ' + src)); document.head.append(s); })"""

# (nome, script, chamada, celular?, preparo)
SUITES = [
    ("15.2", "v152.js", "__v152()", False, None),
    ("15.1", "v151.js", "__v151()", False, None),
    ("14 sem saldo real", "v14.js", "__v14()", False, None),
    ("14 com saldo real", "v14.js", "__v14()", False,
     "async () => { await write('config', 'main', { ancora: { data: S.today, conta: 3200, faturaAberta: 0, definida: true, atualizadoEm: nowISO() } }, 'update'); await new Promise(r => setTimeout(r, 500)); }"),
    ("invariantes do modelo", "fuzz.js", "__fuzz(300)", False, None),
    ("cliques em todas as telas", "fuzz.js", "__monkey()", False, None),
    ("largura no celular", "fuzz.js", "__overflow()", True, None),
    ("15 (apaga os dados de teste; por último)", "v15.js", "__v15()", False, None),
]

def falhas_de(nome, r):
    if not isinstance(r, dict): return [f"resultado inesperado: {r!r}"[:300]]
    f = list(r.get("falhas") or []) + [f"erro na página: {e}" for e in (r.get("errs") or [])]
    if nome == "largura no celular":
        for tela, v in r.items():
            if isinstance(v, dict) and v.get("wide"): f.append(f"{tela}: elementos mais largos que a tela: {v['wide'][:3]}")
            if isinstance(v, dict) and v.get("sw", 0) > 400: f.append(f"{tela}: página com {v['sw']} px de largura")
    return f

def main():
    from playwright.sync_api import sync_playwright
    pasta = tempfile.mkdtemp(prefix="gf-testes-")
    monta(pasta)
    srv, porta = serve(pasta)
    total = 0
    try:
        with sync_playwright() as p:
            canal = os.environ.get("CANAL") or None
            nav = p.chromium.launch(channel=canal, headless=True)
            for nome, script, chamada, celular, preparo in SUITES:
                opc = {"viewport": {"width": 375, "height": 812}, "device_scale_factor": 2, "is_mobile": True, "has_touch": True} if celular else {"viewport": {"width": 1280, "height": 900}}
                ctx = nav.new_context(locale="pt-BR", timezone_id="America/Sao_Paulo", **opc)
                pg = ctx.new_page()
                pg.goto(f"http://127.0.0.1:{porta}/index.html")
                pg.wait_for_function(PRONTO, timeout=20000)
                pg.wait_for_timeout(500)
                if preparo: pg.evaluate(preparo)
                pg.evaluate(CARREGA, script)
                r = pg.evaluate(f"async () => await {chamada}")
                f = falhas_de(nome, r)
                ok = r.get("ok") if isinstance(r, dict) else None
                print(("OK   " if not f else "FALHA") + f"  {nome}" + (f" ({ok} verificações)" if isinstance(ok, int) and not isinstance(ok, bool) else ""))
                for x in f[:15]: print("       -", str(x)[:400])
                total += len(f)
                ctx.close()
            nav.close()
    finally:
        srv.shutdown()
        shutil.rmtree(pasta, ignore_errors=True)
    print("\nTudo certo." if not total else f"\n{total} falha(s).")
    sys.exit(1 if total else 0)

if __name__ == "__main__":
    main()
