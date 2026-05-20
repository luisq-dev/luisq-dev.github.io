/* ═══════════════════════════════════════════════════════════════
   CADENAS DE MARKOV — JAVASCRIPT COMPLETO
   Módulos: Hero Canvas, Path Demo, States Diagram, Matrix Builder,
            Transition Diagram, Stationary Calculator, Simulator,
            N-Steps Calculator, Applications Modal, Quiz, Glossary
═══════════════════════════════════════════════════════════════ */

'use strict';

// ─── UTILIDADES MATEMÁTICAS ───────────────────────────────────────────────────

const MathUtils = {
  // Multiplicación de matrices
  matMul(A, B) {
    const n = A.length, m = B[0].length, p = B.length;
    const C = Array.from({length:n}, () => Array(m).fill(0));
    for (let i=0;i<n;i++) for (let j=0;j<m;j++) for (let k=0;k<p;k++) C[i][j]+=A[i][k]*B[k][j];
    return C;
  },
  // Potencia de matriz
  matPow(P, n) {
    let result = P.map((row,i) => row.map((_,j) => i===j ? 1 : 0)); // identidad
    let base = P.map(r => [...r]);
    while (n > 0) {
      if (n % 2 === 1) result = this.matMul(result, base);
      base = this.matMul(base, base);
      n = Math.floor(n/2);
    }
    return result;
  },
  // Resolución por eliminación gaussiana
  solveLinear(A, b) {
    const n = A.length;
    const M = A.map((row,i) => [...row, b[i]]);
    for (let col=0;col<n;col++) {
      let maxRow = col;
      for (let row=col+1;row<n;row++) if (Math.abs(M[row][col])>Math.abs(M[maxRow][col])) maxRow=row;
      [M[col],M[maxRow]]=[M[maxRow],M[col]];
      if (Math.abs(M[col][col])<1e-12) continue;
      for (let row=0;row<n;row++) {
        if (row===col) continue;
        const f = M[row][col]/M[col][col];
        for (let j=col;j<=n;j++) M[row][j]-=f*M[col][j];
      }
    }
    return M.map((row,i) => M[i][i] ? row[n]/row[i] : 0);
  },
  // Calcular distribución estacionaria
  stationaryDist(P) {
    const n = P.length;
    // π = πP  →  π(P-I)=0  →  (P^T - I)^T π = 0
    // Reformulamos: para cada j, ∑_i π_i * p_ij = π_j
    // Equivalente: ∑_i π_i * (p_ij - δ_ij) = 0 para todo j
    const A = Array.from({length:n}, () => Array(n).fill(0));
    for (let j=0;j<n;j++) {
      for (let i=0;i<n;i++) A[j][i] = (j===i ? P[i][j]-1 : P[i][j]);
    }
    // Reemplazar última ecuación por normalización
    A[n-1] = Array(n).fill(1);
    const b = Array(n).fill(0); b[n-1]=1;
    const sol = this.solveLinear(A, b);
    // Normalizar por si hay errores numéricos
    const sum = sol.reduce((a,x)=>a+x,0);
    return sol.map(x=>Math.max(0,x/sum));
  },
  fmt(x, d=4) { return parseFloat(x.toFixed(d)); },
  fmtPct(x) { return (x*100).toFixed(1)+'%'; }
};

// ─── COLORES DE ESTADOS ────────────────────────────────────────────────────────

const STATE_COLORS = ['#5ce1e6','#7b61ff','#ff6b6b','#ffd166','#06d6a0','#f4c430'];
const STATE_COLORS_BG = ['rgba(92,225,230,.15)','rgba(123,97,255,.15)','rgba(255,107,107,.15)','rgba(255,209,102,.15)','rgba(6,214,160,.15)'];

// ─── MÓDULO: HERO CANVAS ──────────────────────────────────────────────────────

function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, nodes, animId;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createNodes() {
    const count = Math.min(50, Math.floor(W*H/25000));
    nodes = Array.from({length: count}, () => ({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-.5)*.5, vy: (Math.random()-.5)*.5,
      r: Math.random()*3+2,
      color: STATE_COLORS[Math.floor(Math.random()*STATE_COLORS.length)],
      label: String.fromCharCode(65+Math.floor(Math.random()*5))
    }));
  }

  function draw() {
    ctx.clearRect(0,0,W,H);
    // Draw connections
    for (let i=0;i<nodes.length;i++) {
      for (let j=i+1;j<nodes.length;j++) {
        const dx=nodes[j].x-nodes[i].x, dy=nodes[j].y-nodes[i].y;
        const dist=Math.sqrt(dx*dx+dy*dy);
        if (dist<160) {
          ctx.save();
          ctx.globalAlpha = (1-dist/160)*.2;
          ctx.strokeStyle = nodes[i].color;
          ctx.lineWidth = .8;
          ctx.beginPath(); ctx.moveTo(nodes[i].x,nodes[i].y); ctx.lineTo(nodes[j].x,nodes[j].y); ctx.stroke();
          ctx.restore();
        }
      }
    }
    // Draw nodes
    nodes.forEach(n => {
      ctx.save();
      ctx.globalAlpha = .7;
      ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2);
      ctx.fillStyle = n.color; ctx.fill();
      ctx.restore();
    });
    // Move
    nodes.forEach(n => {
      n.x+=n.vx; n.y+=n.vy;
      if (n.x<-10||n.x>W+10) n.vx*=-1;
      if (n.y<-10||n.y>H+10) n.vy*=-1;
    });
    animId = requestAnimationFrame(draw);
  }

  resize(); createNodes(); draw();
  window.addEventListener('resize', () => { cancelAnimationFrame(animId); resize(); createNodes(); draw(); });
}

// ─── MÓDULO: PATH DEMO ────────────────────────────────────────────────────────

function initPathDemo() {
  const stepsEl = document.getElementById('pathSteps');
  const predEl  = document.getElementById('pathPrediction');
  const resetBtn = document.getElementById('resetPath');
  if (!stepsEl) return;

  const STATES = ['A','B','C'];
  const TRANS = {
    A: {A:.6, B:.3, C:.1},
    B: {A:.2, B:.5, C:.3},
    C: {A:.4, B:.1, C:.5}
  };
  const COLORS = {A:'#5ce1e6', B:'#7b61ff', C:'#ff6b6b'};
  let path = [];

  function nextState(s) {
    const r = Math.random(), t = TRANS[s];
    let cum = 0;
    for (const [k,v] of Object.entries(t)) { cum+=v; if (r<=cum) return k; }
    return s;
  }

  function render() {
    stepsEl.innerHTML = '';
    path.forEach((s,i) => {
      const el = document.createElement('div');
      el.className = 'path-step' + (i===path.length-1?' current':'');
      el.textContent = s;
      el.style.background = STATE_COLORS_BG[STATES.indexOf(s)];
      el.style.border = `2px solid ${COLORS[s]}`;
      el.style.color = COLORS[s];
      stepsEl.appendChild(el);
    });

    if (path.length > 0) {
      const cur = path[path.length-1];
      const t = TRANS[cur];
      predEl.innerHTML = `<span style="color:var(--text3)">Desde </span><span style="color:${COLORS[cur]};font-weight:700">${cur}</span><span style="color:var(--text3)"> → probabilidades: </span>`
        + Object.entries(t).map(([k,v]) => `<span style="color:${COLORS[k]};font-weight:700">${k}: ${(v*100).toFixed(0)}%</span>`).join(' | ')
        + `<br><span style="color:var(--text3);font-size:.85em">Haz clic en el botón "Paso" para avanzar, o el diagrama avanza automáticamente</span>`;
    } else {
      predEl.textContent = 'Haz clic en "Paso" para iniciar la cadena.';
    }
  }

  function step() {
    if (path.length === 0) path.push(STATES[Math.floor(Math.random()*3)]);
    else path.push(nextState(path[path.length-1]));
    if (path.length > 20) path.shift();
    render();
  }

  // Auto step every 1.5s
  setInterval(step, 1500);
  resetBtn.addEventListener('click', () => { path=[]; render(); });
  render();
}

// ─── MÓDULO: DIAGRAMA DE ESTADOS ─────────────────────────────────────────────

function initStatesDiagram() {
  const svg = document.getElementById('statesDiagram');
  const legend = document.getElementById('diagramLegend');
  if (!svg) return;

  const W=500, H=400;
  // Definir nodos y arcos para demostrar todos los tipos
  const nodes = [
    {id:'S1', x:80,  y:200, label:'S₁', type:'absorbente', color:'#ff6b6b'},
    {id:'S2', x:220, y:80,  label:'S₂', type:'transitorio', color:'#ffd166'},
    {id:'S3', x:220, y:320, label:'S₃', type:'transitorio', color:'#ffd166'},
    {id:'S4', x:360, y:200, label:'S₄', type:'recurrente',  color:'#06d6a0'},
    {id:'S5', x:460, y:100, label:'S₅', type:'ergodico',    color:'#7b61ff'},
    {id:'S6', x:460, y:300, label:'S₆', type:'ergodico',    color:'#7b61ff'},
  ];
  const edges = [
    {from:'S2',to:'S1', label:'0.3'},{from:'S3',to:'S1',label:'0.2'},
    {from:'S2',to:'S4', label:'0.4'},{from:'S3',to:'S4',label:'0.5'},
    {from:'S2',to:'S3', label:'0.3'},{from:'S3',to:'S2',label:'0.3'},
    {from:'S4',to:'S5', label:'0.5'},{from:'S4',to:'S6',label:'0.5'},
    {from:'S5',to:'S6', label:'0.6'},{from:'S6',to:'S5',label:'0.4'},
    {from:'S5',to:'S5', label:'0.4'},{from:'S6',to:'S6',label:'0.6'},
    {from:'S1',to:'S1', label:'1.0'},
  ];

  const DEFS = `<defs>
    <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#5d6680"/>
    </marker>
    <marker id="arr-hi" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#5ce1e6"/>
    </marker>
  </defs>`;

  const stateDescriptions = {
    absorbente: 'S₁ es <strong>absorbente</strong>: p₁₁ = 1.0, nunca sale.',
    transitorio:'S₂ y S₃ son <strong>transitorios</strong>: pueden migrar a S₁ o S₄ sin regresar.',
    recurrente: 'S₄ es <strong>recurrente</strong>: eventualmente regresa, pero aquí solo transita a S₅/S₆.',
    ergodico:   'S₅ y S₆ son <strong>ergódicos</strong>: recurrentes positivos, aperiódicos — tienen distribución estacionaria única.',
    periodo:    'El <strong>período</strong> de S₅ es 1 (aperiódico), ya que puede regresar en 1 paso (p₅₅=0.4 > 0).',
  };

  function renderDiagram(highlight) {
    let edgeSVG = '';
    edges.forEach(e => {
      const from = nodes.find(n=>n.id===e.from);
      const to   = nodes.find(n=>n.id===e.to);
      const isHi = highlight && (from.type===highlight || to.type===highlight);
      const col  = isHi ? '#5ce1e6' : '#2a2f45';
      const marker = isHi ? 'arr-hi' : 'arr';

      if (e.from === e.to) {
        // Self-loop
        const cx=from.x, cy=from.y;
        edgeSVG += `<path d="M${cx-10},${cy-26} C${cx-30},${cy-60} ${cx+30},${cy-60} ${cx+10},${cy-26}"
          fill="none" stroke="${col}" stroke-width="${isHi?2:1}" marker-end="url(#${marker})"/>
          <text x="${cx}" y="${cy-52}" font-size="9" fill="${isHi?'#5ce1e6':'#5d6680'}" text-anchor="middle" font-family="Space Mono">${e.label}</text>`;
      } else {
        const dx=to.x-from.x, dy=to.y-from.y, d=Math.sqrt(dx*dx+dy*dy);
        const nx=dx/d, ny=dy/d, r=26;
        const sx=from.x+nx*r, sy=from.y+ny*r, ex=to.x-nx*r, ey=to.y-ny*r;
        // Slight curve
        const mx=(sx+ex)/2-ny*18, my=(sy+ey)/2+nx*18;
        edgeSVG += `<path d="M${sx},${sy} Q${mx},${my} ${ex},${ey}"
          fill="none" stroke="${col}" stroke-width="${isHi?2:1}" marker-end="url(#${marker})"/>
          <text font-size="9" fill="${isHi?'#5ce1e6':'#5d6680'}" font-family="Space Mono">
            <textPath href="#ep${e.from+e.to}" startOffset="50%" text-anchor="middle">${e.label}</textPath>
          </text>
          <path id="ep${e.from+e.to}" d="M${sx},${sy} Q${mx},${my} ${ex},${ey}" fill="none" stroke="none"/>`;
      }
    });

    let nodeSVG = '';
    nodes.forEach(n => {
      const isHi = highlight && n.type===highlight;
      const col = isHi ? n.color : '#2a2f45';
      const textCol = isHi ? '#fff' : '#5d6680';
      const stroke = isHi ? n.color : '#363d58';
      nodeSVG += `<g class="svg-node" data-type="${n.type}">
        <circle cx="${n.x}" cy="${n.y}" r="24" fill="${isHi?col+'22':'#1e2235'}" stroke="${stroke}" stroke-width="${isHi?2.5:1.5}"/>
        <text x="${n.x}" y="${n.y+5}" text-anchor="middle" font-size="13" font-weight="700" fill="${isHi?col:'#9aa3bc'}" font-family="Syne,sans-serif">${n.label}</text>
      </g>`;
    });

    svg.innerHTML = DEFS + edgeSVG + nodeSVG;
  }

  renderDiagram(null);

  // Event: state cards
  document.querySelectorAll('.state-card').forEach(card => {
    card.addEventListener('click', () => {
      const type = card.dataset.state;
      document.querySelectorAll('.state-card').forEach(c=>c.classList.remove('active'));
      card.classList.add('active');
      renderDiagram(type);
      legend.innerHTML = stateDescriptions[type] || '';
    });
  });
}

// ─── MÓDULO: CONSTRUCTOR DE MATRIZ ───────────────────────────────────────────

const MatrixModule = {
  size: 3,
  inputs: [],

  init() {
    const sizeEl = document.getElementById('matrixSize');
    if (!sizeEl) return;
    sizeEl.addEventListener('change', () => { this.size=+sizeEl.value; this.render(); this.renderDiagram(this.getMatrix()); });
    document.getElementById('randomMatrix').addEventListener('click', () => this.randomize());
    document.getElementById('clearMatrix').addEventListener('click', () => this.clear());
    document.getElementById('computeMatrix').addEventListener('click', () => this.compute());
    this.render();
  },

  getStateNames() {
    return Array.from({length:this.size}, (_,i)=>String.fromCharCode(65+i));
  },

  render() {
    const area = document.getElementById('matrixInputArea');
    if (!area) return;
    const names = this.getStateNames();
    let html = `<div style="overflow-x:auto"><table class="matrix-table">
      <thead><tr><th></th>${names.map(n=>`<th>${n}</th>`).join('')}<th>Σ</th></tr></thead>
      <tbody>`;
    for (let i=0;i<this.size;i++) {
      html += `<tr><th>${names[i]}</th>`;
      for (let j=0;j<this.size;j++) {
        html += `<td><input class="matrix-input" type="number" min="0" max="1" step="0.01"
          data-r="${i}" data-c="${j}" value="" placeholder="0" /></td>`;
      }
      html += `<td class="row-sum" id="rowsum_main_${i}">—</td></tr>`;
    }
    html += '</tbody></table></div>';
    area.innerHTML = html;
    area.querySelectorAll('.matrix-input').forEach(inp => {
      inp.addEventListener('input', () => { this.validateRow(+inp.dataset.r, 'main'); this.renderDiagram(this.getMatrix()); });
    });
  },

  getMatrix() {
    const P = [];
    for (let i=0;i<this.size;i++) {
      const row=[];
      for (let j=0;j<this.size;j++) {
        const el=document.querySelector(`#matrixInputArea input[data-r="${i}"][data-c="${j}"]`);
        row.push(el ? (+el.value||0) : 0);
      }
      P.push(row);
    }
    return P;
  },

  validateRow(i, prefix='main') {
    const P = this.getMatrix();
    const sum = P[i].reduce((a,x)=>a+x,0);
    const el = document.getElementById(`rowsum_${prefix}_${i}`);
    if (!el) return;
    el.textContent = sum.toFixed(4);
    el.className = 'row-sum ' + (Math.abs(sum-1)<.005 ? 'valid' : 'invalid');
  },

  validateAll() {
    const P = this.getMatrix();
    const names = this.getStateNames();
    let ok=true, msg='';
    P.forEach((row,i) => {
      const sum=row.reduce((a,x)=>a+x,0);
      if (Math.abs(sum-1)>.005) { ok=false; msg+=`Fila ${names[i]} suma ${sum.toFixed(4)} ≠ 1. `; }
      if (row.some(x=>x<0)) { ok=false; msg+=`Fila ${names[i]} tiene valores negativos. `; }
    });
    const v = document.getElementById('matrixValidation');
    if (v) { v.textContent = ok ? '✓ Matriz válida — es estocástica.' : '✗ '+msg; v.className='validation-msg '+(ok?'ok':'err'); }
    return ok;
  },

  randomize() {
    for (let i=0;i<this.size;i++) {
      const vals=Array.from({length:this.size},()=>Math.random());
      const sum=vals.reduce((a,x)=>a+x,0);
      for (let j=0;j<this.size;j++) {
        const el=document.querySelector(`#matrixInputArea input[data-r="${i}"][data-c="${j}"]`);
        if (el) el.value=(vals[j]/sum).toFixed(3);
      }
      this.validateRow(i, 'main');
    }
    this.renderDiagram(this.getMatrix());
  },

  clear() {
    document.querySelectorAll('#matrixInputArea .matrix-input').forEach(el=>el.value='');
    for (let i=0;i<this.size;i++) {
      const el=document.getElementById(`rowsum_main_${i}`); if(el) { el.textContent='—'; el.className='row-sum'; }
    }
    document.getElementById('matrixValidation').textContent='';
    document.getElementById('matrixResults').innerHTML='';
  },

  compute() {
    if (!this.validateAll()) return;
    const P=this.getMatrix(), names=this.getStateNames();
    const P2=MathUtils.matPow(P,2), P3=MathUtils.matPow(P,3);
    const results=document.getElementById('matrixResults');
    results.innerHTML=['P (original)','P² (2 pasos)','P³ (3 pasos)'].map((label,idx)=>{
      const M=[P,P2,P3][idx];
      return `<div class="result-matrix"><h4>${label}</h4><div class="matrix-display">
        ${M.map(row=>`<div class="matrix-row">${row.map((v,j)=>`<span class="matrix-cell" title="${names[j]}">${v.toFixed(4)}</span>`).join('')}</div>`).join('')}
      </div></div>`;
    }).join('');
  },

  renderDiagram(P) {
    const svg=document.getElementById('transitionDiagram');
    if (!svg) return;
    const n=P.length, names=this.getStateNames();
    const W=600,H=400, R=28, cx=W/2, cy=H/2, rad=150;
    const pts=Array.from({length:n},(_,i)=>({
      x:cx+rad*Math.cos(2*Math.PI*i/n-Math.PI/2),
      y:cy+rad*Math.sin(2*Math.PI*i/n-Math.PI/2)
    }));

    let defs=`<defs>
      ${STATE_COLORS.map((c,i)=>`<marker id="a${i}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
        <path d="M0,0 L0,6 L8,3 z" fill="${c}"/></marker>`).join('')}
    </defs>`;

    let edges='', nodes='';
    for (let i=0;i<n;i++) for (let j=0;j<n;j++) {
      const v=P[i][j]; if (v<.005) continue;
      const col=STATE_COLORS[i%STATE_COLORS.length];
      if (i===j) {
        const {x,y}=pts[i];
        edges+=`<path d="M${x-10},${y-R-2} C${x-35},${y-R-45} ${x+35},${y-R-45} ${x+10},${y-R-2}"
          fill="none" stroke="${col}" stroke-width="${Math.max(1,v*3)}" opacity="${.4+v*.5}" marker-end="url(#a${i%STATE_COLORS.length})"/>
          <text x="${x}" y="${y-R-40}" text-anchor="middle" font-size="10" fill="${col}" font-family="Space Mono">${v.toFixed(2)}</text>`;
      } else {
        const {x:x1,y:y1}=pts[i], {x:x2,y:y2}=pts[j];
        const dx=x2-x1,dy=y2-y1,d=Math.sqrt(dx*dx+dy*dy);
        const nx=dx/d,ny=dy/d;
        const ox=-ny*15,oy=nx*15;
        const sx=x1+nx*R+ox,sy=y1+ny*R+oy;
        const ex=x2-nx*R+ox,ey=y2-ny*R+oy;
        const mx=(sx+ex)/2+ox*.5,my=(sy+ey)/2+oy*.5;
        edges+=`<path d="M${sx},${sy} Q${mx},${my} ${ex},${ey}"
          fill="none" stroke="${col}" stroke-width="${Math.max(1,v*3)}" opacity="${.3+v*.7}" marker-end="url(#a${i%STATE_COLORS.length})"/>
          <text x="${mx}" y="${my}" text-anchor="middle" font-size="10" fill="${col}" font-family="Space Mono" dy="-4">${v.toFixed(2)}</text>`;
      }
    }
    pts.forEach(({x,y},i)=>{
      const col=STATE_COLORS[i%STATE_COLORS.length];
      nodes+=`<circle cx="${x}" cy="${y}" r="${R}" fill="${col}22" stroke="${col}" stroke-width="2"/>
        <text x="${x}" y="${y+5}" text-anchor="middle" font-size="14" font-weight="700" fill="${col}" font-family="Syne,sans-serif">${names[i]}</text>`;
    });
    svg.innerHTML=defs+edges+nodes;
  }
};

// ─── MÓDULO: CALCULADORA ESTACIONARIA ────────────────────────────────────────

const StationaryModule = {
  size: 3,

  init() {
    const sizeEl=document.getElementById('stationarySize');
    if (!sizeEl) return;
    sizeEl.addEventListener('change',()=>{this.size=+sizeEl.value;this.render();});
    document.getElementById('stationaryRandom').addEventListener('click',()=>this.loadExample());
    document.getElementById('computeStationary').addEventListener('click',()=>this.compute());
    this.render();
    this.loadExample();
  },

  render() {
    const area=document.getElementById('stationaryInputArea');
    if (!area) return;
    const names=Array.from({length:this.size},(_,i)=>String.fromCharCode(65+i));
    let html=`<div style="overflow-x:auto"><table class="matrix-table">
      <thead><tr><th></th>${names.map(n=>`<th>${n}</th>`).join('')}<th>Σ</th></tr></thead><tbody>`;
    for(let i=0;i<this.size;i++){
      html+=`<tr><th>${names[i]}</th>`;
      for(let j=0;j<this.size;j++) html+=`<td><input class="matrix-input" type="number" min="0" max="1" step="0.01" data-sr="${i}" data-sc="${j}" value="" placeholder="0"/></td>`;
      html+=`<td class="row-sum" id="rowsum_stat_${i}">—</td></tr>`;
    }
    html+='</tbody></table></div>';
    area.innerHTML=html;
    area.querySelectorAll('.matrix-input').forEach(inp=>inp.addEventListener('input',()=>this.validateRow(+inp.dataset.sr)));
  },

  getMatrix() {
    const P=[];
    for(let i=0;i<this.size;i++){
      const row=[];
      for(let j=0;j<this.size;j++){
        const el=document.querySelector(`#stationaryInputArea input[data-sr="${i}"][data-sc="${j}"]`);
        row.push(el?(+el.value||0):0);
      }
      P.push(row);
    }
    return P;
  },

  validateRow(i) {
    const P=this.getMatrix();
    const sum=P[i].reduce((a,x)=>a+x,0);
    const el=document.getElementById(`rowsum_stat_${i}`);
    if(!el)return;
    el.textContent=sum.toFixed(4);
    el.className='row-sum '+(Math.abs(sum-1)<.005?'valid':'invalid');
  },

  loadExample() {
    // Ejemplo del TCC: Tabla 1
    const ex=[[.6,.3,.1],[.2,.5,.3],[.4,.1,.5]];
    const s=Math.min(3,this.size);
    for(let i=0;i<s;i++) for(let j=0;j<s;j++){
      const el=document.querySelector(`#stationaryInputArea input[data-sr="${i}"][data-sc="${j}"]`);
      if(el){el.value=ex[i][j];this.validateRow(i);}
    }
  },

  compute() {
    const P=this.getMatrix();
    const names=Array.from({length:this.size},(_,i)=>String.fromCharCode(65+i));
    // Validate
    let ok=true;
    P.forEach((row,i)=>{const s=row.reduce((a,x)=>a+x,0);if(Math.abs(s-1)>.01)ok=false;});
    const res=document.getElementById('stationaryResults');
    const chart=document.getElementById('stationaryChart');
    if(!ok){res.innerHTML='<p style="color:var(--accent3);margin-top:.75rem">⚠ La matriz no es válida (filas no suman 1).</p>';chart.innerHTML='';return;}

    const pi=MathUtils.stationaryDist(P);

    // Mostrar tabla de resultados
    res.innerHTML=`<table class="stationary-result-table" style="margin-top:1rem">
      <thead><tr><th>Estado</th><th>π<sub>i</sub></th><th>Porcentaje</th><th>Interpretación</th></tr></thead>
      <tbody>
      ${names.map((n,i)=>`<tr>
        <td>${n}</td>
        <td>${pi[i].toFixed(6)}</td>
        <td>${(pi[i]*100).toFixed(2)}%</td>
        <td style="font-size:.8rem;color:var(--text2)">El sistema pasa ~${(pi[i]*100).toFixed(1)}% del tiempo en ${n}</td>
      </tr>`).join('')}
      </tbody>
    </table>`;

    // Gráfica de barras
    const COLORS_PI=['#5ce1e6','#7b61ff','#ff6b6b','#ffd166'];
    chart.innerHTML=`<div class="chart-bar-group">
      ${names.map((n,i)=>`<div class="chart-bar-item">
        <span class="chart-bar-label">${n}</span>
        <div class="chart-bar-track">
          <div class="chart-bar-fill" style="width:${(pi[i]*100).toFixed(1)}%;background:${COLORS_PI[i%4]}">
            <span class="chart-bar-val">${(pi[i]*100).toFixed(1)}%</span>
          </div>
        </div>
      </div>`).join('')}
    </div>`;

    // Verificar: mostrar πP
    const piRow=[pi];
    const piP=MathUtils.matMul(piRow,P)[0];
    const diff=Math.max(...pi.map((x,i)=>Math.abs(x-piP[i])));
    res.innerHTML+=`<div class="math-block" style="margin-top:1rem">
      <span class="math-label">Verificación: π · P = π (error máx: ${diff.toFixed(8)})</span>
      <div class="formula">${names.map((n,i)=>`π<sub>${n}</sub> = ${MathUtils.fmt(pi[i])}`).join(' | ')}</div>
    </div>`;
  }
};

// ─── MÓDULO: SIMULADOR ────────────────────────────────────────────────────────

const Simulator = {
  scenarios: {
    clima: {
      names:['☀️ Sol','☁️ Nublado','🌧 Lluvia'],
      P:[[.6,.3,.1],[.3,.4,.3],[.2,.3,.5]]
    },
    mercado: {
      names:['📈 Alcista','➡️ Estable','📉 Bajista'],
      P:[[.5,.3,.2],[.2,.6,.2],[.1,.3,.6]]
    },
    cliente: {
      names:['🟢 Activo','🟡 En riesgo','🔴 Perdido'],
      P:[[.7,.2,.1],[.3,.5,.2],[.0,.1,.9]]
    },
    custom: {
      names:['A','B','C'],
      P:[[.5,.3,.2],[.3,.4,.3],[.2,.3,.5]]
    }
  },
  current: null,
  running: false,
  timer: null,
  history: [],
  counts: [],
  step: 0,
  initState: 0,

  init() {
    const scEl=document.getElementById('simScenario');
    if (!scEl) return;
    scEl.addEventListener('change', ()=>this.loadScenario(scEl.value));
    document.getElementById('simStep').addEventListener('click',()=>this.doStep());
    document.getElementById('simAuto').addEventListener('click',()=>this.toggleAuto());
    document.getElementById('simReset').addEventListener('click',()=>this.reset());
    document.getElementById('simSpeed').addEventListener('input',e=>{
      document.getElementById('simSpeedLabel').textContent=e.target.value+'ms';
    });
    document.getElementById('simInitState').addEventListener('change',e=>{
      this.initState=+e.target.value; this.reset();
    });
    this.loadScenario('clima');
  },

  loadScenario(key) {
    this.current=JSON.parse(JSON.stringify(this.scenarios[key]));
    this.populateInitStates();
    if (key==='custom') this.renderCustomMatrix();
    else document.getElementById('simMatrixArea').innerHTML='';
    this.reset();
  },

  populateInitStates() {
    const sel=document.getElementById('simInitState');
    sel.innerHTML=this.current.names.map((n,i)=>`<option value="${i}">${n}</option>`).join('');
  },

  renderCustomMatrix() {
    const n=3, area=document.getElementById('simMatrixArea');
    const names=this.current.names;
    let html=`<div style="overflow-x:auto;margin:.75rem 0"><small style="color:var(--text2);font-family:var(--font-mono)">Matriz personalizable:</small>
      <table class="matrix-table"><thead><tr><th></th>${names.map(n=>`<th>${n}</th>`).join('')}</tr></thead><tbody>`;
    for(let i=0;i<n;i++){
      html+=`<tr><th>${names[i]}</th>`;
      for(let j=0;j<n;j++) html+=`<td><input class="matrix-input" type="number" min="0" max="1" step="0.05"
        data-si="${i}" data-sj="${j}" value="${this.current.P[i][j]}" style="width:3.5rem"/></td>`;
      html+='</tr>';
    }
    html+='</tbody></table></div>';
    area.innerHTML=html;
    area.querySelectorAll('.matrix-input').forEach(inp=>inp.addEventListener('change',()=>{
      const i=+inp.dataset.si,j=+inp.dataset.sj;
      this.current.P[i][j]=+inp.value||0;
      this.reset();
    }));
  },

  reset() {
    this.running=false; clearInterval(this.timer);
    document.getElementById('simAuto').textContent='▶ Auto';
    this.step=0; this.history=[this.initState];
    this.counts=Array(this.current.names.length).fill(0);
    this.counts[this.initState]=1;
    document.getElementById('simChain').innerHTML='';
    document.getElementById('statSteps').textContent='0';
    document.getElementById('statCurrent').textContent=this.current.names[this.initState];
    this.addToken(this.initState, true);
    this.renderChart();
    this.renderDiagram(this.initState);
  },

  nextState(s) {
    const row=this.current.P[s]; let cum=0, r=Math.random();
    for(let j=0;j<row.length;j++){cum+=row[j];if(r<=cum)return j;}
    return s;
  },

  doStep() {
    const cur=this.history[this.history.length-1];
    const next=this.nextState(cur);
    this.history.push(next);
    this.counts[next]++;
    this.step++;
    document.getElementById('statSteps').textContent=this.step;
    document.getElementById('statCurrent').textContent=this.current.names[next];
    this.addToken(next, true);
    if (this.history.length>80) {
      const chain=document.getElementById('simChain');
      if(chain.firstChild) chain.removeChild(chain.firstChild);
    }
    this.renderChart();
    this.renderDiagram(next);
  },

  addToken(state, latest=false) {
    const chain=document.getElementById('simChain');
    // Remove latest class from prev
    chain.querySelectorAll('.latest').forEach(el=>el.classList.remove('latest'));
    const el=document.createElement('div');
    el.className='sim-token'+(latest?' latest':'');
    el.textContent=this.current.names[state].split(' ')[0]||state;
    el.style.background=STATE_COLORS_BG[state%STATE_COLORS_BG.length];
    el.style.border=`2px solid ${STATE_COLORS[state%STATE_COLORS.length]}`;
    el.style.color=STATE_COLORS[state%STATE_COLORS.length];
    chain.appendChild(el);
    chain.scrollLeft=chain.scrollWidth;
  },

  renderChart() {
    const canvas=document.getElementById('simChart');
    if(!canvas) return;
    const ctx=canvas.getContext('2d');
    const n=this.current.names.length;
    const total=this.counts.reduce((a,x)=>a+x,0)||1;
    const empirical=this.counts.map(x=>x/total);

    // Compute stationary
    let stationary;
    try { stationary=MathUtils.stationaryDist(this.current.P); } catch(e){ stationary=Array(n).fill(1/n); }

    const W=canvas.offsetWidth||600, H=200;
    canvas.width=W; canvas.height=H;
    ctx.clearRect(0,0,W,H);

    const bw=Math.min(60,(W/(n*2+1)));
    const gap=bw*.5;
    const total_w=(bw*2+gap)*n;
    const startX=(W-total_w)/2;
    const maxH=H-40;

    n===0 || [empirical, stationary].forEach((vals,series)=>{
      vals.forEach((v,i)=>{
        const x=startX+(bw*2+gap)*i+(series===1?bw:0);
        const h=v*maxH;
        ctx.fillStyle=series===0?STATE_COLORS[i%STATE_COLORS.length]+'aa':'rgba(255,255,255,.15)';
        ctx.fillRect(x,H-30-h,bw,h);
      });
    });

    // Labels
    ctx.font='11px Space Mono';
    ctx.textAlign='center';
    this.current.names.forEach((name,i)=>{
      const x=startX+(bw*2+gap)*i+bw;
      ctx.fillStyle=STATE_COLORS[i%STATE_COLORS.length];
      ctx.fillText(name.split(' ')[0],x,H-12);
      ctx.fillStyle='rgba(255,255,255,.6)';
      ctx.fillText((empirical[i]*100).toFixed(0)+'%',x,H-30-empirical[i]*maxH-5);
    });

    // Legend
    ctx.font='10px Space Mono';
    ctx.textAlign='left';
    ctx.fillStyle=STATE_COLORS[0]+'aa'; ctx.fillRect(10,10,12,12);
    ctx.fillStyle='var(--text2)'; ctx.fillStyle='#9aa3bc'; ctx.fillText('Empírico',26,20);
    ctx.fillStyle='rgba(255,255,255,.15)'; ctx.fillRect(100,10,12,12);
    ctx.fillStyle='#9aa3bc'; ctx.fillText('Estacionario',116,20);
  },

  renderDiagram(active) {
    const svg=document.getElementById('simDiagram');
    if(!svg) return;
    const n=this.current.P.length, names=this.current.names;
    const W=500,H=300,R=36,cx=W/2,cy=H/2,rad=110;
    const pts=Array.from({length:n},(_,i)=>({
      x:cx+rad*Math.cos(2*Math.PI*i/n-Math.PI/2),
      y:cy+rad*Math.sin(2*Math.PI*i/n-Math.PI/2)
    }));

    let defs=`<defs>${STATE_COLORS.map((c,i)=>`<marker id="sa${i}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="${c}50"/></marker>`).join('')}
      ${STATE_COLORS.map((c,i)=>`<marker id="sah${i}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="${c}"/></marker>`).join('')}
    </defs>`;

    let edges='',nodes='';
    const P=this.current.P;
    for(let i=0;i<n;i++) for(let j=0;j<n;j++){
      const v=P[i][j]; if(v<.01) continue;
      const isActive=(i===active||j===active);
      const col=STATE_COLORS[i%STATE_COLORS.length];
      const op=isActive?1:.3;
      const mId=isActive?`sah${i%STATE_COLORS.length}`:`sa${i%STATE_COLORS.length}`;
      if(i===j){
        const {x,y}=pts[i];
        edges+=`<path d="M${x-8},${y-R-2} C${x-28},${y-R-38} ${x+28},${y-R-38} ${x+8},${y-R-2}"
          fill="none" stroke="${col}" stroke-width="${Math.max(1,v*3)}" opacity="${op}" marker-end="url(#${mId})"/>
          <text x="${x}" y="${y-R-32}" text-anchor="middle" font-size="9" fill="${col}" opacity="${op}" font-family="Space Mono">${v.toFixed(2)}</text>`;
      } else {
        const {x:x1,y:y1}=pts[i],{x:x2,y:y2}=pts[j];
        const dx=x2-x1,dy=y2-y1,d=Math.sqrt(dx*dx+dy*dy);
        const nx=dx/d,ny=dy/d;
        const ox=-ny*12,oy=nx*12;
        const sx=x1+nx*R+ox,sy=y1+ny*R+oy,ex=x2-nx*R+ox,ey=y2-ny*R+oy;
        const mx=(sx+ex)/2+ox*.4,my=(sy+ey)/2+oy*.4;
        edges+=`<path d="M${sx},${sy} Q${mx},${my} ${ex},${ey}"
          fill="none" stroke="${col}" stroke-width="${Math.max(1,v*2.5)}" opacity="${op}" marker-end="url(#${mId})"/>
          <text x="${mx}" y="${my}" text-anchor="middle" font-size="9" fill="${col}" opacity="${op}" font-family="Space Mono" dy="-3">${v.toFixed(2)}</text>`;
      }
    }

    pts.forEach(({x,y},i)=>{
      const col=STATE_COLORS[i%STATE_COLORS.length];
      const isAct=i===active;
      nodes+=`<circle cx="${x}" cy="${y}" r="${R}" fill="${isAct?col+'33':'#0a0c12'}" stroke="${col}" stroke-width="${isAct?3:1.5}"/>
        ${isAct?`<circle cx="${x}" cy="${y}" r="${R+8}" fill="none" stroke="${col}" stroke-width="1.5" opacity=".3"/>`:``}
        <text x="${x}" y="${y-4}" text-anchor="middle" font-size="13" fill="${col}" font-family="Syne,sans-serif" font-weight="700">${names[i].split(' ')[0]}</text>
        <text x="${x}" y="${y+12}" text-anchor="middle" font-size="9" fill="${col}99" font-family="Space Mono">${names[i].split(' ')[1]||''}</text>`;
    });

    svg.innerHTML=defs+edges+nodes;
  },

  toggleAuto() {
    this.running=!this.running;
    const btn=document.getElementById('simAuto');
    if(this.running){
      btn.textContent='⏸ Pausar';
      const speed=+document.getElementById('simSpeed').value;
      this.timer=setInterval(()=>this.doStep(),speed);
    } else {
      btn.textContent='▶ Auto';
      clearInterval(this.timer);
    }
  }
};

// ─── MÓDULO: N PASOS ─────────────────────────────────────────────────────────

const NStepsModule = {
  size: 3,

  init() {
    const sizeEl=document.getElementById('nstepSize');
    if(!sizeEl) return;
    sizeEl.addEventListener('change',()=>{this.size=+sizeEl.value;this.render();});
    document.getElementById('nstepExample').addEventListener('click',()=>this.loadExample());
    document.getElementById('computeNstep').addEventListener('click',()=>this.compute());
    document.getElementById('nstepSize').addEventListener('change',()=>this.updateInitStates());
    this.render(); this.loadExample();
  },

  render() {
    const area=document.getElementById('nstepMatrixArea');
    if(!area) return;
    const names=Array.from({length:this.size},(_,i)=>String.fromCharCode(65+i));
    let html=`<div style="overflow-x:auto;margin:.75rem 0"><table class="matrix-table">
      <thead><tr><th></th>${names.map(n=>`<th>${n}</th>`).join('')}</tr></thead><tbody>`;
    for(let i=0;i<this.size;i++){
      html+=`<tr><th>${names[i]}</th>`;
      for(let j=0;j<this.size;j++) html+=`<td><input class="matrix-input" type="number" min="0" max="1" step="0.01"
        data-ni="${i}" data-nj="${j}" value="" placeholder="0" style="width:3.5rem"/></td>`;
      html+='</tr>';
    }
    html+='</tbody></table></div>';
    area.innerHTML=html;
    this.updateInitStates();
  },

  updateInitStates() {
    const sel=document.getElementById('nstepInit');
    if(!sel) return;
    const names=Array.from({length:this.size},(_,i)=>String.fromCharCode(65+i));
    sel.innerHTML=names.map((n,i)=>`<option value="${i}">Estado ${n}</option>`).join('');
  },

  loadExample() {
    const ex=[[.6,.3,.1],[.2,.5,.3],[.4,.1,.5]];
    const s=Math.min(3,this.size);
    for(let i=0;i<s;i++) for(let j=0;j<s;j++){
      const el=document.querySelector(`#nstepMatrixArea input[data-ni="${i}"][data-nj="${j}"]`);
      if(el) el.value=ex[i][j];
    }
  },

  getMatrix() {
    const P=[];
    for(let i=0;i<this.size;i++){
      const row=[];
      for(let j=0;j<this.size;j++){
        const el=document.querySelector(`#nstepMatrixArea input[data-ni="${i}"][data-nj="${j}"]`);
        row.push(el?(+el.value||0):0);
      }
      P.push(row);
    }
    return P;
  },

  compute() {
    const P=this.getMatrix();
    const n=+document.getElementById('nstepN').value||5;
    const initState=+document.getElementById('nstepInit').value||0;
    const names=Array.from({length:this.size},(_,i)=>String.fromCharCode(65+i));
    const res=document.getElementById('nstepResults');

    const Pn=MathUtils.matPow(P,n);
    const probs=Pn[initState];
    const COLORS_N=['#5ce1e6','#7b61ff','#ff6b6b','#ffd166','#06d6a0'];

    // Evolución para steps 1..n
    const evolution=[];
    for(let k=1;k<=Math.min(n,10);k++){
      const Pk=MathUtils.matPow(P,k);
      evolution.push({step:k, probs:Pk[initState]});
    }

    res.innerHTML=`<div class="nstep-result-block">
      <h4>P(X<sub>${n}</sub> = j | X<sub>0</sub> = ${names[initState]})</h4>
      <p style="color:var(--text2);font-size:.88rem">Probabilidades de estar en cada estado después de exactamente <strong>${n} pasos</strong>:</p>
      <div class="prob-bars">
        ${names.map((name,j)=>`<div class="prob-bar-item">
          <div class="prob-bar-header">
            <span class="prob-bar-state">→ ${name}</span>
            <span class="prob-bar-value">${(probs[j]*100).toFixed(2)}%</span>
          </div>
          <div class="prob-bar-track">
            <div class="prob-bar-fill" style="width:${(probs[j]*100).toFixed(1)}%;background:${COLORS_N[j%5]}"></div>
          </div>
        </div>`).join('')}
      </div>
      <div class="nstep-evolution">
        <h4>Evolución paso a paso (desde ${names[initState]})</h4>
        <div style="overflow-x:auto"><table class="evolution-table">
          <thead><tr><th>Paso n</th>${names.map(name=>`<th>P(→${name})</th>`).join('')}</tr></thead>
          <tbody>
          ${evolution.map(e=>`<tr>
            <td>n = ${e.step}</td>
            ${e.probs.map(v=>`<td style="color:var(--accent)">${(v*100).toFixed(2)}%</td>`).join('')}
          </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
    </div>`;
  }
};

// ─── MÓDULO: APLICACIONES ────────────────────────────────────────────────────

const appData = {
  clima: {
    title:'🌤️ Predicción Climática — Cartagena',
    sector:'Meteorología',
    desc:`En Cartagena, el clima tiene tres estados principales: Soleado (S), Nublado (N) y Lluvioso (L). 
    Gracias a registros históricos, se estimó la siguiente matriz de transición diaria:`,
    matrix:[[.6,.3,.1],[.2,.5,.3],[.1,.3,.6]],
    names:['Soleado','Nublado','Lluvioso'],
    interpretation:`Con distribución estacionaria π ≈ (0.32, 0.36, 0.32), significa que a largo plazo 
    Cartagena tendrá días soleados el 32% del tiempo, nublados el 36% y lluviosos el 32%. 
    Esto es útil para planear temporadas turísticas y operaciones portuarias.`,
    useCase:'Planificación turística, logística portuaria, gestión de eventos al aire libre.'
  },
  mercado: {
    title:'📈 Análisis de Mercado — Bolsa de Colombia',
    sector:'Finanzas',
    desc:'Se modelan los estados del mercado bursátil colombiano como Alcista (A), Estable (E) y Bajista (B) con la siguiente matriz de transición semanal:',
    matrix:[[.6,.3,.1],[.15,.7,.15],[.1,.3,.6]],
    names:['Alcista','Estable','Bajista'],
    interpretation:'La distribución estacionaria indica que el mercado está en tendencia alcista ~28%, estable ~51% y bajista ~21% del tiempo en el largo plazo. Este modelo apoya estrategias de inversión y gestión de riesgo.',
    useCase:'Gestión de portafolios, análisis de riesgo, estrategias de trading sistemático.'
  },
  cliente: {
    title:'🛒 Fidelización de Clientes — Retail',
    sector:'Mercadeo',
    desc:'Una cadena retail colombiana clasifica sus clientes en Activo (A), En riesgo (R) y Perdido (P). La matriz de transición mensual es:',
    matrix:[[.7,.2,.1],[.3,.5,.2],[.05,.15,.8]],
    names:['Activo','En riesgo','Perdido'],
    interpretation:'Con el tiempo, el 18% de los clientes están activos, el 22% en riesgo y el 60% perdidos. Esto indica que es crítico invertir en retención para clientes en riesgo antes de que se pierdan definitivamente.',
    useCase:'CRM, programas de fidelización, estrategias de recuperación de clientes.'
  },
  salud: {
    title:'🏥 Modelo Epidemiológico SIR',
    sector:'Salud Pública',
    desc:'El modelo SIR clasifica a la población en Susceptible (S), Infectado (I) y Recuperado (R). Aplicado a una enfermedad con tasa de contagio moderada en Colombia:',
    matrix:[[.85,.14,.01],[.0,.65,.35],[.02,.0,.98]],
    names:['Susceptible','Infectado','Recuperado'],
    interpretation:'En el largo plazo, dado que R es un estado casi absorbente, la mayoría de la población pasa al estado Recuperado. El modelo permite simular el impacto de vacunaciones cambiando las probabilidades de transición desde S.',
    useCase:'Políticas de vacunación, planificación hospitalaria, control de epidemias.'
  },
  inventario: {
    title:'📦 Control de Inventario',
    sector:'Logística',
    desc:'Un centro de distribución colombiano modela el nivel de inventario en tres estados: Alto (A), Normal (N), Bajo (B):',
    matrix:[[.7,.2,.1],[.3,.5,.2],[.4,.4,.2]],
    names:['Alto','Normal','Bajo'],
    interpretation:'La distribución estacionaria muestra el porcentaje de tiempo en cada nivel. Con esta información se pueden diseñar políticas de reorden óptimas que minimicen costos de almacenamiento y eviten desabastecimiento.',
    useCase:'Políticas de reorden, optimización de almacenes, cadenas de suministro.'
  },
  demografico: {
    title:'👥 Movilidad Social en Colombia',
    sector:'Demografía',
    desc:'Se modela la movilidad entre estratos socioeconómicos (bajo, medio, alto) en Colombia con datos quinquenales:',
    matrix:[[.75,.22,.03],[.15,.7,.15],[.02,.18,.8]],
    names:['Estrato Bajo','Estrato Medio','Estrato Alto'],
    interpretation:'La distribución estacionaria revela la estructura de clases en el largo plazo. La baja probabilidad de transición entre extremos (bajo↔alto) refleja la alta persistencia de la desigualdad social en Colombia y la importancia de políticas redistributivas.',
    useCase:'Política pública, estudios de desigualdad, diseño de programas sociales.'
  }
};

function initApplications() {
  const modal=document.getElementById('appModal');
  const modalBody=document.getElementById('modalBody');
  const modalClose=document.getElementById('modalClose');
  const backdrop=document.getElementById('modalBackdrop');
  if (!modal) return;

  document.querySelectorAll('.app-explore').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const key=btn.dataset.app;
      const d=appData[key]; if(!d) return;
      const names=d.names;
      const pi=MathUtils.stationaryDist(d.matrix);
      const matHTML=`<table style="border-collapse:collapse;font-family:Space Mono;font-size:.82rem;margin:1rem 0">
        <thead><tr><th style="padding:.4rem .75rem;color:var(--text3)"></th>${names.map(n=>`<th style="padding:.4rem .75rem;color:var(--text3)">${n}</th>`).join('')}</tr></thead>
        <tbody>${d.matrix.map((row,i)=>`<tr><th style="padding:.4rem .75rem;color:var(--text3)">${names[i]}</th>${row.map(v=>`<td style="padding:.4rem .75rem;color:var(--accent)">${v.toFixed(3)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>`;
      const piHTML=names.map((n,i)=>`<span style="color:${STATE_COLORS[i]}">π<sub>${n.split(' ')[0]}</sub> = ${(pi[i]*100).toFixed(1)}%</span>`).join(' | ');

      modalBody.innerHTML=`
        <div style="margin-bottom:1rem"><span style="font-size:.75rem;color:var(--accent);font-family:Space Mono;text-transform:uppercase">${d.sector}</span></div>
        <h2 style="margin-bottom:1rem">${d.title}</h2>
        <p>${d.desc}</p>
        <div class="modal-matrix">${matHTML}</div>
        <div class="math-block">
          <span class="math-label">Distribución Estacionaria π</span>
          <div class="formula">${piHTML}</div>
        </div>
        <h3 style="margin-top:1.5rem">Interpretación</h3>
        <p>${d.interpretation}</p>
        <div style="margin-top:1rem;padding:.75rem 1rem;background:rgba(123,97,255,.08);border-radius:.75rem;border:1px solid rgba(123,97,255,.2)">
          <strong style="color:var(--accent2)">Aplicaciones prácticas:</strong> ${d.useCase}
        </div>`;
      modal.classList.remove('hidden');
    });
  });

  modalClose.addEventListener('click',()=>modal.classList.add('hidden'));
  backdrop.addEventListener('click',()=>modal.classList.add('hidden'));
  document.addEventListener('keydown',e=>{if(e.key==='Escape') modal.classList.add('hidden');});
}

// ─── MÓDULO: QUIZ ─────────────────────────────────────────────────────────────

const quizData = [
  {q:'¿Cuál es la "Propiedad de Markov"?',
   opts:['El futuro depende de toda la historia','El futuro depende solo del presente','El presente depende del futuro','Los estados son siempre finitos'],
   ans:1, exp:'La propiedad de Markov establece que P(Xₙ₊₁ = j | Xₙ = i, Xₙ₋₁, …) = P(Xₙ₊₁ = j | Xₙ = i). Solo importa el estado presente.'},
  {q:'¿Qué condición debe cumplir cada fila de una matriz de transición?',
   opts:['Sumar 0','Sumar infinito','Sumar 1','Tener todos sus elementos iguales'],
   ans:2, exp:'Cada fila de la matriz de transición representa las probabilidades de ir desde un estado a todos los demás, por lo tanto debe sumar exactamente 1.'},
  {q:'Un estado absorbente tiene la propiedad que:',
   opts:['Puede abandonarse con probabilidad 0.5','pᵢᵢ = 1, nunca lo abandona','Regresa siempre en 2 pasos','Tiene período igual a 2'],
   ans:1, exp:'Un estado absorbente cumple pᵢᵢ = 1: una vez que el sistema entra, permanece allí indefinidamente.'},
  {q:'La distribución estacionaria π satisface:',
   opts:['π = P·π','π = π·P','π = P²·π','πᵢ = 1 para todo i'],
   ans:1, exp:'La distribución estacionaria satisface π = π·P (vector fila multiplicado por la matriz), sujeto a ∑πᵢ = 1.'},
  {q:'¿Qué tipo de estado tiene período = 1?',
   opts:['Periódico','Transitorio','Aperiódico','Absorbente'],
   ans:2, exp:'Un estado es aperiódico cuando el MCD de todos los tiempos posibles de retorno es 1. Si el período = 1, el estado es aperiódico.'},
  {q:'¿Cuál es la fórmula para obtener probabilidades en n pasos?',
   opts:['P(n) = n·P','P(n) = Pⁿ','P(n) = P + n','P(n) = √P·n'],
   ans:1, exp:'Las probabilidades de transición en n pasos se obtienen elevando la matriz de transición a la potencia n: P⁽ⁿ⁾ = Pⁿ.'},
  {q:'Una cadena de Markov ergódica es:',
   opts:['Absorbente y periódica','Irreducible, recurrente positiva y aperiódica','Transitoria y aperiódica','Absorbente y transitoria'],
   ans:1, exp:'Una cadena ergódica es irreducible (todos los estados se comunican), recurrente positiva (tiempo medio de retorno finito) y aperiódica (período 1). Tiene distribución estacionaria única.'},
  {q:'Si la distribución inicial es π₀ y la matriz es P, ¿cuál es la distribución después de 3 pasos?',
   opts:['π₀ + 3P','π₀ · P³','3 · π₀P','π₀³ · P'],
   ans:1, exp:'Partiendo del vector de distribución inicial π₀, la distribución después de n pasos es π₀·Pⁿ. Para n=3: π₀·P³.'},
];

function initQuiz() {
  const container=document.getElementById('quizContainer');
  if(!container) return;
  let answered=0, correct=0;

  quizData.forEach((q,qi)=>{
    const div=document.createElement('div');
    div.className='quiz-question';
    div.innerHTML=`<div class="quiz-q-number">Pregunta ${qi+1} de ${quizData.length}</div>
      <div class="quiz-q-text">${q.q}</div>
      <div class="quiz-options">
        ${q.opts.map((opt,oi)=>`<div class="quiz-option" data-q="${qi}" data-o="${oi}">${opt}</div>`).join('')}
      </div>
      <div class="quiz-feedback" id="qfb_${qi}" style="display:none"></div>`;
    container.appendChild(div);

    div.querySelectorAll('.quiz-option').forEach(btn=>{
      btn.addEventListener('click',()=>{
        if(btn.classList.contains('disabled')) return;
        const isCorrect=+btn.dataset.o===q.ans;
        div.querySelectorAll('.quiz-option').forEach(b=>{
          b.classList.add('disabled');
          if(+b.dataset.o===q.ans) b.classList.add('correct');
        });
        if(!isCorrect) btn.classList.add('wrong');
        const fb=document.getElementById(`qfb_${qi}`);
        fb.style.display='block';
        fb.className='quiz-feedback '+(isCorrect?'correct':'wrong');
        fb.textContent=(isCorrect?'✓ Correcto! ':'✗ Incorrecto. ')+q.exp;
        answered++;
        if(isCorrect) correct++;
        if(answered===quizData.length){
          const score=document.createElement('div');
          score.className='quiz-score';
          score.innerHTML=`<div class="quiz-score-num">${correct}/${quizData.length}</div>
            <p style="color:var(--text2)">
              ${correct===quizData.length?'¡Perfecto! Dominas las Cadenas de Markov 🎉':
                correct>=quizData.length*.7?'¡Muy bien! Sólida comprensión del tema 👍':
                '¡Buen intento! Repasa los conceptos y vuelve a intentarlo 📚'}
            </p>`;
          container.appendChild(score);
        }
      });
    });
  });
}

// ─── MÓDULO: GLOSARIO ─────────────────────────────────────────────────────────

const glossaryTerms = [
  {term:'Cadena de Markov', def:'Proceso estocástico de tiempo discreto con la propiedad de que el estado futuro depende únicamente del estado presente.'},
  {term:'Propiedad de Markov', def:'Propiedad sin memoria: P(Xₙ₊₁=j|Xₙ=i, Xₙ₋₁,…) = P(Xₙ₊₁=j|Xₙ=i). El pasado no importa.'},
  {term:'Proceso Estocástico', def:'Colección de variables aleatorias {Xₜ}ₜ indexadas por el tiempo, que describen la evolución aleatoria de un sistema.'},
  {term:'Espacio de Estados', def:'Conjunto de todos los posibles valores que puede tomar el proceso. En tiempo discreto, suele ser finito o numerable.'},
  {term:'Probabilidad de Transición', def:'Pᵢⱼ = P(Xₙ₊₁=j|Xₙ=i): la probabilidad de pasar del estado i al estado j en un solo paso.'},
  {term:'Matriz de Transición', def:'Matriz P = [pᵢⱼ] que contiene todas las probabilidades de transición. Sus filas suman 1 (matriz estocástica).'},
  {term:'Cadena Homogénea', def:'Cadena de Markov cuyas probabilidades de transición no cambian en el tiempo: pᵢⱼ(n) = pᵢⱼ para todo n.'},
  {term:'Estado Absorbente', def:'Estado i con pᵢᵢ = 1: una vez alcanzado, el sistema permanece ahí indefinidamente.'},
  {term:'Estado Transitorio', def:'Estado del que el sistema puede salir sin garantía de retorno. La probabilidad de regresar es estrictamente menor que 1.'},
  {term:'Estado Recurrente', def:'Estado al que el sistema regresa con probabilidad 1. La probabilidad de retorno es exactamente 1.'},
  {term:'Recurrente Positivo', def:'Estado recurrente con tiempo medio de retorno finito. Base de la existencia de distribución estacionaria.'},
  {term:'Recurrente Nulo', def:'Estado recurrente pero con tiempo medio de retorno infinito. No puede existir en espacios de estados finitos.'},
  {term:'Estado Ergódico', def:'Estado recurrente positivo y aperiódico. Las cadenas ergódicas tienen distribución estacionaria única.'},
  {term:'Período', def:'d(i) = mcd{n ≥ 1: pᵢᵢ⁽ⁿ⁾ > 0}. Si d(i)=1, el estado es aperiódico. Si d(i)>1, el estado es periódico.'},
  {term:'Estado Aperiódico', def:'Estado con período d(i) = 1. El sistema puede regresar en cualquier número de pasos.'},
  {term:'Distribución Estacionaria', def:'Vector π ≥ 0 tal que π = πP y ∑πᵢ = 1. Describe la distribución límite del proceso a largo plazo.'},
  {term:'Distribución Límite', def:'La distribución a la que converge el sistema cuando n → ∞: lim Pⁿ = matriz con filas iguales a π.'},
  {term:'Cadena Irreducible', def:'Cadena donde todos los estados se comunican entre sí: desde cualquier estado se puede alcanzar cualquier otro.'},
  {term:'Comunicación de Estados', def:'Los estados i y j se comunican (i ↔ j) si pᵢⱼ⁽ⁿ⁾ > 0 y pⱼᵢ⁽ᵐ⁾ > 0 para algún n, m.'},
  {term:'Ecuación de Chapman-Kolmogorov', def:'pᵢⱼ⁽ᵐ⁺ⁿ⁾ = ∑ₖ pᵢₖ⁽ᵐ⁾ · pₖⱼ⁽ⁿ⁾. Permite calcular probabilidades en múltiples pasos.'},
  {term:'Cadena Ergódica', def:'Cadena irreducible, recurrente positiva y aperiódica. Tiene distribución estacionaria única a la que converge desde cualquier estado inicial.'},
  {term:'Tiempo Medio de Retorno', def:'μᵢ = E[tiempo para regresar a i | X₀=i]. Para estados recurrentes positivos, μᵢ = 1/πᵢ < ∞.'},
  {term:'Matriz Estocástica', def:'Matriz con entradas no negativas cuyas filas suman 1. Toda matriz de transición de una cadena de Markov es estocástica.'},
  {term:'Clase de Comunicación', def:'Subconjunto maximal de estados que se comunican entre sí. Una cadena irreducible tiene una sola clase.'},
];

function initGlossary() {
  const grid=document.getElementById('glossaryGrid');
  const search=document.getElementById('glossarySearch');
  if(!grid) return;

  grid.innerHTML=glossaryTerms.map(({term,def})=>
    `<div class="glossary-card">
      <div class="glossary-term">${term}</div>
      <div class="glossary-def">${def}</div>
    </div>`
  ).join('');

  search.addEventListener('input',()=>{
    const q=search.value.toLowerCase();
    grid.querySelectorAll('.glossary-card').forEach((card,i)=>{
      const t=glossaryTerms[i];
      const match=t.term.toLowerCase().includes(q)||t.def.toLowerCase().includes(q);
      card.classList.toggle('hidden',!match);
    });
  });
}

// ─── MÓDULO: NAVEGACIÓN ────────────────────────────────────────────────────────

function initNav() {
  const navbar=document.getElementById('navbar');
  const toggle=document.getElementById('navToggle');
  const links=document.querySelector('.nav-links');
  if(!navbar) return;

  window.addEventListener('scroll',()=>{
    navbar.classList.toggle('scrolled',window.scrollY>50);
  });

  toggle.addEventListener('click',()=>links.classList.toggle('open'));
  links.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>links.classList.remove('open')));
}

// ─── MÓDULO: REVEAL ANIMATIONS ────────────────────────────────────────────────

function initReveal() {
  document.querySelectorAll('.section-title, .section-intro, .concept-grid, .states-layout, .matrix-layout, .stationary-layout, .simulator-layout, .apps-grid, .quiz-question, .glossary-card').forEach(el=>{
    el.classList.add('reveal');
  });
  const observer=new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('visible'); });
  },{threshold:.1});
  document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
}

// ─── INIT ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initHeroCanvas();
  initPathDemo();
  initStatesDiagram();
  MatrixModule.init();
  StationaryModule.init();
  Simulator.init();
  NStepsModule.init();
  initApplications();
  initQuiz();
  initGlossary();
  initNav();
  initReveal();

  // Sync matrix → diagram on load
  setTimeout(()=>{
    MatrixModule.randomize();
  }, 500);
});