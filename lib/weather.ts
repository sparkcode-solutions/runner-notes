
interface WeatherData {
  temperature: number;
  precipitation: number;
  weatherCode: number;
  isDay: boolean;
  condition: string;
}

/**
 * Interpret WMO Weather Codes from Open-Meteo
 */
function getWeatherCondition(code: number): string {
  // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
  if (code === 0) return 'Clear sky';
  if (code === 1 || code === 2 || code === 3) return 'Partly cloudy';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Unknown';
}

/**
 * Fetch current weather context
 */
export async function getLocalWeather(lat: number, lng: number): Promise<WeatherData | null> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation,weather_code,is_day&temperature_unit=celsius`
    );
    
    if (!response.ok) return null;

    const data = await response.json();
    const current = data.current;

    return {
      temperature: current.temperature_2m,
      precipitation: current.precipitation,
      weatherCode: current.weather_code,
      isDay: !!current.is_day,
      condition: getWeatherCondition(current.weather_code),
    };

  } catch (error) {
    console.warn('Weather fetch failed:', error);
    return null;
  }
}
