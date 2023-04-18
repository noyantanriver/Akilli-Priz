const Sequelize = require('sequelize');
const sequelize = new Sequelize('smart_plug', 'root', 'SmartPlug!', {
    host: '127.0.0.1',
    dialect: 'mysql',
    dialectOptions: {
        dateStrings: true,
        typeCast: true
    },
    logging: false,
    timezone: 'Europe/Istanbul',
});

class Power extends Sequelize.Model { }
Power.init({
    amper: { type: Sequelize.FLOAT, allowNull: false },
    power: { type: Sequelize.FLOAT, allowNull: false },
    wh: { type: Sequelize.FLOAT, allowNull: false },
}, { sequelize, modelName: 'power' });

const init = async (force = false) => {
    await sequelize.sync({ force: force });
};

exports.init = init;
exports.Power = Power;