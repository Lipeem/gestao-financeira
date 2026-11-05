// Testes da versão 14: tela Hoje, lançamento rápido (＋), gestos, Desfazer pelo aviso e avisos.
// Uso no harness: carregar este arquivo e rodar `await __v14()`. Devolve { ok, falhas, passos }.
window.__v14 = async function () {
  const w = ms => new Promise(r => setTimeout(r, ms));
  const falhas = [], passos = []; const ok = (c, msg) => { (c ? passos : falhas).push(msg); };
  const errs = []; const onErr = e => errs.push(String(e.message || e.reason || e)); window.addEventListener("error", onErr); window.addEventListener("unhandledrejection", onErr);
  const clk = sel => { const e = typeof sel === "string" ? document.querySelector(sel) : sel; if (!e) throw new Error("não achei " + sel); e.click(); return e; };
  const toastTxt = () => document.getElementById("toast").textContent;
  const desfaz = async () => { const b = document.querySelector("#toast .toast-undo"); if (!b) return false; b.click(); await w(700); return true; };
  const novoLanc = () => Object.values(S.lancs).sort((a, b) => String(b.criadoEm).localeCompare(String(a.criadoEm)))[0];
  const qaDigita = async (valor, sub) => { clk("#tb-add"); await w(80); for (const k of String(valor)) clk(`[data-act=qaKey][data-k="${k === "," ? "," : k}"]`); await w(30); if (sub) { const b = document.querySelector(`[data-act=qaSub][data-v="${sub}"]`); if (b) b.click(); else { const s = document.getElementById("qa-outra"); s.value = sub; s.dispatchEvent(new Event("change", { bubbles: true })); } } await w(40); };
  try {
    // 0. abre em Hoje e a barra tem Hoje, Mês, ＋, Conversa e Mais
    S.view = "hoje"; render(); await w(60);
    ok(!!document.querySelector(".hoje-hero"), "Hoje desenha o resumo do dia");
    ok(["tb-hoje", "tb-mes", "tb-add", "tb-conversa", "tb-mais"].every(id => document.getElementById(id)), "barra de baixo com Hoje, Mês, ＋, Conversa e Mais");
    ok(["ms-ano", "ms-lancar", "ms-conferir", "ms-plano", "ms-arquivos", "ms-guia"].every(id => document.getElementById(id)), "Mais com Ano, Lançar, Conferir, Plano, Arquivos e Guia");

    // 1. ＋: valor, categoria, Lançar; depois Desfazer
    const n0 = Object.keys(S.lancs).length;
    await qaDigita("87,5", "Mercado");
    ok(document.getElementById("qaSave").textContent.includes("87,50") && !document.getElementById("qaSave").disabled, "botão mostra o valor e a categoria");
    clk("#qaSave"); await w(700);
    const l1 = novoLanc(); ok(Object.keys(S.lancs).length === n0 + 1 && l1.valor === 87.5 && l1.subcategoria === "Mercado" && l1.data === S.today && l1.status === "lancado", "＋ grava o lançamento");
    ok(!S.qa && /Lançado/.test(toastTxt()) && !!document.querySelector("#toast .toast-undo"), "aviso com Desfazer depois de lançar");
    ok(await desfaz() && !S.lancs[l1.id] && /Desfeito/.test(toastTxt()), "Desfazer apaga o que o ＋ lançou");

    // 2. validações do ＋
    clk("#tb-add"); await w(60); ok(document.getElementById("qaSave").disabled, "sem valor o botão fica desligado");
    clk('[data-act=qaKey][data-k="5"]'); await w(20); ok(document.getElementById("qaSave").disabled && /categoria/.test(document.getElementById("qaSave").textContent), "sem categoria o botão pede a categoria");
    const dt = document.getElementById("qa-data"); dt.value = addDays(S.today, 3); dt.dispatchEvent(new Event("change", { bubbles: true })); await w(30); ok(S.qa.data === S.today, "data futura é recusada");
    for (let i = 0; i < 12; i++) clk('[data-act=qaKey][data-k="9"]'); ok(S.qa.valor.replace(/\D/g, "").length <= 7, "valor limitado a 7 dígitos antes da vírgula");
    clk('[data-act=qaKey][data-k=","]'); clk('[data-act=qaKey][data-k=","]'); clk('[data-act=qaKey][data-k="1"]'); clk('[data-act=qaKey][data-k="2"]'); clk('[data-act=qaKey][data-k="3"]'); ok((S.qa.valor.match(/,/g) || []).length === 1 && /,12$/.test(S.qa.valor), "uma vírgula e no máximo 2 decimais");
    clk('[data-act=qaTipo][data-v="entrada"]'); await w(30); ok(S.qa.tipo === "entrada" && [...document.querySelectorAll("[data-act=qaConta]")].every(b => (contaById(b.dataset.v) || {}).tipo === "conta"), "receita só oferece contas");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await w(30); ok(!S.qa && document.getElementById("qa").hidden, "Esc fecha a folha");

    // 3. ＋ liga à fixa quando a categoria é de despesa fixa e o valor está perto do previsto
    // a ocorrência escolhida segue o leitor simples: mês atual ou anterior em aberto; o seguinte só se vence em até 10 dias
    const subsFixas = [...new Set(Object.values(S.recs).filter(r => r.tipo === "saida" && r.ativa !== false && (S.cats.find(c => c.subcategoria === r.subcategoria && c.tipo === "saida") || {}).natureza === "Fixa").map(r => r.subcategoria))];
    let longe = 0; for (const sub of subsFixas) for (const k of qaCandidatas({ tipo: "saida", sub, data: S.today, valor: "" }, false)) { const [rid, mk] = k.split("|"); if (mk > mkOf(S.today) && diffDays(S.today, recDue(S.recs[rid], mk)) > 10) longe++; }
    ok(!longe, "o + nunca liga a uma fixa do mês seguinte que vence daqui a mais de 10 dias");
    const fx = (() => { for (const sub of subsFixas) { const c = qaCandidatas({ tipo: "saida", sub, data: S.today, valor: "" }, false); if (c.length === 1) { const [id, mes] = c[0].split("|"); const o = qaOcc(S.recs[id], S.today); return { id, mes, key: c[0], valor: o.valor, desc: S.recs[id].descricao }; } } return null; })();
    if (fx) { const sub = S.recs[fx.id].subcategoria;
      await qaDigita(String(Math.round(fx.valor * 3)).slice(0, 7), sub); ok(!S.qa.fixa, "valor 3× o previsto não liga à fixa");
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await w(20);
      await qaDigita(String(Math.round(fx.valor)), sub); ok(S.qa.fixa === fx.key, "valor perto do previsto liga à fixa " + fx.desc);
      ok(/previsão dela sai/.test(document.getElementById("qa-fx").textContent), "a folha avisa que vai como fixa");
      clk("#qaSave"); await w(700); const lf = novoLanc(); ok(lf.recId === fx.id && lf.mes === fx.mes, "lançamento gravado como a fixa");
      ok(await desfaz() && !S.lancs[lf.id], "Desfazer devolve a previsão da fixa"); }
    else passos.push("(sem fixa de categoria fixa aberta no banco de teste: teste 3 pulado)");

    // 4. apagar sem confirmação, com Desfazer que também religa a linha do extrato
    const alvo = Object.values(S.lancs).find(l => l.status !== "planejado");
    const xid = "X-TESTE-V14"; await S.db.collection("extrato").doc(xid).set({ id: xid, lote: "T", data: alvo.data, valor: alvo.valor, tipo: alvo.tipo === "entrada" ? "entrada" : "saida", descricao: "TESTE", status: "conciliado", lancId: alvo.id });
    await w(120); const antesL = JSON.stringify(window.__store.lancamentos[alvo.id]);
    await runAct("delYes", { dataset: { id: alvo.id } }); await w(300);
    ok(!S.lancs[alvo.id] && S.extrato[xid].status === "so_extrato", "apagar não pergunta e libera a linha do extrato");
    ok(await desfaz() && JSON.stringify(window.__store.lancamentos[alvo.id]) === antesL && S.extrato[xid].status === "conciliado" && S.extrato[xid].lancId === alvo.id, "Desfazer devolve o lançamento e a ligação com o extrato");
    // 4b. tudo ou nada: se alguém mexe na linha do extrato depois, o Desfazer não devolve nada
    await runAct("delYes", { dataset: { id: alvo.id } }); await w(300); await S.db.collection("extrato").doc(xid).update({ nota: "alguém anotou" }); await w(150);
    ok(await desfaz() && !S.lancs[alvo.id] && /Não desfiz/.test(toastTxt()), "Desfazer é tudo ou nada quando um registro mudou depois");
    await S.db.collection("lancamentos").doc(alvo.id).set(JSON.parse(antesL)); await S.db.collection("extrato").doc(xid).delete(); await w(150);
    // 4c. com a Conversa trabalhando, apagar pede confirmação (ficaria sem Desfazer)
    CHAT.busy = true; await runAct("delYes", { dataset: { id: alvo.id } }); await w(200);
    const bApaga = document.querySelector("#toast .toast-undo"); ok(!!S.lancs[alvo.id] && bApaga && bApaga.textContent === "Apagar", "sem Desfazer possível, apagar pede confirmação");
    if (bApaga) { bApaga.click(); await w(400); } ok(!S.lancs[alvo.id], "confirmar apaga"); CHAT.busy = false;
    await S.db.collection("lancamentos").doc(alvo.id).set(JSON.parse(antesL)); await w(150);
    // 4d. Ctrl+Z desfaz enquanto a mensagem está na tela
    await qaDigita("7", "Mercado"); clk("#qaSave"); await w(600); const lz = novoLanc();
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true })); await w(700); ok(!S.lancs[lz.id], "Ctrl+Z desfaz o último lançamento");
    // 4e. no toque, Editar e Apagar duplicados ficam escondidos (o gesto e o toque na linha substituem)
    if (window.matchMedia("(pointer: coarse)").matches) { S.view = "hoje"; render(); await w(40); const d0 = document.querySelector("#view .li .acts.sw-dup"); ok(!d0 || getComputedStyle(d0).display === "none", "no toque os botões duplicados somem"); }
    // 4f. toque duplo em Apagar: apaga uma vez, com Desfazer e uma linha só no histórico
    { const h0 = S.hist.filter(h => h.acao === "Lançamento apagado" && h.ref === alvo.id).length; const p1 = runAct("delYes", { dataset: { id: alvo.id } }), p2 = runAct("delYes", { dataset: { id: alvo.id } }); await Promise.all([p1, p2]); await w(400);
      ok(!S.lancs[alvo.id] && !!document.querySelector("#toast .toast-undo") && S.hist.filter(h => h.acao === "Lançamento apagado" && h.ref === alvo.id).length === h0 + 1, "toque duplo em Apagar apaga uma vez e mantém o Desfazer");
      ok(await desfaz() && !!S.lancs[alvo.id], "e o Desfazer devolve"); }
    // 4g. "Paga" pelo gesto e pelo botão ao mesmo tempo grava uma vez só
    { const f2 = fixasProximas(31)[0]; if (f2) { const ds = { id: f2.r.id, mk: f2.mk }; await Promise.all([runAct("payRec", { dataset: ds }), runAct("payRec", { dataset: Object.assign({}, ds) })]); await w(300);
        ok((model().ful.get(f2.r.id + "|" + f2.mk) || []).length === 1, "Paga duas vezes seguidas grava uma vez só"); await desfaz(); } }
    // 4h. a mensagem de uma ação aparece uma vez só (já com o Desfazer)
    { const seen = []; const t = document.getElementById("toast"); const mo = new MutationObserver(() => { if (!t.hidden) seen.push(t.textContent); }); mo.observe(t, { childList: true, subtree: true, attributes: true }); await qaDigita("5", "Mercado"); clk("#qaSave"); await w(600); mo.disconnect();
      ok(seen.filter(x => /Lançado/.test(x)).every(x => /Desfazer/.test(x)), "a mensagem não aparece primeiro sem o Desfazer"); await desfaz(); }

    // 5. Desfazer não atropela quem mexeu depois
    await qaDigita("12", "Mercado"); clk("#qaSave"); await w(600); const l5 = novoLanc();
    await S.db.collection("lancamentos").doc(l5.id).update({ comentario: "outra pessoa completou" }); await w(120);
    ok(await desfaz() && !!S.lancs[l5.id] && /mudou depois/.test(toastTxt()), "Desfazer deixa como está o que outra pessoa mudou");
    await S.db.collection("lancamentos").doc(l5.id).delete(); await w(80);

    // 6. editar e desfazer
    const le = Object.values(S.lancs).find(l => l.tipo === "saida" && !l.recId && l.status !== "planejado"); S.view = "lancar"; S.filt.mk = mkOf(le.data); S.filt.kind = "todos"; S.filt.q = ""; render(); await w(40);
    await runAct("edit", { dataset: { id: le.id } }); await w(40); const com0 = le.comentario; document.getElementById("e-com").value = "comentário de teste"; await runAct("editSave", { dataset: { id: le.id } }); await w(300);
    ok(S.lancs[le.id].comentario === "comentário de teste", "editar grava"); ok(await desfaz() && S.lancs[le.id].comentario === com0, "Desfazer volta a edição");

    // 7. saldo real e Desfazer (documento de configuração inteiro)
    S.view = "hoje"; render(); await w(40); const anc0 = JSON.stringify(window.__store.config.main.ancora || null);
    const ic = document.getElementById("anc-conta"); if (ic) { ic.value = "2.345,67"; document.getElementById("anc-fat").value = "100"; await runAct("saveAnchor", document.querySelector('[data-act=saveAnchor][data-src="anc"]')); await w(400);
      ok(anchorOf().definida && Math.abs(anchorOf().conta - 2345.67) < 0.01, "saldo real gravado pelo aviso do topo");
      ok(await desfaz() && JSON.stringify(window.__store.config.main.ancora || null) === anc0, "Desfazer volta o saldo real anterior"); }
    else passos.push("(saldo já informado no banco de teste: teste 7 pulado)");

    // 8. duas ações ao mesmo tempo: nenhuma oferece Desfazer
    clk("#tb-add"); await w(40); clk('[data-act=qaKey][data-k="3"]'); clk('[data-act=qaSub][data-v="Mercado"]'); await w(20);
    const fxr = fixasProximas(31).find(f => f.st !== "paga"); const p1 = runAct("qaSave"); const p2 = fxr ? runAct("payRec", { dataset: { id: fxr.r.id, mk: fxr.mk }, disabled: false }) : Promise.resolve(); await Promise.all([p1, p2]); await w(300);
    ok(!document.querySelector("#toast .toast-undo"), "gravações simultâneas não oferecem Desfazer");
    for (const l of Object.values(S.lancs)) if (l.criadoEm >= addDays(S.today, 0) && (l.valor === 3 || (fxr && l.recId === fxr.r.id && l.mes === fxr.mk))) await S.db.collection("lancamentos").doc(l.id).delete(); await w(120);

    // 9. gesto: fixa para a direita marca paga; lançamento para a esquerda abre Editar/Apagar
    S.view = "hoje"; render(); await w(60);
    const row = document.querySelector(".sw[data-swr]"); if (row) { const btn = row.querySelector(".sw-go"); const rid = btn.dataset.id, rmk = btn.dataset.mk; const r = row.getBoundingClientRect(); const y = r.top + r.height / 2;
      const pe = (t, x) => row.querySelector(".sw-c").dispatchEvent(new PointerEvent(t, { bubbles: true, pointerType: "touch", clientX: x, clientY: y, isPrimary: true }));
      pe("pointerdown", 40); pe("pointermove", 60); pe("pointermove", 120); pe("pointermove", 170); pe("pointerup", 170); await w(600);
      ok(model().ful.has(rid + "|" + rmk), "deslizar a fixa para a direita marca paga");
      ok(await desfaz() && !model().ful.has(rid + "|" + rmk), "Desfazer desmarca a fixa"); }
    else passos.push("(sem fixa na semana: gesto para a direita pulado)");
    render(); await w(60); const rowL = document.querySelector(".sw[data-swl]");
    if (rowL && getComputedStyle(rowL.querySelector(".sw-l")).display === "none") passos.push("(sem tela de toque: gesto para a esquerda não se aplica; os botões ficam à mostra)");
    else if (rowL) { const r = rowL.getBoundingClientRect(); const y = r.top + r.height / 2; const pe = (t, x) => rowL.querySelector(".sw-c").dispatchEvent(new PointerEvent(t, { bubbles: true, pointerType: "touch", clientX: x, clientY: y, isPrimary: true }));
      pe("pointerdown", 300); pe("pointermove", 280); pe("pointermove", 200); pe("pointermove", 140); pe("pointerup", 140); await w(450);
      ok(rowL.classList.contains("open"), "deslizar o lançamento para a esquerda mostra Editar e Apagar");
      const ant = Object.keys(S.lancs).length; rowL.querySelector(".sw-c").click(); await w(60); ok(!rowL.classList.contains("open") && S.view === "hoje" && Object.keys(S.lancs).length === ant, "tocar na linha aberta só fecha"); }
    // gesto vertical não dispara nada
    const rowV = document.querySelector(".sw"); if (rowV) { const r = rowV.getBoundingClientRect(); const pe = (t, y) => rowV.querySelector(".sw-c").dispatchEvent(new PointerEvent(t, { bubbles: true, pointerType: "touch", clientX: 100, clientY: y, isPrimary: true }));
      const ant = Object.keys(S.lancs).length; pe("pointerdown", r.top + 5); pe("pointermove", r.top + 40); pe("pointermove", r.top + 90); pe("pointerup", r.top + 90); await w(200); ok(Object.keys(S.lancs).length === ant && !rowV.classList.contains("open"), "arrastar na vertical não aciona o gesto"); }

    // 10. avisos: dispensar e desfazer
    const av = avisosLista(); if (av.length) { const k = av[0].k; S.view = "hoje"; render(); await w(40); clk(`[data-act=avisoOk][data-k="${CSS.escape(k)}"]`); await w(60);
      ok(!avisosLista().some(a => a.k === k), "✕ dispensa o aviso"); ok(await desfaz() && avisosLista().some(a => a.k === k), "Desfazer traz o aviso de volta"); }
    else passos.push("(banco de teste sem avisos: teste 10 pulado)");

    // 11. leitura: sem ＋ e sem gestos
    S.readOnly = true; render(); await w(40); document.getElementById("tb-add").click(); await w(30);
    ok(!S.qa && !document.querySelector("#view .sw") && !document.querySelector("#view [data-act=qaOpen]"), "acesso só de leitura não mostra ＋ nem gestos"); S.readOnly = false; render(); await w(40);

    // 12. todas as telas desenham sem erro
    for (const v of VIEWS) { S.view = v; render(); await w(30); ok(!/Não consegui desenhar/.test(document.getElementById("view").textContent), "tela " + v + " desenha"); }
    // 13. Guia sem nome de pessoa; Limpar a conversa pede confirmação e apaga só as mensagens
    S.view = "guia"; render(); await w(30); ok(!/\b(Clara|Davi|Rita|Bruno|Ana|Paulo)\b/.test(document.getElementById("view").textContent), "o Guia não cita ninguém pelo nome");
    if (!Object.keys(S.chat.msgs).length) { for (let i = 0; i < 3; i++) { const id = "M-TESTE-" + i; await S.db.collection("conversa").doc(id).set({ id, em: nowISOms(), papel: i % 2 ? "claude" : "voce", texto: "teste " + i }); } await w(150); }
    S.view = "conversa"; render(); await w(40); const nL = Object.keys(S.lancs).length;
    const bl = document.querySelector('[data-act="chatLimparAsk"]'); ok(!!bl, "a Conversa tem o botão Limpar");
    if (bl) { bl.click(); await w(80); ok(!!document.querySelector(".chat-warn") && Object.keys(S.chat.msgs).length > 0, "Limpar mostra o aviso e ainda não apaga");
      clk('[data-act="chatLimparNao"]'); await w(40); ok(!document.querySelector(".chat-warn") && Object.keys(S.chat.msgs).length > 0, "Cancelar não apaga nada");
      clk('[data-act="chatLimparAsk"]'); await w(40); clk('[data-act="chatLimparSim"]'); await w(900);
      ok(!Object.keys(window.__store.conversa || {}).length && Object.keys(S.lancs).length === nL, "Apagar a conversa limpa as mensagens e mantém os lançamentos");
      ok(!document.querySelector("#toast .toast-undo"), "limpar a conversa não oferece Desfazer"); }
    S.view = "hoje"; render();
  } catch (e) { falhas.push("exceção: " + (e && e.message || e)); }
  window.removeEventListener("error", onErr); window.removeEventListener("unhandledrejection", onErr);
  if (errs.length) falhas.push("erros na página: " + [...new Set(errs)].join(" | "));
  return { ok: !falhas.length, falhas, passos: passos.length, detalhe: passos };
};
