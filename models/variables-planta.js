var db = require('../dbconnection');

var variablesPlanta = {
    getAllVariablesPlanta: async function () {
        return await db.query("SELECT * FROM `variables-planta`");
    },
    getVariablesPlantaById: async function (id) {
        return await db.query("SELECT * FROM `variables-planta` WHERE idVariable = ?", [id]);
    },
    addVariablesPlanta: async function (variablesPlanta) {
        return await db.query("INSERT INTO `variables-planta` ( Nombre, Valor) values(?,?)", 
        [variablesPlanta.Nombre, variablesPlanta.Valor]);
    },
    updatevariablesPlanta: async function (id, variablesPlanta) {
        return await db.query("UPDATE `variables-planta` set Nombre = ?, Valor = ? WHERE idVariable = ?", 
        [variablesPlanta.Nombre, variablesPlanta.Valor, id]);
    },
    deleteVariablesPlanta: async function (id) {
        return await db.query("DELETE FROM `variables-planta` WHERE idVariable = ?", [id]);
    }
};
module.exports = variablesPlanta;