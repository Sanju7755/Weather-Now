"use client";

import { useState } from 'react';
import { Cover } from "@/components/ui/cover";
import Particles from "@/components/ui/particles";
import NumberTicker from "@/components/ui/number-ticker"
import ShinyButton from "@/components/ui/shiny-button";

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
    const [error, setError] = useState<string | null>(null);
    const [localTime, setLocalTime] = useState<string | null>(null);

    const getParticleColor = (temperature: number | null): string => {
        if (temperature === null) return "#ffffff"; // Default white

        if (temperature <= 0) return "#a5f3fc"; // Very cold (light blue)
        if (temperature <= 10) return "#60a5fa"; // Cold (blue)
        if (temperature <= 20) return "#22c55e"; // Mild (green)
        if (temperature <= 30) return "#f59e0b"; // Warm (orange)
        return "#ef4444"; // Hot (red)
    };

    const fetchLocalTime = async (lat: number, lng: number) => {
        try {
            const timezoneResponse = await fetch(
                `https://api.ipgeolocation.io/timezone?apiKey=3c3393fc91204af482c4a49d9a2a78e4&lat=${lat}&long=${lng}`
            );
            const timezoneData = await timezoneResponse.json();
            setLocalTime(timezoneData.date_time_txt);
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

            <div className="bg-white bg-opacity-80 p-6 rounded-xl shadow-xl max-w-4xl w-full transition-transform transform hover:scale-105">
                <h1 className="text-3xl font-semibold font-poppins text-center text-indigo-600 mb-4 font-">
                    Weather Now
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
                    <div className="flex flex-col md:flex-row items-center justify-between mt-6">
                        <div className="text-center md:text-left">
                            <p className="text-5xl font-bold text-gray-800">
                          <NumberTicker value={weatherData.temperature}/>°C {getWeatherEmoji(weatherData.weathercode)}
                            </p>
                            <p className="text-lg text-gray-600 mt-1">
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
                        <h2 className="text-xl font-semibold text-center text-indigo-600 mb-4">
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
                        <h2 className="text-xl font-semibold text-center text-indigo-600 mb-4">
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