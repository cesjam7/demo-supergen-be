var db = require('../dbconnection');
const mysqlClass = require("../dbConnectionClass")
const mssqlConcar = require("./../dbConnectionMSSQLClass")()
const { poolPromise } = require('../dbconnectionMSSQL');
const moment = require("moment");
var Granja = {

    getAllGranjas: function (callback) {

        return db.query("Select * from granjas", callback);

    },
    getGranjaById: function (id, callback) {

        return db.query("select * from granjas where idGranja=?", [id], callback);
    },
    crearNuevoDestinatario: async function ({ alias, email }) {
        const correoRegistrado = await mysqlClass.ejecutarQueryPreparado(`select idDestinatario from destinatarios where email='${email.trim()}'`, {}, true)
        if (correoRegistrado) {
            throw new Error(`El correo ${email} ya se encuentra registrado`)
        }
        await mysqlClass.insertar("destinatarios", [{ alias, email, Estado: 1 }])
    },
    actualizarDestinatario: async function ({ idDestinatario, email, alias }) {
        const correoRegistrado = await mysqlClass.ejecutarQueryPreparado(`select idDestinatario from destinatarios where email='${email.trim()}' and idDestinatario<>${idDestinatario}`, {}, true)
        if (correoRegistrado) {
            throw new Error(`El correo ${email} ya se encuentra registrado`)
        }
        await mysqlClass.actualizar("destinatarios", { email, alias }, { idDestinatario })
    },
    desactivarDestinatario: async function (idDestinatario) {
        await mysqlClass.ejecutarQueryPreparado(`update destinatarios set Estado=0 where idDestinatario=${idDestinatario}`, {})
    },
    activarDestinatario: async function (idDestinatario) {
        await mysqlClass.ejecutarQueryPreparado(`update destinatarios set Estado=1 where idDestinatario=${idDestinatario}`, {})
    },
    listarDestinatarios: async function () {
        const data = await mysqlClass.ejecutarQueryPreparado(`select * from destinatarios`, {})
        return data
    },
    addGranja: function (Granja, callback) {
        console.log("inside service");
        console.log(Granja.Id);
        return db.query("INSERT INTO granjas (Granja, Estado) values(?,?)", [Granja.Granja, Granja.Estado], callback);
    },
    deleteGranja: function (id, callback) {
        return db.query("delete from granjas where idGranja=?", [id], callback);
    },
    updateGranja: function (id, Granja, callback) {
        return db.query("UPDATE granjas set Granja=?, Estado=? WHERE idGranja=?", [Granja.Granja, Granja.Estado, id], callback);
    },
    deleteAll: function (item, callback) {

        var delarr = [];
        for (i = 0; i < item.length; i++) {

            delarr[i] = item[i].Id;
        }
        return db.query("delete from geproductos where IDPRODUCTO in (?)", [delarr], callback);
    },
    getUnidades: function (callback) {
        return db.query("Select * from geunidad", callback);
    },
    getConsultaTraslado: async function ({ fecha = moment().format("YYYY-MM-DD"), ruta = 2 }) {
        try {
            const pool = await poolPromise;
            
            if (fecha == null || fecha == '') fecha = fecha = moment().format("YYYY-MM-DD");
            if (ruta == null || ruta == '') ruta = 2;
            var query = `EXEC SP_ALIMENTO_REPORTE_DETALLEVIAJE '${moment(fecha).format("DD/MM/YYYY")}', ${ruta}`;
            console.log('query', query);
            const data = await pool.query(query);
            return data.recordset;
        } catch (error) {
            throw new Error(error)
        }
    },
    getConsultaTrasladoRuta: async function () {
        try {
            console.log('query', `select * from alim_ruta`)
            const lista = await mssqlConcar.ejecutarQueryPreparado(`select * from alim_ruta`, {})
            return lista
        } catch (error) {
            throw new Error(error)
        }
    },
    getConsultaAlimentacion: async function ({ fecha_inicial = moment().format("YYYY-MM-DD"), fecha_final = moment().format("YYYY-MM-DD") }) {
        try {
            const pool = await poolPromise;
            console.log('fecha inicial1', fecha_inicial);
            if (fecha_inicial == null || fecha_inicial == '') fecha_inicial = fecha_inicial = moment().format("YYYY-MM-DD");
            console.log('fecha inicial2', fecha_inicial);
            if (fecha_final == null || fecha_final == '') fecha_final = fecha_final = moment().format("YYYY-MM-DD");
            var query = `exec SP_REPORTE_ALIMENTACION_RUTA '${moment(fecha_inicial).format("YYYYMMDD")}', '${moment(fecha_final).format("YYYYMMDD")}'`;
            console.log('query', query);
            const data = await pool.query(query);
            return data.recordset;
        } catch (error) {
            throw new Error(error)
        }
    }
};
module.exports = Granja;
