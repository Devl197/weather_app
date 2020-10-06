import City from './City.js';
import WeatherData from './WeatherData.js';
import LocalStorageController from './LocalStorageController.js';
import { apiKey } from './secret.js';

export default class UI {
    constructor(){
        this.localStorage = new LocalStorageController();

        if(this.localStorage.getFromStorage('city') != null){
            this.City = this.localStorage.getFromStorage('city');
        } else this.City = new City(792680, 'Belgrade', 'RS', 44.804008, 20.46513);
        this.apiKey = apiKey;
        this.indexElements = {
            cityName: document.getElementById('cityName'),
            time: document.getElementById('time'),
            weatherImg: document.getElementById('weatherImg'),
            temp: document.getElementById('temp'),
            description: document.getElementById('description'),
            otherInfo: document.getElementById('otherInfo'),
            temperatureChart: document.getElementById('chartTemp'),
            precipitationChart: document.getElementById('chartPreci'),
            eightDatForecastList: document.getElementById('eightDayForecast'),
            cityNameField: document.getElementById('name'),
            searchButton: document.getElementById('searchCity'),
            searchResults:document.getElementById('searchResults')
        }
    }
    // .........................................................Initialising methods..........................................................
    
    // Method which initialize index page
    async initIndex(){
        
        // Adding click handler to search button
        this.indexElements.searchButton.addEventListener('click', () => this.handleSearch());
        this.indexElements.searchResults.addEventListener('click', event => this.handleResultsClick(event));
        const weatherData = await this.getFullWeather(this.City.lat, this.City.lon);
        this.populateData(weatherData); 
    }

    // ...............................................................Event handlers.......................................................

    // Event handler for searching cities
    async handleSearch(){
        const cityName = this.indexElements.cityNameField.value.trim().toLowerCase();
        if(cityName.length > 0){
            const weatherData = await this.getWeatherDataByName(cityName);
            if(weatherData != null){
                // Making results visible
                this.indexElements.searchResults.classList.remove('d-none');
                this.populateSearchResults(weatherData);
            }
        }
    }

    // Event that handles click event of searchResults field
    async handleResultsClick(event){
        let target = event.target;

        // Setting target to li element
        if(target.tagName === 'DIV'){
            target = target.parentNode.parentNode;
        } else if(target.tagName === 'IMG' || target.tagName === 'P'){
            target = target.parentNode.parentNode.parentNode;
        } else if(target.tagName === 'SPAN'){
            target = target.parentNode.parentNode.parentNode.parentNode;
        }

        const id = target.id;
        // Temporary object for lat and lon of selected city
        const city = await this.getCityForId(id);
        // Setting current city
        this.City = city;

        const weatherData = await this.getFullWeather(city.lat, city.lon);
        
        // Hiding search results container
        this.indexElements.searchResults.classList.add('d-none');
        // Clearing search field
        this.indexElements.cityNameField.value = '';
        // Setting city in local storage
        this.localStorage.setStorage('city', this.City);

        this.populateData(weatherData);
    }

    // ...............................................................Fetching methods.....................................................

    // Method which fetches full weather details from openweathermap.org (see 'https://openweathermap.org/api/one-call-api')
    async getFullWeather(lat, lon){
        const responseForCity = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&
        exclude=minutely&units=metric&appid=${this.apiKey}`);
        const dataForCity = await responseForCity.json();

        const weatherData = new WeatherData (this.City, dataForCity.current, dataForCity.daily, dataForCity.hourly);

        return weatherData;
    }

    // Method which fetches current weather (it is not structured the same way as in full weather details see 'https://samples.openweathermap.org/data/2.5/weather?id=2172797&appid=439d4b804bc8187953eb36d2a8c26a02') details by ID from openweathermap.org
    async getCurrentWeatherById(ID){
        const responseForCity = await fetch(`https://api.openweathermap.org/data/2.5/weather?id=${ID}&units=metric&appid=${this.apiKey}`);
        const dataForCity = await responseForCity.json();
        const weatherData = new WeatherData (new City(dataForCity.id, dataForCity.name, dataForCity.sys.country, dataForCity.coord.lat, dataForCity.coord.lon), dataForCity);

        return weatherData;

    }

    // Method which fetches current weather (it is not structured the same way as in full weather details see 'https://samples.openweathermap.org/data/2.5/weather?id=2172797&appid=439d4b804bc8187953eb36d2a8c26a02') details for an array of city IDs  from openweathermap.org
    async getCurrentWeatherByIds(IDs){

        const responseForCity = await fetch(`https://api.openweathermap.org/data/2.5/group?id=${IDs.toString()}&units=metric&appid=${this.apiKey}`);
        const dataForCites = await responseForCity.json();
        const weatherDataArray = [];

        for(let i = 0; i < dataForCites.cnt; ++i){
            weatherDataArray.push(new WeatherData (new City(dataForCites.list[i].id, dataForCites.list[i].name, dataForCites.list[i].sys.country, dataForCites.list[i].coord.lat, dataForCites.list[i].coord.lon), dataForCites.list[i]));
        }

        return weatherDataArray;
    }

    // Method which fetches current weather details for by name of specified city from openweathermap.org
    async getWeatherDataByName(cityName){
        let weatherDataArray = [];
        const idArray = [];

        if(cityName !== ''){
    
            //Fetching data from files
            const response = await fetch('./cities.json');
            const data = await response.json(); 
            
            data.forEach(val => {
                if(val.name.toLowerCase() == cityName.toLowerCase())
                    idArray.push(val.id);
            });

            if(idArray.length === 1){
                weatherDataArray[0] = await this.getCurrentWeatherById(idArray[0]);
            } else if(idArray.length > 1){
                weatherDataArray = await this.getCurrentWeatherByIds(idArray);
            } 
        
        }

        return weatherDataArray;
    }

    // Method that fetches lat and lon for given city ID
    async getCityForId(ID){

        let city;
         //Fetching data from files
         const response = await fetch('./cities.json');
         const data = await response.json(); 

         data.forEach(val => {
             if(val.id == ID){
                 city = new City(val.id, val.name, val.country, val.coord.lat, val.coord.lon);
                 return;
             }
         });

         return city;
    }
    // ......................................................Populating and drawing methods.................................................

    // Method which populates all data 
    populateData(data){

        this.populateMainDetails(data);
        this.populateEightDayForecast(data);
        this.drawTemperatureChart(data);
        this.drawPrecipitationChart(data);

    }

    // Method which populates main details
    populateMainDetails(data){
        const date = new Date(data.CurrentWeather.dt * 1000);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        this.indexElements.cityName.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${data.City.name}, ${data.City.country}`;

        this.indexElements.time.innerHTML = `${date.toLocaleTimeString('en-GB')} ${date.toLocaleDateString('en-GB', options)}`;

        this.indexElements.weatherImg.src = `http://openweathermap.org/img/wn/${data.CurrentWeather.weather[0].icon}@2x.png`;

        this.indexElements.temp.innerHTML = `${data.CurrentWeather.temp}&#176;C`;
        description.innerHTML = `Feels like ${data.CurrentWeather.feels_like}&#176;C ${data.CurrentWeather.weather[0].description}`;

        this.indexElements.otherInfo.innerHTML = `wind: ${data.CurrentWeather.wind_speed} m/s pressure: ${data.CurrentWeather.pressure} hPa humidity: ${data.CurrentWeather.humidity}% UV: ${data.CurrentWeather.uvi} dew point: ${data.CurrentWeather.dew_point}&#176;C visibility: ${data.CurrentWeather.visibility / 1000}km`;
    }

    // Method that populates forecast for eight days
    populateEightDayForecast(data){

        let res = "";
        data.DailyWeather.forEach(data => {
            res += `
            <li class="d-flex justify-content-center">
                <p class="d-inline-block align-self-center">${new Date(data.dt * 1000).toDateString()}</p>
                <img class="ml-4" src="http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="weather image" width="50" height="50">
                <p class="d-inline-block align-self-center">${data.temp.max}/${data.temp.min}°C ${data.weather[0].description}</p>
            </li>`
        });
        this.indexElements.eightDatForecastList.innerHTML = `
        <li class="d-flex justify-content-center">
            <p class="font-weight-bold mb-0">8-day Forecast</p>   
        </li>`;
        this.indexElements.eightDatForecastList.innerHTML += res;
    }

    // Method which draws chart that displays temperature across eight hours
    drawTemperatureChart (data) {
        const hours = data.HourlyWeather.map( x => new Date(x.dt * 1000).getHours());
        hours.splice(8, 48 - 8);
        const temp = data.HourlyWeather.map( x => x.temp);
        temp.splice(8, 48 - 8);
        
    
        var config = {
            type: 'line',
            data: {
                labels: hours,
                datasets: [{
                    label: 'temperature',
                    backgroundColor: `rgb(255, 204, 153)`,
                    borderColor: `rgb(255, 153, 51)`,
                    data: temp,
                    fill: true,
                }]
            },
            options: {
                responsive: true,
                title: {
                    display: true,
                    text: 'Hourly forecast'
                },
                legend: {
                    display: false
                },
                tooltips: {
                    mode: 'index',
                    intersect: true,
                },
                hover: {
                    animationDuration: 0,
                    mode: 'nearest',
                    intersect: true
                },
                layout: {
                    padding: {
                        right: 50
                    }
                },
                scales: {
                    xAxes: [{
                        gridLines: {
                            color: "rgba(0, 0, 0, 0)",
                        },
                        display: true,
                        scaleLabel: {
                            display: true,
                            labelString: 'hour'
                        }
                    }],
                    yAxes: [{
                        gridLines: {
                            color: "rgba(0, 0, 0, 0)",
                        },
                        display: true,
                        scaleLabel: {
                            display: true,
                            labelString: 'temp'
                        },
                        ticks:{
                            stepSize: 2
                        }
                    }]
                },
    
                animation: {
                    duration: 1000,
                    onComplete: function () {
                        // render the value of the chart above the bar
                        var ctx = this.chart.ctx;
                        ctx.font = Chart.helpers.fontString(Chart.defaults.global.defaultFontSize, 'normal', Chart.defaults.global.defaultFontFamily);
                        ctx.fillStyle = this.chart.config.options.defaultFontColor;
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'bottom';
                        this.data.datasets.forEach(function (dataset) {
                            for (var i = 0; i < dataset.data.length; i++) {
                                var model = dataset._meta[Object.keys(dataset._meta)[0]].data[i]._model;
                                ctx.fillText(`${dataset.data[i]}°C`, model.x, model.y - 5);
                            }
                        });
                }}
            },
            
        };
        var ctx1 = this.indexElements.temperatureChart.getContext('2d');
        window.myLine = new Chart(ctx1, config);
    }

    // Method which draws chart that displays precipitation across eight hours
    drawPrecipitationChart (data) {

        const hours = data.HourlyWeather.map( x => new Date(x.dt * 1000).getHours());
        hours.splice(8, 48 - 8);
        const pop = data.HourlyWeather.map( x => parseInt(x.pop * 100));
        pop.splice(8, 48 - 8);
    
        var config = {
            type: 'bar',
            data: {
                labels: hours,
                datasets: [{
                    label: 'precipitation',
                    backgroundColor: `rgb(64, 224, 208)`,
                    borderColor: `rgba(255, 99, 132, 0.2)`,
                    data: pop,
                    fill: true,
                }]
            },
            options: {
                responsive: true,
                title: {
                    display: true,
                    text: 'Hourly precipitation'
                },
                legend: {
                    display: false
                },
                tooltips: {
                    mode: 'index',
                    intersect: true,
                },
                hover: {
                    animationDuration: 0,
                    mode: 'nearest',
                    intersect: true
                },
                layout: {
                    padding: {
                        right: 50
                    }
                },
                scales: {
                    xAxes: [{
                        gridLines: {
                            color: "rgba(0, 0, 0, 0)",
                        },
                        display: true,
                        scaleLabel: {
                            display: true,
                            labelString: 'hour'
                        }
                    }],
                    yAxes: [{
                        gridLines: {
                            color: "rgba(0, 0, 0, 0)",
                        },
                        display: true,
                        scaleLabel: {
                            display: true,
                            labelString: 'precipitation in %'
                        },
                        ticks: {
                            beginAtZero: true,
                            max: 100,
                            min: 0
                        }
                    }],
                },
    
                animation: {
                    duration: 1000,
                    onComplete: function () {
                        // render the value of the chart above the bar
                        var ctx = this.chart.ctx;
                        ctx.font = Chart.helpers.fontString(Chart.defaults.global.defaultFontSize, 'normal', Chart.defaults.global.defaultFontFamily);
                        ctx.fillStyle = this.chart.config.options.defaultFontColor;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'bottom';
                        this.data.datasets.forEach(function (dataset) {
                            for (var i = 0; i < dataset.data.length; i++) {
                                var model = dataset._meta[Object.keys(dataset._meta)[0]].data[i]._model;
                                ctx.fillText(`${dataset.data[i]}%`, model.x, model.y - 5);
                            }
                        });
                }}
            },
            
        };
        var ctx2 = this.indexElements.precipitationChart.getContext('2d');
        window.myLine = new Chart(ctx2, config);
    }

    // Method which populates search results
    populateSearchResults(data){
        let res = '';
        data.forEach(val => {
            res += `
            <li id=${val.City.id} class="list-group-item">
                <div class="row">
                    <div class="col-md-4 d-flex justify-content-end align-items-center">
                        <img class="d-none d-sm-none d-md-block" width="60px" height="60px" src="http://openweathermap.org/img/wn/${val.CurrentWeather.weather[0].icon}@2x.png" alt="weather image" >
                    </div>
                    <div class="col-md-8" col-12>
                        <p class="mb-0">${val.City.name}, ${val.City.country} <span class="text-dark font-italic"${val.CurrentWeather.weather[0].description}</span></p>
                        <p class="mb-1"><span class="badge badge-pill badge-dark">${val.CurrentWeather.main.temp}&#176;C</span> temperature from ${val.CurrentWeather.main.temp_min}&#176;C to ${val.CurrentWeather.main.temp_max}&#176;C, wind ${val.CurrentWeather.wind.speed} m/s, presure ${val.CurrentWeather.main.pressure} hPa</p>
                        <p>Geo coords [${val.City.lat},${val.City.lon}]</p>
                    </div>
                </div>
            </li>`;
        });

        this.indexElements.searchResults.innerHTML = res;
    }
}

new UI().initIndex();