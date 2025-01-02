// API URL for fetching exchange rates
const apiUrl = "https://api.exchangerate.host/latest";
const historicalApiUrl = "https://api.exchangerate.host/timeseries";

// DOM Elements
const fromCurrency = document.getElementById("fromCurrency");
const toCurrency = document.getElementById("toCurrency");
const amount = document.getElementById("amount");
const feeInput = document.getElementById("fee");
const convertBtn = document.getElementById("convertBtn");
const reverseBtn = document.getElementById("reverseBtn");
const result = document.getElementById("result");
const chartCanvas = document.getElementById("chart");

let exchangeRateChart; // Global variable for the Chart.js instance

// Function to populate currency dropdowns
async function populateCurrencies() {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Failed to fetch currency data.");

        const data = await response.json();
        const currencies = Object.keys(data.rates);

        currencies.forEach((currency) => {
            const optionFrom = document.createElement("option");
            optionFrom.value = currency;
            optionFrom.textContent = currency;
            fromCurrency.appendChild(optionFrom);

            const optionTo = document.createElement("option");
            optionTo.value = currency;
            optionTo.textContent = currency;
            toCurrency.appendChild(optionTo);
        });

        // Set default selections
        fromCurrency.value = "USD";
        toCurrency.value = "EUR";
    } catch (error) {
        alert("Error populating currencies. Please try again.");
        console.error(error);
    }
}

// Function to perform the currency conversion
async function convertCurrency() {
    const from = fromCurrency.value;
    const to = toCurrency.value;
    const amountValue = parseFloat(amount.value);
    const feePercentage = parseFloat(feeInput.value) || 0;

    // Validate input
    if (isNaN(amountValue) || amountValue <= 0) {
        result.textContent = "Please enter a valid amount.";
        return;
    }

    try {
        const response = await fetch(`${apiUrl}?base=${from}&symbols=${to}`);
        if (!response.ok) throw new Error("Failed to fetch conversion rate.");

        const data = await response.json();
        const rate = data.rates[to];

        if (!rate) {
            result.textContent = "Conversion rate not available.";
            return;
        }

        // Calculate fee and converted amount
        const fee = (amountValue * feePercentage) / 100;
        const convertedAmount = ((amountValue - fee) * rate).toFixed(2);

        result.innerHTML = `
            <p>${amountValue} ${from} = <strong>${convertedAmount} ${to}</strong></p>
            <p>Transaction Fee: ${fee.toFixed(2)} ${from}</p>
        `;

        // Update the chart with historical rates
        updateChart(from, to);
    } catch (error) {
        result.textContent = "Error performing conversion. Please try again.";
        console.error(error);
    }
}

// Function to fetch and display historical exchange rates in the chart
async function updateChart(from, to) {
    const endDate = new Date().toISOString().split("T")[0]; // Today's date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // 7 days ago
    const startDateStr = startDate.toISOString().split("T")[0];

    try {
        const response = await fetch(
            `${historicalApiUrl}?start_date=${startDateStr}&end_date=${endDate}&base=${from}&symbols=${to}`
        );
        if (!response.ok) throw new Error("Failed to fetch historical data.");

        const data = await response.json();
        const rates = data.rates;

        // Extract dates and rates for the chart
        const labels = Object.keys(rates);
        const rateData = labels.map((date) => rates[date][to]);

        // Update or create the chart
        if (exchangeRateChart) {
            exchangeRateChart.data.labels = labels;
            exchangeRateChart.data.datasets[0].data = rateData;
            exchangeRateChart.update();
        } else {
            createChart(labels, rateData, from, to);
        }
    } catch (error) {
        console.error("Error fetching historical data:", error);
    }
}

// Function to create the Chart.js chart
function createChart(labels, data, from, to) {
    const ctx = chartCanvas.getContext("2d");
    exchangeRateChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: `Exchange Rate (${from} to ${to})`,
                    data: data,
                    borderColor: "#4caf50",
                    backgroundColor: "rgba(76, 175, 80, 0.2)",
                    fill: true,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Date",
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: `Rate (${from} to ${to})`,
                    },
                },
            },
        },
    });
}

// Function to reverse currencies
function reverseCurrencies() {
    const temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
}

// Event listeners
convertBtn.addEventListener("click", convertCurrency);
reverseBtn.addEventListener("click", reverseCurrencies);

// Populate currencies on page load
populateCurrencies();