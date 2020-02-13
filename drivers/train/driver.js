'use strict';

const Homey = require('homey');
const { TrafikverketApi } = require('./api');

class TrainDriver extends Homey.Driver {

    onPair(socket) {
        let trafikverketApi;
        let apiKey;
        let trainId;
        let data;

        socket.on('validate', async (pairData, callback) => {
            try {
                apiKey = pairData.api_key;
                trainId = pairData.train_id;
                trafikverketApi = new TrafikverketApi(apiKey, trainId);
                data = trafikverketApi.getTrainInfo();
                callback(null, true);
            } catch (error) {
                this.error(error);
                callback(error);
            }
        });


        socket.on('list_devices', (_, callback) => {
            try {
                const devices = [
                    {
                        "name": ("Train " + trainId),
                        "data": {
                            "id": trainId
                        },
                        "settings": { "key": apiKey }
                    }
                ];

                callback(null, devices);
            } catch (error) {
                this.error(error);
                callback(error);
            }
        });
    }
}

module.exports = TrainDriver;
