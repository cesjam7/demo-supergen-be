var db = require('../dbconnection');
var produccionTraslado = require('./produccionTraslado');
const { json } = require('express');
const mysql = require("../dbconnectionPromise")
const moment = require('moment');

var produccionMortalidad = {

    verifyMortalidad: async function (params) {
        return await db.query("SELECT * FROM mortalidad_prod_sem WHERE idProduccion = ? and semana_prod = ?", [params.idProduccion, params.Semana]);
    },
    verifyMortalidadEdad: async function (params) {
        return await db.query("SELECT * FROM mortalidad_prod_det WHERE idProduccion = ? and Edad = ?", [params.idProduccion, params.Edad]);
    },
    uniformidadPorIdProduccion: async function (idProduccion) {
        const connection = await mysql.connection();
        const lotes = await connection.query(`select A.semana,A.idLote,B.TipoGenero  as tipoGenero,B.Sexo
from mortalidad_prod_det  A left join lotes B on B.idLote=A.idLote
where A.idProduccion=? and A.Semana  not in (SELECT  md.Semana
        FROM mortalidad_prod_det md
        WHERE md.idLote =A.IdLote  GROUP BY md.Semana  
       HAVING COUNT(DISTINCT(Edad))<7)
order by A.semana`, [idProduccion])
        const lotesHembra = Array.from(new Set(lotes.filter(l => l.tipoGenero == 'LH' && l.Sexo == "H").map(l => l.idLote)))
        const lotesMacho = Array.from(new Set(lotes.filter(l => l.tipoGenero == 'LM' && l.Sexo == "H").map(l => l.idLote)))
        const { semanas: semanasHembra, lotes: lotesUniformidadHembra } = await this.uniformidadPorLotes({ idLotes: lotesHembra })
        const { semanas: semanasMacho, lotes: lotesUniformidadMacho } = await this.uniformidadPorLotes({ idLotes: lotesMacho })
        const dataLm = lotesUniformidadMacho.reduce((prev, curr, index, array) => {
            if (!prev.find(p => p.semana == curr.semana)) {
                const total = array.filter(a => a.semana == curr.semana)
                const totalPorSemana = total.reduce((prev1, curr1) => prev1 += curr1.uniformidad, 0)
                prev.push({ ...curr, uniformidad: totalPorSemana / total.length })
            }
            return prev;
        }, [])
        const dataLh = lotesUniformidadHembra.reduce((prev, curr, index, array) => {
            if (!prev.find(p => p.semana == curr.semana)) {
                const total = array.filter(a => a.semana == curr.semana)
                const totalPorSemana = total.reduce((prev1, curr1) => prev1 += curr1.uniformidad, 0)
                prev.push({ ...curr, uniformidad: totalPorSemana / total.length })
            }
            return prev;
        }, [])
        connection.release();
        return { dataLh, dataLm, semanasLh: semanasHembra, semanasLm: semanasMacho }

    },

    uniformidadPorLotes: async function ({ idLotes = [] }) {
        const connection = await mysql.connection();
        const lotesProcess = []
        const semanas = await connection.query(`select A.semana 
        from mortalidad_prod_det  A 
        where A.idLote in(?) and A.Semana  not in (SELECT  md.Semana
                FROM mortalidad_prod_det md
                WHERE md.idLote =A.IdLote  GROUP BY md.Semana  
               HAVING COUNT(DISTINCT(Edad))<7)
        group by A.semana`, [idLotes])
        const semanasYLotes = await connection.query(`select A.semana,A.idLote 
from mortalidad_prod_det  A 
where A.idLote in(?) and A.Semana  not in (SELECT  md.Semana
        FROM mortalidad_prod_det md
        WHERE md.idLote =A.IdLote  GROUP BY md.Semana  
       HAVING COUNT(DISTINCT(Edad))<7)
group by A.semana,A.idLote
`, [idLotes])
        const pesajesDetalle = await connection.query(`select detalle,semana,idlote from semanas  where semana in(?) and idLote in(?) and LENGTH(idcorral)>5`, [semanas.map(s => s.semana), idLotes])
        for (const idLote of idLotes) {
            const semanas = semanasYLotes.filter(s => s.idLote == idLote).map(s => s.semana)
            for (const semana of semanas) {
                let detalle = pesajesDetalle.filter(s => s.semana == semana && s.idlote == idLote).flatMap(d => JSON.parse(d.detalle ? d.detalle : '[]'))
                const sumaDetalle = detalle.reduce((prev, curr) => prev += curr, 0)
                const contador = detalle.length
                const promedio = sumaDetalle / contador
                const valormas10 = (promedio * 0.1) + promedio;
                const valormenos10 = promedio - (promedio * 0.1);
                const numeroAvesDebajoYMayorPromedio = detalle.filter(p => p <= valormas10 && p >= valormenos10)
                const uniformidad = (numeroAvesDebajoYMayorPromedio.length / detalle.length) * 100
                /*  if (uniformidad == 100) {
                     console.log("pr", promedio, "valorMas10", valormas10, "valorMenos", valormenos10)
 
                 } */
                lotesProcess.push({ id: idLote, uniformidad, semana })
            }
        }
        connection.release();
        return { semanas, lotes: lotesProcess }



    },

    verificarMortalidadesPorEdades: async function ({ levantes = [], producciones = [] }) {

        const connection = await mysql.connection();
        try {
            if (levantes.length > 0) {
                const levantesMortalidad = await connection.query("select idLevante,Edad from mortalidad_det where idLevante in(?) and Edad in(?)", [levantes.map(p => p.idLevante), producciones.map(p => p.edad)]);
                for (const levante of levantes) {
                    levante.existe = levantesMortalidad.find(l => l.idLevante == levante.idLevante && l.Edad == levante.Edad) != null ? "Si" : "No"
                }
            }
            if (producciones.length > 0) {
                const produccionMortalidad = await connection.query("select idProduccion,Edad from mortalidad_prod_det where idProduccion in(?) and Edad in(?)", [producciones.map(p => p.idProduccion), producciones.map(p => p.edad)]);
                for (const produccion of producciones) {
                    produccion.existe = produccionMortalidad.find(l => l.idProduccion == produccion.idProduccion && l.Edad == produccion.Edad) != null ? "Si" : "No"
                }

            }

            return { levantes, producciones }
        } catch (error) {
            console.log("e", error)
            throw error;
        } finally {
            connection.release();

        }
    },
    getLotesProduccion: async function (id) {
        return await db.query(`select * from produccion l
        INNER JOIN lotes lo ON lo.idProduccion = l.idProduccion
        INNER JOIN lineas li ON li.idLinea = lo.idLinea
        INNER JOIN galpones ga ON ga.idGalpon = lo.idGalpon
        WHERE l.idProduccion = ? ORDER BY li.CodLinea DESC`,
            [id]);
    },
    getMortalidadProducciones: function (callback) {
        return db.query("select * from produccion ORDER BY idProduccion DESC", callback);
    },
    getMortalidadSemana: function (id, callback) {
        return db.query("select * from mortalidad_prod_sem WHERE idLote = ? ORDER BY semana_prod ASC", [id], callback);
    },
    getMortalidadByIdLevante: function (id, callback) {
        return db.query("select * from mortalidad_prod_json mp INNER JOIN produccion p ON p.idProduccion = mp.idProduccion where p.idProduccion= ? order by mp.Edad ASC", [id], callback);
    },
    getmortalidadUltimoDia: function (id, callback) {
        return db.query("select * from mortalidad_prod_json mp INNER JOIN produccion p ON p.idProduccion = mp.idProduccion WHERE p.idProduccion = ? ORDER BY mp.Edad DESC LIMIT 0, 1", [id], callback);
    },
    getmortalidadDia: function (idProduccion, Edad, callback) {
        return db.query("select * from mortalidad_prod_json mp INNER JOIN produccion p ON p.idProduccion = mp.idProduccion WHERE p.idProduccion = ? AND mp.Edad = ?", [idProduccion, Edad], callback);
    },
    getmortalidadSemana: async function (Mortalidad) {
        let idProduccion = Mortalidad.idlevante
        let Semana = Mortalidad.semana
        let Fecha = Mortalidad.fecha
        let rows = await db.query(`SELECT * FROM mortalidad_prod_sem mp INNER JOIN produccion p ON p.idProduccion = mp.idProduccion WHERE p.idProduccion = ? AND mp.semana_prod = ?`,
            [idProduccion, Semana]);
        for (let i = 0; i < rows.length; i++) {
            const e = rows[i];
            let ventas = await db.query(`SELECT * FROM traslado_ingreso_ventas 
            WHERE idLoteOrigen = ? and fecha = ?`, [e.idLote, Fecha])
            e.Vendidos = 0
            e.Nro_Guia = '-'
            if (ventas.length != 0) {
                if (ventas[0].Venta == null) {
                    e.Vendidos = 0
                    e.Nro_Guia = '-'
                } else {
                    e.Vendidos = ventas[0].Venta
                    e.Nro_Guia = ventas[0].Nro_Guia
                }
            }
        }
        return rows;
    },
    validarNroAvesMacho_Refer: async function (Mortalidad) {
        var data = JSON.parse(Mortalidad.data);
        let array = [];
        if ((Mortalidad.Edad % 7) == 0) {
            for (var idLote in data) {
                if (idLote != 'Observaciones') {
                    let NAM = data[idLote].Machos_Refer;
                    let count = await db.query("SELECT NroAvesMacho_Refer FROM mortalidad_prod_sem WHERE idProduccion = ? and idLote = ? and semana_prod = ?", [Mortalidad.idProduccion, idLote, Mortalidad.semana]);
                    let dato = count[0].NroAvesMacho_Refer;
                    if (dato == 0 || dato == null) {
                        if (NAM == 0 || NAM == null) {
                            array.push(idLote);
                        }
                    }
                }
            }
            return array;
        } else {
            return array;
        }
    },
    addMortalidadModal: async function (Mortalidad) {
        // console.log('Mortalidad', Mortalidad);
        await db.query("INSERT INTO mortalidad_prod_json (idProduccion, Edad, semana, semana_prod, data) values(?,?,?,?,?)", [Mortalidad.idProduccion, Mortalidad.Edad, (parseInt(Mortalidad.semana) + 24), Mortalidad.semana, Mortalidad.data]);
        var data = JSON.parse(Mortalidad.data);
        console.log('DATA', data)
        var semana = {};
        var lotes = [];
        let j = 0;
        for (var idLote in data) {
            if (idLote != 'Observaciones') {
                j = j + 1;
                if (j != 5) {
                    semana[idLote] = {
                        'NoAves': 0,
                        'PorcMortalidad': 0,
                        'NoEliminados': 0,
                        'PorcEliminados': 0
                    };
                    lotes.push(idLote);
                    if (typeof data.Observaciones != "undefined") {
                        await db.query("INSERT INTO mortalidad_prod_det (idProduccion, idLote, Edad, semana, semana_prod, fecha, NoAves, PorcMortalidad, NoEliminados, PorcEliminados, observaciones) values(?,?,?,?,?,?,?,?,?,?,?)",
                            [Mortalidad.idProduccion, idLote, Mortalidad.Edad, (parseInt(Mortalidad.semana) + 24), Mortalidad.semana, moment(Mortalidad.fecha).format("YYYY-MM-DD"), data[idLote].NoAves, data[idLote].PorcMortalidad, data[idLote].NoEliminados, data[idLote].PorcEliminados, data.Observaciones]);
                    } else {
                        await db.query("INSERT INTO mortalidad_prod_det (idProduccion, idLote, Edad, semana, semana_prod, fecha, NoAves, PorcMortalidad, NoEliminados, PorcEliminados) values(?,?,?,?,?,?,?,?,?,?)",
                            [Mortalidad.idProduccion, idLote, Mortalidad.Edad, (parseInt(Mortalidad.semana) + 24), Mortalidad.semana, moment(Mortalidad.fecha).format("YYYY-MM-DD"), data[idLote].NoAves, data[idLote].PorcMortalidad, data[idLote].NoEliminados, data[idLote].PorcEliminados]);
                    }
                }
            }
        }
        let num_semana = Math.ceil(Mortalidad.Edad / 7);
        let rango_menor = (num_semana * 7) - 6;
        var between = rango_menor + ' AND ' + (num_semana * 7);

        let count1 = await db.query("SELECT * FROM mortalidad_prod_det WHERE idProduccion = " + Mortalidad.idProduccion + " AND Edad BETWEEN " + between + " ORDER BY Edad, idLote");
        console.log('semana', semana)
        console.log('count1.length', count1.length)
        for (var i = 0; i < count1.length; i++) {
            console.log("count1[i]['idLote']", count1[i]['idLote'])
            if (semana[count1[i]['idLote']]['NoAves'] != undefined) {
                semana[count1[i]['idLote']]['NoAves'] = semana[count1[i]['idLote']]['NoAves'] + count1[i]['NoAves'];
                semana[count1[i]['idLote']]['PorcMortalidad'] = semana[count1[i]['idLote']]['NoAves'] / Mortalidad.Num_Aves_Fin_Levante[count1[i]['idLote']] * 100;
            }
            if (semana[count1[i]['idLote']]['NoEliminados'] != undefined) {
                semana[count1[i]['idLote']]['NoEliminados'] = semana[count1[i]['idLote']]['NoEliminados'] + count1[i]['NoEliminados'];
                semana[count1[i]['idLote']]['PorcEliminados'] = semana[count1[i]['idLote']]['NoEliminados'] / Mortalidad.Num_Aves_Fin_Levante[count1[i]['idLote']] * 100;
            }
        }

        let count = await db.query("SELECT idMortalidadSem FROM mortalidad_prod_sem WHERE idProduccion = " + Mortalidad.idProduccion + " AND semana_prod = " + num_semana + " ORDER BY idLote");
        if (count.length == 0) {
            for (var i = 0; i < lotes.length; i++) {
                if (num_semana == 1) {
                    let _lotes = parseInt(lotes[i]);
                    let _saldo_fin_sem = Mortalidad.Num_Aves_Fin_Levante[_lotes] - data[lotes[i]].NoAves - data[lotes[i]].NoEliminados;
                    let mortalidad_tot = data[lotes[i]].NoAves + data[lotes[i]].NoEliminados
                    let PorcMortalidadTot = ((mortalidad_tot / Mortalidad.Num_Aves_Fin_Levante[_lotes]) * 100);
                    console.log("Mortalidad.Num_Aves_Fin_Levante[_lotes]", Mortalidad.Num_Aves_Fin_Levante[_lotes])
                    console.log("data[lotes[i]].NoAves", data[lotes[i]].NoAves)
                    console.log("data[lotes[i]].NoEliminados", data[lotes[i]].NoEliminados)
                    console.log("_saldo_fin_sem", _saldo_fin_sem)
                    console.log("mortalidad_tot", mortalidad_tot)
                    console.log("PorcMortalidadTot", PorcMortalidadTot);
                    console.log("data[lotes[i]]", data[lotes[i]])

                    // console.log('SQL DE SEMANA', "INSERT INTO mortalidad_prod_sem (idLote, idLinea, Semana, NoAves, PorcMortalidad, PorcAcumMortalidad, NoEliminados, PorcEliminados,	PorcAcumEliminados, idProduccion, saldo_fin_sem, MortalidadTot,PorcMortalidadTot) values("+lotes[i]+", "+2000 +", "+num_semana+", "+data[lotes[i]].NoAves+", "+data[lotes[i]].PorcMortalidad.toFixed(2)+", "+data[lotes[i]].PorcMortalidad.toFixed(2)+", "+data[lotes[i]].NoEliminados+", "+data[lotes[i]].PorcEliminados.toFixed(2)+", "+data[lotes[i]].PorcEliminados.toFixed(2)+", "+Mortalidad.idProduccion+", "+_saldo_fin_sem+", "+mortalidad_tot+", "+PorcMortalidadTot.toFixed(2)+")")

                    await db.query("INSERT INTO mortalidad_prod_sem (idLote, idLinea, Semana, semana_prod, NoAves, PorcMortalidad, PorcAcumMortalidad, NoEliminados, NoEliminados_Acum, PorcEliminados, PorcAcumEliminados, idProduccion, saldo_fin_sem,MortalidadTot,PorcMortalidadTot, PorcMortalidadTot_Acum) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                        [lotes[i], 2000, (parseInt(num_semana) + 24), num_semana, data[lotes[i]].NoAves, data[lotes[i]].PorcMortalidad.toFixed(2), data[lotes[i]].PorcMortalidad.toFixed(2), data[lotes[i]].NoEliminados, data[lotes[i]].NoEliminados, data[lotes[i]].PorcEliminados.toFixed(2), data[lotes[i]].PorcEliminados.toFixed(2), Mortalidad.idProduccion, _saldo_fin_sem, mortalidad_tot, PorcMortalidadTot.toFixed(2), PorcMortalidadTot.toFixed(2)]);
                } else {
                    let PorcAcumMortalidad_ant = 0;
                    let PorcAcumEliminados_ant = 0;
                    let NoEliminados_ant = 0;
                    let PorcMortalidadTot_ant = 0;
                    let _lotes = parseInt(lotes[i]);
                    let _NoAves = data[lotes[i]].NoAves;
                    let _NoEliminados = data[lotes[i]].NoEliminados;
                    let _PorcMortalidad = data[lotes[i]].PorcMortalidad;
                    let _PorcEliminados = data[lotes[i]].PorcEliminados;
                    let _saldo_fin_sem = 0;
                    let mortalidad_tot = data[lotes[i]].NoAves + data[lotes[i]].NoEliminados
                    let PorcMortalidadTot = ((mortalidad_tot / Mortalidad.Num_Aves_Fin_Levante[_lotes]) * 100);
                    console.log("Mortalidad.Num_Aves_Fin_Levante[_lotes]", Mortalidad.Num_Aves_Fin_Levante[_lotes])
                    console.log("mortalidad_tot", mortalidad_tot)
                    console.log("PorcMortalidadTot", PorcMortalidadTot);

                    let rpta = await db.query("SELECT * FROM mortalidad_prod_sem WHERE idProduccion = " + Mortalidad.idProduccion + " AND semana_prod = " + (num_semana - 1) + " and idLote = " + lotes[i]);

                    PorcAcumMortalidad_ant = rpta[0].PorcAcumMortalidad;
                    PorcAcumEliminados_ant = rpta[0].PorcAcumEliminados;
                    NoEliminados_ant = rpta[0].NoEliminados;
                    PorcMortalidadTot_ant = rpta[0].PorcMortalidadTot;
                    _saldo_fin_sem = rpta[0].saldo_fin_sem - _NoAves - _NoEliminados
                    await db.query("INSERT INTO mortalidad_prod_sem (idLote, idLinea, Semana, semana_prod, NoAves, PorcMortalidad, PorcAcumMortalidad, NoEliminados, NoEliminados_Acum, PorcEliminados,	PorcAcumEliminados, idProduccion, saldo_fin_sem,MortalidadTot,PorcMortalidadTot, PorcMortalidadTot_Acum) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                        [_lotes, 0, (parseInt(num_semana) + 24), num_semana, _NoAves, _PorcMortalidad.toFixed(2), (PorcAcumMortalidad_ant + _PorcMortalidad).toFixed(2), _NoEliminados, (_NoEliminados + NoEliminados_ant), _PorcEliminados.toFixed(2), (PorcAcumEliminados_ant + _PorcEliminados).toFixed(2), Mortalidad.idProduccion, _saldo_fin_sem, mortalidad_tot, PorcMortalidadTot.toFixed(2), (PorcMortalidadTot_ant + PorcMortalidadTot).toFixed(2)]);
                }
            }
        } else {
            for (var i = 0; i < lotes.length; i++) {
                console.log('ACTUALIZANDO SEMANA INSERTADA DE ' + lotes[i]);
                let lotes_var = parseInt(lotes[i]);
                let resp = await db.query("SELECT * FROM mortalidad_prod_sem WHERE idProduccion = " + Mortalidad.idProduccion + "  and semana_prod = " + num_semana + " and idLote= " + lotes_var);
                // console.log("resp", resp[0])
                let d = resp[0];
                let var_NoAves = data[lotes_var].NoAves + parseInt(d.NoAves);
                let var_NoEliminados = data[lotes_var].NoEliminados + parseInt(d.NoEliminados);
                let var_PorcMortalidad = ((var_NoAves / Mortalidad.Num_Aves_Fin_Levante[lotes_var]) * 100).toFixed(2);
                let var_PorcEliminados = ((var_NoEliminados / Mortalidad.Num_Aves_Fin_Levante[lotes_var]) * 100).toFixed(2);
                let _saldo_fin_sem = 0;
                if (num_semana == 1) {
                    _saldo_fin_sem = Mortalidad.Num_Aves_Fin_Levante[lotes_var] - var_NoAves - var_NoEliminados;
                    let mortalidad_tot = var_NoAves + var_NoEliminados
                    let PorcMortalidadTot = ((mortalidad_tot / _saldo_fin_sem) * 100);
                    console.log("Mortalidad.Num_Aves_Fin_Levante[lotes_var]", Mortalidad.Num_Aves_Fin_Levante[lotes_var])
                    console.log("mortalidad_tot", mortalidad_tot)
                    console.log("PorcMortalidadTot", PorcMortalidadTot);
                    await db.query("UPDATE mortalidad_prod_sem SET NoAves = ?, PorcMortalidad = ?, PorcAcumMortalidad = ?, NoEliminados = ?, NoEliminados_Acum = ?, PorcEliminados = ?, PorcAcumEliminados = ?, saldo_fin_sem = ?, PorcMortalidadTot = ?, MortalidadTot= ?, PorcMortalidadTot_Acum = ? WHERE idProduccion = ? AND semana_prod = ? AND idLote = ?",
                        [var_NoAves, var_PorcMortalidad, var_PorcMortalidad, var_NoEliminados, var_NoEliminados, var_PorcEliminados, var_PorcEliminados, _saldo_fin_sem, PorcMortalidadTot.toFixed(2), mortalidad_tot, PorcMortalidadTot.toFixed(2), Mortalidad.idProduccion, num_semana, lotes_var]);
                } else {
                    let rpta = await db.query("SELECT * FROM mortalidad_prod_sem WHERE idProduccion = " + Mortalidad.idProduccion + " AND semana_prod = " + (num_semana - 1) + " and idLote = " + lotes_var);
                    // console.log("rpta",rpta);
                    PorcAcumMortalidad_ant = parseFloat(rpta[0].PorcAcumMortalidad) + parseFloat(var_PorcMortalidad);
                    PorcAcumEliminados_ant = parseFloat(rpta[0].PorcAcumEliminados) + parseFloat(var_PorcEliminados);
                    _saldo_fin_sem = parseInt(rpta[0].saldo_fin_sem) - parseInt(var_NoAves) - parseInt(var_NoEliminados)
                    let mortalidad_tot = parseInt(var_NoAves) + parseInt(var_NoEliminados)
                    let PorcMortalidadTot = 0;
                    let NoEliminados_ant = 0;
                    let PorcMortalidadTot_Acum = 0;
                    if (num_semana == 1) {
                        PorcMortalidadTot = ((mortalidad_tot / _saldo_fin_sem) * 100);
                        NoEliminados_ant = parseInt(var_NoEliminados);
                        PorcMortalidadTot_Acum = parseFloat(PorcMortalidadTot)
                    } else {
                        if (_saldo_fin_sem != 0) {
                            PorcMortalidadTot = ((mortalidad_tot / _saldo_fin_sem) * 100) + rpta[0].PorcMortalidadTot;
                        } else {
                            PorcMortalidadTot = 0 + rpta[0].PorcMortalidadTot;
                        }
                        NoEliminados_ant = parseInt(rpta[0].NoEliminados) + parseInt(var_NoEliminados);
                        PorcMortalidadTot_Acum = parseFloat(PorcMortalidadTot) + parseFloat(rpta[0].PorcMortalidadTot_Acum)
                    }
                    await db.query("UPDATE mortalidad_prod_sem SET NoAves = ?, PorcMortalidad = ?, PorcAcumMortalidad = ?, NoEliminados = ?, NoEliminados_Acum = ?, PorcEliminados = ?, PorcAcumEliminados = ?, saldo_fin_sem = ?, PorcMortalidadTot = ?, MortalidadTot= ?, PorcMortalidadTot_Acum = ? WHERE idProduccion = ? AND semana_prod = ? AND idLote = ?",
                        [var_NoAves, var_PorcMortalidad, (PorcAcumMortalidad_ant).toFixed(2), var_NoEliminados, NoEliminados_ant, var_PorcEliminados, (PorcAcumEliminados_ant).toFixed(2), _saldo_fin_sem, PorcMortalidadTot.toFixed(2), mortalidad_tot, PorcMortalidadTot_Acum.toFixed(2), Mortalidad.idProduccion, num_semana, lotes_var]);
                }
            }
        }
        return;
    },
    addMortalidadModal2: async function (Mortalidad, rr) {
        console.log('rr :', rr);
        var data = JSON.parse(Mortalidad.data);

        let lotes = await db.query("SELECT * FROM lotes WHERE idProduccion = ? ORDER BY Sexo DESC", [Mortalidad.idProduccion]);
        let LM = [];
        let LH = [];
        for (let i = 0; i < lotes.length; i++) {
            const element = lotes[i];
            console.log("element", element);
            if (element.TipoGenero == 'LM') {
                LM.push(element);
            } else {
                LH.push(element);
            }
        }
        const element = LM[0];
        const element2 = LM[1];
        const element1 = LH[0];
        const element3 = LH[1];
        let machos = Mortalidad.Num_Aves_Fin_Levante[element.idLote];
        let machos1 = Mortalidad.Num_Aves_Fin_Levante[element1.idLote];
        if (Mortalidad.semana == 1) {
            let saldo = Mortalidad.Num_Aves_Fin_Levante[element2.idLote];
            let PorcApareo = ((machos / saldo) * 100).toFixed(2);
            await db.query("UPDATE mortalidad_prod_sem SET PorcApareo = ? WHERE idLote = ? and semana_prod = ? and idProduccion = ?",
                [PorcApareo, element.idLote, Mortalidad.semana, Mortalidad.idProduccion]);

            let saldo1 = Mortalidad.Num_Aves_Fin_Levante[element3.idLote];
            let PorcApareo1 = ((machos1 / saldo1) * 100).toFixed(2);
            await db.query("UPDATE mortalidad_prod_sem SET PorcApareo = ? WHERE idLote = ? and semana_prod = ? and idProduccion = ?",
                [PorcApareo1, element1.idLote, Mortalidad.semana, Mortalidad.idProduccion]);
        } else {
            let count = await db.query("SELECT saldo_fin_sem FROM mortalidad_prod_sem WHERE idLote = ? and semana_prod = ? and idProduccion = ?", [element2.idLote, Mortalidad.semana, Mortalidad.idProduccion])
            if (count.length != 0) {
                let saldo = count[0].saldo_fin_sem;
                let PorcApareo = 0.00
                if (saldo != 0) {
                    PorcApareo = ((machos / saldo) * 100).toFixed(2);
                }
                await db.query("UPDATE mortalidad_prod_sem SET PorcApareo = ? WHERE idLote = ? and semana_prod = ? and idProduccion = ?",
                    [PorcApareo, element.idLote, Mortalidad.semana, Mortalidad.idProduccion]);
            }

            let count2 = await db.query("SELECT saldo_fin_sem FROM mortalidad_prod_sem WHERE idLote = ? and semana_prod = ? and idProduccion = ?", [element3.idLote, Mortalidad.semana, Mortalidad.idProduccion])
            if (count2.length != 0) {
                let saldo1 = count2[0].saldo_fin_sem;
                let PorcApareo1 = 0.00
                if (saldo1 != 0) {
                    PorcApareo1 = ((machos1 / saldo1) * 100).toFixed(2);
                }
                await db.query("UPDATE mortalidad_prod_sem SET PorcApareo = ? WHERE idLote = ? and semana_prod = ? and idProduccion = ?", [machos1, PorcApareo1, element1.idLote, Mortalidad.semana, Mortalidad.idProduccion]);
            }
        }
        await db.query("CALL actualizarPorcApareo(?, ?, ?)", [element.idLote, element2.idLote, Mortalidad.idProduccion]);
        await db.query("CALL actualizarPorcApareo(?, ?, ?)", [element1.idLote, element3.idLote, Mortalidad.idProduccion]);
        return;
    },
    StockMensualAves: async function (Mortalidad) {
        console.log("TIENE QUE APARECER AL FINAL")
        let data = JSON.parse(Mortalidad.data)
        console.log('data :', data);
        let fecha = Mortalidad.fecha.split('-');
        let m = fecha[1];
        let y = fecha[0];
        for (var idLote in data) {
            if (idLote != 'Observaciones') {
                console.log('idLote :', idLote);
                let rows = await db.query("SELECT * FROM stock_aves_mensual WHERE Month = ? and Year = ? and idLote = ?",
                    [m, y, idLote])
                if (rows.length == 0) {
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
                    if (rows_ant.length == 0) {
                        return {
                            success: false,
                            message: 'Por favor verificar el registro de mortalidad del mes anterior.'
                        }
                    } else {
                        let NroAvesFinal = rows_ant[0].NroAvesFinal
                        await db.query("INSERT INTO stock_aves_mensual (Periodo, Month, Year, idLote, NroAvesIniciadas, Mortalidad, Descarte, FinCampania, Ingreso, NroAvesFinal) VALUES (?,?,?,?,?,?,?,?,?,?)",
                            [y + '' + m, m, y, idLote, NroAvesFinal, 0, 0, 0, 0, NroAvesFinal]);
                        await db.query("CALL actualizarStockAves_prod(?, ?, ?)",
                            [m, y, idLote]);
                    }
                } else {
                    let fila = await db.query("CALL actualizarStockAves_prod(?, ?, ?)",
                        [m, y, idLote]);
                }
            }
        }
        return {
            success: true
        }
    },
    updateMortalidad: async function (id, Mortalidad) {
        await db.query("UPDATE mortalidad_prod_json set data = ? WHERE idMortalidad=?", [Mortalidad.data, id]);
        var data = JSON.parse(Mortalidad.data);
        var semana = {};
        var lotes = [];
        for (var idLote in data) {
            if (idLote != 'Observaciones') {
                semana[idLote] = {
                    'NoAves': 0,
                    'PorcMortalidad': 0,
                    'NoEliminados': 0,
                    'PorcEliminados': 0
                };
                lotes.push(idLote);
                await db.query("UPDATE mortalidad_prod_det SET NoAves = ?, PorcMortalidad = ?, NoEliminados = ?, PorcEliminados = ?, observaciones = ? WHERE idProduccion = ? AND Edad = ? AND idLote = ?",
                    [data[idLote].NoAves, data[idLote].PorcMortalidad, data[idLote].NoEliminados, data[idLote].PorcEliminados, data.Observaciones, Mortalidad.idProduccion, Mortalidad.Edad, idLote]);
            }
        }
        let num_semana = Math.ceil(Mortalidad.Edad / 7);
        let rango_menor = (num_semana * 7) - 6;
        var between = rango_menor + ' AND ' + (num_semana * 7);

        let count2 = await db.query("SELECT * FROM mortalidad_prod_det WHERE idProduccion = " + Mortalidad.idProduccion + " AND Edad BETWEEN " + between + " ORDER BY Edad, idLote");
        for (var i = 0; i < count2.length; i++) {
            if (semana[count2[i]['idLote']]['NoAves'] != undefined) {
                semana[count2[i]['idLote']]['NoAves'] = semana[count2[i]['idLote']]['NoAves'] + count2[i]['NoAves'];
                semana[count2[i]['idLote']]['PorcMortalidad'] = semana[count2[i]['idLote']]['NoAves'] / Mortalidad.Num_Aves_Fin_Levante[count2[i]['idLote']] * 100;
            }
            if (semana[count2[i]['idLote']]['NoEliminados'] != undefined) {
                semana[count2[i]['idLote']]['NoEliminados'] = semana[count2[i]['idLote']]['NoEliminados'] + count2[i]['NoEliminados'];
                semana[count2[i]['idLote']]['PorcEliminados'] = semana[count2[i]['idLote']]['NoEliminados'] / Mortalidad.Num_Aves_Fin_Levante[count2[i]['idLote']] * 100;
            }
        }
        console.log('dias encontrados ' + count2.length, semana);

        let count = await db.query("SELECT idMortalidadSem FROM mortalidad_prod_sem WHERE idProduccion = " + Mortalidad.idProduccion + " AND semana_prod = " + num_semana + " ORDER BY idLote");
        if (count.length == 0) {
            for (var i = 0; i < lotes.length; i++) {
                await db.query("INSERT INTO mortalidad_prod_sem (idLote, idLinea, Semana, semana_prod, NoAves, PorcMortalidad, NoEliminados, PorcEliminados, idProduccion) values(?,?,?,?,?,?,?,?,?)",
                    [lotes[i], 0, (parseInt(num_semana) + 24), num_semana, semana[lotes[i]].NoAves, semana[lotes[i]].PorcMortalidad.toFixed(2), semana[lotes[i]].NoEliminados, semana[lotes[i]].PorcEliminados.toFixed(2), Mortalidad.idProduccion]);
            }
        } else {
            for (var i = 0; i < lotes.length; i++) {
                console.log('ACTUALIZANDO SEMANA DE ' + lotes[i]);
                await db.query("UPDATE mortalidad_prod_sem SET NoAves = ?, PorcMortalidad = ?, NoEliminados = ?, PorcEliminados = ? WHERE idProduccion = ? AND semana_prod = ? AND idLote = ?",
                    [semana[lotes[i]].NoAves, semana[lotes[i]].PorcMortalidad.toFixed(2), semana[lotes[i]].NoEliminados, semana[lotes[i]].PorcEliminados.toFixed(2), Mortalidad.idProduccion, num_semana, lotes[i]]);
            }
        }

        for (var i = 0; i < lotes.length; i++) {
            console.log('ACTUALIZANDO SEMANA INSERTADA UPDATE DE ' + lotes[i]);
            let lotes_var = parseInt(lotes[i]);
            let resp = await db.query("SELECT * FROM mortalidad_prod_sem WHERE idProduccion = " + Mortalidad.idProduccion + "  and semana_prod = " + num_semana + " and idLote= " + lotes_var);
            // console.log("resp", resp[0])
            let d = resp[0];
            let var_NoAves = data[lotes_var].NoAves + parseInt(d.NoAves);
            let var_NoEliminados = data[lotes_var].NoEliminados + parseInt(d.NoEliminados);
            let var_PorcMortalidad = ((var_NoAves / Mortalidad.Num_Aves_Fin_Levante[lotes_var]) * 100).toFixed(2);
            let var_PorcEliminados = ((var_NoEliminados / Mortalidad.Num_Aves_Fin_Levante[lotes_var]) * 100).toFixed(2);
            let _saldo_fin_sem = 0;
            if (num_semana == 1) {
                _saldo_fin_sem = Mortalidad.Num_Aves_Fin_Levante[lotes_var] - var_NoAves - var_NoEliminados;
                let mortalidad_tot = var_NoAves + var_NoEliminados
                let PorcMortalidadTot = ((mortalidad_tot / _saldo_fin_sem) * 100);
                console.log("Mortalidad.Num_Aves_Fin_Levante[lotes_var]", Mortalidad.Num_Aves_Fin_Levante[lotes_var])
                console.log("mortalidad_tot", mortalidad_tot)
                console.log("PorcMortalidadTot", PorcMortalidadTot);
                await db.query("UPDATE mortalidad_prod_sem SET NoAves = ?, PorcMortalidad = ?, PorcAcumMortalidad = ?, NoEliminados = ?, NoEliminados_Acum = ?, PorcEliminados = ?, PorcAcumEliminados = ?, saldo_fin_sem = ?, PorcMortalidadTot = ?, MortalidadTot= ?, PorcMortalidadTot_Acum = ? WHERE idProduccion = ? AND semana_prod = ? AND idLote = ?",
                    [var_NoAves, var_PorcMortalidad, var_PorcMortalidad, var_NoEliminados, var_NoEliminados, var_PorcEliminados, var_PorcEliminados, _saldo_fin_sem, PorcMortalidadTot.toFixed(2), mortalidad_tot, PorcMortalidadTot.toFixed(2), Mortalidad.idProduccion, num_semana, lotes_var]);
            } else {
                let rpta = await db.query("SELECT * FROM mortalidad_prod_sem WHERE idProduccion = " + Mortalidad.idProduccion + " AND semana_prod = " + (num_semana - 1) + " and idLote = " + lotes_var);
                console.log("rpta[0]", rpta[0]);
                PorcAcumMortalidad_ant = parseFloat(rpta[0].PorcAcumMortalidad) + parseFloat(var_PorcMortalidad);
                PorcAcumEliminados_ant = parseFloat(rpta[0].PorcAcumEliminados) + parseFloat(var_PorcEliminados);
                _saldo_fin_sem = parseInt(rpta[0].saldo_fin_sem) - parseInt(var_NoAves) - parseInt(var_NoEliminados)
                let mortalidad_tot = parseInt(var_NoAves) + parseInt(var_NoEliminados)
                let PorcMortalidadTot = 0;
                let NoEliminados_ant = 0;
                let PorcMortalidadTot_Acum = 0;
                if (num_semana == 1) {
                    PorcMortalidadTot = ((mortalidad_tot / _saldo_fin_sem) * 100);
                    NoEliminados_ant = parseInt(var_NoEliminados);
                    PorcMortalidadTot_Acum = parseFloat(PorcMortalidadTot)
                } else {
                    if (_saldo_fin_sem != 0) {
                        PorcMortalidadTot = ((mortalidad_tot / _saldo_fin_sem) * 100) + rpta[0].PorcMortalidadTot;
                    } else {
                        PorcMortalidadTot = 0 + rpta[0].PorcMortalidadTot;
                    }
                    NoEliminados_ant = parseInt(rpta[0].NoEliminados) + parseInt(var_NoEliminados);
                    PorcMortalidadTot_Acum = parseFloat(PorcMortalidadTot) + parseFloat(rpta[0].PorcMortalidadTot_Acum)
                }
                await db.query("UPDATE mortalidad_prod_sem SET NoAves = ?, PorcMortalidad = ?, PorcAcumMortalidad = ?, NoEliminados = ?, NoEliminados_Acum = ?, PorcEliminados = ?, PorcAcumEliminados = ?, saldo_fin_sem = ?, PorcMortalidadTot = ?, MortalidadTot= ?, PorcMortalidadTot_Acum = ? WHERE idProduccion = ? AND semana_prod = ? AND idLote = ?",
                    [var_NoAves, var_PorcMortalidad, (PorcAcumMortalidad_ant).toFixed(2), var_NoEliminados, NoEliminados_ant, var_PorcEliminados, (PorcAcumEliminados_ant).toFixed(2), _saldo_fin_sem, PorcMortalidadTot.toFixed(2), mortalidad_tot, PorcMortalidadTot_Acum, Mortalidad.idProduccion, num_semana, lotes_var]);
            }
        }
        return;
    },
    updateValores: async function (Mortalidad) {
        console.log('Mortalidad valores', Mortalidad);
        let count = await db.query("SELECT * FROM mortalidad_prod_sem WHERE idProduccion = " + Mortalidad.idProduccion + " and semana_prod = " + Mortalidad.semana + " ORDER BY semana_prod, idLote ASC");
        for (var i = 0; i < count.length; i++) {
            let count1 = count[i]
            let res = await db.query("SELECT SUM(NoAves) as NoAves, SUM(NoEliminados) as NoEliminados, semana_prod, idLote FROM mortalidad_prod_det WHERE idLote = ? AND semana_prod = ?", [count1['idLote'], count1['semana_prod']])
            console.log('actualizando semana valores ' + count1['semana_prod'] + ' del lote ' + count1['idLote'], count1)
            let Num_Aves_Fin_Levante = Mortalidad.Num_Aves_Fin_Levante[count1['idLote']];
            console.log(Num_Aves_Fin_Levante);
            let info = res[0];
            let NoAves_i = info.NoAves;
            let PorcMortalidad_i = (NoAves_i / Num_Aves_Fin_Levante) * 100;
            let NoEliminados_i = info.NoEliminados;
            let PorcEliminados_i = (NoEliminados_i / Num_Aves_Fin_Levante) * 100;
            let Semana_i = info.semana_prod;
            let idLote_i = info.idLote;
            let MortalidadTot = NoAves_i + NoEliminados_i;
            let total_aves_sem = count1["saldo_fin_sem"] + count1["MortalidadTot"]
            let saldo_fin_sem = total_aves_sem - MortalidadTot;
            let PorcMortalidadTot = 0.00
            if (total_aves_sem != 0) {
                PorcMortalidadTot = (MortalidadTot / total_aves_sem) * 100;
            }
            let rep2 = await db.query("UPDATE mortalidad_prod_sem set NoAves=?, PorcMortalidad= ?, NoEliminados=?, PorcEliminados=?, MortalidadTot=?, PorcMortalidadTot=?, saldo_fin_sem=? WHERE idLote = ? AND semana_prod = ?",
                [NoAves_i, PorcMortalidad_i.toFixed(2), NoEliminados_i, PorcEliminados_i.toFixed(2), MortalidadTot, PorcMortalidadTot.toFixed(2), saldo_fin_sem, idLote_i, Semana_i]);
            console.log("rep2", rep2);
        }
        return;
    },
    updateAcumulado: async function (Mortalidad) {
        console.log('Mortalidad Acumulado', Mortalidad);
        let count = await db.query("SELECT * FROM mortalidad_prod_sem WHERE idProduccion = " + Mortalidad.idProduccion + " ORDER BY semana_prod, idLote ASC");
        var acum_PorcMortalidad = {};
        var acum_PorcEliminados = {};
        var acum_PorcMortalidadTot = {};
        var acum_NoEliminados = {};
        console.log("count - quieres ", count)
        for (var i = 0; i < count.length; i++) {
            console.log('actualizando semana ' + count[i]['semana_prod'] + ' del lote ' + count[i]['idLote'], count[i])
            if (count[i]['semana_prod'] == 1) {
                let rep = await db.query("UPDATE mortalidad_prod_sem set NoEliminados_Acum = ?, PorcAcumMortalidad = ?, PorcAcumEliminados = ?, PorcMortalidadTot_Acum = ? WHERE idLote = ? AND semana_prod = ?",
                    [count[i]['NoEliminados'], (count[i]['PorcMortalidad']).toFixed(2), (count[i]['PorcEliminados']).toFixed(2), (count[i]['PorcMortalidadTot']).toFixed(2), count[i]['idLote'], 1]);

                console.log("rep", rep);
                acum_PorcMortalidad[count[i]['idLote']] = count[i]['PorcMortalidad'];
                acum_PorcEliminados[count[i]['idLote']] = count[i]['PorcEliminados'];
                acum_PorcMortalidadTot[count[i]['idLote']] = count[i]['PorcMortalidadTot'];
                acum_NoEliminados[count[i]['idLote']] = count[i]['NoEliminados'];
            } else {
                acum_PorcMortalidad[count[i]['idLote']] = acum_PorcMortalidad[count[i]['idLote']] + count[i]['PorcMortalidad'];
                acum_PorcEliminados[count[i]['idLote']] = acum_PorcEliminados[count[i]['idLote']] + count[i]['PorcEliminados'];
                acum_PorcMortalidadTot[count[i]['idLote']] = acum_PorcMortalidadTot[count[i]['idLote']] + count[i]['PorcMortalidadTot'];
                acum_NoEliminados[count[i]['idLote']] = acum_NoEliminados[count[i]['idLote']] + count[i]['NoEliminados'];
                await db.query("UPDATE mortalidad_prod_sem set NoEliminados_Acum = ?, PorcAcumMortalidad = ?, PorcAcumEliminados = ?, PorcMortalidadTot_Acum = ? WHERE idLote = ? AND semana_prod = ?",
                    [acum_NoEliminados[count[i]['idLote']], (acum_PorcMortalidad[count[i]['idLote']]).toFixed(2), (acum_PorcEliminados[count[i]['idLote']]).toFixed(2), (acum_PorcMortalidadTot[count[i]['idLote']]).toFixed(2), count[i]['idLote'], count[i]['semana_prod']]);
            }
        }
        return;
    },
    updateAcumulado2: async function (Mortalidad) {
        let data = JSON.parse(Mortalidad.data);

        for (var idLote in data) {
            if (idLote != 'Observaciones') {
                let cl = await db.query("CALL getActualizarSaldoMortalidadSemProd(?, ?, ?, ?)",
                    [Mortalidad.idProduccion, idLote, Mortalidad.semana, moment(Mortalidad.fecha).format("YYYY-MM-DD")]);
            }
        }
        return;
    },
    disparadorAlimentos: async function (Mortalidad) {
        var data3 = JSON.parse(Mortalidad.data);

        for (var idLote3 in data3) {
            if (idLote3 != 'Observaciones') {
                let rows = await db.query("CALL getActualizarAlimentoProduccion(?, ?)", [Mortalidad.idProduccion, idLote3]);
                console.log('rows :>> ', rows);
            }
        }
        return;
    },
    getAllAcumlotes: async function (id) {
        let rows = await db.query(`SELECT pspd.*,li.* 
        FROM mortalidad_prod_sem pspd 
        INNER JOIN  lotes lo on pspd.IdLote = lo.idLote 
        INNER JOIN lineas li on lo.idLinea = li.idLinea 
        WHERE pspd.idProduccion = ? 
        ORDER BY Semana`, [id]);
        if (rows.length > 0) {
            let ultimo = rows[rows.length - 1];
            let cantidad_days = await db.query(`SELECT COUNT(*) as cant_days
            FROM mortalidad_prod_det mpd
            WHERE mpd.idProduccion = ? and mpd.semana = ?
            GROUP BY mpd.semana,mpd.idLote`, [id, ultimo.Semana]);
            console.log('cantidad_days[0] :>> ', cantidad_days[0]);
            if (cantidad_days[0].cant_days < 7) {
                rows.pop();
                rows.pop();
                rows.pop();
                rows.pop();
            }
        }

        return rows;
    },
    verifyVentas: async function (Mortalidad) {
        let data = JSON.parse(Mortalidad.data);
        for (var idLote in data) {
            if (idLote != 'Observaciones') {
                let rows = await db.query(`SELECT * FROM traslado_ingreso_ventas WHERE idLoteOrigen = ? and Fecha = ?`,
                    [idLote, Mortalidad.fecha]);
                let jsonData = {
                    idProduccionOrigen: Mortalidad.idProduccion,
                    LoteOrigen: idLote,
                    Nro_Guia: data[idLote].Nro_Guia,
                    Venta: data[idLote].Vendidos,
                    Tipo: "venta",
                    Fecha: Mortalidad.fecha
                }
                if (rows.length != 0) {
                    jsonData.Traslado = rows[0].Traslado;
                    jsonData.LoteDestino = rows[0].idLoteDestino;
                    jsonData.idProduccionDestino = rows[0].idProduccionDestino;
                    let count = await produccionTraslado.verifyProduccionMortalidad(jsonData);
                    if (count == true) {
                        let rows1 = await produccionTraslado.updateVentasfromMortalidad(jsonData);
                        await produccionTraslado.StockAvesMensual(jsonData, rows1);
                    }
                }
            }
        }
        return;
    },
    verifyPeriodo: async function (Mortalidad) {
        let f = Mortalidad.fecha.split('-');
        let y = f[0]
        let m = f[1];
        let Periodo = y + '' + m
        let info_periodo = await db.query(`SELECT * FROM periodo WHERE YearMonth = ?`, [Periodo]);
        let cerrado = false;
        if (info_periodo.length != 0) {
            if (info_periodo[0].Estado == 0) {
                cerrado = true;
            }
        }
        return cerrado;
    }
}
module.exports = produccionMortalidad;
