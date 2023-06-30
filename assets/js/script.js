document.addEventListener( 'DOMContentLoaded', (event) => {
	document.querySelector('#time').addEventListener('click', (event) => {
		toggleFullScreen();
	});

	get_time();
	get_date();
	get_temperature();
	get_weather();
	get_light_state();
	update_title();

	setInterval(() => { get_time(); }, 500);

	document.querySelector('#light-toggle').addEventListener('click', (event) => {
		fetch('/proxy/', {
			'method': 'GET',
			'headers': {
				'X-Proxy-URL': 'http://' + config['light_ip'] + '/cm?cmnd=Power%20toggle&user=admin&password=' + config['light_password']
			},
			'cache': 'no-store'
		})
		.then((response) => {
			get_light_state();
		});
	});
});

var day_names = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ];
var last_update_minute = null;

function toggleFullScreen() {
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
		get_light_state();
		last_update_minute = mm;
	}

	if (HH < 10) {
		HH = '<span class="transparent">0</span>' + HH;
	}

	if (mm < 10) {
		mm = '0' + mm;
	}

	if (ss < 10) {
		ss = '0' + ss;
	}

	let time = HH + ':' + mm + ':' + ss;

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
	fetch('/proxy/', {
		'method': 'GET',
		'headers': {
			'X-Proxy-URL': 'https://home.sensibo.com/api/v2/pods/' + config['sensibo_device'] + '/measurements?apiKey=' + config['sensibo_api_key']
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
		if (data['status'] == 'success') {
			document.querySelector('#temperature').textContent = data['result'][0]['temperature'] + ' °C';
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

function get_light_state() {
	fetch('/proxy/', {
		'method': 'GET',
		'headers': {
			'X-Proxy-URL': 'http://' + config['light_ip'] + '/cm?cmnd=Power&user=admin&password=' + config['light_password']
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
}

function update_title() {
	document.title = 'Smart Panel • ' + document.querySelector('#date').textContent + ' ' + document.querySelector('#time').textContent + ' • ' + document.querySelector('#temperature').textContent + ' • ' + document.querySelector('#weather').textContent;
}