// Small, defensive Local Storage wrapper. All stored values are namespaced for this app.
const KEYS = {
  city: "skycast:lastCity",
  unit: "skycast:unit",
  theme: "skycast:theme",
  favorites: "skycast:favorites"
};

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function getLastCity() {
  const city = read(KEYS.city, "London");
  return typeof city === "string" && city.trim() ? city.trim() : "London";
}
export function setLastCity(city) { return write(KEYS.city, String(city).trim()); }

export function getUnit() {
  const unit = read(KEYS.unit, "C");
  return unit === "F" ? "F" : "C";
}
export function setUnit(unit) { return write(KEYS.unit, unit === "F" ? "F" : "C"); }

export function getTheme() {
  const theme = read(KEYS.theme, "light");
  return theme === "dark" ? "dark" : "light";
}
export function setTheme(theme) { return write(KEYS.theme, theme === "dark" ? "dark" : "light"); }

export function getFavorites() {
  try {
    const parsed = JSON.parse(read(KEYS.favorites, "[]"));
    if (!Array.isArray(parsed)) return [];
    const seen = new Set();
    return parsed.filter(item => {
      if (!item || typeof item.name !== "string" || !item.name.trim()) return false;
      const key = `${item.name.trim().toLowerCase()}|${String(item.country || "").toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map(item => ({ name: item.name.trim(), country: String(item.country || "") }));
  } catch {
    return [];
  }
}
export function setFavorites(favorites) {
  return write(KEYS.favorites, JSON.stringify(favorites));
}
