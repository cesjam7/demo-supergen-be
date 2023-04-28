var db = require('../dbconnection');
const moment = require("moment");
const mysql = require("../dbconnectionPromise")
const mysqlClass = require("../dbConnectionClass")
var Lote = {

    getAllLotes: function (callback) {
        return db.query("Select l.CorrelativoLote, l.Estado, l.FecEncaseta, l.NumHembras, l.Num_Aves_Fin_Levante, l.Sexo, l.TipoLote,l.TipoGenero, l.idLevante, l.idGalpon, l.idGranja, l.idLinea, l.idLote, l.SeleccionGenetica, l.lote, gal.Galpon, lin.Linea, gra.Granja " +
            "from lotes l " +
            "LEFT JOIN galpones gal ON gal.idGalpon = l.idGalpon " +
            "LEFT JOIN lineas lin ON lin.idLinea = l.idLinea " +
            "LEFT JOIN granjas gra ON gra.idGranja = l.idGranja " +
            "ORDER BY l.idLote DESC", callback);
    },
    getAllLotesbyid: async function (id) {
        let rows = db.query("Select l.CorrelativoLote, l.Estado, l.FecEncaseta, l.NumHembras, l.Num_Aves_Fin_Levante, l.Sexo, l.TipoLote,l.TipoGenero, l.idLevante, l.idGalpon, l.idGranja, l.idLinea, l.idLote, l.SeleccionGenetica, l.lote, gal.Galpon, lin.Linea, gra.Granja " +
            ",l.lote_str from lotes l " +
            "LEFT JOIN galpones gal ON gal.idGalpon = l.idGalpon " +
            "LEFT JOIN lineas lin ON lin.idLinea = l.idLinea " +
            "LEFT JOIN granjas gra ON gra.idGranja = l.idGranja " +
            "WHERE l.idLevante = ? ORDER BY l.idLote ASC", [id]);
        return rows;
    },
    getLotesPorLevantes(levantesIds = []) {
        const data = mysqlClass.ejecutarQueryPreparado(`Select  l.idLevante as idLevante,l.CorrelativoLote, l.Estado, l.FecEncaseta, l.NumHembras, l.Num_Aves_Fin_Levante, l.Sexo, l.TipoLote,l.TipoGenero, l.idLevante, l.idGalpon, l.idGranja, l.idLinea, l.idLote, l.SeleccionGenetica, l.lote, gal.Galpon, lin.Linea, gra.Granja ,l.lote_str from lotes l LEFT JOIN galpones gal ON gal.idGalpon = l.idGalpon 
        LEFT JOIN lineas lin ON lin.idLinea = l.idLinea 
        LEFT JOIN granjas gra ON gra.idGranja = l.idGranja 
        WHERE l.idLevante in(${levantesIds.join()}) ORDER BY l.idLote ASC,l.idLevante`, {})
        return data
    },
    getLotesComparar: function (callback) {
        return db.query("Select l.CorrelativoLote, l.Estado, l.FecEncaseta, l.NumHembras, l.Sexo, l.TipoLote,l.TipoGenero, l.idLevante, l.idGalpon, l.idGranja, l.idLinea, l.idLote, l.SeleccionGenetica, l.lote, gal.Galpon, lin.Linea, gra.Granja " +
            "from lotes l " +
            "LEFT JOIN galpones gal ON gal.idGalpon = l.idGalpon " +
            "LEFT JOIN lineas lin ON lin.idLinea = l.idLinea " +
            "LEFT JOIN granjas gra ON gra.idGranja = l.idGranja " +
            "WHERE idLevante != 0 " +
            "ORDER BY l.idLote DESC", callback);
    },
    getLotesCompararProd: function (callback) {

        return db.query("Select l.*, gal.Galpon, lin.Linea, gra.Granja " +
            "from lotes l " +
            "LEFT JOIN galpones gal ON gal.idGalpon = l.idGalpon " +
            "LEFT JOIN lineas lin ON lin.idLinea = l.idLinea " +
            "LEFT JOIN granjas gra ON gra.idGranja = l.idGranja " +
            "WHERE idLevante != 0 and l.idProduccion != 0 " +
            "ORDER BY l.idLote DESC", callback);
    },
    getLoteById: function (id, callback) {
        return db.query("select * from lotes where idLote=? ", [id], callback);
    },
    getLotesPorNombre: async function (selectedFields = [], nombreLotes = []) {
        const connection = await mysql.connection();
        try {

            const data = await connection.query("select " + selectedFields.join() + " from lotes l inner join produccion pr on pr.idProduccion=l.idProduccion where  lote IN(?)", [nombreLotes]);
            return data
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }

    },
    verificarExistenciaPorNombreLotes: async function (nombreLotes = []) {
        const lotes = await this.getLotesPorNombre(nombreLotes);
        return lotes.length == nombreLotes.length
    },
    getLoteByNameAndSelectsFieldsPromise: async function (selectedFields = [], nombreLote) {
        const connection = await mysql.connection();
        try {

            const data = await connection.query("select " + selectedFields.join() + " from lotes l inner join produccion pr on pr.idProduccion=l.idProduccion where lote=?", [nombreLote]);
            if (data.length == 0) throw new Error("El lote No existe")
            return data[0]
        } catch (error) {

            throw error;
        } finally {
            connection.release();
        }
    },
    getLoteByIdAndSelectsFieldsPromise: async function (selectedFields = [], loteId) {
        const connection = await mysql.connection();
        try {

            const data = await connection.query("select " + selectedFields.join() + " from lotes where idLote=?", [loteId]);
            if (data.length == 0) throw new Error("El lote No existe")
            return data[0]
        } catch (error) {

            throw error;
        } finally {
            connection.release();
        }
    },
    getLotesByIdLinea: function (id, callback) {
        return db.query("SELECT * FROM lotes WHERE idLinea=? ORDER BY Lote", [id], callback);
    },
    getLoteMortalidad: function (callback) {
        return db.query("select lo.idLote, lo.lote, lo.Estado, lo.idLinea, li.Linea, lo.NumHembras from lotes lo INNER JOIN lineas li ON li.idLinea = lo.idLinea", callback);
    },
    getLoteSemana: function (lotes, callback) {
        return db.query("SELECT idLote, Semana, PorcAcumMortalidad FROM mortalidadsem " +
            "WHERE idLote IN (" + lotes.lotes.join() + ") " +
            "ORDER BY idLote, Semana", callback);
    },
    getLoteSemanaProd: async function (lotes) {
        return await db.query("SELECT idLote, Semana, PorcAcumMortalidad,PorcMortalidadTot_Acum FROM mortalidad_prod_sem " +
            "WHERE idLote IN (" + lotes.lotes.join() + ") " +
            "ORDER BY idLote, Semana");
    },
    getLoteSemanaPesos: function (lotes, callback) {
        return db.query("SELECT idLote, Semana, peso_actual, peso_standard, peso_dif, uniformidad FROM peso_semana_det " +
            "WHERE idLote IN (" + lotes.lotes.join() + ") " +
            "ORDER BY idLote, Semana", callback);
    },
    getLoteSemanaIdLinea: function (id, callback) {
        return db.query("SELECT * FROM lotes " +
            "WHERE idLinea = ? " +
            "ORDER BY Lote", [id], callback);
    },
    existLote: function (Lote, callback) {
        return db.query("SELECT * FROM lotes WHERE lote = ?", [Lote.lote], callback)
    },
    addLote: function (Lote, callback) {
        console.log("inside service");
        return db.query("INSERT INTO lotes (lote, TipoLote, TipoGenero, idLinea, idGranja, idGalpon, Sexo, CorrelativoLote, SeleccionGenetica, NumHembras, FecEncaseta, Estado, lote_str) values(?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [Lote.lote, Lote.TipoLote, Lote.TipoGenero, Lote.idLinea, Lote.idGranja, Lote.idGalpon, Lote.Sexo, Lote.CorrelativoLote, Lote.SeleccionGenetica, Lote.NumHembras, new Date(Lote.FecEncaseta), Lote.Estado, Lote.lote_str], callback);
    },
    deleteLote: function (id, callback) {
        return db.query("delete from lotes where idLote=?", [id], callback);
    },
    updateLote: function (id, Lote, callback) {
        return db.query("UPDATE lotes set lote=?, TipoLote=?, idLinea=?, idGranja=?, idGalpon=?, Sexo=?, NumHembras=?, SeleccionGenetica=?, FecEncaseta=?,  Estado=? WHERE idLote=?", [Lote.lote, Lote.TipoLote, Lote.idLinea, Lote.idGranja, Lote.idGalpon, Lote.Sexo, Lote.NumHembras, Lote.SeleccionGenetica, Lote.FecEncaseta, Lote.Estado, id], callback);
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
    getGranjaPorProduccionOLevante1: async function (idObjeto, tipo = "Levante") {
        const connection = await mysql.connection();
        try {

            const data = await connection.query(`
            select g.*
            from  lotes lo
            inner join granjas g on g.idGranja=${tipo == "Levante" ? "lo.idGranja" : "lo.idGranjaP"}
            where ${tipo == "Levante" ? 'idLevante' : 'idProduccion'}=? limit 1`, [idObjeto]);
            return data[0] ? data[0] : { idGranja: 0, Granja: "NO ENCONTRADA", Estado: 0 }
        } catch (error) {
            console.log("e", error)
            throw error;
        } finally {
            connection.release();
        }

    }
};
module.exports = Lote;
