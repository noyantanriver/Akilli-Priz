const express = require('express');
const basicAuth = require('express-basic-auth');
const path = require('path');
const Sequelize = require('sequelize');
const moment = require('moment')
moment.locale('tr');

const Op = Sequelize.Op;
const mqttClient = require('./mqtt');
const db = require('./db');

const port = 80

const init = async () => {
    await db.init();
    if (false) {
        for (let index = 0; index < 48; index++) {
            const createdAt = moment().startOf('day').add(Math.floor(index / 2), 'hour');
            const wh = (Math.floor(Math.random() * 100) + 1) / 100;
            await db.Power.create({
                amper: 1,
                power: 1,
                wh: wh,
                createdAt: createdAt
            });
        }
    }

    mqttClient.init();

    const app = express();

    app.use(basicAuth({
        users: { 
			'admin': 'noyan123!',
			'enver': 'enver123!',
		},
        challenge: true,
    }));

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname + '/view/index.html'));
    });

    app.get('/api/day', async (req, res) => {
        const day = moment().subtract('1', 'day').format('YYYY-MM-DD hh:mm');

        const powers = await db.Power.findAll({
            where: {
                "createdAt": {
                    [Op.gt]: day,
                }
            },
            order: [['createdAt', 'ASC']],
        });

        const data = groupPowers(powers, 'hour', 'HH:mm');
        res.send({ label: 'Son 24 Saat', data: data });
    });

    app.get('/api/month', async (req, res) => {
        const startOfMonth = moment().startOf('month').format('YYYY-MM-DD hh:mm');
        const endOfMonth = moment().endOf('month').format('YYYY-MM-DD hh:mm');

        const powers = await db.Power.findAll({
            where: {
                "createdAt": {
                    [Op.between]: [
                        startOfMonth,
                        endOfMonth
                    ]
                }
            },
            order: [['createdAt', 'ASC']],
        });

        const data = groupPowers(powers, 'day', 'Do MMMM YYYY');
        res.send({ label: 'Son 1 Ay', data: data });
    });


    function groupPowers(powers, start, format) {
        return powers.reduce((groups, power) => {
            const date = moment(power.createdAt).startOf(start).format(format);
            if (!groups[date]) {
                groups[date] = 0;
            }

            groups[date] += power.wh;
            return groups;
        }, {});
    }

    /* 
    bu ay
    const startOfMonth = moment().startOf('month').format('YYYY-MM-DD hh:mm');
        const endOfMonth = moment().endOf('month').format('YYYY-MM-DD hh:mm');
        db.Power.findAll({
            where: {
                "createdAt": {
                    [Op.between]: [
                        startOfMonth,
                        endOfMonth
                    ]
                }
            },
            order: [['createdAt', 'ASC']],
        }).then(powers => res.send(powers));
    */

    app.listen(port, () => console.log(`Power App start. Port: ${port}!`));
};

init();