const moment = require('moment');
var db = require('../dbconnection');
const mysql = require("../dbconnectionPromise");
const { poolPromise } = require('../dbconnectionMSSQL')
var Excel = require('exceljs')
var workbook = new Excel.Workbook()
var sendEmailModel = require('./sendEmail');
const requerimientoModel = require("./requerimientos");
const { Buffer } = require('buffer');

var periodoF33 = {
    getAllPeriodos: async function () {
        return await db.query("SELECT * FROM periodo_f33 pe INNER JOIN usuario us ON us.idUsuario = pe.idUsuario");
    },
    getPeriodosEstado1: async function () {
        return await db.query("SELECT * FROM periodo_f33 WHERE Estado = 1");
    },
    addPeriodo: async function (periodoF33) {
        let YearMonth = periodoF33.Year + periodoF33.Month;
        console.log('body', periodoF33)
        //return
        let json = {
            success: true,
            message: 'Se registró correctamente'
        }

        try {
            await db.query("INSERT INTO periodo_f33(YearMonth, Year, Month, Estado, idUsuario, FechaModificar, FechaInicio, FechaFin) VALUES (?,?,?,?,?,?,?,?)", [YearMonth, periodoF33.Year, periodoF33.Month, 1, periodoF33.user, new Date(), periodoF33.FechaInicio, periodoF33.FechaFin])
        } catch (error) {
            json.success = false;
            if (error.message.toString().startsWith("ER_DUP_ENTRY: Duplicate entry")) {
                json.message = "Ya tienes un registro para el periodo " + YearMonth;
            }
        }

        return json;
    },
    Getperiodo: async function () {
        let rows = await db.query("SELECT * FROM periodo_f33 GROUP BY Year ORDER BY Year");
        return rows;
    },
    desactivatePeriodos: async function (Periodo) {
        await db.query("UPDATE periodo_f33 SET Estado = ?, FechaModificar = ? WHERE YearMonth = ?", [0, new Date(), Periodo.YearMonth]);
    },
    getPeriodosByPeriodo: async function (periodoF33) {
        let rows = await db.query("SELECT * FROM periodo_f33 WHERE YearMonth = ?", [periodoF33]);
        return rows[0];
    },
    periodoIsOpen: async function (periodo) {
        let rows = await db.query("SELECT * FROM periodo_f33 WHERE YearMonth = ?", [periodo]);
        return rows[0] ? rows[0].Estado == 1 : false;
    },

    getCartilla: async function (Data) {

        let json = {}
        try {
            let { idLevante, tipo, TipoCartilla, periodo } = Data;

            let cons_prod = await db.query(`SELECT idProduccion FROM produccion WHERE idLevante = ?`, [idLevante])

            let cons_lotes = await db.query(`SELECT idLevante, NumHembras AS NroAvesInicio
            FROM lotes WHERE idLevante = ?;`, [idLevante])

            let NroAvesInicioLH = 0
            let NroAvesInicioLM = 0
            if (cons_lotes.length != 0) {
                NroAvesInicioLH = cons_lotes[0].NroAvesInicio;
                NroAvesInicioLM = cons_lotes[0].NroAvesInicio;
            }

            var count_of_lotes = cons_lotes.length;

            let idProduccion = null;
            if (cons_prod.length != 0) {
                idProduccion = cons_prod[0].idProduccion;
            }
            //Se sacan la mortalidad_det 
            let periodosMortalidad = [];
            //if(tipo == 'L'){
            periodosMortalidad = await db.query(`SELECT SUBSTR(REPLACE(fecha,'-',''), 1, 6) as Periodo,
            COUNT(DISTINCT(Semana)) AS rowspan FROM mortalidad_det ms 
            WHERE ms.idLevante = ? GROUP BY Periodo`, [idLevante])
            //}
            //si tenemos produccion se saca la mortalidad_prod_det
            // y se aumenta el rowspan que es la cantidad de filas
            // que se espera
            if (idProduccion != null) {
                let periodosMortalidad_prod = await db.query(`SELECT SUBSTR(REPLACE(fecha,'-',''), 1, 6) as Periodo,
                COUNT(DISTINCT(Semana)) AS rowspan FROM mortalidad_prod_det ms 
                WHERE ms.idProduccion = ? GROUP BY Periodo`, [idProduccion])

                for (let i = 0; i < periodosMortalidad_prod.length; i++) {
                    const p_prod = periodosMortalidad_prod[i];
                    let exist = false
                    for (let j = 0; j < periodosMortalidad.length; j++) {
                        const p = periodosMortalidad[j];
                        if (p_prod.Periodo == p.Periodo) {
                            p.rowspan = p.rowspan + p_prod.rowspan;
                            exist = true;
                        }
                    }
                    if (exist != true) {
                        periodosMortalidad.push(p_prod);
                    }
                }
            }
            periodosMortalidad.forEach(e => {
                e.exist = false;
                e.rowspan = 0;
            })
            var rowsMortalidad_prod = [];
            if (TipoCartilla.title == "Mortalidad") {
                let rowsMortalidad = [];
                //if(tipo == 'L'){
                rowsMortalidad = await db.query(`
                    SELECT fecha,
                    ms.idMortalidadDet,
                    lo.TipoGenero,
                    lo.lote_str NombreLote,
                    lo.idLote as idLote,
                    lo.lote Lote,
                    ms.idLevante,
                    ms.Semana,
                    SUBSTR(REPLACE(fecha,'-',''), 1, 6) as Periodo,
                    0 as rowspan,
                    #MIN(fecha) as MinimaFecha,
                    #MAX(fecha) as MaximaFecha,
                    DAY(ms.fecha) as RangoFecha,
                    0 AS NroAvesInicioLH,
                    ms.NoAves AS MortalidadLH,
                    ms.NoEliminados as DescartesLH, 
                    ms.ErSex + ms.SelGen as VentasLH,
                    0 as IngresosLH,
                    0 as NroAvesFinalLH,
                    0 AS NroAvesInicioLM,
                    ms.NoAves AS MortalidadLM,
                    ms.NoEliminados as DescartesLM,
                    ms.ErSex + ms.SelGen as VentasLM,
                    0 as IngresosLM,
                    0 as NroAvesFinalLM
                    FROM mortalidad_det ms
                    INNER JOIN lotes lo ON lo.idLote = ms.idLote WHERE ms.idLevante = ?
                    #AND SUBSTR(REPLACE(fecha,'-',''), 1, 6) = ?
                    ORDER BY ms.fecha;`,
                    //[idLevante,periodo])
                    [idLevante])
                //}
                if (idProduccion != null) {
                    rowsMortalidad_prod = await db.query(`
                    SELECT
                    ms.idMortalidadDet,
                    fecha,
                    lo.TipoGenero,
                    lo.idLote as idLote,
                    lo.lote Lote,
                    lo.lote_str as NombreLote,
                    ms.idProduccion,
                    ms.Semana,
                    SUBSTR(REPLACE(fecha,'-',''), 1, 6) as Periodo,
                    0 as rowspan,
                    DAY(ms.fecha) as RangoFecha,
                    #MIN(fecha) as MinimaFecha,
                    #MAX(fecha) as MaximaFecha,
                    0 AS NroAvesInicioLH,
                    ms.NoAves AS MortalidadLH, 
                    ms.NoEliminados as DescartesLH,
                    0 as VentasLH,
                    0 as IngresosLH,
                    0 as NroAvesFinalLH,
                    0 AS NroAvesInicioLM,
                    ms.NoAves AS MortalidadLM,
                    ms.NoEliminados as DescartesLM,
                    0 as VentasLM,
                    0 as IngresosLM,
                    0 as NroAvesFinalLM
                    FROM mortalidad_prod_det ms
                    INNER JOIN lotes lo ON lo.idLote = ms.idLote WHERE ms.idProduccion = ?
                    #AND SUBSTR(REPLACE(fecha,'-',''), 1, 6) = ?
                    ORDER BY ms.fecha`, [idProduccion]);
                    if (rowsMortalidad_prod.length != 0) {
                        for (let i = 0; i < rowsMortalidad_prod.length; i++) {
                            const rMp = rowsMortalidad_prod[i];
                            let cons_ven_ing = await db.query(`
                            SELECT
                            SUM(T.TrasladoLH) AS TrasladoLH, 
                            SUM(T.Cant_IngresoLH) AS Cant_IngresoLH,
                            SUM(T.VentasLH) AS VentasLH,
                            SUM(T.TrasladoLM) AS TrasladoLM,
                            SUM(T.Cant_IngresoLM) AS Cant_IngresoLM,
                            SUM(T.VentasLM) AS VentasLM
                            FROM(SELECT COALESCE(SUM(IF(lo.TipoGenero = "LH",
                            tsv.Traslado, 0)),0) AS TrasladoLH,
                            COALESCE(SUM(IF(lo.TipoGenero = "LH",tsv.Venta, 0)),0) AS VentasLH, 
                            0 AS Cant_IngresoLH, 
                            COALESCE(SUM(IF(lo.TipoGenero = "LM",tsv.Traslado,0)),0) AS TrasladoLM, 
                            COALESCE(SUM(IF(lo.TipoGenero = "LM",tsv.Venta, 0)),0) AS VentasLM,
                            0 AS Cant_IngresoLM 
                            FROM traslado_ingreso_ventas tsv
                            INNER JOIN lotes lo ON lo.idLote = tsv.idLoteOrigen
                            WHERE idProduccionOrigen = ? AND Fecha = ? AND lo.idLote = ? 
                            
                            UNION
                            
                            SELECT 
                            0 AS TrasladoLH,
                            0 AS VentaLH, 
                            COALESCE(SUM(IF(lo.TipoGenero = "LH",tsv.Cant_Ingreso, 0)),0) AS Cant_IngresoLH, 
                            0 AS TrasladoLM, 
                            0 AS VentaLM, 
                            COALESCE(SUM(IF(lo.TipoGenero = "LM",tsv.Cant_Ingreso, 0)),0) AS Cant_IngresoLM
                            FROM traslado_ingreso_ventas tsv 
                            INNER JOIN lotes lo ON lo.idLote = tsv.idLoteDestino
                            WHERE idProduccionDestino = ? AND Fecha = ? AND lo.idLote = ?) as T`, [idProduccion, rMp.fecha, rMp.idLote,
                                idProduccion, rMp.fecha, rMp.idLote])
                            if (cons_ven_ing.length != 0) {
                                if (rMp.TipoGenero == 'LM') {
                                    rMp.VentasLM = cons_ven_ing[0].VentasLM
                                    rMp.IngresosLM = (cons_ven_ing[0].Cant_IngresoLM - cons_ven_ing[0].TrasladoLM)
                                } else {
                                    rMp.VentasLM = cons_ven_ing[0].VentasLH
                                    rMp.IngresosLM = (cons_ven_ing[0].Cant_IngresoLH - cons_ven_ing[0].TrasladoLH)
                                }
                            }
                            rowsMortalidad.push(rMp)
                        }
                    }
                }

                var periodo_actual = {
                    rowspan: 0,
                    periodo: "",
                    init: 0
                }
                var periodos_reales = [];
                if (rowsMortalidad.length != 0) {
                    rowsMortalidad.forEach((e, i) => {
                        let stop = rowsMortalidad.length - 1;

                        if (periodo_actual.periodo == "") {
                            periodo_actual.periodo = e.Periodo;
                            periodo_actual.rowspan = periodo_actual.rowspan + 1;
                        } else {
                            if (i < stop && periodo_actual.periodo == e.Periodo) {
                                periodo_actual.periodo = e.Periodo;
                                periodo_actual.rowspan = periodo_actual.rowspan + 1;
                            } else if (i < stop && periodo_actual.periodo != e.Periodo) {
                                let obj = {
                                    periodo: periodo_actual.periodo,
                                    rowspan: periodo_actual.rowspan,
                                    init: periodo_actual.init
                                };
                                periodos_reales.push(obj);
                                periodo_actual.periodo = e.Periodo;
                                periodo_actual.rowspan = 1;
                                periodo_actual.init = i;
                            } else if (i == stop && periodo_actual.periodo == e.Periodo) {
                                periodo_actual.rowspan = periodo_actual.rowspan + 1;
                                let obj = {
                                    periodo: periodo_actual.periodo,
                                    rowspan: periodo_actual.rowspan,
                                    init: periodo_actual.init
                                };
                                periodos_reales.push(obj);
                            }
                        }
                        if (i < count_of_lotes) {
                            e.NroAvesInicio = cons_lotes[i].NroAvesInicio;
                            cons_lotes[i].NroAvesInicio = cons_lotes[i].NroAvesInicio - e.MortalidadLM - e.DescartesLM - e.VentasLM + e.IngresosLM;
                            e.NroAvesFinal = cons_lotes[i].NroAvesInicio;
                        } else {
                            let indice = (i % count_of_lotes);
                            e.NroAvesInicio = cons_lotes[indice].NroAvesInicio;
                            cons_lotes[indice].NroAvesInicio = cons_lotes[indice].NroAvesInicio - e.MortalidadLM - e.DescartesLM - e.VentasLM + e.IngresosLM;
                            e.NroAvesFinal = cons_lotes[indice].NroAvesInicio;
                        }
                        if ((typeof fecIni == "undefined" || fecIni == null) && (typeof fecFin == "undefined" || fecFin == null)) {
                            e.show = true
                        } else {
                            if (e.MinimaFecha >= new Date(fecIni) && e.MaximaFecha <= new Date(fecFin)) {
                                e.show = true
                            } else {
                                e.show = false
                            }
                        }
                    });
                }

                periodos_reales.forEach((e) => {
                    rowsMortalidad[e.init].rowspan = e.rowspan;
                    rowsMortalidad[e.init].active = true;
                })

                rowsMortalidad = rowsMortalidad.filter((value, index, arr) => {
                    if (tipo == 'P') {
                        return value.Periodo == periodo && value.idProduccion != undefined //&& value.idLevante == undefined// == periodo && value.;
                    } else if (tipo == 'L') {
                        return value.Periodo == periodo && value.idLevante != undefined //&& value.idProduccion == undefined
                    }
                });

                if (rowsMortalidad.length > 0) {
                    let pe = periodos_reales.find(e => e.periodo == rowsMortalidad[0].Periodo);
                    rowsMortalidad[0].rowspan = pe.rowspan;
                    rowsMortalidad[0].active = true;
                }

                json = {
                    success: true,
                    message: "Extracción de data realizada exitosamente.",
                    rowsMortalidad,
                    TipoCartilla: TipoCartilla.title,
                    periodos_reales: periodos_reales,
                    rowsMortalidad_prod: rowsMortalidad_prod
                }
            }
        } catch (error) {
            console.log('error :>> ', error);
            json = {
                success: false,
                message: "Error en el servidor /Cartilla/getCartilla",
                error: error.code
            }
        }
        return json;
    },
    cronDiario: async function () {
        const connection = await mysql.connection();
        try {
            var periodos = await db.query("SELECT * FROM periodo_f33 WHERE Estado = 1");


            let dataAgregar = []
            var arr_periodos = periodos.map(periodo => periodo.YearMonth);
            const levantes = await connection.query('Select * from levantes ORDER BY idLevante DESC')
            const producciones = await connection.query('Select idLevante from produccion where seleccionadoReporte=1 ORDER BY idProduccion DESC')
            for (const periodo of arr_periodos) {
                for (const levante of levantes) {
                    const { rowsMortalidad: cartillaLevante } = await this.getCartilla({
                        "idLevante": levante.idLevante,
                        "periodo": periodo,
                        "TipoCartilla": {
                            "title": "Mortalidad"
                        },
                        "tipo": "L"
                    })

                    dataAgregar = dataAgregar.concat(cartillaLevante.filter(c => c.show).map(c => ({ Data: c, tipo: "L" })))
                }

                for (const produccion of producciones) {

                    const { rowsMortalidad_prod: cartillaProduccion } = await this.getCartilla({
                        "idLevante": produccion.idLevante,
                        "periodo": periodo,
                        "TipoCartilla": {
                            "title": "Mortalidad"
                        },
                        "tipo": "P"
                    })
                    dataAgregar = dataAgregar.concat(cartillaProduccion.filter(c => c.show).map(c => ({ Data: c, tipo: "P" })))
                }
            }
            for (const data of dataAgregar) {
                await this.Agregar(data)
            }
            return {
                message: "exitoso"
            }
        } catch (error) {
            console.error(error);
        } finally {
            connection.release()
        }

    },
    Agregar: async function (Data) {
        //console.log('data -> ', Data);
        //return Data;
        var {
            idMortalidadDet, fecha, NombreLote, idLote, Lote, idLevante, Semana, Periodo, rowspan, RangoFecha,
            NroAvesInicioLH, MortalidadLH, DescartesLH, VentasLH, IngresosLH, NroAvesFinalLH, NroAvesInicioLM,
            MortalidadLM, DescartesLM, VentasLM, IngresosLM, NroAvesFinalLM, NroAvesInicio, NroAvesFinal, show,
            active, user
        } = Data.Data;

        var { user, tipo } = Data;

        var _fecha = new moment(fecha).format('YYYY-MM-DD');

        var granja = await db.query("select * from lotes where idLote = ?", [idLote]);
        if (tipo = 'L') {
            granja = granja[0].idGranja;
        } else {
            granja = granja[0].idGranjaP;
        }


        var query = await db.query(`CALL SP_INSERT_MORTALIDAD_DET (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
            Periodo, _fecha, idLote,//idgranja,
            Semana,
            // tipo null, 
            idMortalidadDet,
            //id lote
            //saldo incial
            IngresosLM, MortalidadLM, DescartesLM, VentasLM, //fin de campaña
            user, tipo, NroAvesInicio, NroAvesFinal, granja
        ]);

        return query;
    },
    cronDiarioAlimentos: async function () {

        console.log("cron diario de mortalidad");

        var periodos = await db.query("SELECT * FROM periodo_f33 WHERE Estado = 1");
        var arr_periodos = periodos.map(periodo => periodo.YearMonth);
        var periodos_ini = await db.query("SELECT MIN(FechaInicio) as fecha FROM periodo_f33 WHERE Estado = 1");
        periodos_ini = moment(periodos_ini[0].fecha).format("YYYY-MM-DD");
        var periodos_fin = await db.query("SELECT MAX(FechaFin) as fecha FROM periodo_f33 WHERE Estado = 1");
        periodos_fin = moment(periodos_fin[0].fecha).format("YYYY-MM-DD");
        var lotes_levante = await db.query(`select 'L' as tipo,l.*,ll.ccosto from lotes as l
        inner join levantes as ll on ll.idLevante = l.idLevante
        where l.idLevante in (select distinct idLevante from alimento_levante_det where Fecha>=? and Fecha<=? )`, [periodos_ini, periodos_fin]);
        var arr_levante = lotes_levante.map(lote_levante => lote_levante.idLevante);

        var lotes_produccion = await db.query(`select 'P' as tipo,l.*,p.ccosto from lotes as l
        inner join produccion as p on p.idProduccion = l.idProduccion
        where l.idProduccion in (select distinct idProduccion
        from alimento_prod_det where Fecha>=? and Fecha<=? )`, [periodos_ini, periodos_fin]);
        var arr_produccion = lotes_produccion.map(lote_produccion => lote_produccion.idLevante);
        var arr_lotes_conjunto = arr_levante.concat(arr_produccion);
        arr_lotes_conjunto = arr_lotes_conjunto.join(',');
        var levantes = await db.query('select * from levantes where idLevante in (' + arr_lotes_conjunto + ')');
        //var log = await db.query("insert into reporte_mortalidad_diaria (fecha,fechahora) values (current_date(),current_timestamp())");
        //log = await db.query("SELECT * FROM reporte_mortalidad_diaria WHERE id = ?",[log.insertId]);
        var lotes = lotes_levante.concat(lotes_produccion);
        lotes = lotes.filter((item, pos) => lotes.indexOf(item) === pos);
        //var centros_de_costo = lotes.map(lote => "'"+lote.ccosto+"'").join(',');
        var alimentos = await db.query("select * from tipo_alimento");
        var arr_alimentos = alimentos.map(alimento => alimento.codAlimento.toString().trim());

        const connection = await mysql.connection();
        var dataConfirmacionIngresosUnido = []
        const dataConfirmacionIngresos = await connection.query(`select * from  confirmacionIngresoAlimento where fecha>=? and fecha<=?`, [periodos_ini, periodos_fin]);
        //agregar el tipo e idlevante o idproduccion
        const pool = await poolPromise;

        try {
            var data = [];
            for (const periodo of arr_periodos) {
                for (const alimento of alimentos) {
                    for (const lote of lotes) {
                        var query = `exec SP_RSFACCAR_BY_YEARMONTH_STRING  '${periodo}','${alimento.codAlimento}', '${lote.ccosto}'`;
                        const semi_data = await pool.query(query);
                        if (semi_data.recordset.length > 0) {
                            //console.log(semi_data.recordset);
                            for (let index = 0; index < semi_data.recordset.length; index++) {
                                semi_data.recordset[index].tipo = lote.tipo;
                                semi_data.recordset[index].alimento = alimento.codAlimento;
                                semi_data.recordset[index].idAlimento = alimento.idAlimento;
                                semi_data.recordset[index].periodo = periodo;
                                semi_data.recordset[index].ccosto = lote.ccosto;
                                semi_data.recordset[index].idLevante = lote.idLevante;
                                semi_data.recordset[index].idProduccion = lote.idProduccion;
                                semi_data.recordset[index].lote = lote.lote;
                                semi_data.recordset[index].idLote = lote.idLote;
                                semi_data.recordset[index].idGranja = lote.idGranja;
                                semi_data.recordset[index].idGranjaP = lote.idGranjaP;
                                data.push(semi_data.recordset[index]);
                            }
                            //data = data.concat(semi_data.recordset);
                            //console.log(data);
                        }
                    }
                }
            }
            for (let i = 0; i < data.length; i++) {
                const dataConfirmacionEsofcom = data[i]
                if (dataConfirmacionEsofcom.tipo == 'L' && dataConfirmacionEsofcom.idLevante == 30 && dataConfirmacionEsofcom.idAlimento == 1) {
                    console.log('este es');
                }
                if (dataConfirmacionEsofcom.tipo == 'L') {
                    var dataConfirmacionIngresosEncontrado = dataConfirmacionIngresos.find(d => {
                        return moment(d.fecha).format("YYYY-MM-DD") == moment(dataConfirmacionEsofcom.C5_DFECDOC).add(1, "day").format("YYYY-MM-DD") && dataConfirmacionEsofcom.idAlimento == d.idAlimento && dataConfirmacionEsofcom.idLevante == d.idObjeto && dataConfirmacionEsofcom.tipo === d.tipo
                    })
                } else {
                    var dataConfirmacionIngresosEncontrado = dataConfirmacionIngresos.find(d => {
                        if (d.idProduccion != 0 || d.idProduccion != null) {
                            return moment(d.fecha).format("YYYY-MM-DD") == moment(dataConfirmacionEsofcom.C5_DFECDOC).add(1, "day").format("YYYY-MM-DD") && dataConfirmacionEsofcom.idAlimento == d.idAlimento && dataConfirmacionEsofcom.idProduccion == d.idObjeto && dataConfirmacionEsofcom.tipo === d.tipo
                        } else {
                            return false;
                        }
                    })
                }

                if (dataConfirmacionIngresosEncontrado) {
                    dataConfirmacionIngresosUnido.push({
                        ...dataConfirmacionIngresosEncontrado,
                        fecha: moment(dataConfirmacionIngresosEncontrado.fecha).format("YYYY-MM-DD"),
                        cantidadEsoftcom: dataConfirmacionEsofcom.C6_NCANTID_SUM,
                        tipo: dataConfirmacionEsofcom.tipo,
                        alimento: dataConfirmacionEsofcom.alimento,
                        idAlimento: dataConfirmacionEsofcom.idAlimento,
                        periodo: dataConfirmacionEsofcom.periodo,
                        ccosto: dataConfirmacionEsofcom.ccosto,
                        idLevante: dataConfirmacionEsofcom.idLevante,
                        idProduccion: dataConfirmacionEsofcom.idProduccion,
                        lote: dataConfirmacionEsofcom.lote,
                        idGranja: dataConfirmacionEsofcom.idGranja,
                        idGranjaP: dataConfirmacionEsofcom.idGranjaP,
                        idLote: dataConfirmacionEsofcom.idLote,
                        cantidadConfirmada: dataConfirmacionIngresosEncontrado.cantidadConfirmada
                    })
                } else {
                    dataConfirmacionIngresosUnido.push({
                        //periodo: periodo,
                        fecha: moment(dataConfirmacionEsofcom.C5_DFECDOC).add(1, "day").format("YYYY-MM-DD"),
                        cantidadEsoftcom: dataConfirmacionEsofcom.C6_NCANTID_SUM,
                        nroGuia: dataConfirmacionEsofcom.C5_CNUMDOC_CONCAT,
                        tipo: dataConfirmacionEsofcom.tipo,
                        alimento: dataConfirmacionEsofcom.alimento,
                        idAlimento: dataConfirmacionEsofcom.idAlimento,
                        periodo: dataConfirmacionEsofcom.periodo,
                        ccosto: dataConfirmacionEsofcom.ccosto,
                        idProduccion: dataConfirmacionEsofcom.idProduccion,
                        lote: dataConfirmacionEsofcom.lote,
                        idGranja: dataConfirmacionEsofcom.idGranja,
                        idGranjaP: dataConfirmacionEsofcom.idGranjaP,
                        idLevante: dataConfirmacionEsofcom.idLevante,
                        idLote: dataConfirmacionEsofcom.idLote,
                        cantidadConfirmada: null,
                    })
                }
            }
        } catch (error) {
            throw error;
        } finally {
            console.log('data estructurada');
        }

        //console.log(dataConfirmacionIngresosUnido);
        //const data = await pool.query(`exec SP_RSFACCAR_BY_YEARMONTH_STRING_MULTIPLE '${periodos_ini}','${periodos_fin}','${arr_alimentos}','${centros_de_costo}'`)
        //const data = await pool.query(`exec SP_RSFACCAR_BY_YEARMONTH_STRING_MULTIPLE '${periodos_ini}','${periodos_fin}'`)
        //
        try {
            await connection.query("START TRANSACTION");
            for (const periodo of arr_periodos) {
                await connection.query("delete from confirmacionIngresoAlimento where periodo=?", [periodo]);
            }
            //alimento
            //id
            //dataConfirmacionIngresosUnido = dataConfirmacionIngresosUnido.filter((item, pos) => dataConfirmacionIngresosUnido.indexOf(item) === pos);
            dataConfirmacionIngresosUnido = dataConfirmacionIngresosUnido.filter((thing, index, self) =>
                index === self.findIndex((t) => (
                    t.fecha === thing.fecha && t.idObjeto === thing.idObjeto && t.idAlimento === thing.idAlimento
                ))
            )
            const dataValues = dataConfirmacionIngresosUnido.map(d => [
                d.periodo,
                d.fecha,
                d.tipo == "L" ? d.idLevante : d.idProduccion,
                d.idAlimento,
                d.tipo,
                d.nroGuia,
                d.cantidadEsoftcom,
                d.cantidadConfirmada,
                0,
                new Date(),
                new Date()
            ]);
            await connection.query("insert into confirmacionIngresoAlimento(periodo,fecha,idObjeto,idAlimento,tipo,nroGuia,cantidadEsoftcom,cantidadConfirmada,idUsuario,fechaReg,fechaMod) values ? ", [dataValues])
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            console.log('data insertada en confirmacion');
        }

        try {
            var multi_data_periodo = [];
            const listaCodigoGenetico = ["L9", "L7", "L4", "L1"]
            for (const periodo of arr_periodos) {
                const momentPeriodo = moment(periodo, "YYYYMM")
                //const listaConfirmadaPorFecha = await dbAlimento.listarKardexAlimento({ alimento: alimento, periodo: periodo, lote: lote })
                var diaInicioDelMes = momentPeriodo.clone().startOf("month")
                var diaFinDelMes = momentPeriodo.clone().endOf("month")
                let data_periodo = dataConfirmacionIngresosUnido.filter(o => o.periodo === periodo);

                //multi_data_periodo.push(data_periodo);
                var arr_resultados = [];
                var alimentos_con_data = [];
                var lotes_con_data = [];
                if (data_periodo.length > 0) {
                    for (const alimento of alimentos) {

                        let data_alimento = data_periodo.filter(o => o.alimento.toString().trim() == alimento.codAlimento.toString().trim());
                        if (data_alimento.length > 0) {
                            alimentos_con_data.push(alimento);
                            for (const lote of lotes) {
                                const querySelectLevante = `select lo.idLote,lo.Sexo,lo.TipoGenero,lo.lote,lo.lote_str,concat(YEAR(aD.Fecha),LPAD(MONTH(aD.Fecha),2,'0')) periodo, aD.CantAlimento,aD.Fecha,aD.idLevante as idObjeto,aD.Semana
                                from alimento_levante_det aD inner  join lotes lo on lo.idLote=aD.idLote
                                where idAlimento=${alimento.idAlimento} and aD.idLevante = ${lote.idLevante} and concat(YEAR(aD.Fecha),LPAD(MONTH(aD.Fecha),2,'0'))=${periodo}
                                order by aD.Fecha;`
                                const querySelectProduccion = `
                                select lo.idLote,lo.Sexo,lo.TipoGenero, CONCAT(YEAR(prodDet.fecha),LPAD(MONTH(prodDet.Fecha),2,'0')) periodo,lo.lote,lo.lote_str,prodDet.Fecha,prodDet.CantAlimento,prodDet.idProduccion as idObjeto,prodDet.Semana
                                from alimento_prod_det prodDet inner join lotes lo on  lo.idLote=prodDet.idLote 
                                where prodDet.idAlimento=${alimento.idAlimento} and prodDet.idProduccion = ${lote.idProduccion} and  CONCAT(YEAR(prodDet.fecha),LPAD(MONTH(prodDet.Fecha),2,'0'))=${periodo}  order by prodDet.Fecha;`
                                const listaProduccionAlimento = await connection.query(querySelectProduccion)
                                const listaLevanteAlimento = await connection.query(querySelectLevante)
                                let data_lote = data_alimento.filter(o => o.idLote == lote.idLote);
                                if (data_lote.length > 0) {
                                    lotes_con_data.push(lote);
                                    for (const tipo of ['L', 'P']) {
                                        var levante_actual = levantes.find(element => element.idLevante == lote.idLevante);
                                        //var listaLevanteAlimento = listaLevanteAlimento_raw.filter(ls => ls.idLevante == levante_actual.idLevante);
                                        if (levante_actual != undefined) {
                                            if (tipo == 'P') {

                                                if (lote.idProduccion != 0 && lote.idGranjaP != null) {
                                                    await db.query('delete from prod_kardexalimento where periodo = ? and idAlimento = ? and tipo = ? and idObjeto = ?', [periodo, alimento.idAlimento, tipo, lote.idProduccion]);
                                                    //var listaProduccionAlimento = listaProduccionAlimento_raw.filter(ls => ls.idProduccion == lote.idProduccion);
                                                    if (listaProduccionAlimento.length > 0) {
                                                        diaInicioDelMes = moment(levante_actual.FechaIniProduccion);
                                                        diaInicioDelMes_ = moment(levante_actual.FechaIniProduccion);
                                                        diaFinDelMes = moment(levante_actual.FechaFinProduccion);
                                                        const { saldoFinal: saldoFinalPeriodoAnterior = 0 } = (await connection.query("select MAX(fecha),saldoFinal from prod_kardexalimento where periodo=? and idObjeto = ? and idAlimento = ?", ["'" + momentPeriodo + "'", lote.idProduccion, alimento.idAlimento])[0]) || {}
                                                        let listaConfirmadaPorFecha = data_lote.filter(o => o.tipo == tipo);
                                                        let listaConjuntaInsert = []
                                                        if (tipo == 'P' && alimento.idAlimento == 7 && listaConfirmadaPorFecha.length > 0) {
                                                            //debugger;
                                                            console.log("YA MIRA AQUI SI ESTA")
                                                            console.log(tipo + '-' + alimento.idAlimento + '-' + listaConfirmadaPorFecha.length + '-' + 'lg' + lote.idGranja + '-' + 'lp' + lote.idGranjaP)
                                                        } else {
                                                            console.log(tipo + '-' + alimento.idAlimento + '-' + listaConfirmadaPorFecha.length + '-' + 'lg' + lote.idGranja + '-' + 'lp' + lote.idGranjaP)
                                                        }

                                                        while (diaInicioDelMes.isSameOrBefore(diaFinDelMes)) {

                                                            const { CantAlimento: cantidadAlimentoL9Produccion = 0, idObjeto: idObjetoProduccion = 0, Semana: semanaProduccion = 0 } = listaProduccionAlimento.find(l => moment(l.Fecha).isSame(diaInicioDelMes) && l.lote.includes(listaCodigoGenetico[0])) || {}
                                                            const { CantAlimento: cantidadAlimentoL7Produccion = 0 } = listaProduccionAlimento.find(l => moment(l.Fecha).isSame(diaInicioDelMes) && l.lote.includes(listaCodigoGenetico[1])) || {}
                                                            const { CantAlimento: cantidadAlimentoL4Produccion = 0 } = listaProduccionAlimento.find(l => moment(l.Fecha).isSame(diaInicioDelMes) && l.lote.includes(listaCodigoGenetico[2])) || {}
                                                            const { CantAlimento: cantidadAlimentoL1Produccion = 0 } = listaProduccionAlimento.find(l => moment(l.Fecha).isSame(diaInicioDelMes) && l.lote.includes(listaCodigoGenetico[3])) || {}

                                                            const { CantAlimento: cantidadAlimentoL9Levante = 0, idObjeto: idObjetoLevante = 0, Semana: semanaLevante = 0 } = listaLevanteAlimento.find(l => moment(l.Fecha).isSame(diaInicioDelMes) && l.lote.includes(listaCodigoGenetico[0])) || {}
                                                            const { CantAlimento: cantidadAlimentoL7Levante = 0 } = listaLevanteAlimento.find(l => moment(l.Fecha).isSame(diaInicioDelMes) && l.lote.includes(listaCodigoGenetico[1])) || {}
                                                            const { CantAlimento: cantidadAlimentoL4Levante = 0 } = listaLevanteAlimento.find(l => moment(l.Fecha).isSame(diaInicioDelMes) && l.lote.includes(listaCodigoGenetico[2])) || {}
                                                            const { CantAlimento: cantidadAlimentoL1Levante = 0 } = listaLevanteAlimento.find(l => moment(l.Fecha).isSame(diaInicioDelMes) && l.lote.includes(listaCodigoGenetico[3])) || {}
                                                            const { nroGuia = '', cantidadEsoftcom = null, cantidadConfirmada = null } = listaConfirmadaPorFecha.find(l => moment(l.fecha).isSame(diaInicioDelMes)) || {}
                                                            let totalSalida = cantidadAlimentoL9Levante + cantidadAlimentoL7Levante + cantidadAlimentoL4Levante + cantidadAlimentoL1Levante

                                                            const conjuntoInsert = {
                                                                periodo: periodo,
                                                                semana: semanaLevante,
                                                                tipo: tipo,
                                                                descripcionlote: "",
                                                                granja: tipo == "L" ? lote.idGranja : lote.idGranjaP,
                                                                fecha: diaInicioDelMes.format("YYYY-MM-DD"),
                                                                ccosto: lote.ccosto,
                                                                alimento: alimento,
                                                                nroGuia,
                                                                cantidadEsoftcom,
                                                                cantidadConfirmada,
                                                                idObjeto: tipo == "L" ? lote.idLevante : lote.idProduccion,
                                                                salidaL9: cantidadAlimentoL9Levante,
                                                                salidaL7: cantidadAlimentoL7Levante,
                                                                salidaL4: cantidadAlimentoL4Levante,
                                                                salidaL1: cantidadAlimentoL1Levante,
                                                                saldoFinal: 0,
                                                                saldoInicial: saldoFinalPeriodoAnterior,
                                                                totalSalida
                                                            }

                                                            if (diaInicioDelMes.isAfter(diaInicioDelMes_)) {
                                                                conjuntoInsert.saldoInicial = listaConjuntaInsert.find(l => l.fecha == diaInicioDelMes.clone().subtract(1, "day").format("YYYY-MM-DD")).saldoInicial
                                                            }
                                                            if (tipo == "P") {
                                                                totalSalida = cantidadAlimentoL9Produccion + cantidadAlimentoL7Produccion + cantidadAlimentoL4Produccion + cantidadAlimentoL1Produccion;
                                                                conjuntoInsert.salidaL9 = cantidadAlimentoL9Produccion
                                                                conjuntoInsert.salidaL7 = cantidadAlimentoL7Produccion
                                                                conjuntoInsert.salidaL4 = cantidadAlimentoL4Produccion
                                                                conjuntoInsert.salidaL1 = cantidadAlimentoL1Produccion
                                                                conjuntoInsert.semana = semanaProduccion
                                                                conjuntoInsert.totalSalida = totalSalida
                                                            }

                                                            conjuntoInsert.saldoFinal = conjuntoInsert.saldoInicial + cantidadConfirmada - totalSalida
                                                            listaConjuntaInsert.push(conjuntoInsert)
                                                            diaInicioDelMes.add(1, "day")
                                                        }

                                                        const listaConjuntaInsertValues = listaConjuntaInsert.map(l => [l.periodo, l.fecha, l.granja, l.semana, tipo, l.idObjeto, l.ccosto,
                                                        l.alimento.idAlimento, l.descripcionlote, l.nroGuia, l.saldoInicial, l.cantidadEsoftcom, l.cantidadConfirmada, l.salidaL9 == null ? 0 : l.salidaL9, l.salidaL7 == null ? 0 : l.salidaL7, l.salidaL4 == null ? 0 : l.salidaL4, l.salidaL1 == null ? 0 : l.salidaL1, l.totalSalida == null ? 0 : l.totalSalida, l.saldoFinal, 0, new Date(), new Date()
                                                        ])
                                                        if (listaConjuntaInsertValues.length > 0) {
                                                            if (await this.periodoIsOpen(periodo)) {
                                                                await connection.query("insert into prod_kardexalimento(periodo,fecha,idGranja,semana,tipo,idObjeto,ccosto,idAlimento,descripcionLote,nroGuia,saldoInicial,cantidadEsoftcom,cantidadConfirmada,salidaL9,salidaL7,salidaL4,salidaL1,totalSalida,saldoFinal,idUsuario,fechaReg,fechaMod) values ?", [listaConjuntaInsertValues])
                                                            }

                                                            await connection.query("COMMIT");

                                                            arr_resultados.push(listaConjuntaInsert);
                                                        }
                                                    }
                                                }
                                            } else {
                                                if (listaLevanteAlimento.length > 0) {
                                                    await db.query('delete from prod_kardexalimento where periodo = ? and idAlimento = ? and tipo = ? and idObjeto = ?', [periodo, alimento.idAlimento, tipo, lote.idLevante]);
                                                    diaInicioDelMes = moment(levante_actual.FechaIniLevante);
                                                    diaInicioDelMes_ = moment(levante_actual.FechaIniLevante);
                                                    diaFinDelMes = moment(levante_actual.FechaFinLevante);
                                                    const { saldoFinal: saldoFinalPeriodoAnterior = 0 } = (await connection.query("select MAX(fecha),saldoFinal from prod_kardexalimento where periodo=? and idObjeto = ? and idAlimento = ?", ["'" + momentPeriodo + "'", lote.idLevante, alimento.idAlimento])[0]) || {}
                                                    let listaConfirmadaPorFecha = data_lote.filter(o => o.tipo == tipo);
                                                    let listaConjuntaInsert = []
                                                    if (tipo == 'P' && alimento.idAlimento == 7 && listaConfirmadaPorFecha.length > 0) {
                                                        //debugger;
                                                        console.log("YA MIRA AQUI SI ESTA")
                                                        console.log(tipo + '-' + alimento.idAlimento + '-' + listaConfirmadaPorFecha.length + '-' + 'lg' + lote.idGranja + '-' + 'lp' + lote.idGranjaP)
                                                    } else {
                                                        console.log(tipo + '-' + alimento.idAlimento + '-' + listaConfirmadaPorFecha.length + '-' + 'lg' + lote.idGranja + '-' + 'lp' + lote.idGranjaP)
                                                    }

                                                    while (diaInicioDelMes.isSameOrBefore(diaFinDelMes)) {

                                                        const { CantAlimento: cantidadAlimentoL9Produccion = 0, idObjeto: idObjetoProduccion = 0, Semana: semanaProduccion = 0 } = listaProduccionAlimento.find(l => moment(l.Fecha).isSame(diaInicioDelMes) && l.lote.includes(listaCodigoGenetico[0])) || {}
                                                        const { CantAlimento: cantidadAlimentoL7Produccion = 0 } = listaProduccionAlimento.find(l => moment(l.Fecha).isSame(diaInicioDelMes) && l.lote.includes(listaCodigoGenetico[1])) || {}
                                                        const { CantAlimento: cantidadAlimentoL4Produccion = 0 } = listaProduccionAlimento.find(l => moment(l.Fecha).isSame(diaInicioDelMes) && l.lote.includes(listaCodigoGenetico[2])) || {}
                                                        const { CantAlimento: cantidadAlimentoL1Produccion = 0 } = listaProduccionAlimento.find(l => moment(l.Fecha).isSame(diaInicioDelMes) && l.lote.includes(listaCodigoGenetico[3])) || {}

                                                        const { CantAlimento: cantidadAlimentoL9Levante = 0, idObjeto: idObjetoLevante = 0, Semana: semanaLevante = 0 } = listaLevanteAlimento.find(l => moment(l.Fecha).isSame(diaInicioDelMes) && l.lote.includes(listaCodigoGenetico[0])) || {}
                                                        const { CantAlimento: cantidadAlimentoL7Levante = 0 } = listaLevanteAlimento.find(l => moment(l.Fecha).isSame(diaInicioDelMes) && l.lote.includes(listaCodigoGenetico[1])) || {}
                                                        const { CantAlimento: cantidadAlimentoL4Levante = 0 } = listaLevanteAlimento.find(l => moment(l.Fecha).isSame(diaInicioDelMes) && l.lote.includes(listaCodigoGenetico[2])) || {}
                                                        const { CantAlimento: cantidadAlimentoL1Levante = 0 } = listaLevanteAlimento.find(l => moment(l.Fecha).isSame(diaInicioDelMes) && l.lote.includes(listaCodigoGenetico[3])) || {}
                                                        const { nroGuia = '', cantidadEsoftcom = null, cantidadConfirmada = null } = listaConfirmadaPorFecha.find(l => moment(l.fecha).isSame(diaInicioDelMes)) || {}
                                                        let totalSalida = cantidadAlimentoL9Levante + cantidadAlimentoL7Levante + cantidadAlimentoL4Levante + cantidadAlimentoL1Levante

                                                        const conjuntoInsert = {
                                                            periodo: periodo,
                                                            semana: semanaLevante,
                                                            tipo: tipo,
                                                            descripcionlote: "",
                                                            granja: tipo == "L" ? lote.idGranja : lote.idGranjaP,
                                                            fecha: diaInicioDelMes.format("YYYY-MM-DD"),
                                                            ccosto: lote.ccosto,
                                                            alimento: alimento,
                                                            nroGuia,
                                                            cantidadEsoftcom,
                                                            cantidadConfirmada,
                                                            idObjeto: tipo == "L" ? lote.idLevante : lote.idProduccion,
                                                            salidaL9: cantidadAlimentoL9Levante,
                                                            salidaL7: cantidadAlimentoL7Levante,
                                                            salidaL4: cantidadAlimentoL4Levante,
                                                            salidaL1: cantidadAlimentoL1Levante,
                                                            saldoFinal: 0,
                                                            saldoInicial: saldoFinalPeriodoAnterior,
                                                            totalSalida
                                                        }

                                                        if (diaInicioDelMes.isAfter(diaInicioDelMes_)) {
                                                            conjuntoInsert.saldoInicial = listaConjuntaInsert.find(l => l.fecha == diaInicioDelMes.clone().subtract(1, "day").format("YYYY-MM-DD")).saldoInicial
                                                        }
                                                        if (tipo == "P") {
                                                            totalSalida = cantidadAlimentoL9Produccion + cantidadAlimentoL7Produccion + cantidadAlimentoL4Produccion + cantidadAlimentoL1Produccion;
                                                            conjuntoInsert.salidaL9 = cantidadAlimentoL9Produccion
                                                            conjuntoInsert.salidaL7 = cantidadAlimentoL7Produccion
                                                            conjuntoInsert.salidaL4 = cantidadAlimentoL4Produccion
                                                            conjuntoInsert.salidaL1 = cantidadAlimentoL1Produccion
                                                            conjuntoInsert.semana = semanaProduccion
                                                            conjuntoInsert.totalSalida = totalSalida
                                                        }

                                                        conjuntoInsert.saldoFinal = conjuntoInsert.saldoInicial + cantidadConfirmada - totalSalida
                                                        listaConjuntaInsert.push(conjuntoInsert)
                                                        diaInicioDelMes.add(1, "day")
                                                    }

                                                    const listaConjuntaInsertValues = listaConjuntaInsert.map(l => [l.periodo, l.fecha, l.granja, l.semana, tipo, l.idObjeto, l.ccosto,
                                                    l.alimento.idAlimento, l.descripcionlote, l.nroGuia, l.saldoInicial, l.cantidadEsoftcom, l.cantidadConfirmada, l.salidaL9 == null ? 0 : l.salidaL9, l.salidaL7 == null ? 0 : l.salidaL7, l.salidaL4 == null ? 0 : l.salidaL4, l.salidaL1 == null ? 0 : l.salidaL1, l.totalSalida == null ? 0 : l.totalSalida, l.saldoFinal, 0, new Date(), new Date()
                                                    ])
                                                    if (listaConjuntaInsertValues.length > 0) {
                                                        if (await this.periodoIsOpen(periodo)) {
                                                            await connection.query("insert into prod_kardexalimento(periodo,fecha,idGranja,semana,tipo,idObjeto,ccosto,idAlimento,descripcionLote,nroGuia,saldoInicial,cantidadEsoftcom,cantidadConfirmada,salidaL9,salidaL7,salidaL4,salidaL1,totalSalida,saldoFinal,idUsuario,fechaReg,fechaMod) values ?", [listaConjuntaInsertValues])
                                                        }

                                                        await connection.query("COMMIT");

                                                        arr_resultados.push(listaConjuntaInsert);
                                                    }
                                                }

                                            }
                                        } else {
                                            console.log(lote);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return {
                periodos_ini: periodos_ini,
                periodos_fin: periodos_fin,
                levantes: lotes_levante,
                producciones: lotes_produccion,
                arr_resultados,
                alimentos_con_data,
                lotes_con_data,
                //log: log,
                lotes: lotes
            }
        } catch (error) {
            console.log(error)
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            console.log('data en kardex');
            connection.release();
        }

        //var alimentos_levantes = await db.query("SELECT * FROM alimento_levante_det WHERE idLevante IN ("+arr_levante+")");
        //var alimentos_produccion = await db.query("SELECT * FROM alimento_prod_det WHERE idProduccion IN ("+arr_produccion+")");
        //var tipos_de_alimento = await db.query("Select * from tipo_alimento WHERE Tipo = 'L' OR Tipo = 'A'");
    }
}
module.exports = periodoF33;