import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
const { Box, Label } = Widget;
const { execAsync } = Utils;
const { GLib } = imports.gi;
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";

const WEATHER_CACHE_FOLDER = `${GLib.get_user_cache_dir()}/ags/weather`;
const WEATHER_CACHE_PATH = WEATHER_CACHE_FOLDER + "/wttr.in.txt";
Utils.exec(`mkdir -p ${WEATHER_CACHE_FOLDER}`);

const WeatherWidget = () => {
  const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
  let lastUpdate = 0;
  let cachedData = null;

  const getLocation = async () => {
    try {
      const response = await execAsync(['curl', '-s', '-k', 'https://ipapi.co/json/']);
      const data = JSON.parse(response);
      return data.city || userOptions.weather?.city || 'Cairo';
    } catch (err) {
      return userOptions.weather?.city || 'Cairo';
    }
  };

  const updateWeatherForCity = async (city) => {
    // Check cache first
    const now = Date.now();
    if (cachedData && (now - lastUpdate) < CACHE_DURATION) {
      return cachedData;
    }

    try {
      const encodedCity = encodeURIComponent(city.trim());
      const cmd = ['curl', '-s', '-k', '--connect-timeout', '5', `https://wttr.in/${encodedCity}?format=j1`];
      const response = await execAsync(cmd);
      
      if (!response) {
        throw new Error('Empty response from weather API');
      }

      const data = JSON.parse(response);
      if (!data || !data.current_condition || !data.current_condition[0]) {
        throw new Error('Invalid weather data format');
      }

      const weatherData = {
        temp: data.current_condition[0].temp_C,
        feelsLike: data.current_condition[0].FeelsLikeC,
        weatherDesc: data.current_condition[0].weatherDesc[0].value,
        weatherCode: data.current_condition[0].weatherCode,
      };

      // Update cache
      cachedData = weatherData;
      lastUpdate = now;

      return weatherData;
    } catch (err) {
      return null;
    }
  };

  const updateWidget = async () => {
    try {
      const city = await getLocation();
      const weatherData = await updateWeatherForCity(city);

      if (!weatherData) {
        tempLabel.label = "N/A";
        feelsLikeLabel.label = "";
        feelsLikeTextLabel.visible = false;
        tempLabel.tooltipText = "Weather data unavailable";
        return;
      }

      const { temp, feelsLike, weatherDesc } = weatherData;
      tempLabel.label = ` ${temp}°C `;
      feelsLikeLabel.label = `  ${feelsLike}°C   `;
      feelsLikeTextLabel.visible = true;
      tempLabel.tooltipText = `${weatherDesc}\nFeels like: ${feelsLike}°C`;
    } catch (err) {
      tempLabel.label = "N/A";
      feelsLikeLabel.label = "";
      feelsLikeTextLabel.visible = false;
      tempLabel.tooltipText = "Weather data unavailable";
    }
  };

  const tempLabel = Widget.Label({
    className: "txt-small sec-txt",
    label: "",
  });

  const feelsLikeTextLabel = Widget.Label({
    className: "txt-small sec-txt",
    label: "Feels like",
  });

  const feelsLikeLabel = Widget.Label({
    className: "txt-small sec-txt",
    label: "",
  });

  const weatherBox = Box({
    hexpand: true,
    hpack: 'center',
    className: 'spacing-h-4 bar-group-pad txt-onSurfaceVariant',
    css: "min-width:5rem",
    children: [
      MaterialIcon('device_thermostat', 'small'),
      Box({
        className: 'spacing-h-2',
        children: [
          tempLabel,
          feelsLikeTextLabel,
          feelsLikeLabel
        ]
      })
    ],
    setup: self => {
      // Initial update
      updateWidget();

      // Update every 15 minutes
      self.poll(900000, () => {
        updateWidget();
        return true;
      });
    }
  });

  return weatherBox;
};

export default WeatherWidget;
