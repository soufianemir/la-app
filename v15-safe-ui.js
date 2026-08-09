(() => {
  let scheduled = false;

  const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
  const nrm = s => typeof norm === 'function' ? norm(s) : clean(s).toLowerCase();

  function stateClass(label){
    const s=nrm(label);
    if(s.includes('tranquille')) return 'quiet';
    if(s.includes('ca va')) return 'ok';
    if(s.includes('beaucoup')) return 'busy';
    if(s.includes('sature')) return 'full';
    return 'unknown';
  }

  function humanSource(raw){
    const s=nrm(raw);
    if(s.includes('observation')) return '📹 Webcam officielle';
    if(s.includes('prevision')) return '🕒 Prévision';
    return '📊 Estimation';
  }

  function polishCrowdCard(card){
    if(!card || card.dataset.v15Done==='1') return;
    const top=card.querySelector('.v12-crowd-top');
    if(!top) return;
    const rawSource=clean(top.querySelector('span')?.textContent);
    const rawLabel=clean(top.querySelector('b')?.textContent)||'Données insuffisantes';
    const label=rawLabel.replace(/^[🟢🟡🟠🔴⚪]\s*/u,'');
    const state=stateClass(rawLabel);
    const meta=[...card.querySelectorAll('.v12-meta span')].map(x=>clean(x.textContent));
    const trend=(meta.find(x=>nrm(x).startsWith('tendance'))||'').replace(/^Tendance\s*:\s*/i,'') || 'Historique en cours';
    const updated=(meta.find(x=>nrm(x).startsWith('mise a jour'))||'').replace(/^Mise à jour\s*:\s*/i,'');
    const confidence=(meta.find(x=>nrm(x).startsWith('confiance'))||'').replace(/^Confiance\s*:\s*/i,'')||'Faible';
    const forecast=clean(card.querySelector('.v12-forecast b')?.textContent).replace(/^[🟢🟡🟠🔴⚪]\s*/u,'');
    const details=card.querySelector('.v12-signals')?.innerHTML||'';
    const excluded=card.querySelector('.v12-excluded')?.innerHTML||'';
    const image=card.querySelector('.v12-observation-img')?.outerHTML||'';

    card.dataset.v15Done='1';
    card.className=`v13-crowd ${state}`;
    card.innerHTML=`<div class="v13-crowd-main"><div class="v13-status-dot"></div><div class="v13-crowd-copy"><span class="v13-kicker">AFFLUENCE MAINTENANT</span><strong>${state==='unknown'?'On ne sait pas encore':label}</strong><div class="v13-source"><span>${humanSource(rawSource)}</span>${updated?`<span>· ${updated}</span>`:''}</div></div></div><div class="v13-quickline"><span>${clean(trend)}</span><span>Confiance ${clean(confidence).toLowerCase()}</span></div>${forecast?`<div class="v13-forecast"><span>Dans environ 2 h</span><b>${forecast}</b></div>`:''}<details class="v13-why"><summary>Pourquoi ce résultat ?</summary><p class="v13-explain">Ce niveau est une catégorie d’affluence, jamais un nombre de personnes.</p>${details?`<div class="v13-reasons">${details}</div>`:''}${image?`<div class="v13-used-image"><span>Image utilisée</span>${image}</div>`:''}${excluded?`<div class="v13-missing">${excluded}</div>`:''}</details>`;
  }

  function polishChip(chip){
    if(!chip || chip.dataset.v15Done==='1') return;
    const t=clean(chip.textContent);
    if(!['Affluence','Tranquille','Ça va','Beaucoup de monde','Saturée','Données insuffisantes'].some(x=>t.includes(x))) return;
    chip.dataset.v15Done='1';
    const parts=t.split('·');
    const simple=(parts[0]||t).replace(/^👥\s*/,'').trim();
    if(chip.textContent!==simple) chip.textContent=simple;
    chip.classList.add('v13-crowd-chip');
    if(parts[1]) chip.title=`Source : ${parts.slice(1).join('·').trim()}`;
  }

  function polish(){
    document.querySelectorAll('.v12-crowd-card:not([data-v15-done="1"])').forEach(polishCrowdCard);
    document.querySelectorAll('.spot-card .chips .chip:not([data-v15-done="1"])').forEach(polishChip);
  }

  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;polish();});
  }

  const observer=new MutationObserver(schedule);
  if(document.body) observer.observe(document.body,{childList:true,subtree:true});
  polish();
})();
