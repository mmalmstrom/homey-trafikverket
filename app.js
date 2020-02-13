'use strict';

const Homey = require('homey');

class Trafikverket extends Homey.App {

	onInit() {
		this.log('Running');
	}
}

module.exports = Trafikverket;