// ===== データ =====
let data = JSON.parse(localStorage.getItem("timecard-data") || "[]");

// ===== DOM =====
const userName = document.getElementById("userName");
const userWage = document.getElementById("userWage");
const userSelect = document.getElementById("userSelect");
const monthSelect = document.getElementById("monthSelect");
const records = document.getElementById("records");
const summary = document.getElementById("summary");
const dateInput = document.getElementById("date");
const startInput = document.getElementById("start");
const endInput = document.getElementById("end");
const breakTime = document.getElementById("breakTime");
const memo = document.getElementById("memo");
const viewUrl = document.getElementById("viewUrl");

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

// ===== 人管理 =====
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

  const n = prompt("名前", u.name);
  const w = prompt("時給", u.wage);
  if (n) u.name = n;
  if (w) u.wage = Number(w);

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
  userSelect.innerHTML = data
    .map(u => `<option value="${u.id}">${u.name}</option>`)
    .join("");

  const u = getUser();
  if (!u) {
    records.innerHTML = "";
    summary.innerText = "";
    viewUrl.innerText = "";
    return;
  }

  const month = monthSelect.value || "";
  let totalMin = 0;

  records.innerHTML =
    "<tr><th>日付</th><th>時間</th><th>休憩</th><th>メモ</th><th></th></tr>";

  u.records.forEach((r, i) => {
    if (month && !r.date.startsWith(month)) return;

    const work =
      Math.max(0, toMin(r.end) - toMin(r.start) - (r.break || 0));
    totalMin += work;

    const fixed =
      month && u.fixedMonths && u.fixedMonths[month];

    records.innerHTML += `
      <tr>
        <td>${r.date}</td>
        <td>${r.start}〜${r.end}</td>
        <td>${r.break}分</td>
        <td>${r.memo}</td>
        <td>${fixed ? "" : `<button onclick="deleteRecord(${i})">削除</button>`}</td>
      </tr>
    `;
  });

  summary.innerText = `合計 ${(totalMin / 60).toFixed(2)} 時間`;

  const base =
    location.origin + location.pathname.replace(/\/[^/]*$/, "/");
  viewUrl.innerText = `${base}view.html?user=${u.id}`;
}

// ===== 月1回確定 =====
function finalizeMonth() {
  const u = getUser();
  if (!u) return;

  const month = monthSelect.value;
  if (!month) {
    alert("月を選択してください");
    return;
  }

  if (!confirm(`${month} を確定しますか？`)) return;

  u.fixedMonths[month] = true;
  save();

  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "timecard.json";
  a.click();
}

// ===== 初期化 =====
window.onload = render;
