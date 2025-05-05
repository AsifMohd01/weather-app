// API Key for OpenWeatherMap
const API_KEY = "dbf07141fc58b36f6611fa67403ac414" // Your OpenWeatherMap API key

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Lucide icons
  const lucide = window.lucide;
  lucide.createIcons();
  
  // Set current year in footer
  document.getElementById('current-year').textContent = new Date().getFullYear();

  // DOM Elements
  const navbar = document.querySelector('.navbar');
  const mobileMenuButton = document.querySelector('.mobile-menu-button');
  const mobileMenu = document.querySelector('.mobile-menu');
  const navLinks = document.querySelectorAll('.nav-link');
  const pages = document.querySelectorAll('.page');
  const mainSearchContainer = document.getElementById('main-search-container');
  
  const citySearchInput = document.getElementById('city-search');
  const searchResults = document.getElementById('search-results');
  const cityName = document.getElementById('city-name');
  const weatherDescription = document.getElementById('weather-description');
  const currentTemp = document.getElementById('current-temp');
  const weatherIconImg = document.getElementById('weather-icon-img');
  const hourlyForecast = document.getElementById('hourly-forecast');
  const realFeel = document.getElementById('real-feel');
  const windSpeed = document.getElementById('wind-speed');
  const rainChance = document.getElementById('rain-chance');
  const uvIndex = document.getElementById('uv-index');
  const weeklyForecast = document.getElementById('weekly-forecast');
  const favoriteCities = document.getElementById('favorite-cities');
  const citySearch1 = document.getElementById('city-search-1');
  const citySearch2 = document.getElementById('city-search-2');
  const searchResults1 = document.getElementById('search-results-1');
  const searchResults2 = document.getElementById('search-results-2');
  const cityWeather1 = document.getElementById('city-weather-1');
  const cityWeather2 = document.getElementById('city-weather-2');
  const addFavoriteBtn = document.getElementById('add-favorite-btn');
  const unitToggles = document.querySelectorAll('.unit-toggle');
  const windToggles = document.querySelectorAll('.wind-toggle');
  const notification = document.getElementById('notification');

  // Settings
  let temperatureUnit = localStorage.getItem('temperatureUnit') || 'celsius'; // celsius or fahrenheit
  let windSpeedUnit = localStorage.getItem('windSpeedUnit') || 'kmh'; // kmh or mph

  // Set initial active toggles based on saved settings
  unitToggles.forEach(toggle => {
    toggle.classList.toggle('active', toggle.getAttribute('data-unit') === temperatureUnit);
  });

  windToggles.forEach(toggle => {
    toggle.classList.toggle('active', toggle.getAttribute('data-wind') === windSpeedUnit);
  });

  // Navbar scroll effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  mobileMenuButton.addEventListener('click', () => {
    mobileMenu.classList.toggle('show');
    
    // Change icon based on menu state
    const icon = mobileMenuButton.querySelector('i');
    if (mobileMenu.classList.contains('show')) {
      icon.setAttribute('data-lucide', 'x');
    } else {
      icon.setAttribute('data-lucide', 'menu');
    }
    lucide.createIcons();
  });

  // Navigation
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const pageName = link.getAttribute('data-page');
      
      // Update active nav link
      navLinks.forEach(navLink => navLink.classList.remove('active'));
      link.classList.add('active');
      
      // Show active page
      pages.forEach(page => page.classList.remove('active'));
      document.getElementById(`${pageName}-page`).classList.add('active');
      
      // Hide mobile menu after navigation
      mobileMenu.classList.remove('show');
      mobileMenuButton.querySelector('i').setAttribute('data-lucide', 'menu');
      lucide.createIcons();
      
      // Show/hide main search bar based on page
      if (pageName === 'compare') {
        mainSearchContainer.style.display = 'none';
      } else {
        mainSearchContainer.style.display = 'block';
      }
    });
  });

  // Settings Toggles
  unitToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      unitToggles.forEach(t => t.classList.remove('active'));
      toggle.classList.add('active');
      temperatureUnit = toggle.getAttribute('data-unit');
      localStorage.setItem('temperatureUnit', temperatureUnit);
      
      // Update displayed temperatures
      updateTemperatureDisplay();
    });
  });

  windToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      windToggles.forEach(t => t.classList.remove('active'));
      toggle.classList.add('active');
      windSpeedUnit = toggle.getAttribute('data-wind');
      localStorage.setItem('windSpeedUnit', windSpeedUnit);
      
      // Update displayed wind speeds
      updateWindSpeedDisplay();
    });
  });

  // Improved search functionality
  citySearchInput.addEventListener('input', debounce(e => {
    searchCities(e.target.value, searchResults);
  }, 300));
  
  citySearch1.addEventListener('input', debounce(e => {
    searchCities(e.target.value, searchResults1);
  }, 300));
  
  citySearch2.addEventListener('input', debounce(e => {
    searchCities(e.target.value, searchResults2);
  }, 300));

  // Focus events for search inputs
  citySearchInput.addEventListener('focus', () => {
    if (citySearchInput.value.trim().length >= 3) {
      searchCities(citySearchInput.value, searchResults);
    }
  });
  
  citySearch1.addEventListener('focus', () => {
    if (citySearch1.value.trim().length >= 3) {
      searchCities(citySearch1.value, searchResults1);
    }
  });
  
  citySearch2.addEventListener('focus', () => {
    if (citySearch2.value.trim().length >= 3) {
      searchCities(citySearch2.value, searchResults2);
    }
  });

  // Click outside to close search results
  document.addEventListener('click', e => {
    if (!e.target.closest('.search-bar')) {
      searchResults.style.display = 'none';
      if (searchResults1) searchResults1.style.display = 'none';
      if (searchResults2) searchResults2.style.display = 'none';
    }
  });

  // Add event listener to toggle favorite status for current city
  addFavoriteBtn.addEventListener('click', () => {
    const cityText = cityName.textContent;
    if (cityText && cityText !== 'Loading...') {
      const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      const cityData = recentSearches.find(city => city.name.includes(cityText));
      
      if (cityData) {
        const isNowFavorite = toggleFavoriteCity(cityData.lat, cityData.lon, cityData.name);
        if (isNowFavorite) {
          showNotification(`${cityText} added to favorites!`);
        } else {
          showNotification(`${cityText} removed from favorites!`);
        }
      }
    }
  });

  // Debounce function to limit API calls
  function debounce(func, delay) {
    let timeout;
    return function() {
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Enhanced searchCities function with better error handling and user feedback
  async function searchCities(searchTerm, resultsElement) {
    searchTerm = searchTerm.trim();
    
    if (searchTerm.length < 3) {
      resultsElement.style.display = 'none';
      return;
    }
    
    try {
      // Show loading indicator in the search results
      resultsElement.innerHTML = '<div class="search-result-item">Searching...</div>';
      resultsElement.style.display = 'block';
      
      const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${searchTerm}&limit=5&appid=${API_KEY}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        resultsElement.innerHTML = '<div class="search-result-item">No cities found</div>';
      } else {
        resultsElement.innerHTML = data.map(city => 
          `<div class="search-result-item" data-lat="${city.lat}" data-lon="${city.lon}" data-name="${city.name}, ${city.country}">
            ${city.name}, ${city.state ? city.state + ', ' : ''}${city.country}
          </div>`
        ).join('');
        
        // Add click event to search results
        const resultItems = resultsElement.querySelectorAll('.search-result-item');
        resultItems.forEach(item => {
          item.addEventListener('click', () => {
            const lat = item.getAttribute('data-lat');
            const lon = item.getAttribute('data-lon');
            const name = item.getAttribute('data-name');
            
            // Update the input value with the selected city
            if (resultsElement === searchResults) {
              citySearchInput.value = name;
              getWeatherData(lat, lon, name);
            } else if (resultsElement === searchResults1) {
              citySearch1.value = name;
              getCompareWeatherData(lat, lon, name, cityWeather1);
            } else if (resultsElement === searchResults2) {
              citySearch2.value = name;
              getCompareWeatherData(lat, lon, name, cityWeather2);
            }
            
            // Hide search results after selection
            resultsElement.style.display = 'none';
          });
        });
      }
    } catch (error) {
      console.error('Error searching for cities:', error);
      resultsElement.innerHTML = '<div class="search-result-item">Error searching for cities. Please try again.</div>';
    }
  }

  // Get weather data for a location
  async function getWeatherData(lat, lon, name) {
    try {
      // Show loading state
      cityName.textContent = 'Loading...';
      weatherDescription.textContent = 'Fetching weather data...';
      
      // Get current weather
      const currentResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
      
      if (!currentResponse.ok) {
        throw new Error(`API request failed with status ${currentResponse.status}`);
      }
      
      const currentData = await currentResponse.json();
      
      // Get forecast data
      const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
      
      if (!forecastResponse.ok) {
        throw new Error(`API request failed with status ${forecastResponse.status}`);
      }
      
      const forecastData = await forecastResponse.json();
      
      // Update UI with weather data
      updateWeatherUI(currentData, forecastData, name);
      
      // Save to recent searches
      saveRecentSearch(lat, lon, name);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      cityName.textContent = 'Error';
      weatherDescription.textContent = 'Could not fetch weather data. Please try again.';
    }
  }

  // Get weather data for comparison
  async function getCompareWeatherData(lat, lon, name, targetElement) {
    try {
      // Show loading state
      targetElement.innerHTML = '<div>Loading...</div>';
      targetElement.classList.remove('has-data');
      
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update comparison UI
      targetElement.classList.add('has-data');
      targetElement.innerHTML = `
        <div class="city-card-info">
          <h2>${name.split(',')[0]}</h2>
          <p>${data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1)}</p>
          <div class="city-card-temp">${formatTemperature(data.main.temp)}°</div>
        </div>
        <div class="weather-icon">
          <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="Weather icon">
        </div>
        <div class="city-card-details">
          <p>Humidity: ${data.main.humidity}%</p>
          <p>Wind: ${formatWindSpeed(data.wind.speed)}</p>
          <p>Feels like: ${formatTemperature(data.main.feels_like)}°</p>
          <p>Pressure: ${data.main.pressure} hPa</p>
        </div>
      `;
      
      // Save the city data as an attribute for later reference
      targetElement.setAttribute('data-city', JSON.stringify({
        lat, lon, name, data
      }));
    } catch (error) {
      console.error('Error fetching comparison weather data:', error);
      targetElement.innerHTML = '<div>Error fetching weather data. Please try again.</div>';
      targetElement.classList.remove('has-data');
    }
  }

  // Update the weather UI with fetched data
  function updateWeatherUI(currentData, forecastData, name) {
    // Update current weather
    cityName.textContent = name.split(',')[0];
    weatherDescription.textContent = `${currentData.weather[0].description.charAt(0).toUpperCase() + currentData.weather[0].description.slice(1)}`;
    currentTemp.textContent = formatTemperature(currentData.main.temp);
    weatherIconImg.src = `https://openweathermap.org/img/wn/${currentData.weather[0].icon}@4x.png`;
    
    // Update air conditions
    realFeel.textContent = `${formatTemperature(currentData.main.feels_like)}°`;
    windSpeed.textContent = formatWindSpeed(currentData.wind.speed);
    rainChance.textContent = `${currentData.rain ? Math.round((currentData.rain['1h'] || 0) * 100) : 0}%`;
    uvIndex.textContent = '3'; // OpenWeatherMap doesn't provide UV index in the free tier
    
    // Update hourly forecast
    updateHourlyForecast(forecastData);
    
    // Update weekly forecast
    updateWeeklyForecast(forecastData);
    
    // Update favorite button state
    updateFavoriteButtonState(name);
  }

  // Update hourly forecast
  function updateHourlyForecast(forecastData) {
    // Get the next 6 forecasts (3-hour intervals)
    const limitedForecasts = forecastData.list.slice(0, 6);
    
    hourlyForecast.innerHTML = limitedForecasts.map(item => {
      const time = new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="hourly-item">
          <p>${time}</p>
          <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="Weather icon">
          <p class="hourly-temp">${formatTemperature(item.main.temp)}°</p>
        </div>
      `;
    }).join('');
  }

  // Update weekly forecast
  function updateWeeklyForecast(forecastData) {
    // Group forecasts by day
    const dailyForecasts = {};
    forecastData.list.forEach(item => {
      const date = new Date(item.dt * 1000).toLocaleDateString();
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = {
          temps: [],
          icons: [],
          conditions: []
        };
      }
      dailyForecasts[date].temps.push(item.main.temp);
      dailyForecasts[date].icons.push(item.weather[0].icon);
      dailyForecasts[date].conditions.push(item.weather[0].description);
    });
    
    // Convert to array and sort by date
    const sortedDays = Object.keys(dailyForecasts).sort((a, b) => new Date(a) - new Date(b));
    
    // Limit to 7 days
    const limitedDays = sortedDays.slice(0, 7);
    
    weeklyForecast.innerHTML = limitedDays.map(date => {
      const day = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
      const temps = dailyForecasts[date].temps;
      const maxTemp = Math.max(...temps);
      const minTemp = Math.min(...temps);
      
      // Get most frequent icon and condition
      const iconCounts = {};
      dailyForecasts[date].icons.forEach(icon => {
        iconCounts[icon] = (iconCounts[icon] || 0) + 1;
      });
      const mostFrequentIcon = Object.keys(iconCounts).reduce((a, b) => iconCounts[a] > iconCounts[b] ? a : b);
      
      const conditionCounts = {};
      dailyForecasts[date].conditions.forEach(condition => {
        conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
      });
      const mostFrequentCondition = Object.keys(conditionCounts).reduce((a, b) => 
        conditionCounts[a] > conditionCounts[b] ? a : b
      );
      
      return `
        <div class="weekly-item">
          <div class="weekly-day">${day}</div>
          <div class="weekly-icon">
            <img src="https://openweathermap.org/img/wn/${mostFrequentIcon}.png" alt="Weather icon">
          </div>
          <div class="weekly-condition">${mostFrequentCondition.charAt(0).toUpperCase() + mostFrequentCondition.slice(1)}</div>
          <div class="weekly-temp">${formatTemperature(maxTemp)}°<span>/${formatTemperature(minTemp)}°</span></div>
        </div>
      `;
    }).join('');
  }

  // Format temperature based on selected unit
  function formatTemperature(celsius) {
    if (temperatureUnit === 'fahrenheit') {
      return Math.round((celsius * 9) / 5 + 32);
    }
    return Math.round(celsius);
  }

  // Format wind speed based on selected unit
  function formatWindSpeed(speed) {
    // OpenWeatherMap returns wind speed in m/s
    const kmh = speed * 3.6;
    
    if (windSpeedUnit === 'mph') {
      return `${Math.round(kmh * 0.621371)} mph`;
    }
    return `${Math.round(kmh)} km/h`;
  }

  // Update temperature displays when unit changes
  function updateTemperatureDisplay() {
    // Re-fetch weather data for current city
    const cityText = cityName.textContent;
    if (cityText && cityText !== 'Loading...') {
      const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      const cityData = recentSearches.find(city => city.name.includes(cityText));
      
      if (cityData) {
        getWeatherData(cityData.lat, cityData.lon, cityData.name);
      }
    }
    
    // Update comparison cities if they exist
    updateComparisonTemperatures();
    
    // Update favorite cities
    loadFavoriteCities();
  }

  // Update wind speed displays when unit changes
  function updateWindSpeedDisplay() {
    // Similar to updateTemperatureDisplay, re-fetch data
    const cityText = cityName.textContent;
    if (cityText && cityText !== 'Loading...') {
      const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      const cityData = recentSearches.find(city => city.name.includes(cityText));
      
      if (cityData) {
        getWeatherData(cityData.lat, cityData.lon, cityData.name);
      }
    }
    
    // Update comparison cities
    updateComparisonTemperatures();
    
    // Update favorite cities
    loadFavoriteCities();
  }

  // Update comparison temperatures
  function updateComparisonTemperatures() {
    // Check if we have city data stored in the elements
    if (cityWeather1.hasAttribute('data-city')) {
      try {
        const cityData = JSON.parse(cityWeather1.getAttribute('data-city'));
        getCompareWeatherData(cityData.lat, cityData.lon, cityData.name, cityWeather1);
      } catch (e) {
        console.error('Error parsing city data:', e);
      }
    }
    
    if (cityWeather2.hasAttribute('data-city')) {
      try {
        const cityData = JSON.parse(cityWeather2.getAttribute('data-city'));
        getCompareWeatherData(cityData.lat, cityData.lon, cityData.name, cityWeather2);
      } catch (e) {
        console.error('Error parsing city data:', e);
      }
    }
  }

  // Save recent search to localStorage
  function saveRecentSearch(lat, lon, name) {
    const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    
    // Check if city already exists
    const existingIndex = recentSearches.findIndex(city => city.name === name);
    
    if (existingIndex !== -1) {
      // Remove existing entry
      recentSearches.splice(existingIndex, 1);
    }
    
    // Add to beginning of array
    recentSearches.unshift({ lat, lon, name });
    
    // Limit to 10 recent searches
    const limitedSearches = recentSearches.slice(0, 10);
    
    localStorage.setItem('recentSearches', JSON.stringify(limitedSearches));
  }

  // Update favorite button state
  function updateFavoriteButtonState(name) {
    const favoriteCitiesList = JSON.parse(localStorage.getItem('favoriteCities') || '[]');
    const isFavorite = favoriteCitiesList.some(city => city.name === name);
    
    if (isFavorite) {
      addFavoriteBtn.textContent = 'Remove Favorite';
      addFavoriteBtn.classList.add('active');
    } else {
      addFavoriteBtn.textContent = 'Add Favorite';
      addFavoriteBtn.classList.remove('active');
    }
  }

  // Toggle favorite city
  function toggleFavoriteCity(lat, lon, name) {
    const favoriteCitiesList = JSON.parse(localStorage.getItem('favoriteCities') || '[]');
    
    // Check if city already exists
    const existingIndex = favoriteCitiesList.findIndex(city => city.name === name);
    
    if (existingIndex === -1) {
      // Add to favorites
      favoriteCitiesList.push({ lat, lon, name });
      localStorage.setItem('favoriteCities', JSON.stringify(favoriteCitiesList));
      
      // Update button state
      updateFavoriteButtonState(name);
      
      // Reload favorite cities
      loadFavoriteCities();
      
      return true;
    } else {
      // Remove from favorites
      favoriteCitiesList.splice(existingIndex, 1);
      localStorage.setItem('favoriteCities', JSON.stringify(favoriteCitiesList));
      
      // Update button state
      updateFavoriteButtonState(name);
      
      // Reload favorite cities
      loadFavoriteCities();
      
      return false;
    }
  }

  // Load favorite cities
  async function loadFavoriteCities() {
    const favoriteCitiesList = JSON.parse(localStorage.getItem('favoriteCities') || '[]');
    
    if (favoriteCitiesList.length === 0) {
      favoriteCities.innerHTML = "<p>No favorite cities yet. Search for a city and add it to favorites.</p>";
      return;
    }
    
    // Clear current favorites
    favoriteCities.innerHTML = '';
    
    // Load each favorite city
    for (const city of favoriteCitiesList) {
      try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&appid=${API_KEY}&units=metric`);
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        
        const cityCard = document.createElement('div');
        cityCard.className = 'city-card';
        cityCard.innerHTML = `
          <div class="city-card-info">
            <h2>${city.name.split(',')[0]}</h2>
            <p>${data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1)}</p>
            <div class="city-card-temp">${formatTemperature(data.main.temp)}°</div>
          </div>
          <div class="weather-icon">
            <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="Weather icon">
          </div>
          <div class="city-card-details">
            <p>Humidity: ${data.main.humidity}%</p>
            <p>Wind: ${formatWindSpeed(data.wind.speed)}</p>
            <p>Feels like: ${formatTemperature(data.main.feels_like)}°</p>
          </div>
          <div class="city-card-actions">
            <button class="view" title="View city">
              <i data-lucide="eye"></i>
            </button>
            <button class="remove" title="Remove from favorites">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        `;
        
        // Initialize Lucide icons in the new card
        lucide.createIcons({
          icons: {
            Eye: () => lucide.icons.eye,
            Trash2: () => lucide.icons.trash2
          },
          attrs: {
            stroke: 'currentColor',
            'stroke-width': 2,
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round'
          },
          element: cityCard
        });
        
        // Add event listeners
        const viewButton = cityCard.querySelector('.view');
        viewButton.addEventListener('click', () => {
          getWeatherData(city.lat, city.lon, city.name);
          
          // Switch to weather page
          navLinks.forEach(navLink => navLink.classList.remove('active'));
          document.querySelector('[data-page="weather"]').classList.add('active');
          
          pages.forEach(page => page.classList.remove('active'));
          document.getElementById('weather-page').classList.add('active');
          
          // Show main search bar
          mainSearchContainer.style.display = 'block';
        });
        
        const removeButton = cityCard.querySelector('.remove');
        removeButton.addEventListener('click', () => {
          toggleFavoriteCity(city.lat, city.lon, city.name);
          showNotification(`${city.name.split(',')[0]} removed from favorites`);
        });
        
        favoriteCities.appendChild(cityCard);
      } catch (error) {
        console.error('Error loading favorite city:', error);
      }
    }
  }

  // Show notification
  function showNotification(message) {
    notification.textContent = message;
    notification.classList.add('show');
    notification.classList.add('fade-in-up');
    
    // Hide notification after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }

  // Initialize the app
  function initApp() {
    // Load favorite cities
    loadFavoriteCities();
    
    // Load last searched city if available
    const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    if (recentSearches.length > 0) {
      const lastCity = recentSearches[0];
      getWeatherData(lastCity.lat, lastCity.lon, lastCity.name);
    }
  }

  // Start the app
  initApp();
});