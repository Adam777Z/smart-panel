const settings_storage_key = 'smart_panel_settings';
const default_settings = {
	'light_ip': '',
	'light_username': '',
	'light_password': '',
	'sensibo_api_key': '',
	'sensibo_device_id': '',
	'openweathermap_api_key': '',
	'openweathermap_city_id': '',
	'proxy_url': ''
};
var settings = {
	...default_settings,
	...JSON.parse(localStorage.getItem(settings_storage_key) || '{}')
};

function update_control_visibility() {
	const ac_configured = Boolean(settings['proxy_url']?.trim() && settings['sensibo_device_id']?.trim() && settings['sensibo_api_key']?.trim());
	const light_configured = Boolean(settings['light_ip']?.trim() && settings['light_username']?.trim() && settings['light_password']?.trim());

	document.querySelector('.ac-control-container').hidden = !ac_configured;
	document.querySelector('#light-toggle').hidden = !light_configured;
	document.querySelector('.ac-and-light-controls').hidden = !ac_configured && !light_configured;
}

document.addEventListener( 'DOMContentLoaded', (event) => {
	document.querySelector('#time').addEventListener('click', (event) => {
		toggle_full_screen();
	});

	document.querySelectorAll('#settings-form [name]').forEach((input) => {
		input.value = settings[input.name] || '';
	});
	update_control_visibility();

	document.querySelector('#settings-form').addEventListener('submit', (event) => {
		event.preventDefault();
		const form_data = new FormData(event.currentTarget);
		Object.keys(default_settings).forEach((key) => {
			settings[key] = form_data.get(key) || '';
		});
		localStorage.setItem(settings_storage_key, JSON.stringify(settings));
		update_control_visibility();
		bootstrap.Modal.getOrCreateInstance(document.querySelector('#settings-modal')).hide();
		get_temperature();
		get_weather();
	});

	document.querySelectorAll('[data-bs-toggle="popover"]').forEach((element) => {
		new bootstrap.Popover(element);
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
		if (!settings['proxy_url'] || !settings['sensibo_device_id'] || !settings['sensibo_api_key']) {
			return;
		}

		let url = settings['proxy_url'] + '/?url=' + encodeURIComponent('https://home.sensibo.com/api/v2/pods/' + settings['sensibo_device_id'] + '/acStates?apiKey=' + settings['sensibo_api_key']);

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
	if (!settings['proxy_url'] || !settings['sensibo_device_id'] || !settings['sensibo_api_key']) {
		return;
	}

	fetch(settings['proxy_url'] + '/?url=' + encodeURIComponent('https://home.sensibo.com/api/v2/pods/' + settings['sensibo_device_id'] + '/measurements?apiKey=' + settings['sensibo_api_key']), {
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
	if (!settings['openweathermap_city_id'] || !settings['openweathermap_api_key']) {
		return;
	}

	fetch('https://api.openweathermap.org/data/2.5/weather?id=' + settings['openweathermap_city_id'] + '&units=metric&lang=en&appid=' + settings['openweathermap_api_key'], {
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
			'X-Proxy-URL': 'http://' + settings['light_ip'] + '/cm?cmnd=Power&user=' + settings['light_username'] + '&password=' + settings['light_password']
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
	if (!settings['light_ip'] || !settings['light_username'] || !settings['light_password']) {
		return;
	}

	fetch('http://' + settings['light_ip'] + '/cm?cmnd=Power%20toggle&user=' + settings['light_username'] + '&password=' + settings['light_password'], {
		'method': 'GET',
		'cache': 'no-store',
		'mode': 'no-cors'
	});
}

/* function get_ac_state() {
	fetch(settings['proxy_url'] + '/?url=' + encodeURIComponent('https://home.sensibo.com/api/v2/pods/' + settings['sensibo_device_id'] + '/acStates?apiKey=' + settings['sensibo_api_key']), {
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