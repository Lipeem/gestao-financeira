import sys, json, os
# Uso: python build_harness.py <pagina.html> <seed.json> <saida.html>
# Monta uma cópia local da página com o banco e o Claude simulados (window.claude.use).
page, seed, out = sys.argv[1], sys.argv[2], sys.argv[3]
html = open(page, encoding="utf-8").read()
seed_json = open(seed, encoding="utf-8").read()
mock = r"""
<script>
(function(){
  const store = %SEED%; window.__store = store;
  const L = {};
  const clone = o => JSON.parse(JSON.stringify(o));
  function merge(t, s){ for (const k in s){ const v = s[k]; if (v && typeof v === 'object' && !Array.isArray(v) && t[k] && typeof t[k] === 'object' && !Array.isArray(t[k])) merge(t[k], v); else t[k] = clone(v); } }
  function snap(c){ const docs = Object.entries(store[c]||{}).map(([id,d])=>{ const fr = Object.freeze(clone(d)); return {id, exists:true, data:()=>fr, metadata:{fromCache:false,hasPendingWrites:false}}; }); return {docs, size:docs.length, empty:!docs.length, docChanges:()=>[], metadata:{fromCache:false,hasPendingWrites:false}}; }
  function emit(c){ (L[c]||[]).forEach(fn => setTimeout(()=>fn(snap(c)), 10)); }
  function coll(c){ return { path:c, orderBy(){return this}, limit(){return this}, where(){return this},
    onSnapshot(fn, err){ (L[c]=L[c]||[]).push(fn); setTimeout(()=>fn(snap(c)), 60); return ()=>{}; },
    get: async () => snap(c),
    doc(id){ return { id, path:c+'/'+id,
      set: async d => { (store[c]=store[c]||{})[id] = clone(d); emit(c); },
      update: async d => { if (!store[c] || !store[c][id]) throw {code:'invalid_argument', message:'missing'}; merge(store[c][id], d); emit(c); },
      delete: async () => { if (store[c]) delete store[c][id]; emit(c); },
      get: async () => ({id, exists: !!(store[c]&&store[c][id]), data:()=>store[c]&&store[c][id]}) }; } }; }
  window.claude = { use: async n => n === 'db' ? { collection: coll, doc: p => { const s = p.split('/'); return coll(s[0]).doc(s[1]); } } : n === 'user' ? { id: async () => 'u_test', can: async () => true, isOwner: async () => true } : n === 'downloads' ? { save: async (r) => { window.__saved = { filename: r.filename, size: r.data.byteLength || r.data.length }; return { status: 'saved' }; } } : null };
})();
</script>
""".replace("%SEED%", seed_json)
mock += open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "mock_sample.js"), encoding="utf-8").read()
doc = "<!doctype html><html><head><meta charset=utf8><meta name=viewport content=\"width=device-width,initial-scale=1,viewport-fit=cover\"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style>" + mock + "</head><body>" + html + "</body></html>"
open(out, "w", encoding="utf-8").write(doc)
print("ok", len(doc))
