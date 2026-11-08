"""Refaz as imagens do README (docs/imagens/) com um painel de demonstração: só nomes e valores inventados.

Uso:  python artefato/testes/imagens_readme.py
      CANAL=chrome python artefato/testes/imagens_readme.py   (usa o Chrome instalado)

Precisa de: pip install playwright pillow  e  python -m playwright install chromium  (ou CANAL=chrome).
As datas acompanham o dia em que roda; as telas são Ano (computador), Hoje, Mês, Conversa, + e Hoje no tema escuro.
"""
import datetime, functools, http.server, json, os, shutil, socketserver, subprocess, sys, tempfile, threading

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(AQUI))
PAGINA = os.path.join(RAIZ, "artefato", "gestao-financeira.html")
DESTINO = os.path.join(RAIZ, "docs", "imagens")
PRONTO = "() => typeof S !== 'undefined' && S.cfg && S.loaded && S.loaded.size >= COLLS.length"

def banco_demo():
    d = json.load(open(os.path.join(AQUI, "seed_teste.json"), encoding="utf-8"))
    hoje = datetime.date.today(); iso = lambda x: x.isoformat(); dia = lambda n: hoje + datetime.timedelta(days=n)
    d["config"]["main"].update({"titulo": "Gestão Financeira", "subtitulo": "Casa Exemplo · termômetro do caixa", "ambiente": "producao",
        "ancora": {"data": iso(dia(-4)), "conta": 6200, "faturaAberta": 0, "definida": True, "atualizadoEm": iso(dia(-4)) + "T08:00:00-03:00"},
        "diario": {hoje.strftime("%Y-%m"): 60}})
    cats = {c["subcategoria"]: c["categoria"] for c in d["config"]["categorias"]["lista"]}
    gastos = [(-1, "Mercado", 86.40, "Mercado", "compras da semana"), (0, "Padaria", 18.90, "Mercado", "pão e leite"),
              (-1, "Uber", 23.50, "Uber", "volta do trabalho"), (-1, "Farmácia", 45.00, "Farmácia", "remédio da gripe"),
              (-2, "iFood", 54.90, "iFood/Delivery", "pizza de sexta"), (-3, "Gasolina", 180.00, "Gasolina", "tanque cheio"),
              (-4, "Restaurante", 96.00, "Restaurantes", "almoço de domingo")]
    for i, (n, desc, v, sub, com) in enumerate(gastos):
        d["lancamentos"][f"DEMO{i}"] = {"id": f"DEMO{i}", "data": iso(dia(n)), "valor": v, "tipo": "saida", "descricao": desc,
            "comentario": com, "categoria": cats.get(sub, "Outros"), "subcategoria": sub, "forma": "Débito", "conta": "Conta Corrente",
            "contaId": "conta-principal", "status": "lancado", "fonte": "manual", "criadoEm": iso(dia(n)) + "T12:00:00-03:00"}
    d["metas"] = {"META1": {"nome": "Viagem de férias", "icone": "✈️", "alvo": 6000, "guardado": 1200, "mensal": 400, "dia": 10,
        "inicio": iso(hoje.replace(day=1) - datetime.timedelta(days=60)), "prazo": None, "contaId": "poupanca", "encerrada": None,
        "criadoEm": iso(hoje) + "T08:00:00-03:00"}}
    d["conversa"] = {
        "M1": {"em": iso(dia(-1)) + "T19:02:10.000-03:00", "papel": "voce", "texto": "gastei 45 na farmácia — remédio da gripe"},
        "M2": {"em": iso(dia(-1)) + "T19:02:14.000-03:00", "papel": "claude", "resposta_a": "M1",
               "texto": "Lancei R$ 45,00 em Farmácia, ontem, com o comentário “remédio da gripe”. A semana segue dentro do limite."},
        "M3": {"em": iso(hoje) + "T09:15:00.000-03:00", "papel": "voce", "texto": "quanto já foi de mercado este mês?"},
        "M4": {"em": iso(hoje) + "T09:15:05.000-03:00", "papel": "claude", "resposta_a": "M3",
               "texto": "Em Mercado foram R$ 105,30 este mês, em 2 compras (a maior, R$ 86,40 ontem, com o comentário “compras da semana”). O orçamento do mês é R$ 420,00: ainda cabem R$ 314,70."}}
    return d

class Quieto(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

def abre_lancamento(pg):
    pg.evaluate("() => document.querySelector('#tb-add, [data-act=qaOpen]').click()")
    pg.wait_for_timeout(300)
    for t in ["4", "5", ",", "9", "0"]:
        pg.evaluate("t => { const k = [...document.querySelectorAll('[data-act=qaKey]')].find(x => x.textContent.trim() === t); if (k) k.click(); }", t)
        pg.wait_for_timeout(80)
    pg.evaluate("() => { const c = [...document.querySelectorAll('[data-act=qaSub]')].find(x => x.textContent.trim() === 'Mercado'); if (c) c.click(); }")
    pg.wait_for_timeout(200)
    pg.evaluate("() => { const i = document.querySelector('#qa textarea, #qa input[id*=com]'); if (i) { i.value = 'compras da semana'; i.dispatchEvent(new Event('input', {bubbles: true})); } }")

TELAS = [  # nome, rota, celular?, escuro?, ação antes da foto
    ("ano-computador", "#ano", False, False, None),
    ("hoje-celular", "#hoje", True, False, None),
    ("mes-celular", "#mes", True, False, None),
    ("conversa-celular", "#conversa", True, False, None),
    ("lancar-rapido-celular", "#hoje", True, False, abre_lancamento),
    ("hoje-celular-escuro", "#hoje", True, True, None),
]

def main():
    from playwright.sync_api import sync_playwright
    from PIL import Image
    pasta = tempfile.mkdtemp(prefix="gf-imagens-")
    seed = os.path.join(pasta, "seed_demo.json")
    json.dump(banco_demo(), open(seed, "w", encoding="utf-8"), ensure_ascii=False)
    subprocess.run([sys.executable, os.path.join(AQUI, "build_harness.py"), PAGINA, seed, os.path.join(pasta, "demo.html")], check=True, stdout=subprocess.DEVNULL)
    srv = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(Quieto, directory=pasta))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    os.makedirs(DESTINO, exist_ok=True)
    try:
        with sync_playwright() as p:
            nav = p.chromium.launch(channel=os.environ.get("CANAL") or None, headless=True)
            for nome, rota, celular, escuro, antes in TELAS:
                opc = {"viewport": {"width": 390, "height": 844}, "device_scale_factor": 2, "is_mobile": True, "has_touch": True} if celular \
                    else {"viewport": {"width": 1280, "height": 860}, "device_scale_factor": 1.5}
                ctx = nav.new_context(color_scheme="dark" if escuro else "light", locale="pt-BR", timezone_id="America/Sao_Paulo", **opc)
                pg = ctx.new_page()
                pg.goto(f"http://127.0.0.1:{srv.server_address[1]}/demo.html{rota}")
                pg.wait_for_function(PRONTO, timeout=20000)
                pg.wait_for_timeout(900)
                if antes: antes(pg); pg.wait_for_timeout(700)
                bruto = os.path.join(pasta, nome + ".png")
                pg.screenshot(path=bruto)
                ctx.close()
                im = Image.open(bruto).convert("RGB")
                im.thumbnail((1600, 1600) if not celular else (585, 1300))
                im.save(os.path.join(DESTINO, nome + ".png"), optimize=True)
                print("ok", nome)
            nav.close()
        # capa: Hoje, Conversa e + lado a lado
        fotos = [Image.open(os.path.join(pasta, n + ".png")).convert("RGB") for n in ("hoje-celular", "conversa-celular", "lancar-rapido-celular")]
        fotos = [f.resize((f.width // 2, f.height // 2), Image.LANCZOS) for f in fotos]
        m = 36; capa = Image.new("RGB", (sum(f.width for f in fotos) + m * (len(fotos) + 1), max(f.height for f in fotos) + 2 * m), (242, 242, 247))
        x = m
        for f in fotos: capa.paste(f, (x, m)); x += f.width + m
        capa.save(os.path.join(DESTINO, "capa.png"), optimize=True)
        print("ok capa")
    finally:
        srv.shutdown()
        shutil.rmtree(pasta, ignore_errors=True)

if __name__ == "__main__":
    main()
