var db = require('../dbconnection');
const mysql = require("../dbconnectionPromise")

var LevanteAlimento = {

    getAllmortalidad: function (callback) {
        return db.query("Select * from mortalidad", callback);
    },
    getMortalidadById: function (id, callback) {
        return db.query("select * from mortalidad where idMortalidadDet=?", [id], callback);
    },

    //Nuevo ---------------------------------------------------------------------------
    getCantidadDatosPorEdad: function (id, Edad, callback) {
        return db.query("SELECT count(*) as CanTotal, Edad FROM alimento_levantejson WHERE idLevante=? AND Edad=?", [id, Edad], callback)
    },
    getTipoAlimentoComboLevante: function (callback) {
        return db.query("Select * from tipo_alimento WHERE Tipo = 'L' OR Tipo = 'A' OR Tipo = 'P'", callback);
    },
    getTiposAlimento: function () {
        return db.query("select  nombreAlimento,idAlimento,Tipo from tipo_alimento where estado=1")
    },
    getTipoAlimentoComboProduccion: function (callback) {
        return db.query("Select * from tipo_alimento WHERE Tipo = 'P' OR Tipo = 'A'", callback);
    },
    getTipoAlimentoById: function (id, callback) {
        return db.query("Select * from tipo_alimento where idAlimento=?", [id], callback);
    },
    getSumaTotalAlimentos: function (id, Edad, callback) {
        return db.query("SELECT SUM(CantAlimento) as SumaCantAlimentos FROM alimento_levante_det where idLevante = ? and Edad = ?", [id, Edad], callback);
    },
    //Nuevo ---------------------------------------------------------------------------

    //CAMBIO----------------------------------------------------------------------------
    getAlimentoByIdLevante: async function (id) {
        return await db.query("select *, (select lo.nombreAlimento from tipo_alimento lo where lo.idAlimento = l.idAlimento) as nombreAlimento, (SELECT SUM(ldet.CantAlimento) FROM alimento_levante_det ldet where ldet.idLevante = l.idLevante and ldet.Edad = l.Edad and ldet.idAlimento = l.idAlimento)as SumaCantAlimentos from alimento_levantejson l where idLevante=? order by Edad ASC", [id]);
    },
    //CAMBIO----------------------------------------------------------------------------
    getAlimentoUltimoDia: function (id, callback) {
        return db.query("select * from alimento_levantejson WHERE idLevante = ? ORDER BY Edad DESC LIMIT 0, 1", [id], callback);
    },
    getAlimentoPorLevantes: async function (levantesId = []) {
        const connection = await mysql.connection();
        try {
            const data = await connection.query(`select idAlimentoLevanteJson,idAlimento,idLevante,data, max(Edad) as Edad  from alimento_levantejson WHERE idLevante in(?) 
            GROUP BY idLevante
            ORDER BY Edad DESC`, [levantesId]);
            return data;

        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            connection.release();

        }
    },
    getAlimentoDia: function (idLevante, Edad, idAlimento, callback) {
        return db.query("select * from alimento_levantejson WHERE idLevante = ? AND Edad = ? AND idAlimento =?", [idLevante, Edad, idAlimento], callback);
    },
    //CAMBIO---------------------------------------------------------------------------
    getAlimentoLevante: async function (id) {
        return await db.query(`SELECT * 
        FROM levantes l 
        INNER JOIN lotes lo ON lo.idLevante = l.idLevante 
        INNER JOIN lineas li ON li.idLinea = lo.idLinea 
        WHERE l.idLevante = ? ORDER BY li.CodLinea DESC`,
            [id]);
    },
    getLotesPorLevantes: async function (levantesId = []) {
        const connection = await mysql.connection();
        try {
            const data = await connection.query(`SELECT * 
            FROM levantes l 
            INNER JOIN lotes lo ON lo.idLevante = l.idLevante 
            INNER JOIN lineas li ON li.idLinea = lo.idLinea 
            WHERE l.idLevante in(?) ORDER BY li.CodLinea DESC`, [levantesId]);
            return data;

        } catch (error) {

            throw error;
        } finally {
            connection.release();

        }
    },
    getAlimentoLevantes: function (callback) {
        return db.query("select * from levantes ORDER BY idLevante DESC", callback);
    },
    //CAMBIO-------------------------------------------------------------------------
    getEdadMaximo: function (callback) {
        return db.query("SELECT m.Edad FROM mortalidad m " +
            "INNER JOIN lineas l ON l.idLinea = m.idLinea " +
            "WHERE l.Estado = 1 " +
            "ORDER BY m.edad DESC " +
            "LIMIT 0, 1", callback);
    },
    getEdadEspecifica: function (id, callback) {
        return db.query("SELECT m.Fecha, m.EdadTexto, m.NoAves, m.PorcMortalidad, m.NoEliminados, m.PorcEliminados, l.idLinea FROM mortalidad m " +
            "INNER JOIN lineas l ON l.idLinea = m.idLinea AND l.Estado = 1 " +
            "WHERE m.Edad = ? " +
            "ORDER BY m.idLinea ASC", [id], callback);
    },
    getDiaInicio: function (callback) {
        return db.query("SELECT m.Fecha FROM mortalidad m " +
            "INNER JOIN lineas l ON l.idLinea = m.idLinea " +
            "WHERE l.Estado = 1 " +
            "ORDER BY m.Fecha ASC " +
            "LIMIT 0, 1", callback);
    },
    addMortalidad: function (Mortalidad, callback) {
        console.log("inside service");
        console.log(Mortalidad.Id);
        return db.query("INSERT INTO mortalidad (idMortalidad, idLote, idLinea, Fecha, Edad, EdadTexto, NoAves, PorcMortalidad, NoEliminados, PorcEliminados) values(?,?,?,?,?,?,?,?,?,?)", [Mortalidad.idMortalidad, Mortalidad.idLote, Mortalidad.idLinea, Mortalidad.Fecha, Mortalidad.Edad, Mortalidad.EdadTexto, Mortalidad.NoAves, Mortalidad.PorcMortalidad, Mortalidad.NoEliminados, Mortalidad.PorcEliminados], callback);
    },
    //TODO
    addlevanteAlimentoModal: async function (Mortalidad) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            await connection.query("INSERT INTO alimento_levantejson (idLevante, idAlimento, Edad, data) values(?,?,?,?)", [Mortalidad.idLevante, Mortalidad.idAlimento, Mortalidad.Edad, Mortalidad.data]);
            const dataMortalidadJSON = JSON.parse(Mortalidad.data);
            const dataMortalidad = []
            for (let index = 0; index < Object.keys(dataMortalidadJSON).length; index++) {
                const idLote = Object.keys(dataMortalidadJSON)[index];
                console.log("idLote", idLote)
                dataMortalidad.push({
                    idLevante: Mortalidad.idLevante, idAlimento: Mortalidad.idAlimento,
                    idLote, Edad: Mortalidad.Edad, Fecha: Mortalidad.Fecha, Semana: Mortalidad.Semana,
                    Cantidad: dataMortalidadJSON[idLote].Cantidad,
                    CantidadDescartes: dataMortalidadJSON[idLote].CantidadDescartes
                })
            }

            await connection.query(`INSERT INTO alimento_levante_det (idLevante, idAlimento, idLote, Edad, Fecha, Semana, 
                CantAlimento, CantAlimentoDescarte) values ?`, [dataMortalidad.map(m => [m.idLevante, m.idAlimento, m.idLote, m.Edad, m.Fecha, m.Semana, m.Cantidad, m.CantidadDescartes])])
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }

        /*     try {
    
                await db.query("INSERT INTO alimento_levantejson (idLevante, idAlimento, Edad, data) values(?,?,?,?)", [Mortalidad.idLevante, Mortalidad.idAlimento, Mortalidad.Edad, Mortalidad.data]);
                var data = JSON.parse(Mortalidad.data);
    
                for (var idLote in data) {
                    await db.query(`INSERT INTO alimento_levante_det (idLevante, idAlimento, idLote, Edad, Fecha, Semana, 
                CantAlimento, CantAlimentoDescarte) values(?,?,?,?,?,?,?,?)`, [Mortalidad.idLevante, Mortalidad.idAlimento,
                        idLote, Mortalidad.Edad, Mortalidad.Fecha, Mortalidad.Semana, data[idLote].Cantidad, data[idLote].CantidadDescartes]);
                }
            } catch (error) {
    
            } */
        return;
    },

    addlevanteProcedureModal: async function (Mortalidad) {
        var data = JSON.parse(Mortalidad.data);
        for (var idLote in data) {
            let count = await db.query('SELECT CONCAT(sexo,"_",SUBSTRING(lote,LOCATE("-",lote) + 1)) as name, idLote FROM lotes WHERE idLevante = ? and idLote = ?', [Mortalidad.idLevante, idLote]);
            let name = "GramoAve" + count[0].name
            let id = count[0].idLote
            let count2 = await db.query('SELECT ' + name + ' as nombre FROM standard_levante WHERE Semana = ?', [Mortalidad.Semana]);
            let dato = count2[0].nombre;
            await db.query("CALL getSemanalAlimentoLevante(?, ?, ?, ?, ?)", [Mortalidad.idLevante, Mortalidad.Semana, id, data[id].Cantidad, dato]);
        }
        return;
    },

    addlevanteProcedure2Modal: async function (Mortalidad) {

        var data = JSON.parse(Mortalidad.data);

        for (var idLote in data) {
            await db.query("CALL getActualizarAlimentoLevante(?, ?)", [Mortalidad.idLevante, idLote]);
        }

        return;
    },

    deleteMortalidad: function (id, callback) {
        return db.query("delete from mortalidad where idMortalidad=?", [id], callback);
    },

    updatelevanteAlimento: async function (id, Mortalidad) {
        var data = JSON.parse(Mortalidad.data);
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            await connection.query("UPDATE alimento_levantejson set data = ? WHERE idAlimentoLevanteJson=?", [Mortalidad.data, id]);
            const dataMortalidadJSON = JSON.parse(Mortalidad.data);
            for (let index = 0; index < Object.keys(dataMortalidadJSON).length; index++) {
                const idLote = Object.keys(dataMortalidadJSON)[index];
                await db.query(`UPDATE alimento_levante_det SET CantAlimento = ?, CantAlimentoDescarte = ? 
                WHERE idLevante = ? AND Edad = ? AND idLote = ? AND idAlimento = ?`, [dataMortalidadJSON[idLote].Cantidad,
                dataMortalidadJSON[idLote].CantidadDescartes, Mortalidad.idLevante, Mortalidad.Edad, idLote, Mortalidad.idAlimento]);
            }
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
        for (var idLote in data) {
            await db.query(`UPDATE alimento_levante_det SET CantAlimento = ?, CantAlimentoDescarte = ? 
           WHERE idLevante = ? AND Edad = ? AND idLote = ? AND idAlimento = ?`, [data[idLote].Cantidad,
            data[idLote].CantidadDescartes, Mortalidad.idLevante, Mortalidad.Edad, idLote, Mortalidad.idAlimento]);
        }

        return;
    },
    updatelevanteAlimento2: async function (id, Mortalidad) {
        var data3 = JSON.parse(Mortalidad.data);

        for (var idLote3 in data3) {
            await db.query("CALL getActualizarAlimentoLevante(?, ?)", [Mortalidad.idLevante, idLote3]);
        }

        return;
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
module.exports = LevanteAlimento;
