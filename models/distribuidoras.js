var db = require('../dbconnection');

var distribuidoras = {

    getAlldistribuidoras: async function () {
        let rows = await db.query("SELECT * FROM  empresas_distribuidoras");

        return rows;
    },
    getDistribuidorasById: async function (id) {
        return await db.query("SELECT * FROM  empresas_distribuidoras WHERE idEmpresa=?", [id]);
    },
    addDistribuidora: async function (distribuidora) {
        return await db.query("INSERT INTO empresas_distribuidoras(Empresa,RUC) values(?,?)", [distribuidora.Empresa, distribuidora.RUC]);
    },
    deleteDistribuidora: async function (id) {
        return await db.query("DELETE FROM empresas_distribuidoras WHERE idEmpresa=?", [id]);
    },
    updateDistribuidora: async function (id, distribuidora) {
        return await db.query("UPDATE empresas_distribuidoras set Empresa=?,RUC=? WHERE idEmpresa=?", [distribuidora.Empresa, distribuidora.RUC, id]);
    }

};
module.exports = distribuidoras;