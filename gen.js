// ตัวสร้างชุดข้อสอบ ก.พ. ภาค ก (เสมือนจริง) — สร้างแบบคงที่ตามปี (seeded)
(function () {
  "use strict";

  // ---------- Random แบบกำหนด seed ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function makeRng(seed) {
    const f = mulberry32(seed);
    const R = {
      f,
      int: (a, b) => a + Math.floor(f() * (b - a + 1)),
      pick: (arr) => arr[Math.floor(f() * arr.length)],
      shuffle: (arr) => {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(f() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      },
      sample: (arr, n) => R.shuffle(arr).slice(0, n),
    };
    return R;
  }

  const fmt = (n) => Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });

  // สร้างตัวลวงตัวเลข
  function numDistractors(R, ans, spread, count = 3, opts = {}) {
    const set = new Set([ans]);
    const out = [];
    const cands = [];
    for (let k = 1; k <= 6; k++) { cands.push(ans + k * spread, ans - k * spread); }
    (opts.extra || []).forEach((x) => cands.unshift(x));
    const ex = opts.extra || [];
    const order = [...ex, ...R.shuffle(cands.slice(ex.length))];
    for (const c of order) {
      if (out.length >= count) break;
      if (set.has(c)) continue;
      if (!opts.allowNeg && c <= 0) continue;
      if (!Number.isFinite(c)) continue;
      set.add(c); out.push(c);
    }
    return out;
  }

  function mcq(R, base, correct, wrongs, fixed) {
    // base: {sec, cat, q, exp, passage?}
    let opts = [correct, ...wrongs];
    let ans = 0;
    if (!fixed) {
      const idx = R.shuffle([0, 1, 2, 3].slice(0, opts.length));
      opts = idx.map((i) => [correct, ...wrongs][i]);
      ans = idx.indexOf(0);
    }
    return Object.assign({}, base, { opts: opts.map(String), ans });
  }

  // ================= อนุกรม =================
  const SERIES_TYPES = [
    function arith(R) {
      const a = R.int(2, 40), d = R.pick([3, 4, 6, 7, 8, 9, 11, 12, 13]) * (R.f() < 0.25 ? -1 : 1);
      const s = [0, 1, 2, 3, 4].map((i) => a + i * d + (d < 0 ? 80 : 0));
      return { s, ans: s[4] + d, exp: `เป็นอนุกรมเลขคณิต ${d > 0 ? "เพิ่มขึ้น" : "ลดลง"}ทีละ ${Math.abs(d)} คงที่ ดังนั้นตัวถัดไปคือ ${s[4]} ${d > 0 ? "+" : "−"} ${Math.abs(d)} = ${s[4] + d}`, spread: Math.abs(d) > 3 ? 2 : 1 };
    },
    function secondDiff(R) {
      const a = R.int(1, 25), d0 = R.int(1, 6), k = R.int(2, 4);
      const s = [a]; const diffs = [];
      for (let i = 0; i < 5; i++) { diffs.push(d0 + i * k); s.push(s[i] + d0 + i * k); }
      const ans = s[5] + d0 + 5 * k;
      return { s, ans, exp: `ผลต่างของแต่ละพจน์คือ ${diffs.join(", ")} ซึ่งเพิ่มขึ้นทีละ ${k} ผลต่างถัดไปคือ ${d0 + 5 * k} จึงได้ ${s[5]} + ${d0 + 5 * k} = ${ans}`, spread: k };
    },
    function geometric(R) {
      const a = R.int(1, 6), r = R.pick([2, 3]);
      const s = [0, 1, 2, 3, 4].map((i) => a * r ** i);
      return { s, ans: s[4] * r, exp: `แต่ละพจน์คูณด้วย ${r} ดังนั้น ${s[4]} × ${r} = ${s[4] * r}`, spread: a * r };
    },
    function interleave(R) {
      const a = R.int(1, 15), d1 = R.int(2, 6), b = R.int(20, 60), d2 = R.pick([-3, -2, 3, 5, 7]);
      const s = [];
      for (let i = 0; i < 7; i++) s.push(i % 2 === 0 ? a + (i / 2) * d1 : b + ((i - 1) / 2) * d2);
      const ans = b + 3 * d2;
      return { s, ans, exp: `เป็นอนุกรมสองชุดสลับกัน: ตำแหน่งคี่ ${a}, ${a + d1}, ${a + 2 * d1}, ... (เพิ่มทีละ ${d1}) และตำแหน่งคู่ ${b}, ${b + d2}, ${b + 2 * d2}, ... (เปลี่ยนทีละ ${d2}) ตัวถัดไปอยู่ชุดตำแหน่งคู่ = ${ans}`, spread: 2 };
    },
    function fib(R) {
      const a = R.int(1, 6), b = R.int(2, 8);
      const s = [a, b];
      for (let i = 2; i < 7; i++) s.push(s[i - 1] + s[i - 2]);
      return { s, ans: s[5] + s[6], exp: `แต่ละพจน์เท่ากับผลบวกของสองพจน์ก่อนหน้า ดังนั้น ${s[5]} + ${s[6]} = ${s[5] + s[6]}`, spread: R.int(2, 4) };
    },
    function mulAdd(R) {
      const a = R.int(1, 6), c = R.pick([1, 2, 3, -1]);
      const s = [a];
      for (let i = 1; i < 5; i++) s.push(s[i - 1] * 2 + c);
      const ans = s[4] * 2 + c;
      return { s, ans, exp: `แต่ละพจน์ = พจน์ก่อนหน้า × 2 ${c >= 0 ? "+ " + c : "− " + -c} ดังนั้น ${s[4]} × 2 ${c >= 0 ? "+ " + c : "− " + -c} = ${ans}`, spread: 2 };
    },
    function squares(R) {
      const n0 = R.int(1, 6), c = R.pick([0, 1, 2, -1, 3]);
      const s = [0, 1, 2, 3, 4].map((i) => (n0 + i) ** 2 + c);
      const n = n0 + 5;
      return { s, ans: n * n + c, exp: `พจน์ทั้งหมดอยู่ในรูป n² ${c === 0 ? "" : (c > 0 ? "+ " + c : "− " + -c)} โดย n = ${n0}, ${n0 + 1}, ... ตัวถัดไปคือ ${n}² ${c === 0 ? "" : (c > 0 ? "+ " + c : "− " + -c)} = ${n * n + c}`, spread: 2 };
    },
    function altOps(R) {
      const a = R.int(1, 9), m = R.pick([2, 3]), p = R.int(2, 7);
      const s = [a];
      for (let i = 1; i < 6; i++) s.push(i % 2 === 1 ? s[i - 1] * m : s[i - 1] + p);
      const ans = s[5] * m;
      return { s, ans, exp: `สลับการกระทำ: × ${m}, + ${p}, × ${m}, + ${p}, ... ตัวถัดไปคือ ${s[5]} × ${m} = ${ans}`, spread: p };
    },
  ];

  function genSeries(R, k) {
    const type = SERIES_TYPES[k % SERIES_TYPES.length];
    const r = type(R);
    const ws = numDistractors(R, r.ans, r.spread);
    return mcq(R, { sec: "analytic", cat: "อนุกรม", q: `จงหาตัวเลขที่หายไป\n${r.s.join(",  ")},  ?`, exp: r.exp }, r.ans, ws);
  }

  // ================= โจทย์คณิตศาสตร์ =================
  const MATH = [
    function discount(R) {
      const P = R.int(3, 15) * 200, d1 = R.pick([10, 20, 25]), d2 = R.pick([10, 20]);
      const ans = (P * (100 - d1) * (100 - d2)) / 10000;
      const wrong1 = (P * (100 - d1 - d2)) / 100;
      return { q: `สินค้าชิ้นหนึ่งติดราคา ${fmt(P)} บาท ร้านลดราคา ${d1}% แล้วลดเพิ่มอีก ${d2}% จากราคาที่ลดแล้ว ผู้ซื้อต้องจ่ายเงินกี่บาท`, ans, w: [wrong1], unit: "บาท", spread: 40, exp: `${fmt(P)} × ${(100 - d1) / 100} = ${fmt(P * (100 - d1) / 100)} แล้ว × ${(100 - d2) / 100} = ${fmt(ans)} บาท (ไม่ใช่ลดรวม ${d1 + d2}%)` };
    },
    function profit(R) {
      const C = R.int(4, 40) * 100, p = R.pick([10, 15, 20, 25, 30, 40]);
      const ans = (C * (100 + p)) / 100;
      return { q: `พ่อค้าซื้อสินค้ามาในราคา ${fmt(C)} บาท ต้องการกำไร ${p}% ของราคาทุน ต้องขายสินค้านี้ในราคากี่บาท`, ans, unit: "บาท", spread: C / 20, exp: `ราคาขาย = ทุน × (100 + ${p})/100 = ${fmt(C)} × ${(100 + p) / 100} = ${fmt(ans)} บาท` };
    },
    function work(R) {
      const [a, b] = R.pick([[3, 6], [4, 12], [6, 12], [10, 15], [12, 24], [20, 30], [6, 30], [12, 60], [8, 24], [15, 30]]);
      const ans = (a * b) / (a + b);
      return { q: `นาย ก. ทำงานชิ้นหนึ่งเสร็จใน ${a} วัน นาย ข. ทำงานชิ้นเดียวกันเสร็จใน ${b} วัน ถ้าทั้งสองช่วยกันทำ จะเสร็จในกี่วัน`, ans, unit: "วัน", spread: 1, w: [(a + b) / 2], exp: `ใน 1 วันทำงานรวมกันได้ 1/${a} + 1/${b} = ${a + b}/${a * b} ของงาน จึงใช้เวลา ${a * b}/${a + b} = ${ans} วัน` };
    },
    function avgSpeed(R) {
      const [v1, v2] = R.pick([[40, 60], [30, 60], [60, 90], [20, 30], [60, 120], [45, 90], [36, 45]]);
      const ans = (2 * v1 * v2) / (v1 + v2);
      return { q: `ขับรถจากเมือง ก ไปเมือง ข ด้วยอัตราเร็ว ${v1} กม./ชม. และขับกลับด้วยอัตราเร็ว ${v2} กม./ชม. อัตราเร็วเฉลี่ยตลอดการเดินทางไปกลับเป็นเท่าใด (กม./ชม.)`, ans, unit: "กม./ชม.", spread: 2, w: [(v1 + v2) / 2], exp: `อัตราเร็วเฉลี่ยไป-กลับระยะทางเท่ากัน = 2v₁v₂/(v₁+v₂) = 2×${v1}×${v2}/${v1 + v2} = ${ans} กม./ชม. (ไม่ใช่ค่าเฉลี่ยธรรมดา ${(v1 + v2) / 2})` };
    },
    function age(R) {
      for (let t = 0; t < 500; t++) {
        const s = R.int(4, 15), k = R.int(3, 6), n = R.int(2, 15);
        const f = k * s;
        if ((f + n) % (s + n) === 0) {
          const m = (f + n) / (s + n);
          if (m >= 2 && m < k) {
            return { q: `ปัจจุบันพ่อมีอายุเป็น ${k} เท่าของอายุลูก อีก ${n} ปีข้างหน้า พ่อจะมีอายุเป็น ${m} เท่าของอายุลูก ปัจจุบันลูกอายุกี่ปี`, ans: s, unit: "ปี", spread: 1, exp: `ให้ลูกอายุ x ปี พ่ออายุ ${k}x ปี → ${k}x + ${n} = ${m}(x + ${n}) → ${k - m === 1 ? "" : k - m}x = ${m * n - n} → x = ${s} ปี` };
          }
        }
      }
      return null;
    },
    function average(R) {
      const A = R.int(20, 70), j = R.int(1, 5), x = A + 6 * j;
      return { q: `ค่าเฉลี่ยของจำนวน 5 จำนวนเท่ากับ ${A} เมื่อเพิ่มจำนวนอีก 1 จำนวน ค่าเฉลี่ยกลายเป็น ${A + j} จำนวนที่เพิ่มเข้ามาคือเท่าใด`, ans: x, spread: j > 2 ? 3 : 2, w: [A + j], exp: `ผลรวมเดิม = 5 × ${A} = ${5 * A} ผลรวมใหม่ = 6 × ${A + j} = ${6 * (A + j)} จำนวนที่เพิ่ม = ${6 * (A + j)} − ${5 * A} = ${x}` };
    },
    function interest(R) {
      const P = R.int(2, 20) * 10000, r = R.pick([2, 3, 4, 5]), t = R.int(2, 5);
      const ans = (P * r * t) / 100;
      return { q: `ฝากเงิน ${fmt(P)} บาท ได้ดอกเบี้ยแบบธรรมดา (ไม่ทบต้น) ${r}% ต่อปี เมื่อครบ ${t} ปี จะได้ดอกเบี้ยรวมกี่บาท`, ans, unit: "บาท", spread: P / 100, w: [(P * r) / 100], exp: `ดอกเบี้ย = เงินต้น × อัตรา × เวลา = ${fmt(P)} × ${r}/100 × ${t} = ${fmt(ans)} บาท` };
    },
    function ratio(R) {
      const a = R.int(1, 5), b = R.int(2, 6), c = R.int(1, 5), u = R.int(2, 9) * 100;
      const total = (a + b + c) * u;
      return { q: `แบ่งเงิน ${fmt(total)} บาท ให้ ก : ข : ค ในอัตราส่วน ${a} : ${b} : ${c} ข จะได้รับเงินกี่บาท`, ans: b * u, unit: "บาท", spread: u, exp: `รวมส่วน = ${a + b + c} ส่วน ส่วนละ ${fmt(total)} ÷ ${a + b + c} = ${fmt(u)} บาท ข ได้ ${b} ส่วน = ${fmt(b * u)} บาท` };
    },
    function upDown(R) {
      const x = R.pick([10, 20, 30, 40, 50]);
      const net = (x * x) / 100;
      return { str: true, q: `สินค้าชิ้นหนึ่งขึ้นราคา ${x}% ต่อมาลดราคาลง ${x}% จากราคาใหม่ ราคาสุดท้ายเทียบกับราคาเดิมเป็นอย่างไร`, ans: `ลดลง ${net}%`, w: ["เท่าเดิม", `ลดลง ${x / 5}%`, `เพิ่มขึ้น ${net}%`].map(s=>s===`ลดลง ${net}%`?`ลดลง ${net*2}%`:s), exp: `สมมุติราคาเดิม 100 → ขึ้น ${x}% = ${100 + x} → ลด ${x}% = ${100 + x} × ${(100 - x) / 100} = ${(100 + x) * (100 - x) / 100} จึงลดลง ${net}%` };
    },
    function evens(R) {
      const n = R.int(5, 40) * 2, S = 3 * n + 6;
      return { q: `จำนวนคู่ 3 จำนวนเรียงติดกัน มีผลบวกเท่ากับ ${S} จำนวนที่มากที่สุดคือเท่าใด`, ans: n + 4, spread: 2, w: [n + 2], exp: `ให้จำนวนคู่เป็น x, x+2, x+4 → 3x + 6 = ${S} → x = ${n} จำนวนที่มากที่สุดคือ ${n + 4}` };
    },
  ];

  function genMath(R, k) {
    let r = MATH[k % MATH.length](R);
    if (!r) r = MATH[0](R);
    const base = { sec: "analytic", cat: "คณิตศาสตร์", q: r.q, exp: r.exp };
    if (r.str) return mcq(R, base, r.ans, r.w);
    const sp = Math.max(1, Math.round(r.spread));
    const ws = numDistractors(R, r.ans, sp, 3, { extra: (r.w || []).filter((x) => x !== r.ans) });
    const u = r.unit ? " " + r.unit : "";
    return mcq(R, base, fmt(r.ans) + u, ws.map((x) => fmt(x) + u));
  }

  // ================= ตารางข้อมูล =================
  function genTable(R, year) {
    const pool = ["กรมการปกครอง", "กรมสรรพากร", "กรมการจัดหางาน", "กรมควบคุมโรค", "กรมทางหลวง", "กรมป่าไม้", "กรมศุลกากร", "กรมพัฒนาชุมชน"];
    const names = R.sample(pool, 4);
    const years = [year - 4, year - 3, year - 2];
    const data = names.map(() => years.map(() => R.int(12, 95) * 10));
    const totals = () => data.map((r) => r.reduce((a, b) => a + b, 0));
    // ผลรวมแต่ละหน่วยงานต้องไม่ซ้ำ และปีแรก ≠ ปีสุดท้ายทุกแถว
    data.forEach((r) => { if (r[0] === r[2]) r[2] += 30; });
    let t = totals();
    while (new Set(t).size < 4) { data[R.int(0, 3)][1] += 10; t = totals(); }
    let html = `<div class="tbl-cap">ตาราง: จำนวนเรื่องร้องเรียนที่ได้รับ (เรื่อง) จำแนกตามหน่วยงาน ปี พ.ศ. ${years[0]}–${years[2]}</div><table class="data"><thead><tr><th>หน่วยงาน</th>${years.map((y) => `<th>${y}</th>`).join("")}</tr></thead><tbody>`;
    names.forEach((n, i) => { html += `<tr><td>${n}</td>${data[i].map((v) => `<td>${fmt(v)}</td>`).join("")}</tr>`; });
    html += "</tbody></table>";
    const base = { sec: "analytic", cat: "ตารางข้อมูล", passage: html, passageTitle: "ใช้ข้อมูลจากตารางต่อไปนี้ตอบคำถาม", group: "table" };
    const Q = (q, exp) => Object.assign({}, base, { q, exp });
    const qs = [];
    // 1 ผลรวม
    const i1 = R.int(0, 3), s1 = t[i1];
    qs.push(mcq(R, Q(`${names[i1]} ได้รับเรื่องร้องเรียนรวม 3 ปี กี่เรื่อง`, `${data[i1].map(fmt).join(" + ")} = ${fmt(s1)} เรื่อง`), fmt(s1), numDistractors(R, s1, 20).map(fmt)));
    // 2 สูงสุด
    const iMax = t.indexOf(Math.max(...t));
    qs.push(mcq(R, Q(`หน่วยงานใดได้รับเรื่องร้องเรียนรวม 3 ปีมากที่สุด`, `ผลรวม 3 ปี: ${names.map((n, i) => `${n} ${fmt(t[i])}`).join(", ")} → มากที่สุดคือ ${names[iMax]}`), names[iMax], names.filter((_, i) => i !== iMax)));
    // 3 ร้อยละการเปลี่ยนแปลง
    const i3 = (i1 + 1 + R.int(0, 2)) % 4;
    const v1 = data[i3][0], v3 = data[i3][2];
    const pct = Math.round(((v3 - v1) / v1) * 1000) / 10;
    const lab = (p) => (p >= 0 ? `เพิ่มขึ้นประมาณ ${fmt(Math.abs(p))}%` : `ลดลงประมาณ ${fmt(Math.abs(p))}%`);
    const cand = [-pct, Math.round(((v3 - v1) / v3) * 1000) / 10, pct + (pct >= 0 ? 7.5 : -7.5), pct / 2, pct * 2];
    const pwl = [...new Set(cand.map(lab))].filter((x) => x !== lab(pct)).slice(0, 3);
    qs.push(mcq(R, Q(`ปี ${years[2]} เทียบกับปี ${years[0]} จำนวนเรื่องร้องเรียนของ${names[i3]}เปลี่ยนแปลงอย่างไร`, `(${fmt(v3)} − ${fmt(v1)}) ÷ ${fmt(v1)} × 100 = ${fmt(pct)}% (ใช้ปี ${years[0]} เป็นฐาน)`), lab(pct), pwl));
    // 4 ค่าเฉลี่ยปีหนึ่ง
    const yi = R.int(0, 2);
    const ysum = data.reduce((a, r) => a + r[yi], 0), avg = ysum / 4;
    qs.push(mcq(R, Q(`ในปี ${years[yi]} ค่าเฉลี่ยของจำนวนเรื่องร้องเรียนต่อหน่วยงานเป็นเท่าใด`, `ผลรวมปี ${years[yi]} = ${data.map((r) => fmt(r[yi])).join(" + ")} = ${fmt(ysum)} หารด้วย 4 = ${fmt(avg)}`), fmt(avg), numDistractors(R, avg, 12.5).map(fmt)));
    // 5 ผลต่าง
    let a = R.int(0, 3), b = (a + 1 + R.int(0, 2)) % 4, yj = R.int(0, 2);
    if (data[a][yj] === data[b][yj]) data[b][yj] += 0; // ผลต่าง 0 ก็ยังถูกต้อง
    const hi = data[a][yj] >= data[b][yj] ? a : b, lo = hi === a ? b : a;
    const diff = data[hi][yj] - data[lo][yj];
    qs.push(mcq(R, Q(`ปี ${years[yj]} ${names[hi]} ได้รับเรื่องร้องเรียนมากกว่า${names[lo]}กี่เรื่อง`, `${fmt(data[hi][yj])} − ${fmt(data[lo][yj])} = ${fmt(diff)} เรื่อง`), fmt(diff), numDistractors(R, diff, 10).map(fmt)));
    return qs;
  }

  // ================= เงื่อนไขสัญลักษณ์ =================
  const OPS = { ">": [1, true], "≥": [1, false], "=": [0, false], "<": [-1, true], "≤": [-1, false] };
  const FLIP = { ">": "<", "≥": "≤", "=": "=", "<": ">", "≤": "≥" };
  const IMPLIES = { ">": [">", "≥"], "≥": ["≥"], "=": ["=", "≥", "≤"], "<": ["<", "≤"], "≤": ["≤"] };
  function derive(ops) {
    let dirs = new Set(), strict = false;
    ops.forEach((o) => { const [d, s] = OPS[o]; if (d !== 0) { dirs.add(d); if (s) strict = true; } });
    if (dirs.size > 1) return null;
    if (dirs.size === 0) return "=";
    const d = [...dirs][0];
    return d > 0 ? (strict ? ">" : "≥") : (strict ? "<" : "≤");
  }
  const COND_OPTS = ["ข้อสรุปที่ 1 ถูกเท่านั้น", "ข้อสรุปที่ 2 ถูกเท่านั้น", "ข้อสรุปทั้งสองข้อถูก", "ข้อสรุปทั้งสองข้อไม่ถูก (ผิดหรือสรุปแน่นอนไม่ได้)"];
  function answerIdx(t1, t2) { return t1 && t2 ? 2 : t1 ? 0 : t2 ? 1 : 3; }

  function genSymbol(R, k) {
    const letters = R.sample(["A", "B", "C", "D", "E", "F", "G", "H", "K", "M", "P", "Q", "R", "S", "T"], 5);
    const n = k % 2 === 0 ? 4 : 5;
    const L = letters.slice(0, n);
    const opsPool = [">", "≥", "=", "<", "≤", ">", "≥", "<", "≤"];
    let ops;
    // ให้ส่วนใหญ่มีทิศทางเดียว เพื่อให้สรุปได้
    const mainDir = R.pick([">", "<"]);
    ops = [];
    for (let i = 0; i < n - 1; i++) {
      if (R.f() < 0.12) ops.push(R.pick(opsPool));
      else ops.push(mainDir === ">" ? R.pick([">", "≥", "=", ">"]) : R.pick(["<", "≤", "=", "<"]));
    }
    const premises = ops.map((o, i) => (R.f() < 0.4 ? `${L[i + 1]} ${FLIP[o]} ${L[i]}` : `${L[i]} ${o} ${L[i + 1]}`));
    const shown = R.shuffle(premises);
    const makeConc = (wantTrue) => {
      let i, j, d, tries = 0;
      do {
        i = R.int(0, n - 2); j = R.int(i + 1, n - 1);
        if (j - i < 2 && R.f() < 0.7) { i = R.int(0, n - 3); j = R.int(i + 2, n - 1); }
        d = derive(ops.slice(i, j));
      } while (wantTrue && !d && ++tries < 25);
      let stated;
      if (d && wantTrue) stated = R.pick(IMPLIES[d]);
      else {
        const not = Object.keys(OPS).filter((o) => !d || !IMPLIES[d].includes(o));
        stated = R.pick(not);
      }
      const truth = !!d && IMPLIES[d].includes(stated);
      const swap = R.f() < 0.4;
      const text = swap ? `${L[j]} ${FLIP[stated]} ${L[i]}` : `${L[i]} ${stated} ${L[j]}`;
      const why = d ? `จากเงื่อนไขได้ ${L[i]} ${d} ${L[j]} ดังนั้น "${text}" ${truth ? "ถูก" : "ไม่ถูก"}` : `ความสัมพันธ์ระหว่าง ${L[i]} กับ ${L[j]} มีทั้งทิศมากกว่าและน้อยกว่าปนกัน จึงสรุปแน่นอนไม่ได้ → "${text}" ไม่ถูก`;
      return { text, truth, why };
    };
    const c1 = makeConc(R.f() < 0.55), c2 = makeConc(R.f() < 0.55);
    const chain = L.map((x, i) => (i < n - 1 ? `${x} ${ops[i]} ` : x)).join("");
    return {
      sec: "analytic", cat: "เงื่อนไขสัญลักษณ์",
      q: `กำหนดให้\n${shown.join(" ,  ")}\n\nข้อสรุปที่ 1:  ${c1.text}\nข้อสรุปที่ 2:  ${c2.text}`,
      opts: COND_OPTS.slice(), ans: answerIdx(c1.truth, c2.truth),
      exp: `เรียงเงื่อนไขต่อกันได้: ${chain}\n• ข้อสรุปที่ 1: ${c1.why}\n• ข้อสรุปที่ 2: ${c2.why}`,
    };
  }

  // ================= เงื่อนไขภาษา =================
  const GROUPS = [["นักกีฬา", "คนแข็งแรง", "คนมีวินัย"], ["ข้าราชการ", "คนซื่อสัตย์", "คนน่าเชื่อถือ"], ["นักดนตรี", "ศิลปิน", "คนมีจินตนาการ"], ["นักเรียน", "คนขยัน", "คนตรงต่อเวลา"], ["แพทย์", "คนเสียสละ", "คนใจดี"], ["ชาวนา", "คนอดทน", "คนประหยัด"], ["นักเขียน", "คนช่างคิด", "คนรักการอ่าน"], ["วิศวกร", "คนละเอียดรอบคอบ", "คนเก่งคำนวณ"]];
  const S = {
    ALL: (x, y) => `${x}ทุกคนเป็น${y}`,
    NO: (x, y) => `ไม่มี${x}คนใดเป็น${y}`,
    SOME: (x, y) => `${x}บางคนเป็น${y}`,
    SOMENOT: (x, y) => `${x}บางคนไม่เป็น${y}`,
  };
  const SYL = [
    { p: [["ALL", "X", "Y"], ["ALL", "Y", "Z"]], c: [[["ALL", "X", "Z"], true], [["ALL", "Z", "X"], false], [["SOMENOT", "X", "Z"], false], [["NO", "X", "Z"], false]] },
    { p: [["ALL", "X", "Y"], ["NO", "Y", "Z"]], c: [[["NO", "X", "Z"], true], [["SOME", "X", "Z"], false], [["NO", "Z", "X"], true], [["ALL", "X", "Z"], false]] },
    { p: [["SOME", "X", "Y"], ["ALL", "Y", "Z"]], c: [[["SOME", "X", "Z"], true], [["ALL", "X", "Z"], false], [["SOME", "Z", "X"], true], [["NO", "X", "Z"], false]] },
    { p: [["ALL", "X", "Y"], ["SOME", "Y", "Z"]], c: [[["SOME", "X", "Z"], false], [["ALL", "X", "Z"], false], [["SOME", "Z", "Y"], true], [["NO", "X", "Z"], false]] },
    { p: [["NO", "X", "Y"], ["ALL", "Z", "Y"]], c: [[["NO", "Z", "X"], true], [["SOME", "X", "Z"], false], [["NO", "X", "Z"], true], [["ALL", "Z", "X"], false]] },
    { p: [["SOMENOT", "X", "Y"], ["ALL", "Z", "Y"]], c: [[["SOMENOT", "X", "Z"], true], [["ALL", "Z", "X"], false], [["ALL", "X", "Z"], false], [["NO", "X", "Z"], false]] },
  ];
  const PROPS = [
    ["ฝนตก", "ฝนไม่ตก", "ถนนเปียก", "ถนนไม่เปียก"],
    ["สมชายอ่านหนังสือ", "สมชายไม่อ่านหนังสือ", "สมชายสอบผ่าน", "สมชายสอบไม่ผ่าน"],
    ["ไฟฟ้าดับ", "ไฟฟ้าไม่ดับ", "ร้านค้าปิด", "ร้านค้าไม่ปิด"],
    ["วันนี้เป็นวันหยุดราชการ", "วันนี้ไม่ใช่วันหยุดราชการ", "สำนักงานปิด", "สำนักงานไม่ปิด"],
    ["รถติด", "รถไม่ติด", "สมหญิงมาทำงานสาย", "สมหญิงไม่มาทำงานสาย"],
    ["ราคาน้ำมันสูงขึ้น", "ราคาน้ำมันไม่สูงขึ้น", "ค่าขนส่งเพิ่มขึ้น", "ค่าขนส่งไม่เพิ่มขึ้น"],
  ];
  function genVerbal(R, k) {
    if (k % 2 === 0) {
      const t = SYL[(k / 2 + R.int(0, 5)) % SYL.length];
      const g = R.pick(GROUPS); const words = R.shuffle(g);
      const map = { X: words[0], Y: words[1], Z: words[2] };
      const st = (s) => S[s[0]](map[s[1]], map[s[2]]);
      const [c1, c2] = R.sample(t.c, 2);
      return {
        sec: "analytic", cat: "เงื่อนไขภาษา",
        q: `เงื่อนไข: ${t.p.map(st).join(" และ ")}\n\nข้อสรุปที่ 1:  ${st(c1[0])}\nข้อสรุปที่ 2:  ${st(c2[0])}`,
        opts: COND_OPTS.slice(), ans: answerIdx(c1[1], c2[1]),
        exp: `• ข้อสรุปที่ 1 "${st(c1[0])}" ${c1[1] ? "ถูก (สรุปได้แน่นอนจากเงื่อนไข)" : "ไม่ถูก (ขัดแย้งหรือข้อมูลไม่พอให้สรุปได้แน่นอน)"}\n• ข้อสรุปที่ 2 "${st(c2[0])}" ${c2[1] ? "ถูก (สรุปได้แน่นอนจากเงื่อนไข)" : "ไม่ถูก (ขัดแย้งหรือข้อมูลไม่พอให้สรุปได้แน่นอน)"}\nแนะนำ: วาดแผนภาพเวนน์ของ ${map.X}, ${map.Y}, ${map.Z} เพื่อตรวจสอบ`,
      };
    }
    const [P, nP, Q, nQ] = R.pick(PROPS);
    const facts = [
      { f: P, c: [[Q, true, "เมื่อเหตุเกิดขึ้น ผลย่อมเกิด"], [nQ, false, "ขัดแย้งกับผลที่ต้องเกิด"]] },
      { f: nQ, c: [[nP, true, "ถ้าผลไม่เกิด เหตุย่อมไม่เกิด (contrapositive)"], [P, false, "ถ้าเหตุเกิด ผลต้องเกิด จึงขัดแย้ง"]] },
      { f: Q, c: [[P, false, "ผลเกิดอาจมาจากเหตุอื่น สรุปแน่นอนไม่ได้"], [nP, false, "ข้อมูลไม่พอให้สรุปได้แน่นอน"]] },
      { f: nP, c: [[nQ, false, "เหตุไม่เกิด ผลอาจเกิดจากเหตุอื่น สรุปแน่นอนไม่ได้"], [Q, false, "ข้อมูลไม่พอให้สรุปได้แน่นอน"]] },
    ];
    const fc = facts[R.f() < 0.7 ? R.int(0, 1) : R.int(2, 3)];
    const other = R.pick(facts.filter((x) => x !== fc));
    // ข้อสรุปหนึ่งจาก fact นี้ อีกข้อเลือกจาก fact เดียวกัน
    const cs = R.shuffle(fc.c);
    void other;
    return {
      sec: "analytic", cat: "เงื่อนไขภาษา",
      q: `เงื่อนไข: ถ้า${P} แล้ว${Q}\nข้อเท็จจริง: ${fc.f}\n\nข้อสรุปที่ 1:  ${cs[0][0]}\nข้อสรุปที่ 2:  ${cs[1][0]}`,
      opts: COND_OPTS.slice(), ans: answerIdx(cs[0][1], cs[1][1]),
      exp: `หลัก "ถ้า p แล้ว q": รู้ p → สรุป q ได้; รู้ไม่ q → สรุปไม่ p ได้; แต่รู้ q หรือรู้ไม่ p → สรุปแน่นอนไม่ได้\n• ข้อสรุปที่ 1 "${cs[0][0]}" ${cs[0][1] ? "ถูก" : "ไม่ถูก"} — ${cs[0][2]}\n• ข้อสรุปที่ 2 "${cs[1][0]}" ${cs[1][1] ? "ถูก" : "ไม่ถูก"} — ${cs[1][2]}`,
    };
  }

  // ================= อุปมาอุปไมย =================
  function genAnalogy(R, used) {
    const groups = window.TH_ANALOGY;
    let gi, pairs, tries = 0;
    do { gi = R.int(0, groups.length - 1); tries++; } while (used.has(gi) && tries < 30);
    used.add(gi);
    const [name, list] = groups[gi];
    pairs = R.sample(list, 2);
    const otherB = R.shuffle(groups.filter((_, i) => i !== gi).map((g) => R.pick(g[1])[1]));
    const wrong = [...new Set(otherB)].filter((w) => !list.some((p) => p[1] === w)).slice(0, 3);
    return mcq(R, { sec: "analytic", cat: "อุปมาอุปไมย", q: `${pairs[0][0]} : ${pairs[0][1]}  เปรียบได้กับ  ${pairs[1][0]} : ?`, exp: `ความสัมพันธ์แบบ "${name}" → ${pairs[0][0]} : ${pairs[0][1]} เช่นเดียวกับ ${pairs[1][0]} : ${pairs[1][1]}` }, pairs[1][1], wrong);
  }

  // ================= สะกดคำ =================
  function genSpell(R, pairs) {
    const [p1, p2, p3, p4, p5, p6, p7, p8] = pairs;
    const correct = `${p1[0]}  ${p2[0]}`;
    const wrongs = [`${p3[1]}  ${p4[0]}`, `${p5[0]}  ${p6[1]}`, `${p7[1]}  ${p8[0]}`];
    return mcq(R, { sec: "analytic", cat: "การสะกดคำ", q: "ข้อใดเขียนถูกต้องทุกคำ", exp: `คำที่ถูก: ${[p3, p6, p7].map((p) => `"${p[1]}" ที่ถูกคือ "${p[0]}"`).join(", ")}` }, correct, wrongs);
  }

  // ================= คำศัพท์อังกฤษ =================
  function genVocab(R, entry, all) {
    const [w, m] = entry;
    const wrong = R.shuffle([...new Set(all.map((x) => x[1]))].filter((x) => x !== m)).slice(0, 3);
    return mcq(R, { sec: "english", cat: "Vocabulary", q: `The word "${w}" is closest in meaning to ______.`, exp: `${w} มีความหมายใกล้เคียงกับ ${m}` }, m, wrong);
  }

  function fromTuple(R, t, sec, cat, extra) {
    return mcq(R, Object.assign({ sec, cat, q: t[0], exp: t[2] }, extra || {}), t[1][0], t[1].slice(1));
  }

  // ================= ประกอบชุดข้อสอบ =================
  const YEARS = [2565, 2566, 2567, 2568, 2569];

  function buildSet(year) {
    const idx = YEARS.indexOf(year);
    const R = makeRng(year * 7919 + 17);
    const A = [];
    for (let k = 0; k < 7; k++) A.push(genSeries(R, k + idx));
    const mathOrder = R.shuffle([...Array(MATH.length).keys()]);
    for (let k = 0; k < 10; k++) A.push(genMath(R, mathOrder[k]));
    A.push(...genTable(R, year));
    for (let k = 0; k < 5; k++) A.push(genSymbol(R, k));
    for (let k = 0; k < 5; k++) A.push(genVerbal(R, k + idx));
    const usedG = new Set();
    for (let k = 0; k < 4; k++) A.push(genAnalogy(R, usedG));
    const sp = R.shuffle(window.TH_SPELL);
    for (let k = 0; k < 3; k++) A.push(genSpell(R, sp.slice(k * 8, k * 8 + 8)));
    window.TH_USAGE.slice(idx * 5, idx * 5 + 5).forEach((t) => A.push(fromTuple(R, t, "analytic", "การใช้ภาษา")));
    window.TH_READING.slice(idx * 3, idx * 3 + 3).forEach((ps, pi) => {
      ps.q.forEach((t) => A.push(fromTuple(R, t, "analytic", "การอ่านจับใจความ", { passage: `<p class="read">${ps.p}</p>`, passageTitle: "อ่านข้อความต่อไปนี้แล้วตอบคำถาม", group: `th${pi}` })));
    });

    const E = [];
    const vocab = R.shuffle(window.ENG_VOCAB).slice(0, 6);
    vocab.forEach((v) => E.push(genVocab(R, v, window.ENG_VOCAB)));
    window.ENG_GRAMMAR.slice(idx * 10, idx * 10 + 10).forEach((t) => E.push(fromTuple(R, t, "english", "Grammar")));
    window.ENG_CONVERSATION.slice(idx * 5, idx * 5 + 5).forEach((t) => E.push(fromTuple(R, t, "english", "Conversation")));
    const rp = window.ENG_READING[idx];
    rp.q.forEach((t) => E.push(fromTuple(R, t, "english", "Reading", { passage: `<p class="read en">${rp.p.replace(/\n/g, "<br>")}</p>`, passageTitle: "Read the passage and answer the questions." })));

    const byTopic = {};
    window.LAW_BANK.forEach((t) => { (byTopic[t[0]] = byTopic[t[0]] || []).push(t); });
    const L = [];
    Object.keys(byTopic).forEach((topic) => {
      byTopic[topic].forEach((t, i) => {
        if (i % 5 === idx) L.push(mcq(R, { sec: "law", cat: topic, q: t[1], exp: t[3] }, t[2][0], t[2].slice(1)));
      });
    });

    const all = [...A, ...E, ...L];
    all.forEach((q, i) => (q.no = i + 1));
    return { year, title: `ชุดที่ ${idx + 1} · แนวข้อสอบปี ${year}`, questions: all };
  }

  window.GP = { YEARS, buildSet };
})();
