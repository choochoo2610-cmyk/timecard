const staffSelect = document.getElementById("staff");
const data = JSON.parse(localStorage.getItem("timecard-data") || "[]");

// スタッフ一覧
data.forEach(u => {
  const opt = document.createElement("option");
  opt.value = u.id;
  opt.textContent = u.name;
  staffSelect.appendChild(opt);
});

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nowTime() {
  return new Date().toTimeString().slice(0, 5);
}

function getUser() {
  return data.find(u => String(u.id) === staffSelect.value);
}

function clockIn() {
  const u = getUser();
  if (!u) return alert("スタッフを選択してください");

  u.records.push({
    date: today(),
    start: nowTime(),
    end: "",
    break: 0,
    memo: "打刻"
  });

  save();
  alert("出勤しました");
}

function clockOut() {
  const u = getUser();
  if (!u) return alert("スタッフを選択してください");

  const r = [...u.records].reverse().find(r => !r.end);
  if (!r) return alert("出勤記録がありません");

  r.end = nowTime();
  save();
  alert("退勤しました");
}

function save() {
  localStorage.setItem("timecard-data", JSON.stringify(data));
}
