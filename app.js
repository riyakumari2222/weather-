import { getWeatherByCity, getWeatherByCoordinates } from "./api.js";
import {
  getLastCity, setLastCity, getUnit, setUnit, getTheme, setTheme,
  getFavorites, setFavorites
} from "./storage.js";

const $ = (selector) => document.querySelector(selector);
const elements = {
  form: $("#search-form"), input: $("#city-input"), location: $("#location-button"),
  unit: $("#unit-toggle"), theme: $("#theme-toggle"), status: $("#status-message"),
  content: $("#weather-content"), loading: $("#loading-overlay"), city: $("#city-name"),
  date: $("#local-date"), favorite: $("#favorite-button"), refresh: $("#refresh-button"),
  temp: $("#current-temp"), description: $("#weather-description"), icon: $("#current-icon"),
  feels: $("#feels-like"), high: $("#high-temp"), low: $("#low-temp"), sunrise: $("#sunrise"),
  sunset: $("#sunset"), humidity: $("#humidity"), wind: $("#wind-speed"),
  windUnit: $("#wind-unit"), pressure: $("#pressure"), visibility: $("#visibility"),
  forecast: $("#forecast-grid"), favorites: $("#favorites-list"), favoriteCount: $("#favorite-count"),
  updated: $("#last-updated")
};

let currentWeather = null;
let currentForecast = [];
let unit = getUnit();
let theme = getTheme();
let activeRequest = 0;

function temperature(value) {
  if (!Number.isFinite(value)) return "—";
  const result = unit === "F" ? (value * 9 / 5) + 32 : value;
  return `${Math.round(result)}°`;
}
function windSpeed(value) {
  if (!Number.isFinite(value)) return "—";
  return unit === "F" ? `${(value * 2.23694).toFixed(1)} mph` : `${value.toFixed(1)} m/s`;
}
function iconUrl(icon) { return `https://openweathermap.org/img/wn/${encodeURIComponent(icon || "01d")}@2x.png`; }
function formatTime(timestamp, timezoneOffset = 0) {
  if (!timestamp) return "Unavailable";
  // Offset is supplied by the API in seconds; format in the city's local time without relying on the visitor's timezone.
  const date = new Date((timestamp + timezoneOffset) * 1000);
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(date);
}
function formatDate(dateString, options = { weekday: "short", day: "numeric", month: "short" }) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", options).format(new Date(Date.UTC(year, month - 1, day, 12)));
}
function showStatus(message, type = "") {
  elements.status.textContent = message;
  elements.status.className = `status-message ${type}`.trim();
  elements.status.hidden = !message;
}
function setLoading(isLoading) {
  elements.loading.hidden = !isLoading;
  elements.form.querySelector("button").disabled = isLoading;
  elements.location.disabled = isLoading;
  elements.refresh.disabled = isLoading;
}
function errorMessage(error) {
  const messages = {
    API_KEY_MISSING: "Add your OpenWeatherMap API key in js/api.js, then reload the page.",
    API_KEY_INVALID: "The API key was rejected. Check the key in js/api.js and confirm your OpenWeatherMap account is active.",
    CITY_NOT_FOUND: "We couldn't find that city. Check the spelling and try again.",
    RATE_LIMIT: "The weather service is receiving too many requests. Please wait a moment and try again.",
    NETWORK_ERROR: "Unable to connect. Check your internet connection and try again.",
    INVALID_RESPONSE: "The weather service returned unexpected data. Please try again later.",
    WEATHER_SERVICE_ERROR: "The weather service is temporarily unavailable. Please try again shortly."
  };
  return messages[error?.message] || "Something went wrong while loading weather. Please try again.";
}

async function loadWeather(fetcher, label) {
  const requestId = ++activeRequest;
  showStatus("");
  setLoading(true);
  try {
    const result = await fetcher();
    if (requestId !== activeRequest) return;
    if (!result.current || !Array.isArray(result.forecast)) throw new Error("INVALID_RESPONSE");
    currentWeather = result.current;
    currentForecast = result.forecast;
    elements.content.hidden = false;
    renderWeather();
    if (label === "city") setLastCity(currentWeather.city);
    renderFavorites();
    elements.updated.textContent = `Updated ${new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date())}`;
    showStatus(`Weather loaded for ${currentWeather.city}.`, "success");
    window.setTimeout(() => { if (elements.status.textContent.startsWith("Weather loaded")) showStatus(""); }, 3500);
  } catch (error) {
    if (requestId !== activeRequest) return;
    // Hide the previous city's data so it cannot be mistaken for the failed search.
    elements.content.hidden = true;
    currentWeather = null;
    currentForecast = [];
    showStatus(errorMessage(error), "error");
  } finally {
    if (requestId === activeRequest) setLoading(false);
  }
}

function renderWeather() {
  const weather = currentWeather;
  elements.city.textContent = `${weather.city}${weather.country ? `, ${weather.country}` : ""}`;
  elements.date.textContent = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
  elements.temp.textContent = temperature(weather.temperature).replace("°", "");
  elements.description.textContent = weather.description || weather.condition;
  elements.icon.src = iconUrl(weather.icon);
  elements.icon.alt = weather.description || weather.condition || "Current weather";
  elements.feels.textContent = temperature(weather.feelsLike);
  elements.high.textContent = temperature(weather.max);
  elements.low.textContent = temperature(weather.min);
  elements.humidity.textContent = Number.isFinite(weather.humidity) ? `${weather.humidity}%` : "—";
  elements.wind.textContent = windSpeed(weather.windSpeed);
  elements.windUnit.textContent = unit === "F" ? "Miles per hour" : "Meters per second";
  elements.pressure.textContent = Number.isFinite(weather.pressure) ? `${weather.pressure} hPa` : "—";
  elements.visibility.textContent = Number.isFinite(weather.visibility) ? `${(weather.visibility / 1000).toFixed(1)} km` : "Unavailable";
  elements.sunrise.textContent = formatTime(weather.sunrise, weather.timezone);
  elements.sunset.textContent = formatTime(weather.sunset, weather.timezone);
  elements.unit.innerHTML = unit === "C" ? "<strong>°C</strong> <span class=\"unit-divider\">/</span> °F" : "°C <span class=\"unit-divider\">/</span> <strong>°F</strong>";
  const isFavorite = getFavorites().some(item => item.name.toLowerCase() === weather.city.toLowerCase() && item.country.toLowerCase() === weather.country.toLowerCase());
  elements.favorite.setAttribute("aria-pressed", String(isFavorite));
  elements.favorite.innerHTML = isFavorite ? "♥ <span>Saved favorite</span>" : "♡ <span>Add favorite</span>";
  renderForecast();
}
function renderForecast() {
  elements.forecast.replaceChildren();
  if (!currentForecast.length) {
    const message = document.createElement("p");
    message.className = "empty-favorites";
    message.textContent = "Forecast data is not available right now.";
    elements.forecast.append(message);
    return;
  }
  currentForecast.forEach((day, index) => {
    const card = document.createElement("article");
    card.className = "forecast-card";
    const dayName = index === 0 ? "Today" : formatDate(day.date, { weekday: "short" });
    card.innerHTML = `
      <p class="forecast-day">${dayName}</p>
      <p class="forecast-date">${formatDate(day.date, { day: "numeric", month: "short" })}</p>
      <img class="forecast-icon" src="${iconUrl(day.icon)}" alt="${escapeHtml(day.description || day.condition || "Weather")}" width="68" height="68">
      <p class="forecast-condition">${escapeHtml(day.condition || "Unknown")}</p>
      <div class="forecast-temps"><span>${temperature(day.max)}</span><span>${temperature(day.min)}</span></div>`;
    elements.forecast.append(card);
  });
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function renderFavorites() {
  const favorites = getFavorites();
  elements.favoriteCount.textContent = `${favorites.length} saved`;
  elements.favorites.replaceChildren();
  if (!favorites.length) {
    const empty = document.createElement("p");
    empty.className = "empty-favorites";
    empty.textContent = "Your favorite cities will appear here. Search for a city and save it with ♡.";
    elements.favorites.append(empty);
    return;
  }
  favorites.forEach((favorite) => {
    const chip = document.createElement("div");
    chip.className = "favorite-chip";
    const open = document.createElement("button");
    open.type = "button";
    open.className = "favorite-chip-open";
    open.style.cssText = "display:flex;align-items:center;gap:10px;border:0;background:transparent;color:inherit;text-align:left;padding:0;";
    open.setAttribute("aria-label", `Show weather for ${favorite.name}${favorite.country ? ", " + favorite.country : ""}`);
    const name = document.createElement("span");
    name.innerHTML = `<span class="chip-name">${escapeHtml(favorite.name)}</span><span class="chip-country">${escapeHtml(favorite.country || "Saved city")}</span>`;
    open.append(name);
    if (currentWeather && favorite.name.toLowerCase() === currentWeather.city.toLowerCase() && favorite.country.toLowerCase() === currentWeather.country.toLowerCase()) {
      const temp = document.createElement("span");
      temp.className = "chip-temp";
      temp.textContent = temperature(currentWeather.temperature);
      open.append(temp);
    }
    open.addEventListener("click", () => {
      elements.input.value = favorite.country ? `${favorite.name},${favorite.country}` : favorite.name;
      loadWeather(() => getWeatherByCity(elements.input.value.trim()), "city");
    });
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-favorite";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Remove ${favorite.name} from favorites`);
    remove.addEventListener("click", () => {
      setFavorites(getFavorites().filter(item => !(item.name.toLowerCase() === favorite.name.toLowerCase() && item.country.toLowerCase() === favorite.country.toLowerCase())));
      renderFavorites();
      if (currentWeather) renderWeather();
    });
    chip.append(open, remove);
    elements.favorites.append(chip);
  });
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = elements.input.value.trim();
  if (!city) {
    showStatus("Enter a city name to search.", "error");
    elements.input.focus();
    return;
  }
  if (city.length > 100) {
    showStatus("Please enter a shorter city name.", "error");
    return;
  }
  loadWeather(() => getWeatherByCity(city), "city");
});
elements.location.addEventListener("click", () => {
  if (!("geolocation" in navigator)) {
    showStatus("Geolocation is not supported by this browser. You can still search for a city.", "error");
    return;
  }
  showStatus("Requesting your location…");
  navigator.geolocation.getCurrentPosition(
    position => loadWeather(() => getWeatherByCoordinates(position.coords.latitude, position.coords.longitude), "location"),
    error => {
      const message = error.code === 1 ? "Location permission was denied. Allow location access in your browser or search for a city." :
        error.code === 2 ? "Your location is unavailable. Check device location settings or search for a city." :
        "Location request timed out. Try again or search for a city.";
      showStatus(message, "error");
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
  );
});
elements.favorite.addEventListener("click", () => {
  if (!currentWeather) return;
  const favorites = getFavorites();
  const exists = favorites.some(item => item.name.toLowerCase() === currentWeather.city.toLowerCase() && item.country.toLowerCase() === currentWeather.country.toLowerCase());
  const updated = exists
    ? favorites.filter(item => !(item.name.toLowerCase() === currentWeather.city.toLowerCase() && item.country.toLowerCase() === currentWeather.country.toLowerCase()))
    : [...favorites, { name: currentWeather.city, country: currentWeather.country }];
  setFavorites(updated);
  renderFavorites();
  renderWeather();
  showStatus(exists ? "City removed from favorites." : "City added to favorites.", "success");
});
elements.refresh.addEventListener("click", () => {
  if (currentWeather?.coordinates) {
    loadWeather(() => getWeatherByCoordinates(currentWeather.coordinates.lat, currentWeather.coordinates.lon), "refresh");
  } else {
    loadWeather(() => getWeatherByCity(currentWeather?.city || getLastCity()), "refresh");
  }
});
elements.unit.addEventListener("click", () => {
  unit = unit === "C" ? "F" : "C";
  setUnit(unit);
  if (currentWeather) renderWeather();
  else elements.unit.innerHTML = unit === "C" ? "<strong>°C</strong> <span class=\"unit-divider\">/</span> °F" : "°C <span class=\"unit-divider\">/</span> <strong>°F</strong>";
  renderFavorites();
});
function applyTheme() {
  document.documentElement.dataset.theme = theme;
  elements.theme.innerHTML = theme === "dark" ? '<span aria-hidden="true">☀</span>' : '<span aria-hidden="true">☾</span>';
  elements.theme.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
  document.querySelector('meta[name="theme-color"]').content = theme === "dark" ? "#101827" : "#edf4ff";
}
elements.theme.addEventListener("click", () => {
  theme = theme === "light" ? "dark" : "light";
  setTheme(theme);
  applyTheme();
});
applyTheme();
renderFavorites();
elements.input.value = getLastCity();

// Initial load uses the saved city; a missing API key is explained in the status banner.
loadWeather(() => getWeatherByCity(getLastCity()), "initial");
