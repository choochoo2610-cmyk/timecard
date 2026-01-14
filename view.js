const p = new URLSearchParams(location.search);
const userId = p.get("user");
const month = p.get("month");

fetch("timecard.json")
  .then(r => r.json())
  .then(data => {
    const u = data.find(x => String(x.id) === userId);
    if (!u) return;

    let total = 0;
    u.records.forEach(r => {
      if (month && !r.date.startsWith(month)) return;
      const s = r.start.split(":");
      const e = r.end.split(":");
      total += (e[0]*60+ +e[1]) - (s[0]*60+ +s[1]) - (r.break||0);
    });

    document.getElementById("name").innerText = u.name;
    document.getElementById("total").innerText = (total/60).toFixed(2)+" 時間";
    document.getElementById("month").innerText = month || "";
  });
