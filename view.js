const params = new URLSearchParams(location.search);
const userId = Number(params.get("user"));

fetch("./timecard.json")
  .then(res => res.json())
  .then(data => {
    const u = data.find(x => x.id === userId);
    if (!u) {
      document.body.innerHTML = "データが見つかりません";
      return;
    }

    document.getElementById("name").textContent = u.name;

    let totalMin = 0;
    const tbody = document.getElementById("list");

    u.records.forEach(r => {
      const work =
        toMin(r.end) - toMin(r.start) - (r.break || 0);
      totalMin += work;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.date}</td>
        <td>${r.start}〜${r.end}</td>
        <td>${r.break}分</td>
      `;
      tbody.appendChild(tr);
    });

    document.getElementById("total").textContent =
      `合計 ${(totalMin / 60).toFixed(2)} 時間`;
  });

function toMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
