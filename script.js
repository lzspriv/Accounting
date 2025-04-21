const apiUrl = "https://script.google.com/macros/s/AKfycbzWF2iYrp7gQxxDeQmmTRxDfLClRGIL5twTiFsMEYbfYhSBZu-cTMOsPA4at8qyX3GoIw/exec";

const form = document.getElementById("recordForm");
const recordsContainer = document.getElementById("records");
const monthInput = document.getElementById("month");
const recordsView = document.getElementById("records-view");
const chartView = document.getElementById("report-view");
const showRecordsBtn = document.getElementById("view-records");
const showChartBtn = document.getElementById("view-report");


let rawData = [];

// 讀取資料並儲存
async function fetchData() {
    const response = await fetch(apiUrl);
    const data = await response.json();
    rawData = data.slice(1); // 移除標題列
    loadRecords();
}

function loadRecords() {
    recordsContainer.innerHTML = "";
    let totalAmount = 0;
    const selectedMonth = monthInput.value;

    for (let [date, category, amount, note] of rawData) {
        const recordMonth = date.substring(0, 7);
        if (selectedMonth && recordMonth !== selectedMonth) continue;

        const recordElement = document.createElement("div");
        recordElement.classList.add("record");
        const formattedDate = new Date(date).toLocaleDateString("zh-TW", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            weekday: "long"  // 加上這行會顯示星期幾
        });        
        recordElement.innerHTML = `
            <p><strong>日期：</strong>${formattedDate}</p>
            <p><strong>類別：</strong>${category}</p>
            <p><strong>金額：</strong>${amount}</p>
            <p><strong>備註：</strong>${note}</p>
        `;
        recordsContainer.appendChild(recordElement);
        totalAmount += Number(amount);
    }

    let totalElement = document.getElementById("totalAmount");
    if (!totalElement) {
        totalElement = document.createElement("div");
        totalElement.id = "totalAmount";
        recordsContainer.prepend(totalElement);
    }
    totalElement.innerHTML = `<h3>總支出：${totalAmount} 元</h3>`;
}

// 送出表單時處理的邏輯
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const date = document.getElementById("date").value;
    const category = document.getElementById("category").value;
    const amount = Number(document.getElementById("amount").value);
    const note = document.getElementById("note").value;

    if (isNaN(amount) || amount < 0) {
        alert("請輸入有效的金額");
        return;
    }

    const newRecord = { date, category, amount, note };

    await fetch(apiUrl, {
        method: "POST",
        body: JSON.stringify(newRecord),
        headers: { "Content-Type": "application/json" },
        mode: "no-cors"
    });

    form.reset();
    alert("記帳成功！（請到 Google Sheets 查看資料）");

    setDefaultDate(); // ← 關鍵！設定下一筆預設日期
    setTimeout(fetchData, 2000);
});

// 切換視圖
showRecordsBtn.addEventListener("click", () => {
    chartView.style.display = "none";
    recordsView.style.display = "block";
    loadRecords();
});

showChartBtn.addEventListener("click", () => {
    recordsView.style.display = "none";
    chartView.style.display = "block";
    renderChart();
});

monthInput.addEventListener("change", () => {
    loadRecords();   // 更新紀錄
    renderChart();   // 更新圖表
});



// 渲染圖表
function renderChart() {
    const selectedMonth = monthInput.value;
    const categoryTotals = {};
    let totalAmount = 0;

    for (let [date, category, amount] of rawData) {
        const recordMonth = date.substring(0, 7);
        if (selectedMonth && recordMonth !== selectedMonth) continue;
        amount = Number(amount);
        totalAmount += amount;
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    }

    const ctx = document.getElementById("categoryChart").getContext("2d");
    if (window.categoryChartInstance) {
        window.categoryChartInstance.destroy();
    }

    window.categoryChartInstance = new Chart(ctx, {
        type: "pie",
        data: {
            labels: Object.keys(categoryTotals),
            datasets: [{
                data: Object.values(categoryTotals),
                backgroundColor: ["#FFB5A7", "#B5EAD7", "#CBAACB", "#FFDAC1"]
            }]
        },
        options: {
            layout: {
                padding: {
                    top: 20,
                    bottom: 20,
                    left: 20,
                    right: 20
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `支出分類比例 (${selectedMonth || "全部"})`,
                    font: {
                        size: 18
                    }
                },
                legend: {
                    labels: {
                        font: {
                            size: 14
                        },
                        color: "#333"
                    }
                }
            }
        }
    });
}


function setDefaultDate() {
    const now = new Date();

    // 取得 UTC 時間 + 8 小時 = 台北時間
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const taipeiTime = new Date(utc + 8 * 60 * 60000);

    const hours = taipeiTime.getHours();
    if (hours < 4) {
        taipeiTime.setDate(taipeiTime.getDate() - 1);
    }

    const formattedDate = taipeiTime.toISOString().split("T")[0];
    document.getElementById("date").value = formattedDate;
}


// 載入時執行
window.addEventListener("load", () => {
    setDefaultDate();
    fetchData(); // 資料載入函數
});




