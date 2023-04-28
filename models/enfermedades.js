var db = require('../dbconnection');

var enfermedades = {

    getAllenfermedades: async function () {
        let rows = await db.query("SELECT * FROM  enfermedades");
        
        for (let i = 0; i < rows.length; i++) {
            const element = rows[i];
            element.Style = {
                'opacity' : '0.65'
            }
        }
        return rows;
    },
    getEnfermedadesById: async function (id) {
        return await db.query("SELECT * FROM  enfermedades WHERE idEnfermedad=?", [id]);
    },
    addEnfermedad: async function (enfermedad) {
        return await db.query("INSERT INTO enfermedades(Nombre,Abreviacion,Estado) values(?,?,?)", [enfermedad.Nombre, enfermedad.Abreviatura, enfermedad.Estado]);
    },
    deleteEnfermedad: async function (id) {
        return await db.query("DELETE FROM enfermedades WHERE idEnfermedad=?", [id]);
    },
    updateEnfermedad: async function (id, enfermedad) {
        return await db.query("UPDATE enfermedades set Nombre=?, Abreviacion=?,Estado=? WHERE idEnfermedad=?", [enfermedad.Nombre, enfermedad.Abreviatura, enfermedad.Estado, id]);
    }

};
module.exports = enfermedades;