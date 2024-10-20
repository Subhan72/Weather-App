document.addEventListener("DOMContentLoaded", () => {
  const weatherBtn = document.querySelector(".get-weather-btn");
  const chatBtn = document.querySelector(".chat-btn");
  const chatInput = document.querySelector(".chat-input");
  const chatAnswer = document.querySelector(".chat-answer");

  const weatherApiKey = "3009b54491bda1dd10fe554e8f798136";
  const geminiApiKey = "AIzaSyC0N8-R2VQncM3LxiilyeiHM0b0S15l2NU";

  const weatherTableBody = document.querySelector(
    "#weather-forecast-table tbody"
  );
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const pageInfo = document.getElementById("page-info");

  const tempFilter = document.getElementById("temp-filter");
  const weatherFilter = document.getElementById("weather-filter");

  let forecastData = [];
  let currentPage = 1;
  const rowsPerPage = 10;

  const fetchWeather = async (city) => {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
  };

  const fetchForecast = async (city) => {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${weatherApiKey}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
  };

  const fetchGeminiResponse = async (query) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: query }] }],
      }),
    });
    const data = await response.json();
    return data;
  };

  const applyFilters = () => {
    let filteredData = [...forecastData];

    if (weatherFilter.value === "rain") {
      filteredData = filteredData.filter((entry) =>
        entry.weather[0].description.includes("rain")
      );
    }

    if (tempFilter.value === "asc") {
      filteredData.sort((a, b) => a.main.temp - b.main.temp);
    } else if (tempFilter.value === "desc") {
      filteredData.sort((a, b) => b.main.temp - a.main.temp);
    } else if (tempFilter.value === "highest") {
      filteredData = [
        filteredData.reduce((prev, curr) =>
          prev.main.temp > curr.main.temp ? prev : curr
        ),
      ];
    }

    renderTable(currentPage, filteredData);
  };

  const renderTable = (page, data = forecastData) => {
    weatherTableBody.innerHTML = "";
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, data.length);
    const paginatedData = data.slice(startIndex, endIndex);

    paginatedData.forEach((entry) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${new Date(entry.dt_txt).toLocaleDateString()}</td>
        <td>${entry.main.temp}°C</td>
        <td>${entry.weather[0].description}</td>
      `;
      weatherTableBody.appendChild(row);
    });

    pageInfo.textContent = `Page ${page}`;
    prevBtn.disabled = page === 1;
    nextBtn.disabled = endIndex >= data.length;
  };

  weatherBtn.addEventListener("click", async () => {
    const city = document.querySelector(".search-bar").value;
    if (city) {
      const weatherData = await fetchWeather(city);
      if (weatherData && weatherData.main) {
        chatAnswer.textContent = `Weather in ${city}: ${weatherData.main.temp}°C, ${weatherData.weather[0].description}`;
      } else {
        chatAnswer.textContent = "Could not fetch weather data.";
      }

      const forecastDataResult = await fetchForecast(city);
      if (forecastDataResult && forecastDataResult.list) {
        forecastData = forecastDataResult.list;
        currentPage = 1;
        applyFilters();
      } else {
        weatherTableBody.innerHTML =
          "<tr><td colspan='3'>Could not fetch forecast data.</td></tr>";
      }
    } else {
      chatAnswer.textContent = "Please enter a city name.";
    }
  });

  chatBtn.addEventListener("click", async () => {
    const query = chatInput.value;
    if (query.toLowerCase().includes("weather")) {
      const cityMatch = query.match(/in (\w+)/);
      const city = cityMatch ? cityMatch[1] : null;
      if (city) {
        const weatherData = await fetchWeather(city);
        if (weatherData && weatherData.main) {
          chatAnswer.textContent = `Weather in ${city}: ${weatherData.main.temp}°C, ${weatherData.weather[0].description}`;
        } else {
          chatAnswer.textContent = "Could not fetch weather data.";
        }
      } else {
        chatAnswer.textContent = "Please specify a city.";
      }
    } else {
      const geminiResponse = await fetchGeminiResponse(query);
      if (geminiResponse && geminiResponse.candidates) {
        chatAnswer.textContent =
          geminiResponse.candidates[0].content.parts[0].text;
      } else {
        chatAnswer.textContent =
          "I am currently able to answer weather-related queries only.";
      }
    }
  });

  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      applyFilters();
    }
  });

  nextBtn.addEventListener("click", () => {
    if (currentPage * rowsPerPage < forecastData.length) {
      currentPage++;
      applyFilters();
    }
  });

  tempFilter.addEventListener("change", applyFilters);
  weatherFilter.addEventListener("change", applyFilters);
});
