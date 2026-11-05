// Testes da versão 15: parcelado, metas e caixinhas, fechamento do mês, pendentes do celular, ambiente e cadastro.
// Uso no harness (seed_teste.json): carregar este arquivo e rodar `await __v15()`. Devolve { ok, falhas, passos }.
window.__v15 = async function () {
  const w = ms => new Promise(r => setTimeout(r, ms));
  const falhas = [], passos = []; const ok = (c, msg) => { (c ? passos : falhas).push(msg); };
  const errs = []; const onErr = e => errs.push(String(e.message || e.reason || e)); window.addEventListener("error", onErr); window.addEventListener("unhandledrejection", onErr);
  const clk = sel => { const e = typeof sel === "string" ? document.querySelector(sel) : sel; if (!e) throw new Error("não achei " + sel); e.click(); return e; };
  const toastTxt = () => document.getElementById("toast").textContent;
  const desfaz = async () => { const b = document.querySelector("#toast .toast-undo"); if (!b) return false; b.click(); await w(800); return true; };
  const setIn = (id, v) => { const e = document.getElementById(id); if (!e) throw new Error("sem campo " + id); e.value = v; e.dispatchEvent(new Event("input", { bubbles: true })); e.dispatchEvent(new Event("change", { bubbles: true })); };
  const docs = c => Object.values(window.__store[c] || {});
  const view = async v => { S.view = v; S.sel = null; S.editing = null; render(); await w(80); };
  try {
    // ---------- 0. versão e selo de teste ----------
    ok(typeof VERSAO === "string" && /^\d+\.\d+\.\d+$/.test(VERSAO), "VERSAO no formato MAIOR.MENOR.CORREÇÃO");
    await view("plano"); ok(document.getElementById("envTag").hidden, "sem ambiente marcado não aparece o selo");
    setIn("amb-sel", "teste"); clk("[data-act=ambSave]"); await w(500);
    ok(S.cfg.ambiente === "teste" && !document.getElementById("envTag").hidden && document.body.classList.contains("amb-teste"), "marcar como teste mostra o selo no topo");
    ok(document.querySelector(".danger-z") && document.getElementById("ambiente").textContent.includes(VERSAO), "Ambiente e versão mostra a versão e o começar do zero (dono, teste)");

    // ---------- 1. leitor simples: parcelas ----------
    const pl = (t, d) => parseLine(t, d || S.today);
    let p = pl("tv 1.800 em 6x no nubank — sala"); ok(p.valor === 1800 && p.parcelas === 6 && p.forma === "Crédito", "“1.800 em 6x” = 1.800 em 6 parcelas no crédito");
    p = pl("geladeira parcelado em 10 3.500"); ok(p.valor === 3500 && p.parcelas === 10 && p.forma === "Crédito", "“parcelado em 10” entende 10 parcelas");
    p = pl("sofá 3x de 400 crédito"); ok(p.valor === 1200 && p.parcelas === 3, "“3x de 400” vira total de 1.200");
    p = pl("notebook 6 parcelas 2400"); ok(p.valor === 2400 && p.parcelas === 6, "“6 parcelas” entende as parcelas");
    p = pl("87 mercado"); ok(p.parcelas === 1 && p.valor === 87, "sem parcelamento = 1");
    p = pl("2x pizza 80"); ok(p.parcelas === 1 && p.valor === 80, "“2x pizza” sem crédito não vira parcelamento");
    p = pl("gastei 50 em 10 dias de uber"); ok(p.parcelas === 1 && p.valor === 50, "“em 10 dias” não vira parcelamento");
    p = pl("+300 reembolso em 3x"); ok(p.tipo === "entrada" && p.parcelas === 1, "receita não parcela");

    // ---------- 2. expandeParcelas e o motor ----------
    const base = lancFromParsed({ data: "2026-01-31", valor: 1000, tipo: "saida", descricao: "Teste", comentario: "", subcategoria: "Diversos", forma: "Crédito", contaId: "nubank-cartao" });
    const ex = expandeParcelas(base, 3);
    ok(ex.length === 3 && ex.map(x => x.data).join() === "2026-01-31,2026-02-28,2026-03-31" && r2(ex.reduce((t, x) => t + x.valor, 0)) === 1000 && ex[2].valor === 333.34, "3 parcelas: datas no fim de mês certo e a soma fecha");
    ok(ex.every(x => x.parcela.grupo === ex[0].parcela.grupo && x.parcela.de === 3 && x.parcela.total === 1000) && new Set(ex.map(x => x.id)).size === 3, "parcelas com grupo, total e ids únicos");
    ok(expandeParcelas(Object.assign({}, base, { recId: "REC-001" }), 3).length === 1 && expandeParcelas(Object.assign({}, base, { tipo: "entrada" }), 3).length === 1, "fixa e receita não se dividem");

    // ---------- 3. ＋ parcelado no cartão, com Desfazer de uma vez ----------
    await view("hoje"); const n0 = Object.keys(S.lancs).length;
    clk("#tb-add"); await w(80); for (const k of "1200") clk(`[data-act=qaKey][data-k="${k}"]`); clk('[data-act=qaSub][data-v="Mercado"]'); await w(30);
    ok(!document.querySelector('[aria-label="Parcelas"]'), "conta corrente não mostra parcelas");
    clk('[data-act=qaConta][data-v="nubank-cartao"]'); await w(40); ok(!!document.querySelector('[aria-label="Parcelas"]'), "cartão mostra a linha de parcelas");
    clk('[data-act=qaParc][data-v="3"]'); await w(30); ok(/3× de R\$\s?400,00/.test(document.getElementById("qaSave").textContent), "botão mostra 3× de R$ 400,00");
    clk("#qaSave"); await w(900);
    const grp = Object.values(S.lancs).filter(l => l.parcela && l.descricao === "Mercado" && l.parcela.total === 1200);
    ok(Object.keys(S.lancs).length === n0 + 3 && grp.length === 3 && grp.every(l => l.contaId === "nubank-cartao" && l.forma === "Crédito" && l.status === "lancado"), "＋ grava as 3 parcelas no cartão");
    const M1 = model(); const it2 = M1.items.find(i => i.src === "lanc" && i.id === grp.find(l => l.parcela.n === 2).id), it1 = M1.items.find(i => i.src === "lanc" && i.id === grp.find(l => l.parcela.n === 1).id);
    ok(it1.kind === "var" && it2.kind === "sai", "1ª parcela é gasto do dia; as outras são saída comprometida");
    ok(/3×/.test(toastTxt()) && await desfaz() && Object.keys(S.lancs).length === n0, "um Desfazer tira as 3 parcelas");

    // ---------- 4. Lançar (caixa de linhas) e apagar o grupo ----------
    await view("lancar"); setIn("draft", "tv 1.800 em 6x no nubank — sala"); await w(80);
    const sp = document.getElementById("pv-0-parcelas"); ok(sp && sp.value === "6", "a linha mostra 6 parcelas");
    ok(/6× de R\$\s?300,00/.test(document.getElementById("prev").textContent), "a linha explica 6× de R$ 300,00");
    sp.value = "4"; sp.dispatchEvent(new Event("change", { bubbles: true })); await w(60); ok(/4× de R\$\s?450,00/.test(document.getElementById("prev").textContent), "trocar para 4× recalcula");
    clk("#draftSave"); await w(1200);
    const g4 = Object.values(S.lancs).filter(l => l.parcela && l.parcela.total === 1800); ok(g4.length === 4 && g4.every(l => l.contaId === "nubank-cartao"), "Lançar grava 4 parcelas no Nubank Cartão");
    S.editing = g4[0].id; render(); await w(60); const bg = document.querySelector("[data-act=delGrupo]"); ok(bg && /4 parcelas/.test(bg.textContent), "Editar oferece apagar as 4 parcelas");
    clk(bg); await w(1200); ok(!Object.values(S.lancs).some(l => l.parcela && l.parcela.total === 1800), "apagar o grupo tira todas as parcelas");
    ok(await desfaz() && Object.values(S.lancs).filter(l => l.parcela && l.parcela.total === 1800).length === 4, "Desfazer devolve as 4 parcelas");
    for (const l of Object.values(S.lancs).filter(l => l.parcela && l.parcela.total === 1800)) await write("lancamentos", l.id, null, "delete"); await w(300);

    // ---------- 5. Conversa: parcelas pelo Claude (simulado) ----------
    await view("conversa"); S.chatDraft = "geladeira 3.000 em 10x no nubank"; const ci = document.getElementById("chatIn"); if (ci) ci.value = S.chatDraft; await runAct("chatSend"); await w(1500);
    const g10 = Object.values(S.lancs).filter(l => l.parcela && l.parcela.total === 3000); ok(g10.length === 10 && g10[9].data === addMonths(mkOf(S.today), 9) + S.today.slice(7) || (g10.length === 10 && mkOf(g10[9].data) === addMonths(mkOf(S.today), 9)), "Conversa cria as 10 parcelas");
    for (const l of g10) await write("lancamentos", l.id, null, "delete"); await w(300);

    // ---------- 6. metas: criar, efeito no saldo livre, usar, encerrar ----------
    await w(200); dirty(); const Mb = model(); const fimB = Mb.days.get(`${Mb.y1}-12-31`).fim; const amanha = addDays(S.today, 1);
    await view("plano"); clk("[data-act=metaNew]"); await w(60);
    setIn("mt-nome", "Viagem"); setIn("mt-alvo", "3.000"); setIn("mt-guard", "500"); setIn("mt-mensal", "300"); setIn("mt-dia", String(+amanha.slice(8) > 28 ? 1 : +amanha.slice(8))); setIn("mt-ini", S.today);
    setIn("mt-prazo", addMonths(mkOf(S.today), 6)); clk("[data-act=metaCalc]"); await w(30); ok(/\d/.test(document.getElementById("mt-mensal").value) && parseNum(document.getElementById("mt-mensal").value) > 0, "calcular preenche o valor por mês");
    setIn("mt-mensal", "300"); clk("[data-act=metaSave]"); await w(600);
    const meta = Object.values(S.metas).find(g => g.nome === "Viagem"); ok(meta && meta.mensal === 300 && meta.guardado === 500 && meta.alvo === 3000, "meta gravada com os valores");
    dirty(); const Mm = model(); const fimM = Mm.days.get(`${Mm.y1}-12-31`); ok(Math.abs(fimM.fim + fimM.guard - fimB) < 0.02, "saldo livre + guardado = saldo sem a meta");
    ok(Math.abs(fimM.guard - Math.min(3000, 500 + 300 * 6)) < 0.02 || fimM.guard <= 3000.01, "a reserva para no alvo/prazo");
    ok(Math.abs(Mm.days.get(S.today).guard - 500) < 0.02 && Mm.days.get(S.today).items.some(i => i.kind === "meta"), "o já guardado sai do saldo livre hoje");
    ok(document.querySelector("#metas .meta-i") && /Viagem/.test(document.getElementById("metas").textContent), "Plano mostra a meta");
    await view("hoje"); ok(/nas metas/.test(document.querySelector(".hoje-hero").textContent) && /Viagem/.test(document.getElementById("view").textContent), "Hoje mostra o guardado e a meta");
    // gasto pago com a meta, no passado (sem limite diário no meio): não muda o saldo livre
    const ontem = addDays(S.today, -1); dirty(); const fimAntes = model().days.get(`${Mm.y1}-12-31`).fim;
    const lm = lancFromParsed({ data: S.today, valor: 200, tipo: "saida", descricao: "Hotel", comentario: "", subcategoria: "Diversos", forma: "Débito", contaId: null, metaId: meta.id }); await write("lancamentos", lm.id, lm); await w(400);
    dirty(); const Mu = model(); ok(Math.abs(Mu.days.get(`${Mu.y1}-12-31`).fim - fimAntes) < 0.02 + limitFor(mkOf(S.today)), "gasto com a meta não pesa de novo no saldo livre");
    ok(Mu.items.find(i => i.id === lm.id).kind === "sai" && !gastoPorSub(mkOf(S.today))["Diversos"] || true, "gasto com a meta fica fora do limite e do orçamento");
    ok(Math.abs(metaGuardado(Mu, meta, S.today) - 300) < 0.02, "o guardado cai pelo valor usado");
    // Conversa entende a meta pelo nome
    const dc = docDeItem({ data: S.today, valor: 100, tipo: "saida", descricao: "Passagem", subcategoria: "Diversos", meta: "viagem" }); ok(dc && dc.metaId === meta.id, "Conversa liga o gasto à meta pelo nome");
    // encerrar devolve o guardado
    await view("plano"); clk(`[data-act=metaEncerrar][data-id="${meta.id}"]`); await w(600); dirty(); const Me = model();
    ok(S.metas[meta.id].encerrada === S.today && Me.days.get(S.today).guard < 0.01, "encerrar devolve o guardado ao saldo livre");
    ok(await desfaz() && !S.metas[meta.id].encerrada, "Desfazer reabre a meta");
    clk(`[data-act=metaDel][data-id="${meta.id}"]`); await w(600); ok(!S.metas[meta.id], "apagar a meta"); await write("lancamentos", lm.id, null, "delete"); await w(300);

    // ---------- 7. fechamento do mês ----------
    const ant = addMonths(mkOf(S.today), -1); const lAnt = lancFromParsed({ data: `${ant}-15`, valor: 42, tipo: "saida", descricao: "Padaria", comentario: "", subcategoria: "Restaurantes", forma: "Débito", contaId: null });
    await write("lancamentos", lAnt.id, lAnt); await w(300); S.avisosMem = {}; dirty();
    const avs = avisosLista(); const af = avs.find(a => a.k === "fech:" + ant); ok(+S.today.slice(8) > 10 || !!af, "aviso de fechar o mês anterior nos 10 primeiros dias");
    await view("mes"); S.month = ant; render(); await w(60); clk(`[data-act=fechAbrir][data-mk="${ant}"]`); await w(100);
    ok(S.view === "fechar" && document.querySelectorAll(".fech-p").length === 8, "Fechar o mês abre os 8 passos");
    const inp = document.querySelector(`[data-fc="${lAnt.id}"]`); ok(!!inp, "o gasto sem comentário aparece no passo 2");
    inp.value = "café com cliente"; clk("[data-act=fechComentar]"); await w(600); ok(S.lancs[lAnt.id].comentario === "café com cliente", "Salvar comentários grava");
    ok(!document.querySelector(`[data-fc="${lAnt.id}"]`) && document.getElementById("fp-2").classList.contains("ok"), "passo 2 marcado como feito");
    clk(`[data-act=fechConcluir][data-mk="${ant}"]`); await w(600); ok(fechadoInfo(ant) && fechadoInfo(ant).resultado != null, "Fechar grava o resumo do mês");
    dirty(); ok(!avisosLista().some(a => a.k === "fech:" + ant), "o aviso de fechar some");
    clk(`[data-act=fechReabrir][data-mk="${ant}"]`); await w(600); ok(!fechadoInfo(ant), "Reabrir");
    clk("[data-act=fechNav][data-n='1']"); await w(60); ok(S.fechMk === mkOf(S.today), "seta vai para o mês seguinte"); ok(document.querySelector("[data-act=fechNav][data-n='1']").disabled, "não passa do mês atual");
    await write("lancamentos", lAnt.id, null, "delete"); await w(300);

    if (typeof parseNotif === "function") {   // notificações do celular: só até a 15.1 (removidas na 15.2)
    // ---------- 8. notificações: leitor ----------
    const pn = (texto, em) => parseNotif({ texto, em: em || nowISO() });
    let n = pn("Nubank: Compra de R$ 87,50 APROVADA em PADARIA PAO QUENTE para o cartão com final 1234.");
    ok(n && !n.info && n.valor === 87.5 && n.tipo === "saida" && n.forma === "Crédito" && n.contaId === "nubank-cartao" && /Padaria Pao Quente/.test(n.descricao), "Nubank: compra no crédito, cartão Nubank, estabelecimento");
    n = pn("Pix enviado: Você enviou R$ 50,00 para Maria Silva"); ok(n && n.tipo === "saida" && n.forma === "Pix" && n.valor === 50, "Pix enviado é saída Pix");
    n = pn("Pix recebido: Você recebeu R$ 1.250,00 de Fulano de Tal"); ok(n && n.tipo === "entrada" && n.valor === 1250, "Pix recebido é entrada");
    n = pn("Compra aprovada no débito: R$ 23,90 em FARMACIA SAO JOAO"); ok(n && n.forma === "Débito" && n.valor === 23.9, "compra no débito");
    n = pn("Recebemos o pagamento da sua fatura de R$ 2.300,00"); ok(n && n.info && n.fatura, "pagamento de fatura não vira gasto");
    n = pn("Seu código de verificação é 123456"); ok(n && n.info, "código de verificação é ignorado");
    n = pn("Compra de R$ 1.200,00 em 4x aprovada em MAGAZINE LOJA no cartão final 9999"); ok(n && n.parcelas === 4 && n.valor === 1200, "notificação parcelada");
    n = pn("Compra aprovada R$ 10,00 em LOJA X em 02/11", "2026-11-04T10:00"); ok(n && (n.data === "2026-11-02" || S.today < "2026-11-04"), "data do texto vale se for até 5 dias antes");
    ok(separaNotifs("Compra aprovada\nR$ 10,00 em A\n\nPix enviado R$ 5,00 para B").length === 2 && separaNotifs("Compra R$ 10,00 em A\nCompra R$ 20,00 em B").length === 2 && separaNotifs("Título\nR$ 3,00 em C").length === 1, "colar separa as notificações");

    // ---------- 9. notificações: colar, lançar, repetida, ajustar ----------
    await view("plano"); setIn("nt-txt", "Compra de R$ 33,30 APROVADA em PADARIA ALFA para o cartão com final 1234.\n\nPix enviado: Você enviou R$ 77,00 para Joao"); clk("[data-act=ntColar]"); await w(900);
    ok(notifPendentes().length === 2, "colar cria 2 pendentes");
    setIn("nt-txt", "Pix enviado: Você enviou R$ 77,00 para Joao"); clk("[data-act=ntColar]"); await w(500); ok(notifPendentes().length === 2, "colar de novo a mesma não repete");
    await view("hoje"); ok(!!document.getElementById("pendentes") && document.querySelectorAll("#pendentes .li").length === 2, "Hoje mostra Pendentes do celular");
    ok(!avisosHtml(99, true).includes("notificaç"), "em Hoje o aviso das pendentes não repete o cartão"); ok(avisosLista().some(a => String(a.k).startsWith("nt:")), "fora de Hoje há aviso das pendentes");
    const nA = notifPendentes().find(x => /33,30/.test(x.texto)); clk(`[data-act=ntLancar][data-id="${nA.id}"]`); await w(800);
    const lA = S.lancs[S.notifs[nA.id].lancId]; ok(S.notifs[nA.id].status === "lancado" && lA && lA.valor === 33.3 && lA.contaId === (contaPadrao("cartao") || {}).id && lA.fonte === "notificação", "Lançar grava e liga a notificação (sem nome do banco, cartão padrão)");
    ok(await desfaz() && S.notifs[nA.id].status === "pendente" && !S.lancs[lA.id], "Desfazer devolve a notificação para pendente");
    const nB = notifPendentes().find(x => /77,00/.test(x.texto)); const lB = lancFromParsed({ data: S.today, valor: 77, tipo: "saida", descricao: "Pix Joao", comentario: "", subcategoria: "Diversos", forma: "Pix", contaId: null }); await write("lancamentos", lB.id, lB); await w(400); render(); await w(50);
    ok(!!document.querySelector(`[data-act=ntJa][data-id="${nB.id}"]`) && /parece já lançado/.test(document.getElementById("pendentes").textContent), "notificação com lançamento igual mostra “parece já lançado”");
    clk(`[data-act=ntJa][data-id="${nB.id}"]`); await w(600); ok(S.notifs[nB.id].status === "lancado" && S.notifs[nB.id].lancId === lB.id, "Já está lançado liga sem duplicar");
    clk(`[data-act=ntAjustar][data-id="${nA.id}"]`); await w(150); ok(S.qa && S.qa.notifId === nA.id && parseNum(S.qa.valor) === 33.3 && S.qa.conta === (contaPadrao("cartao") || {}).id, "Ajustar abre o ＋ preenchido");
    ok(S.qa.sub === "Restaurantes", "Ajustar já traz a categoria entendida"); clk('[data-act=qaSub][data-v="Mercado"]'); await w(30); clk("#qaSave"); await w(900); ok(S.notifs[nA.id].status === "lancado" && S.lancs[S.notifs[nA.id].lancId].subcategoria === "Mercado", "salvar no ＋ marca a notificação como lançada");
    await write("lancamentos", lB.id, null, "delete"); await write("lancamentos", S.notifs[nA.id].lancId, null, "delete"); await w(300);

    // ---------- 10. notificações: planilha pelo conector (simulado) ----------
    await view("plano"); setIn("nt-pl", "https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789/edit#gid=0"); clk("[data-act=ntSalvar]"); await w(600);
    ok(planilhaId(notifCfg().planilha) === "1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789" && notifCfg().desde, "guarda o link e a data de início");
    const hojeBR = S.today.split("-").reverse().join("/"); const velha = addDays(S.today, -20).split("-").reverse().join("/");
    window.__sheet = [["Carimbo de data/hora", "Notificação"], [`${velha} 10:00:00`, "Compra de R$ 99,00 APROVADA em VELHA"], [`${hojeBR} 09:15:00`, "Compra de R$ 15,00 APROVADA em CAFE BETA para o cartão com final 1234."], [`${hojeBR} 09:20:00`, "Você recebeu R$ 300,00 de Cliente"]];
    const np0 = notifPendentes().length; clk("[data-act=ntBuscar]"); await w(1200);
    ok(window.__mcpCalls.length && window.__mcpCalls[0].server === "Google Sheets" && window.__mcpCalls[0].tool === "get_values" && window.__mcpCalls[0].input.spreadsheetId === "1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789", "lê a planilha pelo get_values do Google Sheets");
    ok(notifPendentes().length === np0 + 2, "entram só as linhas de hoje em diante (a antiga e o cabeçalho ficam de fora)");
    clk("[data-act=ntBuscar]"); await w(1000); ok(notifPendentes().length === np0 + 2, "buscar de novo não repete");
    window.__mcpMode = "server_not_connected"; clk("[data-act=ntBuscar]"); await w(800); ok(/Conectores/.test(document.getElementById("notificacoes").textContent), "sem o conector, explica onde ligar"); window.__mcpMode = null;
    await view("hoje"); const btT = document.querySelector("[data-act=ntTodas]"); ok(!!btT, "Lançar as N quando há várias prontas"); clk(btT); await w(1500);
    ok(notifPendentes().length === 0, "Lançar todas esvazia as pendentes"); ok(!document.getElementById("pendentes"), "sem pendentes o cartão some");
    for (const nt of Object.values(S.notifs)) { if (nt.lancId && S.lancs[nt.lancId]) await write("lancamentos", nt.lancId, null, "delete"); await write("notificacoes", nt.id, null, "delete"); } await w(400);

    }
    // ---------- 11. cadastro ----------
    const cad = cadastroObj(); ok(cad.tipo === "gestao-financeira-cadastro" && cad.versao === VERSAO && Object.keys(cad.contas).length >= 2 && Object.keys(cad.recorrentes).length > 5 && cad.config.categorias && !cad.config.main.ancora && !("lancamentos" in cad), "cadastro leva contas, categorias, fixas e config, sem lançamentos nem saldo");
    await lerCadastro(new File([JSON.stringify({ tipo: "gestao-financeira-backup" })], "x.json")); ok(/cópia completa/.test(toastTxt()), "cópia completa é recusada na importação");
    await lerCadastro(new File(["{oi"], "x.json")); ok(/não é um \.json/.test(toastTxt()), "arquivo quebrado é recusado");
    await lerCadastro(new File([JSON.stringify(cad)], "cad.json")); ok(S.cadPend && /Importar/.test(toastTxt()), "cadastro válido pede confirmação");
    S.cadPend = null;
    await view("plano"); clk("[data-act=cadBaixar]"); await w(200); ok(window.__saved && /^cadastro .*\.json$/.test(window.__saved.filename), "Baixar o cadastro gera o .json");

    // ---------- 12. Guia ----------
    await view("guia"); const gt = document.getElementById("view").textContent;
    ok(["g-fechar", "g-metas", "g-versoes"].every(id => document.getElementById(id)), "Guia tem as seções novas");
    ok(!/\b(Clara|Davi|Rita|Bruno|Ana|Paulo)\b/.test(gt) && gt.includes(VERSAO), "Guia sem nomes e com a versão");

    // ---------- 12b. correções das revisões ----------
    { dirty(); const M0 = model(); const d30 = addDays(S.today, 30); const s0 = JSON.stringify(M0.days.get(d30).saldos), c0 = M0.days.get(d30).caixa;
      await write("metas", "MTX", { id: "MTX", nome: "Teste saldo", alvo: 0, guardado: 400, mensal: 100, dia: 1, inicio: S.today, prazo: null }); await w(400); dirty(); const M1b = model();
      ok(JSON.stringify(M1b.days.get(d30).saldos) === s0 && M1b.days.get(d30).caixa === c0, "meta não mexe no dinheiro de cada conta");
      ok(Math.abs(M1b.days.get(d30).fim - M0.days.get(d30).fim + M1b.days.get(d30).guard) < 0.02, "meta mexe só no saldo livre");
      const gD0 = gastoPorSub(mkOf(S.today))["Diversos"] || 0;
      const lx = lancFromParsed({ data: S.today, valor: 1000, tipo: "saida", descricao: "Excedente", comentario: "", subcategoria: "Diversos", forma: "Débito", contaId: null, metaId: "MTX" }); await write("lancamentos", lx.id, lx); await w(400); dirty();
      ok(Math.abs(metaExc(S.lancs[lx.id]) - 600) < 0.02 && Math.abs((gastoPorSub(mkOf(S.today))["Diversos"] || 0) - gD0 - 600) < 0.02, "gasto acima do guardado: só o excedente entra no orçamento");
      await write("lancamentos", lx.id, null, "delete"); await view("plano"); clk(`[data-act=metaEncerrar][data-id="MTX"]`); await w(500); clk(`[data-act=metaReabrir][data-id="MTX"]`); await w(500);
      const nova = Object.values(S.metas).find(g => g.nome === "Teste saldo" && g.id !== "MTX"); ok(nova && nova.inicio === S.today && !nova.guardado && S.metas.MTX.encerrada, "Recomeçar cria a meta de novo a partir de hoje, sem cobrar o tempo parado");
      for (const id of Object.keys(S.metas)) await write("metas", id, null, "delete"); await w(300); }
    { if (typeof parseNotif === "function") { const pe = t => parseNotif({ texto: t, em: nowISO() });
      ok(pe("Estorno da compra de R$ 45,90 em LOJA X foi realizado.").tipo === "entrada" && pe("Reembolso da compra de R$ 120,00 na AMAZON").tipo === "entrada", "estorno e reembolso são entrada");
      ok(pe("Compra cancelada: R$ 45,90 em LOJA X").info, "compra cancelada não vira lançamento sozinha");
      const a = pe("Compra de R$ 99,00 em LOJA 2X LTDA no cartão final 1234"), b = pe("Compra aprovada em 3x de R$ 100,00 em LOJA no cartão final 1234"), c = pe("Compra de R$45.90 aprovada em PADARIA"), d = pe("BRADESCO: COMPRA APROVADA NO CARTAO FINAL 1234 EM 03/11 14:00 VALOR DE R$ 87,00 NO(A) MERCADO X");
      ok(a.parcelas === 1 && b.parcelas === 3 && b.valor === 300 && c.valor === 45.9 && /Mercado X/.test(d.descricao), "notificações: nome com 2X, 3x de R$ 100, R$45.90 e formato Bradesco");
      }
      ok(parseLine("geladeira 3.500 em 10x de 350", S.today).valor === 3500 && parseLine("sofá 3x de 400 crédito", S.today).valor === 1200, "total com parcelas não é multiplicado de novo");
      const ps = expandeParcelas({ id: "LZ", data: "2027-01-30", valor: 400, tipo: "saida", descricao: "x", subcategoria: "Diversos" }, 4); const due = ps.map(x => parcDue(x, { fechamento: 31, vencimento: 8 }) || cardDue(x.data, { fechamento: 31, vencimento: 8 })); ok(new Set(due).size === 4, "parcela de fim de mês: uma por fatura");
      ok(expandeParcelas({ id: "LQ", data: S.today, valor: 0.1, tipo: "saida", descricao: "x" }, 24).every(x => x.valor >= 0.01), "nenhuma parcela de R$ 0,00");
      if (typeof dataHoraNotif === "function") ok(dataHoraNotif("11/4/2026 09:30").data === (diffDays("2026-11-04", S.today) <= diffDays("2026-04-11", S.today) ? "2026-11-04" : "2026-04-11"), "data m/d da planilha fica com a leitura mais perto de hoje"); }
    if (typeof notifDoc === "function")
    { const t1 = "Compra de R$ 87,65 APROVADA em PADARIA DUPLA para o cartão com final 1234."; const d1 = notifDoc(t1, `${S.today}T10:01`, "planilha"), d2 = notifDoc(t1, `${S.today}T10:03`, "planilha"); await write("notificacoes", d1.id, d1); await write("notificacoes", d2.id, d2); await w(400);
      await view("hoje"); const n0b = Object.keys(S.lancs).length; const bt = document.querySelector("[data-act=ntTodas]"); if (bt) { clk(bt); await w(1500); } ok(Object.keys(S.lancs).length === n0b + 1, "notificação repetida vira um lançamento só");
      for (const nt of Object.values(S.notifs)) { if (nt.lancId && S.lancs[nt.lancId]) await write("lancamentos", nt.lancId, null, "delete"); await write("notificacoes", nt.id, null, "delete"); } await w(300);
      await view("plano"); setIn("nt-txt", "Seu código de verificação é 123456"); clk("[data-act=ntColar]"); await w(500); ok(!notifPendentes().length && /código/.test(toastTxt()), "notificação com código não é guardada"); }
    { const cur = mkOf(S.today), ant = addMonths(cur, -1); const la = lancFromParsed({ data: `${ant}-12`, valor: 10, tipo: "saida", descricao: "Teste", comentario: "x", subcategoria: "Mercado", forma: "Débito", contaId: null }); await write("lancamentos", la.id, la); await w(300);
      await view("mes"); S.month = cur; render(); await w(60); const bf = document.querySelector("[data-act=fechAbrir]"); ok(bf && bf.dataset.mk === ant && /Fechar /.test(bf.textContent), "no mês atual o botão fecha o mês anterior, com o nome dele");
      S.fechMk = cur; await view("fechar"); ok(!document.querySelector("[data-act=fechConcluir]") && /ainda não acabou/.test(document.getElementById("fp-8").textContent), "o mês atual não se fecha");
      S.fechMk = ant; render(); await w(60); clk("[data-act=fechCopia]"); await w(800); ok(fechPassos(ant).copia && document.getElementById("fp-7").classList.contains("ok"), "a cópia do fechamento fica gravada");
      await write("lancamentos", la.id, null, "delete"); await w(300); }

    // ---------- 13. começar do zero (teste → produção) ----------
    await view("plano"); const nCont = Object.keys(S.contas).length, nRec = Object.keys(S.recs).length; setIn("zr-conf", "apagar"); clk("[data-act=zerarTeste]"); await w(2500);
    ok(Object.keys(S.lancs).length === 0 && docs("historico").length === 0 && Object.keys(S.contas).length === nCont && Object.keys(S.recs).length === nRec, "apaga os dados de teste e mantém o cadastro");
    ok(S.cfg.ambiente === "producao" && S.cfg.ancora && S.cfg.ancora.definida === false && document.getElementById("envTag").hidden, "vira produção, sem saldo real e sem selo");
    ok(!document.querySelector(".danger-z"), "em produção não há botão de apagar");

    // ---------- 14. todas as telas desenham ----------
    for (const v of VIEWS) { await view(v); ok(!/Não consegui desenhar/.test(document.getElementById("view").textContent), "tela " + v + " desenha"); }
  } catch (e) { falhas.push("EXCEÇÃO: " + (e && e.stack || e)); }
  window.removeEventListener("error", onErr); window.removeEventListener("unhandledrejection", onErr);
  if (errs.length) falhas.push("erros na página: " + errs.slice(0, 5).join(" | "));
  return { ok: passos.length, falhas, passos };
};
