var db = require('../dbconnection');
const mysql = require("../dbconnectionPromise")

var Levante = {

    getAllLevantes: function (callback) {
        return db.query("Select * from levantes ORDER BY idLevante DESC", callback);
    },
    getLevanteById: function (id) {
        return db.query("select * from levantes where idLevante = ? ORDER BY idLevante DESC ", [id]);
    },
    getUltimoLevante: async function () {
        return await db.query("select idLevante from levantes ORDER BY idLevante DESC Limit 0,1");
    },
    getLotesLevante: function (callback) {
        return db.query("select idLote, lote from lotes where Estado = 1 AND idLevante = 0", callback);
    },
    addLevante: async function (Levante) {
        await db.query("INSERT INTO levantes (Nombre, FechaIniLevante, FechaFinLevante, FechaIniProduccion, FechaFinProduccion, ccosto) values(?,?,?,?,?,?)",
            [Levante.Nombre, new Date(Levante.FechaIniLevante), new Date(Levante.FechaFinLevante), new Date(Levante.FechaIniProduccion), new Date(Levante.FechaFinProduccion), Levante.ccosto]);
        return;
    },
    deleteLevante: function (id, callback) {
        return db.query("delete from levantes where idLevante=?", [id], callback);
    },
    aveDiaGr: function (idLevante) {
        const levanteFile = this;
        return new Promise((resolve, reject) => {
            db.query(`SELECT aps.idAlimentoLevanteSem, aps.Semana, aps.CantRealAlimentoDescartes, aps.idLote
                        FROM alimento_levante_sem_descarte aps
                        INNER JOIN lotes lo ON lo.idLote = aps.idLote
                        WHERE aps.idLevante=?
                        ORDER BY aps.Semana ,idLote`, [idLevante], async (err, results) => {
                if (err) reject(err)
                const semanaMaximaArray = results.map((result) => result.Semana)
                const semanaMaximaNumber = Math.max(...semanaMaximaArray);
                let data = []
                if (semanaMaximaArray.length == 0) {
                    data = await levanteFile.insertWeekInLote(idLevante)

                } else {
                    for (let countSemana = 1; countSemana <= semanaMaximaNumber; countSemana++) {
                        data.push({ Semana: countSemana, numeros: results.filter((value) => value.Semana == countSemana).map(value => ({ valor: value.CantRealAlimentoDescartes, idLote: value.idLote })) })
                    }
                }

                resolve(data)
            })
        })

    },
    listarLevantesAppProduccion: async function () {
        const connection = await mysql.connection();
        try {
            let levantes = []
            const data = await connection.query(" select idLevante from lotes where idproduccion=0 and idLote not in ('70','71') group by idLevante ");
            const levantesId = data.map(d => d.idLevante)
            if (levantesId.length > 0) {
                levantes = await connection.query(" select * from levantes where idLevante in(?) ", [levantesId]);

            }
            return levantes;

        } catch (error) {
            console.error(error)
            throw error;
        } finally {
            connection.release();
        }


    },
    insertWeekInLote: function (idLevante) {
        const levanteFile = this;
        return new Promise((resolve, reject) => {
            db.query("select idLote from lotes where idLevante=?", [idLevante], async (err, results) => {
                const resultMap = []
                if (err) reject(err)
                for (let i = 1; i <= 24; i++) {
                    const dataMap = results.map((result) => [idLevante, result.idLote, i, 0])
                    await levanteFile.insetAlimentoLevanteDescarte(dataMap)
                    resultMap.push({ Semana: i, numeros: results.map((result) => ({ valor: 0, idLote: result.idLote })) })
                }
                resolve(resultMap);
            })

        })
    },
    insetAlimentoLevanteDescarte: function (dataMap) {
        return new Promise((resolve, reject) => {
            db.query("insert into  alimento_levante_sem_descarte(idLevante,idLote,Semana,CantAlimentoSem) values ?", [dataMap], (err, result) => {
                if (err) reject(err)
                resolve();
            })
        })
    },
    updateAveDiaGr: (rows) => {
        return new Promise((resolve, reject) => {
            const queriesUpdate = rows.map((row) => {
                const mapNumeros = row.numeros.map((val) => ({ ...val, Semana: row.Semana }))
                return mapNumeros
            }).reduce((a, b) => a.concat(b)).map((val) => `Update alimento_levante_sem_descarte set CantRealAlimentoDescartes=${val.valor} where idLote=${val.idLote} and Semana=${val.Semana};`).join("");
            db.query(queriesUpdate, (err, result) => {
                if (err) reject(err)
                resolve();
            })

        })

    },
    updateLevanteLotes: async function (id, Levante) {
        let sql = "UPDATE lotes set idLevante=? WHERE idLote IN (" + Levante.lotes + ")";
        let result = await db.query(sql, [id]);
        return result;
    },
    updateLevante: function (id, Levante, callback) {
        return db.query("UPDATE levantes set levante=?, TipoLevante=?, idLinea=?, idGranja=?, idGalpon=?, Sexo=?, CorrelativoLevante=?, NumHembras=?, FecEncaseta=?,  Estado=? WHERE idLevante=?", [Levante.levante, Levante.TipoLevante, Levante.idLinea, Levante.idGranja, Levante.idGalpon, Levante.Sexo, Levante.CorrelativoLevante, Levante.NumHembras, Levante.FecEncaseta, Levante.Estado, id], callback);
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

    }
};
module.exports = Levante;
