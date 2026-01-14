// ================================
// 勤怠管理 script.js（最終安定版）
// ================================

// ===== データ =====
let data = JSON.parse(localStorage.getItem("timecard-data") || "[]");

// ===== DOM取得 =====
const $ = id => document.getElementById(id);

const userName = $("userName");
const userWage = $("userWage");
const userSelect = $("userSelect");
const records = $("records");
const summary = $("summary");
const monthlySummary = $("monthlySummary");
const viewUrlBox = $("viewUrl");

const dateInput = $("date");
const startInput = $("start");
const endInput = $("end");
const breakInput = $("breakTime");
const memoInput = $("memo");

// ===== 保存 =====
function save() {
  localStorage.setItem("timecard-data", JSON.stringify(data));
}

// ===== 共通 =====
function toMin(t) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function getUser() {
  return data.find(u => String(u.id) === userSelect.value);
}

// ===== 20日締め =====
function getClosingPeriod() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  let start, end, labelYear, labelMonth;

  if (d <= 20) {
    start = new Date(y, m - 1, 21);
    end = new Date(y, m, 20);
    labelYear = y;
    labelMonth = m + 1;
  } else {
    start = new Date(y, m, 21);
    end = new Date(y, m + 1, 20);
    labelYear = m === 11 ? y + 1 : y;
    labelMonth = m === 11 ? 1 : m + 2;
  }

  return {
    start,
    end,
    label: `${labelYear}-${String(labelMonth).padStart(2, "0")}`
  };
}

function isInPeriod(dateStr, start, end) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= start && d <= end;
}

// ===== スタッフ =====
function addUser() {
  if (!userName.value || !userWage.value) return;

  data.push({
    id: Date.now(),
    name: userName.value,
    wage: Number(userWage.value),
    records: []
  });

  userName.value = "";
  userWage.value = "";
  save();
  render();
}

function editUser() {
  const u = getUser();
  if (!u) return;

  const name = prompt("名前", u.name);
  const wage = prompt("時給", u.wage);

  if (name) u.name = name;
  if (wage) u.wage = Number(wage);

  save();
  render();
}

function deleteUser() {
  const u = getUser();
  if (!u) return;
  if (!confirm(`${u.name} を削除しますか？`)) return;

  data = data.filter(x => x.id !== u.id);
  save();
  render();
}

// ===== 勤務 =====
function addRecord() {
  const u = getUser();
  if (!u) return;
  if (!dateInput.value || !startInput.value || !endInput.value) return;

  u.records.push({
    date: dateInput.value,
    start: startInput.value,
    end: endInput.value,
    break: Number(breakInput.value) || 0,
    memo: memoInput.value || ""
  });

  dateInput.value = "";
  startInput.value = "";
  endInput.value = "";
  breakInput.value = "";
  memoInput.value = "";

  save();
  render();
}

function deleteRecord(index) {
  const u = getUser();
  if (!u) return;

  u.records.splice(index, 1);
  save();
  render();
}

// ===== 閲覧URL =====
function renderViewUrl() {
  if (!viewUrlBox) return;

  const base =
    location.origin + location.pathname.replace("index.html", "");

  const u = getUser();

  if (!u) {
    viewUrlBox.textContent =
      "スタッフを選択すると、ここに閲覧専用URLが表示されます";
    return;
  }

  viewUrlBox.textContent = `${base}view.html?user=${u.id}`;
}

function copyViewUrl() {
  if (!viewUrlBox) return;

  const text = viewUrlBox.textContent;
  if (!text || text.includes("スタッフを選択")) {
    alert("スタッフを選択してください");
    return;
  }

  navigator.clipboard.writeText(text);
  alert("URLをコピーしました");
}

// ===== 描画 =====
function render() {
  const selectedId = userSelect.value;

  userSelect.innerHTML = "";
  data.forEach(u => {
    const opt = document.createElement("option");
    opt.value = u.id;
    opt.textContent = u.name;
    userSelect.appendChild(opt);
  });

  if (selectedId) {
    userSelect.value = selectedId;
  } else if (data.length > 0) {
    userSelect.value = data[0].id;
  }

  const { start, end, label } = getClosingPeriod();
  summary.textContent = `${label}（20日締め）`;

  const u = getUser();
  if (!u) {
    records.innerHTML = "";
    monthlySummary.innerHTML = "";
    renderViewUrl();
    return;
  }

  let totalMin = 0;
  records.innerHTML =
    "<tr><th>日付</th><th>時間</th><th>休憩</th><th></th></tr>";

  u.records.forEach((r, i) => {
    if (!isInPeriod(r.date, start, end)) return;

    const work =
      Math.max(0, toMin(r.end) - toMin(r.start) - (r.break || 0));
    totalMin += work;

    records.innerHTML += `
      <tr>
        <td>${r.date}</td>
        <td>${r.start}〜${r.end}</td>
        <td>${r.break}</td>
        <td><button onclick="deleteRecord(${i})">削除</button></td>
      </tr>`;
  });

  const hours = totalMin / 60;
  const money = Math.floor(hours * u.wage);

  summary.textContent =
    `${label}（20日締め） 合計 ${hours.toFixed(2)} 時間 / ¥${money.toLocaleString()}`;

  renderMonthlySummary();
  renderViewUrl();
}

// ===== 人別給与 =====
function renderMonthlySummary() {
  monthlySummary.innerHTML = "";
  const { start, end } = getClosingPeriod();

  data.forEach(u => {
    let min = 0;
    u.records.forEach(r => {
      if (!isInPeriod(r.date, start, end)) return;
      min += Math.max(
        0,
        toMin(r.end) - toMin(r.start) - (r.break || 0)
      );
    });

    const h = min / 60;
    const m = Math.floor(h * u.wage);

    const div = document.createElement("div");
    div.textContent = `${u.name}：${h.toFixed(2)} 時間 / ¥${m.toLocaleString()}`;
    monthlySummary.appendChild(div);
  });
}

// ===== 初期化 =====
window.onload = render;
