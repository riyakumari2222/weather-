// OpenWeatherMap API helpers. Add your own key below; never commit a real key to a public repository.
const API_KEY = "3618aadb9c85bec8e0b5573304f18f88";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

function validateApiKey() {
  if (!API_KEY || API_KEY === "YOUR_OPENWEATHERMAP_API_KEY") {
    throw new Error("API_KEY_MISSING");
  }
}

async function request(endpoint, params) {
  validateApiKey();
  const url = new URL(`${BASE_URL}/${endpoint}`);
  Object.entries({ ...params, appid: API_KEY }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  });

  let response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch {
    throw new Error("NETWORK_ERROR");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("INVALID_RESPONSE");
  }

  if (!response.ok) {
    if (response.status === 404) throw new Error("CITY_NOT_FOUND");
    if (response.status === 401) throw new Error("API_KEY_INVALID");
    if (response.status === 429) throw new Error("RATE_LIMIT");
    if (response.status >= 500) throw new Error("WEATHER_SERVICE_ERROR");
    throw new Error(data?.message || "API_REQUEST_FAILED");
  }
  return data;
}

function normalizeCurrent(data) {
  if (!data?.main || !data?.weather?.[0] || !data?.sys) throw new Error("INVALID_RESPONSE");
  return {
    city: data.name || "Unknown city",
    country: data.sys.country || "",
    coordinates: data.coord || null,
    temperature: data.main.temp,
    feelsLike: data.main.feels_like,
    min: data.main.temp_min,
    max: data.main.temp_max,
    humidity: data.main.humidity,
    pressure: data.main.pressure,
    visibility: Number.isFinite(data.visibility) ? data.visibility : null,
    windSpeed: data.wind?.speed ?? null,
    sunrise: data.sys.sunrise ?? null,
    sunset: data.sys.sunset ?? null,
    timezone: data.timezone ?? 0,
    condition: data.weather[0].main,
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    id: data.id
  };
}

function normalizeForecast(data) {
  if (!Array.isArray(data?.list)) throw new Error("INVALID_RESPONSE");
  const days = new Map();
  data.list.forEach((entry) => {
    const date = entry.dt_txt?.slice(0, 10);
    if (!date || !entry.main || !entry.weather?.[0]) return;
    if (!days.has(date)) days.set(date, []);
    days.get(date).push(entry);
  });

  return [...days.entries()].slice(0, 5).map(([date, entries]) => {
    // Use the entry closest to midday for representative weather, and the day's actual min/max.
    const representative = entries.reduce((best, item) =>
      Math.abs(new Date(item.dt_txt).getHours() - 12) < Math.abs(new Date(best.dt_txt).getHours() - 12) ? item : best
    , entries[0]);
    const temps = entries.map(item => item.main.temp);
    return {
      date,
      min: Math.min(...entries.map(item => item.main.temp_min)),
      max: Math.max(...entries.map(item => item.main.temp_max)),
      temperature: representative.main.temp,
      condition: representative.weather[0].main,
      description: representative.weather[0].description,
      icon: representative.weather[0].icon
    };
  });
}

export async function getWeatherByCity(city) {
  const params = { q: city, units: "metric" };
  const [currentData, forecastData] = await Promise.all([
    request("weather", params),
    request("forecast", params)
  ]);
  return { current: normalizeCurrent(currentData), forecast: normalizeForecast(forecastData) };
}

export async function getWeatherByCoordinates(latitude, longitude) {
  const params = { lat: latitude, lon: longitude, units: "metric" };
  const [currentData, forecastData] = await Promise.all([
    request("weather", params),
    request("forecast", params)
  ]);
  return { current: normalizeCurrent(currentData), forecast: normalizeForecast(forecastData) };
}
