const params = new URLSearchParams(location.search);
const userId = params.get("user");

if (!userId) {
  document.body.textContent = "ユーザー指定がありません";
  throw new Error("no user");
}

function toMin(t) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

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
  const d = new Date(dateStr);
  return d >= start && d <= end;
}

const data = JSON.parse(localStorage.getItem("timecard-data") || "[]");
const user = data.find(u => String(u.id) === userId);

if (!user) {
  document.body.textContent = "該当する人が見つかりません";
  throw new Error("no user data");
}

const { start, end, label } = getClosingPeriod();

let totalMin = 0;
user.records.forEach(r => {
  if (!isInPeriod(r.date, start, end)) return;
  totalMin += Math.max(0, toMin(r.end) - toMin(r.start) - (r.break || 0));
});

const hours = totalMin / 60;
const money = Math.floor(hours * user.wage);

document.getElementById("name").textContent = user.name;
document.getElementById("month").textContent = `${label}（20日締め）`;
document.getElementById("total").textContent = `${hours.toFixed(2)} 時間`;
document.getElementById("money").textContent = `¥ ${money.toLocaleString()}`;
