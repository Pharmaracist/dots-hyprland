import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
const { Box, Label, EventBox, Stack } = Widget;
const { execAsync } = Utils;
const { GLib } = imports.gi;
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";
import PrayerTimesService from '../../../services/prayertimes.js';

const WEATHER_CACHE_FOLDER = `${GLib.get_user_cache_dir()}/ags/weather`;
const WEATHER_CACHE_PATH = WEATHER_CACHE_FOLDER + "/wttr.in.txt";
Utils.exec(`mkdir -p ${WEATHER_CACHE_FOLDER}`);

const WWO_CODE = {
  '113': 'Sunny',
  '116': 'PartlyCloudy',
  '119': 'Cloudy',
  '122': 'VeryCloudy',
  '143': 'Fog',
  '176': 'LightShowers',
  '179': 'LightRain',
  '182': 'HeavyRain',
  '185': 'HeavyShowers',
  '200': 'ThunderyShowers',
  '227': 'LightSnow',
  '230': 'HeavySnow',
  '248': 'LightSleet',
  '260': 'LightSleetShowers',
  '263': 'LightSnowShowers',
  '266': 'HeavySnowShowers',
  '281': 'LightSleet',
  '284': 'LightSleetShowers',
  '293': 'LightRain',
  '296': 'LightRain',
  '299': 'HeavyRain',
  '302': 'HeavyRain',
  '305': 'HeavyRain',
  '308': 'HeavyRain',
  '311': 'LightDrizzle',
  '314': 'LightDrizzle',
  '317': 'LightDrizzle',
  '320': 'LightDrizzle',
  '323': 'LightDrizzle',
  '326': 'LightDrizzle',
  '329': 'LightDrizzle',
  '332': 'LightMist',
  '335': 'LightMist',
  '338': 'LightMist',
  '350': 'LightMist',
  '353': 'LightMist',
  '356': 'LightMist',
  '359': 'LightMist',
  '362': 'LightMist',
  '365': 'LightMist',
  '368': 'LightMist',
  '371': 'LightMist',
  '374': 'LightMist',
  '377': 'LightMist',
  '386': 'LightMist',
  '389': 'LightMist',
  '392': 'LightMist',
  '395': 'LightMist',
};

const WeatherWidget = () => {
  const CACHE_DURATION = 15 * 60 * 1000000; // 15 minutes
  let lastUpdate = 0;
  let cachedData = null;
  let showingPrayer = false;

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

  const getWeatherIcon = (weatherCode) => {
    const condition = WWO_CODE[weatherCode];
    switch(condition) {
      case 'Sunny':
        return 'light_mode';
      case 'PartlyCloudy':
        return 'partly_cloudy_day';
      case 'Cloudy':
      case 'VeryCloudy':
        return 'cloud';
      case 'Fog':
        return 'foggy';
      case 'LightShowers':
      case 'LightRain':
        return 'water_drop';
      case 'HeavyRain':
      case 'HeavyShowers':
        return 'rainy';
      case 'ThunderyShowers':
      case 'ThunderyHeavyRain':
        return 'thunderstorm';
      case 'LightSnow':
      case 'HeavySnow':
      case 'LightSnowShowers':
      case 'HeavySnowShowers':
        return 'ac_unit';
      case 'LightSleet':
      case 'LightSleetShowers':
        return 'weather_mix';
      default:
        return 'device_thermostat';
    }
  };

  const getPrayerIcon = (prayerName) => {
    switch(prayerName?.toLowerCase()) {
      case 'fajr':
        return 'dark_mode'; // Dawn/early morning
      case 'sunrise':
        return 'wb_twilight'; // Sunrise
      case 'dhuhr':
        return 'light_mode'; // Noon sun
      case 'asr':
        return 'routine'; // Afternoon
      case 'maghrib':
        return 'relax'; // Sunset
      case 'isha':
        return 'partly_cloudy_night'; // Night
      default:
        return 'mosque';
    }
  };

  const weatherIcon = MaterialIcon('device_thermostat', 'large weather-icon txt-norm sec-txt');
  const prayerIcon = MaterialIcon('mosque', 'large weather-icon txt-norm sec-txt');

  const tempLabel = Label({
    className: "txt-norm txt-semibold sec-txt",
    label: "",
  });

  const feelsLikeTextLabel = Label({
    className: "txt-norm txt-semibold sec-txt",
    label: " feels",
  });

  const feelsLikeLabel = Label({
    className: "txt-norm txt-semibold sec-txt",
    label: "",
  });

  const prayerNameLabel = Label({
    className: "txt-norm txt-semibold sec-txt",
    visible: false,
    label: "",
  });

  const prayerTimeLabel = Label({
    className: "txt-norm txt-semibold sec-txt",
    visible: false,
    label: "",
  });

  const weatherContent = Box({
    className: 'weather-content spacing-h-4',
    hpack: 'center',
    vpack: 'center',
    children: [
      weatherIcon,
      Box({
        className: 'spacing-h-2',
        hpack: 'center',
        vpack: 'center',
        children: [
          tempLabel,
          feelsLikeTextLabel,
          feelsLikeLabel
        ]
      })
    ]
  });

  const prayerContent = Box({
    className: 'prayer-content spacing-h-10',
    hpack: 'center',
    vpack: 'center',
    children: [
      prayerIcon,
      Box({
        className: 'spacing-h-10',
        hpack: 'center',
        vpack: 'center',
        children: [prayerNameLabel, prayerTimeLabel]
      })
    ]
  });

  const contentStack = Stack({
    transition: 'slide_up_down',
    transitionDuration: 400,
    children: {
      'weather': weatherContent,
      'prayer': prayerContent,
    },
  });

  const weatherBox = Box({
    hexpand: true,
    hpack: 'center',
    vpack: 'center',
    className: 'spacing-h-4 bar-group-pad txt-onSurfaceVariant bar-weather',
    children: [contentStack],
  });

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

      const { temp, feelsLike, weatherDesc, weatherCode } = weatherData;
      tempLabel.label = `${temp}°C`;
      feelsLikeLabel.label = ` ${feelsLike}°C`;
      feelsLikeTextLabel.visible = true;
      tempLabel.tooltipText = `${weatherDesc}\nFeels like: ${feelsLike}°C`;
      weatherIcon.label = getWeatherIcon(weatherCode);
    } catch (err) {
      tempLabel.label = "N/A";
      feelsLikeLabel.label = "";
      feelsLikeTextLabel.visible = false;
      tempLabel.tooltipText = "Weather data unavailable";
    }
  };

  const toggleDisplay = () => {
    showingPrayer = !showingPrayer;
    const state = showingPrayer ? 'prayer' : 'weather';
    
    contentStack.shown = state;
    
    if (showingPrayer) {
      const nextPrayer = PrayerTimesService.nextPrayerName;
      const nextTime = PrayerTimesService.nextPrayerTime?.trim(); // Trim any whitespace
      if (nextPrayer && nextTime) {
        prayerNameLabel.label = nextPrayer;
        prayerTimeLabel.label = nextTime;
        prayerIcon.label = getPrayerIcon(nextPrayer);
      }
    }
  };

  return Widget.EventBox({
    onPrimaryClick: toggleDisplay,
    child: weatherBox,
    setup: self => {
      // Initial update
      updateWidget();

      // Update weather every CACHE_DURATION
      self.poll(CACHE_DURATION, () => {
        updateWidget();
      });

      // Auto toggle every 5 seconds
      self.poll(5000, () => {
        toggleDisplay();
        return true;
      });
    },
  });
};

export default WeatherWidget;
