'use strict';

const Homey = require('homey');
const { TrafikverketApi } = require('./api');
const uuid = require('uuid/v4');

class TrainDevice extends Homey.Device {

  onInit() {
    this.log('Device init');

    const data = this.getData();
    const settings = this.getSettings();
    this.trafikverketApi = new TrafikverketApi(settings.key, data.id);

    this.trainStateTrigger = new Homey.FlowCardTrigger('train_state_updated');

    this.trainStateIs = new Homey.FlowCardCondition('train_state_is');
    this.trainStateIs
        .register()
        .registerRunListener(( args, state ) => {
          let trainState = this.getCapabilityValue('train_info');
          return Promise.resolve( trainState );
        });


    if (this.getStoreValue('cronTask') === null) {
      this.createCronTask();
    } else {
      this.initializeCronTask();
    }
  }

  async onSettings(_, newSettings) {
    const data = this.getData();

    // Trafikverket API will throw an error if new settings are invalid
    const trafikverketApi = new TrafikverketApi(newSettings.key, data.id);
    await trafikverketApi.checkTrainInfo();

    this.trafikverketApi = trafikverketApi;
  }

  onAdded() {
    this.log('Added device');

    // Force an initial train info check
    this.checkTrainInfo();
  }

  onDeleted() {
    this.deleteCronTask();
    this.log( 'Deleted device');
  }

  /* App-specific methods */
  getCronString() {
    return '*/1 * * * *';
  }

  initializeCronTask() {
    const taskName = this.getStoreValue('cronTask');
    Homey.ManagerCron.getTask(taskName)
        .then(result => {
          result.on('run', data => {
            this.log(`Running task ${taskName}`);
            this.checkTrainInfo();
          });
          this.log(`Initialized cron job ${taskName}`);
        }).catch(error => {
      this.error(`Failed retrieving cron job ${taskName}`);
      this.createCronTask();
    });
  }

  createCronTask() {
    const taskName = uuid().replace(/[^a-zA-Z0-9]+/g,'');
    Homey.ManagerCron.registerTask(taskName, this.getCronString(), this.getData())
        .then(task => {
          this.log(`Cron job ${taskName} created successfully`);
          this.setStoreValue('cronTask', taskName).catch(error => {
            this.error('Failed setting cron task name');
          });
          this.initializeCronTask(taskName);
        }).catch(error => {
      this.error(`Cron job creation failed (${error})`);
    });
  }

  deleteCronTask() {
    const taskName = this.getStoreValue('cronTask');
    Homey.ManagerCron.unregisterTask(taskName)
        .then(result => {
          this.log('Cron job deleted successfully');
        }).catch(error => {
      this.error(`Cron job deletion failed (${error}`);
    });
  }

  async checkTrainInfo() {
    this.log('Checking train info');
    let train_state = "ontime";

    try {
      const isTrainCanceled = await this.trafikverketApi.isTrainCanceled();
      const isTrainDelayed = await this.trafikverketApi.isTrainDelayed();

      if (isTrainDelayed) {
        train_state = "preliminary"
        if (isTrainCanceled) {
          train_state = "canceled"
        }
      }

      const original_state = this.getCapabilityValue('train_info');

      this.setCapabilityValue('train_info', train_state);

      if (original_state != null || original_state == train_state) {
        this.trainStateTrigger
            .register()
            .trigger()
            .catch( this.error )
            .then( this.log(`New train state is: ${train_state}`) )
      }
    } catch (error) {
      this.log(`Error: (${error})`);
    }
  }
}

module.exports = TrainDevice;
