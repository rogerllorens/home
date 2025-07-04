import os,json
from googletrans import Translator

translator=Translator()

with open('l10n/app_es.arb',encoding='utf-8') as f:
    base=json.load(f)

for fname in os.listdir('l10n'):
    if not fname.startswith('app_') or not fname.endswith('.arb') or fname=='app_es.arb':
        continue
    code=fname[4:-4]
    dest=code.replace('_','-')
    out={}
    for k,v in base.items():
        try:
            trans=translator.translate(v,src='es',dest=dest).text
        except Exception:
            trans=v
        out[k]=trans
    with open(os.path.join('l10n',fname),'w',encoding='utf-8') as f:
        json.dump(out,f,ensure_ascii=False,indent=2)
print('done')
