<script>
(function () {
  window.__sampleCalls = [];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function lastUser(input) { if (typeof input === "string") return input; for (let i = input.length - 1; i >= 0; i--) if (input[i].role === "user") return input[i].content; return ""; }
  async function json(input, opts) {
    window.__sampleCalls.push({ kind: "json", input, opts: Object.assign({}, opts, { images: opts && opts.images ? opts.images.length : 0 }) });
    await sleep(300);
    if (opts && opts.signal && opts.signal.aborted) throw { code: "cancelled" };
    const u = lastUser(input);
    if (window.__sampleMode === "deny") throw { code: "not_granted", message: "denied" };
    if (/ANEXOS \(texto extraído/.test(u)) {
      const linhas = [];
      const re = /(\d{2})\/(\d{2})\/(\d{4})\s+(.+?)\s+(-?[\d.]+,\d{2})\s*$/gm; let m;
      while ((m = re.exec(u))) { const v = parseFloat(m[5].replace(/\./g, "").replace(",", ".")); const desc = m[4].trim(); const fat = /FATURA/i.test(desc); linhas.push({ data: `${m[3]}-${m[2]}-${m[1]}`, valor: Math.abs(v), tipo: v < 0 ? "saida" : "entrada", descricao: desc, classe: fat ? "fatura" : null, sugestao: /CONDOMINIO/.test(desc) ? { descricao: "Condomínio Apto", subcategoria: "Condomínio Apto", recId: "REC-006", mes: `${m[3]}-${m[2]}` } : /PADARIA/.test(desc) ? { descricao: "Padaria", subcategoria: "Restaurantes", comentario: "" } : null }); }
      const sf = u.match(/SALDO FINAL\s+([\d.]+,\d{2})/);
      return { resposta: `Li ${linhas.length} linhas do extrato da Caixa.`, lancar: [], corrigir: [], apagar: [], saldo: null, extrato: { conta: "Conta Corrente", de: "2026-11-01", ate: "2026-11-03", saldoFinal: sf ? sf[1] : null, fonte: "extrato Caixa PDF", linhas } };
    }
    if (opts && opts.images) return { resposta: "Li o cupom: farmácia, R$ 54,90 no crédito.", lancar: [{ data: "2026-11-03", valor: 54.9, tipo: "saida", descricao: "Farmácia", comentario: "cupom da foto", subcategoria: "Farmácia", forma: "Crédito", recId: null, mes: null, status: "lancado" }] };
    if (/^era (\d+)/i.test(u.trim())) { const v = +u.trim().match(/^era (\d+)/i)[1]; const ids = [...input.map(t => t.content).join("\n").matchAll(/lançados: (L[A-Z0-9]+)/g)]; const id = ids.length ? ids[ids.length - 1][1] : null; return { resposta: `Corrigi para R$ ${v}.`, corrigir: id ? [{ id, campos: { valor: v } }] : [] }; }
    // com ferramentas (v15.2): pergunta de histórico chama "totais" da página e responde com o resultado
    if (opts && Array.isArray(opts.tools) && /quanto/i.test(u) && /20\d\d|ano|m[eê]s/i.test(u)) { const t = opts.tools.find(x => x.name === "totais"); const r = await t.execute({ agrupar: "subcategoria", tipo: "saida", de: "2026-01-01" }, { signal: new AbortController().signal }); window.__toolCalls = (window.__toolCalls || []).concat([{ name: "totais", grupos: r.grupos.length }]); return { resposta: `Pelo histórico: ${r.lancamentos} lançamentos, saídas de R$ ${r.totalSaidas} (simulado).` }; }
    if (/\?/.test(u)) return { resposta: "Em novembro vocês gastaram R$ 0,00 de iFood até agora (simulado)." };
    if (/tenho ([\d.]+)/.test(u)) return { resposta: "Anotei o saldo real.", saldo: { conta: 4820, faturaAberta: 1250, data: "2026-11-03" } };
    const items = u.split("\n").map(l => window.parseLine(l, "2026-11-03")).filter(p => p && p.valor != null).map(p => ({ data: p.data, valor: p.valor, tipo: p.tipo, descricao: p.descricao, comentario: p.comentario, subcategoria: p.subcategoria, forma: p.forma, recId: p.rec ? p.rec.id : null, mes: p.rec ? p.rec.mes : null, parcelas: p.parcelas || 1, meta: (u.match(/\bmeta (?:da |do )?([\wÀ-ú]+)/i) || [])[1] || null, status: "lancado" }));
    return { resposta: `Lancei ${items.length} item(ns).`, lancar: items, corrigir: [], apagar: [], saldo: null, extrato: null };
  }
  async function sample(input, opts) {
    window.__sampleCalls.push({ kind: "text", input });
    const full = "Bateu a maior parte. A luz veio acima do previsto e um Pix para a padaria não foi anotado.\nAção: lançar a padaria e revisar a luz.";
    let acc = ""; for (const part of full.match(/.{1,25}/gs)) { await sleep(40); acc += part; opts && opts.onText && opts.onText({ text: acc, delta: part }); }
    return { text: full, truncated: false, modelTierApplied: "default" };
  }
  sample.json = json;
  sample.limits = async () => ({ maxPromptBytes: 262144, images: { maxCount: 5, maxInputBytes: 20000000, mediaTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"] }, tools: { maxCount: 8 } });
  window.__assets = []; const assets = { upload: async (b, o) => { const a = { id: Math.random().toString(16).slice(2).padEnd(32, "0").slice(0, 32), url: "/_blob/x", sizeBytes: b.size, contentType: (o && o.type) || b.type, createdAt: new Date().toISOString() }; window.__assets.push(a); return a; }, list: async () => ({ assets: window.__assets.slice(), usage: { files: window.__assets.length, bytes: window.__assets.reduce((t, a) => t + a.sizeBytes, 0), maxFiles: 500, maxBytes: 524288000 } }), delete: async id => { const n = window.__assets.length; window.__assets = window.__assets.filter(a => a.id !== id); return { deleted: window.__assets.length < n }; } };
  // conector Google Sheets simulado: window.__sheet são as linhas da planilha; __mcpMode = "null" (sem conector) ou um código de erro
  window.__sheet = [["Carimbo de data/hora", "Notificação"]]; window.__mcpCalls = [];
  const mcp = { callTool: async (server, tool, input) => { window.__mcpCalls.push({ server, tool, input }); await sleep(120); if (window.__mcpMode && window.__mcpMode !== "null") throw { code: window.__mcpMode, message: "simulado" };
    const v = { range: "A1:F3000", majorDimension: "ROWS", values: window.__sheet.map(r => r.slice()) }; return { content: [{ type: "text", text: JSON.stringify(v) }], payload: v }; } };
  const prev = window.claude.use;
  window.claude.use = async n => n === "sample" ? sample : n === "assets" ? assets : n === "mcp" ? (window.__mcpMode === "null" ? null : mcp) : prev(n);
})();
</script>
