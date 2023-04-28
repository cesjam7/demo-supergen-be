var db = require('../dbconnection');
var produccionTraslado = require('../models/produccionTraslado');
const mysqlClass = require("../dbConnectionClass")
const moment = require("moment");
const mysql = require("../dbconnectionPromise");
const sendEmail = require('./sendEmail');
var Mortalidad = {

    verifyMortalidad: async function (params) {
        return await db.query("SELECT * FROM mortalidadsem WHERE idLevante = ? and Semana = ?", [params.idLevante, params.Semana]);
    },

    costeoPorMesAnio: async function ({ mes, anio }) {
        const periodo = moment(`${anio}${mes}`, "YYYYMM")
        const fechaFinalMesAnterior = periodo.clone().subtract(1, "M").endOf("M").format("YYYY-MM-DD");
        const dataLevanteProduccion = await mysqlClass.ejecutarQueryPreparado(`select w.Tipo,w.idObjeto,w.idLote,L.lote from (
    select 'L' Tipo,A.idLevante idObjeto,A.idLote 
    from mortalidad_det A where A.fecha='${fechaFinalMesAnterior}'
    group by A.idLevante,A.idLote
    union all
    select 'P' Tipo,A.idProduccion idObjeto,A.idLote 
    from mortalidad_prod_det A where A.fecha='${fechaFinalMesAnterior}'
    group by A.idProduccion,A.idLote
    )w left join lotes L on L.idLote=w.idLote
    `, {})

        const levantes = Array.from(new Set(dataLevanteProduccion.filter(d => d.Tipo == "L").map(i => i.idObjeto)))
        const produccion = Array.from(new Set(dataLevanteProduccion.filter(d => d.Tipo == "P").map(i => i.idObjeto)))
        const dataMortalidadLevante = await mysqlClass.ejecutarQueryPreparado(`SELECT fecha,GROUP_CONCAT(DISTINCT lo.lote_str ORDER BY lo.lote_str 
            SEPARATOR '-') as NombreLote, ms.idLevante as idObjeto,'Levante' as tipo, ms.Semana, SUBSTR(REPLACE(fecha,'-',''), 1, 6) as Periodo,
            0 as rowspan, MIN(fecha) as MinimaFecha, MAX(fecha) as MaximaFecha,
            IF(SUBSTR(MAX(fecha), 9, 11) = SUBSTR(MIN(fecha), 9, 11), SUBSTR(MAX(fecha), 9, 11),
            CONCAT(SUBSTR(MIN(fecha), 9, 11)," AL ",SUBSTR(MAX(fecha), 9, 11))) as RangoFecha,
            0 AS NroAvesInicioLH, SUM(IF(lo.TipoGenero = "LH",ms.NoAves, 0)) AS MortalidadLH, 
            SUM(IF(lo.TipoGenero = "LH",ms.NoEliminados, 0)) as DescartesLH, 
            SUM(IF(lo.TipoGenero = "LH",ms.ErSex + ms.SelGen, 0)) as VentasLH,
            0 as IngresosLH, 0 as NroAvesFinalLH, 0 AS NroAvesInicioLM,
            SUM(IF(lo.TipoGenero = "LM",ms.NoAves, 0)) AS MortalidadLM,
            SUM(IF(lo.TipoGenero = "LM",ms.NoEliminados, 0)) as DescartesLM,
            SUM(IF(lo.TipoGenero = "LM",ms.ErSex + ms.SelGen, 0)) as VentasLM,
            0 as IngresosLM, 0 as NroAvesFinalLM FROM mortalidad_det ms
            INNER JOIN lotes lo ON lo.idLote = ms.idLote WHERE ms.idLevante in(${levantes.join()})
            GROUP BY ms.semana, Periodo,ms.idLevante`, {})
        const dataMortalidad = [...dataMortalidadLevante]
        const dataMortalidadProduccion = await mysqlClass.ejecutarQueryPreparado(`SELECT fecha,GROUP_CONCAT(DISTINCT lo.lote_str ORDER BY lo.lote_str SEPARATOR '-') as NombreLote,
        ms.idProduccion, ms.Semana, SUBSTR(REPLACE(fecha,'-',''), 1, 6) as Periodo, 0 as rowspan,            
        IF(SUBSTR(MAX(fecha), 9, 11) = SUBSTR(MIN(fecha), 9, 11), SUBSTR(MAX(fecha), 9, 11),
        CONCAT(SUBSTR(MIN(fecha), 9, 11)," AL ",SUBSTR(MAX(fecha), 9, 11))) as RangoFecha,
        MIN(fecha) as MinimaFecha, MAX(fecha) as MaximaFecha,
        0 AS NroAvesInicioLH, SUM(IF(lo.TipoGenero = "LH",ms.NoAves, 0)) AS MortalidadLH, 
        SUM(IF(lo.TipoGenero = "LH",ms.NoEliminados, 0)) as DescartesLH,
        0 as VentasLH, 0 as IngresosLH,
        0 as NroAvesFinalLH, 0 AS NroAvesInicioLM,
        SUM(IF(lo.TipoGenero = "LM",ms.NoAves, 0)) AS MortalidadLM,
        SUM(IF(lo.TipoGenero = "LM",ms.NoEliminados, 0)) as DescartesLM,
        0 as VentasLM, 0 as IngresosLM,
        0 as NroAvesFinalLM FROM mortalidad_prod_det ms
        INNER JOIN lotes lo ON lo.idLote = ms.idLote WHERE ms.idProduccion  in(${produccion.join()})
        GROUP BY ms.semana, Periodo,ms.idProduccion`, {})




        for (const poduccionId of produccion) {
            const dataMortalidadProducionPorProduccionId = dataMortalidadProduccion.filter(d => d.idProduccion == poduccionId)
            for (const dataMortalidadP of dataMortalidadProducionPorProduccionId) {
                const ventasIngreso = await mysqlClass.ejecutarQueryPreparado(`SELECT SUM(T.TrasladoLH) AS TrasladoLH, 
            SUM(T.Cant_IngresoLH) AS Cant_IngresoLH, SUM(T.VentasLH) AS VentasLH,
            SUM(T.TrasladoLM) AS TrasladoLM, SUM(T.Cant_IngresoLM) AS Cant_IngresoLM, SUM(T.VentasLM) AS VentasLM
            FROM(SELECT COALESCE(SUM(IF(lo.TipoGenero = "LH",
            tsv.Traslado, 0)),0) AS TrasladoLH, COALESCE(SUM(IF(lo.TipoGenero = 'LH',tsv.Venta, 0)
            ),0) AS VentasLH, 0 AS Cant_IngresoLH, COALESCE(SUM(IF(lo.TipoGenero = 'LM',tsv.Traslado,
            0)),0) AS TrasladoLM, COALESCE(SUM(IF(lo.TipoGenero = "LM",tsv.Venta, 0)),0) AS VentasLM,
            0 AS Cant_IngresoLM FROM traslado_ingreso_ventas tsv
            INNER JOIN lotes lo ON lo.idLote = tsv.idLoteOrigen
            WHERE idProduccionOrigen =${poduccionId} AND Fecha between '${moment(dataMortalidadP.MinimaFecha).format("YYYY-MM-DD")}' AND '${moment(dataMortalidadP.MaximaFecha).format("YYYY-MM-DD")}' UNION
            SELECT 0 AS TrasladoLH, 0 AS VentaLH, COALESCE(SUM(IF(lo.TipoGenero = 'LH',
            tsv.Cant_Ingreso, 0)),0) AS Cant_IngresoLH, 0 AS TrasladoLM, 0 AS VentaLM, 
            COALESCE(SUM(IF(lo.TipoGenero = 'LM',tsv.Cant_Ingreso, 0)),0) AS Cant_IngresoLM
            FROM traslado_ingreso_ventas tsv INNER JOIN lotes lo ON lo.idLote = tsv.idLoteDestino
            WHERE idProduccionDestino = ${poduccionId} AND Fecha between '${moment(dataMortalidadP.MinimaFecha).format("YYYY-MM-DD")}' AND '${moment(dataMortalidadP.MaximaFecha).format('YYYY-MM-DD')}') as T`, {}, true)
                if (ventasIngreso) {
                    dataMortalidad.push({
                        idObjeto: poduccionId, tipo: "Produccion", VentasLH: ventasIngreso.VentasLH, IngresosLH: ventasIngreso.Cant_IngresoLH - ventasIngreso.TrasladoLH,
                        VentasLM: ventasIngreso.VentasLM, IngresosLM: ventasIngreso.Cant_IngresoLM - ventasIngreso.TrasladoLM
                    })
                }
            }
        }
        let i = 0
        for (const mortalidad of dataMortalidad) {
            if (mortalidad.Semana == 1) {
                mortalidad.NroAvesInicioLH = 10
                mortalidad.NroAvesInicioLM = 12
            } else if (
                mortalidad.Semana > 1) {
                mortalidad.NroAvesInicioLH = dataMortalidad[i - 1].NroAvesFinalLH
                mortalidad.NroAvesInicioLM = dataMortalidad[i - 1].NroAvesFinalLM
            }
            mortalidad.NroAvesFinalLH = mortalidad.NroAvesInicioLH - mortalidad.MortalidadLH - mortalidad.DescartesLH - mortalidad.VentasLH + mortalidad.IngresosLH
            mortalidad.NroAvesFinalLM = mortalidad.NroAvesInicioLM - mortalidad.MortalidadLM - mortalidad.DescartesLM - mortalidad.VentasLM + mortalidad.IngresosLM
            mortalidad.NroAvesFinal = mortalidad.NroAvesFinalLH + mortalidad.NroAvesFinalLM
            i++
        }
        return dataMortalidad


    },


    desactivarEstadosDePeriodosPasados: async function () {
        const plantillaHtml = `<table>
        <thead>
      
    <tr style="background-color: #f5f5f5">
        <th class="text-center" style="vertical-align: middle;    padding: 1rem;">TIPO </th>
        <th class="text-center" style="vertical-align: middle;    padding: 1rem;">LOTE</th>
        <th class="text-center" style="vertical-align: middle    padding: 1rem;;">SEMANA</th>
        <th class="text-center" style="vertical-align: middle;    padding: 1rem;">ULTIMO DIA SEMANA </th>
        <th class="text-center" style="vertical-align: middle;    padding: 1rem;">FECHA TOPE CIERRE </th>
    </tr>
        </thead>
        <tbody>       
        `
        let levantesProduccionProcess = []
        const destinatarios = await mysqlClass.ejecutarQueryPreparado(`select email from destinatarios where Estado=1`, {})
        const fechaHoy = moment()
        let queryLevantes = ``
        let queryProduccion = ``
        const dataLevantes = await mysqlClass.ejecutarQueryPreparado(`select yy.* from (
            select 'Levante' Tipo,A.IdLevante,A.idLote,L.lote, A.Semana,BB.fechamin,
            date_format(BB.fechamax, "%Y-%m-%d") fecha_max ,
            date_format( DATE_ADD(BB.fechamax, INTERVAL (select valor from variables_generales where idVG=11) DAY), "%Y-%m-%d") fecha_tope,
            A.Estado 
            from mortalidadsem A 
            left join (
            select B.idLevante, B.semana,  min(fecha) fechamin,max(fecha) fechamax 
            from mortalidad_det B where B.idLevante in   (select idLevante from mortalidad_det 
            where fecha>=DATE_ADD(curdate(), INTERVAL -4 DAY) and fecha<=curdate()
            group by idLevante)
            group by B.idLevante, B.semana 
            ) BB on BB.IdLevante=A.idLevante and BB.semana=A.semana
            left join lotes L on L.idLote=A.idLote
            where A.idLevante in  (select idLevante from mortalidad_det where fecha>='2022-07-01' and fecha<='2022-07-05'
            group by idLevante)
            and A.Semana  not in (SELECT  md.Semana
                       FROM mortalidad_det md
                       WHERE md.idLote =A.IdLote  GROUP BY md.Semana  
                      HAVING COUNT(DISTINCT(Edad))<7) 
            and A.Estado=1
            ) yy where fecha_tope<=curdate()
            order by yy.idLevante,yy.Semana desc,yy.idLote
   `, {})
        const dataProduccion = await mysqlClass.ejecutarQueryPreparado(`select yy.* from (
            select 'Produccion' Tipo,A.idProduccion,A.idLote,L.lote, A.Semana,BB.fechamin,
            date_format(BB.fechamax, "%Y-%m-%d") fecha_max ,
            date_format( DATE_ADD(BB.fechamax, INTERVAL (select valor from variables_generales where idVG=11) DAY), "%Y-%m-%d") fecha_tope,
             A.Estado 
            from mortalidad_prod_sem A 
            left join (
            select B.idProduccion, B.semana,  min(fecha) fechamin,max(fecha) fechamax 
            from mortalidad_prod_det B where B.idProduccion in   (select idProduccion from mortalidad_prod_det 
            where fecha>=DATE_ADD(curdate(), INTERVAL -4 DAY) and fecha<=curdate()
            group by idProduccion)
            group by B.idProduccion, B.semana 
            ) BB on BB.idProduccion=A.idProduccion and BB.semana=A.semana
            left join lotes L on L.idLote=A.idLote
            where A.idProduccion in  (select idProduccion from mortalidad_prod_det where fecha>='2022-07-01' and fecha<='2022-07-05'
            group by idProduccion)
            and A.Semana  not in (SELECT  md.Semana
                       FROM mortalidad_prod_det md
                       WHERE md.idLote =A.IdLote  GROUP BY md.Semana  
                      HAVING COUNT(DISTINCT(Edad))<7) 
            and A.Estado=1
            ) yy where fecha_tope<=curdate()
            order by yy.idProduccion,yy.Semana desc,yy.idLote`, {})
        const dataLevanteFilter = dataLevantes.filter(({ fecha_tope }) => {
            return moment(fecha_tope).isSameOrBefore(fechaHoy)
        })
        const dataProduccionFilter = dataProduccion.filter(({ fecha_tope }) => {
            return moment(fecha_tope).isSameOrBefore(fechaHoy)
        })

        levantesProduccionProcess = dataProduccionFilter.concat(dataLevanteFilter)
        for (const levante of dataLevanteFilter) {
            queryLevantes += `update mortalidadsem set Estado=0 where idLevante=${levante.IdLevante} and Semana=${levante.Semana} and idLote=${levante.idLote};`
        }
        for (const produccion of dataProduccionFilter) {
            queryProduccion += `update mortalidad_prod_sem set Estado=0 where idProduccion=${produccion.idProduccion} and Semana=${produccion.Semana} and idLote=${produccion.idLote};`
        }
        const queryTotal = queryLevantes.concat(queryProduccion)
        if (queryTotal != "") {
            await mysqlClass.ejecutarQueryPreparado(queryTotal, {})
        }
        if (levantesProduccionProcess.length > 0) {
            const filas = levantesProduccionProcess.map(l => `<tr>
<td style="text-align: center">
${l.Tipo}
</td>
<td>
${l.lote}
</td>
<td>
${l.Semana}
</td>
<td>
${l.fecha_max}
</td>
<td>
${l.fecha_tope}
</td>
</tr>`)
            const htmlCompleto = `${plantillaHtml}${filas.join("\n")}</body>`
            await sendEmail.sendEmail(`Reporte de cierre de semanas automaticas`, destinatarios.map(d => d.email), htmlCompleto)
        }
    },
    verifyMortalidadEdad: async function (params) {
        return await db.query("SELECT * FROM mortalidad_det WHERE idLevante = ? and Edad = ?", [params.idLevante, params.Edad]);
    },
    getAllmortalidad: function (callback) {
        return db.query("Select * from mortalidad", callback);
    },
    getMortalidadById: function (id, callback) {
        return db.query("select * from mortalidad where idMortalidadDet=?", [id], callback);
    },
    getMortalidadByIdLevante: function (id, callback) {
        return db.query("select * from mortalidad where idLevante=? order by Edad ASC", [id], callback);
    },
    getMortalidadesPorLevantes: async function (levantesIds = []) {
        const connection = await mysql.connection();
        try {
            return await connection.query("select * from mortalidad where idLevante in (?) order by Edad ASC", [levantesIds]);

        } catch (error) {

            throw error;
        } finally {
            connection.release();

        }

    },
    getmortalidadUltimoDia: function (id, callback) {
        return db.query("select * from mortalidad WHERE idLevante = ? ORDER BY Edad DESC LIMIT 0, 1", [id], callback);
    },

    getMortalidadUltimoDiaPorLevantes: async function (levantes = []) {
        const connection = await mysql.connection();
        try {
            return await connection.query("select max(Edad) as Edad,idLevante,idMortalidad,`data` from  mortalidad where idLevante in(?) GROUP BY idLevante", [levantes]);

        } catch (error) {

            throw error;
        } finally {
            connection.release();

        }

    },
    getmortalidadDia: function (idLevante, Edad, callback) {
        return db.query("select * from mortalidad WHERE idLevante = ? AND Edad = ?", [idLevante, Edad], callback);
    },
    listarMortalidadPorNombreLote: async function (selectedFields = [], nombreLotes = []) {
        const connection = await mysql.connection();
        try {
            return await connection.query("select " + selectedFields.join() + " ,lo.lote from mortalidad_prod_sem mo inner join lotes lo on lo.idLote=mo.idLote where lo.lote in(?)", [nombreLotes]);

        } catch (error) {

            throw error;
        } finally {
            connection.release();

        }
    },

    verificarMortalidadesPorLotes: async function (lotes = []) {

        const connection = await mysql.connection();
        try {
            return await connection.query("select " + selectedFields.join() + " ,lo.lote from mortalidad_prod_sem mo inner join lotes lo on lo.idLote=mo.idLote where lo.lote in(?)", [nombreLotes]);

        } catch (error) {

            throw error;
        } finally {
            connection.release();

        }


    },
    getMortalidadLevante: function (id, callback) {
        return db.query("select * from levantes l " +
            "INNER JOIN lotes lo ON lo.idLevante = l.idLevante " +
            "INNER JOIN lineas li ON li.idLinea = lo.idLinea " +
            "INNER JOIN galpones ga ON ga.idGalpon = lo.idGalpon " +
            "WHERE l.idLevante = ? ORDER BY li.CodLinea DESC", [id], callback);
    },


    getMortalidadPorLevantes: async function (levantesId = []) {
        const connection = await mysql.connection();
        try {
            const data = await connection.query("select * from levantes l " +
                "INNER JOIN lotes lo ON lo.idLevante = l.idLevante " +
                "INNER JOIN lineas li ON li.idLinea = lo.idLinea " +
                "INNER JOIN galpones ga ON ga.idGalpon = lo.idGalpon " +
                "WHERE l.idLevante in(?) ORDER BY li.CodLinea DESC", [levantesId]);
            return data;

        } catch (error) {

            throw error;
        } finally {
            connection.release();

        }
    },

    getMortalidadSemana: async function (id) {
        let rows = await db.query(`SELECT * 
        FROM mortalidadsem 
        WHERE idLote = ? 
        ORDER BY Semana ASC`, [id]);
        if (rows.length != 0) {
            let ultimo = rows[rows.length - 1];
            let cantidad_days = await db.query(`SELECT COUNT(*) as cant_days
            FROM mortalidad_det md
            WHERE md.idLote = ? and md.semana = ?
            GROUP BY md.semana`, [id, ultimo.Semana]);
            if (cantidad_days[0].cant_days < 7) {
                rows.pop();
            }
        }
        return rows;
    },
    getMortalidadLevantes: function (callback) {
        return db.query("select * from levantes ORDER BY idLevante DESC", callback);
    },
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
        // console.log("inside service");
        // console.log(Mortalidad.Id);
        return db.query("INSERT INTO mortalidad (idMortalidad, idLote, idLinea, Fecha, Edad, EdadTexto, NoAves, PorcMortalidad, NoEliminados, PorcEliminados) values(?,?,?,?,?,?,?,?,?,?)", [Mortalidad.idMortalidad, Mortalidad.idLote, Mortalidad.idLinea, Mortalidad.Fecha, Mortalidad.Edad, Mortalidad.EdadTexto, Mortalidad.NoAves, Mortalidad.PorcMortalidad, Mortalidad.NoEliminados, Mortalidad.PorcEliminados], callback);
    },
    addMortalidadModal: async function (Mortalidad) {
        // console.log('Mortalidad', Mortalidad);
        await db.query("INSERT INTO mortalidad (idLevante, Edad, data) values(?,?,?)", [Mortalidad.idLevante, Mortalidad.Edad, Mortalidad.data]);
        var data = JSON.parse(Mortalidad.data);
        var semana = {};
        var lotes = [];
        let j = 0;
        const dataMortalidad = []

        for (var idLote in data) {
            j = j + 1;
            if (j != 5) {
                semana[idLote] = {
                    'NoAves': 0,
                    'PorcMortalidad': 0,
                    'NoEliminados': 0,
                    'PorcEliminados': 0,
                    'ErSex': 0,
                    'PorcError': 0,
                    'SelGen': 0,
                    'PorcSel': 0
                };
                lotes.push(idLote);
                if (data[idLote].SelGen == undefined) {
                    data[idLote]['SelGen'] = 0;
                    data[idLote]['PorcSel'] = 0;
                }
                /*    if (typeof data.Observaciones != "undefined") {
                       await db.query("INSERT INTO mortalidad_det (idLevante, idLote, Edad, semana, fecha, NoAves, PorcMortalidad, NoEliminados, PorcEliminados, ErSex, PorcError, SelGen, PorcSel, observaciones) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                           [Mortalidad.idLevante, idLote, Mortalidad.Edad, Mortalidad.semana, Mortalidad.fecha, data[idLote].NoAves, data[idLote].PorcMortalidad, data[idLote].NoEliminados, data[idLote].PorcEliminados, data[idLote].ErSex, data[idLote].PorcError, data[idLote].SelGen, data[idLote].PorcSel, data.Observaciones]);
                   } else {
                       await db.query("INSERT INTO mortalidad_det (idLevante, idLote, Edad, semana, fecha, NoAves, PorcMortalidad, NoEliminados, PorcEliminados, ErSex, PorcError, SelGen, PorcSel) values(?,?,?,?,?,?,?,?,?,?,?,?,?)",
                           [Mortalidad.idLevante, idLote, Mortalidad.Edad, Mortalidad.semana, Mortalidad.fecha, data[idLote].NoAves, data[idLote].PorcMortalidad, data[idLote].NoEliminados, data[idLote].PorcEliminados, data[idLote].ErSex, data[idLote].PorcError, data[idLote].SelGen, data[idLote].PorcSel]);
                   } */
            }
        }
        for (let index = 0; index < Object.keys(data).length; index++) {
            const idLote = Object.keys(data)[index];
            if (idLote != "Observaciones") {
                dataMortalidad.push({
                    idLevante: Mortalidad.idLevante, idLote, Edad: Mortalidad.Edad, semana: Mortalidad.semana, fecha: Mortalidad.fecha,
                    NoAves: data[idLote].NoAves, PorcMortalidad: data[idLote].PorcMortalidad, NoEliminados: data[idLote].NoEliminados,
                    PorcEliminados: data[idLote].PorcEliminados, ErSex: data[idLote].ErSex, PorcError: data[idLote].PorcError, SelGen: data[idLote].SelGen, PorcSel: data[idLote].PorcSel,
                    Observaciones: data.Observaciones
                })
            }

        }
        console.log("mortalidad", dataMortalidad)
        await db.query("INSERT INTO mortalidad_det (idLevante, idLote, Edad, semana, fecha, NoAves, PorcMortalidad, NoEliminados, PorcEliminados, ErSex, PorcError, SelGen, PorcSel) values ?", [dataMortalidad.map(m => [m.idLevante, m.idLote, m.Edad, m.semana, moment(m.fecha).format("YYYY-MM-DD"), m.NoAves, m.PorcMortalidad, m.NoEliminados, m.PorcEliminados, m.ErSex, m.PorcError, m.SelGen, m.PorcSel])]);
        let num_semana = Math.ceil(Mortalidad.Edad / 7);

        let count = await db.query("SELECT idMortalidadSem FROM mortalidadsem WHERE idLevante = " + Mortalidad.idLevante + " AND Semana = " + num_semana + " ORDER BY idLote");
        if (count.length == 0) {
            for (var i = 0; i < lotes.length; i++) {
                if (num_semana == 1) {
                    let _lotes = parseInt(lotes[i]);
                    let _saldo_fin_sem = Mortalidad.NumHembras[_lotes] - data[lotes[i]].NoAves - data[lotes[i]].NoEliminados - data[lotes[i]].ErSex - data[lotes[i]].SelGen;
                    let mortalidad_tot = data[lotes[i]].NoAves + data[lotes[i]].NoEliminados
                    let PorcMortalidadTot = ((mortalidad_tot / Mortalidad.NumHembras[_lotes]) * 100);
                    console.log("Mortalidad.NumHembras[_lotes]", Mortalidad.NumHembras[_lotes])
                    console.log("mortalidad_tot", mortalidad_tot)
                    console.log("PorcMortalidadTot", PorcMortalidadTot);
                    console.log("data[lotes[i]]", data[lotes[i]])
                    await db.query("INSERT INTO mortalidadsem (idLote, idLinea, Semana, NoAves, PorcMortalidad, PorcAcumMortalidad, NoEliminados, PorcEliminados,	PorcAcumEliminados, ErSex, SelGen, PorcErSex,PorcAcumErSex, PorcSelGen, PorcAcumSelGen, idLevante, saldo_fin_sem,MortalidadTot,PorcMortalidadTot) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                        [lotes[i], 2000, num_semana, data[lotes[i]].NoAves, data[lotes[i]].PorcMortalidad.toFixed(2), data[lotes[i]].PorcMortalidad.toFixed(2), data[lotes[i]].NoEliminados, data[lotes[i]].PorcEliminados.toFixed(2), data[lotes[i]].PorcEliminados.toFixed(2), data[lotes[i]].ErSex, data[lotes[i]].SelGen, data[lotes[i]].PorcError.toFixed(2), data[lotes[i]].PorcError.toFixed(2), data[lotes[i]].PorcSel.toFixed(2), data[lotes[i]].PorcSel.toFixed(2), Mortalidad.idLevante, _saldo_fin_sem, mortalidad_tot, Math.round(PorcMortalidadTot * 100) / 100]);
                } else {
                    let PorcAcumMortalidad_ant = 0;
                    let PorcAcumEliminados_ant = 0;
                    let PorcAcumErSex_ant = 0;
                    let PorcAcumSelGen_ant = 0;
                    let _lotes = parseInt(lotes[i]);
                    let _NoAves = data[lotes[i]].NoAves;
                    let _NoEliminados = data[lotes[i]].NoEliminados;
                    let _ErSex = data[lotes[i]].ErSex;
                    let _SelGen = data[lotes[i]].SelGen;
                    let _PorcMortalidad = data[lotes[i]].PorcMortalidad;
                    let _PorcEliminados = data[lotes[i]].PorcEliminados;
                    let _PorcError = data[lotes[i]].PorcError;
                    let _PorcSel = data[lotes[i]].PorcSel;
                    let _saldo_fin_sem = 0;
                    let mortalidad_tot = data[lotes[i]].NoAves + data[lotes[i]].NoEliminados
                    let PorcMortalidadTot = ((mortalidad_tot / Mortalidad.NumHembras[_lotes]) * 100);
                    console.log("Mortalidad.NumHembras[_lotes]", Mortalidad.NumHembras[_lotes])
                    console.log("mortalidad_tot", mortalidad_tot)
                    console.log("PorcMortalidadTot", PorcMortalidadTot);
                    let rpta = await db.query("SELECT * FROM mortalidadsem WHERE idLevante = " + Mortalidad.idLevante + " AND Semana = " + (num_semana - 1) + " and idLote = " + lotes[i]);
                    PorcAcumMortalidad_ant = rpta[0].PorcAcumMortalidad;
                    PorcAcumEliminados_ant = rpta[0].PorcAcumEliminados;
                    PorcAcumErSex_ant = rpta[0].PorcAcumErSex;
                    PorcAcumSelGen_ant = rpta[0].PorcAcumSelGen;
                    _saldo_fin_sem = rpta[0].saldo_fin_sem - _NoAves - _NoEliminados - _ErSex - _SelGen
                    // console.log([_lotes, 0 , num_semana, _NoAves, _PorcMortalidad.toFixed(2), (PorcAcumMortalidad_ant + _PorcMortalidad).toFixed(2) ,_NoEliminados, _PorcEliminados.toFixed(2),_ErSex , _SelGen, _PorcError.toFixed(2), _PorcSel.toFixed(2), Mortalidad.idLevante, _saldo_fin_sem]);
                    await db.query("INSERT INTO mortalidadsem (idLote, idLinea, Semana, NoAves, PorcMortalidad, PorcAcumMortalidad, NoEliminados, PorcEliminados,	PorcAcumEliminados, ErSex, SelGen, PorcErSex,PorcAcumErSex, PorcSelGen, PorcAcumSelGen, idLevante, saldo_fin_sem,MortalidadTot,PorcMortalidadTot) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                        [_lotes, 0, num_semana, _NoAves, _PorcMortalidad.toFixed(2), (PorcAcumMortalidad_ant + _PorcMortalidad).toFixed(2), _NoEliminados, _PorcEliminados.toFixed(2), (PorcAcumEliminados_ant + _PorcEliminados).toFixed(2), _ErSex, _SelGen, _PorcError.toFixed(2), (PorcAcumErSex_ant + _PorcError).toFixed(2), _PorcSel.toFixed(2), (PorcAcumSelGen_ant + _PorcSel).toFixed(2), Mortalidad.idLevante, _saldo_fin_sem, mortalidad_tot, Math.round(PorcMortalidadTot * 100) / 100]);
                }
            }
        } else {
            for (var i = 0; i < lotes.length; i++) {
                console.log('ACTUALIZANDO SEMANA INSERTADA DE ' + lotes[i]);
                let lotes_var = parseInt(lotes[i]);
                let resp = await db.query("SELECT * FROM mortalidadsem WHERE idLevante = " + Mortalidad.idLevante + "  and Semana = " + num_semana + "   and idLote= " + lotes_var);
                // console.log("resp", resp[0])
                let d = resp[0];
                let var_NoAves = data[lotes_var].NoAves + parseInt(d.NoAves);
                let var_NoEliminados = data[lotes_var].NoEliminados + parseInt(d.NoEliminados);
                let var_ErSex = data[lotes_var].ErSex + parseInt(d.ErSex);
                let var_SelGen = data[lotes_var].SelGen + parseInt(d.SelGen);
                let var_PorcMortalidad = ((var_NoAves / Mortalidad.NumHembras[lotes_var]) * 100).toFixed(2);
                let var_PorcEliminados = ((var_NoEliminados / Mortalidad.NumHembras[lotes_var]) * 100).toFixed(2);
                let var_PorcError = ((var_ErSex / Mortalidad.NumHembras[lotes_var]) * 100).toFixed(2);
                let var_PorcSel = ((var_SelGen / Mortalidad.NumHembras[lotes_var]) * 100).toFixed(2);
                let _saldo_fin_sem = 0;
                // console.log([var_NoAves, var_PorcMortalidad, var_NoEliminados, var_PorcEliminados,var_ErSex, var_SelGen,var_PorcError, var_PorcSel, Mortalidad.idLevante, num_semana, lotes_var]);
                if (num_semana == 1) {
                    _saldo_fin_sem = Mortalidad.NumHembras[lotes_var] - var_NoAves - var_NoEliminados - var_ErSex - var_SelGen;
                    let mortalidad_tot = var_NoAves + var_NoEliminados
                    let PorcMortalidadTot = ((mortalidad_tot / _saldo_fin_sem) * 100);
                    console.log("Mortalidad.NumHembras[lotes_var]", Mortalidad.NumHembras[lotes_var])
                    console.log("mortalidad_tot", mortalidad_tot)
                    console.log("PorcMortalidadTot", PorcMortalidadTot);
                    await db.query("UPDATE mortalidadsem SET NoAves = ?, PorcMortalidad = ?, PorcAcumMortalidad = ?, NoEliminados = ?, PorcEliminados = ?, PorcAcumEliminados = ?, ErSex = ?, PorcErSex = ?,PorcAcumErSex = ?, SelGen = ?, PorcSelGen = ?, PorcAcumSelGen = ?, saldo_fin_sem = ?, PorcMortalidadTot = ?, MortalidadTot= ? WHERE idLevante = ? AND Semana = ? AND idLote = ?",
                        [var_NoAves, var_PorcMortalidad, var_PorcMortalidad, var_NoEliminados, var_PorcEliminados, var_PorcEliminados, var_ErSex, var_PorcError, var_PorcError, var_SelGen, var_PorcSel, var_PorcSel, _saldo_fin_sem, Math.round(PorcMortalidadTot * 100) / 100, mortalidad_tot, Mortalidad.idLevante, num_semana, lotes_var]);
                } else {
                    let rpta2 = await db.query("SELECT * FROM mortalidadsem WHERE idLevante = " + Mortalidad.idLevante + " AND Semana = " + (num_semana - 1) + " and idLote = " + lotes_var);
                    // console.log("rpta",rpta);
                    PorcAcumMortalidad_ant = parseFloat(rpta2[0].PorcAcumMortalidad) + parseFloat(var_PorcMortalidad);
                    PorcAcumEliminados_ant = parseFloat(rpta2[0].PorcAcumEliminados) + parseFloat(var_PorcEliminados);
                    PorcAcumErSex_ant = parseFloat(rpta2[0].PorcAcumErSex) + parseFloat(var_PorcError);
                    PorcAcumSelGen_ant = parseFloat(rpta2[0].PorcAcumSelGen) + parseFloat(var_PorcSel);
                    _saldo_fin_sem = parseInt(rpta2[0].saldo_fin_sem) - parseInt(var_NoAves) - parseInt(var_NoEliminados) - parseInt(var_ErSex) - parseInt(var_SelGen)
                    let mortalidad_tot = parseInt(var_NoAves) + parseInt(var_NoEliminados)
                    let PorcMortalidadTot = 0;
                    if (num_semana == 1) {
                        PorcMortalidadTot = ((mortalidad_tot / _saldo_fin_sem) * 100);
                    } else {
                        PorcMortalidadTot = ((mortalidad_tot / _saldo_fin_sem) * 100) + rpta2[0].PorcMortalidadTot;
                    }
                    console.log("Mortalidad.NumHembras[lotes_var]", Mortalidad.NumHembras[lotes_var])
                    console.log("mortalidad_tot", mortalidad_tot)
                    console.log(PorcMortalidadTot);
                    await db.query("UPDATE mortalidadsem SET NoAves = ?, PorcMortalidad = ?, PorcAcumMortalidad = ?, NoEliminados = ?, PorcEliminados = ?, PorcAcumEliminados = ?, ErSex = ?, PorcErSex = ?,PorcAcumErSex = ?, SelGen = ?, PorcSelGen = ?, PorcAcumSelGen = ?, saldo_fin_sem = ?, PorcMortalidadTot = ?, MortalidadTot= ? WHERE idLevante = ? AND Semana = ? AND idLote = ?",
                        [var_NoAves, var_PorcMortalidad, (PorcAcumMortalidad_ant).toFixed(2), var_NoEliminados, var_PorcEliminados, (PorcAcumEliminados_ant).toFixed(2), var_ErSex, var_PorcError, (PorcAcumErSex_ant).toFixed(2), var_SelGen, var_PorcSel, (PorcAcumSelGen_ant).toFixed(2), _saldo_fin_sem, Math.round(PorcMortalidadTot * 100) / 100, mortalidad_tot, Mortalidad.idLevante, num_semana, lotes_var]);
                }
            }
        }
        return;
    },
    updateMortalidad: async function (id, Mortalidad) {
        await db.query("UPDATE mortalidad set data = ? WHERE idMortalidad=?", [Mortalidad.data, id]);
        var data = JSON.parse(Mortalidad.data);
        var semana = {};
        var lotes = [];
        for (var idLote in data) {
            semana[idLote] = {
                'NoAves': 0,
                'PorcMortalidad': 0,
                'NoEliminados': 0,
                'PorcEliminados': 0,
                'ErSex': 0,
                'PorcError': 0,
                'SelGen': 0,
                'PorcSel': 0,
                "ingreso": 0
            };
            lotes.push(idLote);
            if (data[idLote].SelGen == undefined) {
                data[idLote]['SelGen'] = 0;
                data[idLote]['PorcSel'] = 0;
            }
            if (idLote != 'Observaciones') {
                await db.query("UPDATE mortalidad_det SET NoAves = ?, PorcMortalidad = ?, NoEliminados = ?, PorcEliminados = ?, ErSex = ?, PorcError = ?, SelGen = ?, PorcSel = ?, observaciones = ? WHERE idLevante = ? AND Edad = ? AND idLote = ?",
                    [data[idLote].NoAves, data[idLote].PorcMortalidad, data[idLote].NoEliminados, data[idLote].PorcEliminados, data[idLote].ErSex, data[idLote].PorcError, data[idLote].SelGen, data[idLote].PorcSel, data.Observaciones, Mortalidad.idLevante, Mortalidad.Edad, idLote]);
            }
        }

        let n2 = Mortalidad.Edad;
        let n1 = Mortalidad.Edad - 6;

        let between = n1 + " AND " + n2;
        let num_semana = Math.ceil(Mortalidad.Edad / 7);

        let count1 = await db.query("SELECT * FROM mortalidad_det WHERE idLevante = " + Mortalidad.idLevante + " AND Edad BETWEEN " + between + " ORDER BY Edad, idLote");
        for (var i = 0; i < count1.length; i++) {
            if (semana[count1[i]['idLote']]['NoAves'] != undefined) {
                semana[count1[i]['idLote']]['NoAves'] = semana[count1[i]['idLote']]['NoAves'] + count1[i]['NoAves'];
                semana[count1[i]['idLote']]['PorcMortalidad'] = semana[count1[i]['idLote']]['NoAves'] / Mortalidad.NumHembras[count1[i]['idLote']] * 100;
            }
            if (semana[count1[i]['idLote']]['NoEliminados'] != undefined) {
                semana[count1[i]['idLote']]['NoEliminados'] = semana[count1[i]['idLote']]['NoEliminados'] + count1[i]['NoEliminados'];
                semana[count1[i]['idLote']]['PorcEliminados'] = semana[count1[i]['idLote']]['NoEliminados'] / Mortalidad.NumHembras[count1[i]['idLote']] * 100;
            }
            if (semana[count1[i]['idLote']]['ErSex'] != undefined) {
                semana[count1[i]['idLote']]['ErSex'] = semana[count1[i]['idLote']]['ErSex'] + count1[i]['ErSex'];
                semana[count1[i]['idLote']]['PorcError'] = semana[count1[i]['idLote']]['ErSex'] / Mortalidad.NumHembras[count1[i]['idLote']] * 100;
            }
            if (semana[count1[i]['idLote']]['SelGen'] != undefined) {
                semana[count1[i]['idLote']]['SelGen'] = semana[count1[i]['idLote']]['SelGen'] + count1[i]['SelGen'];
                semana[count1[i]['idLote']]['PorcSel'] = semana[count1[i]['idLote']]['SelGen'] / Mortalidad.NumHembras[count1[i]['idLote']] * 100;
            }
        }
        // console.log('dias encontrados '+count.length, semana);

        let count = await db.query("SELECT idMortalidadSem FROM mortalidadsem WHERE idLevante = " + Mortalidad.idLevante + " AND Semana = " + num_semana + " ORDER BY idLote");
        if (count.length == 0) {
            for (var i = 0; i < lotes.length; i++) {
                await db.query("INSERT INTO mortalidadsem (idLote, idLinea, Semana, NoAves, PorcMortalidad, NoEliminados, PorcEliminados, ErSex, SelGen, PorcErSex, PorcSelGen, idLevante) values(?,?,?,?,?,?,?,?,?,?,?,?)", [lotes[i], 0, num_semana, semana[lotes[i]].NoAves, semana[lotes[i]].PorcMortalidad.toFixed(2), semana[lotes[i]].NoEliminados, semana[lotes[i]].PorcEliminados.toFixed(2), semana[lotes[i]].ErSex, semana[lotes[i]].SelGen, semana[lotes[i]].PorcError.toFixed(2), semana[lotes[i]].PorcSel.toFixed(2), Mortalidad.idLevante]);
            }
        } else {
            for (var i = 0; i < lotes.length; i++) {
                console.log('ACTUALIZANDO SEMANA DE ' + lotes[i]);
                if (lotes[i] != 'Observaciones') {
                    await db.query("UPDATE mortalidadsem SET NoAves = ?, PorcMortalidad = ?, NoEliminados = ?, PorcEliminados = ?, ErSex = ?, SelGen = ?, PorcErSex = ?, PorcSelGen = ? WHERE idLevante = ? AND Semana = ? AND idLote = ?",
                        [semana[lotes[i]].NoAves, semana[lotes[i]].PorcMortalidad.toFixed(2), semana[lotes[i]].NoEliminados, semana[lotes[i]].PorcEliminados.toFixed(2), semana[lotes[i]].ErSex, semana[lotes[i]].SelGen, semana[lotes[i]].PorcError.toFixed(2), semana[lotes[i]].PorcSel.toFixed(2), Mortalidad.idLevante, num_semana, lotes[i]]);
                }
            }
        }
        return;
    },
    updateValores: async function (Mortalidad, rr) {
        console.log('Mortalidad valores', Mortalidad, rr);
        let count = await db.query("SELECT * FROM mortalidadsem WHERE idLevante = " + Mortalidad.idLevante + " and Semana = " + Mortalidad.semana + " ORDER BY Semana, idLote ASC");
        for (var i = 0; i < count.length; i++) {
            let count1 = count[i]
            let res = await db.query("SELECT SUM(NoAves) as NoAves, SUM(NoEliminados) as NoEliminados, SUM(ErSex) as ErSex, SUM(SelGen) as SelGen, Semana, idLote FROM mortalidad_det WHERE idLote = ? AND Semana = ?", [count1['idLote'], count1['Semana']]);
            console.log('actualizando semana valores ' + count1['Semana'] + ' del lote ' + count1['idLote'], count1)
            let NumHembras = Mortalidad.NumHembras[count1['idLote']];
            console.log(NumHembras);
            let info = res[0];
            let NoAves_i = info.NoAves;
            let PorcMortalidad_i = (NoAves_i / NumHembras) * 100;
            let NoEliminados_i = info.NoEliminados;
            let PorcEliminados_i = (NoEliminados_i / NumHembras) * 100;
            let ErSex_i = info.ErSex;
            let PorcErSex_i = (ErSex_i / NumHembras) * 100;
            let SelGen_i = info.SelGen;
            let PorcSelGen_i = (SelGen_i / NumHembras) * 100;
            let Semana_i = info.Semana;
            let idLote_i = info.idLote;
            let MortalidadTot = NoAves_i + NoEliminados_i;
            let total_aves_sem = count1["saldo_fin_sem"] + count1["MortalidadTot"]
            let saldo_fin_sem = total_aves_sem - MortalidadTot;
            let PorcMortalidadTot = (MortalidadTot / total_aves_sem) * 100;
            let rep2 = await db.query("UPDATE mortalidadsem set NoAves=?, PorcMortalidad= ?, NoEliminados=?, PorcEliminados=?, ErSex=?, PorcErSex=?, SelGen=?, PorcSelGen=?, MortalidadTot=?, PorcMortalidadTot=?, saldo_fin_sem=? WHERE idLote = ? AND Semana = ?",
                [NoAves_i, PorcMortalidad_i.toFixed(2), NoEliminados_i, PorcEliminados_i.toFixed(2), ErSex_i, PorcErSex_i.toFixed(2), SelGen_i, PorcSelGen_i.toFixed(2), MortalidadTot, Math.round(PorcMortalidadTot * 100) / 100, saldo_fin_sem, idLote_i, Semana_i]);
            console.log("rep2", rep2);
        }
        return;
    },
    updateAcumulado: async function (Mortalidad, rr1) {
        console.log('Mortalidad Acumulado', Mortalidad, rr1);
        let count = await db.query("SELECT * FROM mortalidadsem WHERE idLevante = " + Mortalidad.idLevante + " ORDER BY Semana, idLote ASC");
        var acum_PorcMortalidad = {};
        var acum_PorcEliminados = {};
        var acum_PorcErSex = {};
        var acum_PorcSelGen = {};
        console.log("count - quieres ", count)
        for (var i = 0; i < count.length; i++) {
            console.log('actualizando semana ' + count[i]['Semana'] + ' del lote ' + count[i]['idLote'], count[i])
            if (count[i]['Semana'] == 1) {
                let rep = await db.query("UPDATE mortalidadsem set PorcAcumMortalidad = ?, PorcAcumEliminados = ?, PorcAcumErSex = ?, PorcAcumSelGen = ? WHERE idLote = ? AND Semana = ?",
                    [(count[i]['PorcMortalidad']).toFixed(2), (count[i]['PorcEliminados']).toFixed(2), (count[i]['PorcErSex']).toFixed(2), (count[i]['PorcSelGen']).toFixed(2), count[i]['idLote'], 1]);
                console.log("rep", rep);

                acum_PorcMortalidad[count[i]['idLote']] = count[i]['PorcMortalidad'];
                acum_PorcEliminados[count[i]['idLote']] = count[i]['PorcEliminados'];
                acum_PorcErSex[count[i]['idLote']] = count[i]['PorcErSex'];
                acum_PorcSelGen[count[i]['idLote']] = count[i]['PorcSelGen'];
            } else {
                acum_PorcMortalidad[count[i]['idLote']] = acum_PorcMortalidad[count[i]['idLote']] + count[i]['PorcMortalidad'];
                acum_PorcEliminados[count[i]['idLote']] = acum_PorcEliminados[count[i]['idLote']] + count[i]['PorcEliminados'];
                acum_PorcErSex[count[i]['idLote']] = acum_PorcErSex[count[i]['idLote']] + count[i]['PorcErSex'];
                acum_PorcSelGen[count[i]['idLote']] = acum_PorcSelGen[count[i]['idLote']] + count[i]['PorcSelGen'];
                await db.query("UPDATE mortalidadsem set PorcAcumMortalidad = ?, PorcAcumEliminados = ?, PorcAcumErSex = ?, PorcAcumSelGen = ? WHERE idLote = ? AND Semana = ?",
                    [(acum_PorcMortalidad[count[i]['idLote']]).toFixed(2), (acum_PorcEliminados[count[i]['idLote']]).toFixed(2), (acum_PorcErSex[count[i]['idLote']]).toFixed(2), (acum_PorcSelGen[count[i]['idLote']]).toFixed(2), count[i]['idLote'], count[i]['Semana']]);
            }
        }
        return;
    },
    updateAcumulado2: async function (Mortalidad, rr2) {
        let data = JSON.parse(Mortalidad.data);
        console.log("rr2", rr2)
        for (var idLote in data) {
            if (idLote != 'Observaciones') {
                await db.query("CALL getActualizarSaldoMortalidadSem(?, ?, ?)", [Mortalidad.idLevante, idLote, Mortalidad.semana]);
            }
        }
        return;
    },
    disparadorAlimentos: async function (Mortalidad, rr3) {
        var data3 = JSON.parse(Mortalidad.data);
        console.log("rr3", rr3)
        for (var idLote3 in data3) {
            if (idLote3 != 'Observaciones') {
                await db.query("CALL getActualizarAlimentoLevante(?, ?)", [Mortalidad.idLevante, idLote3]);
            }
        }
        return;
    },
    StockMensualAves: async function (Mortalidad, reta) {
        console.log("TIENE QUE APARECER AL FINAL", reta)
        let data = JSON.parse(Mortalidad.data)
        let fecha = Mortalidad.fecha.split('-');
        let m = fecha[1];
        let y = fecha[0];
        for (var idLote in data) {
            if (idLote != 'Observaciones') {
                let rows = await db.query("SELECT * FROM stock_aves_mensual WHERE Month = ? and Year = ? and idLote = ?",
                    [m, y, idLote])
                if (rows.length == 0) {
                    let NoAves
                    let NoEliminados
                    let NroAvesIniciadas
                    let NroAvesFinal
                    if (Mortalidad.Edad == '1') {
                        NoAves = data[idLote].NoAves;
                        NoEliminados = data[idLote].NoEliminados;
                        NroAvesIniciadas = Mortalidad.NumHembras[idLote];
                        NroAvesFinal = NroAvesIniciadas - NoAves - NoEliminados;
                        await db.query("INSERT INTO stock_aves_mensual (Periodo, Month, Year, idLote, NroAvesIniciadas, Mortalidad, Descarte, FinCampania, Ingreso, NroAvesFinal) VALUES (?,?,?,?,?,?,?,?,?,?)",
                            [y + '' + m, m, y, idLote, NroAvesIniciadas, NoAves, NoEliminados, 0, 0, NroAvesFinal]);
                    } else {
                        let month_ant;
                        let year_ant;
                        if (m == '01') {
                            month_ant = '12'
                            year_ant = y - 1;
                        } else {
                            month_ant = m - 1;
                            year_ant = y;
                        }

                        if (month_ant < 10) {
                            month_ant = '0' + month_ant
                        }

                        let rows_ant = await db.query("SELECT * FROM stock_aves_mensual WHERE Month = ? and Year = ? and idLote = ?",
                            [month_ant, year_ant, idLote])
                        NroAvesFinal = rows_ant[0].NroAvesFinal
                        await db.query("INSERT INTO stock_aves_mensual (Periodo, Month, Year, idLote, NroAvesIniciadas, Mortalidad, Descarte, FinCampania, Ingreso, NroAvesFinal) VALUES (?,?,?,?,?,?,?,?,?,?)",
                            [y + '' + m, m, y, idLote, NroAvesFinal, 0, 0, 0, 0, NroAvesFinal]);
                        await db.query("CALL actualizarStockAves(?, ?, ?)",
                            [m, y, idLote]);
                    }
                } else {
                    let fila = await db.query("CALL actualizarStockAves(?, ?, ?)",
                        [m, y, idLote]);
                    console.log(fila);
                }
            }
        }
        return;
    },
    deleteMortalidad: function (id, callback) {
        return db.query("delete from mortalidad where idMortalidad=?", [id], callback);
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
    verifyVentas: async function (Mortalidad) {
        var data = JSON.parse(Mortalidad.data);
        var semana = {};
        var lotes = [];
        let j = 0;
        for (var idLote in data) {
            j = j + 1;
            if (j != 5) {
                semana[idLote] = {
                    'NoAves': 0,
                    'PorcMortalidad': 0,
                    'NoEliminados': 0,
                    'PorcEliminados': 0,
                    'ErSex': 0,
                    'PorcError': 0,
                    'SelGen': 0,
                    'PorcSel': 0
                };
                lotes.push(idLote);
                if (data[idLote].SelGen == undefined) {
                    data[idLote]['SelGen'] = 0;
                    data[idLote]['PorcSel'] = 0;
                }
                if (typeof data.Observaciones == "undefined") {
                    if (data[idLote].SelGen != 0) {
                        let jsonData = {
                            idProduccionOrigen: Mortalidad.idLevante,
                            LoteOrigen: idLote,
                            Nro_Guia: "SELGEN",
                            Venta: data[idLote].SelGen,
                            Tipo: "venta",
                            Fecha: Mortalidad.fecha
                        }
                        let count = await produccionTraslado.verifyProduccionMortalidad(jsonData);
                        if (count == true) {
                            let rows = await produccionTraslado.addProduccionTraslado(jsonData);
                            let st = await produccionTraslado.StockAvesMensual(jsonData, rows);
                        }
                    }
                    if (data[idLote].ErSex != 0) {
                        let jsonData = {
                            idProduccionOrigen: Mortalidad.idLevante,
                            LoteOrigen: idLote,
                            Nro_Guia: "ERRSEX",
                            Venta: data[idLote].ErSex,
                            Tipo: "venta",
                            Fecha: Mortalidad.fecha
                        }
                        let count = await produccionTraslado.verifyProduccionMortalidad(jsonData);
                        if (count == true) {
                            let rows = await produccionTraslado.addProduccionTraslado(jsonData);
                            let st = await produccionTraslado.StockAvesMensual(jsonData, rows);
                        }
                    }
                }
            }
        }
    },
    updateVentas: async function (Mortalidad) {
        var data = JSON.parse(Mortalidad.data);
        var semana = {};
        var lotes = [];
        let j = 0;
        for (var idLote in data) {
            j = j + 1;
            if (j != 5) {
                semana[idLote] = {
                    'NoAves': 0,
                    'PorcMortalidad': 0,
                    'NoEliminados': 0,
                    'PorcEliminados': 0,
                    'ErSex': 0,
                    'PorcError': 0,
                    'SelGen': 0,
                    'PorcSel': 0
                };
                lotes.push(idLote);
                if (data[idLote].SelGen == undefined) {
                    data[idLote]['SelGen'] = 0;
                    data[idLote]['PorcSel'] = 0;
                }
                if (typeof data.Observaciones == "undefined") {
                    console.log('info', data[idLote].SelGen, data[idLote].ErSex, idLote);
                    if (data[idLote].SelGen != 0) {
                        let jsonData = {
                            idProduccionOrigen: Mortalidad.idLevante,
                            LoteOrigen: idLote,
                            Nro_Guia: "SELGEN",
                            Venta: data[idLote].SelGen,
                            Tipo: "venta",
                            Fecha: Mortalidad.fecha
                        }
                        let rows = await produccionTraslado.updateVentasfromMortalidad(jsonData);
                        let st = await produccionTraslado.StockAvesMensual(jsonData, rows);
                    }
                    if (data[idLote].ErSex != 0) {
                        let jsonData = {
                            idProduccionOrigen: Mortalidad.idLevante,
                            LoteOrigen: idLote,
                            Nro_Guia: "ERRSEX",
                            Venta: data[idLote].ErSex,
                            Tipo: "venta",
                            Fecha: Mortalidad.fecha
                        }
                        let rows = await produccionTraslado.updateVentasfromMortalidad(jsonData);
                        let st = await produccionTraslado.StockAvesMensual(jsonData, rows);
                    }
                }
            }
        }
    }
};
module.exports = Mortalidad;
