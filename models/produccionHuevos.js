var db = require('../dbconnection');
const moment = require("moment");
const mysql = require("../dbconnectionPromise")
const periodoF33 = require('./periodo_f33')
moment.locale("es")
var produccionHuevos = {
    verifyProdHuevosSem: async function (params) {
        return await db.query("SELECT * FROM produccion_huevos_sem WHERE idProduccion = ? and semana_prod = ?", [params.idProduccion, params.Semana]);
    },
    getAllproduccionHuevos: function (callback) {
        return db.query("SELECT * FROM  produccion_huevos_det", callback);
    },
    getProduccionDiariaCron: async function () {
        const connection = await mysql.connection();
        const periodos = await periodoF33.getPeriodosEstado1();
        const producciones = await connection.query(`select distinct idProduccion,periodo from produccion_huevos_det where periodo in(?)`, [periodos.map(p => p.YearMonth)])
        for (let i = 0; i < producciones.length; i++) {
            const produccionActual = producciones[i]
            await this.getProduccionDiaria(produccionActual.idProduccion, produccionActual.periodo)
        }



    },

    getProduccionDiariaAppProduccion: async function ({ produccionIds = [], periodo }) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            let dataBd = []
            let dataView = []
            const lotes = await connection.query(`select * from lotes where idProduccion in(?)`, [produccionIds])
            const lotesHembras = lotes.filter(l => l.Sexo == "H")
            const lotesHembraId = lotesHembras.map(l => l.idLote)
            let initData = {
                lote: { id: null, nombre: null },
                semana: null,
                dia: null,
                fecha: null,
                saldoHembra: 0,
                saldoMacho: null,
                totalDiario: null,
                porcentajeTotalDiarioHembra: null,
                hiCatgA: null,
                hiCatgB: null,
                hiCatgB1: null,
                hiCatgC: null,
                hiTotal: null,
                porcentajeHi: null,
                hiNoIncubableComer: null,
                hiNoIncubableDy: null,
                hiNoIncubableRoto: null,
                hiNoIncubableFarf: null
            }
            const periodoIsOpen = await periodoF33.periodoIsOpen(periodo)
            if (!periodoIsOpen) {
                const data = await connection.query(`select lo.idLote,lo.lote,ph.periodo,DATE_FORMAT(ph.fecha,'%Y-%m-%d') fecha,ph.semana,saldoHembra,saldoMacho,prodTotal totalDiario,
                porcProdTotal porcentajeTotalDiarioHembra,prodHiA hiCatgA,  prodHiB hiCatgB,prodHiB1 hiCatgB1,prodHiC hiCatgC,prodTotHi hiTotal,porcProdTotHi  porcentajeHi,prodHComer hiNoIncubableComer,prodHDy hiNoIncubableDy,prodHRoto hiNoIncubableRoto,prodHFarf hiNoIncubableFarf,fechaTrasl,cantidadDesp,nroGuia,idAlmacenDest  from prod_phdiaria ph inner join lotes lo on lo.idLote=ph.idLote where lo.idLote in(?) and periodo=?`, [lotesHembraId, periodo])
                dataBd = data.map(d => ({ ...d, lote: { id: d.idLote, nombre: d.lote } }))
                dataView = data.map(d => ({ ...d, lote: { id: d.idLote, nombre: d.lote } }))
            } else {
                await db.query("delete from prod_phdiaria where idLote in(?) and periodo=?", [lotesHembraId, periodo])
                const lotesMachos = lotes.filter(l => l.Sexo == "M")
                const periodoMoment = moment(periodo, "YYYYMM")
                const startDayOfMonth = periodoMoment.clone().startOf("month").subtract(1, "day")
                const lastDayOfMonth = periodoMoment.clone().endOf("month")
                const produccionHembrasDiariaPorFecha = lotes.length > 0 && await connection.query(`select lo.idLote,lo.lote,lo.lote_str,ph.* from produccion_huevos_det ph inner join lotes lo on lo.idLote=ph.IdLote 
                where  Periodo=${periodo} and lo.idLote in(?) order by ph.fechaRegistro;`, [lotes.map(l => l.idLote)]) || [];
                const mortalidadPorFechaMachoHembra = lotes.length > 0 && await connection.query(`select * from prod_mortalidaddiaria pm inner join lotes lo on lo.idLote=pm.idlote where periodo=${periodo} and  lo.idlote in(?) order by fecha;`, [lotes.map(l => l.idLote)]) || []
                const hembrasFilter = mortalidadPorFechaMachoHembra.filter(m => moment(m.fecha).format("YYYY-MM-DD") == startDayOfMonth.format("YYYY-MM-DD") && lotesHembraId.includes(m.idLote))
                const saldoFinalHembras = hembrasFilter.length > 0 && hembrasFilter.map(m => ({ ...initData, saldoHembra: m.saldoFinal, fecha: "Saldo Anterior", dia: null })) || lotesHembras.map(l => ({ ...initData, dia: null, fecha: "Saldo Anterior", lote: { id: l.idLote, nombre: l.lote, idProduccion: l.idProduccion } }))
                dataBd = dataBd.concat(saldoFinalHembras)
                startDayOfMonth.add(1, "day")
                let produccionDiariaArray = []
                while (startDayOfMonth.isSameOrBefore(lastDayOfMonth)) {
                    const yesterday = startDayOfMonth.clone().subtract(1, "day");
                    const dataYesterday = dataBd.filter(d => d.fecha == yesterday.format("YYYY-MM-DD"))
                    const mortalidadHembras = mortalidadPorFechaMachoHembra.filter(m => moment(m.fecha).format("YYYY-MM-DD") == startDayOfMonth.format("YYYY-MM-DD") && lotesHembraId.includes(m.idLote))
                    const produccionDiaria = produccionHembrasDiariaPorFecha.filter(p => moment(p.fechaRegistro, "DD-MM-YYYY").format("YYYY-MM-DD") == startDayOfMonth.format("YYYY-MM-DD")
                    ).map(p => {
                        const loteMacho = lotesMachos.find(l => l.lote_str == p.lote_str)
                        const { saldofinal: saldoMacho = 0 } = mortalidadHembras.find(m => m.idLote == loteMacho.idLote) || {}
                        const { saldofinal: saldoHembra = 0, finCampania = 0, mortalidad = 0, descarte = 0, id_det: idDetalle = 0 } = mortalidadHembras.find(m => m.idlote == p.idLote) || {}
                        const { saldoHembra: saldoHembraPrevius = 0 } = dataYesterday.find(d => d.lote.id == p.idLote) || {}
                        const porcentajeTotalDiarioHembra = saldoHembraPrevius > 0 && Number(p.TotalDiario_Contable / (saldoHembraPrevius) * 100).toFixed(2) || 0
                        return {
                            hiCatgA: p.HI_A,
                            hiCatgB: p.HI_B,
                            hiCatgB1: p.HI_B1,
                            hiCatgC: p.HI_C,
                            hiTotal: p.TotalHI,
                            porcentajeHi: p.PorHI,
                            totalDiario: p.TotalDiario_Contable,
                            hiNoIncubableComer: p.HNI_Comercial,
                            hiNoIncubableDy: p.HNI_DY,
                            hiNoIncubableRoto: p.HNI_Roto,
                            hiNoIncubableFarf: p.HNI_Farf,
                            saldoHembra,
                            saldoMacho,
                            finCampania,
                            porcentajeTotalDiarioHembra,
                            semana: p.Semana, lote: { id: p.idLote, nombre: p.lote, idProduccion: p.idProduccion },
                            idProduccion: p.idProduccion,
                            fecha: startDayOfMonth.format("YYYY-MM-DD"), dia: startDayOfMonth.format("dddd"),
                            mortalidad, descarte,
                            idDetalle
                        }
                    })
                    dataBd = dataBd.concat(produccionDiaria)
                    dataView = dataView.concat(produccionDiaria)
                    produccionDiariaArray = produccionDiariaArray.concat(produccionDiaria)
                    if (startDayOfMonth.format("dddd") == "viernes" && produccionDiaria.length > 0) {
                        const kardex = this.calcularTotalProduccionDiaria(produccionDiariaArray, lotesHembras)
                        dataView = dataView.concat(kardex)
                        produccionDiariaArray = []
                    }
                    startDayOfMonth.add(1, "day")
                }
                // dataView.unshift(saldoFinalHembras)

                /*   const dataValues = dataBd.map(d => [d.dia, periodo, d.fecha, d.idGranja, d.semana, produccionId, d.lote.id, d.saldoHembra, d.saldoMacho,
                  d.totalDiario, d.porcentajeTotalDiarioHembra, d.hiCatgA, d.hiCatgB, d.hiCatgB1, d.hiCatgC, d.hiTotal, d.porcentajeHi, d.hiNoIncubableComer, d.hiNoIncubableDy,
                  d.hiNoIncubableRoto, d.hiNoIncubableFarf, null, null, null, null, 1, new Date(), d.idDetalle])
                  await connection.query("insert into prod_phdiaria(dia,periodo,fecha,idGranja,semana,idObjeto,idLote,saldoHembra,saldoMacho,prodTotal,porcProdTotal,prodHiA,prodHiB,prodHiB1,prodHiC,prodTotHi,porcProdTotHi,prodHComer,prodHDy,prodHRoto,prodHFarf,fechaTrasl,cantidadDesp,nroGuia,idAlmacenDest,idUsuario,fechaRegistro,idDet) values ?"
                      , [dataValues]) */
            }



            return { lotes: lotesHembras, kardex: dataView.flat() }
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();

        }


    },

    calcularTotalProduccionDiaria(listaKardex = [], lotes = []) {
        let nuevoKardex = []
        let initData = {
            lote: { id: null, nombre: null },
            semana: null,
            dia: null,
            fecha: null,
            saldoHembra: 0,
            saldoMacho: null,
            totalDiario: null,
            porcentajeTotalDiarioHembra: null,
            hiCatgA: null,
            hiCatgB: null,
            hiCatgB1: null,
            hiCatgC: null,
            hiTotal: null,
            porcentajeHi: null,
            hiNoIncubableComer: null,
            hiNoIncubableDy: null,
            hiNoIncubableRoto: null,
            hiNoIncubableFarf: null
        }
        for (let i = 0; i < lotes.length; i++) {
            const lote = lotes[i]
            const listaKardexCalculoTotal = listaKardex.filter(l => l.lote.id == lote.idLote)
            console.log("lista kardex", listaKardexCalculoTotal)
            const calculoTotales = listaKardexCalculoTotal.reduce((prev, curr) => {
                prev.totalDiario += 1 * Number(curr.totalDiario).toFixed(2)
                prev.hiTotal += 1 * Number(curr.hiTotal).toFixed(2)
                prev.porcentajeHi += 1 * Number(curr.porcentajeHi).toFixed(2)
                prev.hiNoIncubableComer += 1 * Number(curr.hiNoIncubableComer).toFixed(2)
                prev.hiNoIncubableDy += 1 * Number(curr.hiNoIncubableDy).toFixed(2)
                prev.hiNoIncubableRoto += 1 * Number(curr.hiNoIncubableRoto).toFixed(2)
                prev.hiNoIncubableFarf += 1 * Number(curr.hiNoIncubableFarf).toFixed(2)
                prev.saldoHembra += 1 * Number(curr.saldoHembra).toFixed(2)
                return prev;
            }, { "totalDiario": 0, "hiTotal": 0, "porcentajeHi": 0, "hiNoIncubableComer": 0, "hiNoIncubableDy": 0, "hiNoIncubableRoto": 0, "hiNoIncubableFarf": 0, saldoHembra: 0 })
            nuevoKardex.push({
                ...initData, lote: { id: lote.idLote, nombre: lote.lote }, fecha: "Total", totalDiario: Number(calculoTotales.totalDiario).toFixed(2) * 1,
                hiTotal: Number(calculoTotales.hiTotal).toFixed(2) * 1,
                orcentajeHi: Number(calculoTotales.porcentajeHi).toFixed(2) * 1,
                hiNoIncubableComer: Number(calculoTotales.hiNoIncubableComer).toFixed(2) * 1,
                hiNoIncubableRoto: Number(calculoTotales.hiNoIncubableRoto).toFixed(2) * 1, hiNoIncubableFarf: Number(calculoTotales.hiNoIncubableFarf).toFixed(2) * 1, saldoHembra: Number(calculoTotales.saldoHembra).toFixed(2) * 1
            })
        }

        return nuevoKardex;

    },
    getProduccionDiaria: async function (produccionId, periodo) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            let dataView = []
            const lotes = await connection.query(`select * from lotes where idProduccion=${produccionId}`)
            const lotesHembras = lotes.filter(l => l.Sexo == "H")
            const lotesHembraId = lotesHembras.map(l => l.idLote)
            let initData = {
                lote: { id: null, nombre: null },
                semana: null,
                dia: null,
                fecha: null,
                saldoHembra: 0,
                saldoMacho: null,
                totalDiario: null,
                porcentajeTotalDiarioHembra: null,
                hiCatgA: null,
                hiCatgB: null,
                hiCatgB1: null,
                hiCatgC: null,
                hiTotal: null,
                porcentajeHi: null,
                hiNoIncubableComer: null,
                hiNoIncubableDy: null,
                hiNoIncubableRoto: null,
                hiNoIncubableFarf: null
            }
            const periodoIsOpen = await periodoF33.periodoIsOpen(periodo)
            if (!periodoIsOpen) {
                const data = await connection.query(`select lo.idLote,lo.lote,ph.periodo,DATE_FORMAT(ph.fecha,'%Y-%m-%d') fecha,ph.semana,saldoHembra,saldoMacho,prodTotal totalDiario,
                porcProdTotal porcentajeTotalDiarioHembra,prodHiA hiCatgA,  prodHiB hiCatgB,prodHiB1 hiCatgB1,prodHiC hiCatgC,prodTotHi hiTotal,porcProdTotHi  porcentajeHi,prodHComer hiNoIncubableComer,prodHDy hiNoIncubableDy,prodHRoto hiNoIncubableRoto,prodHFarf hiNoIncubableFarf,fechaTrasl,cantidadDesp,nroGuia,idAlmacenDest  from prod_phdiaria ph inner join lotes lo on lo.idLote=ph.idLote where lo.idLote in(?) and periodo=?`, [lotesHembraId, periodo])
                dataView = data.map(d => ({ ...d, lote: { id: d.idLote, nombre: d.lote } }))
            } else {
                await connection.query("delete from prod_phdiaria where idLote in(?) and periodo=?", [lotesHembraId, periodo])
                const lotesMachos = lotes.filter(l => l.Sexo == "M")
                const periodoMoment = moment(periodo, "YYYYMM")
                const startDayOfMonth = periodoMoment.clone().startOf("month").subtract(1, "day")
                const lastDayOfMonth = periodoMoment.clone().endOf("month")
                const produccionHembrasDiariaPorFecha = lotes.length > 0 && await connection.query(`select lo.idLote,lo.lote,lo.lote_str,ph.* from produccion_huevos_det ph inner join lotes lo on lo.idLote=ph.IdLote 
                where  Periodo=${periodo} and lo.idLote in(?) order by ph.fechaRegistro;`, [lotes.map(l => l.idLote)]) || [];
                const mortalidadPorFechaMachoHembra = lotes.length > 0 && await connection.query(`select * from prod_mortalidaddiaria pm inner join lotes lo on lo.idLote=pm.idlote where periodo=${periodo} and  lo.idlote in(?) order by fecha;`, [lotes.map(l => l.idLote)]) || []
                const hembrasFilter = mortalidadPorFechaMachoHembra.filter(m => moment(m.fecha).format("YYYY-MM-DD") == startDayOfMonth.format("YYYY-MM-DD") && lotesHembraId.includes(m.idLote))
                const saldoFinalHembras = hembrasFilter.length > 0 && hembrasFilter.map(m => ({ ...initData, saldoHembra: m.saldoFinal, fecha: startDayOfMonth.format("YYYY-MM-DD"), dia: startDayOfMonth.format("dddd") })) || lotesHembras.map(l => ({ ...initData, dia: startDayOfMonth.format("dddd"), fecha: startDayOfMonth.format("YYYY-MM-DD"), lote: { id: l.idLote, nombre: l.lote } }))
                dataView = dataView.concat(saldoFinalHembras)
                console.log("dataView", dataView)
                startDayOfMonth.add(1, "day")
                while (startDayOfMonth.isSameOrBefore(lastDayOfMonth)) {
                    const yesterday = startDayOfMonth.clone().subtract(1, "day");
                    const dataYesterday = dataView.filter(d => d.fecha == yesterday.format("YYYY-MM-DD"))
                    const mortalidadHembras = mortalidadPorFechaMachoHembra.filter(m => moment(m.fecha).format("YYYY-MM-DD") == startDayOfMonth.format("YYYY-MM-DD") && lotesHembraId.includes(m.idLote))
                    const produccionDiaria = produccionHembrasDiariaPorFecha.filter(p => moment(p.fechaRegistro, "DD-MM-YYYY").format("YYYY-MM-DD") == startDayOfMonth.format("YYYY-MM-DD")
                    ).map(p => {
                        const loteMacho = lotesMachos.find(l => l.lote_str == p.lote_str)
                        const { saldofinal: saldoMacho = 0 } = mortalidadHembras.find(m => m.idLote == loteMacho.idLote) || {}
                        const { saldofinal: saldoHembra = 0, finCampania = 0, mortalidad = 0, descarte = 0, id_det: idDetalle = 0 } = mortalidadHembras.find(m => m.idlote == p.idLote) || {}
                        const { saldoHembra: saldoHembraPrevius = 0 } = dataYesterday.find(d => d.lote.id == p.idLote) || {}
                        const porcentajeTotalDiarioHembra = saldoHembraPrevius > 0 && Number(p.TotalDiario_Contable / (saldoHembraPrevius) * 100).toFixed(2) || 0
                        return {
                            hiCatgA: p.HI_A,
                            hiCatgB: p.HI_B,
                            hiCatgB1: p.HI_B1,
                            hiCatgC: p.HI_C,
                            hiTotal: p.TotalHI,
                            porcentajeHi: p.PorHI,
                            totalDiario: p.TotalDiario_Contable,
                            hiNoIncubableComer: p.HNI_Comercial,
                            hiNoIncubableDy: p.HNI_DY,
                            hiNoIncubableRoto: p.HNI_Roto,
                            hiNoIncubableFarf: p.HNI_Farf,
                            saldoHembra,
                            saldoMacho,
                            finCampania,
                            porcentajeTotalDiarioHembra,
                            semana: p.Semana, lote: { id: p.idLote, nombre: p.lote },
                            fecha: startDayOfMonth.format("YYYY-MM-DD"), dia: startDayOfMonth.format("dddd"),
                            idGranja: p.idGranja,
                            mortalidad, descarte,
                            idDetalle
                        }
                    })

                    dataView = dataView.concat(produccionDiaria)
                    startDayOfMonth.add(1, "day")
                }

                const dataValues = dataView.map(d => [d.dia, periodo, d.fecha, d.idGranja, d.semana, produccionId, d.lote.id, d.saldoHembra, d.saldoMacho,
                d.totalDiario, d.porcentajeTotalDiarioHembra, d.hiCatgA, d.hiCatgB, d.hiCatgB1, d.hiCatgC, d.hiTotal, d.porcentajeHi, d.hiNoIncubableComer, d.hiNoIncubableDy,
                d.hiNoIncubableRoto, d.hiNoIncubableFarf, null, null, null, null, 1, new Date(), d.idDetalle])
                await connection.query("insert into prod_phdiaria(dia,periodo,fecha,idGranja,semana,idObjeto,idLote,saldoHembra,saldoMacho,prodTotal,porcProdTotal,prodHiA,prodHiB,prodHiB1,prodHiC,prodTotHi,porcProdTotHi,prodHComer,prodHDy,prodHRoto,prodHFarf,fechaTrasl,cantidadDesp,nroGuia,idAlmacenDest,idUsuario,fechaRegistro,idDet) values ?"
                    , [dataValues])
            }


            const dataTotal = dataView.reduce((prev, curr) => {
                prev.totalDiario = 1 * Number(curr.totalDiario + prev.totalDiario).toFixed(2)
                prev.hiTotal = 1 * Number(curr.hiTotal + prev.hiTotal).toFixed(2)
                prev.porcentajeHi = 1 * Number(curr.porcentajeHi + prev.porcentajeHi).toFixed(2)
                prev.hiNoIncubableComer = 1 * Number(prev.hiNoIncubableComer + curr.hiNoIncubableComer).toFixed(2)
                prev.hiNoIncubableDy = 1 * Number(prev.hiNoIncubableDy + curr.hiNoIncubableDy).toFixed(2)
                prev.hiNoIncubableRoto = 1 * Number(prev.hiNoIncubableRoto + curr.hiNoIncubableRoto).toFixed(2)
                prev.hiNoIncubableFarf = 1 * Number(prev.hiNoIncubableFarf + curr.hiNoIncubableFarf).toFixed(2)
                return prev;
            }, { "totalDiario": 0, "hiTotal": 0, "porcentajeHi": 0, "hiNoIncubableComer": 0, "hiNoIncubableDy": 0, "hiNoIncubableRoto": 0, "hiNoIncubableFarf": 0 })

            dataView.push({ ...initData, ...dataTotal })
            await connection.query("COMMIT");
            return dataView
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();

        }
    },
    getproduccionHuevosById: function (id, callback) {
        return db.query("select * from produccion_huevos_det where idProduccion = ?", [id], callback);
    },
    getHuevosByIdLote: function (id, callback) {
        return db.query("SELECT * FROM huevosprod WHERE idLote = ? ORDER by Edad ASC", [id], callback);
    },
    getHuevosByIdLoteSem: function (id, callback) {
        return db.query("SELECT * FROM huevosprod_sem WHERE idLote = ? ORDER by semana_prod ASC", [id], callback);
    },
    getHuevosByIdProduccionSem: async function (semana, idLote) {
        return await db.query("SELECT * FROM produccion_huevos_sem WHERE semana_prod = ? and IdLote = ? ORDER BY IdProdHuevosSem ASC", [semana, idLote]);
    },
    listarPorNombreLotes: async function (selectedFields = [], nombreLotes = []) {
        const connection = await mysql.connection();
        try {

            return await connection.query("select " + selectedFields.join() + " ,lo.lote from produccion_huevos_sem  pro inner join lotes lo on lo.idLote=pro.idLote where lo.lote in(?)", [nombreLotes]);

        } catch (error) {

            throw error;
        } finally {
            connection.release();

        }
    },
    getAllHuevosLotes: async function (id) {
        let prod = await db.query(`SELECT * 
        FROM lotes WHERE idProduccion = ? and 
        Sexo = 'H' ORDER BY TipoGenero`, [id]);
        let LH = {}
        let rowsLH = await db.query(`SELECT * 
        FROM produccion_huevos_sem pspd 
        INNER JOIN lotes lo on pspd.IdLote = lo.idLote 
        INNER JOIN lineas li on lo.idLinea = li.idLinea 
        WHERE pspd.IdLote = ? 
        ORDER BY Semana`,
            [prod[0].idLote]);
        for (let i = 0; i < rowsLH.length; i++) {
            const e = rowsLH[i];
            LH.IdLote = e.IdLote;
            LH.Semana = e.Semana;
            LH.i = i;
        }
        let cantidad_days_lh = await db.query(`SELECT COUNT(*) as cant_days
        FROM produccion_huevos_det phd
        WHERE phd.IdLote = ? and phd.Semana = ?
        GROUP BY phd.Semana`, [LH.IdLote, LH.Semana]);
        console.log('lh :>> ', cantidad_days_lh);
        if (cantidad_days_lh[0].cant_days < 7) {
            rowsLH.splice(LH.i, 1);
        }

        let LM = {}
        let rowsLM = await db.query(`SELECT * 
        FROM produccion_huevos_sem pspd 
        INNER JOIN lotes lo on pspd.IdLote = lo.idLote 
        INNER JOIN lineas li on lo.idLinea = li.idLinea 
        WHERE pspd.IdLote = ? 
        ORDER BY Semana`,
            [prod[1].idLote]);
        for (let i = 0; i < rowsLM.length; i++) {
            const e = rowsLM[i];
            LM.IdLote = e.IdLote;
            LM.Semana = e.Semana;
            LM.i = i;
        }
        let cantidad_days_lm = await db.query(`SELECT COUNT(*) as cant_days
        FROM produccion_huevos_det phd
        WHERE phd.IdLote = ? and phd.Semana = ?
        GROUP BY phd.Semana`, [LM.IdLote, LM.Semana]);
        console.log('lm :>> ', cantidad_days_lm);
        if (cantidad_days_lm[0].cant_days < 7) {
            rowsLM.splice(LM.i, 1);
        }

        let rows = [];
        for (let i = 0; i < rowsLM.length; i++) {
            const e = rowsLM[i];
            rows.push(e);
        }

        for (let j = 0; j < rowsLH.length; j++) {
            const e = rowsLH[j];
            rows.push(e);
        }
        return rows;
    },
    getHuevosSemana: function (id, callback) {
        return db.query("select * from produccion_huevos_sem WHERE idLote = ? ORDER BY semana_prod ASC", [id], callback);
    },
    getPorcentajeHuevosIncubablesPorLote: async function (idLoteProduccion) {
        try {
            const semanasLh = await db.query("select A.Semana from produccion_huevos_sem A left join lotes B on B.idLote=A.idLote left join standard_prod_hembra C on C.Semana=A.Semana where A.idProduccion=? and B.TipoGenero='LH' group by A.Semana ", [idLoteProduccion])
            const semanasLm = await db.query("select A.Semana from produccion_huevos_sem A left join lotes B on B.idLote=A.idLote left join standard_prod_macho C on C.Semana=A.Semana where A.idProduccion=? and B.TipoGenero='LH' group by A.Semana ", [idLoteProduccion])
            const dataLh = await db.query("select A.PorHI,C.Porc_HI from produccion_huevos_sem A left join lotes B on B.idLote=A.idLote left join standard_prod_hembra C on C.Semana=A.Semana where A.idProduccion=? and B.TipoGenero='LH' order by A.Semana", [idLoteProduccion])
            const dataLm = await db.query("select A.PorHI ,C.Porc_HI from produccion_huevos_sem A left join lotes B on B.idLote=A.idLote left join standard_prod_macho C on C.Semana=A.Semana where A.idProduccion=? and B.TipoGenero='LM' order by A.Semana", [idLoteProduccion])
            return { semanasLm, semanasLh, dataLh, dataLm }
        } catch (error) {
            throw error;
        }
    },
    getPorcentajeHuevosIncubablesPorLotes: async function ({ lotes }) {
        try {
            const estandar = await db.query(`select StandardHI from (
    SELECT prodSem.Semana,D.TipoGenero, case when D.TipoGenero='LM' then C.Porc_HI else E.Porc_HI end StandardHI  
    FROM produccion_huevos_sem prodSem 
    left join lotes D on D.idLote=prodSem.idLote
    left join standard_prod_hembra C  on  C.Semana=prodSem.Semana
    left join standard_prod_macho  E  on  E.Semana=prodSem.Semana
    WHERE prodSem.idLote in(?) and prodSem.Semana not in(SELECT  phd.Semana
                FROM produccion_huevos_det phd
                WHERE phd.idLote =prodSem.IdLote  GROUP BY phd.Semana  
               HAVING COUNT(DISTINCT(Edad))<7) ) ww   group by Semana,TipoGenero,StandardHI     ORDER BY  Semana;`, [lotes])
            const semanas = await db.query(`SELECT prodSem.Semana FROM produccion_huevos_sem prodSem 
            left join lotes D on D.idLote=prodSem.idLote
            left join standard_prod_hembra C  on  C.Semana=prodSem.Semana
            left join standard_prod_macho  E  on  E.Semana=prodSem.Semana
            WHERE prodSem.idLote in(?) and prodSem.Semana not in(SELECT  phd.Semana
                        FROM produccion_huevos_det phd
                        WHERE phd.idLote =prodSem.IdLote  GROUP BY phd.Semana  
                       HAVING COUNT(DISTINCT(Edad))<7)    GROUP BY  prodSem.Semana;`, [lotes])
            const data = await db.query(`SELECT prodSem.idLote,D.TipoGenero, prodSem.Semana, prodSem.PorHI,
case when D.TipoGenero='LH' then C.Porc_HI else E.Porc_HI end StandardHI  
FROM produccion_huevos_sem prodSem 
left join lotes D on D.idLote=prodSem.idLote
left join standard_prod_hembra C  on  C.Semana=prodSem.Semana
left join standard_prod_macho  E  on  E.Semana=prodSem.Semana
WHERE prodSem.idLote in(?) and prodSem.Semana not in(SELECT  phd.Semana
            FROM produccion_huevos_det phd
            WHERE phd.idLote =prodSem.IdLote  GROUP BY phd.Semana  
           HAVING COUNT(DISTINCT(Edad))<7)         ORDER BY prodSem.idLote, prodSem.Semana`, [lotes])

            return { semanas, data, estandar }
        } catch (error) {
            throw error;
        }

    },
    getPorcentajeHuevosRotosPorLotes: async function ({ lotes }) {
        try {

            const semanas = await db.query(`SELECT prodSem.Semana
            FROM produccion_huevos_sem prodSem WHERE prodSem.idLote in(?) and prodSem.Semana not in(SELECT  phd.Semana
                        FROM produccion_huevos_det phd
                        WHERE phd.idLote =prodSem.IdLote  GROUP BY phd.Semana  
                       HAVING COUNT(DISTINCT(Edad))<7)         GROUP BY prodSem.Semana;`, [lotes])
            const data = await db.query(`SELECT prodSem.idLote,
            round (case when prodSem.TotalSemProd_Huevo>0 then (prodSem.HNI_Roto/prodSem.TotalSemProd_Huevo)*100  else 0 end ,2) PorcRoto
            FROM produccion_huevos_sem prodSem WHERE prodSem.idLote in(?) and prodSem.Semana not in(SELECT  phd.Semana
                        FROM produccion_huevos_det phd
                        WHERE phd.idLote =prodSem.IdLote  GROUP BY phd.Semana  
                       HAVING COUNT(DISTINCT(Edad))<7)         ORDER BY prodSem.idLote, prodSem.Semana;`, [lotes])

            return { semanas, data }
        } catch (error) {
            throw error;
        }

    },
    getPorcentajeHuevosDobleYemaPorLotes: async function ({ lotes }) {
        try {

            const semanas = await db.query(`SELECT      prodSem.Semana
            FROM produccion_huevos_sem prodSem WHERE prodSem.idLote in(?) and prodSem.Semana not in(SELECT  phd.Semana
                        FROM produccion_huevos_det phd
                        WHERE phd.idLote =prodSem.IdLote  GROUP BY phd.Semana  
                       HAVING COUNT(DISTINCT(Edad))<7)         GROUP BY prodSem.Semana;`, [lotes])
            const data = await db.query(`SELECT prodSem.idLote,
            round (case when prodSem.TotalSemProd_Huevo>0 then (prodSem.HNI_DY/prodSem.TotalSemProd_Huevo)*100  else 0 end ,2) PorcDY 
            FROM produccion_huevos_sem prodSem WHERE prodSem.idLote in(?) and prodSem.Semana not in(SELECT  phd.Semana
                        FROM produccion_huevos_det phd
                        WHERE phd.idLote =prodSem.IdLote  GROUP BY phd.Semana  
                       HAVING COUNT(DISTINCT(Edad))<7)         ORDER BY prodSem.idLote, prodSem.Semana;`, [lotes])

            return { semanas, data }
        } catch (error) {
            throw error;
        }

    },
    getPorcentajeHuevosRotos: async function (idLoteProduccion) {
        try {
            const data = await db.query("select B.TipoGenero,A.idProduccion,A.idLote,A.Semana,HNI_Roto,TotalSemProd_Huevo,round(case when TotalSemProd_Huevo>0 then (HNI_Roto/TotalSemProd_Huevo)*100 else 0 end,2) porcRoto from produccion_huevos_sem A left join lotes B on B.idLote=A.idLote where A.idProduccion=?   order by Semana", [idLoteProduccion])
            const dataLh = data.filter(d => d.TipoGenero == 'LH')
            const dataLm = data.filter(d => d.TipoGenero == 'LM')
            const semanasLh = dataLh.map(d => d.Semana)
            const semanasLm = dataLm.map(d => d.Semana)
            return { semanasLm, semanasLh, dataLh, dataLm }
        } catch (error) {
            throw error;
        }

    },
    getPorcentajeHuevosDobleYema: async function (idLoteProduccion) {
        try {
            const data = await db.query("select B.TipoGenero,A.idProduccion,A.idLote,A.Semana,HNI_DY,TotalSemProd_Huevo,round(case when TotalSemProd_Huevo>0 then (HNI_DY/TotalSemProd_Huevo)*100 else 0 end,2) porcDy from produccion_huevos_sem A left join lotes B on B.idLote=A.idLote where A.idProduccion=?   order by Semana", [idLoteProduccion])
            const dataLh = data.filter(d => d.TipoGenero == 'LH')
            const dataLm = data.filter(d => d.TipoGenero == 'LM')
            const semanasLh = dataLh.map(d => d.Semana)
            const semanasLm = dataLm.map(d => d.Semana)
            return { semanasLm, semanasLh, dataLh, dataLm }
        } catch (error) {
            throw error;
        }

    },

    postHuevosSemana: async function ({ lotes }) {
        const semanas = await db.query("SELECT prodSem.Semana as semana FROM produccion_huevos_sem prodSem WHERE prodSem.idLote in(?) GROUP BY prodSem.Semana", [lotes])
        const data = await db.query(`SELECT prodSem.idLote, prodSem.Semana,prodSem.PorcHI_B1,prodSem.PorcHI_C,prodSem.PorcHI_A, prodSem.Act_Avedia,prodSem.STD_Act_Avedia
        FROM produccion_huevos_sem prodSem WHERE prodSem.idLote in(?) and
        prodSem.Semana not in(SELECT phd.Semana
         FROM produccion_huevos_det phd
         WHERE phd.idLote =prodSem.IdLote GROUP BY phd.Semana
         HAVING COUNT(DISTINCT(Edad))<7) ORDER BY prodSem.idLote, prodSem.Semana;`, [lotes])
        const estandar = await db.query(`select  STD_Act_Avedia as std from (
            SELECT prodSem.Semana, prodSem.STD_Act_Avedia 
            FROM produccion_huevos_sem prodSem WHERE prodSem.idLote in(?) and prodSem.Semana not in(SELECT  phd.Semana
                        FROM produccion_huevos_det phd
                        WHERE phd.idLote =prodSem.IdLote  GROUP BY phd.Semana  
                       HAVING COUNT(DISTINCT(Edad))<7) )ww group by Semana, STD_Act_Avedia        ORDER BY Semana;`, [lotes])

        return { semanas, data ,estandar};
    },
    getMortalidadProduccion: async function (id) {
        return await db.query("select * from produccion l " +
            "INNER JOIN lotes lo ON lo.idProduccion = l.idProduccion " +
            "INNER JOIN lineas li ON li.idLinea = lo.idLinea " +
            "WHERE l.idProduccion = ? ORDER BY lo.IdLote ASC", [id]);
    },
    getmortalidadDia: function (idProduccion, idLote, Edad, callback) {
        return db.query("select * from produccion_huevos_det where idProduccion= ? AND idLote = ? AND Edad= ?", [idProduccion, idLote, Edad], callback);
    },
    getHuevosUltimoDia: function (id, callback) {
        return db.query("select * from produccion_huevos_det WHERE idLote = ? ORDER BY Edad DESC LIMIT 0, 1", [id], callback);
    },
    getHuevosSTD: function (idProduccion, idlote, semana, callback) {
        db.query("SELECT " +
            "CASE idLinea  " +
            "WHEN 19 THEN  " +
            "(SELECT HuevosH_L9 FROM standard_levante WHERE Semana = ?) " +
            "WHEN 17 THEN " +
            "(SELECT HuevosH_L4 AS StdData FROM standard_levante WHERE Semana = ?) " +
            "WHEN 18 THEN " +
            "(SELECT HuevosM_L7 AS StdData FROM standard_levante WHERE Semana = ?) " +
            "WHEN 1 THEN " +
            "(SELECT HuevosM_L1 AS StdData FROM standard_levante WHERE Semana = ?) " +
            "ELSE " +
            "(SELECT 4 AS StdData) " +
            "END as nombre " +
            "FROM lotes WHERE idProduccion = ? and idLote = ?", [semana, semana, semana, semana, idProduccion, idlote], callback);
    },
    addHuevosModal: async function (Huevos) {
        let semana_prod = Math.ceil(Huevos.Edad / 7);
        let semana = semana_prod + 24;
        let f = Huevos.Fecha.split('-');
        let Periodo = f[2] + "" + f[1];
        let yyyy = f[2];
        let mm = f[1];
        let dd = f[0];
        let fechaDB = yyyy + "-" + mm + "-" + dd;
        await db.query("INSERT INTO produccion_huevos_det (idProduccion, IdLinea, IdLote, Semana, semana_prod, Edad, TotalDiarioProd_Huevo, HI_A, PorcHI_A, HI_B, PorcHI_B, HI_B1, PorcHI_B1, HI_C, PorcHI_C, TotalHI, PorHI, HNI_Comercial, HNI_DY, TotalHNI_Comercial, HNI_Roto, HNI_Farf, HNI_Elim, TotalHNI_REF, PorcHNI_REF, HNI_PruebaFert, TotalDiario_Contable,PorcHNI_Comercial,PorcHNI_DY,PorcHNI_Total_Comercial, fechaRegistro, Periodo) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [Huevos.idProduccion, 2000, Huevos.idLote, semana, semana_prod, Huevos.Edad, Huevos.TotalDiarioProd_Huevo, Huevos.HI_A, Huevos.PorcHI_A, Huevos.HI_B, Huevos.PorcHI_B, Huevos.HI_B1, Huevos.PorcHI_B1,
            Huevos.HI_C, Huevos.PorcHI_C, Huevos.TotalHI, Huevos.PorHI, Huevos.HNI_Comercial, Huevos.HNI_DY, Huevos.TotalHNI_Comercial, Huevos.HNI_Roto, Huevos.HNI_Farf, Huevos.HNI_Elim, Huevos.TotalHNI_REF, Huevos.PorcHNI_REF, 0, Huevos.TotalDiario_Contable, Huevos.PorcHNI_Comercial, Huevos.PorcHNI_DY, Huevos.PorcHNI_Total_Comercial, Huevos.Fecha, Periodo]);

        // PARA STOCK HUEVO INCUBABLE
        //DIARIO
        await db.query("INSERT INTO stock_diario_hi (idProduccion , idLote , Edad , cantidadTipoA, cantidadTipoB, cantidadTipoB1, cantidadTipoC, tipoMovimiento, fechaRegistro) values(?,?,?,?,?,?,?,?,?)",
            [Huevos.idProduccion, Huevos.idLote, Huevos.Edad, Huevos.HI_A, Huevos.HI_B, Huevos.HI_B1, Huevos.HI_C, 'I', fechaDB])
        //MENSUAL
        let shim = await db.query("SELECT * FROM stock_mensual_hi WHERE idLote = ? and year = ? and month = ?",
            [Huevos.idLote, yyyy, mm])
        if (shim.length == 0) {
            await db.query(`INSERT INTO stock_mensual_hi (
                idProduccion, idLote, year, month) 
                VALUES (?,?,?,?)`,
                [Huevos.idProduccion, Huevos.idLote, yyyy, mm])
        }

        // PARA STOCK HUEVO COMERCIAL
        //DIARIO
        await db.query("INSERT INTO stock_diario_hc (idProduccion , idLote , Edad , cantidadTipoNormal, cantidadTipoDY, tipoMovimiento, fechaRegistro) values(?,?,?,?,?,?,?)",
            [Huevos.idProduccion, Huevos.idLote, Huevos.Edad, Huevos.HNI_Comercial, Huevos.HNI_DY, 'I', fechaDB])
        //MENSUAL
        let shcm = await db.query("SELECT * FROM stock_mensual_hc WHERE idLote = ? and year = ? and month = ?",
            [Huevos.idLote, yyyy, mm])
        if (shcm.length == 0) {
            await db.query(`INSERT INTO stock_mensual_hc (
                idProduccion, idLote, year, month)
                VALUES (?,?,?,?)`,
                [Huevos.idProduccion, Huevos.idLote, yyyy, mm])
        }

        return;
    },
    updateHuevos: async function (id, Huevos) {
        let f = Huevos.Fecha.split('-');
        let yyyy = f[2];
        let mm = f[1];
        let dd = f[0];
        let fechaDB = yyyy + "-" + mm + "-" + dd;
        await db.query(`UPDATE produccion_huevos_det 
        SET TotalDiarioProd_Huevo = ?, HI_A = ?, PorcHI_A = ?, HI_B = ?, PorcHI_B = ?, 
        HI_B1 = ?, PorcHI_B1 = ?, HI_C = ?, PorcHI_C = ?, TotalHI = ?, PorHI = ?, 
        HNI_Comercial = ?, HNI_DY = ?, TotalHNI_Comercial = ?, HNI_Roto = ?, HNI_Farf = ?, 
        HNI_Elim = ?, TotalHNI_REF = ?, PorcHNI_REF = ?, HNI_PruebaFert = ?, 
        TotalDiario_Contable = ?, PorcHNI_Comercial = ?, PorcHNI_DY = ?, PorcHNI_Total_Comercial = ? 
        WHERE idProdHuevos = ?`,
            [Huevos.TotalDiarioProd_Huevo, Huevos.HI_A, Huevos.PorcHI_A, Huevos.HI_B, Huevos.PorcHI_B, Huevos.HI_B1,
            Huevos.PorcHI_B1, Huevos.HI_C, Huevos.PorcHI_C, Huevos.TotalHI, Huevos.PorHI, Huevos.HNI_Comercial,
            Huevos.HNI_DY, Huevos.TotalHNI_Comercial, Huevos.HNI_Roto, Huevos.HNI_Farf, Huevos.HNI_Elim,
            Huevos.TotalHNI_REF, Huevos.PorcHNI_REF, 0, Huevos.TotalDiario_Contable, Huevos.PorcHNI_Comercial,
            Huevos.PorcHNI_DY, Huevos.PorcHNI_Total_Comercial, id]);

        //ACTUALIZANDO STOCK HUEVO INCUBABLE
        //DIARIO
        let hi = await db.query("SELECT * FROM stock_diario_hi WHERE idLote = ? and Edad = ? and tipoMovimiento = ?",
            [Huevos.idLote, Huevos.Edad, 'I'])
        if (hi.length != 0) {
            await db.query(`UPDATE stock_diario_hi SET
                cantidadTipoA = ?, cantidadTipoB = ?, cantidadTipoB1 = ?, cantidadTipoC = ?
                WHERE idLote = ? and Edad = ? and tipoMovimiento = ?`,
                [Huevos.HI_A, Huevos.HI_B, Huevos.HI_B1, Huevos.HI_C, Huevos.idLote, Huevos.Edad, 'I'])
        } else {
            await db.query("INSERT INTO stock_diario_hi (idProduccion , idLote , Edad , cantidadTipoA, cantidadTipoB, cantidadTipoB1, cantidadTipoC, tipoMovimiento, fechaRegistro) values(?,?,?,?,?,?,?,?,?)",
                [Huevos.idProduccion, Huevos.idLote, Huevos.Edad, Huevos.HI_A, Huevos.HI_B, Huevos.HI_B1, Huevos.HI_C, 'I', fechaDB])
        }
        //MENSUAL
        let shim = await db.query("SELECT * FROM stock_mensual_hi WHERE idLote = ? and year = ? and month = ?",
            [Huevos.idLote, yyyy, mm])
        if (shim.length == 0) {
            await db.query(`INSERT INTO stock_mensual_hi (
                idProduccion, idLote, year, month) 
                VALUES (?,?,?,?)`,
                [Huevos.idProduccion, Huevos.idLote, yyyy, mm])
        }

        //ACTUALIZANDO STOCK HUEVO COMERCIAL
        //DIARIO
        let hc = await db.query("SELECT * FROM stock_diario_hc WHERE idLote = ? and Edad = ? and tipoMovimiento = ?",
            [Huevos.idLote, Huevos.Edad, 'I'])
        if (hc.length != 0) {
            await db.query(`UPDATE stock_diario_hc SET
                cantidadTipoNormal = ?, cantidadTipoDY = ?
                WHERE idLote = ? and Edad = ? and tipoMovimiento = ?`,
                [Huevos.HNI_Comercial, Huevos.HNI_DY, Huevos.idLote, Huevos.Edad, 'I'])
        } else {
            await db.query("INSERT INTO stock_diario_hc (idProduccion , idLote , Edad , cantidadTipoNormal, cantidadTipoDY, tipoMovimiento, fechaRegistro) values(?,?,?,?,?,?,?)",
                [Huevos.idProduccion, Huevos.idLote, Huevos.Edad, Huevos.HNI_Comercial, Huevos.HNI_DY, 'I', fechaDB])
        }
        //MENSUAL
        let shcm = await db.query("SELECT * FROM stock_mensual_hc WHERE idLote = ? and year = ? and month = ?",
            [Huevos.idLote, yyyy, mm])
        if (shcm.length == 0) {
            await db.query(`INSERT INTO stock_mensual_hc (
                idProduccion, idLote, year, month)
                VALUES (?,?,?,?)`,
                [Huevos.idProduccion, Huevos.idLote, yyyy, mm])
        }

        return;
    },
    updateHuevosModalSem: async function (Huevos) {
        function isNan_Custom(param) {
            if (isNaN(param)) {
                return 0;
            } else {
                return param;
            }
        }
        let semana_prod = Math.ceil(Huevos.Edad / 7);
        let semana = semana_prod + 24;
        let respuesta1 = await db.query("SELECT Num_Aves_Fin_Levante FROM lotes WHERE idProduccion = ? and idLote = ?", [Huevos.idProduccion, Huevos.idLote]);
        let Num_Aves_Fin_Levante = respuesta1[0].Num_Aves_Fin_Levante;
        let respuesta2 = await db.query("SELECT saldo_fin_sem FROM mortalidad_prod_sem WHERE idProduccion = ? and idLote = ? and semana_prod = ?", [Huevos.idProduccion, Huevos.idLote, semana_prod]);
        let saldo_fin_sem = respuesta2[0].saldo_fin_sem;
        console.log("s", saldo_fin_sem)
        let count2 = await db.query("SELECT * FROM produccion_huevos_sem WHERE idProduccion = ? and idLote = ? and semana_prod = ?", [Huevos.idProduccion, Huevos.idLote, semana_prod]);
        if (count2.length == 0) {
            if (semana_prod == 1) {
                let Acum_x_Gall = (Huevos.TotalDiarioProd_Huevo / Num_Aves_Fin_Levante).toFixed(2);
                let Acum_Gall_Encase = (Huevos.TotalHI / Num_Aves_Fin_Levante).toFixed(2);
                let Act_Avedia = (((Huevos.TotalDiarioProd_Huevo / saldo_fin_sem) * 100) / 7).toFixed(2);
                await db.query("INSERT INTO produccion_huevos_sem (idProduccion, IdLote, Semana, semana_prod, Act_Avedia, TotalSemProd_Huevo, TotalSemProd_Huevo_Acum, Acum_x_Gall, Acum_Gall_Encase, HI_A, PorcHI_A, HI_B, PorcHI_B, HI_B1, PorcHI_B1, HI_C, PorcHI_C, TotalHI, TotalHI_Acum, PorHI, HNI_Comercial, HNI_DY, TotalHNI_Comercial, HNI_Roto, HNI_Farf, HNI_Elim, TotalHNI_REF, PorcHNI_REF, HNI_PruebaFert, TotalSem_Contable,PorcHNI_Comercial,PorcHNI_DY,PorcHNI_Total_Comercial) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                    [Huevos.idProduccion, Huevos.idLote, semana, semana_prod, Act_Avedia, Huevos.TotalDiarioProd_Huevo, Huevos.TotalDiarioProd_Huevo, Acum_x_Gall, Acum_Gall_Encase, Huevos.HI_A, Huevos.PorcHI_A, Huevos.HI_B, Huevos.PorcHI_B, Huevos.HI_B1, Huevos.PorcHI_B1,
                    Huevos.HI_C, Huevos.PorcHI_C, Huevos.TotalHI, Huevos.TotalHI, Huevos.PorHI, Huevos.HNI_Comercial, Huevos.HNI_DY, Huevos.TotalHNI_Comercial, Huevos.HNI_Roto, Huevos.HNI_Farf, Huevos.HNI_Elim, Huevos.TotalHNI_REF, Huevos.PorcHNI_REF, 0, Huevos.TotalDiario_Contable, Huevos.PorcHNI_Comercial, Huevos.PorcHNI_DY, Huevos.PorcHNI_Total_Comercial]);
            } else {
                let res = await db.query("SELECT * FROM produccion_huevos_sem WHERE idProduccion = ? and idLote = ? and semana_prod = ?", [Huevos.idProduccion, Huevos.idLote, (semana_prod - 1)]);
                let TotalSemProd_Huevo_Acum = (res[0].TotalSemProd_Huevo_Acum) + Huevos.TotalDiarioProd_Huevo;
                let TotalHI_Acum = res[0].TotalHI_Acum + Huevos.TotalHI;
                let Acum_x_Gall = (TotalSemProd_Huevo_Acum / Num_Aves_Fin_Levante).toFixed(2);
                let Acum_Gall_Encase = (TotalHI_Acum / Num_Aves_Fin_Levante).toFixed(2);
                let Act_Avedia = (((Huevos.TotalDiarioProd_Huevo / saldo_fin_sem) * 100) / 7).toFixed(2);
                await db.query("INSERT INTO produccion_huevos_sem (idProduccion, IdLote, Semana, semana_prod, Act_Avedia, TotalSemProd_Huevo, TotalSemProd_Huevo_Acum, Acum_x_Gall, Acum_Gall_Encase, HI_A, PorcHI_A, HI_B, PorcHI_B, HI_B1, PorcHI_B1, HI_C, PorcHI_C, TotalHI, TotalHI_Acum, PorHI, HNI_Comercial, HNI_DY, TotalHNI_Comercial, HNI_Roto, HNI_Farf, HNI_Elim, TotalHNI_REF, PorcHNI_REF, HNI_PruebaFert, TotalSem_Contable,PorcHNI_Comercial,PorcHNI_DY,PorcHNI_Total_Comercial) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                    [Huevos.idProduccion, Huevos.idLote, semana, semana_prod, Act_Avedia, Huevos.TotalDiarioProd_Huevo, TotalSemProd_Huevo_Acum, Acum_x_Gall, Acum_Gall_Encase, Huevos.HI_A, Huevos.PorcHI_A, Huevos.HI_B, Huevos.PorcHI_B, Huevos.HI_B1, Huevos.PorcHI_B1,
                    Huevos.HI_C, Huevos.PorcHI_C, Huevos.TotalHI, TotalHI_Acum, Huevos.PorHI, Huevos.HNI_Comercial, Huevos.HNI_DY, Huevos.TotalHNI_Comercial, Huevos.HNI_Roto, Huevos.HNI_Farf, Huevos.HNI_Elim, Huevos.TotalHNI_REF, Huevos.PorcHNI_REF, 0, Huevos.TotalDiario_Contable, Huevos.PorcHNI_Comercial, Huevos.PorcHNI_DY, Huevos.PorcHNI_Total_Comercial]);
            }
        } else {
            if (semana_prod == 1) {
                let count = await db.query("SELECT SUM(TotalDiarioProd_Huevo) AS TotalSemProd_Huevo, SUM(HI_A) as HI_A, SUM(HI_B) as HI_B, SUM(HI_B1) as HI_B1, SUM(HI_C) as HI_C, SUM(TotalHI) as TotalHI, SUM(HNI_Comercial) as HNI_Comercial, SUM(HNI_DY) as HNI_DY, SUM(TotalHNI_Comercial) as TotalHNI_Comercial, SUM(HNI_Roto) as HNI_Roto, SUM(HNI_Farf) as HNI_Farf, SUM(HNI_Elim) as HNI_Elim, SUM(TotalHNI_REF) as TotalHNI_REF, SUM(HNI_PruebaFert) as HNI_PruebaFert, SUM(TotalDiario_Contable) as TotalSem_Contable FROM `produccion_huevos_det` WHERE idProduccion = ? and idLote = ? and semana_prod = ?",
                    [Huevos.idProduccion, Huevos.idLote, semana_prod]);
                let res = count[0];
                let TotalSemProd_Huevo = res.TotalSemProd_Huevo;
                let HI_A = res.HI_A;
                let PorcHI_A = (isNan_Custom(HI_A / TotalSemProd_Huevo) * 100).toFixed(2)
                let HI_B = res.HI_B;
                let PorcHI_B = (isNan_Custom(HI_B / TotalSemProd_Huevo) * 100).toFixed(2)
                let HI_B1 = res.HI_B1;
                let PorcHI_B1 = (isNan_Custom(HI_B1 / TotalSemProd_Huevo) * 100).toFixed(2)
                let HI_C = res.HI_C;
                let PorcHI_C = (isNan_Custom(HI_C / TotalSemProd_Huevo) * 100).toFixed(2)
                let TotalHI = res.TotalHI;
                let PorcHI = (isNan_Custom(TotalHI / TotalSemProd_Huevo) * 100).toFixed(2)
                let HNI_Comercial = res.HNI_Comercial;
                let PorcHNI_Comercial = (isNan_Custom(HNI_Comercial / TotalSemProd_Huevo) * 100).toFixed(2)
                let HNI_DY = res.HNI_DY;
                let PorcHNI_DY = (isNan_Custom(HNI_DY / TotalSemProd_Huevo) * 100).toFixed(2)
                let TotalHNI_Comercial = res.TotalHNI_Comercial;
                let PorcTotalHNI_Comercial = (isNan_Custom(TotalHNI_Comercial / TotalSemProd_Huevo) * 100).toFixed(2)
                let HNI_Roto = res.HNI_Roto;
                let HNI_Farf = res.HNI_Farf;
                let HNI_Elim = res.HNI_Elim;
                let TotalHNI_REF = res.TotalHNI_REF;
                let PorcTotalHNI_REF = (isNan_Custom(TotalHNI_REF / TotalSemProd_Huevo) * 100).toFixed(2)
                let HNI_PruebaFert = res.HNI_PruebaFert;
                let TotalSem_Contable = res.TotalSem_Contable;
                let Acum_x_Gall = isNan_Custom(TotalSemProd_Huevo / Num_Aves_Fin_Levante).toFixed(2);
                let Acum_Gall_Encase = isNan_Custom(TotalHI / Num_Aves_Fin_Levante).toFixed(2);
                let Act_Avedia = ((isNan_Custom(TotalSemProd_Huevo / saldo_fin_sem) * 100) / 7).toFixed(2);

                await db.query("UPDATE produccion_huevos_sem SET Act_Avedia = ?, Acum_x_Gall = ?, Acum_Gall_Encase = ?, TotalSemProd_Huevo = ?, TotalSemProd_Huevo_Acum = ?, TotalHI_Acum = ?, "
                    + "HI_A = ?, PorcHI_A = ?, HI_B = ?, PorcHI_B = ?, HI_B1 = ?, PorcHI_B1 = ?, HI_C = ?, PorcHI_C = ?, TotalHI = ?, PorHI= ?, "
                    + "HNI_Comercial = ?, PorcHNI_Comercial = ?, HNI_DY = ?, PorcHNI_DY = ?, TotalHNI_Comercial = ?, PorcHNI_Total_Comercial = ?, "
                    + "HNI_Roto = ?, HNI_Farf = ?, HNI_Elim = ?, TotalHNI_REF = ?, PorcHNI_REF = ?, HNI_PruebaFert = ?, TotalSem_Contable = ? "
                    + "WHERE idLote = ? and idProduccion = ? and semana_prod = ? and Semana = ?",
                    [Act_Avedia, Acum_x_Gall, Acum_Gall_Encase, TotalSemProd_Huevo, TotalSemProd_Huevo, TotalHI, HI_A, PorcHI_A, HI_B, PorcHI_B, HI_B1, PorcHI_B1, HI_C, PorcHI_C, TotalHI, PorcHI,
                        HNI_Comercial, PorcHNI_Comercial, HNI_DY, PorcHNI_DY, TotalHNI_Comercial, PorcTotalHNI_Comercial,
                        HNI_Roto, HNI_Farf, HNI_Elim, TotalHNI_REF, PorcTotalHNI_REF, HNI_PruebaFert, TotalSem_Contable,
                        Huevos.idLote, Huevos.idProduccion, semana_prod, semana])
            } else {
                let count = await db.query("SELECT SUM(TotalDiarioProd_Huevo) AS TotalSemProd_Huevo, SUM(HI_A) as HI_A, SUM(HI_B) as HI_B, SUM(HI_B1) as HI_B1, SUM(HI_C) as HI_C, SUM(TotalHI) as TotalHI, SUM(HNI_Comercial) as HNI_Comercial, SUM(HNI_DY) as HNI_DY, SUM(TotalHNI_Comercial) as TotalHNI_Comercial, SUM(HNI_Roto) as HNI_Roto, SUM(HNI_Farf) as HNI_Farf, SUM(HNI_Elim) as HNI_Elim, SUM(TotalHNI_REF) as TotalHNI_REF, SUM(HNI_PruebaFert) as HNI_PruebaFert, SUM(TotalDiario_Contable) as TotalSem_Contable FROM `produccion_huevos_det` WHERE idProduccion = ? and idLote = ? and semana_prod = ?",
                    [Huevos.idProduccion, Huevos.idLote, semana_prod]);
                let res = count[0];
                let TotalSemProd_Huevo = res.TotalSemProd_Huevo;
                let HI_A = res.HI_A;
                let PorcHI_A = (isNan_Custom(HI_A / TotalSemProd_Huevo) * 100).toFixed(2)
                let HI_B = res.HI_B;
                let PorcHI_B = (isNan_Custom(HI_B / TotalSemProd_Huevo) * 100).toFixed(2)
                let HI_B1 = res.HI_B1;
                let PorcHI_B1 = (isNan_Custom(HI_B1 / TotalSemProd_Huevo) * 100).toFixed(2)
                let HI_C = res.HI_C;
                let PorcHI_C = (isNan_Custom(HI_C / TotalSemProd_Huevo) * 100).toFixed(2)
                let TotalHI = res.TotalHI;
                let PorcHI = (isNan_Custom(TotalHI / TotalSemProd_Huevo) * 100).toFixed(2)
                let HNI_Comercial = res.HNI_Comercial;
                let PorcHNI_Comercial = (isNan_Custom(HNI_Comercial / TotalSemProd_Huevo) * 100).toFixed(2)
                let HNI_DY = res.HNI_DY;
                let PorcHNI_DY = (isNan_Custom(HNI_DY / TotalSemProd_Huevo) * 100).toFixed(2)
                let TotalHNI_Comercial = res.TotalHNI_Comercial;
                let PorcTotalHNI_Comercial = (isNan_Custom(TotalHNI_Comercial / TotalSemProd_Huevo) * 100).toFixed(2)
                let HNI_Roto = res.HNI_Roto;
                let HNI_Farf = res.HNI_Farf;
                let HNI_Elim = res.HNI_Elim;
                let TotalHNI_REF = res.TotalHNI_REF;
                let PorcTotalHNI_REF = (isNan_Custom(TotalHNI_REF / TotalSemProd_Huevo) * 100).toFixed(2)
                let HNI_PruebaFert = res.HNI_PruebaFert;
                let TotalSem_Contable = res.TotalSem_Contable;
                let Act_Avedia = ((isNan_Custom(TotalSemProd_Huevo / saldo_fin_sem) * 100) / 7).toFixed(2);

                let res2 = await db.query("SELECT * FROM produccion_huevos_sem WHERE idProduccion = ? and idLote = ? and semana_prod = ?", [Huevos.idProduccion, Huevos.idLote, (semana_prod - 1)])
                let TotalSemProd_Huevo_Acum = (res2[0].TotalSemProd_Huevo_Acum) + TotalSemProd_Huevo;
                let TotalHI_Acum = res2[0].TotalHI_Acum + TotalHI;
                let Acum_x_Gall = isNan_Custom(TotalSemProd_Huevo_Acum / Num_Aves_Fin_Levante).toFixed(2);
                let Acum_Gall_Encase = isNan_Custom(TotalHI_Acum / Num_Aves_Fin_Levante).toFixed(2);
                await db.query("UPDATE produccion_huevos_sem SET Act_Avedia = ? ,Acum_x_Gall = ?, Acum_Gall_Encase = ?, TotalSemProd_Huevo = ?, TotalSemProd_Huevo_Acum = ?, TotalHI_Acum = ?, "
                    + "HI_A = ?, PorcHI_A = ?, HI_B = ?, PorcHI_B = ?, HI_B1 = ?, PorcHI_B1 = ?, HI_C = ?, PorcHI_C = ?, TotalHI = ?, PorHI= ?, "
                    + "HNI_Comercial = ?, PorcHNI_Comercial = ?, HNI_DY = ?, PorcHNI_DY = ?, TotalHNI_Comercial = ?, PorcHNI_Total_Comercial = ?, "
                    + "HNI_Roto = ?, HNI_Farf = ?, HNI_Elim = ?, TotalHNI_REF = ?, PorcHNI_REF = ?, HNI_PruebaFert = ?, TotalSem_Contable = ? "
                    + "WHERE idLote = ? and idProduccion = ? and semana_prod = ? and Semana = ?",
                    [Act_Avedia, Acum_x_Gall, Acum_Gall_Encase, TotalSemProd_Huevo, TotalSemProd_Huevo_Acum, TotalHI_Acum, HI_A, PorcHI_A, HI_B, PorcHI_B, HI_B1, PorcHI_B1, HI_C, PorcHI_C, TotalHI, PorcHI,
                        HNI_Comercial, PorcHNI_Comercial, HNI_DY, PorcHNI_DY, TotalHNI_Comercial, PorcTotalHNI_Comercial,
                        HNI_Roto, HNI_Farf, HNI_Elim, TotalHNI_REF, PorcTotalHNI_REF, HNI_PruebaFert, TotalSem_Contable,
                        Huevos.idLote, Huevos.idProduccion, semana_prod, semana]);
            }
        }
        return;
    },
    getStandardHembra: async function () {
        return await db.query("SELECT * FROM standard_prod_hembra");
    },
    getStandardMacho: async function () {
        return await db.query("SELECT * FROM standard_prod_macho");
    },
    updateHuevosModalSemSTD: async function (Huevos) {
        let semana_prod = Math.ceil(Huevos.Edad / 7);
        let semana = semana_prod + 24;
        let query
        if (Huevos.TipoGenero == "LH") {
            query = "SELECT TotalHGallinaEnc_Acum, Prodtot_Sem, HIGallinaEnc_Acum FROM standard_prod_hembra WHERE idProd = ?";
            let respuesta2 = await db.query(query, [semana_prod]);
            let TotalHGallinaEnc_Acum = respuesta2[0].TotalHGallinaEnc_Acum
            let Prodtot_Sem = respuesta2[0].Prodtot_Sem
            let HIGallinaEnc_Acum = respuesta2[0].HIGallinaEnc_Acum
            await db.query("UPDATE produccion_huevos_sem set STD_Acum_Gall = ?, STD_Act_Avedia = ?, STD_HI = ? WHERE idLote = ? and idProduccion = ? and semana_prod = ? and Semana = ?",
                [TotalHGallinaEnc_Acum, Prodtot_Sem, HIGallinaEnc_Acum, Huevos.idLote, Huevos.idProduccion, semana_prod, semana])
        } else {
            query = "SELECT Total_H_GallinaEnc_Acum, ProdTotal_Std, HI_GallinaEnc_Acum FROM standard_prod_macho WHERE idProd = ?";
            let respuesta2 = await db.query(query, [semana_prod]);
            let Total_H_GallinaEnc_Acum = respuesta2[0].Total_H_GallinaEnc_Acum
            let ProdTotal_Std = respuesta2[0].ProdTotal_Std
            let HI_GallinaEnc_Acum = respuesta2[0].HI_GallinaEnc_Acum
            await db.query("UPDATE produccion_huevos_sem set STD_Acum_Gall = ?, STD_Act_Avedia = ?, STD_HI = ? WHERE idLote = ? and idProduccion = ? and semana_prod = ? and Semana = ?",
                [Total_H_GallinaEnc_Acum, ProdTotal_Std, HI_GallinaEnc_Acum, Huevos.idLote, Huevos.idProduccion, semana_prod, semana])
        }
    },
    ProcedureHuevos: async function (Huevos) {
        await db.query("CALL refreshStockMensualHI(?,?)", [Huevos.idLote, Huevos.Edad])
        await db.query("CALL refreshStockMensualHC(?,?)", [Huevos.idLote, Huevos.Edad])
    },
    cocina: async function (idLote) {
        let res_Edad = await db.query("SELECT MAX(Edad) as Max_Edad FROM produccion_huevos_det WHERE IdLote = ?",
            [idLote])
        let Edad = res_Edad[0].Max_Edad;
        if (Edad != null) {
            console.log('Edad :', Edad);
            for (let i = 1; i <= Edad; i++) {
                let rows = await db.query(`SELECT * FROM produccion_huevos_det WHERE idLote = ? and Edad = ?`,
                    [idLote, i]);
                let Huevos = rows[0]
                let f = Huevos.fechaRegistro.split('-');
                let fechaDB = f[2] + "-" + f[1] + "-" + f[0];
                let yyyy = f[2];
                let mm = f[1];
                Huevos.idLote = Huevos.IdLote;
                console.log('Huevos :', Huevos);

                //ACTUALIZANDO STOCK HUEVO INCUBABLE
                //DIARIO
                let hi = await db.query("SELECT * FROM stock_diario_hi WHERE idLote = ? and Edad = ? and tipoMovimiento = ?",
                    [Huevos.idLote, Huevos.Edad, 'I'])
                if (hi.length != 0) {
                    await db.query(`UPDATE stock_diario_hi SET
                        cantidadTipoA = ?, cantidadTipoB = ?, cantidadTipoB1 = ?, cantidadTipoC = ?
                        WHERE idLote = ? and Edad = ? and tipoMovimiento = ?`,
                        [Huevos.HI_A, Huevos.HI_B, Huevos.HI_B1, Huevos.HI_C, Huevos.idLote, Huevos.Edad, 'I'])
                } else {
                    await db.query("INSERT INTO stock_diario_hi (idProduccion , idLote , Edad , cantidadTipoA, cantidadTipoB, cantidadTipoB1, cantidadTipoC, tipoMovimiento, fechaRegistro) values(?,?,?,?,?,?,?,?,?)",
                        [Huevos.idProduccion, Huevos.idLote, Huevos.Edad, Huevos.HI_A, Huevos.HI_B, Huevos.HI_B1, Huevos.HI_C, 'I', fechaDB])
                }
                //MENSUAL
                let shim = await db.query("SELECT * FROM stock_mensual_hi WHERE idLote = ? and year = ? and month = ?",
                    [Huevos.idLote, yyyy, mm])
                if (shim.length == 0) {
                    await db.query(`INSERT INTO stock_mensual_hi (
                        idProduccion, idLote, year, month) 
                        VALUES (?,?,?,?)`,
                        [Huevos.idProduccion, Huevos.idLote, yyyy, mm])
                }

                //ACTUALIZANDO STOCK HUEVO COMERCIAL
                //DIARIO
                let hc = await db.query("SELECT * FROM stock_diario_hc WHERE idLote = ? and Edad = ? and tipoMovimiento = ?",
                    [Huevos.idLote, Huevos.Edad, 'I'])
                if (hc.length != 0) {
                    await db.query(`UPDATE stock_diario_hc SET
                        cantidadTipoNormal = ?, cantidadTipoDY = ?
                        WHERE idLote = ? and Edad = ? and tipoMovimiento = ?`,
                        [Huevos.HNI_Comercial, Huevos.HNI_DY, Huevos.idLote, Huevos.Edad, 'I'])
                } else {
                    await db.query("INSERT INTO stock_diario_hc (idProduccion , idLote , Edad , cantidadTipoNormal, cantidadTipoDY, tipoMovimiento, fechaRegistro) values(?,?,?,?,?,?,?)",
                        [Huevos.idProduccion, Huevos.idLote, Huevos.Edad, Huevos.HNI_Comercial, Huevos.HNI_DY, 'I', fechaDB])
                }
                //MENSUAL
                let shcm = await db.query("SELECT * FROM stock_mensual_hc WHERE idLote = ? and year = ? and month = ?",
                    [Huevos.idLote, yyyy, mm])
                if (shcm.length == 0) {
                    await db.query(`INSERT INTO stock_mensual_hc (
                        idProduccion, idLote, year, month)
                        VALUES (?,?,?,?)`,
                        [Huevos.idProduccion, Huevos.idLote, yyyy, mm])
                }

                await db.query("CALL refreshStockMensualHI(?,?)", [Huevos.idLote, Huevos.Edad])
                await db.query("CALL refreshStockMensualHC(?,?)", [Huevos.idLote, Huevos.Edad])
            }
        }
        return;
    },
    SalidasHC: async (Data) => {
        let json = {}
        try {
            let rows = await db.query(`INSERT INTO salidas_huevos_comerciales ( idLote, TipoOperacion, idCliente, RUC,
            Nombre, TipoCliente, NroDocumento, Fecha, CantidadNormal, PesoNormal, CantidadDY, PesoDY,Cantidad) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`, [Data.idLote, Data.TipoOperacion.Inicial,
            Data.Cliente.CL_CCODCLI.trim(), Data.Cliente.CL_CNUMRUC, Data.Cliente.CL_CNOMCLI,
            Data.Cliente.TipoCliente, Data.NroDocumento, new Date(Data.Fecha), Data.CantidadNormal,
            Data.PesoNormal, Data.CantidadDY, Data.PesoDY, (Data.CantidadNormal + Data.CantidadDY)])
            json = {
                success: true,
                message: "Registro de Salida HC realizado correctamente",
                icon: "success"
            }
        } catch (error) {
            console.log('error :>> ', error);
            json = {
                success: false,
                message: "Error en la ruta /produccionHuevos/SalidasHC",
                error: error.code,
                icon: "error"
            }
        }
        return json
    }
}

module.exports = produccionHuevos;