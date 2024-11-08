'use client'
import React, { useState } from 'react';
import { Cover } from "@/components/ui/cover";
import Particles from "@/components/ui/particles";
import NumberTicker from "@/components/ui/number-ticker"
import ShinyButton from "@/components/ui/shiny-button";
import SparklesText from "@/components/ui/sparkles-text";
import LetterPullup from "@/components/ui/letter-pullup";

type WeatherData = {
    temperature: number;
    windspeed: number;
    weathercode: number;
};

type DailyForecast = {
    date: string;
    temperatureMax: number;
    temperatureMin: number;
    weathercode: number;
};

type HourlyForecast = {
    time: string;
    temperature: number;
    weathercode: number;
};

const WeatherApp = () => {
    const [city, setCity] = useState('');
    const [location, setLocation] = useState('');
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [dailyForecast, setDailyForecast] = useState<DailyForecast[]>([]);
    const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([]);
    const [airQualityData, setAirQualityData] = useState<AirQualityData | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [localTime, setLocalTime] = useState<string | null>(null);
    const getWeatherTip = (temperature: number): string => {
        if (temperature >= 30) {
            return "🌞 It's really hot! Stay hydrated and avoid direct sunlight.";
        } else if (temperature >= 20) {
            return "🌤️ A warm day ahead. Don't forget to wear sunscreen.";
        } else if (temperature >= 10) {
            return "🌥️ Mild weather. A light jacket should be fine.";
        } else if (temperature >= 0) {
            return "❄️ It's getting cold! Bundle up to stay warm.";
        } else {
            return "❄️ It's freezing! Stay indoors and keep warm.";
        }
    };




    const getParticleColor = (temperature: number | null): string => {
        if (temperature === null) return "#ffffff"; // Default white

        if (temperature <= 0) return "#a5f3fc"; // Very cold (light blue)
        if (temperature <= 10) return "#60a5fa"; // Cold (blue)
        if (temperature <= 20) return "#22c55e"; // Mild (green)
        if (temperature <= 30) return "#f59e0b"; // Warm (orange)
        return "#ef4444"; // Hot (red)
    };

    const getTipsCardBackground = (weatherCode: number) => {
        switch (weatherCode) {
            case 0: return "bg-yellow-400"; // Clear sky
            case 1: return "bg-blue-400"; // Partly cloudy
            case 2: return "bg-gray-400"; // Overcast
            case 3: return "bg-blue-500"; // Rainy
            case 45: return "bg-gray-600"; // Foggy
            case 51: return "bg-blue-600"; // Drizzle
            case 61: return "bg-cyan-500"; // Rain
            case 71: return "bg-white"; // Snow
            case 95: return "bg-indigo-600"; // Thunderstorm
            default: return "bg-gradient-to-r from-green-400 via-yellow-400 to-red-400";
        }
    };

    const getAirQualityTips = (aqi: number): string => {
        if (aqi <= 50) {
            return "Air Quality is Good! Enjoy outdoor activities.";
        } else if (aqi <= 100) {
            return "Moderate air quality. It’s safe to go outside, but sensitive individuals may experience discomfort.";
        } else if (aqi <= 150) {
            return "Unhealthy for sensitive groups. Limit prolonged outdoor activities if you have respiratory conditions.";
        } else if (aqi <= 200) {
            return "Unhealthy air quality. Avoid outdoor activities, especially for children, the elderly, and those with health conditions.";
        } else if (aqi <= 300) {
            return "Very unhealthy. Avoid any outdoor activities and stay indoors.";
        } else {
            return "Hazardous air quality. Stay indoors and take necessary precautions.";
        }
    };

    const getAirQualityCardBackground = (aqi: number): string => {
        if (aqi <= 50) return "bg-green-400";
        if (aqi <= 100) return "bg-yellow-400";
        if (aqi <= 150) return "bg-orange-400";
        if (aqi <= 200) return "bg-red-500";
        if (aqi <= 300) return "bg-purple-600";
        return "bg-gray-800";
    };


    const fetchLocalTime = async (lat: number, lng: number) => {
        try {
            const timezoneResponse = await fetch(
                `https://api.ipgeolocation.io/timezone?apiKey=3c3393fc91204af482c4a49d9a2a78e4&lat=${lat}&long=${lng}`
            );
            const timezoneData = await timezoneResponse.json();
            setLocalTime(timezoneData.date_time_txt);
            // Fetch Air Quality Data
            const airQualityResponse = await fetch(
                `https://api.waqi.info/feed/geo:${lat};${lng}/?token=2ca76f62cf966359a5c77c7959d735415fdf336e`
            );
            const airQualityDataJson = await airQualityResponse.json();
            setAirQualityData({
                aqi: airQualityDataJson.data.aqi,
            });
        } catch (error) {
            console.error("Error fetching local time:", error);
            setLocalTime(null);
        }
    };

    const fetchWeather = async () => {
        if (!city) {
            setError("Please enter a city");
            return;
        }
        try {
            setError(null);

            const geocodeResponse = await fetch(
                `https://api.opencagedata.com/geocode/v1/json?q=${city.trim()}&key=1a93f7156fd446519b8758b11b9fbf83`
            );

            const geocodeData = await geocodeResponse.json();
            if (!geocodeResponse.ok || geocodeData.results.length === 0) {
                setError("City not found. Please enter a valid city name.");
                return;
            }

            const { lat, lng } = geocodeData.results[0].geometry;
            setLocation(geocodeData.results[0].formatted);

            const weatherResponse = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&hourly=temperature_2m,weathercode&timezone=auto`
            );

            const weatherDataJson = await weatherResponse.json();
            setWeatherData({
                temperature: weatherDataJson.current_weather.temperature,
                windspeed: weatherDataJson.current_weather.windspeed,
                weathercode: weatherDataJson.current_weather.weathercode,
            });

            // Process daily forecast data with weather codes
            const dailyData = weatherDataJson.daily.time.map((date: string, index: number) => ({
                date,
                temperatureMax: weatherDataJson.daily.temperature_2m_max[index],
                temperatureMin: weatherDataJson.daily.temperature_2m_min[index],
                weathercode: weatherDataJson.daily.weathercode[index],
            }));
            setDailyForecast(dailyData);

            // Process hourly forecast data - next 24 hours
            const currentHour = new Date().getHours();
            const hourlyData = weatherDataJson.hourly.time
                .slice(currentHour, currentHour + 24)
                .map((time: string, index: number) => ({
                    time,
                    temperature: weatherDataJson.hourly.temperature_2m[currentHour + index],
                    weathercode: weatherDataJson.hourly.weathercode[currentHour + index],
                }));
            setHourlyForecast(hourlyData);

            fetchLocalTime(lat, lng);
        } catch (error: any) {
            setError(error.message);
        }
    };



    const getWeatherEmoji = (weatherCode: number): string => {
        switch (weatherCode) {
            case 0: return "☀️"; // Clear sky
            case 1: return "🌤️"; // Partly cloudy
            case 2: return "☁️"; // Overcast
            case 3: return "🌧️"; // Rainy
            case 45:
            case 48: return "🌫️"; // Foggy
            case 51:
            case 53:
            case 55: return "🌦️"; // Drizzle
            case 61:
            case 63:
            case 65: return "🌧️"; // Rain
            case 71:
            case 73:
            case 75: return "🌨️"; // Snow
            case 77: return "❄️"; // Snow grains
            case 80:
            case 81:
            case 82: return "🌧️"; // Rain showers
            case 85:
            case 86: return "🌨️"; // Snow showers
            case 95: return "⛈️"; // Thunderstorm
            case 96:
            case 99: return "⛈️"; // Thunderstorm with hail
            default: return "🌡️";
        }
    };

    const getBackgroundTheme = (weatherCode: number) => {
        switch (weatherCode) {
            case 0: return "bg-gradient-to-br from-yellow-400 to-orange-600";
            case 1: return "bg-gradient-to-br from-blue-300 to-gray-500";
            case 2: return "bg-gray-500";
            case 3: return "bg-blue-900 animate-raindrops";
            default: return "bg-gradient-to-br from-blue-300 via-indigo-300 to-purple-400";
        }
    };

    const getWeatherConditionDescription = (weatherCode: number) => {
        switch (weatherCode) {
            case 0: return "Clear sky";
            case 1: return "Partly cloudy";
            case 2: return "Overcast";
            case 3: return "Rainy";
            case 45:
            case 48: return "Foggy";
            case 51:
            case 53:
            case 55: return "Drizzle";
            case 61:
            case 63:
            case 65: return "Rain";
            case 71:
            case 73:
            case 75: return "Snow";
            case 77: return "Snow grains";
            case 80:
            case 81:
            case 82: return "Rain showers";
            case 85:
            case 86: return "Snow showers";
            case 95: return "Thunderstorm";
            case 96:
            case 99: return "Thunderstorm with hail";
            default: return "Unknown weather condition";
        }
    };

    const scrollbarHideStyles = `
        .hide-scrollbar {
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
    `;

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center text-gray-800 ${getBackgroundTheme(weatherData?.weathercode ?? 0)}`}>
            <style>{scrollbarHideStyles}</style>

            <div className="bg-white bg-opacity-80 p-6 rounded-xl shadow-xl w-full max-w-4xl transition-transform transform hover:scale-105">
                <h1 className="text-3xl font-semibold font-poppins text-center mb-4 text-indigo-500">
                  <SparklesText text= "Weather Now"/>
                </h1>

                <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-6">
                    <input
                        type="text"
                        placeholder="Enter city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="border border-gray-300 p-2 rounded-md mb-4 text-gray-700 placeholder-gray-500"
                    />
                    <ShinyButton
                        onClick={fetchWeather}
                        className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white py-2 px-6 rounded-md font-medium hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 transform hover:scale-105"
                    >
                        Get Weather
                    </ShinyButton>
                </div>

                {error && <p className="text-red-500 text-center mt-4">{error}</p>}

                {location && (
                    <h2 className="text-2xl font-semibold text-center text-gray-700 mb-4">
                      {location}
                    </h2>
                )}

                {weatherData && (
                    <div className="flex flex-col space-y-2.5  items-center justify-between mt-6">
                        <div className="text-center md:text-left">
                            <p className="text-5xl font-bold text-indigo-600">
                                <NumberTicker value={weatherData.temperature}/>°C {getWeatherEmoji(weatherData.weathercode)}
                            </p>
                            <p className="text-2xl font-bold text-gray-600 mt-1">
                                {getWeatherConditionDescription(weatherData.weathercode)}
                            </p>
                            <h1 className="text-md text-gray-500 mt-2">
                                <Cover>Wind Speed: {weatherData.windspeed} km/h</Cover>
                            </h1>
                        </div>
                        {localTime && (
                            <div className="text-center md:text-left mt-4 md:mt-0">
                                <p className="text-lg text-gray-600">
                                    Local Time: {localTime}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Hourly Forecast */}
                {hourlyForecast.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-xl font-semibold text-center text-indigo-500 mb-4">
                            Hourly Forecast
                        </h2>
                        <div className="flex overflow-x-scroll space-x-4 p-2 hide-scrollbar">
                            {hourlyForecast.map((hour) => (
                                <div
                                    key={hour.time}
                                    className="flex-shrink-0 bg-white bg-opacity-90 p-3 w-28 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-center"
                                >
                                    <p className="font-semibold text-gray-700 text-sm">
                                        {new Date(hour.time).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}
                                    </p>
                                    <p className="text-2xl my-2">
                                        {getWeatherEmoji(hour.weathercode)}
                                    </p>
                                    <p className="font-bold text-gray-800">
                                        {Math.round(hour.temperature)}°C
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Daily Forecast */}
                {dailyForecast.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-xl font-semibold text-center text-indigo-500 mb-4">
                            7-Day Forecast
                        </h2>
                        <div className="flex overflow-x-scroll space-x-4 p-2 hide-scrollbar">
                            {dailyForecast.map((day) => (
                                <div
                                    key={day.date}
                                    className="flex-shrink-0 bg-white bg-opacity-90 p-4 w-32 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-center"
                                >
                                    <p className="font-semibold text-gray-700">
                                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                    </p>
                                    <p className="text-sm text-gray-500 mb-2">
                                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </p>
                                    <p className="text-2xl mb-2">
                                        {getWeatherEmoji(day.weathercode)}
                                    </p>
                                    <div className="flex flex-col items-center">
                                        <span className="font-bold text-gray-800 text-lg">
                                            {Math.round(day.temperatureMax)}°
                                        </span>
                                        <span className="text-gray-500 text-sm">
                                            {Math.round(day.temperatureMin)}°
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Weather tips card */}
                {weatherData && (
                    <div className={`mt-6 p-4 rounded-xl shadow-md ${getTipsCardBackground(weatherData.weathercode)}`}>
                        <h2 className="text-xl font-semibold text-slate-500 text-center mb-3">
                            Weather Tip
                        </h2>
                        <p className="text-slate-500 text-center text-lg">{getWeatherTip(weatherData.temperature)}</p>
                    </div>
                )}

                {/* Air Quality card */}
                {airQualityData && (
                    <div className={`mt-6 p-4 rounded-xl shadow-md ${getAirQualityCardBackground(airQualityData.aqi)}`}>
                        <h2 className="text-xl font-semibold text-white text-center mb-3">
                            Air Quality Index (AQI)
                        </h2>
                        <p className="text-white text-center text-lg">
                            AQI: {airQualityData.aqi}
                        </p>
                        <p className="text-white text-center mt-2 text-lg">
                            {getAirQualityTips(airQualityData.aqi)}
                        </p>
                    </div>
                )}

            </div>

            <Particles
                className="absolute inset-0"
                quantity={100}
                ease={80}
                color={getParticleColor(weatherData?.temperature)}
                refresh
            />
        </div>
    );
};

export default WeatherApp;