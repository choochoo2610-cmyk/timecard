let data = JSON.parse(localStorage.getItem("timecard-data") || "[]");

const userSelect = document.getElementById("userSelect");
const monthSelect = document.getElementById("monthSelect");
const records = document.getElementById("records");
const summary = document.getElementById("summary");
const viewUrl = document.getElementById("viewUrl");

const userName = document.getElementById("userName");
const userWage = document.getElementById("userWage");

const dateInput = document.getElementById("date");
const startInput = document.getElementById("start");
const endInput = document.getElementById("end");
const breakTime = document.getElementById("breakTime");
const memo = document.getElementById("memo");

let editIndex = null;

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

// 20日締め
function inClosingMonth(dateStr, monthStr) {
  if (!monthStr) return true;
  const d = new Date(dateStr);
  const [y, m] = monthStr.split("-").map(Number);
  return d >= new Date(y, m - 1, 21) && d <= new Date(y, m, 20, 23, 59);
}

// ===== 人 =====
function addUser() {
  if (!userName.value || !userWage.value) return;
  const id = Date.now();
  data.push({ id, name: userName.value, wage: Number(userWage.value), records: [] });
  userSelect.value = id;
  userName.value = userWage.value = "";
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
  if (!u || !confirm("削除しますか？")) return;
  data = data.filter(x => x.id !== u.id);
  save();
  render();
}

// ===== 勤務 =====
function saveRecord() {
  const u = getUser();
  if (!u) return;

  const rec = {
    date: dateInput.value,
    start: startInput.value,
    end: endInput.value,
    break: Number(breakTime.value) || 0,
    memo: memo.value || ""
  };

  if (editIndex !== null) {
    u.records[editIndex] = rec;
    editIndex = null;
  } else {
    u.records.push(rec);
  }

  cancelEdit();
  save();
  render();
}

function editRecord(i) {
  const r = getUser().records[i];
  editIndex = i;
  dateInput.value = r.date;
  startInput.value = r.start;
  endInput.value = r.end;
  breakTime.value = r.break;
  memo.value = r.memo;
}

function deleteRecord(i) {
  getUser().records.splice(i, 1);
  save();
  render();
}

function cancelEdit() {
  editIndex = null;
  dateInput.value = startInput.value = endInput.value = memo.value = "";
  breakTime.value = 0;
}

// ===== 描画 =====
function render() {
  const selected = userSelect.value;

  userSelect.innerHTML = data.map(u =>
    `<option value="${u.id}">${u.name}</option>`
  ).join("");

  if (selected) userSelect.value = selected;

  const u = getUser();
  if (!u) return;

  records.innerHTML = "";
  let totalMin = 0;

  u.records.forEach((r, i) => {
    if (!inClosingMonth(r.date, monthSelect.value)) return;
    const work = Math.max(0, toMin(r.end) - toMin(r.start) - r.break);
    totalMin += work;

    records.innerHTML += `
      <tr>
        <td>${r.date}</td>
        <td>${r.start}〜${r.end}</td>
        <td>${r.break}分</td>
        <td>${r.memo}</td>
        <td>
          <button onclick="editRecord(${i})">編集</button>
          <button class="danger" onclick="deleteRecord(${i})">削除</button>
        </td>
      </tr>`;
  });

  const hours = totalMin / 60;
  summary.innerText = `合計 ${hours.toFixed(2)} 時間 ／ ¥${Math.floor(hours * u.wage)}`;

  const base = location.origin + location.pathname.replace(/\/[^/]*$/, "/");
  viewUrl.innerText = `${base}view.html?user=${u.id}&month=${monthSelect.value}`;
}

function exportData() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "timecard.json";
  a.click();
}

window.onload = render;
