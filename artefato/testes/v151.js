// Testes da versão 15.1: fixas na Google Agenda, receitas incertas (só as certas), a receber, compromissos e backup.
// Uso no harness (seed_teste.json, recém-carregado): carregar este arquivo e rodar `await __v151()`.
window.__v151 = async function () {
  const w = ms => new Promise(r => setTimeout(r, ms));
  const falhas = [], passos = []; const ok = (c, msg) => { (c ? passos : falhas).push(msg); };
  const errs = []; const onErr = e => errs.push(String(e.message || e.reason || e)); window.addEventListener("error", onErr); window.addEventListener("unhandledrejection", onErr);
  const clk = sel => { const e = typeof sel === "string" ? document.querySelector(sel) : sel; if (!e) throw new Error("não achei " + sel); e.click(); return e; };
  const toastTxt = () => document.getElementById("toast").textContent;
  const desfaz = async () => { const b = document.querySelector("#toast .toast-undo"); if (!b) return false; b.click(); await w(800); return true; };
  const setIn = (id, v) => { const e = document.getElementById(id); if (!e) throw new Error("sem campo " + id); if (e.type === "checkbox") e.checked = !!v; else e.value = v; e.dispatchEvent(new Event("input", { bubbles: true })); e.dispatchEvent(new Event("change", { bubbles: true })); };
  const view = async v => { S.view = v; S.sel = null; S.editing = null; render(); await w(80); };
  try {
    const vv = VERSAO.split(".").map(Number); ok(vv[0] > 15 || (vv[0] === 15 && vv[1] >= 1), "versão 15.1.0 ou mais nova");
    // ---------- 1. Google Agenda ----------
    await view("plano"); const r0 = Object.values(S.recs).find(r => r.ativa !== false && r.tipo === "saida" && !r.fim);
    const url = new URL(gcalLink(r0)); const pr = url.searchParams;
    ok(url.hostname === "calendar.google.com" && pr.get("action") === "TEMPLATE" && /^\d{8}\/\d{8}$/.test(pr.get("dates")) && pr.get("recur") === "RRULE:FREQ=MONTHLY;BYMONTHDAY=" + (+r0.dia >= 31 ? -1 : +r0.dia) && pr.get("text").includes(r0.descricao), "link da Google Agenda com data, repetição mensal e nome");
    ok(pr.get("dates").slice(0, 8) >= S.today.replace(/-/g, ""), "o primeiro evento é hoje ou depois");
    const rFim = Object.assign({}, r0, { fim: addMonths(mkOf(S.today), 5) }); ok(/;UNTIL=\d{8}$/.test(new URL(gcalLink(rFim)).searchParams.get("recur")), "fixa com fim leva UNTIL");
    const a = document.querySelector(`a[data-ag="${r0.id}"]`); ok(a && a.target === "_blank" && a.href.startsWith("https://calendar.google.com/"), "botão Agendar é um link que abre a agenda em outra aba");
    await runAct("agendaMarca", { dataset: { ag: r0.id } }); await w(500);
    ok(S.recs[r0.id].agenda && S.recs[r0.id].agenda.valor === +r0.valor && /agendada em/.test(document.querySelector(`a[data-ag="${r0.id}"]`).closest("td").textContent), "tocar em Agendar marca a fixa como agendada");
    ok(await desfaz() && !S.recs[r0.id].agenda, "Desfazer tira a marca"); await runAct("agendaMarca", { dataset: { ag: r0.id } }); await w(500);
    await write("recorrentes", r0.id, { valor: +r0.valor + 10 }, "update"); await w(400); render(); await w(50);
    ok(/mudou: agende de novo/.test(document.querySelector(`a[data-ag="${r0.id}"]`).closest("td").textContent), "valor mudou: pede para agendar de novo");
    clk(`[data-act=agendaTirar][data-id="${r0.id}"]`); await w(500); ok(!S.recs[r0.id].agenda, "Tirar a marca"); await write("recorrentes", r0.id, { valor: +r0.valor }, "update"); await w(300);

    // ---------- 2. a receber e receitas incertas ----------
    await write("config", "main", { ancora: { data: S.today, conta: 1000, faturaAberta: 0, definida: true, atualizadoEm: nowISO() } }, "update"); await w(400);
    await view("plano"); ok(!document.querySelector("[data-act=cenario]"), "sem receitas incertas não aparece o seletor");
    const dRec = addDays(S.today, 10); setIn("ar-desc", "Honorários processo X"); setIn("ar-valor", "5.000"); setIn("ar-data", dRec); clk("[data-act=aReceberSalvar]"); await w(600);
    const lr = Object.values(S.lancs).find(l => l.descricao === "Honorários processo X"); ok(lr && lr.status === "planejado" && lr.tipo === "entrada" && lr.incerta === true && lr.valor === 5000 && lr.data === dRec, "A receber grava uma receita planejada incerta");
    ok(/Honorários processo X/.test(document.getElementById("areceber").textContent) && !/Honorários processo X/.test([...document.querySelectorAll("#view section")].find(x => /Compras e contas planejadas/.test(x.textContent)).textContent), "a receita aparece em A receber, não em Compras planejadas");
    dirty(); const fimTodas = model().days.get(addDays(S.today, 20)).fim; ok(!!document.querySelector("[data-act=cenario]"), "com receita incerta aparece o seletor Todas/Só as certas");
    clk('[data-act=cenario][data-v="certas"]'); await w(100); const fimCertas = model().days.get(addDays(S.today, 20)).fim;
    ok(S.semIncertas && Math.abs(fimTodas - fimCertas - 5000) < 0.02, "Só as certas tira a receita incerta da projeção");
    let ls = null; try { ls = localStorage.getItem("gf-cenario"); } catch (e) {} ok(ls === "certas", "a escolha fica guardada no aparelho");
    await view("hoje"); ok(/só com as receitas certas/.test(document.querySelector(".hoje-hero").textContent), "Hoje avisa que a projeção está só com as certas");
    clk('[data-act=cenario][data-v="todas"]'); await w(100); ok(!S.semIncertas && Math.abs(model().days.get(addDays(S.today, 20)).fim - fimTodas) < 0.02, "Todas as receitas volta");
    ok(Math.abs(modeloCons().days.get(addDays(S.today, 20)).fim - fimCertas) < 0.02 && Math.abs(modeloReal().days.get(addDays(S.today, 20)).fim - fimTodas) < 0.02, "modelo conservador e real independentes do seletor");
    // aviso: sem a incerta fica negativo antes
    const gasto = lancFromParsed({ data: addDays(S.today, 12), valor: 4500 + Math.max(0, model().days.get(addDays(S.today, 12)).fim - 5000), tipo: "saida", descricao: "Grande", comentario: "", subcategoria: "Diversos", forma: "Débito", contaId: null }, { status: "planejado" }); await write("lancamentos", gasto.id, gasto); await w(400); dirty(); S.avisosMem = {};
    const rc = avisosLista().find(x => String(x.k).startsWith("redc:")); ok(rc && /receitas incertas/.test(rc.t), "aviso: se a incerta não vier, o saldo fica negativo antes");
    await write("lancamentos", gasto.id, null, "delete"); await w(300);
    await view("plano"); clk(`[data-act=aRecebi][data-id="${lr.id}"]`); await w(600); ok(S.lancs[lr.id].status === "lancado" && S.lancs[lr.id].data === S.today && !S.lancs[lr.id].incerta, "Recebi vira lançamento de hoje");
    ok(await desfaz() && S.lancs[lr.id].status === "planejado", "Desfazer volta para a receber");
    clk(`[data-act=aNaoVem][data-id="${lr.id}"]`); await w(600); ok(!S.lancs[lr.id], "Não vem tira da previsão");
    // fixa incerta pelo formulário
    const re = Object.values(S.recs).find(r => r.tipo === "entrada"); clk(`[data-act=recEdit][data-id="${re.id}"]`); await w(80); setIn("r-incerta", true); clk(`[data-act=recSave][data-id="${re.id}"]`); await w(600);
    ok(S.recs[re.id].incerta === true && /incerta/.test(document.getElementById("fixas").textContent), "receita fixa marcada como incerta");
    clk('[data-act=cenario][data-v="certas"]'); await w(100); ok(!model().items.some(i => i.src === "rec" && i.id === re.id), "Só as certas tira a fixa incerta"); clk('[data-act=cenario][data-v="todas"]'); await w(80);
    await write("recorrentes", re.id, { incerta: false }, "update"); await w(300);
    // Conversa: receita incerta
    const di = docDeItem({ data: addDays(S.today, 5), valor: 800, tipo: "entrada", descricao: "Freela", subcategoria: "Outras Receitas", status: "planejado", incerta: true }); ok(di && di.status === "planejado" && di.incerta === true, "Conversa grava receita incerta");

    // ---------- 3. compromissos ----------
    await view("plano"); ok(!!document.getElementById("compromissos") && document.querySelectorAll("#compromissos tbody tr").length >= 10, "tabela de compromissos dos próximos meses");
    const mk1 = addMonths(mkOf(S.today), 1); const c0 = compromissoMes(modeloReal(), mk1); ok(c0.renda > 0 && c0.fixas > 0 && Math.abs(c0.total - (c0.fixas + c0.parcelas + c0.metas + c0.planejadas)) < 0.02, "compromisso soma fixas, parcelas, metas e planejadas");
    const tv = lancFromParsed({ data: S.today, valor: 1200, tipo: "saida", descricao: "TV", comentario: "", subcategoria: "Diversos", forma: "Crédito", contaId: "nubank-cartao" }); for (const x of expandeParcelas(tv, 6)) await write("lancamentos", x.id, x); await w(500);
    const c1 = compromissoMes(modeloReal(), mk1); ok(Math.abs(c1.parcelas - c0.parcelas - 200) < 0.02, "parcela do mês seguinte entra em Parcelas");
    ok(parcelamentos().some(x => x.desc === "TV" && x.restam === 5 && Math.abs(x.falta - 1000) < 0.02), "parcelamento em andamento: faltam 5 e R$ 1.000");
    setIn("cp-max", "1"); clk("[data-act=compSalvar]"); await w(500); ok(compLimite() === 1 && document.querySelector("#compromissos tr.comp-alto"), "limite salvo e mês acima fica vermelho");
    dirty(); S.avisosMem = {}; ok(avisosLista().some(x => String(x.k).startsWith("comp:")), "aviso de mês acima do limite");
    await view("hoje"); clk("#tb-add"); await w(80); for (const k of "3000") clk(`[data-act=qaKey][data-k="${k}"]`); clk('[data-act=qaSub][data-v="Mercado"]'); clk('[data-act=qaConta][data-v="nubank-cartao"]'); await w(40); clk('[data-act=qaParc][data-v="6"]'); await w(60);
    ok(/Atenção: com esta compra/.test(document.getElementById("qa-fx").textContent), "o ＋ avisa antes de a compra parcelada passar do limite"); clk('[data-act=qaClose]'); await w(50);
    await write("config", "main", { compromissoMax: 70 }, "update"); for (const l of Object.values(S.lancs).filter(l => l.descricao === "TV")) await write("lancamentos", l.id, null, "delete"); await w(400);

    // ---------- 4. backup ----------
    await write("config", "main", { ambiente: "producao" }, "update"); await w(300); await view("plano");
    ok(/Backup automático semanal/.test(document.getElementById("ambiente").textContent) && /Desligado/.test(document.getElementById("backup").textContent), "Ambiente e versão mostra o backup automático desligado");
    clk('[data-act=backupAtivo][data-v="1"]'); await w(500); ok(S.cfg.backup && S.cfg.backup.ativo === true && S.cfg.backup.ligadoEm, "Ligar o backup grava a chave no banco");
    dirty(); S.avisosMem = {}; ok(!avisosLista().some(x => String(x.k).startsWith("bk:")), "logo depois de ligar não há aviso");
    await write("config", "main", { backup: { ligadoEm: addDays(S.today, -20) + "T08:00:00-03:00", ultimo: { em: addDays(S.today, -15) + "T08:05:00-03:00", docs: 321, pasta: "artefato/backup/auto-x" } } }, "update"); await w(400); dirty(); S.avisosMem = {};
    ok(avisosLista().some(x => String(x.k).startsWith("bk:")), "backup parado há mais de 10 dias gera aviso"); render(); await w(50); ok(/321 registros/.test(document.getElementById("backup").textContent), "mostra o último backup");
    clk('[data-act=backupAtivo][data-v="0"]'); await w(500); ok(S.cfg.backup.ativo === false, "Desligar");
    await write("config", "main", { ambiente: "teste" }, "update"); await w(300); render(); await w(50); ok(/é do painel de produção/.test(document.getElementById("ambiente").textContent), "no teste, explica que o backup é da produção");

    // ---------- 5. Guia e telas ----------
    await view("guia"); ok(!!document.getElementById("g-planejar") && /Só as certas/.test(document.getElementById("g-planejar").textContent) && /Backup automático/.test(document.getElementById("g-versoes").textContent), "Guia explica agenda, incertas, compromissos e backup");
    ok(!/\b(Clara|Davi|Rita|Bruno|Ana|Paulo)\b/.test(document.getElementById("view").textContent), "Guia sem nomes");
    for (const v of VIEWS) { await view(v); ok(!/Não consegui desenhar/.test(document.getElementById("view").textContent), "tela " + v + " desenha"); }
  } catch (e) { falhas.push("EXCEÇÃO: " + (e && e.stack || e)); }
  window.removeEventListener("error", onErr); window.removeEventListener("unhandledrejection", onErr);
  if (errs.length) falhas.push("erros na página: " + errs.slice(0, 5).join(" | "));
  return { ok: passos.length, falhas, passos };
};
