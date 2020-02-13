const fetch = require('node-fetch');

const base_url = 'https://api.trafikinfo.trafikverket.se/v2/data.json';

class TrafikverketApi {
  constructor(apiKey, trainId) {
    this.apiKey = "5cdd5e99f5db4aed8e8474335debfc25";//apiKey;
    this.trainId = trainId;
  }

  async apiRequest(xml) {
    const apiResponse = await fetch(base_url, {
      method: 'POST',
      headers: { "content-type": "application/xml" },
      body: xml
    });
    return await apiResponse.json();
  }

  async isTrainCanceled() {
    let xml = `<REQUEST><LOGIN authenticationkey="${this.apiKey}" /><QUERY objecttype="TrainAnnouncement" schemaversion="1.3"><FILTER><AND><EQ name="Canceled" value="True" /><EQ name="AdvertisedTrainIdent" value="${this.trainId}" /></AND></FILTER></QUERY></REQUEST>`;

    const data = await this.apiRequest(xml);
    return !!data.RESPONSE.RESULT[0].TrainAnnouncement.length
  }

  async isTrainDelayed() {
    let xml = `<REQUEST><LOGIN authenticationkey="${this.apiKey}" /><QUERY objecttype="TrainAnnouncement" schemaversion="1.3"><FILTER><AND><EQ name="EstimatedTimeIsPreliminary" value="True" /><EQ name="AdvertisedTrainIdent" value="${this.trainId}" /></AND></FILTER></QUERY></REQUEST>`;

    const data = await this.apiRequest(xml);
    return !!data.RESPONSE.RESULT[0].TrainAnnouncement.length
  }

  async getTrainInfo() {
    let xml = `<REQUEST><LOGIN authenticationkey="${this.apiKey}" /><QUERY objecttype="TrainAnnouncement" schemaversion="1.3"><FILTER><EQ name="AdvertisedTrainIdent" value="${this.trainId}" /></FILTER></QUERY></REQUEST>`;

    const data = await this.apiRequest(xml);
    return data
  }
}
module.exports = { TrafikverketApi };