const moment = require("moment");
const mysql = require("../dbconnectionPromise")
const factorMortalidadModel = require("./proyFactores")
var Excel = require('exceljs');

var workbook = new Excel.Workbook();

var fs = require('fs');
const { json } = require("body-parser");


const proyDetalleLoteTotalModel = {
    crear: async function (proyIngresoLote, proyLoteDetalle, usuarioReg) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            await connection.query("insert into proy_detalleloteresumen(idProyIngresoLote,idLote,fechaMov,saldoHi,saldoBbs,usuarioReg,fechaReg,semana) values(?,?,?,?,?,?,?,?)", [
                proyIngresoLote.idProyIngresoLote,
                proyLoteDetalle.idLote,
                proyLoteDetalle.fechaMovimiento,
                proyLoteDetalle.saldoHi,
                proyLoteDetalle.saldoBbs,
                usuarioReg,
                new Date(),
                proyLoteDetalle.semana

            ]);
            await connection.query("COMMIT");
        } catch (e) {
            await connection.query("ROLLBACK");
            throw e;
        } finally {
            connection.release();
        }

    },

    listarPorIngresoLote: async function (proyIngresoLoteId) {
        const connection = await mysql.connection();
        try {

            const listaProyIngresoLote = await connection.query("select loteDetallResumen.*,lote.idLinea,lote.lote,lote.loteStr,lote.tipoGenero,lote.sexo from proy_detalleloteresumen loteDetallResumen inner join  proy_lote lote on lote.idLote=loteDetallResumen.idLote  where loteDetallResumen.idProyIngresoLote=?", [proyIngresoLoteId]);
            const listaProyLoteDetalleH = listaProyIngresoLote.filter((loteDetalle) => loteDetalle.tipoGenero == "LH")
            const listaProyLoteDetalleM = listaProyIngresoLote.filter((loteDetalle) => loteDetalle.tipoGenero == "LM")
            const listaUnida = []
            for (let index = 0; index < listaProyLoteDetalleM.length; index++) {
                const loteH = listaProyLoteDetalleH[index]
                const loteM = listaProyLoteDetalleM[index]
                listaUnida.push({
                    idProyDetalleLoteResumen: loteH.idProyDetalleLoteResumen,
                    semana: loteH.semana,
                    lote: { loteStr: loteM.loteStr, idLote: loteM.idLote, tipoGenero: loteM.tipoGenero, sexo: loteM.sexo, lote: loteM.lote },
                    fechaMovimiento: moment(loteH.fechaMov).format("YYYY-MM-DD"),
                    lineaHembra: {
                        saldoHi: loteH.saldoHi,
                        saldoBbs: loteH.saldoBbs
                    },
                    lineaMacho: {
                        saldoHi: loteM.saldoHi,
                        saldoBbs: loteM.saldoBbs,

                    }
                })
            }

            return listaUnida;
        } catch (error) {
            console.error(error)
            throw error;
        } finally {
            connection.release();
        }
    },
    actualizacionCamposReal: async function (proyLoteDetalleConValoresReales = []) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            const queryBatch = proyLoteDetalleConValoresReales.map(proy => `update proy_detalleloteresumen set saldoBbsReal=${proy.saldoBbsReal}, saldoHiReal=${proy.saldoHiReal} where idProyDetalleLoteResumen=${proy.idProyDetalleLoteResumen}`)
            await connection.query(queryBatch.join(";"));
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");

            console.error(error)
            throw error;
        } finally {
            connection.release();
        }
    },
    eliminarPorIngresoLote: async function (ingresoProyLoteId) {
        const connection = await mysql.connection();
        try {
            await connection.query("delete from proy_detalleloteresumen where idProyIngresoLote=?", [ingresoProyLoteId]);
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
    },
    actualizacionGenerica: async function (props = {}, proyDetalleLoteResumenId) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");

            await connection.query("update  proy_detalleloteresumen set " + Object.keys(props).join("=?, ") + " where idProyDetalleLoteResumen=? ", [Object.values(props).join(), proyDetalleLoteResumenId]);
            await connection.query("COMMIT");

        } catch (error) {
            await connection.query("ROLLBACK");

            throw error;
        } finally {
            connection.release();
        }
    },
    exportarExcelResumen: async function (dataExcel = []) {
        try {
            const rutaTemplateHC = `./template/plantilla proyeccion total ingresos resumen.xlsx`;
            const backgroundColumn = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "B7B7B7" }
            }
            const alignmentStyle = { vertical: "middle", horizontal: "center", wrapText: true }
            const styleText = {
                color: { argb: 'FDFDFD' }
            }
            const borderStyles = {
                top: { style: "thin", color: { argb: "E8F8F2" } },
                left: { style: "thin", color: { argb: "E8F8F2" } },
                bottom: { style: "thin", color: { argb: "E8F8F2" } },
                right: { style: "thin", color: { argb: "E8F8F2" } }
            };
            const borderStylesC = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            if (fs.existsSync(`./template/exportacion proyeccion total ingresos resumen.xlsx`)) {
                fs.unlinkSync(`./template/exportacion proyeccion total ingresos resumen.xlsx`)
            }
            const wor = await workbook.xlsx.readFile(rutaTemplateHC)
            const sheet = wor.worksheets[0];
            const ultimaColumna = 6
            const row = sheet.getRow(3)
            const rowUltimasColumnas = sheet.getRow(4)
            row.getCell(6).value = "HEMBRAS A VENDER (EN UNIDADES)"
            row.getCell(6).fill = backgroundColumn
            row.getCell(6).border = borderStyles
            row.getCell(6).alignment = alignmentStyle;
            row.getCell(6).font = styleText;
            sheet.mergeCells(3, 6, 3, dataExcel.clientes.length + 6)
            row.getCell(dataExcel.clientes.length + 7).value = 'MACHOS A VENDER (EN UNIDADES)'
            row.getCell(dataExcel.clientes.length + 7).fill = backgroundColumn
            row.getCell(dataExcel.clientes.length + 7).border = borderStyles
            row.getCell(dataExcel.clientes.length + 7).alignment = alignmentStyle;
            row.getCell(dataExcel.clientes.length + 7).font = styleText;
            sheet.mergeCells(3, dataExcel.clientes.length + 7, 3, dataExcel.clientes.length + 8)

            const ultimaColumnaPedido = this.pintarPedidosExcel(sheet, dataExcel.clientes, ultimaColumna, 4, 5);
            const columnaHembraSobrandte = ultimaColumnaPedido;
            rowUltimasColumnas.getCell(columnaHembraSobrandte).value = "Sobrante o Faltante"
            rowUltimasColumnas.getCell(columnaHembraSobrandte).fill = backgroundColumn
            rowUltimasColumnas.getCell(columnaHembraSobrandte).border = borderStyles
            rowUltimasColumnas.getCell(columnaHembraSobrandte).alignment = alignmentStyle;
            rowUltimasColumnas.getCell(columnaHembraSobrandte).font = styleText;
            sheet.mergeCells(4, columnaHembraSobrandte, 5, columnaHembraSobrandte)

            rowUltimasColumnas.getCell(columnaHembraSobrandte + 1).value = "PEDIDO ACUMULADO"
            rowUltimasColumnas.getCell(columnaHembraSobrandte + 1).fill = backgroundColumn
            rowUltimasColumnas.getCell(columnaHembraSobrandte + 1).border = borderStyles
            rowUltimasColumnas.getCell(columnaHembraSobrandte + 1).alignment = alignmentStyle;
            rowUltimasColumnas.getCell(columnaHembraSobrandte + 1).font = styleText;
            sheet.mergeCells(4, columnaHembraSobrandte + 1, 5, columnaHembraSobrandte + 1)

            rowUltimasColumnas.getCell(columnaHembraSobrandte + 2).value = "Sobrante o Faltante"
            rowUltimasColumnas.getCell(columnaHembraSobrandte + 2).fill = backgroundColumn
            rowUltimasColumnas.getCell(columnaHembraSobrandte + 2).border = borderStyles
            rowUltimasColumnas.getCell(columnaHembraSobrandte + 2).alignment = alignmentStyle;
            rowUltimasColumnas.getCell(columnaHembraSobrandte + 2).font = styleText;
            sheet.mergeCells(4, columnaHembraSobrandte + 2, 5, columnaHembraSobrandte + 2)

            for (let i = 0; i < dataExcel.reporte.length; i++) {
                const rowData = sheet.getRow(6 + i);
                const reporte = dataExcel.reporte[i]
                rowData.getCell(1).value = reporte.fecha;
                rowData.getCell(1).border = borderStylesC;
                rowData.getCell(2).value = reporte.totalLineaHembra.sumaTotalHuevosIncubablesHembra
                rowData.getCell(2).border = borderStylesC
                rowData.getCell(3).value = reporte.totalLineaHembra.sumaTotalBbsHembra
                rowData.getCell(3).border = borderStylesC

                rowData.getCell(4).value = reporte.totalLineaMacho.sumaTotalHuevosIncubablesMachos
                rowData.getCell(4).border = borderStylesC
                rowData.getCell(5).value = reporte.totalLineaMacho.sumaTotalBbsMacho
                rowData.getCell(5).border = borderStylesC
                let column = 6;
                reporte.pedidos.forEach((pedido, index) => {
                    rowData.getCell(column).value = pedido.pedidoHembra
                    rowData.getCell(column).border = borderStylesC
                    rowData.getCell(column).fill = { ...backgroundColumn, fgColor: { argb: pedido.color.replace("#", "") } }
                    column++;
                })
                rowData.getCell(column).value = reporte.sobranteFaltanteHembra
                rowData.getCell(column).border = borderStylesC

                rowData.getCell(column + 1).value = reporte.totalAcumuladoMacho
                rowData.getCell(column + 1).border = borderStylesC

                rowData.getCell(column + 2).value = reporte.sobranteFaltanteMacho
                rowData.getCell(column + 2).border = borderStylesC
            }
            await workbook.xlsx.writeFile(`./template/exportacion proyeccion total ingresos resumen.xlsx`)
            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "/template/exportacion proyeccion total ingresos resumen.xlsx"
            }
            return json;
        } catch (error) {
            console.log("e", error)
            throw error;
        }

    },
    exportarExcel: async function () {
        try {
            const dataExcel = await this.totalIngreso({});
            const rutaTemplateHC = `./template/plantilla proyeccion total ingresos.xlsx`;
            const backgroundColumn = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "B7B7B7" }
            }
            const alignmentStyle = { vertical: "middle", horizontal: "center", wrapText: true }
            const styleText = {
                color: { argb: 'FDFDFD' }
            }
            const borderStyles = {
                top: { style: "thin", color: { argb: "E8F8F2" } },
                left: { style: "thin", color: { argb: "E8F8F2" } },
                bottom: { style: "thin", color: { argb: "E8F8F2" } },
                right: { style: "thin", color: { argb: "E8F8F2" } }
            };
            const borderStylesC = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            if (fs.existsSync(`./template/proyeccion total ingresos.xlsx`)) {
                fs.unlinkSync(`./template/proyeccion total ingresos.xlsx`)
            }
            const wor = await workbook.xlsx.readFile(rutaTemplateHC)
            const sheet = wor.worksheets[0];

            const ultimaColumna = this.pintarLotesExcel(sheet, dataExcel.lotes)

            const row = sheet.getRow(3)
            const rowHembraMacho = sheet.getRow(4)
            const rowHiBbs = sheet.getRow(5)
            row.getCell(ultimaColumna + 2).value = "TOTAL (EN MILES DE UNIDADES)"
            row.getCell(ultimaColumna + 2).fill = backgroundColumn;
            row.getCell(ultimaColumna + 2).border = borderStyles;
            row.getCell(ultimaColumna + 2).alignment = alignmentStyle;
            row.getCell(ultimaColumna + 2).font = styleText;
            sheet.mergeCells(3, ultimaColumna + 2, 3, ultimaColumna + 5)
            row.getCell(ultimaColumna + 6).value = "TOTAL (EN MILES DE UNIDADES)"
            row.getCell(ultimaColumna + 6).fill = backgroundColumn;
            row.getCell(ultimaColumna + 6).border = borderStyles;
            row.getCell(ultimaColumna + 6).alignment = alignmentStyle;
            row.getCell(ultimaColumna + 6).font = styleText;
            sheet.mergeCells(3, ultimaColumna + 6, 3, ultimaColumna + 9)
            rowHembraMacho.getCell(ultimaColumna + 2).value = "HEMBRA"
            rowHembraMacho.getCell(ultimaColumna + 2).fill = backgroundColumn;
            rowHembraMacho.getCell(ultimaColumna + 2).border = borderStyles;
            rowHembraMacho.getCell(ultimaColumna + 2).alignment = alignmentStyle;
            rowHembraMacho.getCell(ultimaColumna + 2).font = styleText;
            sheet.mergeCells(4, ultimaColumna + 2, 4, ultimaColumna + 5)
            rowHembraMacho.getCell(ultimaColumna + 6).value = "MACHO"
            rowHembraMacho.getCell(ultimaColumna + 6).fill = backgroundColumn;
            rowHembraMacho.getCell(ultimaColumna + 6).border = borderStyles;
            rowHembraMacho.getCell(ultimaColumna + 6).alignment = alignmentStyle;
            rowHembraMacho.getCell(ultimaColumna + 6).font = styleText;
            sheet.mergeCells(4, ultimaColumna + 6, 4, ultimaColumna + 9)
            rowHiBbs.getCell(ultimaColumna + 2).value = "# H.I"
            rowHiBbs.getCell(ultimaColumna + 2).fill = backgroundColumn;
            rowHiBbs.getCell(ultimaColumna + 2).border = borderStyles;
            rowHiBbs.getCell(ultimaColumna + 2).alignment = alignmentStyle;
            rowHiBbs.getCell(ultimaColumna + 2).font = styleText;
            rowHiBbs.getCell(ultimaColumna + 3).value = "# H.I REAL"
            rowHiBbs.getCell(ultimaColumna + 3).fill = backgroundColumn;
            rowHiBbs.getCell(ultimaColumna + 3).border = borderStyles;
            rowHiBbs.getCell(ultimaColumna + 3).alignment = alignmentStyle;
            rowHiBbs.getCell(ultimaColumna + 3).font = styleText;
            rowHiBbs.getCell(ultimaColumna + 4).value = "# BBs	"
            rowHiBbs.getCell(ultimaColumna + 4).fill = backgroundColumn;
            rowHiBbs.getCell(ultimaColumna + 4).border = borderStyles;
            rowHiBbs.getCell(ultimaColumna + 4).alignment = alignmentStyle;
            rowHiBbs.getCell(ultimaColumna + 4).font = styleText;
            rowHiBbs.getCell(ultimaColumna + 5).value = "# BBs REAL"
            rowHiBbs.getCell(ultimaColumna + 5).fill = backgroundColumn;
            rowHiBbs.getCell(ultimaColumna + 5).border = borderStyles;
            rowHiBbs.getCell(ultimaColumna + 5).alignment = alignmentStyle;
            rowHiBbs.getCell(ultimaColumna + 5).font = styleText;
            rowHiBbs.getCell(ultimaColumna + 6).value = "# H.I"
            rowHiBbs.getCell(ultimaColumna + 6).fill = backgroundColumn;
            rowHiBbs.getCell(ultimaColumna + 6).border = borderStyles;
            rowHiBbs.getCell(ultimaColumna + 6).alignment = alignmentStyle;
            rowHiBbs.getCell(ultimaColumna + 6).font = styleText;
            rowHiBbs.getCell(ultimaColumna + 7).value = "# H.I REAL"
            rowHiBbs.getCell(ultimaColumna + 7).fill = backgroundColumn;
            rowHiBbs.getCell(ultimaColumna + 7).border = borderStyles;
            rowHiBbs.getCell(ultimaColumna + 7).alignment = alignmentStyle;
            rowHiBbs.getCell(ultimaColumna + 7).font = styleText;
            rowHiBbs.getCell(ultimaColumna + 8).value = "# BBs	"
            rowHiBbs.getCell(ultimaColumna + 8).fill = backgroundColumn;
            rowHiBbs.getCell(ultimaColumna + 8).border = borderStyles;
            rowHiBbs.getCell(ultimaColumna + 8).alignment = alignmentStyle;
            rowHiBbs.getCell(ultimaColumna + 8).font = styleText;
            rowHiBbs.getCell(ultimaColumna + 9).value = "# BBs REAL"
            rowHiBbs.getCell(ultimaColumna + 9).fill = backgroundColumn;
            rowHiBbs.getCell(ultimaColumna + 9).border = borderStyles;
            rowHiBbs.getCell(ultimaColumna + 9).alignment = alignmentStyle;
            rowHiBbs.getCell(ultimaColumna + 9).font = styleText;
            row.getCell(ultimaColumna + 10).value = "Machos"
            row.getCell(ultimaColumna + 10).fill = backgroundColumn;
            row.getCell(ultimaColumna + 10).border = borderStyles;
            row.getCell(ultimaColumna + 10).alignment = alignmentStyle;
            row.getCell(ultimaColumna + 10).font = styleText;
            sheet.mergeCells(3, ultimaColumna + 10, 5, ultimaColumna + 10)

            //sheet.mergeCells(5, ultimaColumna + 10, 5, ultimaColumna + 10)
            row.getCell(ultimaColumna + 11).value = `MACHOS Sobrantes/Faltante`
            row.getCell(ultimaColumna + 11).fill = backgroundColumn;
            row.getCell(ultimaColumna + 11).border = borderStyles;
            row.getCell(ultimaColumna + 11).alignment = alignmentStyle;
            row.getCell(ultimaColumna + 11).font = styleText;

            sheet.mergeCells(3, ultimaColumna + 11, 5, ultimaColumna + 11)
            const ultimaColumnaPedido = this.pintarPedidosExcel(sheet, dataExcel.clientes, ultimaColumna + 12);
            const columnaHembraSobrandte = ultimaColumnaPedido;
            row.getCell(columnaHembraSobrandte).value = "HEMBRA Sobrante/Faltante"
            row.getCell(columnaHembraSobrandte).fill = backgroundColumn
            row.getCell(columnaHembraSobrandte).border = borderStyles
            row.getCell(columnaHembraSobrandte).alignment = alignmentStyle;
            row.getCell(columnaHembraSobrandte).font = styleText;
            sheet.mergeCells(3, columnaHembraSobrandte, 5, columnaHembraSobrandte)
            for (let i = 0; i < dataExcel.reporte.length; i++) {
                const rowData = sheet.getRow(6 + i);
                const reporte = dataExcel.reporte[i]
                rowData.getCell(1).value = reporte.fecha;
                rowData.getCell(1).border = borderStylesC;
                let column = 0;
                reporte.lotes.forEach((lote, index) => {
                    rowData.getCell(column + 2).value = lote.lineaHembra.hi
                    rowData.getCell(column + 2).border = borderStylesC
                    rowData.getCell(column + 3).value = lote.lineaHembra.bbs
                    rowData.getCell(column + 3).border = borderStylesC
                    rowData.getCell(column + 4).value = lote.lineaMacho.hi
                    rowData.getCell(column + 4).border = borderStylesC
                    rowData.getCell(column + 5).value = lote.lineaMacho.bbs
                    rowData.getCell(column + 5).border = borderStylesC
                    column += 4;
                })
                console.log(column)
                rowData.getCell(column + 2).value = reporte.totalLineaHembra.sumaTotalHuevosIncubablesHembra
                rowData.getCell(column + 2).border = borderStylesC
                rowData.getCell(column + 3).value = reporte.totalLineaHembra.totalHiHembraReal
                rowData.getCell(column + 3).border = borderStylesC

                rowData.getCell(column + 4).value = reporte.totalLineaHembra.sumaTotalBbsHembra
                rowData.getCell(column + 4).border = borderStylesC
                rowData.getCell(column + 5).value = reporte.totalLineaHembra.totalBbsHembraReal
                rowData.getCell(column + 5).border = borderStylesC

                rowData.getCell(column + 6).value = reporte.totalLineaMacho.sumaTotalHuevosIncubablesMachos
                rowData.getCell(column + 6).border = borderStylesC
                rowData.getCell(column + 7).value = reporte.totalLineaMacho.totalHiMachoReal
                rowData.getCell(column + 7).border = borderStylesC

                rowData.getCell(column + 8).value = reporte.totalLineaMacho.sumaTotalBbsMacho
                rowData.getCell(column + 8).border = borderStylesC
                rowData.getCell(column + 9).value = reporte.totalLineaMacho.totalBbsMachoReal
                rowData.getCell(column + 9).border = borderStylesC

                rowData.getCell(column + 10).value = reporte.totalMacho
                rowData.getCell(column + 10).border = borderStylesC
                rowData.getCell(column + 11).value = reporte.totalLineaMacho.sumaTotalBbsMacho - reporte.totalMacho;
                rowData.getCell(column + 11).border = borderStylesC
                column += 11;
                reporte.pedidos.forEach((pedido, index) => {
                    rowData.getCell(column + 1).value = pedido.pedidoHembra
                    rowData.getCell(column + 1).border = borderStylesC
                    rowData.getCell(column + 1).fill = { ...backgroundColumn, fgColor: { argb: pedido.color.replace("#", "") } }
                    column++;
                })
                rowData.getCell(column + 1).value = reporte.totalLineaHembra.sumaTotalBbsHembra - reporte.sumaTotalPedidoHembra
                rowData.getCell(column + 1).border = borderStylesC
            }
            await workbook.xlsx.writeFile(`./template/proyeccion total ingresos.xlsx`)
            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "/template/proyeccion total ingresos.xlsx"
            }
            return json;
        } catch (error) {
            console.log("e", error)
            throw error;
        }

    },
    pintarPedidosExcel: function (sheet, clientes = [], columnaInicial, top = 3, button = 5) {
        let counterColumn = columnaInicial;
        const backgroundColumn = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "B7B7B7" }
        }
        const alignmentStyle = { vertical: "middle", horizontal: "center", wrapText: true }
        const styleText = {
            color: { argb: 'FDFDFD' }
        }
        const borderStyles = {
            top: { style: "thin", color: { argb: "E8F8F2" } },
            left: { style: "thin", color: { argb: "E8F8F2" } },
            bottom: { style: "thin", color: { argb: "E8F8F2" } },
            right: { style: "thin", color: { argb: "E8F8F2" } }
        };
        const rowClientes = sheet.getRow(top);
        for (let j = 0; j < clientes.length; j++) {
            const cliente = clientes[j]
            rowClientes.getCell(counterColumn).value = cliente.nombreCliente;
            rowClientes.getCell(counterColumn).fill = { ...backgroundColumn, fgColor: { argb: cliente.color.replace("#", "") } };;
            rowClientes.getCell(counterColumn).alignment = alignmentStyle
            rowClientes.getCell(counterColumn).font = styleText;
            rowClientes.getCell(counterColumn).border = borderStyles;

            sheet.mergeCells(top, counterColumn, button, counterColumn)
            counterColumn++;
        }
        return counterColumn;
    },
    pintarLotesExcel: function (sheet, lotes = [], columnaInicial = 2) {
        let counterColumn = columnaInicial;
        let titleCounterColumn = 2;
        const backgroundColumn = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "B7B7B7" }
        }
        const alignmentStyle = { vertical: "middle", horizontal: "center" }
        const styleText = {
            color: { argb: 'FDFDFD' }
        }
        const borderStyles = {
            top: { style: "thin", color: { argb: "E8F8F2" } },
            left: { style: "thin", color: { argb: "E8F8F2" } },
            bottom: { style: "thin", color: { argb: "E8F8F2" } },
            right: { style: "thin", color: { argb: "E8F8F2" } }
        };
        for (let rowInit = 1; rowInit <= lotes.length * 4; rowInit++) {
            const lote = lotes[rowInit - 1];
            const rowTitle = sheet.getRow(3);
            const rowDetalleSexo = sheet.getRow(4)
            const rowDetalleHembraMacho = sheet.getRow(5)


            if (titleCounterColumn < lotes.length * 4) {
                rowTitle.getCell(titleCounterColumn).value = lote;
                rowTitle.getCell(titleCounterColumn).border = borderStyles;
                rowTitle.getCell(titleCounterColumn).fill = backgroundColumn;
                rowTitle.getCell(titleCounterColumn).alignment = alignmentStyle;
                rowTitle.getCell(titleCounterColumn).font = styleText;
                sheet.mergeCells(3, titleCounterColumn, 3, titleCounterColumn + 3)
                rowDetalleSexo.getCell(titleCounterColumn).value = "Hembra"
                rowDetalleSexo.getCell(titleCounterColumn).border = borderStyles;
                rowDetalleSexo.getCell(titleCounterColumn).fill = backgroundColumn;
                rowDetalleSexo.getCell(titleCounterColumn).alignment = alignmentStyle;
                rowDetalleSexo.getCell(titleCounterColumn).font = styleText;
                sheet.mergeCells(4, titleCounterColumn, 4, titleCounterColumn + 1)
                rowDetalleSexo.getCell(titleCounterColumn + 2).value = "Macho"
                rowDetalleSexo.getCell(titleCounterColumn + 2).border = borderStyles;
                rowDetalleSexo.getCell(titleCounterColumn + 2).alignment = alignmentStyle;


                rowDetalleSexo.getCell(titleCounterColumn + 2).fill = backgroundColumn;
                rowDetalleSexo.getCell(titleCounterColumn + 2).font = styleText;

                sheet.mergeCells(4, titleCounterColumn + 2, 4, titleCounterColumn + 3)

            }
            rowDetalleHembraMacho.getCell(counterColumn).alignment = alignmentStyle;
            rowDetalleHembraMacho.getCell(counterColumn).border = borderStyles;
            rowDetalleHembraMacho.getCell(counterColumn).fill = backgroundColumn;
            rowDetalleHembraMacho.getCell(counterColumn).font = styleText;
            if (rowInit % 2 == 0) {
                rowDetalleHembraMacho.getCell(counterColumn).value = "#BBs";
            } else {

                rowDetalleHembraMacho.getCell(counterColumn).value = "#Hi";
            }
            titleCounterColumn += 4;

            counterColumn++;
        }

        return lotes.length * 4;
    },
    totalIngreso: async function ({ fechaInicial = null, fechaFinal = null }) {

        const connection = await mysql.connection();
        let arrayUnido = []


        try {
            const fechaInicialMoment = moment(fechaInicial)
            const fechaFinalMoment = moment(fechaFinal)
            let factorMortalidad = await factorMortalidadModel.listar();

            if (factorMortalidad.length == 0) {
                throw new Error("No hay un factor registrado")
            }
            let queryIngreso = `select DATE_FORMAT(proResumen.fechaMov,'%Y-%m-%d') as fechaMov,proResumen.saldoBbs,proResumen.saldoHi,ingresoLote.numeroIngreso,lote.tipoGenero,DATE_FORMAT(DATE_ADD(proResumen.fechaMov, INTERVAL (7 - IF(weekday(proResumen.fechaMov)=0, 7, weekday(proResumen.fechaMov))) DAY),'%Y-%m-%d')  as totalIngresosReporte from proy_detalleloteresumen proResumen inner join proy_lote lote on lote.idLote=proResumen.idLote inner join proy_ingresolote ingresoLote on ingresoLote.idProyIngresoLote=lote.idProyIngresoLote ORDER BY proResumen.fechaMov asc`

            if (fechaInicial && fechaFinal) {

                queryIngreso = `select DATE_FORMAT(proResumen.fechaMov,'%Y-%m-%d') as fechaMov,proResumen.saldoBbs,proResumen.saldoHi,ingresoLote.numeroIngreso,lote.tipoGenero,DATE_FORMAT(DATE_ADD(proResumen.fechaMov, INTERVAL (7 - IF(weekday(proResumen.fechaMov)=0, 7, weekday(proResumen.fechaMov))) DAY),'%Y-%m-%d')  as totalIngresosReporte from proy_detalleloteresumen proResumen inner join proy_lote lote on lote.idLote=proResumen.idLote inner join proy_ingresolote ingresoLote on ingresoLote.idProyIngresoLote=lote.idProyIngresoLote 
                where proResumen.fechaMov BETWEEN '${fechaInicialMoment.format("YYYY-MM-DD")}' AND '${fechaFinalMoment.format("YYYY-MM-DD")}' ORDER BY proResumen.fechaMov asc`
            }

            factorMortalidad = factorMortalidad[0];
            const listaResumenConLote = await connection.query(queryIngreso);
            if (listaResumenConLote.length == 0) {
                throw new Error("No existe informacion")
            }
            const lotes = listaResumenConLote.map((resumen) => resumen.numeroIngreso).sort((a, b) => a - b).map(numeroIngreso => `Lote ${numeroIngreso}`).reduce((prev, current) => {
                if (!prev.find(p => p == current)) { prev.push(current) }
                return prev;
            }, [])

            const fechasUnicas = listaResumenConLote.map(resumen => resumen.fechaMov).reduce((prev, current) => {
                if (!prev.find(p => p == current)) {
                    prev.push(current)
                }
                return prev;
            }, [])
            let fechaUnicasTotalIngresos = listaResumenConLote.map(resumen => resumen.totalIngresosReporte).reduce((prev, current) => {
                if (!prev.find(p => p == current)) {
                    prev.push(current)
                }
                return prev;
            }, [])
            if (fechaFinal) {

                fechaUnicasTotalIngresos = fechaUnicasTotalIngresos.filter(l => moment(l).isSameOrBefore(fechaFinalMoment))
            }
            const totalHiRealPorFechas = await connection.query(`select TipoGenero,w.fechaNacimiento,sum(Ventas) BBs,DATE_FORMAT(DATE_ADD(w.fechaNacimiento, INTERVAL (7 - IF(weekday(w.fechaNacimiento)=0, 7, weekday(w.fechaNacimiento))) DAY),'%Y-%m-%d')  as totalIngresosReporte from (
                select B.idLote, (B.Ventas+B.carneNoVendida) Ventas ,A.fechaNacimiento ,C.TipoGenero
                from nacimiento A left join nacimiento_det B on B.idNacimiento=A.idNacimiento
                left join lotes C on C.idLote=B.idLote
                )w  where  w.fechaNacimiento in(${fechasUnicas.map(fecha => moment(fecha).subtract(7, "days").format("YYYY-MM-DD"))}) and TipoGenero in('LH','LM')
                group by TipoGenero,w.fechaNacimiento
                `)
            const totalBbsRealPorFecha = await connection.query(`select TipoGenero,w.fechaNacimiento,sum(Ventas) Bbs,DATE_FORMAT(DATE_ADD(w.fechaNacimiento, INTERVAL (7 - IF(weekday(w.fechaNacimiento)=0, 7, weekday(w.fechaNacimiento))) DAY),'%Y-%m-%d')  as totalIngresosReporte from (
                select B.idLote, (B.Ventas+B.carneNoVendida) Ventas ,A.fechaNacimiento ,C.TipoGenero
                from nacimiento A left join nacimiento_det B on B.idNacimiento=A.idNacimiento
                left join lotes C on C.idLote=B.idLote
                )w  where  w.fechaNacimiento in(${fechasUnicas.map(fecha => moment(fecha).subtract(7, "days").format("YYYY-MM-DD"))}) and TipoGenero in('LH','LM')
                group by TipoGenero,w.fechaNacimiento
                `)
            const clientesPorFechas = await connection.query(`select pv.color,pv.rucCliente,pv.nombreCliente,DATE_FORMAT( pvd.fechaPedido,'%Y-%m-%d') as fechaPedido,pvd.cantidadHembras as pedidoHembra,pvd.cantidadMachos as pedidoMacho,cl.CL_CNOMCOM as nombreAlternativoProveedor  from proy_pedido_venta pv inner join  proy_pedido_venta_detalle pvd on pv.id=pvd.idPedidoVenta left join clientes cl on cl.CL_CCODCLI=pv.rucCliente order by pv.orden asc`);
            const clientesUnicos = clientesPorFechas.reduce((prev, current) => {
                if (!prev.find((p) => p.rucCliente == current.rucCliente)) {
                    prev.push(current);
                }
                return prev;
            }, [])
            for (let i = 0; i < fechaUnicasTotalIngresos.length; i++) {
                const fechaActual = fechaUnicasTotalIngresos[i];
                const listaFiltradaPorFecha = listaResumenConLote.filter(resumen => resumen.totalIngresosReporte == fechaActual);
                arrayUnido.push(this.agruparFechasPorLotes(listaFiltradaPorFecha, clientesPorFechas, lotes, factorMortalidad.factor_venta_macho, totalHiRealPorFechas, totalBbsRealPorFecha, fechaActual))
            }
            await connection.release();
            return { reporte: arrayUnido, lotes, clientes: clientesUnicos };
        } catch (error) {
            console.log("er", error)
            throw error;
        }
    },
    listarTotalHiBbsRealYProyectadoPorSemanaYAño: async function ({ anio }) {
        const connection = await mysql.connection();
        const listaSemanalProyectadoYReal = []

        try {
            const listaSaldoBbsYSaldoHiProyectadoLhLmSemanal = await connection.query(`select week(proResumen.fechaMov,1)  semana,proResumen.fechaMov,ROUND(sum(proResumen.saldoBbs)) saldoBbs,ROUND(sum(proResumen.saldoHi)) saldoHi,lote.tipoGenero from proy_detalleloteresumen proResumen 
inner join proy_lote lote on lote.idLote=proResumen.idLote inner join proy_ingresolote ingresoLote on ingresoLote.idProyIngresoLote=lote.idProyIngresoLote 
where YEAR(proResumen.fechaMov)=${anio} GROUP BY semana,lote.tipoGenero ORDER BY semana asc
`)
            const listaHiRealSemanal = await this.listarHiRealPorFechas({ anio })
            const listaBbsRealSemanal = await this.listarBbsRealPorFecha({ anio })
            for (let i = 0; i < listaSaldoBbsYSaldoHiProyectadoLhLmSemanal.length; i++) {
                const saldoBbsHiProyectadoActual = listaSaldoBbsYSaldoHiProyectadoLhLmSemanal[i]
                const { totalHi = 0 } = listaHiRealSemanal.find(hiR => hiR.TipoGenero == saldoBbsHiProyectadoActual.tipoGenero && hiR.semana == saldoBbsHiProyectadoActual.semana) || {}
                const { Bbs = 0 } = listaBbsRealSemanal.find(hiR => hiR.TipoGenero == saldoBbsHiProyectadoActual.tipoGenero && hiR.semana == saldoBbsHiProyectadoActual.semana) || {}
                listaSemanalProyectadoYReal.push({
                    semana: saldoBbsHiProyectadoActual.semana,
                    tipoGenero: saldoBbsHiProyectadoActual.tipoGenero,
                    hiProyectado: saldoBbsHiProyectadoActual.saldoHi,
                    bbsProyectado: saldoBbsHiProyectadoActual.saldoBbs,
                    hiReal: totalHi,
                    bbsReal: Bbs,
                    fecha: moment(saldoBbsHiProyectadoActual.fechaMov).format("YYYY-MM-DD")
                })



            }
            return listaSemanalProyectadoYReal;
        } catch (error) {
            throw error;
        } finally {
            connection.release();

        }


    },
    porcentajeNacimientoRealVsProyectadoPorLotes: async function (lotesId = []) {
        const connection = await mysql.connection();

        try {
            const data = await connection.query(`select A.idLote,A.idProyIngresoLote,lote,B.semana,round(B.porcentajeNacimiento,2) porcentajeNacimientoProyectado ,
            round(coalesce(B.porcentajeNacimientoReal,0),2) porcentajeNacimientoReal 
            from proy_lote A 
            left join proy_loteDetalle B on B.idLote=A.idLote and B.idProyIngresoLote=A.idProyIngresoLote
            where A.idlOTE in (${lotesId.join()}) and B.semana>25
            order by A.idLote ,B.semana
            `)
            const semanasData = await connection.query(`select DISTINCT B.semana  as semana
            from proy_lote A 
            left join proy_loteDetalle B on B.idLote=A.idLote and B.idProyIngresoLote=A.idProyIngresoLote
            where A.idlOTE in (${lotesId}) and B.semana>25
            order by  B.semana
            `)

            return { data, semanas: semanasData.map(d => d.semana) }
        } catch (error) {
            throw error;
        } finally {
            connection.release();

        }
    },
    comparativoHiPorLotes: async function (lotesId = []) {
        const connection = await mysql.connection();

        try {
            const data = await connection.query(`select A.idLote,A.idProyIngresoLote,lote,B.semana,round(B.saldoHI,0) hiProyectado ,
            round(coalesce(B.saldoHiReal,0),0) hiReal 
            from proy_lote A 
            left join proy_loteDetalle B on B.idLote=A.idLote and B.idProyIngresoLote=A.idProyIngresoLote
            where A.idlOTE in (${lotesId.join()}) and B.semana>25
            order by A.idLote ,B.semana
            
            `)
            const semanasData = await connection.query(`select DISTINCT B.semana as semana
            from proy_lote A 
            left join proy_loteDetalle B on B.idLote=A.idLote and B.idProyIngresoLote=A.idProyIngresoLote
            where A.idlOTE in (${lotesId.join()}) and B.semana>25
            order by B.semana
            
            `)

            return { data, semanas: semanasData.map(d => d.semana) }
        } catch (error) {
            throw error;
        } finally {
            connection.release();

        }
    },
    lotes: async function () {
        const connection = await mysql.connection();

        try {
            const lotesMacho = await connection.query(`select idLote as id,loteStr as nombre
            from proy_lote where idLote>=93 and tipoGenero='LM' and sexo='H' order by idLote desc
            `)

            const lotesHembra = await connection.query(`select idLote as id,loteStr as nombre 
            from proy_lote where idLote>=93 and tipoGenero='LH' and sexo='H' order by idLote desc
            `)

            return { lotesHembra, lotesMacho }
        } catch (error) {
            throw error;
        } finally {
            connection.release();

        }
    },
    porcentajeCumplimientoClientePorAnio: async function ({ anio }) {
        const connection = await mysql.connection();

        try {
            const data = await connection.query(`call sp_reporte2('${anio}')`)
            return data[data.length - 2];
        } catch (error) {
            throw error;
        } finally {
            connection.release();

        }
    },


    listarHiRealPorFechas: async function ({ fechasUnicas = [], anio }) {
        const connection = await mysql.connection();

        try {
            const data = await connection.query(`select TipoGenero,anios,semana,ROUND(sum(TotalHI)) totalHi,fechaRegistro from (
                select A.idLote,B.lote_str,B.TipoGenero, A.TotalHI,A.fechaRegistro,WEEK(STR_TO_DATE(A.fechaRegistro,'%d-%m-%Y'),1)semana ,
                YEAR(A.fechaRegistro)  anios from produccion_huevos_det A left join lotes B on B.idLote=A.idLote 
                )w where   TipoGenero in('LM','LH') ${fechasUnicas.length > 0 ? `and w.fechaRegistro in(${fechasUnicas.join()})` : ''}  ${anio ? `and substring(w.fechaRegistro,7,4)=${anio}` : ''}
                group by TipoGenero,anios,semana`)
            return data;
        } catch (error) {
            throw error;
        } finally {
            await connection.release();
        }

    },
    listarBbsRealPorFecha: async function ({ fechasUnicas = [], anio }) {
        const connection = await mysql.connection();

        try {
            const data = await connection.query(`select TipoGenero,anios,semana,ROUND(sum(Ventas)) Bbs,fechaNacimiento from (
                select A.fechaNacimiento,B.idLote,B.Ventas ,YEAR(A.fechaNacimiento) anios,
                WEEK(A.fechaNacimiento,1)semana ,C.TipoGenero
                from nacimiento A left join nacimiento_det B on B.idNacimiento=A.idNacimiento
                left join lotes C on C.idLote=B.idLote)w  where TipoGenero in('LM','LH') ${fechasUnicas.length > 0 ? `and w.fechaNacimiento in (${fechasUnicas.join()})` : ''}  
                ${anio ? `and anios=${anio}` : ''}
                group by TipoGenero,anios,semana
                `, [fechasUnicas])
            return data;
        } catch (error) {
            throw error;
        } finally {
            connection.release();

        }
    },
    agruparFechasPorLotes: function (fechasConLotes = [], fechaPedidos = [], lotes = [], factoVentaMacho = 0, totalHiRealPorFechas = [], totalBbsRealPorFecha = [], fechaActual) {
        let arrayTransformado = []
        const arrayPedidos = []
        let sumaTotalHuevosIncubablesHembra = 0;
        let sumaTotalHuevosIncubablesMachos = 0;
        let sumaTotalBbsHembra = 0;
        let sumaTotalBbsMacho = 0;
        let sumaTotalPedidoHembra = 0;
        let totalAcumuladoMacho = 0;
        const fecha = fechaActual
        const { totalHi: totalHiHembraReal = 0 } = totalHiRealPorFechas.find(hiR => moment(hiR.totalIngresosReporte).format("YYYY-MM-DD") == fecha && hiR.TipoGenero == "LH") || {}
        const { totalHi: totalHiMachoReal = 0 } = totalHiRealPorFechas.find(hiR => moment(hiR.totalIngresosReporte).format("YYYY-MM-DD") == fecha && hiR.TipoGenero == "LM") || {}

        const { Bbs: totalBbsHembraReal = 0 } = totalBbsRealPorFecha.find(bbsReal => moment(bbsReal.totalIngresosReporte).format("YYYY-MM-DD") == fecha && bbsReal.TipoGenero == "LH") || {}
        const { Bbs: totalBbsMachoReal = 0 } = totalBbsRealPorFecha.find(bbsReal => moment(bbsReal.totalIngresosReporte).format("YYYY-MM-DD") == fecha && bbsReal.TipoGenero == "LM") || {}

        for (let i = 0; i < fechaPedidos.length; i++) {
            const fechaPedidoActual = fechaPedidos[i];
            const { pedidoHembra = 0, pedidoMacho = 0 } = fechaPedidos.find((pedido) => pedido.rucCliente.trim() == fechaPedidoActual.rucCliente.trim() && fecha == pedido.fechaPedido) || {}
            if (!arrayPedidos.find((pedido) => pedido.rucCliente == fechaPedidoActual.rucCliente)) {
                sumaTotalPedidoHembra += pedidoHembra;
                totalAcumuladoMacho += pedidoHembra * factoVentaMacho;
                arrayPedidos.push({ ...fechaPedidoActual, fechaPedido: fecha, pedidoHembra, pedidoMacho })

            }

        }
        for (let j = 0; j < lotes.length; j++) {
            const fechaConLoteActual = lotes[j]
            const loteH = fechasConLotes.find((loteResumen) => fechaConLoteActual == "Lote " + loteResumen.numeroIngreso && loteResumen.tipoGenero == "LH") || { saldoHi: 0, saldoBbs: 0 }
            const loteM = fechasConLotes.find((loteResumen) => fechaConLoteActual == "Lote " + loteResumen.numeroIngreso && loteResumen.tipoGenero == "LM") || { saldoHi: 0, saldoBbs: 0 }
            sumaTotalHuevosIncubablesHembra += loteH.saldoHi;
            sumaTotalHuevosIncubablesMachos += loteM.saldoHi;
            sumaTotalBbsHembra += loteH.saldoBbs
            sumaTotalBbsMacho += loteM.saldoBbs
            arrayTransformado.push({
                lote: fechaConLoteActual,
                lineaHembra: {
                    hi: loteH.saldoHi,
                    bbs: loteH.saldoBbs
                },
                lineaMacho: {
                    hi: loteM.saldoHi,
                    bbs: loteM.saldoBbs
                }
            })


        }
        return { sumaTotalPedidoHembra, sobranteFaltanteHembra: sumaTotalBbsHembra - sumaTotalPedidoHembra, totalAcumuladoMacho, sobranteFaltanteMacho: sumaTotalBbsMacho - totalAcumuladoMacho, totalMacho: sumaTotalPedidoHembra * factoVentaMacho, fecha: fechaActual, lotes: arrayTransformado, totalLineaHembra: { totalBbsHembraReal, sumaTotalHuevosIncubablesHembra, sumaTotalBbsHembra, totalHiHembraReal }, totalLineaMacho: { totalBbsMachoReal, sumaTotalHuevosIncubablesMachos, sumaTotalBbsMacho, totalHiMachoReal }, pedidos: arrayPedidos };
    }


}

module.exports = proyDetalleLoteTotalModel