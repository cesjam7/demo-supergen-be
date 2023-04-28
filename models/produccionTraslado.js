var db = require('../dbconnection');
var moment = require('moment');
var fs = require('fs');
var Excel = require('exceljs');
var workbook = new Excel.Workbook();

var ProduccionTraslado = {

    getAllProduccionTraslado: function (callback) {
        return db.query("SELECT * FROM `tiv_view`", callback);
    },
    getProduccionTrasladoById: async function (id) {
        let rows = await db.query(`select * from traslado_ingreso_ventas tiv where idTIV = ?`, [id]);
        let lotes = await db.query(`SELECT * FROM lotes WHERE idLevante != 1`);
        return {
            rows,
            lotes
        }
    },
    exportarExcelVentas: (params, rows) => {
        const rutaTemplateCPHI = "/template/VentaAves.xlsx";
        try {
            if (fs.existsSync(`.${rutaTemplateCPHI}`)) {
                fs.unlinkSync(`.${rutaTemplateCPHI}`)
            }
            workbook.xlsx.readFile("./template/Plantilla Venta Aves.xlsx").then(() => {
                return new Promise((resolve, reject) => {
                    workbook.eachSheet(async (worksheet, sheetId) => {
                        try {

                            worksheet.getCell("B3").value = params.tipoConsulta;
                            worksheet.getCell("D3").value = params.idCliente.CL_CCODCLI;
                            worksheet.getCell("F3").value = moment(params.fechaInicio).format("YYYY-MM-DD");
                            worksheet.getCell("H3").value = moment(params.fechaFinal).format("YYYY-MM-DD");
                            let cellN = 7;
                            for (let i = 0; i < rows.length; i++) {
                                const c = rows[i];
                                worksheet.getCell('A' + (cellN)).value = i + 1;
                                worksheet.getCell('B' + (cellN)).value = c.lote_str
                                worksheet.getCell('C' + (cellN)).value = params.tipoConsulta == "detallado" ? c.Nro_Guia : "-"
                                worksheet.getCell('D' + (cellN)).value = c.Venta
                                worksheet.getCell('E' + (cellN)).value = params.tipoConsulta == "detallado" ? c.Fecha : "-"
                                worksheet.getCell('F' + (cellN)).value = c.TipoCliente
                                worksheet.getCell('G' + (cellN)).value = c.CL_CNOMCLI
                                worksheet.getCell('H' + (cellN)).value = c.CL_CCODCLI
                                cellN++
                            }
                            setTimeout(() => resolve(), 2000);
                        } catch (error) {
                            console.log("Errror", error)
                        }

                    })
                }).then(async () => {
                    workbook.xlsx.writeFile(`.${rutaTemplateCPHI}`).then(() => {
                        console.log("xls file is wrrites")
                    })

                })
            })
            json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: rutaTemplateCPHI
            }
        } catch (err) {
            console.log('error :>> ', error);
            json = {
                success: false,
                message: "Error en el servidor => /Cartilla/ExportExcel",
                rutaCM: rutaTemplateCPHI
            }
        }
        return json;

    },
    getVentasDetallado: (params) => {
        return new Promise((resolve, reject) => {
            db.query(`select idLoteOrigen,lo.lote_str,Nro_Guia,Venta,DATE_FORMAT(Fecha,'%Y-%m-%d') as Fecha,TipoCliente,CL_CNOMCLI,CL_CCODCLI from traslado_ingreso_ventas tr LEFT JOIN lotes lo on lo.idLote=tr.idLoteOrigen 
             where tr.Venta>0 and tr.Fecha>=? and tr.Fecha<=? and tr.CL_CCODCLI like '%${params.idCliente.CL_CCODCLI == "todos" ? '' : params.idCliente.CL_CCODCLI}%'`,
                [params.fechaInicio, params.fechaFinal], (err, results) => {
                    if (err) reject(err)
                    resolve(results)
                })
        })

    },
    getVentasAgrupado: (params) => {
        return new Promise((resolve, reject) => {
            db.query(`select idLoteOrigen,lo.lote_str,sum(Venta) as Venta,TipoCliente,CL_CNOMCLI,CL_CCODCLI from traslado_ingreso_ventas tr LEFT JOIN lotes lo on lo.idLote=tr.idLoteOrigen 
             where tr.Venta>0 and tr.Fecha>=? and tr.Fecha<=? and tr.CL_CCODCLI like '%${params.idCliente.CL_CCODCLI == "todos" ? "" : params.idCliente.CL_CCODCLI}%' GROUP BY CL_CNOMCLI `,
                [params.fechaInicio, params.fechaFinal], (err, results) => {
                    if (err) reject(err)
                    resolve(results)
                })
        })
    },
    getUltimaProduccionTraslado: function (callback) {
        return db.query("select idProduccionTraslado, idLevante from produccion ORDER BY idProduccionTraslado DESC Limit 0,1", callback);
    },
    getLotesProduccion: async function () {
        return await db.query("SELECT * FROM lotes WHERE idLevante != 0");
    },
    verifyProduccionMortalidad: async function (ProduccionTraslado) {
        const fechaInicio = moment(ProduccionTraslado.Fecha, 'YYYY-MM-DD')
        const prodDet = await db.query(`select idMortalidadDet from mortalidad_prod_det where idLote=${ProduccionTraslado.LoteOrigen} and fecha='${fechaInicio.format('YYYY-MM-DD')}'`)

        if (prodDet.length > 0) {
            let prod = await db.query(`SELECT * 
            FROM produccion l 
            INNER JOIN lotes lo ON lo.idProduccion = l.idProduccion 
            INNER JOIN lineas li ON li.idLinea = lo.idLinea 
            WHERE l.idProduccion = ? ORDER BY li.CodLinea DESC`, [ProduccionTraslado.idProduccionOrigen]);
            var FechaIniProduccion = new Date(prod[0]['FechaIniProduccion']);
            var FechaFinProduccion = new Date(prod[0]['FechaFinProduccion']);
            var Difference_In_Time = FechaFinProduccion.getTime() - FechaIniProduccion.getTime();
            var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);
            for (var i = 1; i <= Difference_In_Days; i++) {
                let f = new Date(FechaIniProduccion).setHours(0, 0, 0, 0)
                if (f == new Date(ProduccionTraslado.Fecha).setHours(0, 0, 0, 0)) {
                    let Edad = (i + 1);
                    ProduccionTraslado.Semana = Math.ceil(Edad / 7)
                }
                FechaIniProduccion = new Date(FechaIniProduccion.getTime() + 24 * 60 * 60 * 1000);
            }

            var FIP = new Date(prod[0]['FechaIniProduccion']);
            let rangomayor = ProduccionTraslado.Semana * 7;
            let rangomenor = rangomayor - 6;
            let Traslado = 0;
            let Ventas = 0;
            let Ingreso = 0;
            for (var i = 1; i <= rangomayor; i++) {
                if (i >= rangomenor) {
                    let cons = await db.query(`SELECT * FROM traslado_ingreso_ventas 
                    WHERE Fecha = ? and idLoteOrigen = ?`, [new Date(FIP), ProduccionTraslado.LoteOrigen])
                    if (cons.length != 0) {
                        for (let i = 0; i < cons.length; i++) {
                            const e = cons[i];
                            if (e.Traslado != null) {
                                if (e.idLoteDestino == ProduccionTraslado.LoteDestino) {
                                    Ingreso = Ingreso + e.Traslado;
                                }
                                Traslado = Traslado - e.Traslado;
                            }
                            if (e.Venta != null) {
                                Ventas = Ventas + e.Venta;
                            }
                        }
                    }

                    let cons2 = await db.query(`SELECT * FROM traslado_ingreso_ventas 
                    WHERE Fecha = ? and idLoteDestino = ?`, [new Date(FIP), ProduccionTraslado.LoteOrigen])
                    if (cons2.length != 0) {
                        for (let i = 0; i < cons2.length; i++) {
                            const e = cons2[i];
                            if (e.Traslado != null) {
                                Traslado = Traslado + e.Traslado;
                            }
                        }
                    }
                }
                FIP = new Date(FIP.getTime() + 24 * 60 * 60 * 1000);
            }
            console.log('Ventas :>> ', Ventas);

            let Semana2 = 0;
            if (ProduccionTraslado.LoteDestino != null) {
                let prod2 = await db.query(`SELECT * 
                FROM produccion l 
                INNER JOIN lotes lo ON lo.idProduccion = l.idProduccion 
                INNER JOIN lineas li ON li.idLinea = lo.idLinea 
                WHERE lo.idLote = ? ORDER BY li.CodLinea DESC`, [ProduccionTraslado.LoteDestino]);
                var FechaIniProduccion2 = new Date(prod2[0]['FechaIniProduccion']);
                var FechaFinProduccion2 = new Date(prod2[0]['FechaFinProduccion']);
                var Difference_In_Time2 = FechaFinProduccion2.getTime() - FechaIniProduccion2.getTime();
                var Difference_In_Days2 = Difference_In_Time2 / (1000 * 3600 * 24);
                for (var i = 1; i <= Difference_In_Days2; i++) {
                    let f = new Date(FechaIniProduccion2).setHours(0, 0, 0, 0)
                    if (f == new Date(ProduccionTraslado.Fecha).setHours(0, 0, 0, 0)) {
                        let Edad = (i + 1);
                        Semana2 = Math.ceil(Edad / 7)
                    }
                    FechaIniProduccion2 = new Date(FechaIniProduccion2.getTime() + 24 * 60 * 60 * 1000);
                }
            }
            console.log("Semana2", Semana2)
            let count = await db.query(`SELECT saldo_fin_sem, Ventas, Ingreso FROM mortalidad_prod_sem 
                WHERE idLote = ? and semana_prod = ?`, [ProduccionTraslado.LoteOrigen, ProduccionTraslado.Semana]);

            if (count.length == 0) {
                return false;
            }

            if (count[0].saldo_fin_sem != null) {
                await db.query(`UPDATE mortalidad_prod_sem SET Ingreso = ?
                    WHERE idLote = ? and semana_prod = ?`, [Traslado, ProduccionTraslado.LoteOrigen, ProduccionTraslado.Semana])
                if (ProduccionTraslado.LoteDestino != null) {
                    let count2 = await db.query(`SELECT saldo_fin_sem, Ingreso, semana_prod FROM mortalidad_prod_sem 
                        WHERE idLote = ? and semana_prod = ?`, [ProduccionTraslado.LoteDestino, Semana2]);
                    if (count2.length != 0) {
                        if (count2[0].saldo_fin_sem != null) {
                            await db.query(`UPDATE mortalidad_prod_sem SET Ingreso = ?
                                WHERE idLote = ? and semana_prod = ?`, [Ingreso, ProduccionTraslado.LoteDestino, Semana2])
                        }
                    }
                }
                await db.query(`UPDATE mortalidad_prod_sem SET Ventas = ?
                    WHERE idLote = ? and semana_prod = ?`, [Ventas, ProduccionTraslado.LoteOrigen, ProduccionTraslado.Semana])
            }
            if (ProduccionTraslado.Venta <= count[0].saldo_fin_sem || ProduccionTraslado.Traslado <= count[0].saldo_fin_sem) {
                return true;
            } else {
                return false;
            }
        } else {
            if (ProduccionTraslado.Venta) {
                return false
            }
            const [dataSemana] = await db.query(`select idLote, semana from mortalidad_det where  idLote=${ProduccionTraslado.LoteOrigen} and fecha='${fechaInicio.format("YYYY-MM-DD")}' `)
            if (dataSemana == undefined) {
                throw new Error(`Registre primero una mortalidad para ese dia`)
            }
            const [mortalidadsem] = await db.query(`select saldo_fin_sem,idLevante from mortalidadsem where idLote=${ProduccionTraslado.LoteOrigen}  `)
            if (mortalidadsem) {
                const evaluacion = ProduccionTraslado.Traslado <= mortalidadsem.saldo_fin_sem
                if (evaluacion) {
                    await db.query(`UPDATE mortalidadsem SET SelGen = ?
                    WHERE idLote = ? and Semana = ?`, [ProduccionTraslado.Traslado, ProduccionTraslado.LoteOrigen, dataSemana.semana])
                    /*         if (ProduccionTraslado.LoteDestino != null) {
                                let count2 = await db.query(`SELECT saldo_fin_sem, Ingreso, semana_prod FROM mortalidad_prod_sem 
                                WHERE idLote = ? and semana_prod = ?`, [ProduccionTraslado.LoteDestino, Semana2]);
                                if (count2.length != 0) {
                                    if (count2[0].saldo_fin_sem != null) {
                                        await db.query(`UPDATE mortalidad_prod_sem SET Ingreso = ?
                                        WHERE idLote = ? and semana_prod = ?`, [Ingreso, ProduccionTraslado.LoteDestino, Semana2])
                                    }
                                }
                            } */
                    /*    await db.query(`UPDATE mortalidad_prod_sem SET Ventas = ?
                       WHERE idLote = ? and semana_prod = ?`, [Ventas, ProduccionTraslado.LoteOrigen, ProduccionTraslado.Semana]) */
                }
                ProduccionTraslado.idLevante = mortalidadsem.idLevante
                return evaluacion
            }

        }








    },
    addProduccionTraslado: async function (ProduccionTraslado) {
        if (ProduccionTraslado.idLevante) {
            ProduccionTraslado.idProduccionOrigen = null
        }
        if (ProduccionTraslado.idProduccionOrigen) {
            ProduccionTraslado.idLevante = null

        }
        return await db.query(`INSERT INTO traslado_ingreso_ventas (idProduccionOrigen,idLevanteOrigen, idLoteOrigen, idProduccionDestino, idLoteDestino, Traslado, 
        Cant_Ingreso, Nro_Guia, Venta, Fecha, TipoCliente, CL_CNOMCLI, CL_CCODCLI) values(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [ProduccionTraslado.idProduccionOrigen, ProduccionTraslado.idLevante, ProduccionTraslado.LoteOrigen, ProduccionTraslado.idProduccionDestino, ProduccionTraslado.LoteDestino,
            ProduccionTraslado.Traslado, ProduccionTraslado.Traslado, ProduccionTraslado.Nro_Guia, ProduccionTraslado.Venta, new Date(ProduccionTraslado.Fecha),
            ProduccionTraslado.Tipo == "traslado" ? "" : ProduccionTraslado.Cliente.TipoCliente, ProduccionTraslado.Tipo == "traslado" ? "" : ProduccionTraslado.Cliente.CL_CNOMCLI, ProduccionTraslado.Tipo == "traslado" ? "" : ProduccionTraslado.Cliente.CL_CCODCLI]);
    },
    updateVentasfromMortalidad: async function (ProduccionTraslado) {
        if (ProduccionTraslado.Venta != 0 && ProduccionTraslado.Venta != null) {
            let cons = await db.query(`SELECT * FROM traslado_ingreso_ventas 
            WHERE Fecha = ? and idLoteOrigen = ? and Nro_Guia = ?`, [ProduccionTraslado.Fecha,
            ProduccionTraslado.LoteOrigen, ProduccionTraslado.Nro_Guia])
            let rows
            if (cons.length == 0) {
                rows = await db.query("INSERT INTO traslado_ingreso_ventas (idProduccionOrigen, idLoteOrigen, idProduccionDestino, idLoteDestino, Traslado, Cant_Ingreso, Nro_Guia, Venta, Fecha) values(?,?,?,?,?,?,?,?,?)",
                    [ProduccionTraslado.idProduccionOrigen, ProduccionTraslado.LoteOrigen, ProduccionTraslado.idProduccionDestino, ProduccionTraslado.LoteDestino, ProduccionTraslado.Traslado, ProduccionTraslado.Traslado, ProduccionTraslado.Nro_Guia, ProduccionTraslado.Venta, ProduccionTraslado.Fecha]);
            } else {
                rows = await db.query(`UPDATE traslado_ingreso_ventas SET Venta = ?
                WHERE Fecha = ? and idLoteOrigen = ? and Nro_Guia = ?`, [ProduccionTraslado.Venta,
                ProduccionTraslado.Fecha, ProduccionTraslado.LoteOrigen, ProduccionTraslado.Nro_Guia]);
            }
            return rows;
        }
    },
    StockAvesMensual: async function (ProduccionTraslado, rows) {
        let hoy = new Date(ProduccionTraslado.Fecha);
        var m = hoy.getMonth() + 1;
        var y = hoy.getFullYear();
        if (m < 10) {
            m = '0' + m;
        }
        let PTLO = await db.query("SELECT * FROM mortalidad_prod_sem WHERE idLote = ?", [ProduccionTraslado.LoteOrigen]);
        if (PTLO.length == 0) {
            await db.query("CALL actualizarStockAves(?, ?, ?)",
                [m, y, ProduccionTraslado.LoteOrigen]);
        } else {
            await db.query("CALL actualizarStockAves_prod(?, ?, ?)",
                [m, y, ProduccionTraslado.LoteOrigen]);
        }
        let PTLD = await db.query("SELECT * FROM mortalidad_prod_sem WHERE idLote = ?", [ProduccionTraslado.LoteDestino]);
        if (PTLD.length == 0) {
            await db.query("CALL actualizarStockAves(?, ?, ?)",
                [m, y, ProduccionTraslado.LoteDestino]);
        } else {
            await db.query("CALL actualizarStockAves_prod(?, ?, ?)",
                [m, y, ProduccionTraslado.LoteDestino]);
        }
    },
    updateProduccionTrasladoLotes: function (id, ProduccionTraslado, callback) {
        let Num_Aves_Fin_Levante = ProduccionTraslado.Num_Aves_Fin_Levante;
        for (let i = 0; i < Num_Aves_Fin_Levante.length; i++) {
            const element = Num_Aves_Fin_Levante[i];
            db.query("UPDATE lotes set Num_Aves_Fin_Levante= ?, idProduccionTraslado = ? WHERE idLevante = ? and idLote = ?",
                [element.Num_Aves_Fin_Levante, id, ProduccionTraslado.idLevante, element.idLote], callback);
        }
        return
    },
    deleteProduccionTraslado: async (id) => {
        return await db.query("DELETE FROM traslado_ingreso_ventas WHERE idTIV = ?", [id]);
    },
    getNumAvesFinLevante: function (ProduccionTraslado, callback) {
        db.query("SELECT MAX(Semana) as Semana_max FROM mortalidadsem WHERE idLevante = ?", ProduccionTraslado.idLevante, (err, count) => {
            return db.query("SELECT l.idLote, l.lote, l.lote_str, l.Sexo, m.saldo_fin_sem as Num_Aves_Fin_Levante FROM lotes l INNER JOIN mortalidadsem m ON m.idLote = l.idLote WHERE l.idLevante = ? and m.Semana = ?",
                [ProduccionTraslado.idLevante, count[0].Semana_max], callback);
        })
    },
    updateProduccionTraslado: async function (PT) {
        console.log('PT :>> ', PT);
    }
}
module.exports = ProduccionTraslado;
