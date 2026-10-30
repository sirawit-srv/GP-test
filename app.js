// โปรแกรมทดลองสอบ ก.พ. ภาค ก (เสมือนจริง) — UI หน้าจอเดียว + วิเคราะห์ผล
(function () {
  "use strict";
  const $app = document.getElementById("app");
  const KEYS = ["ก", "ข", "ค", "ง"];
  const SECS = {
    analytic: { name: "วิชาความสามารถในการคิดวิเคราะห์", short: "คิดวิเคราะห์", from: 0, n: 50 },
    english: { name: "วิชาภาษาอังกฤษ", short: "ภาษาอังกฤษ", from: 50, n: 25 },
    law: { name: "วิชาความรู้และลักษณะการเป็นข้าราชการที่ดี", short: "ข้าราชการที่ดี", from: 75, n: 25 },
  };
  const LEVELS = { voc: { name: "ปวช./ปวส.", analytic: 60 }, bach: { name: "ปริญญาตรี", analytic: 60 }, master: { name: "ปริญญาโท", analytic: 65 } };
  const PASS = { english: 50, law: 60 };
  const DURATION = 3 * 60 * 60;
  const PACE = DURATION / 100; // 108 วินาทีต่อข้อ
  const LS = { session: "gp-exam-session-v2", history: "gp-exam-history-v2", prefs: "gp-exam-prefs-v2" };
  const LS_USERS = "gp-exam-users-v1", LS_AUTH = "gp-exam-auth-v1";
  let user = null; // { id, name } หรือ { id: "guest" }
  function bindUser(u) {
    user = u;
    const sfx = u && u.id !== "guest" ? ":" + u.id : "";
    LS.session = "gp-exam-session-v2" + sfx;
    LS.history = "gp-exam-history-v2" + sfx;
  }

  // ---------- คำแนะนำรายหัวข้อ ----------
  const TIPS = {
    "อนุกรม": ["หาผลต่างของพจน์ที่ติดกันก่อนเสมอ ถ้าไม่คงที่ให้หาผลต่างชั้นที่ 2", "ตรวจรูปแบบ ×/÷ คงที่, กำลังสอง n²±c, ฟีโบนักชี และอนุกรมสองชุดสลับตำแหน่งคี่–คู่", "ฝึกวันละ 20 ข้อ จับเวลาไม่เกิน 1 นาทีต่อข้อ"],
    "คณิตศาสตร์": ["ทบทวนสูตร ร้อยละ กำไร–ขาดทุน ส่วนลดซ้อน ดอกเบี้ยธรรมดา อัตราส่วน", "โจทย์งาน: 1/a + 1/b, ความเร็วเฉลี่ยไป–กลับ: 2v₁v₂/(v₁+v₂) ไม่ใช่ค่าเฉลี่ยธรรมดา", "ตั้งสมการจากโจทย์อายุ/จำนวนเรียงติดกันให้เป็นนิสัย และแทนค่าคำตอบกลับเพื่อตรวจ"],
    "ตารางข้อมูล": ["อ่านชื่อตาราง หน่วย และหัวคอลัมน์ก่อนอ่านคำถาม", "ร้อยละการเปลี่ยนแปลง = (ใหม่ − เก่า) ÷ เก่า × 100 ระวังการใช้ปีฐานผิด", "ใช้การประมาณค่า (ปัดเลข) เพื่อตัดตัวเลือกให้เร็วขึ้น"],
    "เงื่อนไขสัญลักษณ์": ["นำเงื่อนไขมาต่อเป็นสายเดียวกันก่อน เช่น A > B ≥ C = D", "ถ้าในสายมีทั้ง > และ < ปนกัน จะสรุปความสัมพันธ์ไม่ได้", "> ผสม ≥ ได้ >, มีแต่ ≥ กับ = ได้ ≥, มีแต่ = ได้ ="],
    "เงื่อนไขภาษา": ["วาดแผนภาพเวนน์ทุกครั้งสำหรับ ทุก/บาง/ไม่มี", "ถ้า p แล้ว q: รู้ p สรุป q ได้, รู้ไม่ q สรุปไม่ p ได้ แต่รู้ q หรือรู้ไม่ p สรุปไม่ได้", "ข้อสรุปที่ 'อาจจริง' แต่ไม่จริงแน่นอน ให้ถือว่าไม่ถูก"],
    "อุปมาอุปไมย": ["แปลงคู่แรกเป็นประโยคความสัมพันธ์ เช่น 'หมอใช้หูฟังในการทำงาน' แล้วแทนคู่ที่สอง", "ระวังตัวเลือกที่เกี่ยวข้องกับคำแต่ความสัมพันธ์ต่างแบบ"],
    "การสะกดคำ": ["ท่องคำที่มักเขียนผิดตามพจนานุกรมฉบับราชบัณฑิตยสถาน เช่น กะทันหัน อนุญาต สังเกต ปรากฏ", "จดคำที่ผิดลงสมุดและทบทวนซ้ำทุกสัปดาห์"],
    "การใช้ภาษา": ["ทบทวนประโยคกำกวม ประโยคฟุ่มเฟือย ระดับภาษา คำราชาศัพท์ และสำนวนไทย", "อ่านตัวเลือกให้ครบทั้ง 4 ข้อก่อนเลือก เพราะมักต่างกันเพียงคำเดียว"],
    "การอ่านจับใจความ": ["อ่านคำถามก่อนแล้วจึงอ่านบทความ", "ใจความสำคัญมักอยู่ต้นหรือท้ายย่อหน้า แยกข้อเท็จจริงกับความคิดเห็นให้ออก", "ระวังตัวเลือกที่ถูกต้องตามความจริงแต่ไม่ได้กล่าวในบทความ"],
    "Vocabulary": ["ท่องคำศัพท์วันละ 15–20 คำ เน้นคำในบริบทราชการและข่าว", "จำคู่คำพ้องความหมาย (synonym) เช่น commence = begin, terminate = end"],
    "Grammar": ["ทบทวน tense, conditional 3 แบบ, passive voice, relative clause, gerund/infinitive", "ดูคำบอกเวลาและประธานเอกพจน์–พหูพจน์เป็นเบาะแสแรก"],
    "Conversation": ["จำสำนวนตอบรับ ขอบคุณ ขอโทษ ขออนุญาต และการคุยโทรศัพท์", "Would you mind / Do you mind ถ้ายินดีให้ตอบปฏิเสธ (Not at all)"],
    "Reading": ["ใช้ skimming หาใจความหลัก และ scanning หาตัวเลข ชื่อ เวลา", "เดาความหมายคำศัพท์จากบริบทรอบ ๆ คำนั้น"],
    "บริหารราชการแผ่นดิน": ["อ่าน พ.ร.บ.ระเบียบบริหารราชการแผ่นดิน พ.ศ. 2534 มาตรา 4, 7, 8 ทวิ, 20, 38–42, 51–53, 70", "แยกให้ออก: ส่วนกลาง/ภูมิภาค/ท้องถิ่น, นิติบุคคล, การมอบอำนาจ vs การรักษาราชการแทน"],
    "บริหารกิจการบ้านเมืองที่ดี": ["จำเป้าหมาย 7 ประการตามมาตรา 6 ของ พ.ร.ฎ.ฯ พ.ศ. 2546", "จำตัวเลขสำคัญ: ตอบหนังสือภายใน 15 วัน, ผู้รับผิดชอบไม่เกิน 3 ระดับ และหลักธรรมาภิบาล 6 ประการ"],
    "วิธีปฏิบัติราชการทางปกครอง": ["ทำตารางสรุปกรอบเวลา: อุทธรณ์ 15 วัน, พิจารณา 30 วัน, พิจารณาใหม่ 90 วัน, ไปรษณีย์ 7 วัน, ประกาศ 15 วัน", "แยก 'คำสั่งทางปกครอง' กับ 'กฎ' และจำเหตุที่เจ้าหน้าที่ต้องห้ามพิจารณา (มาตรา 13)"],
    "ความรับผิดทางละเมิด": ["หลักสำคัญ: ละเมิดในหน้าที่ ฟ้องหน่วยงาน, นอกหน้าที่ ฟ้องเจ้าหน้าที่", "ไล่เบี้ยได้เฉพาะจงใจหรือประมาทเลินเล่ออย่างร้ายแรง และจำอายุความ 1 ปี / 2 ปี และกรอบ 180 วัน"],
    "จริยธรรมข้าราชการ": ["จำมาตรฐานทางจริยธรรม 7 ประการ (พ.ร.บ.มาตรฐานทางจริยธรรม พ.ศ. 2562)", "ทบทวนเรื่องผลประโยชน์ทับซ้อน และเกณฑ์รับของขวัญไม่เกิน 3,000 บาท"],
    "ระเบียบข้าราชการพลเรือน": ["จำประเภทและระดับตำแหน่ง 4 ประเภท, โทษวินัย 5 สถาน", "แยกอุทธรณ์ (คำสั่งลงโทษ) กับร้องทุกข์ และจำกรอบเวลา 30 วัน"],
    "รัฐธรรมนูญ": ["จำองค์กรอิสระ 5 องค์กรและจำนวนกรรมการ", "แยกหน้าที่ของรัฐกับหน้าที่ของปวงชนชาวไทย"],
    "ข้าราชการที่ดี (สถานการณ์)": ["ยึดหลัก: ถูกกฎหมาย, ประโยชน์ประชาชน, ซื่อสัตย์, เป็นกลาง, สุภาพ และใช้ช่องทางที่ถูกต้อง", "ตัดตัวเลือกที่ทำตามคำสั่งที่ไม่ชอบ, เพิกเฉย หรือรุนแรงเกินเหตุออกก่อน"],
  };

  // ---------- storage ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
  };
  const prefs = Object.assign({ level: "bach", mode: "real", year: 2565, theme: "light" }, store.get(LS.prefs, {}));
  if (prefs.theme !== "dark") prefs.theme = "light";
  applyTheme();

  let view = "home";
  let S = null, Q = [];
  let tick = null, sideOpen = false;
  let tab = "overview", rvFilter = "all", rvCur = 0;

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmtTime = (sec) => { sec = Math.max(0, Math.floor(sec)); const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60; return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`; };
  const fmtMin = (sec) => { const m = Math.floor(sec / 60), s = Math.round(sec % 60); return m ? `${m} นาที ${s} วิ` : `${s} วิ`; };
  const thDate = (t) => new Date(t).toLocaleString("th-TH", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  const setNo = (y) => window.GP.YEARS.indexOf(y) + 1;
  const pctColor = (p) => (p >= 75 ? "var(--good)" : p >= 60 ? "var(--accent)" : p >= 40 ? "var(--warn)" : "var(--bad)");

  function applyTheme() {
    const r = document.documentElement;
    r.setAttribute("data-theme", prefs.theme === "dark" ? "dark" : "light");
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute("content", prefs.theme === "dark" ? "#141017" : "#fdf0ec");
  }
  function savePrefs() { store.set(LS.prefs, prefs); }

  function themeToggle() {
    return `<div class="seg seg-theme" role="group" aria-label="โหมดสี">${[["light", "☀ สว่าง"], ["dark", "☾ มืด"]].map(([k, t]) => `<button data-act="theme" data-v="${k}" aria-pressed="${prefs.theme === k}">${t}</button>`).join("")}</div>`;
  }
  function userChip() {
    if (!user) return "";
    const nm = user.id === "guest" ? "ผู้เยี่ยมชม" : user.name;
    return `<span class="user-chip" title="${esc(nm)}"><span class="avatar">${esc(nm.trim().charAt(0) || "?")}</span><span class="uname">${esc(nm)}</span></span><button class="btn sm" data-act="logout">${user.id === "guest" ? "เข้าสู่ระบบ" : "ออกจากระบบ"}</button>`;
  }
  function brand(sub) {
    return `<div class="brand"><div class="logo">ก.พ.</div><div style="min-width:0"><b>ห้องสอบ ก.พ. จำลอง</b><small>${sub}</small></div></div>`;
  }

  // ======================= หน้าแรก =======================
  function renderHome() {
    view = "home"; stopTick();
    document.title = "ห้องสอบ ก.พ. จำลอง";
    const saved = store.get(LS.session, null);
    const hist = store.get(LS.history, []);
    const best = {};
    hist.forEach((h) => { if (!best[h.year] || h.total > best[h.year].total) best[h.year] = h; });
    const y = prefs.year;
    const inProg = saved && saved.year === y && !saved.done ? saved : null;

    const sets = window.GP.YEARS.map((yy, i) => {
      const b = best[yy];
      const prog = saved && saved.year === yy && !saved.done;
      return `<button class="set" data-act="pick" data-y="${yy}" aria-pressed="${yy === y}">
        <span class="no">ชุดที่ ${i + 1}</span>
        <span class="yr">${yy}</span>
        <span class="st">${b ? `ดีที่สุด <b class="mono">${b.total}</b>/200 <span class="pill ${b.pass ? "good" : "bad"}">${b.pass ? "ผ่าน" : "ไม่ผ่าน"}</span>` : `<span class="dim">ยังไม่เคยทำ</span>`}${prog ? `<span class="pill warn">ทำค้าง</span>` : ""}</span>
        <span class="mini-bar"><i style="width:${b ? b.total / 2 : 0}%"></i></span>
      </button>`;
    }).join("");

    const last = hist.slice(-12);
    const trend = last.length ? `<div class="trend" aria-label="แนวโน้มคะแนน">${last.map((h) => `<i class="${h.pass ? "pass" : "fail"}" style="height:${Math.max(4, h.total / 2)}%" title="ชุดปี ${h.year}: ${h.total} คะแนน"></i>`).join("")}</div>` : "";
    const histList = hist.length ? `<div class="hist-list">${hist.slice(-4).reverse().map((h) => `<button class="hist-item" data-act="openres" data-id="${h.id}">
        <span class="sc">${h.total}</span><span><b style="font-size:13.5px">ชุดที่ ${setNo(h.year)} · ปี ${h.year}</b><br><span class="dim" style="font-size:12px">${thDate(h.at)} · ${LEVELS[h.level].name}</span></span>
        <span class="pill ${h.pass ? "good" : "bad"}">${h.pass ? "ผ่าน" : "ไม่ผ่าน"}</span></button>`).join("")}</div>` : `<div class="empty">ยังไม่มีประวัติ เมื่อส่งคำตอบแล้ว ผลสอบและบทวิเคราะห์จะเก็บไว้ที่นี่ (เฉพาะเบราว์เซอร์นี้)</div>`;

    const answeredProg = inProg ? inProg.answers.filter((a) => a !== null).length : 0;
    $app.innerHTML = `
    <header class="appbar">${brand("ภาค ก. · ข้อสอบเสมือนจริง")}
      <div class="bar-actions">${themeToggle()}${userChip()}</div>
    </header>
    <main class="view"><div class="home">
      <section class="hero">
        <span class="eyebrow-pill"><i></i>การสอบวัดความรู้ความสามารถทั่วไป (ภาค ก.)</span>
        <h1><span class="grad">ฝึกสอบ ก.พ.</span> เสมือนจริง<br>รู้จุดอ่อนทันทีหลังสอบ</h1>
        <p>${user && user.id !== "guest" ? `สวัสดี คุณ${esc(user.name)} · ` : ""}ทำตาม 3 ขั้นตอนด้านล่าง เลือกชุด ตั้งค่า แล้วเริ่มสอบ ระบบจะวิเคราะห์จุดแข็ง จุดอ่อน และแผนพัฒนา 4 สัปดาห์ให้หลังส่งคำตอบ</p>
        <ol class="flow" aria-label="ขั้นตอนการใช้งาน">
          <li class="${y ? "done" : ""}"><span class="sn">1</span><div><b>เลือกชุดข้อสอบ</b><small>5 ชุด แนวปี 2565–2569</small></div></li>
          <li class="${inProg ? "" : "now"}"><span class="sn">2</span><div><b>ตั้งค่าการสอบ</b><small>วุฒิ และรูปแบบการสอบ</small></div></li>
          <li><span class="sn">3</span><div><b>เริ่มสอบ แล้วรับบทวิเคราะห์</b><small>100 ข้อ · 3 ชั่วโมง · เฉลยทุกข้อ</small></div></li>
        </ol>
      </section>
      <section class="pick">
        <div class="step-title"><span class="sn">1</span>เลือกชุดข้อสอบ <span class="dim">กดการ์ดเพื่อเลือก</span></div>
        <div class="sets" role="group" aria-label="ชุดข้อสอบ">${sets}</div>
      </section>
      <aside class="home-side">
        <section class="card launch">
          <div class="step-title"><span class="sn">2</span>ตั้งค่าการสอบ</div>
          <div class="sel-sum"><span class="dim">ชุดที่เลือก</span><b>ชุดที่ ${setNo(y)} · แนวข้อสอบปี ${y}</b></div>
          <div class="row"><span class="cap">ระดับวุฒิที่สมัคร</span>
            <div class="seg seg-choice" role="group">${Object.entries(LEVELS).map(([k, v]) => `<button data-act="level" data-v="${k}" aria-pressed="${prefs.level === k}">${v.name}</button>`).join("")}</div></div>
          <div class="row"><span class="cap">รูปแบบ</span>
            <div class="seg seg-choice" role="group"><button data-act="mode" data-v="real" aria-pressed="${prefs.mode === "real"}">สอบเสมือนจริง</button><button data-act="mode" data-v="practice" aria-pressed="${prefs.mode === "practice"}">โหมดฝึก</button></div>
            <span class="hint">${prefs.mode === "real" ? "จับเวลา 3 ชั่วโมง ส่งอัตโนมัติเมื่อหมดเวลา เฉลยหลังส่ง" : "ไม่จำกัดเวลา เฉลยและคำอธิบายทันทีทีละข้อ"} · เกณฑ์คิดวิเคราะห์ ${LEVELS[prefs.level].analytic}%</span></div>
          <div class="step-title" style="margin-top:4px"><span class="sn">3</span>เริ่มสอบ</div>
          <div class="go">${inProg
            ? `<button class="btn primary lg" data-act="resume"><span class="arr">→</span>ทำต่อจากข้อ ${inProg.cur + 1} (ตอบแล้ว ${answeredProg} ข้อ)</button><button class="btn" data-act="start">เริ่มชุดนี้ใหม่</button>`
            : `<button class="btn primary lg" data-act="start"><span class="arr">→</span>เริ่มสอบชุดที่ ${setNo(y)} · ปี ${y}</button>`}</div>
        </section>
        <section class="card hist-card">
          <h2>ผลสอบที่ผ่านมา ${hist.length ? `<span class="dim" style="font-size:12px;font-weight:500">${hist.length} ครั้ง · ผ่าน ${hist.filter((h) => h.pass).length}</span>` : ""}</h2>
          <div class="scroll">${trend}${histList}</div>
        </section>
      </aside>
      <section class="band" aria-label="โครงสร้างข้อสอบ">
        <div class="band-item"><b>50</b><span>ข้อ คิดวิเคราะห์<br><small>ผ่าน ${LEVELS[prefs.level].analytic}%</small></span></div>
        <div class="band-item"><b>25</b><span>ข้อ ภาษาอังกฤษ<br><small>ผ่าน 50%</small></span></div>
        <div class="band-item"><b>25</b><span>ข้อ ข้าราชการที่ดี<br><small>ผ่าน 60%</small></span></div>
        <div class="band-item"><b>3</b><span>ชั่วโมง<br><small>200 คะแนน</small></span></div>
        <p class="band-note">ก.พ. ไม่เผยแพร่ข้อสอบจริงย้อนหลัง ทุกชุดเขียนขึ้นใหม่ตามโครงสร้างและขอบเขตเนื้อหาจริง</p>
      </section>
    </div></main>`;
  }

  // ======================= เข้าสู่ระบบ =======================
  let authTab = "login", authErr = "", authDraft = {};
  async function hashPw(username, pw) {
    const data = new TextEncoder().encode("gp-exam:" + username.toLowerCase() + ":" + pw);
    try { const buf = await crypto.subtle.digest("SHA-256", data); return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join(""); }
    catch (e) { let h = 5381; for (const b of data) h = ((h << 5) + h + b) | 0; return "d" + (h >>> 0).toString(16); }
  }
  function renderLogin() {
    view = "login"; stopTick();
    document.title = "เข้าสู่ระบบ · ห้องสอบ ก.พ. จำลอง";
    const reg = authTab === "register";
    $app.innerHTML = `
    <header class="appbar">${brand("ภาค ก. · ข้อสอบเสมือนจริง")}<div class="bar-actions">${themeToggle()}</div></header>
    <main class="view"><div class="login">
      <section class="login-hero">
        <span class="eyebrow-pill"><i></i>ห้องสอบ ก.พ. จำลอง</span>
        <h1><span class="grad">ฝึกสอบ ก.พ.</span><br>เก็บผลไว้ในบัญชีของคุณ</h1>
        <p>เข้าสู่ระบบเพื่อแยกประวัติคะแนน ข้อสอบที่ทำค้าง และบทวิเคราะห์ของแต่ละคน ใช้เครื่องเดียวกันหลายคนได้โดยข้อมูลไม่ปนกัน</p>
        <ul class="login-points"><li>5 ชุดข้อสอบเสมือนจริง แนวปี 2565–2569</li><li>จับเวลา 3 ชั่วโมงเหมือนสนามสอบจริง</li><li>วิเคราะห์จุดอ่อนพร้อมแผนพัฒนา 4 สัปดาห์</li></ul>
      </section>
      <section class="card login-card">
        <div class="seg seg-choice login-tabs" role="tablist">
          <button role="tab" data-act="authtab" data-v="login" aria-pressed="${!reg}">เข้าสู่ระบบ</button>
          <button role="tab" data-act="authtab" data-v="register" aria-pressed="${reg}">สมัครใช้งาน</button>
        </div>
        <form id="authForm" class="auth-form" novalidate>
          <h2>${reg ? "สร้างบัญชีใหม่" : "ยินดีต้อนรับกลับมา"}</h2>
          ${reg ? `<label class="field"><span>ชื่อที่แสดง</span><input id="f-name" name="name" autocomplete="nickname" placeholder="เช่น สมชาย" value="${esc(authDraft.name || "")}" required></label>` : ""}
          <label class="field"><span>ชื่อผู้ใช้</span><input id="f-user" name="username" autocomplete="username" placeholder="ภาษาอังกฤษหรือตัวเลข 3–20 ตัว" value="${esc(authDraft.username || "")}" required></label>
          <label class="field"><span>รหัสผ่าน</span><span class="pw"><input id="f-pass" name="password" type="password" autocomplete="${reg ? "new-password" : "current-password"}" placeholder="อย่างน้อย 6 ตัวอักษร" required><button type="button" class="pw-toggle" data-act="pwshow" aria-label="แสดงรหัสผ่าน">แสดง</button></span></label>
          ${reg ? `<label class="field"><span>ยืนยันรหัสผ่าน</span><input id="f-pass2" name="password2" type="password" autocomplete="new-password" required></label>` : ""}
          <div class="form-err" role="alert">${esc(authErr)}</div>
          <button type="submit" class="btn primary lg">${reg ? "สมัครและเข้าสู่ระบบ" : "เข้าสู่ระบบ"}</button>
          <div class="or"><span>หรือ</span></div>
          <button type="button" class="btn lg" data-act="guest">เข้าใช้งานแบบผู้เยี่ยมชม</button>
          <p class="fine">บัญชีและผลสอบเก็บไว้ในเบราว์เซอร์ของเครื่องนี้เท่านั้น ไม่ได้ส่งขึ้นเซิร์ฟเวอร์ หากล้างข้อมูลเบราว์เซอร์ ข้อมูลจะหายไป</p>
        </form>
      </section>
    </div></main>`;
    const f = document.getElementById("authForm");
    f.addEventListener("submit", onAuthSubmit);
    const first = f.querySelector("input"); if (first && !first.value) first.focus();
  }
  async function onAuthSubmit(e) {
    e.preventDefault();
    const reg = authTab === "register";
    const g = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ""; };
    const username = g("f-user").toLowerCase(), pw = document.getElementById("f-pass").value, name = g("f-name");
    authDraft = { username, name };
    const users = store.get(LS_USERS, {});
    const fail = (m) => { authErr = m; renderLogin(); };
    if (!/^[a-z0-9_.-]{3,20}$/.test(username)) return fail("ชื่อผู้ใช้ต้องเป็นภาษาอังกฤษ ตัวเลข หรือ _ . - ยาว 3–20 ตัว");
    if (pw.length < 6) return fail("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
    if (reg) {
      if (!name) return fail("กรุณาใส่ชื่อที่แสดง");
      if (pw !== document.getElementById("f-pass2").value) return fail("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      if (users[username]) return fail("ชื่อผู้ใช้นี้มีในเครื่องนี้แล้ว ลองเข้าสู่ระบบ หรือใช้ชื่ออื่น");
      users[username] = { name, hash: await hashPw(username, pw), created: Date.now() };
      store.set(LS_USERS, users);
    } else {
      const u = users[username];
      if (!u || u.hash !== (await hashPw(username, pw))) return fail("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    }
    authErr = ""; authDraft = {};
    store.set(LS_AUTH, username);
    bindUser({ id: username, name: users[username].name });
    renderHome();
  }
  function logout() {
    if (view === "exam" && S && !S.done) save();
    store.del(LS_AUTH); S = null; bindUser(null);
    authTab = "login"; authErr = ""; renderLogin();
  }

  // ======================= การสอบ =======================
  function startExam() {
    const y = prefs.year;
    S = { id: Date.now(), year: y, level: prefs.level, mode: prefs.mode, answers: Array(100).fill(null), flags: [], qtime: Array(100).fill(0), cur: 0, elapsedBefore: 0, startAt: Date.now(), enterAt: Date.now(), done: false };
    Q = window.GP.buildSet(y).questions;
    sideOpen = false;
    save(); renderExam();
  }
  function resumeExam() {
    const saved = store.get(LS.session, null);
    if (!saved) return renderHome();
    S = saved; S.startAt = Date.now(); S.enterAt = Date.now();
    if (!S.qtime) S.qtime = Array(100).fill(0);
    Q = window.GP.buildSet(S.year).questions;
    sideOpen = false; renderExam();
  }
  const elapsed = () => S.elapsedBefore + (Date.now() - S.startAt) / 1000;
  function leave() { const now = Date.now(); S.qtime[S.cur] += (now - S.enterAt) / 1000; S.enterAt = now; }
  function save() {
    if (!S || S.done) return;
    leave();
    store.set(LS.session, Object.assign({}, S, { elapsedBefore: elapsed(), startAt: Date.now() }));
  }
  function stopTick() { if (tick) { clearInterval(tick); tick = null; } }
  function go(n) { if (n < 0 || n > 99) return; leave(); S.cur = n; save(); renderExam(); }

  function secCounts() {
    const o = {};
    Object.entries(SECS).forEach(([k, s]) => { o[k] = S.answers.slice(s.from, s.from + s.n).filter((a) => a !== null).length; });
    return o;
  }

  function optionsHtml(q, chosen, reveal, clickable) {
    const two = !q.passage && q.opts.every((o) => o.length <= 34);
    return `<div class="opts ${two ? "two" : ""}">${q.opts.map((o, i) => {
      let c = "opt";
      if (reveal) { if (i === q.ans) c += " right"; else if (i === chosen) c += " wrong"; }
      else if (chosen === i) c += " sel";
      const tag = clickable ? "button" : "div";
      return `<${tag} class="${c}" ${clickable ? `data-act="answer" data-i="${i}" ${reveal ? "disabled" : ""}` : ""}><span class="key">${KEYS[i]}</span><span>${esc(o)}</span></${tag}>`;
    }).join("")}</div>`;
  }
  function questionBody(q, inner) {
    if (q.passage) return `<div class="qbody split"><div class="passage"><div class="ptitle">${esc(q.passageTitle || "")}</div><div class="tblwrap">${q.passage}</div></div><div>${inner}</div></div>`;
    return `<div class="qbody">${inner}</div>`;
  }

  function renderExam() {
    view = "exam";
    const q = Q[S.cur];
    const practice = S.mode === "practice";
    const chosen = S.answers[S.cur];
    const reveal = practice && chosen !== null;
    const flagged = S.flags.includes(S.cur);
    const cnt = secCounts();
    document.title = `ข้อ ${S.cur + 1} · ชุดปี ${S.year}`;

    const explain = reveal ? `<div class="explain">${chosen === q.ans ? "<b>ถูกต้อง</b>" : `<b>ยังไม่ถูก</b> คำตอบคือ ${KEYS[q.ans]}. ${esc(q.opts[q.ans])}`}\n${esc(q.exp)}</div>` : "";
    const inner = `<p class="qtext">${esc(q.q)}</p>${optionsHtml(q, chosen, reveal, true)}${explain}`;

    const tabs = Object.entries(SECS).map(([k, s]) => `<button class="sectab ${q.sec === k ? "on" : ""}" data-act="goto" data-q="${s.from}"><b>${s.short} <span class="dim mono">${cnt[k]}/${s.n}</span></b><span class="mini-bar"><i style="width:${(cnt[k] / s.n) * 100}%"></i></span></button>`).join("");

    $app.innerHTML = `
    <header class="appbar exam-bar">
      ${brand(`ชุดที่ ${setNo(S.year)} · แนวข้อสอบปี ${S.year} · ${practice ? "โหมดฝึก" : "สอบเสมือนจริง"}`)}
      <nav class="sectabs" aria-label="ส่วนของข้อสอบ">${tabs}</nav>
      <div class="bar-actions">
        <span class="timer" id="timer"></span>
        <button class="btn sm side-toggle" data-act="side">ตารางข้อ</button>
        <button class="btn sm" data-act="pause"><span class="full">พักไว้</span><span class="short">พัก</span></button>
        <button class="btn sm danger" data-act="submit"><span class="full">ส่งคำตอบ</span><span class="short">ส่ง</span></button>
      </div>
    </header>
    <main class="view"><div class="exam">
      <section class="qpanel" aria-live="polite">
        <div class="qhead"><span class="qno">ข้อ ${S.cur + 1}</span><span class="pill info">${esc(q.cat)}</span>${flagged ? `<span class="pill warn">ทำเครื่องหมายไว้</span>` : ""}<span class="sec">${SECS[q.sec].name}</span></div>
        ${questionBody(q, inner)}
        <div class="qnav">
          <button class="btn" data-act="prev" ${S.cur === 0 ? "disabled" : ""}>‹ ก่อนหน้า</button>
          <button class="btn flag" data-act="flag" aria-pressed="${flagged}">${flagged ? "★ ทำเครื่องหมายแล้ว" : "☆ ทบทวนภายหลัง"}</button>
          <span class="spacer"></span>
          <span class="kbd"><kbd>1</kbd>–<kbd>4</kbd> ตอบ · <kbd>←</kbd><kbd>→</kbd> เปลี่ยนข้อ · <kbd>F</kbd> ทำเครื่องหมาย</span>
          ${S.cur === 99 ? `<button class="btn danger" data-act="submit">ส่งคำตอบ</button>` : `<button class="btn primary" data-act="next">ถัดไป ›</button>`}
        </div>
      </section>
      ${renderSide()}
    </div></main>`;
    updateTimer();
    if (!tick) tick = setInterval(updateTimer, 1000);
  }

  function renderSide() {
    const practice = S.mode === "practice";
    const answered = S.answers.filter((a) => a !== null).length;
    const grids = Object.entries(SECS).map(([k, s]) => {
      const cells = [];
      for (let i = s.from; i < s.from + s.n; i++) {
        const a = S.answers[i];
        let c = "cell";
        if (a !== null) c += practice ? (a === Q[i].ans ? " ok" : " ng") : " ans";
        if (i === S.cur) c += " cur";
        if (S.flags.includes(i)) c += " flag";
        cells.push(`<button class="${c}" data-act="goto" data-q="${i}" aria-label="ข้อ ${i + 1}">${i + 1}</button>`);
      }
      return `<div class="ng-label"><span>${s.short}</span><span class="mono">ข้อ ${s.from + 1}–${s.from + s.n}</span></div><div class="numgrid">${cells.join("")}</div>`;
    }).join("");
    return `<aside class="side ${sideOpen ? "open" : ""}" aria-label="ตารางข้อสอบ">
      <div style="display:grid;gap:8px">
        <div class="side-head"><b>ตารางข้อสอบ</b><button class="btn ghost sm side-toggle" data-act="side">ปิด</button></div>
        <div class="stats"><div class="stat"><span class="v">${answered}</span><span class="k">ตอบแล้ว</span></div><div class="stat"><span class="v">${100 - answered}</span><span class="k">ยังไม่ตอบ</span></div><div class="stat"><span class="v">${S.flags.length}</span><span class="k">ทบทวน</span></div></div>
      </div>
      <div class="numgrid-wrap">${grids}</div>
      <div style="display:grid;gap:8px">
        <div class="legend">${practice ? `<span><i style="background:var(--good)"></i>ถูก</span><span><i style="background:var(--bad)"></i>ผิด</span>` : `<span><i style="background:var(--dark)"></i>ตอบแล้ว</span>`}<span><i></i>ยังไม่ตอบ</span><span><i style="background:var(--warn);border-radius:50%"></i>ทบทวน</span></div>
        <div class="pace" id="pace"></div>
      </div>
    </aside>`;
  }

  function updateTimer() {
    if (view !== "exam" || !S) return;
    const el = document.getElementById("timer"), pace = document.getElementById("pace");
    const e = elapsed();
    const answered = S.answers.filter((a) => a !== null).length;
    if (S.mode === "practice") {
      if (el) el.textContent = fmtTime(e);
      if (pace) pace.innerHTML = `เวลาเฉลี่ยต่อข้อที่ตอบ <b>${answered ? fmtMin(e / answered) : "–"}</b> · เวลาจริงควรเฉลี่ยไม่เกิน <b>1 นาที 48 วิ</b>`;
    } else {
      const left = DURATION - e;
      if (el) { el.textContent = fmtTime(left); el.classList.toggle("low", left <= 600); }
      const expect = Math.min(100, Math.floor(e / PACE));
      const diff = answered - expect;
      if (pace) pace.innerHTML = `ตามเวลาควรทำถึงข้อ <b>${expect}</b> · ตอบแล้ว <b>${answered}</b> ข้อ <span class="pill ${diff >= 0 ? "good" : diff > -10 ? "warn" : "bad"}">${diff >= 0 ? "ทันเวลา" : `ช้ากว่าแผน ${-diff} ข้อ`}</span>`;
      if (left <= 0) return finish(true);
    }
    if (Math.floor(e) % 15 === 0) save();
  }

  function setAnswer(i) {
    if (S.mode === "practice" && S.answers[S.cur] !== null) return;
    S.answers[S.cur] = S.answers[S.cur] === i && S.mode !== "practice" ? null : i;
    save(); renderExam();
  }
  function toggleFlag() { const k = S.flags.indexOf(S.cur); if (k >= 0) S.flags.splice(k, 1); else S.flags.push(S.cur); save(); renderExam(); }

  function confirmSubmit() {
    const un = S.answers.filter((a) => a === null).length;
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mt">
      <h3 id="mt">ส่งคำตอบเลยไหม</h3>
      <p style="margin:0">${un ? `ยังไม่ได้ตอบ <b>${un}</b> ข้อ (การสอบ ก.พ. ไม่หักคะแนนข้อที่ตอบผิด ควรตอบให้ครบ)` : "ตอบครบทั้ง 100 ข้อแล้ว"}${S.flags.length ? `<br>มีข้อที่ทำเครื่องหมายไว้ทบทวน <b>${S.flags.length}</b> ข้อ` : ""}</p>
      <p class="dim" style="margin:0;font-size:14px">ส่งแล้วจะแก้คำตอบไม่ได้</p>
      <div class="acts"><button class="btn" data-m="cancel">กลับไปทำต่อ</button><button class="btn danger" data-m="ok">ส่งคำตอบ</button></div>
    </div>`;
    document.body.appendChild(back);
    back.querySelector('[data-m="cancel"]').focus();
    back.addEventListener("click", (e) => {
      const b = e.target.closest("[data-m]");
      if (e.target === back || (b && b.dataset.m === "cancel")) back.remove();
      else if (b && b.dataset.m === "ok") { back.remove(); finish(false); }
    });
  }

  function finish(timeout) {
    stopTick(); leave();
    const used = Math.min(elapsed(), S.mode === "real" ? DURATION : Infinity);
    const sc = score(S, Q);
    const entry = { id: S.id, year: S.year, level: S.level, mode: S.mode, answers: S.answers, flags: S.flags, qtime: S.qtime.map((x) => Math.round(x)), used: Math.round(used), timeout: !!timeout, total: sc.total, pass: sc.pass, at: Date.now() };
    const hist = store.get(LS.history, []).filter((h) => h.id !== entry.id);
    hist.push(entry);
    store.set(LS.history, hist.slice(-40));
    store.del(LS.session);
    S = Object.assign({ done: true }, entry);
    tab = "overview"; rvFilter = "all"; rvCur = 0;
    renderResult();
  }

  // ======================= คะแนนและการวิเคราะห์ =======================
  function score(s, qs) {
    const sec = {}; const cats = {};
    Object.keys(SECS).forEach((k) => (sec[k] = { c: 0, n: 0, blank: 0, time: 0 }));
    qs.forEach((q, i) => {
      const a = s.answers[i], ok = a === q.ans;
      sec[q.sec].n++; if (ok) sec[q.sec].c++; if (a === null) sec[q.sec].blank++;
      sec[q.sec].time += (s.qtime && s.qtime[i]) || 0;
      const key = q.sec + "|" + q.cat;
      if (!cats[key]) cats[key] = { sec: q.sec, cat: q.cat, c: 0, n: 0, wrong: [], blank: [] };
      cats[key].n++; if (ok) cats[key].c++; else if (a === null) cats[key].blank.push(i); else cats[key].wrong.push(i);
    });
    const res = {}; let total = 0;
    Object.keys(SECS).forEach((k) => {
      const r = sec[k], need = k === "analytic" ? LEVELS[s.level].analytic : PASS[k];
      const pct = (r.c / r.n) * 100, needQ = Math.ceil((need / 100) * r.n - 1e-9);
      res[k] = { correct: r.c, n: r.n, blank: r.blank, pts: r.c * 2, max: r.n * 2, pct, need, needQ, pass: pct >= need, time: r.time };
      total += r.c * 2;
    });
    const catList = Object.values(cats).map((c) => Object.assign(c, { pct: (c.c / c.n) * 100, lost: (c.n - c.c) * 2 }));
    return { res, total, pass: Object.values(res).every((r) => r.pass), cats: catList };
  }

  function analyse(sc) {
    const strong = sc.cats.filter((c) => c.pct >= 75).sort((a, b) => b.pct - a.pct);
    const fair = sc.cats.filter((c) => c.pct >= 60 && c.pct < 75).sort((a, b) => b.pct - a.pct);
    const weak = sc.cats.filter((c) => c.pct < 60).map((c) => {
      const r = sc.res[c.sec];
      const w = c.lost * (r.pass ? 1 : 1.6) * (c.pct < 40 ? 1.2 : 1);
      return Object.assign({}, c, { prio: w });
    }).sort((a, b) => b.prio - a.prio);
    return { strong, fair, weak };
  }

  function summaryText(sc, an) {
    const failed = Object.entries(sc.res).filter(([, r]) => !r.pass).map(([k]) => SECS[k].short);
    const best = Object.entries(sc.res).sort((a, b) => b[1].pct - a[1].pct)[0];
    let t = sc.pass ? `ผ่านเกณฑ์ครบทั้ง 3 วิชา ด้วยคะแนน ${sc.total}/200 ` : `ยังไม่ผ่านเกณฑ์วิชา${failed.join(" และ ")} `;
    t += `วิชาที่ทำได้ดีที่สุดคือ${SECS[best[0]].short} (${best[1].pct.toFixed(0)}%) `;
    if (an.weak.length) t += `ควรเร่งพัฒนา ${an.weak.slice(0, 3).map((c) => c.cat).join(", ")} ซึ่งเป็นหัวข้อที่เสียคะแนนมากที่สุด`;
    else t += "ไม่มีหัวข้อที่ต่ำกว่า 60% รักษามาตรฐานด้วยการทำข้อสอบจับเวลาสม่ำเสมอ";
    return t;
  }

  function planWeeks(sc, an) {
    const w = an.weak.map((c) => c.cat);
    const weeks = [];
    const lawWeak = an.weak.filter((c) => c.sec === "law").map((c) => c.cat);
    const engWeak = an.weak.filter((c) => c.sec === "english").map((c) => c.cat);
    const anaWeak = an.weak.filter((c) => c.sec === "analytic").map((c) => c.cat);
    weeks.push(["สัปดาห์ที่ 1", anaWeak.length ? `ปูพื้นฐาน ${anaWeak.slice(0, 2).join(" และ ")} ฝึกวันละ 30–40 ข้อ` : "ทบทวนคิดวิเคราะห์ทุกหัวข้อ วันละ 30 ข้อแบบจับเวลา"]);
    weeks.push(["สัปดาห์ที่ 2", lawWeak.length ? `อ่านตัวบท ${lawWeak.slice(0, 2).join(" และ ")} สรุปเป็นตารางตัวเลขและกรอบเวลา` : "อ่านทบทวนกฎหมายหลัก 4 ฉบับ และทำข้อสอบสถานการณ์"]);
    weeks.push(["สัปดาห์ที่ 3", engWeak.length ? `อังกฤษ: ${engWeak.join(", ")} วันละ 45 นาที + คำศัพท์วันละ 20 คำ` : (anaWeak.length > 2 ? `เก็บหัวข้อ ${anaWeak.slice(2, 4).join(" และ ")}` : "ฝึกบทอ่านภาษาไทยและอังกฤษ วันละ 2 บท")]);
    const other = window.GP.YEARS.filter((y) => y !== S.year);
    weeks.push(["สัปดาห์ที่ 4", `สอบเสมือนจริงชุดปี ${other[0]} และ ${other[1]} แบบจับเวลา แล้วเทียบผลกับครั้งนี้`]);
    void w;
    return weeks;
  }

  function timeAdvice(sc) {
    const out = [];
    const usedQ = S.qtime ? S.qtime.reduce((a, b) => a + b, 0) : 0;
    if (S.timeout) out.push("ทำไม่ทันเวลา ควรข้ามข้อที่ติดเกิน 2 นาทีแล้วกลับมาทำทีหลัง");
    const blank = S.answers.filter((a) => a === null).length;
    if (blank) out.push(`ยังเว้นว่าง ${blank} ข้อ การสอบไม่หักคะแนนข้อผิด ควรตอบทุกข้อเสมอ`);
    if (usedQ > 0) {
      const a = sc.res.analytic.time / 50;
      if (a > 140) out.push(`วิชาคิดวิเคราะห์ใช้เฉลี่ย ${fmtMin(a)} ต่อข้อ ซึ่งนานเกินไป ควรฝึกสูตรลัดและการประมาณค่า`);
      const l = sc.res.law.time / 25;
      if (l > 0 && l < 25 && sc.res.law.pct < 60) out.push("วิชาข้าราชการที่ดีตอบเร็วแต่ผิดมาก ควรอ่านคำถามให้ครบ โดยเฉพาะคำว่า \"ไม่ใช่\"");
    }
    if (!out.length) out.push("บริหารเวลาได้ดี แนะนำลำดับ: กฎหมาย 25 นาที → อังกฤษ 35 นาที → คิดวิเคราะห์ 100 นาที → ทบทวน 20 นาที");
    return out;
  }

  // ======================= หน้าผล =======================
  function openResult(id) {
    const h = store.get(LS.history, []).find((x) => x.id === id);
    if (!h) return;
    S = Object.assign({ done: true }, h);
    Q = window.GP.buildSet(h.year).questions;
    tab = "analysis"; rvFilter = "all"; rvCur = 0;
    renderResult();
  }

  function renderResult() {
    view = "result"; stopTick();
    document.title = `ผลสอบชุดปี ${S.year}`;
    const sc = score(S, Q);
    const an = analyse(sc);
    let body = "";
    if (tab === "overview") body = tabOverview(sc);
    else if (tab === "analysis") body = tabAnalysis(sc, an);
    else body = tabReview();
    $app.innerHTML = `
    <header class="appbar">
      ${brand(`ผลสอบ · ชุดที่ ${setNo(S.year)} ปี ${S.year} · ${LEVELS[S.level].name} · ${S.mode === "practice" ? "โหมดฝึก" : "สอบเสมือนจริง"}`)}
      <div class="seg seg-tabs" role="tablist">${[["overview", "ภาพรวมคะแนน"], ["analysis", "วิเคราะห์และคำแนะนำ"], ["review", "เฉลยรายข้อ"]].map(([k, t]) => `<button role="tab" data-act="tab" data-v="${k}" aria-pressed="${tab === k}">${t}</button>`).join("")}</div>
      <div class="bar-actions"><button class="btn sm" data-act="again">ทำชุดนี้อีกครั้ง</button><button class="btn sm primary" data-act="home">หน้าแรก</button></div>
    </header>
    <main class="view"><div class="result"><div class="tab-body">${body}</div></div></main>`;
  }

  function subjCard(k, r) {
    const more = r.needQ - r.correct;
    return `<div class="subj"><div class="top"><span class="name">${SECS[k].short}</span><span><span class="pts">${r.pts}</span><span class="dim">/${r.max}</span> <span class="pill ${r.pass ? "good" : "bad"}">${r.pass ? "ผ่าน" : "ไม่ผ่าน"}</span></span></div>
      <div class="gauge"><i style="width:${r.pct}%;background:${r.pass ? "var(--good)" : "var(--bad)"}"></i><span class="cut" style="left:${r.need}%" title="เกณฑ์ ${r.need}%"></span></div>
      <div class="meta">ถูก ${r.correct}/${r.n} ข้อ (${r.pct.toFixed(0)}%) · เกณฑ์ ${r.need}% = ${r.needQ} ข้อ · ${more > 0 ? `<b style="color:var(--bad)">ต้องถูกเพิ่มอีก ${more} ข้อ</b>` : `เกินเกณฑ์ ${-more} ข้อ`}</div></div>`;
  }

  function tabOverview(sc) {
    const subj = Object.entries(sc.res).map(([k, r]) => subjCard(k, r)).join("");
    let rows = "", last = null;
    sc.cats.forEach((c) => {
      if (c.sec !== last) { rows += `<div class="cat-sep">${SECS[c.sec].name}</div>`; last = c.sec; }
      rows += `<div class="catrow"><span class="lbl" title="${esc(c.cat)}">${esc(c.cat)}</span><span class="track"><i style="width:${Math.max(c.pct, 1.5)}%;background:${pctColor(c.pct)}"></i><span class="t60"></span></span><span class="v">${c.c}/${c.n}</span></div>`;
    });
    const t = Object.entries(sc.res).map(([k, r]) => `<div class="stat"><span class="v" style="font-size:15px">${r.time ? fmtMin(r.time / r.n) : "–"}</span><span class="k">ต่อข้อ · ${SECS[k].short}</span></div>`).join("");
    return `<div class="ov">
      <div class="ov-left">
        <section class="card dark"><div class="scorebox"><div><div class="cap">คะแนนรวม</div><div class="total">${sc.total}<small> / 200</small></div>
          <div class="dim" style="font-size:13px;margin-top:6px">ใช้เวลา ${fmtTime(S.used)}${S.timeout ? " · หมดเวลา" : ""} · ${thDate(S.at)}</div></div>
          <div class="stamp ${sc.pass ? "pass" : "fail"}">${sc.pass ? "สอบผ่าน" : "ไม่ผ่าน"}</div></div></section>
        <section class="card scroll" style="display:grid;gap:10px;align-content:start">
          <h2 style="margin:0">ผลรายวิชา <span class="dim" style="font-size:12px;font-weight:500">ต้องผ่านครบ 3 วิชา</span></h2>
          <div class="subjects">${subj}</div>
          <div class="timebox">${t}</div>
          <button class="btn primary" data-act="tab" data-v="analysis">ดูบทวิเคราะห์และแผนพัฒนา ›</button>
        </section>
      </div>
      <section class="card scroll"><h2>คะแนนรายหัวข้อ <span class="legend"><span><i style="background:var(--good)"></i>≥75%</span><span><i style="background:var(--accent)"></i>60–74%</span><span><i style="background:var(--warn)"></i>40–59%</span><span><i style="background:var(--bad)"></i>&lt;40%</span></span></h2><div class="catchart">${rows}</div></section>
    </div>`;
  }

  function tabAnalysis(sc, an) {
    const hist = store.get(LS.history, []).filter((h) => h.at < S.at);
    const prev = hist.length ? hist[hist.length - 1] : null;
    const delta = prev ? sc.total - prev.total : null;
    const strongHtml = an.strong.length ? an.strong.map((c) => `<div class="sitem"><span>${esc(c.cat)}</span><span class="mono">${c.pct.toFixed(0)}%</span></div>`).join("") : `<div class="empty">ยังไม่มีหัวข้อที่ได้ 75% ขึ้นไป</div>`;
    const fairHtml = an.fair.map((c) => `<div class="sitem mid"><span>${esc(c.cat)}</span><span class="mono">${c.pct.toFixed(0)}%</span></div>`).join("");
    const TOP = 3;
    const weakHtml = an.weak.length ? an.weak.slice(0, TOP).map((c, i) => {
      const tips = (TIPS[c.cat] || ["ทบทวนเนื้อหาหัวข้อนี้และทำแบบฝึกหัดเพิ่ม"]).slice(0, 2);
      const wrongs = c.wrong.concat(c.blank).sort((a, b) => a - b);
      return `<div class="witem"><div class="wt"><span class="rank">${i + 1}</span><b>${esc(c.cat)}</b><span class="pill ${c.pct < 40 ? "bad" : "warn"}">${c.c}/${c.n} · ${c.pct.toFixed(0)}%</span><span class="dim" style="font-size:12.5px">${SECS[c.sec].short} · เสีย ${c.lost} คะแนน</span></div>
        <ul>${tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
        <div style="font-size:12.5px" class="dim">ดูเฉลยข้อ: ${wrongs.slice(0, 10).map((n) => `<button class="btn ghost sm" style="padding:0 5px" data-act="jump" data-q="${n}">${n + 1}</button>`).join("")}</div></div>`;
    }).join("") + (an.weak.length > TOP ? `<div class="cap" style="margin-top:4px">หัวข้อที่ควรเสริมรองลงมา (กดเพื่อดูคำแนะนำ)</div><div class="wchips">${an.weak.slice(TOP).map((c, i) => `<button class="wchip" data-act="tipcat" data-v="${esc(c.sec + "|" + c.cat)}"><b>${i + TOP + 1}.</b> ${esc(c.cat)} <span class="mono" style="color:${pctColor(c.pct)}">${c.pct.toFixed(0)}%</span></button>`).join("")}</div>` : "") : `<div class="empty">ทุกหัวข้อได้ 60% ขึ้นไป ยอดเยี่ยม</div>`;
    const gaps = Object.entries(sc.res).map(([k, r]) => { const m = r.needQ - r.correct; return `<div><span>${SECS[k].short}</span><span class="${m > 0 ? "" : "dim"}">${m > 0 ? `<b style="color:var(--bad)">ต้องถูกเพิ่ม ${m} ข้อ</b>` : `ผ่านแล้ว (เผื่อ ${-m} ข้อ)`}</span></div>`; }).join("");
    const weeks = planWeeks(sc, an).map(([a, b]) => `<div class="week"><b>${a}</b><span>${esc(b)}</span></div>`).join("");
    const tadv = timeAdvice(sc).map((t) => `<li>${esc(t)}</li>`).join("");
    return `<div class="an">
      <section class="card"><h2>สรุปและจุดแข็ง</h2><div class="scroll">
        <div class="summary">${esc(summaryText(sc, an))}${delta !== null ? `<br><span class="pill ${delta >= 0 ? "good" : "bad"}" style="margin-top:6px">${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)} คะแนน จากครั้งก่อน (${prev.total})</span>` : ""}</div>
        <div class="cap" style="margin-bottom:6px">จุดแข็ง (75% ขึ้นไป)</div><div class="slist">${strongHtml}</div>
        ${fairHtml ? `<div class="cap" style="margin:12px 0 6px">พอใช้ (60–74%) รักษาระดับไว้</div><div class="slist">${fairHtml}</div>` : ""}
      </div></section>
      <section class="card"><h2>จุดอ่อนที่ควรเสริม <span class="dim" style="font-size:12px;font-weight:500">เรียงตามคะแนนที่เสียและผลต่อการผ่านเกณฑ์</span></h2><div class="scroll" style="display:grid;gap:8px;align-content:start">${weakHtml}</div></section>
      <section class="card"><h2>แผนพัฒนา 4 สัปดาห์</h2><div class="scroll">
        <div class="cap" style="margin-bottom:6px">ระยะห่างจากเกณฑ์ผ่าน</div><div class="gap">${gaps}</div>
        <div class="plan">${weeks}</div>
        <div class="cap" style="margin:12px 0 4px">การบริหารเวลาและเทคนิค</div><ul style="margin:0;padding-left:18px;font-size:13.5px;color:var(--ink-2)">${tadv}</ul>
      </div></section>
    </div>`;
  }

  function rvList() {
    return Q.map((q, i) => i).filter((i) => {
      const a = S.answers[i];
      if (rvFilter === "wrong") return a !== null && a !== Q[i].ans;
      if (rvFilter === "blank") return a === null;
      if (rvFilter === "flag") return S.flags.includes(i);
      return true;
    });
  }
  function tabReview() {
    const list = rvList();
    if (!list.includes(rvCur) && list.length) rvCur = list[0];
    const cells = Object.entries(SECS).map(([k, s]) => {
      let h = `<div class="ng-label"><span>${s.short}</span></div><div class="numgrid">`;
      for (let i = s.from; i < s.from + s.n; i++) {
        const a = S.answers[i];
        let c = "cell" + (a === null ? "" : a === Q[i].ans ? " ok" : " ng") + (i === rvCur ? " cur" : "") + (S.flags.includes(i) ? " flag" : "");
        const dim = list.includes(i) ? "" : ' style="opacity:.25"';
        h += `<button class="${c}"${dim} data-act="rv" data-q="${i}">${i + 1}</button>`;
      }
      return h + "</div>";
    }).join("");
    const counts = { all: 100, wrong: Q.filter((q, i) => S.answers[i] !== null && S.answers[i] !== q.ans).length, blank: S.answers.filter((a) => a === null).length, flag: S.flags.length };
    let detail = `<div class="empty" style="padding:20px">ไม่มีข้อในหมวดนี้</div>`;
    if (list.length) {
      const q = Q[rvCur], a = S.answers[rvCur];
      const st = a === null ? '<span class="pill warn">ไม่ได้ตอบ</span>' : a === q.ans ? '<span class="pill good">ตอบถูก</span>' : `<span class="pill bad">ตอบผิด (เลือก ${KEYS[a]})</span>`;
      const inner = `<p class="qtext">${esc(q.q)}</p>${optionsHtml(q, a, true, false)}<div class="explain"><b>เฉลย ${KEYS[q.ans]}.</b> ${esc(q.exp)}</div>`;
      const pos = list.indexOf(rvCur);
      detail = `<div class="qhead"><span class="qno">ข้อ ${rvCur + 1}</span>${st}<span class="pill info">${esc(q.cat)}</span><span class="sec">${SECS[q.sec].name}</span></div>
        ${questionBody(q, inner)}
        <div class="qnav"><button class="btn" data-act="rvprev" ${pos <= 0 ? "disabled" : ""}>‹ ก่อนหน้า</button><span class="spacer"></span><span class="dim" style="font-size:13px">${pos + 1} / ${list.length}</span><span class="spacer"></span><button class="btn primary" data-act="rvnext" ${pos >= list.length - 1 ? "disabled" : ""}>ถัดไป ›</button></div>`;
    }
    return `<div class="rv">
      <section class="card rv-left">
        <div class="seg" role="group">${[["all", "ทั้งหมด"], ["wrong", "ผิด"], ["blank", "ไม่ตอบ"], ["flag", "ทบทวน"]].map(([k, t]) => `<button data-act="rvf" data-v="${k}" aria-pressed="${rvFilter === k}">${t} <span class="mono dim">${counts[k]}</span></button>`).join("")}</div>
        <div class="numgrid-wrap">${cells}</div>
        <div class="legend"><span><i style="background:var(--good)"></i>ถูก</span><span><i style="background:var(--bad)"></i>ผิด</span><span><i></i>ไม่ตอบ</span><span><i style="background:var(--warn);border-radius:50%"></i>ทบทวน</span></div>
      </section>
      <section class="card rv-detail qpanel">${detail}</section>
    </div>`;
  }

  function showTip(key) {
    const sc = score(S, Q); const c = sc.cats.find((x) => x.sec + "|" + x.cat === key); if (!c) return;
    const wrongs = c.wrong.concat(c.blank).sort((a, b) => a - b);
    const back = document.createElement("div"); back.className = "modal-back";
    back.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><h3>${esc(c.cat)} <span class="pill ${c.pct < 40 ? "bad" : "warn"}">${c.c}/${c.n} · ${c.pct.toFixed(0)}%</span></h3>
      <ul style="margin:0;padding-left:18px;color:var(--ink-2)">${(TIPS[c.cat] || ["ทบทวนเนื้อหาหัวข้อนี้และทำแบบฝึกหัดเพิ่ม"]).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
      <div class="dim" style="font-size:13px">ข้อที่ผิด/ไม่ได้ตอบ: ${wrongs.map((n) => n + 1).join(", ") || "-"}</div>
      <div class="acts">${wrongs.length ? `<button class="btn" data-m="go">ดูเฉลยข้อ ${wrongs[0] + 1}</button>` : ""}<button class="btn primary" data-m="close">ปิด</button></div></div>`;
    document.body.appendChild(back);
    back.addEventListener("click", (e) => { const b = e.target.closest("[data-m]"); if (e.target === back || (b && b.dataset.m === "close")) back.remove(); else if (b && b.dataset.m === "go") { back.remove(); rvCur = wrongs[0]; rvFilter = "all"; tab = "review"; renderResult(); } });
  }

  // ======================= events =======================
  $app.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el) return;
    const v = el.dataset.v, act = el.dataset.act;
    switch (act) {
      case "theme": prefs.theme = v; savePrefs(); applyTheme(); (view === "login" ? renderLogin : renderHome)(); break;
      case "authtab": authTab = v; authErr = ""; renderLogin(); break;
      case "pwshow": { const i = document.getElementById("f-pass"); const show = i.type === "password"; i.type = show ? "text" : "password"; el.textContent = show ? "ซ่อน" : "แสดง"; const i2 = document.getElementById("f-pass2"); if (i2) i2.type = i.type; break; }
      case "guest": store.set(LS_AUTH, "guest"); bindUser({ id: "guest" }); renderHome(); break;
      case "logout": logout(); break;
      case "pick": prefs.year = +el.dataset.y; savePrefs(); renderHome(); break;
      case "level": prefs.level = v; savePrefs(); renderHome(); break;
      case "mode": prefs.mode = v; savePrefs(); renderHome(); break;
      case "start": startExam(); break;
      case "practice": prefs.mode = "practice"; savePrefs(); startExam(); break;
      case "resume": resumeExam(); break;
      case "openres": openResult(+el.dataset.id); break;
      case "pause": save(); S = null; renderHome(); break;
      case "home": S = null; renderHome(); break;
      case "again": prefs.year = S.year; prefs.level = S.level; prefs.mode = S.mode; savePrefs(); startExam(); break;
      case "answer": setAnswer(+el.dataset.i); break;
      case "goto": sideOpen = false; go(+el.dataset.q); break;
      case "prev": go(S.cur - 1); break;
      case "next": go(S.cur + 1); break;
      case "flag": toggleFlag(); break;
      case "side": sideOpen = !sideOpen; document.querySelector(".side").classList.toggle("open", sideOpen); break;
      case "submit": confirmSubmit(); break;
      case "tab": tab = v; renderResult(); break;
      case "rvf": rvFilter = v; renderResult(); break;
      case "rv": rvCur = +el.dataset.q; if (!rvList().includes(rvCur)) rvFilter = "all"; renderResult(); break;
      case "tipcat": showTip(v); break;
      case "jump": rvCur = +el.dataset.q; rvFilter = "all"; tab = "review"; renderResult(); break;
      case "rvprev": case "rvnext": { const l = rvList(), p = l.indexOf(rvCur) + (act === "rvnext" ? 1 : -1); if (l[p] !== undefined) { rvCur = l[p]; renderResult(); } break; }
    }
  });

  document.addEventListener("keydown", (e) => {
    if (document.querySelector(".modal-back")) { if (e.key === "Escape") document.querySelector(".modal-back").remove(); return; }
    if (view === "exam" && S && !S.done) {
      if (["1", "2", "3", "4"].includes(e.key)) setAnswer(+e.key - 1);
      else if (e.key === "ArrowRight") go(S.cur + 1);
      else if (e.key === "ArrowLeft") go(S.cur - 1);
      else if (e.key === "f" || e.key === "F") toggleFlag();
    } else if (view === "result" && tab === "review") {
      const l = rvList(), p = l.indexOf(rvCur);
      if (e.key === "ArrowRight" && l[p + 1] !== undefined) { rvCur = l[p + 1]; renderResult(); }
      if (e.key === "ArrowLeft" && l[p - 1] !== undefined) { rvCur = l[p - 1]; renderResult(); }
    }
  });
  window.addEventListener("beforeunload", () => { if (view === "exam" && S && !S.done) save(); });

  (function boot() {
    const a = store.get(LS_AUTH, null);
    const users = store.get(LS_USERS, {});
    if (a === "guest") { bindUser({ id: "guest" }); renderHome(); }
    else if (a && users[a]) { bindUser({ id: a, name: users[a].name }); renderHome(); }
    else renderLogin();
  })();
})();
