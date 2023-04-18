const mqtt = require('mqtt');
const db = require('./db')

let client;
const init = () => {
    client = mqtt.connect('mqtt://5358e4bc:2badc3813bde09d9@broker.shiftr.io', {
        clientId: 'server'
    });

    client.on('connect', function () {
        console.log('mqtt client has connected!');

        client.subscribe('/power');
    });

    client.on('message', async function (topic, message) {
        console.log('new message:', topic, message.toString());
        const data = JSON.parse(message.toString());
        if (data.WH > 0) {
            await db.Power.create({
                amper: data.I,
                power: data.P,
                wh: data.WH,
            });
        }
    });
};

exports.init = init;
exports.client = client;