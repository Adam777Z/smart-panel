document.addEventListener( 'DOMContentLoaded', (event) => {
	document.querySelector('#time').addEventListener('click', (event) => {
		toggle_full_screen();
	});

	get_time();
	get_date();
	get_temperature();
	get_weather();
	// get_light_state();
	// get_ac_state();
	update_title();

	setInterval(() => { get_time(); }, 500);

	document.querySelector('#light-toggle').addEventListener('click', (event) => {
		toggle_light();
	});

	document.querySelectorAll('.ac-control-container .dropdown-item').forEach(e => e.addEventListener('click', (event2) => {
		event2.preventDefault();

		let url = 'https://' + config['proxy_url'] + '/?url=' + encodeURIComponent('https://home.sensibo.com/api/v2/pods/' + config['sensibo_device_id'] + '/acStates?apiKey=' + config['sensibo_api_key']);

		let mode = typeof event2.target.dataset['mode'] !== 'undefined' ? event2.target.dataset['mode'] : 'auto'; // Mode (auto/cool/heat/dry/fan/off)
		let fan_speed = typeof event2.target.dataset['fan'] !== 'undefined' ? event2.target.dataset['fan'] : 'auto'; // Fan speed (auto/low/medium/high)
		let target_temperature = typeof event2.target.dataset['temperature'] !== 'undefined' ? parseInt(event2.target.dataset['temperature']) : 25; // Target temperature
		let delay = typeof event2.target.dataset['delay'] !== 'undefined' ? parseInt(event2.target.dataset['delay']) * 60 * 1000 : 0;

		let data;

		if (mode == 'off') {
			data = {
				'acState': {
					'on': false
				}
			};
		} else {
			data = {
				'acState': {
					'on': true,
					'mode': mode,
					'fanLevel': fan_speed,
					'targetTemperature': target_temperature,
					'temperatureUnit': 'C',
					'swing': 'stopped'
				}
			};
		}

		setTimeout(() => {
			fetch(url, {
				'method': 'POST',
				'headers': {
					'Content-Type': 'application/json',
					'Accept-Encoding': 'gzip'
				},
				'body': JSON.stringify(data),
				'cache': 'no-store'
			});
		}, delay);
	}));
});

var day_names = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ];
var temperature = null;
// var ac_on = false;
var last_update_minute = null;
var last_update_hour = null;

function toggle_full_screen() {
	if (!document.fullscreenElement && document.querySelector('body').requestFullscreen) {
		document.querySelector('body').requestFullscreen();
	} else if (document.exitFullscreen) {
		document.exitFullscreen();
	}
}

function get_time() {
	let date = new Date();
	let HH = date.getHours();
	let mm = date.getMinutes();
	let ss = date.getSeconds();

	// Update the others every minute
	if (ss === 0 && last_update_minute !== mm) {
		get_date();
		get_temperature();
		get_weather();
		// get_light_state();
		last_update_minute = mm;
	}

	// Update every hour
	/* if (ss === 0 && mm === 0 && last_update_hour !== HH) {
		// get_ac_state();
		last_update_hour = HH;
	} */

	if (HH < 10) {
		HH = '<span class="transparent">0</span>' + HH;
	}

	if (mm < 10) {
		mm = '0' + mm;
	}

	if (ss < 10) {
		ss = '0' + ss;
	}

	let time = HH + '꞉' + mm + '꞉' + ss;

	document.querySelector('#time').innerHTML = time;

	update_title();
}

function get_date() {
	let date = new Date();
	let YYYY = date.getFullYear();
	let MM = date.getMonth() + 1;
	let DD = date.getDate();

	MM = (MM < 10) ? '0' + MM : MM;
	DD = (DD < 10) ? '0' + DD : DD;

	document.querySelector('#date').textContent = YYYY + '-' + MM + '-' + DD;
	document.querySelector('#day').textContent = day_names[date.getDay()];
}

function get_temperature() {
	fetch('https://' + config['proxy_url'] + '/?url=' + encodeURIComponent('https://home.sensibo.com/api/v2/pods/' + config['sensibo_device_id'] + '/measurements?apiKey=' + config['sensibo_api_key']), {
		'method': 'GET',
		'cache': 'no-store'
	})
	.then((response) => {
		if (response.ok) {
			return response.json();
		} else {
			throw 'Error';
		}
	})
	.then((data) => {
		if (data['status'] == 'success') {
			temperature = data['result'][0]['temperature'];
			document.querySelector('#temperature').textContent = temperature + ' °C';
		}
	})
	.catch((error) => {
		console.log(error);
	});
}

function get_weather() {
	fetch('https://api.openweathermap.org/data/2.5/weather?id=' + config['openweathermap_city_id'] + '&units=metric&lang=en&appid=' + config['openweathermap_api_key'], {
		'method': 'GET',
		'cache': 'no-store'
	})
	.then((response) => {
		if (response.ok) {
			return response.json();
		} else {
			throw 'Error';
		}
	})
	.then((data) => {
		if (typeof data['main'] !== 'undefined' && typeof data['main']['temp'] !== 'undefined' && typeof data['weather'] !== 'undefined') {
			document.querySelector('#weather').textContent = parseFloat(data['main']['temp'].toFixed(1)) + ' °C';
			document.querySelector('#weather-icon').innerHTML = '<img src="https://openweathermap.org/img/wn/' + data['weather'][0]['icon'] + '@2x.png">';
		}
	})
	.catch((error) => {
		console.log(error);
	});
}

/* function get_light_state() {
	fetch('/proxy/', {
		'method': 'GET',
		'headers': {
			'X-Proxy-URL': 'http://' + config['light_ip'] + '/cm?cmnd=Power&user=' + config['light_username'] + '&password=' + config['light_password']
		},
		'cache': 'no-store'
	})
	.then((response) => {
		if (response.ok) {
			return response.json();
		} else {
			throw 'Error';
		}
	})
	.then((data) => {
		if (data['POWER'] == 'ON') {
			document.querySelector('#light-toggle i').classList.replace('bi-lightbulb', 'bi-lightbulb-off');
		} else if (data['POWER'] == 'OFF') {
			document.querySelector('#light-toggle i').classList.replace('bi-lightbulb-off', 'bi-lightbulb');
		}
	})
	.catch((error) => {
		console.log(error);
	});
} */

function toggle_light() {
	fetch('http://' + config['light_ip'] + '/cm?cmnd=Power%20toggle&user=' + config['light_username'] + '&password=' + config['light_password'], {
		'method': 'GET',
		'cache': 'no-store',
		'mode': 'no-cors'
	});
}

/* function get_ac_state() {
	fetch('https://' + config['proxy_url'] + '/?url=' + encodeURIComponent('https://home.sensibo.com/api/v2/pods/' + config['sensibo_device_id'] + '/acStates?apiKey=' + config['sensibo_api_key']), {
		'method': 'GET',
		'cache': 'no-store'
	})
	.then((response) => {
		if (response.ok) {
			return response.json();
		} else {
			throw 'Error';
		}
	})
	.then((data) => {
		if (data['status'] == 'success') {
			ac_on = data['result'][0]['acState']['on'];
		}
	})
	.catch((error) => {
		console.log(error);
	});
} */

function update_title() {
	document.title = 'Smart Panel • ' + document.querySelector('#date').textContent + ' ' + document.querySelector('#time').textContent.replace(/^0{1}/, '') + ' • ' + document.querySelector('#temperature').textContent + ' • ' + document.querySelector('#weather').textContent;
}