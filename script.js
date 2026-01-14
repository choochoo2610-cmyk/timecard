let users = [];

fetch("./timecard.json")
  .then(res => res.json())
  .then(data => {
    users = data;
    renderUsers();
  });

function renderUsers() {
  const select = document.getElementById("userSelect");
  select.innerHTML = "";
  users.forEach(u => {
    const opt = document.createElement("option");
    opt.value = u.id;
    opt.textContent = u.name;
    select.appendChild(opt);
  });
  renderRecords();
}

function currentUser() {
  const id = Number(userSelect.value);
  return users.find(u => u.id === id);
}

/* ===== 人 ===== */
function addUser() {
  if (!newName.value || !newWage.value) return;

  users.push({
    id: Date.now(),
    name: newName.value,
    wage: Number(newWage.value),
    records: [],
    history: []
  });

  newName.value = "";
  newWage.value = "";
  renderUsers();
}

function deleteUser() {
  const u = currentUser();
  if (!u) return;
  if (!confirm(`${u.name} を削除しますか？`)) return;

  users = users.filter(x => x.id !== u.id);
  renderUsers();
  log("人を削除しました");
}

/* ===== 勤務 ===== */
function addRecord() {
  const u = currentUser();
  if (!u) return;

  u.records.push({
    date: date.value,
    start: start.value,
    end: end.value,
    break: Number(break.value)
  });

  renderRecords();
}

function renderRecords() {
  const u = currentUser();
  const tbody = document.getElementById("recordList");
  tbody.innerHTML = "";
  if (!u) return;

  u.records.forEach((r, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.date}</td>
      <td>${r.start} - ${r.end}</td>
      <td>${r.break}分</td>
      <td>
        <button onclick="editRecord(${i})">編集</button>
        <button onclick="deleteRecord(${i})">削除</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function editRecord(i) {
  const u = currentUser();
  const r = u.records[i];

  const start = prompt("開始", r.start);
  const end = prompt("終了", r.end);
  const brk = prompt("休憩(分)", r.break);

  if (start) r.start = start;
  if (end) r.end = end;
  if (brk !== null) r.break = Number(brk);

  renderRecords();
}

function deleteRecord(i) {
  const u = currentUser();
  if (!confirm("この勤務を削除しますか？")) return;

  u.records.splice(i, 1);
  renderRecords();
}

/* ===== 締め ===== */
function closeMonth() {
  const month = closeMonthInput.value;
  if (!month) return;

  users.forEach(u => {
    if (u.records.length === 0) return;
    u.history.push({ month, records: u.records });
    u.records = [];
  });

  renderRecords();
  log("締め完了 → JSON保存してください");
}

/* ===== 出力 ===== */
function downloadJSON() {
  const blob = new Blob(
    [JSON.stringify(users, null, 2)],
    { type: "application/json" }
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "timecard.json";
  a.click();
}

function log(msg) {
  document.getElementById("log").textContent = msg;
}
