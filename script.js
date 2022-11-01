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
const fullWidthContainer = document.querySelector('.full-width-container');

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

const instructionsTxt = document.querySelector('.app-instructions--txt');

const clearAllWorkouts = document.querySelector('.clear-all--txt');
const modalParent = document.querySelector('.modal-parent');
const closeModalBtn = document.querySelector('.X');
const modalWindowTxt = document.querySelector('.modal-window--txt');

const deleteDesableCloseBtn = document.querySelector('.delete-desable-btn');
const deleteActiveBtn = document.querySelector('.delete-active-btn');

const moveToCurrentBtn = document.querySelector('.current-location--txt');

const backHomeBtn = document.querySelector('.back-home-btn');

class App {
  #map;
  #mapEvent;
  #workouts = [];
  #latitude;
  #longitude;

  constructor() {
    //get user's position
    this._getPosition();

    //get data from local storage
    this._getLocalStorage();

    //Submit form & display the marker
    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._changingFieldsVisibility);

    containerWorkouts.addEventListener('click', this._moveToPopUp.bind(this));

    //Opening modal when clear all workouts
    clearAllWorkouts.addEventListener(
      'click',
      this._openModalWindow.bind(this)
    );

    //Close modal with mouse click
    closeModalBtn.addEventListener('click', this._closeModalWindow.bind(this));

    //Close modal with keyboard event
    document.body.addEventListener(
      'keyup',
      this._closeModalWindowEsc.bind(this)
    );

    //Close modal with button inside modal
    deleteDesableCloseBtn.addEventListener(
      'click',
      this._closeModalWindow.bind(this)
    );

    //Delete all workouts
    deleteActiveBtn.addEventListener(
      'click',
      this._deleteAllWorkoutsInArray.bind(this)
    );

    //Move to current location btn
    moveToCurrentBtn.addEventListener(
      'click',
      this._moveToCurrentLocation.bind(this)
    );

    //Instructions text change
    this._intructionsTxtVisibility();

    // window mobile ? not working
    //this._checkWindowSource();
  }

  //geolocation API -> get position, if true = function loadMap, if false function alert
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Please enable Location on the browser!');
        }
      );
  }

  // if geolocation's true, get coords and get leaflet map
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    this.#latitude = latitude;
    this.#longitude = longitude;

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

  _openModalWindow() {
    modalParent.style.display = 'block';
    fullWidthContainer.style.filter = 'blur(8px)';

    if (this.#workouts.length !== 0) {
      modalWindowTxt.textContent =
        'Are you sure? By clicking on DELETE, all the workouts saved will be permanently lost.';

      deleteActiveBtn.classList.remove('hidden-to-hide');
    } else {
      modalWindowTxt.textContent =
        'Currently you have 0 workouts logged, try to log some workouts first!';
      deleteActiveBtn.classList.add('hidden-to-hide');
    }
  }

  _closeModalWindow() {
    modalParent.style.display = 'none';
    fullWidthContainer.style.filter = 'blur(0px)';
  }

  _closeModalWindowEsc(e) {
    if (e.keyCode === 27) {
      this._closeModalWindow();
    }
  }

  _deleteAllWorkoutsInArray() {
    //clear array
    this.#workouts.length = 0;

    //clear local storage
    localStorage.clear();
    console.log(this.#workouts);
    this._closeModalWindow();
    location.reload();
  }

  _moveToCurrentLocation() {
    const coords = [this.#latitude, this.#longitude];

    this.#map.setView(coords, 17, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  // not being used
  _checkWindowSource() {
    let check = false;
    (function (a) {
      if (
        /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
          a
        ) ||
        /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
          a.substr(0, 4)
        )
      )
        check = true;
    })(navigator.userAgent || navigator.vendor || window.opera);
    if (check) {
      this._openModalWindow();
      modalWindowTxt.textContent =
        'Sorry 😕  this App is not supported by mobile browsers, try on your laptop!';
      closeModalBtn.style.display = 'none';
      deleteDesableCloseBtn.style.display = 'none';
      backHomeBtn.classList.remove('hidden-to-hide');
    }
    return check;
  }
}

const app = new App();
