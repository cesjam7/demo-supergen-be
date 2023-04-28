var db = require('../dbconnection');
var fs = require('fs');
var Excel = require('exceljs');
const moment = require('moment');
var workbook = new Excel.Workbook();
const mysql = require("../dbconnectionPromise")

var mortalidadDiariaF33 = {
    getLotes: async (Data) => {
        let json = {}
        try {
            let rows = await db.query(`SELECT idLevante, GROUP_CONCAT(DISTINCT lote_str ORDER BY TipoGenero
            SEPARATOR '-') as Lote FROM lotes WHERE idLevante != 1 GROUP BY idLevante`)
            json = {
                success: true,
                message: "Extracción de Lotes realizado exitosamente.",
                rows
            }
        } catch (error) {
            console.log('error :>> ', error);
            json = {
                success: false,
                message: "Error en el servidor /Cartilla/Lotes",
                error: error.code
            }
        }
        return json;
    },
    getCartilla: async (Data) => {
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

    saldoInicialMortalidadDiariaPorFechaYLotes: async function ({ idLotes = [], fecha }) {
        const connection = await mysql.connection();
        try {
            let dataJson = []

            const data = await connection.query(" select * from prod_mortalidaddiaria where idLote in(?) and fecha=?", [idLotes, fecha]);

            console.log("data", data)
            for (let i = 0; i < idLotes.length; i++) {
                const idLote = idLotes[i]
                const { saldofinal: saldoFinal = 0 } = data.find(d => d.idlote == idLote) || {}
                dataJson.push({ idLote, saldoInicial: saldoFinal })
            }


            return dataJson;

        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }




    },


    ExportExcelMortalidad: async function (Data) {
        let rutaCM = "/template/CMF33.xlsx";
        try {
            let { idLevante, fecIni, fecFin, TipoCartilla, Rows, Alimentos } = Data;

            if (fs.existsSync("./template/CMF33.xlsx")) {
                await fs.unlinkSync("./template/CMF33.xlsx")
            }

            let f = new Date()
            let yyyy = f.getFullYear()

            let consLevante = await db.query(`SELECT lote_str as nombreLote FROM lotes WHERE idLevante = ${idLevante} ORDER BY lote_str`);

            let nombreLote = 'LH45-LM46'
            if (consLevante.length != 0) {
                nombreLote = consLevante[0].nombreLote
            }

            workbook.xlsx.readFile('./template/PlantillaCMF33.xlsx')
                .then(async function (work) {
                    return new Promise((resolve, reject) => {
                        workbook.eachSheet(async function (worksheet, sheetId) {
                            worksheet.name = `${nombreLote} mort`;
                            worksheet.getCell('A1').value = `MORTALIDAD Y DESCARTE ABUELAS LOTE ${nombreLote} - ${yyyy}`

                            let cellN = 4;
                            let cellP = 4;
                            for (let i = 0; i < Rows.length; i++) {
                                const c = Rows[i];
                                let bottom = 'thin'
                                // if(i == 0){
                                //     console.log('cell :>> ', worksheet.getCell('A2'));
                                // }
                                if (typeof Rows[i + 1] != "undefined") {
                                    if (c.Periodo != Rows[i + 1].Periodo) {
                                        bottom = 'medium'
                                    }
                                } else {
                                    bottom = 'medium'
                                }
                                if (c.show == true) {
                                    //RangoFecha
                                    worksheet.getCell('B' + (cellN)).value = c.RangoFecha
                                    worksheet.getCell('B' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8,
                                        bold: true
                                    }
                                    worksheet.getCell('B' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "medium" },
                                        bottom: { style: bottom },
                                        right: { style: "medium" }
                                    }
                                    //Semana
                                    worksheet.getCell('C' + (cellN)).value = "Semana " + c.Semana
                                    worksheet.getCell('C' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8,
                                        bold: true
                                    }
                                    worksheet.getCell('C' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "medium" },
                                        bottom: { style: bottom },
                                        right: { style: "medium" }
                                    }
                                    worksheet.getCell('C' + (cellN)).fill = {
                                        type: 'pattern',
                                        pattern: 'solid',
                                        fgColor: { argb: 'f7cacc' }
                                    }
                                    //LOTE
                                    worksheet.getCell('D' + (cellN)).value = c.Lote
                                    worksheet.getCell('D' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8
                                    }
                                    worksheet.getCell('D' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "thin" },
                                        bottom: { style: bottom },
                                        right: { style: "thin" }
                                    }
                                    //NroAvesInicioLH
                                    worksheet.getCell('E' + (cellN)).value = c.NroAvesInicio
                                    worksheet.getCell('E' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8
                                    }
                                    worksheet.getCell('E' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "thin" },
                                        bottom: { style: bottom },
                                        right: { style: "thin" }
                                    }
                                    //MortalidadLH
                                    worksheet.getCell('F' + (cellN)).value = c.MortalidadLM
                                    worksheet.getCell('F' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8
                                    }
                                    worksheet.getCell('F' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "thin" },
                                        bottom: { style: bottom },
                                        right: { style: "thin" }
                                    }
                                    //DescartesLH
                                    worksheet.getCell('G' + (cellN)).value = c.DescartesLM
                                    worksheet.getCell('G' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8
                                    }
                                    worksheet.getCell('G' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "thin" },
                                        bottom: { style: bottom },
                                        right: { style: "thin" }
                                    }
                                    //VentasLH
                                    worksheet.getCell('H' + (cellN)).value = c.VentasLM
                                    worksheet.getCell('H' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8
                                    }
                                    worksheet.getCell('H' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "thin" },
                                        bottom: { style: bottom },
                                        right: { style: "thin" }
                                    }
                                    //IngresosLH
                                    worksheet.getCell('I' + (cellN)).value = c.IngresosLM
                                    worksheet.getCell('I' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8
                                    }
                                    worksheet.getCell('I' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "thin" },
                                        bottom: { style: bottom },
                                        right: { style: "thin" }
                                    }
                                    //NroAvesFinalLH
                                    worksheet.getCell('J' + (cellN)).value = c.NroAvesFinal
                                    worksheet.getCell('J' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8
                                    }
                                    worksheet.getCell('J' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "thin" },
                                        bottom: { style: bottom },
                                        right: { style: "thin" }
                                    }
                                    //NroAvesInicioLM

                                    if (c.active == true) {
                                        worksheet.getCell('A' + (cellN)).value = c.Periodo
                                        await worksheet.mergeCells('A' + (cellP) + ':A' + (cellP + (c.rowspan - 1)))
                                        worksheet.getCell('A' + (cellP + (c.rowspan - 1)) + ':Z' + (cellP + (c.rowspan - 1))).border = {
                                            bottom: { style: "medium" }
                                        }
                                        worksheet.getCell('A' + (cellP)).alignment = {
                                            vertical: 'middle',
                                            horizontal: 'center'
                                        }
                                        cellP = cellP + c.rowspan;
                                    }
                                    cellN++
                                }
                            }
                            worksheet.columns.forEach(function (column, i) {
                                var maxLength = 0;
                                column["eachCell"](function (cell, colNumber) {
                                    if (colNumber > 3) {
                                        var columnLength = cell.value ? cell.value.toString().length - 4 : 8;
                                        if (columnLength > maxLength) {
                                            maxLength = columnLength;
                                        }
                                    }
                                });
                                column.width = maxLength < 8 ? 8 : maxLength;
                            });
                            setTimeout(() => resolve(), 2000);
                        })
                    }).then(data => {
                        workbook.xlsx.writeFile("./template/CMF33.xlsx").then(function () {
                            console.log("xls file is written.");
                        });
                    })
                });
            json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM
            }
        } catch (error) {
            console.log('error :>> ', error);
            json = {
                success: false,
                message: "Error en el servidor => /mortalidadDiariaF33/ExportExcel",
                rutaCM
            }
        }
        return json
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
    Cron: async function (Data) {

    }
}
module.exports = mortalidadDiariaF33;