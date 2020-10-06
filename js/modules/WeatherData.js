import City from './City.js';

export default class WeatherData{
    constructor(City, CurrentWeather, DailyWeather, HourlyWeather){
        this.City = City;
        this.CurrentWeather = CurrentWeather;
        this.DailyWeather = DailyWeather;
        this.HourlyWeather = HourlyWeather;
    }
}