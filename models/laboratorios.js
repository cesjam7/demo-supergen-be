var db = require('../dbconnection');

var laboratorios = {

    getAllLaboratorios: async function () {
        let rows = await db.query("SELECT * FROM  laboratorios");

        return rows;
    },
    getlaboratorioById: async function (id) {
        return await db.query("SELECT * FROM  laboratorios WHERE idLaboratorio=?", [id]);
    },
    addLaboratorio: async function (laboratorio) {
        return await db.query("INSERT INTO laboratorios(laboratorio) values(?)", [laboratorio.laboratorio]);
    },
    deleteLaboratorio: async function (id) {
        return await db.query("DELETE FROM laboratorios WHERE idLaboratorio=?", [id]);
    },
    updateLaboratorio: async function (id, laboratorios) {
        return await db.query("UPDATE laboratorios set laboratorio=? WHERE idLaboratorio=?", [laboratorios.laboratorio, id]);
    }

};
module.exports = laboratorios;