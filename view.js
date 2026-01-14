const params = new URLSearchParams(location.search);
const userId = params.get("user");
if (!userId) {
  document.body.innerText = "ユーザー未指定";
  throw new Error();
}

fetch("./timecard.json")
  .then(r => r.json())
  .then(data => {
    const u = data.find(x => String(x.id) === userId);
    if (!u) throw new Error();

    const now = new Date();
    const m =
      now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");

    let min = 0;
    u.records.forEach(r => {
      if (!r.date.startsWith(m)) return;
      min +=
        Math.max(0,
          (Number(r.end.slice(0,2))*60+Number(r.end.slice(3))) -
          (Number(r.start.slice(0,2))*60+Number(r.start.slice(3))) -
          (r.break || 0)
        );
    });

    document.getElementById("name").innerText = u.name;
    document.getElementById("month").innerText = m;
    document.getElementById("total").innerText =
      (min / 60).toFixed(2) + " 時間";
  })
  .catch(() => {
    document.body.innerText = "データを読み込めません";
  });
