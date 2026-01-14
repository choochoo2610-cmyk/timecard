// ===== データ =====
let data = JSON.parse(localStorage.getItem("timecard-data") || "[]");

// ★ 既存データ救済（超重要）
data.forEach(u => {
  if (!u.fixedMonths) u.fixedMonths = {};
  if (!Array.isArray(u.records)) u.records = [];
});

// ===== DOM =====
const userName = document.getElementById("userName");
const userWage = document.getElementById("userWage");
const userSelect = document.getElementById("userSelect");
const monthSelect = document.getElementById("monthSelect");
const recordsTable = document.getElementById("records");
const summary = document.getElementById("summary");
const viewUrl = document.getElementById("viewUrl");

const dateInput = document.getElementById("date");
const startInput = document.getElementById("start");
const endInput = document.getElementById("end");
const breakTime = document.getElementById("breakTime");
const memo = document.getElementById("memo");

// ===== 共通 =====
function save() {
  localStorage.setItem("timecard-data", JSON.stringify(data));
}

function getUser() {
  return data.find(u => String(u.id) === userSelect.value);
}

function toMin(t) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// ===== 20日締め =====
function inClosingMonth(dateStr, monthStr) {
  if (!monthStr) return true;

  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(dateStr);

  const start = new Date(y, m - 1, 21);
  const end = new Date(y, m, 20);

  return d >= start && d <= end;
}

// ===== 人 =====
function addUser() {
  if (!userName.value || !userWage.value) return;

  data.push({
    id: Date.now(),
    name: userName.value,
    wage: Number(userWage.value),
    records: [],
    fixedMonths: {}
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
    break: Number(breakTime.value) || 0,
    memo: memo.value || ""
  });

  memo.value = "";
  save();
  render();
}

function deleteRecord(i) {
  const u = getUser();
  if (!u) return;

  u.records.splice(i, 1);
  save();
  render();
}

// ===== 描画 =====
function render() {
  // 人セレクト
  userSelect.innerHTML = data
    .map(u => `<option value="${u.id}">${u.name}</option>`)
    .join("");

  const u = getUser();
  if (!u) {
    recordsTable.innerHTML = "";
    summary.innerText = "";
    viewUrl.innerText = "";
    return;
  }

  const month = monthSelect.value || "";
  let totalMin = 0;

  recordsTable.innerHTML =
    "<tr><th>日付</th><th>時間</th><th>休憩</th><th>メモ</th><th></th></tr>";

  u.records.forEach((r, i) => {
    if (!inClosingMonth(r.date, month)) return;

    const work =
      Math.max(0, toMin(r.end) - toMin(r.start) - (r.break || 0));

    totalMin += work;

    const fixed = month && u.fixedMonths[month];

    recordsTable.innerHTML += `
      <tr>
        <td>${r.date}</td>
        <td>${r.start}〜${r.end}</td>
        <td>${r.break || 0}分</td>
        <td>${r.memo || ""}</td>
        <td>
          ${fixed ? "" : `<button onclick="deleteRecord(${i})">削除</button>`}
        </td>
      </tr>
    `;
  });

  summary.innerText =
    `合計 ${(totalMin / 60).toFixed(2)} 時間 ／ ¥${Math.floor(
      (totalMin / 60) * u.wage
    )}`;

  const baseUrl =
    location.origin + location.pathname.replace(/\/[^/]*$/, "/");
  viewUrl.innerText = `${baseUrl}view.html?user=${u.id}`;
}

// ===== 月確定 =====
function fixMonth() {
  const u = getUser();
  const month = monthSelect.value;

  if (!u || !month) {
    alert("締め月を選択してください");
    return;
  }

  if (!confirm("この月を確定しますか？")) return;

  u.fixedMonths[month] = true;
  save();
  render();
}

// ===== 初期化 =====
window.onload = render;
