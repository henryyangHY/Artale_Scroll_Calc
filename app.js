// ===== 共用工具 =====
const choose = id => document.getElementById(id);
const UNIT   = 10_000;                                   // 1 萬楓幣 = 10 000 mesos

// 組合數 C(n,k)
function comb(n,k){ if(k<0||k>n) return 0; if(k===0||k===n) return 1;
  let r=1; for(let i=1;i<=k;i++) r=r*(n-i+1)/i; return r; }
// Binomial PMF
const binom=(n,p,k)=>comb(n,k)*p**k*(1-p)**(n-k);
// Binomial CDF complement
const binomGE=(n,p,k)=>{let s=0;for(let i=k;i<=n;i++)s+=binom(n,p,i);return s;};

// ===== 綁滑桿 ↔ number (成本) =====
function bindCostSlider(sliderId,boxId){
  const s=choose(sliderId),b=choose(boxId);
  const sync=fromSlider=>{
    if(fromSlider) b.value=(s.value/UNIT).toLocaleString();
    else s.value=Number(b.value.replace(/,/g,""))*UNIT;
    render();
  };
  s.addEventListener("input",()=>sync(true));
  b.addEventListener("input",()=>sync(false));
}
bindCostSlider("baseCostSlider","baseCost");
bindCostSlider("scrollCostSlider","scrollCost");
["baseCostSlider","scrollCostSlider"].forEach(id=>{
  choose(id).max=999*UNIT; choose(id).step=0.1*UNIT;
});

// ===== 讀值工具 =====
const num  = id=>Number(choose(id).value.replace(/,/g,""))||0;
const costS=id=>Number(choose(id+"Slider").value)||0;
const costB=id=>num(id)*UNIT;

// ===== 監聽即時刷新 =====
["baseAtk","slots","buyAtk","buyCost"].forEach(id=>choose(id).addEventListener("input",render));
choose("rate").addEventListener("change",render);

// ===== DOM 目標 =====
const output  = choose("output");   // 詳細結果
const summary = choose("summary");  // 買 / 自己衝
const probBox = choose("probTable");// 過捲機率

// ===== 主 render =====
function render(){
  /* 收集輸入 */
  const baseAtk=num("baseAtk");
  const slots  =num("slots");
  const buyAtk =num("buyAtk");

  const rateEl =choose("rate");
  const rate   =Number(rateEl.value)||0;
  const gain   =Number(rateEl.selectedOptions[0].dataset.gain)||0;

  const baseCost  =costS("baseCost");
  const scrollCost=costS("scrollCost");
  const buyCost   =costB("buyCost");

  if(!(slots&&rate&&gain)){
    output.innerHTML="<p>請完整填寫參數</p>";
    summary.innerHTML=""; probBox.innerHTML=""; return;
  }

  /* 期望值 */
  const expSuccess=slots*rate;
  const expGain   =expSuccess*gain;
  const expFinal  =baseAtk+expGain;

  const totalScrollCost=slots*scrollCost;
  const totalCost =baseCost+totalScrollCost;
  const costPerAtk=expFinal?totalCost/expFinal:0;

  /* #output */
  output.innerHTML=`
    <p class="key-stat">期望最終攻擊：${expFinal.toFixed(3)}</p>
    <p class="key-stat">總期望成本：${(totalCost/UNIT).toFixed(3)} 萬楓幣</p>
    <p>期望成功次數：<b>${expSuccess.toFixed(3)}</b></p>
    <p>期望攻擊增加：<b>${expGain.toFixed(3)}</b></p>
    <p>每點攻成本：<b>${(costPerAtk/UNIT).toFixed(3)}</b> 萬楓幣</p>
  `;

  /* #probTable */
  probBox.innerHTML=renderProbTable(slots,rate,baseAtk,gain);

  /* #summary */
  if(buyCost&&buyAtk){
    const diff=totalCost-buyCost;
    const needK=Math.max(0,Math.ceil((buyAtk-baseAtk)/gain));
    const probGE=buyAtk<=baseAtk?1:binomGE(slots,rate,needK);
    summary.innerHTML= diff>0
      ? `<h3 class="result-bad">買成品，比自己衝省 ${(diff/UNIT).toFixed(3)} 萬楓幣</h3>`
      : `<h3 class="result-good">自己衝，相較買成品用 ${(probGE*100).toFixed(3)}% 成功機率 換 ${(Math.abs(diff)/UNIT).toFixed(3)} 萬楓幣</h3>`;
  }else{
    summary.innerHTML="<p>（如要比較，請輸入成品攻擊與價格）</p>";
  }
}

/* ===== 產生橫向機率表，含攻擊值 ===== */
function renderProbTable(n,p,baseAtk,gain){
  if(!n||!p) return "";
  const probs=Array.from({length:n+1},(_,k)=>binom(n,p,k));
  const max=Math.max(...probs), min=Math.min(...probs);
  const atkVals=Array.from({length:n+1},(_,k)=>baseAtk+k*gain);

  let html="<table class='prob-table'>";
  /* 攻擊列 */
  html+="<tr><th>攻擊</th>";
  atkVals.forEach(a=>html+=`<td class="atk-cell">${a}</td>`); html+="</tr>";
  /* 成功張數列 */
  html+="<tr><th>成功張數</th>";
  for(let k=0;k<=n;k++) html+=`<td>${k}</td>`; html+="</tr>";
  /* 機率列 */
  html+="<tr><th>機率</th>";
  probs.forEach(pr=>{
    const cls=pr===max?"prob-max":pr===min?"prob-min":"";
    html+=`<td class="${cls}">${(pr*100).toFixed(3)} %</td>`;
  });
  html+="</tr></table>";
  return html;
}

// ===== 初始 =====
render();
