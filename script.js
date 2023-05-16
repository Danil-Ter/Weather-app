const apiKey = "302f0c63d718b6d903a3f14c23badbde";

function showModal(message) {
  const modal = document.getElementById("modal");
  const modalMessage = document.getElementById("modal-message");
  modalMessage.textContent = message;
  modal.style.display = "block";
  const closeButton = document.getElementsByClassName("close")[0];
  closeButton.onclick = function () {
    modal.style.display = "none";
  };
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
}

function fetchWeatherData(apiUrl) {
  const weatherCards = document.getElementById("weather-cards");
  weatherCards.innerHTML = "";
  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      const uniqueDays = [];
      const weatherData = data.list
        .filter((day) => {
          const date = new Date(day.dt_txt.replace(" ", "T") + "Z");
          const dayOfWeek = date.toLocaleDateString(undefined, {
            weekday: "long",
          });
          if (!uniqueDays.includes(dayOfWeek)) {
            uniqueDays.push(dayOfWeek);
            return true;
          }
          return false;
        })
        .slice(1, 6);

      weatherData.forEach((day, index) => {
        const date = new Date(day.dt_txt.replace(" ", "T") + "Z");
        const temp = day.main.temp;
        const description = day.weather[0].description;
        const row = document.createElement("div");
        row.classList.add("weather-card");
        const dateEl = document.createElement("p");
        dateEl.textContent = formatDate(date);
        const iconEl = document.createElement("img");
        iconEl.src = `https://openweathermap.org/img/w/${day.weather[0].icon}.png`;
        iconEl.alt = day.weather[0].description;
        const tempEl = document.createElement("p");
        tempEl.innerHTML = `${Math.round(temp)}&deg;C`;
        const windEl = document.createElement("p");
        windEl.textContent = `Wind: ${day.wind.speed} m/s`;
        const descEl = document.createElement("p");
        descEl.textContent = description;
        row.appendChild(dateEl);
        row.appendChild(iconEl);
        row.appendChild(tempEl);
        row.appendChild(windEl);
        row.appendChild(descEl);
        weatherCards.appendChild(row);
      });
    })
    .catch((error) => {
      showModal("Failed to get weather data.");
    });
}

function formatDate(date) {
  const options = { weekday: "long", month: "short", day: "numeric" };
  const utcDay = date.getUTCDate();
  const utcMonth = date.getUTCMonth();
  const utcYear = date.getUTCFullYear();
  const localDate = new Date(Date.UTC(utcYear, utcMonth, utcDay));
  return localDate.toLocaleDateString("en-US", options);
}

function getLocationWeather() {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=en`;
      fetch(nominatimUrl)
        .then((response) => response.json())
        .then((data) => {
          const location = `${
            data.address.city ||
            data.address.town ||
            data.address.village ||
            data.address.county
          }`;
          const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=en`;
          fetchWeatherData(apiUrl);
          document.getElementById("city-heading").textContent =
            "Weather in " + location;
          localStorage.setItem("lastLocation", location);
        })
        .catch((error) => {
          console.log("Failed to get location data.");
        });
    },
    (error) => {
      showModal("Failed to get location data.");
    }
  );
}

function getCityWeather(city) {
  if (!city) {
    showModal("Enter the name of the city.");
    return;
  }
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=en&appid=${apiKey}`;
  fetch(apiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error("City not found.");
      }
      return response.json();
    })
    .then((data) => {
      const cityName = data.name;
      const apiUrlForecast = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;
      fetchWeatherData(apiUrlForecast);
      const cityHeading = document.getElementById("city-heading");
      cityHeading.textContent = `Weather in ${cityName}`;
      localStorage.setItem("lastLocation", cityName);
    })
    .catch((error) => {
      showModal(error.message);
    });
}

const lastLocation = localStorage.getItem("lastLocation");

if (lastLocation) {
  getCityWeather(lastLocation);
} else {
  getCityWeather("Odessa");
}

document
  .getElementById("geolocation-btn")
  .addEventListener("click", getLocationWeather);
document.getElementById("search-btn").addEventListener("click", () => {
  const city = document.getElementById("city").value;
  if (city) {
    getCityWeather(city);
    document.getElementById("city").value = "";
  } else {
    showModal("Enter the name of the city.");
  }
});
