const params = new URLSearchParams(location.search);
const userId = Number(params.get("user"));

fetch("./timecard.json")
  .then(res => res.json())
  .then(data => {
    const user = data.find(u => u.id === userId);
    if (!user) return;

    document.getElementById("title").textContent =
      `${user.name} の勤務一覧`;

    let html = "<ul>";
    user.history.forEach(h => {
      html += `<li><b>${h.month}</b><ul>`;
      h.records.forEach(r => {
        html += `<li>${r.date} ${r.start}-${r.end}</li>`;
      });
      html += "</ul></li>";
    });
    html += "</ul>";

    document.getElementById("result").innerHTML = html;
  });
