import os, json
from googletrans import Translator
trans=Translator()
phrases={
"scanTap":"Toca para escanear",
"scanHold":"Mantén pulsado para lote"
}
# keep small for demo
for fname in os.listdir('l10n'):
  if not fname.startswith('app_'): continue
  path=os.path.join('l10n',fname)
  code=fname[4:-4]
  with open(path) as f: data=json.load(f)
  changed=False
  for k,v in phrases.items():
    if k not in data:
      try:
        t=trans.translate(v,src='es',dest=code.replace('_','-')).text
      except Exception:
        t=v
      data[k]=t
      changed=True
  if changed:
    with open(path,'w',encoding='utf-8') as f: json.dump(data,f,ensure_ascii=False,indent=2)
