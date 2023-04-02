document.addEventListener( 'DOMContentLoaded', (event) => {
	get_time();
	get_date();
	get_temperature();
	get_weather();
	update_title();

	setInterval(() => { get_time(); }, 1000);

	document.querySelector('#light-on').addEventListener('click', (event) => {
		fetch('http://' + auth['light_ip'] + '/cm?cmnd=Power%20on&user=admin&password=' + auth['light_password'], {
			'method': 'GET',
			'cache': 'no-store',
			'mode': 'no-cors'
		});
	});

	document.querySelector('#light-off').addEventListener('click', (event) => {
		fetch('http://' + auth['light_ip'] + '/cm?cmnd=Power%20off&user=admin&password=' + auth['light_password'], {
			'method': 'GET',
			'cache': 'no-store',
			'mode': 'no-cors'
		});
	});
});

var day_names = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ];

function get_time() {
	let date = new Date();
	let HH = date.getHours();
	let mm = date.getMinutes();
	let ss = date.getSeconds();

	// Update the others every minute
	if (ss === 0) {
		get_date();
		get_temperature();
		get_weather();
	}

	HH = (HH < 10) ? '0' + HH : HH;
	mm = (mm < 10) ? '0' + mm : mm;
	ss = (ss < 10) ? '0' + ss : ss;

	let time = HH + ':' + mm + ':' + ss;

	document.querySelector('#time').textContent = time;

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
	fetch('https://corsproxy.io/?' + encodeURIComponent('https://home.sensibo.com/api/v2/pods/' + auth['sensibo_device'] + '/measurements?apiKey=' + auth['sensibo_api_key']), {
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
			document.querySelector('#temperature').textContent = data['result'][0]['temperature'] + ' °C';
		}
	})
	.catch((error) => {
		console.log(error);
	});
}

function get_weather() {
	fetch('https://api.openweathermap.org/data/2.5/weather?id=' + auth['openweathermap_city_id'] + '&units=metric&lang=en&appid=' + auth['openweathermap_api_key'], {
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

function update_title() {
	document.title = 'Smart Panel • ' + document.querySelector('#date').textContent + ' ' + document.querySelector('#time').textContent + ' • ' + document.querySelector('#temperature').textContent + ' • ' + document.querySelector('#weather').textContent;
}