window.__deckPatch=`// SpellPilot Deck Report extension
const __deckReadPanel=$('deckRead')?.closest('.panel');
if(__deckReadPanel&&!$('deckPlan')){
 const sec=document.createElement('section');
 sec.className='panel'; sec.style.marginTop='12px';
 sec.innerHTML='<div class="sectionTitle">Deck Report</div><div class="compact">Game plan, combos, synergies and pilot priorities.</div><div id="deckPlan" class="deckread" style="margin-top:8px">Configure a deck to generate its plan.</div>';
 __deckReadPanel.parentNode.insertBefore(sec,__deckReadPanel);
}
function synergyClassify(c){
 const o=(c.oracle_text||'').toLowerCase(),n=(c.name||'').toLowerCase(),k=classify(c);
 return {...k,
 sacrifice:/sacrifice (a|another|an|one|target)|sacrifice this/.test(o),
 deathPayoff:/whenever .* dies|whenever .* is put into a graveyard/.test(o),
 recursion:/return target .* from your graveyard|return .* card .* from your graveyard|cast .* from your graveyard/.test(o),
 tokenMana:/creatures you control.*add|creature tokens you control.*add|tap an untapped creature you control.*add/.test(o)||/(cryptolith rite|jaheira, friend of the forest)/.test(n),
 anthem:/creatures you control get \+|tokens you control get \+|other creatures you control get \+/.test(o),
 extraCombat:/additional combat|extra combat/.test(o),
 equipCheat:/attach target equipment|attach any number of auras and equipment|equip abilities.*cost|equip .* without paying/.test(o),
 damagePayoff:/whenever .* enters.*damage|whenever .* creature.*enters.*damage/.test(o)||/(impact tremors|witty roastmaster|purphoros)/.test(n)
 };
}
function generateDeckPlan(){
 const out=$('deckPlan'); if(!out)return;
 if(!S.raw.length){out.textContent='Configure a deck to generate its plan.';return}
 const all=[...S.raw,...S.commanders],items=all.map(n=>({n,c:cardData(n),k:synergyClassify(cardData(n))}));
 const by=k=>items.filter(x=>x.k[k]), names=new Set(all.map(norm)), has=n=>names.has(norm(n)), pick=(a,m=5)=>a.slice(0,m).map(x=>x.n);
 const plans=[];
 if(by('equipment').length>=7)plans.push('Equipment / Voltron — develop an attacker, then turn equipment into pressure, protection and value.');
 if(by('tokens').length>=5)plans.push('Token engine — make bodies and convert them into damage, mana, cards or combat pressure.');
 if(by('stax').length>=4)plans.push('Light stax / tempo — slow opponents enough to create a safe window for your proactive line.');
 if(by('recursion').length>=4)plans.push('Graveyard value — reuse key creatures/permanents after trades or removal.');
 if(by('tutor').length>=4)plans.push('Tutor-driven consistency — find the missing engine, answer or combo piece.');
 if(!plans.length)plans.push('Midrange value — develop mana, build board advantage and turn that advantage into a win.');
 const combos=[],add=(title,cards,how)=>{if(cards.every(has))combos.push({title,cards,how})};
 add('Godo + Helm of the Host',['Godo, Bandit Warlord','Helm of the Host'],'Equip Helm to Godo and attack. The new Godo creates another combat, repeating for an unbounded combat loop if unanswered.');
 add('Kiki-Jiki + Zealous Conscripts',['Kiki-Jiki, Mirror Breaker','Zealous Conscripts'],'Copy Conscripts, untap Kiki-Jiki and repeat for arbitrarily many hasty attackers.');
 add('Kiki-Jiki + Village Bell-Ringer',['Kiki-Jiki, Mirror Breaker','Village Bell-Ringer'],'Copy Bell-Ringer; each copy untaps Kiki-Jiki, allowing arbitrarily many hasty creatures.');
 add('Helm + Kiki-Jiki + Witty Roastmaster',['Kiki-Jiki, Mirror Breaker','Helm of the Host','Witty Roastmaster'],'Helm makes a nonlegendary Kiki-Jiki copy; Kiki copies can copy another nonlegendary Kiki copy repeatedly, while Witty turns the entries into lethal damage.');
 if(has('Sunforger'))combos.push({title:'Sunforger toolbox',cards:['Sunforger'],how:'Keep mana available, unattach Sunforger and find an eligible instant for interaction, protection or a combat trick.'});
 const sy=[],addSy=(title,a,b,why)=>{if(a.length&&b.length)sy.push({title,a:pick(a,4),b:pick(b,4),why})};
 addSy('Tokens → cards',by('tokens'),items.filter(x=>/skullclamp/i.test(x.n)||(x.k.draw&&x.k.sacrifice)),'Small tokens can become card advantage instead of only attackers.');
 addSy('Tokens → mana',by('tokens'),by('tokenMana'),'A wide board becomes acceleration for larger follow-up turns.');
 addSy('Tokens → direct damage',by('tokens'),by('damagePayoff'),'Lead with the damage payoff before a token burst when possible.');
 addSy('Equipment → free attachment',by('equipment'),by('equipCheat'),'Sequence free/cheap attach effects before paying expensive equip costs.');
 addSy('Creatures dying → value',items.filter(x=>x.k.tokens||x.k.creature),by('deathPayoff'),'Disposable creatures and tokens can fuel death-trigger value.');
 addSy('Graveyard → another use',items.filter(x=>x.k.creature),by('recursion'),'Trading or sacrificing creatures is stronger when important pieces can return.');
 addSy('Go-wide → anthem',by('tokens'),by('anthem'),'Team-wide pumps scale with every token and can turn a harmless board into lethal pressure.');
 const pri=[];
 if(by('ramp').length>=7)pri.push('Early turns: prioritise cheap ramp unless an immediate stronger line is available.');
 if(by('equipment').length>=7)pri.push('Avoid repeatedly paying equip costs when the deck has free-attach effects; set those up first.');
 if(by('tokens').length&&has('Skullclamp'))pri.push('Treat 1-toughness tokens as potential Skullclamp “draw 2” resources, not just attackers.');
 if(by('tokens').length&&by('damagePayoff').length)pri.push('With a token burst plus an ETB-damage payoff, land the payoff first when practical.');
 if(by('protect').length)pri.push('Once an engine/combo matters, keep protection mana available instead of spending everything in main phase.');
 if(by('tutor').length)pri.push('Tutors should usually find the missing piece of an existing line, not simply the most expensive card.');
 const setup=items.filter(x=>x.k.ramp||x.k.tokens||x.k.equipCheat||x.k.tokenMana).sort((a,b)=>(a.c.cmc||0)-(b.c.cmc||0));
 const payoff=items.filter(x=>x.k.draw||x.k.damagePayoff||x.k.anthem||x.k.extraCombat||x.k.deathPayoff).sort((a,b)=>(a.c.cmc||0)-(b.c.cmc||0));
 out.innerHTML='<div><b>What this deck is trying to do</b></div>'+plans.map(x=>'<div style="margin:5px 0">• '+esc(x)+'</div>').join('')+
 '<div style="margin-top:10px"><b>Known combos / lines</b></div>'+ (combos.length?combos.map(x=>'<div style="margin:6px 0"><b>'+esc(x.title)+'</b><br><span class="compact">'+esc(x.cards.join(' + '))+' — '+esc(x.how)+'</span></div>').join(''):'<div class="compact">No exact combo in the current built-in combo library was found.</div>')+
 (sy.length?'<div style="margin-top:10px"><b>Synergy packages</b></div>'+sy.slice(0,6).map(x=>'<div style="margin:6px 0"><b>'+esc(x.title)+'</b><br><span class="compact">'+esc(x.a.join(', '))+' ↔ '+esc(x.b.join(', '))+'<br>'+esc(x.why)+'</span></div>').join(''):'')+
 (pri.length?'<div style="margin-top:10px"><b>Pilot priorities</b></div>'+pri.map(x=>'<div style="margin:4px 0">• '+esc(x)+'</div>').join(''):'')+
 '<div style="margin-top:10px"><b>Setup → payoff</b></div><div class="compact"><b>Setup:</b> '+esc(pick(setup,6).join(', ')||'—')+'<br><b>Payoffs:</b> '+esc(pick(payoff,6).join(', ')||'—')+'</div>';
}
const __oldLoadText=loadText; loadText=async function(...a){const r=await __oldLoadText(...a);generateDeckPlan();return r};
const __oldApplySetup=applySetup; applySetup=async function(...a){const r=await __oldApplySetup(...a);generateDeckPlan();return r};
const __oldLoadSaved=loadSaved; loadSaved=function(...a){const r=__oldLoadSaved(...a);generateDeckPlan();return r};
generateDeckPlan();
`;
