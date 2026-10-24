# SkyCast — Weather Dashboard

A responsive weather dashboard built with semantic HTML, CSS, and vanilla JavaScript modules. It uses OpenWeatherMap to show current conditions and a five-day forecast, with city search, geolocation, favorite cities, temperature units, themes, and Local Storage preferences.

> **API key reminder:** this project uses a browser-side API key for beginner-friendly learning. A key embedded in frontend JavaScript is visible to anyone who visits the deployed site. Never commit your real key to a public repository. For a production app, use a server-side proxy or backend endpoint and restrict the key where the provider supports it.

## Features

- Current temperature, feels-like, high/low, description and weather icon
- Humidity, wind speed, pressure, visibility, sunrise and sunset
- Five-day forecast grouped by calendar day using the forecast API's available entries
- City search with Enter-key support and clear error messages
- Browser geolocation with permission, unavailable-position and timeout handling
- Favorite cities with duplicate prevention and quick access
- Saved last city, Celsius/Fahrenheit preference, favorites, and light/dark theme
- Loading overlay, refresh control, last-updated time, accessible status announcements
- Responsive layout, visible focus indicators, hover states, and reduced-motion support

## Technology

- HTML5, CSS3 (Grid, Flexbox, media queries)
- Vanilla JavaScript ES modules and Fetch API (`async`/`await`)
- OpenWeatherMap Current Weather API and 5 Day / 3 Hour Forecast API
- Browser Local Storage and Geolocation API
- Google Fonts (DM Sans and Manrope); OpenWeatherMap weather icons

## Folder structure

```text
weather-dashboard/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── api.js
│   └── storage.js
├── screenshots/
│   └── README.md
├── .gitignore
└── README.md
```

## 1. Get an OpenWeatherMap API key

1. Create or sign in to an account at [OpenWeatherMap](https://openweathermap.org/).
2. Open your API keys page and create/copy a key for the current weather and 5-day forecast APIs.
3. Open `js/api.js` in VS Code.
4. Replace `YOUR_OPENWEATHERMAP_API_KEY` with your key locally.
5. Save the file. New keys may take some time to activate.

The API helper requests:
- `https://api.openweathermap.org/data/2.5/weather`
- `https://api.openweathermap.org/data/2.5/forecast`

Requests use `units=metric`. Temperatures are converted in the browser for Fahrenheit display; wind speed is shown in m/s or mph according to the selected unit. Visibility is displayed in kilometres when available.

### Keep your key private

- Do not commit a real key to GitHub.
- Before uploading, restore the placeholder in `js/api.js`.
- If a real key was accidentally committed, revoke/rotate it in your OpenWeatherMap account.
- A public static site cannot hide a key used by browser JavaScript. Use a server-side proxy for production, and apply provider-side restrictions where available.

## 2. Run locally in VS Code

ES modules are best run through a local web server rather than opening `index.html` as a `file://` URL.

1. Extract the project ZIP.
2. To run on Windows, double-click `RUN-WEATHER-DASHBOARD.bat` (requires Python), then visit `http://localhost:8000` if it does not open automatically.
3. Or open VS Code, choose **File → Open Folder**, and select `weather-dashboard`.
3. Add your API key to `js/api.js`.
4. Install the **Live Server** extension if you do not already have a local server.
5. Right-click `index.html` and choose **Open with Live Server**.
6. Search for a city such as `London` or `New York`. The first successful request may take a short time if the API key has just been created.

Alternatively, if Python is installed, open a terminal in the project folder and run:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser. On Windows, `py -m http.server 8000` may work if `python` is not on PATH.

## 3. Local Storage

SkyCast stores these values in browser Local Storage:

- `skycast:lastCity` — last successfully searched city
- `skycast:unit` — `C` or `F`
- `skycast:theme` — `light` or `dark`
- `skycast:favorites` — JSON array of favorite city names and country codes

Preferences are stored on the device/browser profile. Clearing site data or using another browser/device removes or does not transfer these settings. The storage module validates saved values and falls back safely when data is missing or malformed.

## 4. Test checklist

- [ ] Enter a valid city and press **Search**.
- [ ] Search using the Enter key.
- [ ] Submit an empty input and confirm the form gives feedback.
- [ ] Search an invalid city and confirm old weather data is hidden.
- [ ] Switch Celsius/Fahrenheit and verify temperatures update.
- [ ] Toggle light/dark theme, refresh the page, and confirm it persists.
- [ ] Add a city to favorites, try adding it again, remove it, and reload.
- [ ] Open a favorite city from the favorites list.
- [ ] Test **Use my location** on `localhost` or HTTPS and handle permission denial.
- [ ] Click refresh and verify the updated timestamp changes.
- [ ] Test at mobile, tablet, and desktop widths.
- [ ] Check keyboard focus and browser console for errors.
- [ ] Test missing/invalid API key and offline/network failure.

## 5. Screenshots

The `screenshots/` folder includes a placeholder guide. To capture evidence:

1. Run the app with a valid API key and load a city.
2. Capture a full-page or dashboard screenshot (Windows: `Win + Shift + S`; macOS: `Shift + Command + 4`).
3. Save it into `screenshots/`, for example as `dashboard-desktop.png`.
4. Capture a mobile-width screenshot as `dashboard-mobile.png`.
5. Add images to this README with Markdown, for example:

```md
![Desktop dashboard](screenshots/dashboard-desktop.png)
![Mobile dashboard](screenshots/dashboard-mobile.png)
```

Do not add screenshots containing your API key or other private information.

## 6. Upload to GitHub

1. Create a new repository on GitHub, for example `weather-dashboard`.
2. Before committing, check `js/api.js` contains `YOUR_OPENWEATHERMAP_API_KEY`, not your real key.
3. Open a terminal in the project folder and run:

```bash
git init
git add .
git commit -m "Build responsive SkyCast weather dashboard"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/weather-dashboard.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username. If Git is not installed, you can create the repository on GitHub and use **Add file → Upload files**, keeping the folder structure intact.

## 7. Deploy with GitHub Pages

1. Push the project to GitHub with the placeholder key still in place.
2. For a private learning/demo setup, add the key only in your local copy. A GitHub Pages frontend cannot keep a key secret; do not publish a working real key in `api.js`.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select branch `main` and folder `/ (root)`, then save.
6. Wait for the published URL to appear. GitHub Pages is static hosting, so ES modules run over HTTPS.
7. For a genuinely public working deployment, place API calls behind a backend/serverless proxy and have the frontend call that proxy instead of exposing the key.

## Known limitations and future improvements

- The five-day forecast endpoint provides data in three-hour intervals. Daily high/low values are calculated from the entries returned for each calendar day; the current partial day may have fewer entries.
- This prepared copy has the API key you supplied configured in js/api.js. API key activation/validity is controlled by OpenWeatherMap. Because the key was shared in chat, rotate it in your OpenWeatherMap account and replace it locally before public use.
- Geolocation requires browser permission and is generally available on HTTPS or localhost.
- The dashboard currently uses English labels and does not include unit preferences for wind independent of temperature.
- Future enhancements: city autocomplete, severe-weather alerts, hourly charts, saved recent searches, richer offline handling, and a server-side API proxy.
