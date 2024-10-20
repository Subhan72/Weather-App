const API_KEY = "3009b54491bda1dd10fe554e8f798136";

const cityInput = document.getElementById("city-input");
const getWeatherBtn = document.getElementById("get-weather-btn");
const cityNameDisplay = document.getElementById("city-name");
const temperatureDisplay = document.getElementById("temperature");
const humidityDisplay = document.getElementById("humidity");
const windSpeedDisplay = document.getElementById("wind-speed");
const weatherDescriptionDisplay = document.getElementById("weather-description");
const weatherIcon = document.getElementById("weather-icon");
const forecastContainer = document.getElementById("forecast-content");

getWeatherBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) {
    getWeatherData(city);
    get5DayForecast(city);
  } else {
    alert("Please enter a city name.");
  }
});

async function getWeatherData(city) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`
    );
    if (!response.ok) throw new Error("City not found");

    const data = await response.json();
    displayWeatherData(data);
  } catch (error) {
    handleError(error.message);
  }
}

async function get5DayForecast(city) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`
    );
    if (!response.ok) throw new Error("City not found");

    const data = await response.json();
    console.log("Forecast Data:", data); // Debugging line
    displayForecastData(data);
  } catch (error) {
    handleError(error.message);
  }
}

function displayWeatherData(data) {
  cityNameDisplay.textContent = data.name;
  temperatureDisplay.textContent = `${data.main.temp.toFixed(1)} °C`;
  humidityDisplay.textContent = `${data.main.humidity}%`;
  windSpeedDisplay.textContent = `${data.wind.speed.toFixed(1)} m/s`;
  weatherDescriptionDisplay.textContent = data.weather[0].description;

  const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  weatherIcon.src = iconUrl;
  weatherIcon.style.display = "block";
  weatherIcon.style.width = "100px";  
  weatherIcon.style.height = "100px"; 
  weatherIcon.style.objectFit = "contain";
  weatherIcon.style.margin = "0 auto";
}

function displayForecastData(data) {
  forecastContainer.innerHTML = "";

  const dailyData = data.list.filter(entry => entry.dt_txt.includes("12:00:00"));

  dailyData.forEach(day => {
    const date = new Date(day.dt_txt).toLocaleDateString();
    const temp = `${day.main.temp.toFixed(1)} °C`;
    const description = day.weather[0].description;
    const iconUrl = `https://openweathermap.org/img/wn/${day.weather[0].icon}.png`;

    const forecastCard = document.createElement("div");
    forecastCard.classList.add("forecast-card");
    forecastCard.innerHTML = `
      <h4>${date}</h4>
      <img src="${iconUrl}" alt="${description}">
      <p><strong>${temp}</strong></p>
      <p>${description}</p>
    `;
    forecastContainer.appendChild(forecastCard);
  });

  createOrUpdateCharts(data);
}

function handleError(message) {
  alert(message);
}

let barChart, doughnutChart, lineChart;

function createOrUpdateCharts(data) {
  const dailyData = data.list.filter(entry => entry.dt_txt.includes("12:00:00"));
  const temperatures = dailyData.map(entry => entry.main.temp);
  const dates = dailyData.map(entry => new Date(entry.dt_txt).toLocaleDateString());

  const barChartCtx = document.getElementById('bar-chart').getContext('2d');
  if (barChart) {
    barChart.data.labels = dates;
    barChart.data.datasets[0].data = temperatures;
    barChart.update();
  } else {
    barChart = new Chart(barChartCtx, {
      type: 'bar',
      data: {
        labels: dates,
        datasets: [{
          label: 'Temperature (°C)',
          data: temperatures,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        animation: {
          delay: 500
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  const avgHumidity = (dailyData.reduce((sum, entry) => sum + entry.main.humidity, 0) / dailyData.length).toFixed(1);
  const avgWindSpeed = (dailyData.reduce((sum, entry) => sum + entry.wind.speed, 0) / dailyData.length).toFixed(1);
  
  const doughnutChartCtx = document.getElementById('doughnut-chart').getContext('2d');
  if (doughnutChart) {
    doughnutChart.data.datasets[0].data = [avgHumidity, avgWindSpeed];
    doughnutChart.update();
  } else {
    doughnutChart = new Chart(doughnutChartCtx, {
      type: 'doughnut',
      data: {
        labels: ['Average Humidity (%)', 'Average Wind Speed (m/s)'],
        datasets: [{
          data: [avgHumidity, avgWindSpeed],
          backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)'],
          borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        animation: {
          delay: 500 
        }
      }
    });
  }

  const lineChartCtx = document.getElementById('line-chart').getContext('2d');
  if (lineChart) {
    lineChart.data.labels = dates;
    lineChart.data.datasets[0].data = temperatures;
    lineChart.update();
  } else {
    lineChart = new Chart(lineChartCtx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Temperature (°C)',
          data: temperatures,
          fill: false,
          borderColor: 'rgba(153, 102, 255, 1)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        animation: {
          easing: 'easeInOutBounce', // Drop animation
          duration: 1500
        },
        scales: {
          y: {
            beginAtZero: false
          }
        }
      }
    });
  }
}
