const moment = require('moment');
var db = require('../dbconnection');
var fs = require('fs');
var Excel = require('exceljs');
var workbook = new Excel.Workbook();

const SalidasHuevosComerciales = {
    actualizarEstadoCancelar: (params) => {
        return new Promise((resolve, reject) => {
            db.query("UPDATE salidas_huevos_comerciales  SET idUsuario_Cancelado = ?, Fecha_Cancelado = ?,Cancelado=? WHERE idSHC = ? ", [params.user, new Date(), params.Cancelado ? 1 : 0, params.idSHC,], (err, result) => {
                if (err) reject(err)
                resolve();
            })
        })
    },
    actualizarNroBoleta: (params = []) => {
        return new Promise((resolve, reject) => {
            const queryBatch = params.map((param) => (`UPDATE salidas_huevos_comerciales  SET NroBoleta='${param.NroBoleta}' WHERE idSHC =${param.idSHC};`)).join("");
            db.query(queryBatch, (err, result) => {
                if (err) reject(err)
                resolve();
            })
        })
    },
    traerDetalleDetallado: (params) => {
        return new Promise((resolve, reject) => {
            db.query(`select idSHC, idCliente,Nombre,TipoCliente,lo.lote_str,Fecha,NroDocumento,NroBoleta,Cancelado,CantidadNormal,PesoNormal,CantidadDY,PesoDY,CantidadDY+CantidadNormal as Cantidad_Total,PesoDY+PesoNormal as Peso_Total from  salidas_huevos_comerciales sa LEFT JOIN lotes lo on lo.idLote=sa.idLote where TipoOperacion=? and Fecha>=? and idCliente LIKE '%${params.idCliente.CL_CCODCLI.trim() == "todos" ? "" : params.idCliente.CL_CCODCLI.trim()}%' and Fecha <=?  ORDER BY Fecha,NroDocumento`,
                [params.tipoOperacion.Inicial, params.fechaInicio, params.fechaFinal], (err, results) => {
                    if (err) reject(err)
                    const rows = results.map((result) => ({ ...result, Nombre: result.Nombre.trim(), Cancelado: result.Cancelado == 1, Fecha: moment(result.Fecha).format("YYYY-MM-DD") }))
                    resolve(rows)

                })
        })
    },
    generarReporte: (params, rows) => {
        const rutaTemplateHC = "/template/ReporteHuevosComerciales.xlsx";
        try {
            if (fs.existsSync(`.${rutaTemplateHC}`)) {
                fs.unlinkSync(`.${rutaTemplateHC}`)
            }
            workbook.xlsx.readFile("./template/Plantilla Huevos comerciales.xlsx").then(() => {
                return new Promise((resolve, reject) => {
                    workbook.eachSheet(async (worksheet, sheetId) => {
                        try {

                            worksheet.name = "Reporte Huevos Comerciales"
                            worksheet.getCell("C3").value = params.tipoConsulta
                            worksheet.getCell("E3").value = params.tipoOperacion.Tipo
                            worksheet.getCell("G3").value = params.idCliente.CL_CNOMCLI.trim()
                            worksheet.getCell("J3").value = moment(params.fechaInicio).format("YYYY-MM-DD")
                            worksheet.getCell("L3").value = moment(params.fechaFinal).format("YYYY-MM-DD")
                            let cellN = 7;
                            for (let i = 0; i < rows.length; i++) {
                                const c = rows[i];
                                worksheet.getCell('A' + (cellN)).value = i + 1;
                                worksheet.getCell('B' + (cellN)).value = c.idCliente
                                worksheet.getCell('C' + (cellN)).value = c.lote_str
                                worksheet.getCell('D' + (cellN)).value = c.TipoCliente
                                worksheet.getCell('E' + (cellN)).value = c.Nombre
                                worksheet.getCell('F' + (cellN)).value = params.tipoConsulta == "detallado" ? c.NroDocumento : "00000"
                                worksheet.getCell('G' + (cellN)).value = c.Fecha
                                worksheet.getCell('H' + (cellN)).value = params.tipoConsulta == "detallado" ? c.NroBoleta : "."
                                worksheet.getCell('I' + (cellN)).value = c.CantidadNormal
                                worksheet.getCell('J' + (cellN)).value = c.PesoNormal
                                worksheet.getCell('K' + (cellN)).value = c.CantidadDY
                                worksheet.getCell('L' + (cellN)).value = c.PesoDY
                                worksheet.getCell('M' + (cellN)).value = c.Peso_Total
                                worksheet.getCell('N' + (cellN)).value = c.Cantidad_Total
                                worksheet.getCell('O' + (cellN)).value = params.tipoConsulta == "detallado" ? c.Cancelado ? "Si" : "No" : "-"

                                cellN++
                            }
                            /*     worksheet.columns.forEach(function (column, i) {
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
                                }); */
                            setTimeout(() => resolve(), 2000);
                        } catch (error) {
                            console.log("Errror", error)
                        }

                    })
                }).then(async () => {
                    workbook.xlsx.writeFile(`.${rutaTemplateHC}`).then(() => {
                        console.log("xls file is wrrites")
                    })

                })
            })
            json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: rutaTemplateHC
            }
        } catch (err) {
            console.log('error :>> ', err);
            json = {
                success: false,
                message: "Error en el servidor => /Cartilla/ExportExcel",
                rutaCM: rutaTemplateHC
            }
        }
        return json;
    },
    traerDetalleAgrupado: (params) => {
        return new Promise((resolve, reject) => {
            db.query(`select idSHC,idCliente,Nombre,Fecha,NroDocumento,lo.lote_str,TipoCliente,sum(CantidadNormal) as CantidadNormal,sum(PesoNormal) as PesoNormal,sum(CantidadDY) as CantidadDY,sum(PesoDY) as PesoDY,sum(CantidadDY+CantidadNormal) as Cantidad_Total,SUM(PesoDY+PesoNormal) as Peso_Total from  salidas_huevos_comerciales sa LEFT JOIN lotes lo on lo.idLote=sa.idLote where TipoOperacion=? and Fecha>= ? and Fecha <=? and  idCliente like '%${params.idCliente.CL_CCODCLI.trim() == "todos" ? "" : params.idCliente.CL_CCODCLI.trim()}%'  GROUP BY idCliente,Nombre,TipoCliente ORDER BY idCliente`,
                [params.tipoOperacion.Inicial, params.fechaInicio, params.fechaFinal], (err, results) => {
                    if (err) reject(err)
                    const rows = results.map((result) => ({ ...result, Nombre: result.Nombre.trim(), Fecha: moment(result.Fecha).format("YYYY-MM-DD") }))
                    resolve(rows)
                })
        })
    }

}
module.exports = SalidasHuevosComerciales;