// ===== URLから user ID を取得 =====
const params = new URLSearchParams(location.search);
const userId = params.get("user");

if (!userId) {
  document.body.innerHTML = "ユーザー指定がありません";
  throw new Error("no user");
}

// ===== 今月 =====
const now = new Date();
const monthStr =
  now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");

// ===== 時刻を分に =====
function toMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// ===== データ取得 =====
fetch("./timecard.json")
  .then(res => {
    if (!res.ok) throw new Error("JSONが見つかりません");
    return res.json();
  })
  .then(data => {
    const user = data.find(u => String(u.id) === userId);
    if (!user) {
      document.body.innerHTML = "該当する人が見つかりません";
      return;
    }

    let totalMin = 0;

    user.records.forEach(r => {
      if (!r.date.startsWith(monthStr)) return;

      const work =
        Math.max(0, toMin(r.end) - toMin(r.start) - (r.break || 0));
      totalMin += work;
    });

    const totalHours = totalMin / 60;
    const totalMoney = Math.floor(totalHours * user.wage);

    // ===== 表示 =====
    document.getElementById("name").innerText = user.name;
    document.getElementById("total").innerText =
      totalHours.toFixed(2) + " 時間";

    document.getElementById("money").innerText =
      "¥ " + totalMoney.toLocaleString();

    document.getElementById("month").innerText =
      monthStr + " の合計勤務";
  })
  .catch(err => {
    document.body.innerHTML = "データを読み込めません";
    console.error(err);
  });
function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // 日本語フォント登録
  doc.addFileToVFS("NotoSansJP.ttf", FONT_BASE64);
  doc.addFont("NotoSansJP.ttf", "NotoSansJP", "normal");
  doc.setFont("NotoSansJP");

  const name = document.getElementById("name").innerText;
  const month = document.getElementById("month").innerText;
  const total = document.getElementById("total").innerText;
  const money = document.getElementById("money").innerText;

  doc.setFontSize(18);
  doc.text("給与明細", 20, 20);

  doc.setFontSize(12);
  doc.text(`氏名：${name}`, 20, 40);
  doc.text(`対象月：${month}`, 20, 55);
  doc.text(`勤務時間：${total}`, 20, 70);
  doc.text(`支給額：${money}`, 20, 85);

  doc.save(`${name}_給与明細.pdf`);
}
