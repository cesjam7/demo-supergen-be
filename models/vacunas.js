var db = require('../dbconnection');

var vacunas = {

    getAllvacunas: async function () {
        let rows = await db.query("SELECT * FROM vacunas");
        return rows;
    },
    getVacunasById: async function (id) {
        return await db.query("SELECT * FROM vacunas WHERE idVacuna=?", [id]);
    },
    addVacunas: async function (vacunas) {
        return await db.query("INSERT INTO vacunas(idLaboratorio,idEmpresa,Nombre,Abreviacion,Estado) values(?,?,?,?,?)", [vacunas.idLaboratorio,vacunas.idEmpresa,vacunas.Nombre, vacunas.Abreviatura, vacunas.Estado]);
    },
    deleteVacuna: async function (id) {
        return await db.query("DELETE FROM vacunas WHERE idVacuna=?", [id]);
    },
    updateVacuna: async function (id, vacunas) {
        return await db.query("UPDATE vacunas set Nombre=?, Abreviacion=?,Estado=? WHERE idVacuna=?", [vacunas.Nombre, vacunas.Abreviatura, vacunas.Estado, id]);
    }

};
module.exports = vacunas;