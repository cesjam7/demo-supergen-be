var db = require('../dbconnection');

var standardSerologia = {

    getAllstandardSerologia: async function () {
        return await db.query("SELECT * FROM standard_serologia");
    },
    getStandardSerologiaById: async function (id) {
        return await db.query(`SELECT * 
        FROM standard_serologia 
        WHERE IdEnfermedad = ?
        ORDER BY Semana`, [id]);
    },
    getStdSerologiaById: async function (id) {
        return await db.query("SELECT * FROM standard_serologia WHERE IdStandardSerologia=?", [id]);
    },
    addStandardSerologia: async function (serologia) {
        return await db.query("INSERT INTO standard_serologia(IdEnfermedad,Semana,Valor) values(?,?,?)", [serologia.idEnfermedad,serologia.Semana, serologia.Valor]);
    },
    deleteStandardSerologia: async function (id) {
        return await db.query("DELETE FROM standard_serologia WHERE IdEnfermedad=?", [id]);
    },
    updateStandardSerologia: async function (id, stdserologia) {
        return await db.query("UPDATE standard_serologia set Semana=?, Valor=? WHERE IdStandardSerologia=?", [stdserologia.Semana, stdserologia.Valor, id]);
    }

};
module.exports = standardSerologia ;