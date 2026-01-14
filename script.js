// ===== データ =====
let data = JSON.parse(localStorage.getItem("timecard-data") || "[]");

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
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// ===== 20日締め判定 =====
function inClosingMonth(dateStr, monthStr) {
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
  if (!u || !dateInput.value) return;

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
  userSelect.innerHTML = data.map(u =>
    `<option value="${u.id}">${u.name}</option>`
  ).join("");

  const u = getUser();
  if (!u) return;

  const month = monthSelect.value;
  let totalMin = 0;

  recordsTable.innerHTML =
    "<tr><th>日付</th><th>時間</th><th>休憩</th><th>メモ</th><th></th></tr>";

  u.records.forEach((r, i) => {
    if (month && !inClosingMonth(r.date, month)) return;

    const work = Math.max(
      0,
      toMin(r.end) - toMin(r.start) - (r.break || 0)
    );

    totalMin += work;

    recordsTable.innerHTML += `
      <tr>
        <td>${r.date}</td>
        <td>${r.start}〜${r.end}</td>
        <td>${r.break}分</td>
        <td>${r.memo}</td>
        <td>
          ${u.fixedMonths[month] ? "" : `<button onclick="deleteRecord(${i})">削除</button>`}
        </td>
      </tr>`;
  });

  summary.innerText =
    `合計 ${(totalMin / 60).toFixed(2)} 時間 ／ ¥${Math.floor((totalMin / 60) * u.wage)}`;

  const baseUrl = location.origin + location.pathname.replace(/\/[^/]*$/, "/");
  viewUrl.innerText = `${baseUrl}view.html?user=${u.id}`;
}

// ===== 月確定 =====
function fixMonth() {
  const u = getUser();
  if (!u || !monthSelect.value) return;

  if (!confirm("この月を確定しますか？")) return;

  u.fixedMonths[monthSelect.value] = true;
  save();
  render();
}

// ===== PDF給与明細 =====
function exportUserMonth() {
  const u = getUser();
  const month = monthSelect.value;
  if (!u || !month || !u.fixedMonths[month]) {
    alert("先に月を確定してください");
    return;
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  let y = 20;
  let totalMin = 0;

  pdf.text(`給与明細`, 20, y);
  y += 10;
  pdf.text(`氏名：${u.name}`, 20, y);
  y += 10;
  pdf.text(`対象月：${month}（20日締め）`, 20, y);
  y += 10;

  u.records.forEach(r => {
    if (!inClosingMonth(r.date, month)) return;

    const work = Math.max(
      0,
      toMin(r.end) - toMin(r.start) - (r.break || 0)
    );
    totalMin += work;

    pdf.text(
      `${r.date} ${r.start}-${r.end} 休憩${r.break}分`,
      20,
      y
    );
    y += 8;
  });

  const hours = (totalMin / 60).toFixed(2);
  const pay = Math.floor(hours * u.wage);

  y += 10;
  pdf.text(`労働時間：${hours} 時間`, 20, y);
  y += 10;
  pdf.text(`支給額：¥${pay}`, 20, y);

  pdf.save(`${u.name}_${month}_給与明細.pdf`);
}

window.onload = render;
