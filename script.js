'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, duration) {
    this.coords = coords;
    this.duration = duration;
  }

  setDescription() {
    // prettier-ignore
    const month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      month[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, duration, distance, cadence) {
    super(coords, duration);
    this.distance = distance;
    this.cadence = cadence;
    this.calcPace();
    this.setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, duration, distance, elevationGain) {
    super(coords, duration);
    this.distance = distance;
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this.setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class Surfing extends Workout {
  type = 'surfing';
  constructor(coords, duration, waves) {
    super(coords, duration);
    this.waves = waves;
    this.setDescription();
  }
}

//////////////////////////////////////////////
// APP ARCHITECTURE
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const rowDistance = document.querySelector('.distance-row');
const rowWaves = document.querySelector('.waves-row');
const rowDuration = document.querySelector('.duration-row');
const rowCadence = document.querySelector('.cadence-row');
const rowElevation = document.querySelector('.elevation-row');

const inputDistance = document.querySelector('.form__input--distance');
const inputWaves = document.querySelector('.form__input--waves');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    //get user's position
    this._getPosition();

    //get data from local storage
    this._getLocalStorage();

    //Submit form & display the marker
    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._changingFieldsVisibility);

    containerWorkouts.addEventListener('click', this._moveToPopUp.bind(this));
  }

  //geolocation API -> get position, if true = function loadMap, if false function alert
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Couldn't get your position!");
        }
      );
  }

  // if geolocation's true, get coords and get leaflet map
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 15);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // get user current location marked on the map
    L.marker(coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          closeButton: false,
          className: 'current-position-popup',
        })
      )
      .setPopupContent('You are here!')
      .openPopup();

    // when the user clicks on the map
    this.#map.on('click', this._showForm.bind(this));

    //render markers on the map
    this.#workouts.forEach(w => {
      this._renderWorkoutMarker(w);
    });
  }

  // function when the user clicks on the map
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.toggle('hidden');
    form.classList.toggle('form--transition');
    inputDistance.classList.contains('hidden')
      ? inputWaves.focus()
      : inputDistance.focus();
  }

  // hide form
  _hideForm() {
    // empty inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
      inputWaves.value =
        '';
    form.classList.toggle('hidden');
    form.classList.toggle('form--transition');
  }

  // managing fields btw running, cycling and surfing workouts
  _changingFieldsVisibility() {
    if (inputType.value === 'running') {
      rowCadence.classList.remove('hidden');
      rowDistance.classList.remove('hidden');
      rowElevation.classList.add('hidden');
      rowWaves.classList.add('hidden');
    } else if (inputType.value === 'cycling') {
      rowCadence.classList.add('hidden');
      rowDistance.classList.remove('hidden');
      rowElevation.classList.remove('hidden');
      rowWaves.classList.add('hidden');
    } else {
      rowCadence.classList.add('hidden');
      rowDistance.classList.add('hidden');
      rowElevation.classList.add('hidden');
      rowWaves.classList.remove('hidden');
    }
  }

  //function when a new workout is created
  _newWorkout(e) {
    e.preventDefault();
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    //Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //If workout running, create run object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Check if data is valid
      if (
        !Number.isFinite(distance) ||
        !Number.isFinite(duration) ||
        !Number.isFinite(cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Running([lat, lng], duration, distance, cadence);
    }

    //If workout cycling, create run object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !Number.isFinite(distance) ||
        !Number.isFinite(duration) ||
        !Number.isFinite(elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Cycling([lat, lng], duration, distance, elevation);
    }

    //If workout surfing, create run object
    if (type === 'surfing') {
      const waves = +inputWaves.value;
      if (
        !Number.isFinite(duration) ||
        !Number.isFinite(waves) ||
        !allPositive(duration, waves)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Surfing([lat, lng], duration, waves);
    }

    //Add new object to workout array
    this.#workouts.push(workout);

    //Render workout on map as marker
    this._renderWorkoutMarker(workout);

    //Render workouts on list
    this._renderWorkout(workout);

    //Hide form and clear input fields
    this._hideForm();

    //Set local storage
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${this.checkWorkoutEmoji(workout.type)} ${workout.description}`
      )
      .openPopup();
  }

  checkWorkoutEmoji(workoutType) {
    if (workoutType === 'running') {
      return '🏃🏻‍♂️';
    } else if (workoutType === 'cycling') {
      return '🚴🏻';
    } else {
      return '🏄🏻‍♂️';
    }
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
         <span class="workout__icon">${this.checkWorkoutEmoji(
           workout.type
         )}</span>
         `;

    if (workout.type === 'running') {
      html += `
      <span class="workout__value">${workout.distance}</span>
         <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
         <span class="workout__icon">⏱</span>
         <span class="workout__value">${workout.duration}</span>
         <span class="workout__unit">min</span>
      </div>
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
        `;
      form.insertAdjacentHTML('afterend', html);
    }

    if (workout.type === 'cycling') {
      html += `
      <span class="workout__value">${workout.distance}</span>
         <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
         <span class="workout__icon">⏱</span>
         <span class="workout__value">${workout.duration}</span>
         <span class="workout__unit">min</span>
      </div>
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
        `;
      form.insertAdjacentHTML('afterend', html);
    }

    if (workout.type === 'surfing') {
      html += `
        <div class="workout__details">
            <span class="workout__icon"> </span>
            <span class="workout__value">${workout.waves}</span>
            <span class="workout__unit">waves</span>
          </div>
        </li>
        `;

      form.insertAdjacentHTML('afterend', html);
    }
  }
  _moveToPopUp(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(w => w.id === workoutEl.dataset.id);

    this.#map.setView(workout.coords, 17, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(w => {
      this._renderWorkout(w);
    });
  }
}

const app = new App();
