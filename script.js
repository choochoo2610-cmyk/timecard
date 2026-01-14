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
}

function addUser() {
  const name = document.getElementById("newName").value;
  const wage = Number(document.getElementById("newWage").value);
  if (!name || !wage) return;

  users.push({
    id: Date.now(),
    name,
    wage,
    records: [],
    history: []
  });

  renderUsers();
}

function addRecord() {
  const userId = Number(document.getElementById("userSelect").value);
  const user = users.find(u => u.id === userId);
  if (!user) return;

  user.records.push({
    date: date.value,
    start: start.value,
    end: end.value,
    break: Number(break.value),
    memo: ""
  });

  log("勤務追加しました");
}

function closeMonth() {
  const month = document.getElementById("closeMonth").value;
  if (!month) return;

  users.forEach(u => {
    if (u.records.length === 0) return;
    u.history.push({
      month,
      records: u.records
    });
    u.records = [];
  });

  log("締め処理完了（JSON保存してください）");
}

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
