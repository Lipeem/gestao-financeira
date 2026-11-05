// Teste massivo: lançamentos aleatórios + invariantes do modelo + todas as telas e meses.
window.__fuzz = async function (N, seed) {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  let x = seed || 7; const rnd = () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const errs = []; const onErr = e => errs.push(String(e.message || e.reason || e)); window.addEventListener("error", onErr); window.addEventListener("unhandledrejection", onErr);
  const contas = contasList(); const cs = contas.filter(c => c.tipo === "conta"), ks = contas.filter(c => c.tipo === "cartao");
  const subsS = S.cats.filter(c => c.tipo === "saida").map(c => c.subcategoria), subsE = S.cats.filter(c => c.tipo === "entrada").map(c => c.subcategoria);
  const recs = Object.values(S.recs);
  const ops = [];
  for (let i = 0; i < N; i++) {
    const id = "FZ" + String(i).padStart(4, "0"); const d = addDays("2026-09-01", Math.floor(rnd() * 240)); const v = Math.round(rnd() * 90000) / 100 + 1;
    const t = rnd(); let doc;
    if (t < 0.12) { const o = pick(cs), de = pick(contas.filter(c => c.id !== o.id)); doc = { tipo: "transferencia", contaId: o.id, conta: o.nome, contaDestinoId: de.id, contaDestino: de.nome, subcategoria: "Transferência", categoria: "Transferências", forma: "Transferência" }; }
    else if (t < 0.22) doc = { tipo: "entrada", subcategoria: pick(subsE), contaId: pick(cs).id, forma: "Pix" };
    else if (t < 0.55) { const k = pick(ks); doc = { tipo: "saida", subcategoria: pick(subsS), contaId: k.id, conta: k.nome, forma: "Crédito" }; }
    else if (t < 0.62 && recs.length) { const r = pick(recs); doc = { tipo: r.tipo, subcategoria: r.subcategoria, recId: r.id, mes: mkOf(d), contaId: r.contaId || null, forma: r.forma || "Débito" }; }
    else doc = { tipo: "saida", subcategoria: pick(subsS), contaId: pick(cs).id, forma: pick(["Débito", "Pix", "Boleto"]) };
    Object.assign(doc, { id, data: d, valor: v, descricao: "fuzz " + i + (rnd() < 0.05 ? ' <img src=x onerror="window.__xss=1">' : ""), comentario: rnd() < 0.5 ? "c" + i : "", status: pick(["lancado", "lancado", "conciliado", "planejado", "ignorado"]), fonte: "fuzz" });
    if (doc.status === "planejado") { delete doc.recId; delete doc.mes; }
    ops.push(["lancamentos", id, doc]);
  }
  // malformados
  ops.push(["lancamentos", "BAD1", { id: "BAD1", data: "2026-13-40", valor: "abc", tipo: "xyz" }]);
  ops.push(["lancamentos", "BAD2", { id: "BAD2", data: null, valor: null }]);
  ops.push(["lancamentos", "BAD3", { id: "BAD3", data: "2026-11-10", valor: -50, tipo: "transferencia", contaId: "naoexiste", contaDestinoId: "naoexiste2" }]);
  for (const [c, id, d] of ops) window.__store[c] = window.__store[c] || {}, window.__store[c][id] = d;
  await write("lancamentos", "FZ-TRIGGER", { id: "FZ-TRIGGER", data: "2026-11-02", valor: 1, tipo: "saida", descricao: "gatilho", subcategoria: "Diversos", status: "lancado" });
  await write("config", "main", { ancora: { data: "2026-10-15", conta: 4000, saldos: [{ id: cs[0].id, valor: 2500 }, { id: (cs[1] || cs[0]).id, valor: 1500 }], faturaAberta: 900, faturas: { [ks[0].id]: 400, [(ks[1] || ks[0]).id]: 500 }, definida: true } }, "update");
  await wait(1500);
  const t0 = performance.now(); const M = model(); const tModel = performance.now() - t0;
  const out = { N, tModel: Math.round(tModel), errs, inv: [] };
  // invariantes
  for (const k of M.keys) { const dd = M.days.get(k); if (!isFinite(dd.fim) || !isFinite(dd.ini)) { out.inv.push("NaN fim " + k); break; }
    if (dd.saldos) { let s = 0; for (const a in dd.saldos) { if (!isFinite(dd.saldos[a])) { out.inv.push("NaN saldo " + a + " " + k); break; } s += dd.saldos[a]; } if (M.hasCycle && Math.abs(s - dd.caixa) > 0.01) { out.inv.push(`soma contas ≠ caixa em ${k}: ${s} vs ${dd.caixa}`); break; } }
    if (dd.faturas) for (const a in dd.faturas) if (!isFinite(dd.faturas[a])) { out.inv.push("NaN fatura " + a + " " + k); break; } }
  // transferências não mudam o termômetro
  const fimCom = M.days.get("2027-04-30").fim; const salvo = {}; for (const l of Object.values(S.lancs)) if (l.tipo === "transferencia") { salvo[l.id] = l; }
  for (const id in salvo) delete S.lancs[id]; S._m = null; if (typeof invalidate === "function") invalidate();
  const M2 = buildModel(); const fimSem = M2.days.get("2027-04-30").fim; for (const id in salvo) S.lancs[id] = salvo[id];
  out.trfNeutro = Math.abs(fimCom - fimSem) < 0.01 ? "ok" : `falhou: ${fimCom} vs ${fimSem}`;
  // fixa ligada não conta duas vezes: cada recId|mes cumprido não pode ter item de previsão
  let dup = 0; for (const it of M.items) if (it.src === "rec" && M.ful.has(it.r.id + "|" + it.mes)) dup++; out.fixaDupla = dup;
  // todas as telas e meses
  const views = ["hoje", "ano", "conversa", "mes", "lancar", "conferir", "plano", "arquivos", "guia"]; const tv = {};
  for (const v of views) { const t1 = performance.now(); try { S.view = v; render(); } catch (e) { errs.push(v + ": " + e.message); } tv[v] = Math.round(performance.now() - t1); await wait(30); }
  out.tViews = tv;
  S.view = "mes"; for (let mk = "2026-01"; mk <= "2027-12"; mk = addMonths(mk, 1)) { try { S.month = mk; render(); } catch (e) { errs.push("mes " + mk + ": " + e.message); } }
  for (const mk of ["2025-06", "2028-03"]) { try { S.month = mk; render(); } catch (e) { errs.push("mes fora " + mk + ": " + e.message); } }
  S.month = mkOf(S.today);
  for (const d of ["2026-01-01", "2026-10-14", "2026-10-15", S.today, "2026-12-31", "2027-12-31"]) { try { S.view = "mes"; S.month = mkOf(d); S.sel = d; render(); } catch (e) { errs.push("dia " + d + ": " + e.message); } }
  S.sel = null; render();
  out.xss = !!window.__xss;
  window.removeEventListener("error", onErr); window.removeEventListener("unhandledrejection", onErr);
  return out;
};
// Clica em todos os botões de cada tela (exceto apagar de verdade é permitido: o banco é falso) e registra erros.
window.__monkey = async function () {
  const wait = ms => new Promise(r => setTimeout(r, ms)); const errs = []; const onErr = e => errs.push(String(e.message || e.reason || e));
  window.addEventListener("error", onErr); window.addEventListener("unhandledrejection", onErr);
  const ce = console.error; console.error = (...a) => { errs.push("console: " + a.map(String).join(" ").slice(0, 200)); ce.apply(console, a); };
  const views = ["hoje", "ano", "mes", "lancar", "conferir", "plano", "arquivos", "guia", "conversa"]; const clicked = {};
  for (const v of views) { S.view = v; S.sel = null; render(); await wait(80);
    const acts = [...new Set([...document.querySelectorAll("#view [data-act]")].map(b => b.dataset.act))]; clicked[v] = acts.length;
    for (const act of acts) { if (["tab", "chatSend", "chatFile", "fileDl", "exportXlsx", "xlsx", "downloadFile"].includes(act)) continue;
      const b = document.querySelector(`#view [data-act="${act}"]`); if (!b) continue;
      try { b.click(); } catch (e) { errs.push(v + "/" + act + ": " + e.message); }
      await wait(60); if (S.view !== v) { S.view = v; render(); await wait(40); } } }
  console.error = ce; window.removeEventListener("error", onErr); window.removeEventListener("unhandledrejection", onErr);
  return { clicked, errs: [...new Set(errs)].slice(0, 40) };
};
// Largura no celular em todas as telas
window.__overflow = async function () { const wait = ms => new Promise(r => setTimeout(r, ms)); const out = {};
  for (const v of ["hoje", "ano", "conversa", "mes", "lancar", "conferir", "plano", "arquivos", "guia"]) { S.view = v; S.sel = null; render(); await wait(120);
    const wide = [...document.querySelectorAll("#view *")].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 1 && !e.closest(".tw, .scroll-x, table, .tabs, pre, .legend") ; }).slice(0, 4).map(e => e.tagName + "." + String(e.className).slice(0, 30) + " " + Math.round(e.getBoundingClientRect().right));
    out[v] = { sw: document.documentElement.scrollWidth, wide }; }
  S.view = "mes"; S.sel = S.today; render(); await wait(150); out.dia = { sw: document.documentElement.scrollWidth };
  S.sel = null; render(); await wait(60);
  // folha do lançamento rápido aberta
  ACT.qaOpen({ dataset: {} }); await wait(150); const qa = document.querySelector("#qa .sheet"); if (qa) qa.style.animation = "none"; const qr = qa ? qa.getBoundingClientRect() : null;
  out.qa = { sw: document.documentElement.scrollWidth, cabe: !!qr && qr.bottom <= innerHeight + 1 && qr.right <= innerWidth + 1, wide: [...document.querySelectorAll("#qa *")].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 1 && !e.closest(".qa-row.scroll"); }).slice(0, 4).map(e => e.tagName + "." + String(e.className).slice(0, 30)) };
  ACT.qaClose(); return out; };
