// -------- Elementos --------
const exprInput = document.getElementById('expr');
const btnClear = document.getElementById('btnClear');
const btnDel = document.getElementById('btnDel');
const btnCalc = document.getElementById('btnCalc');
const limA = document.getElementById('limA');
const limB = document.getElementById('limB');
const nSamplesInput = document.getElementById('nSamples');
const resMain = document.getElementById('resMain');
const resDetail = document.getElementById('resDetail');

// -------- Teclado --------
document.querySelectorAll('.tecla').forEach(btn => {
  btn.addEventListener('click', () => {
    const v = btn.getAttribute('data-val');
    if (v) insertAtCursor(exprInput, v);
    exprInput.focus();
  });
});

btnClear.addEventListener('click', () => {
  exprInput.value = '';
  exprInput.focus();
});
btnDel.addEventListener('click', () => {
  backspaceAtCursor(exprInput);
  exprInput.focus();
});
exprInput.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter') {
    ev.preventDefault();
    doCalculate();
  }
});
btnCalc.addEventListener('click', doCalculate);

// -------- Helpers --------
function insertAtCursor(input, text) {
  const start = input.selectionStart, end = input.selectionEnd;
  input.value = input.value.slice(0, start) + text + input.value.slice(end);
  input.setSelectionRange(start + text.length, start + text.length);
}

function backspaceAtCursor(input) {
  const start = input.selectionStart, end = input.selectionEnd, val = input.value;
  if (start === end && start > 0) {
    input.value = val.slice(0, start - 1) + val.slice(end);
    input.setSelectionRange(start - 1, start - 1);
  } else {
    input.value = val.slice(0, start) + val.slice(end);
  }
}

// -------- Sanitizar y compilar --------
function sanitizeExpression(raw) {
  if (!raw) return '';
  let s = raw.replace(/÷/g, '/').replace(/×/g, '*').replace(/–/g, '-');
  s = s.replace(/√\s*\(?/g, 'sqrt(');
  s = s.replace(/\bln\s*\(/g, 'log(');
  return s;
}

function compileFunction(expr) {
  const s = sanitizeExpression(expr);
  const node = math.parse(s);
  return node.compile();
}

// -------- Simpson --------
function simpsonIntegral(f, a, b, n) {
  if (n % 2 === 1) n++;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) {
    const x = a + i * h;
    s += (i % 2 === 0 ? 2 : 4) * f(x);
  }
  return (h / 3) * s;
}

// -------- Calcular --------
function doCalculate() {
  const expr = exprInput.value.trim();
  if (!expr) {
    alert('Ingrese una función f(x).');
    return;
  }

  const a = parseFloat(limA.value), b = parseFloat(limB.value);
  if (isNaN(a) || isNaN(b) || a === b) {
    alert('Límites inválidos.');
    return;
  }

  let n = parseInt(nSamplesInput.value) || 300;
  if (n < 10) n = 10;

  let compiled;
  try {
    compiled = compileFunction(expr);
  } catch (err) {
    resMain.innerHTML = `∫[${a},${b}] f(x) dx = ERROR`;
    resDetail.textContent = err.message;
    return;
  }

  const f = (x) => compiled.evaluate({ x: x, pi: Math.PI, e: Math.E });

  const left = Math.min(a, b), right = Math.max(a, b);
  let area = simpsonIntegral(f, left, right, n);
  if (a > b) area = -area;

  const g = (x) => Math.pow(f(x), 2);
  let volume = simpsonIntegral(g, left, right, n) * Math.PI;
  if (a > b) volume = -volume;

  resMain.innerHTML = `∫[${a},${b}] ${expr} dx = <strong>${area.toFixed(6)}</strong>`;
  resDetail.textContent = `Volumen rotado (eje X): ${volume.toFixed(6)}`;

  // -------- Generar X extendido --------
  const padding = (right - left) * 0.5;  // 50% más a cada lado
  const xStart = left - padding;
  const xEnd = right + padding;

  const xs = [], ys = [];
  const samples = Math.max(200, n);
  for (let i = 0; i <= samples; i++) {
    const x = xStart + (xEnd - xStart) * i / samples;
    xs.push(x);
    ys.push(f(x));
  }

  plot2DFromData(xs, ys, left, right, f);
  plot3DFromData(xs, ys);
}

// -------- Gráficas modo oscuro + líneas verticales --------
function plot2DFromData(xs, ys, a, b, f) {
  const traceFunc = {
    x: xs,
    y: ys,
    mode: 'lines',
    name: 'f(x)',
    line: { color: '#00ffff', width: 3 }
  };

  // Área bajo la curva
  const xsArea = [a], ysArea = [0];
  for (let i = 0; i < xs.length; i++) {
    if (xs[i] >= a && xs[i] <= b) {
      xsArea.push(xs[i]);
      ysArea.push(ys[i]);
    }
  }
  xsArea.push(b); ysArea.push(0);

  const traceArea = {
    x: xsArea,
    y: ysArea,
    fill: 'toself',
    fillcolor: 'rgba(0,191,255,0.3)',
    line: { width: 0 },
    name: 'Área'
  };

  // 🔹 Líneas verticales delimitadoras (a y b)
// 🔹 Líneas verticales delimitadoras (a y b)
const lineaA = {
  x: [a, a],
  y: [0, f(a)],
  mode: 'lines',
  line: { color: '#00ffff', width: 3 },
  name: `x₁ = ${a}` // ← usa subíndice ₁
};

const lineaB = {
  x: [b, b],
  y: [0, f(b)],
  mode: 'lines',
  line: { color: '#00ffff', width: 3 },
  name: `x₂ = ${b}` // ← usa subíndice ₂
};

  Plotly.newPlot('plot2d', [traceArea, traceFunc, lineaA, lineaB], {
    margin: { t: 30, r: 10, l: 40, b: 40 },
    xaxis: { title: 'x', autorange: true, color: '#fff', gridcolor: '#444' },
    yaxis: { title: 'f(x)', autorange: true, color: '#fff', gridcolor: '#444' },
    paper_bgcolor: '#1a1a1a',
    plot_bgcolor: '#1a1a1a',
    legend: { font: { color: '#fff', family: 'Arial', size: 12 } }
  });
}

function plot3DFromData(xs, ys) {
  const nTheta = 50;
  const theta = Array.from({ length: nTheta + 1 }, (_, i) => i / nTheta * 2 * Math.PI);

  const X = [], Y = [], Z = [];
  for (let i = 0; i < xs.length; i++) {
    const r = Math.abs(ys[i]);
    const rowX = [], rowY = [], rowZ = [];
    for (const t of theta) {
      rowX.push(xs[i]);
      rowY.push(r * Math.cos(t));
      rowZ.push(r * Math.sin(t));
    }
    X.push(rowX); Y.push(rowY); Z.push(rowZ);
  }

  Plotly.newPlot('plot3d', [{
    type: 'surface',
    x: X,
    y: Y,
    z: Z,
    colorscale: [[0, '#00bfff'], [1, '#ffd700']],
    showscale: false
  }], {
    scene: {
      xaxis: { title: 'x', color: '#fff' },
      yaxis: { title: 'y', color: '#fff' },
      zaxis: { title: 'z', color: '#fff' },
      camera: { eye: { x: 1.5, y: 1.5, z: 0.8 } }
    },
    margin: { l: 0, r: 0, b: 0, t: 0 },
    paper_bgcolor: 'rgba(0,0,0,0)', 
    plot_bgcolor: 'rgba(0,0,0,0)'
  });
}

// -------- Inicial --------
window.addEventListener('load', () => {
  exprInput.value = 'x';
  doCalculate();
});
