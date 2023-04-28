const moment = require("moment");
const ServerError = require("../error");

const flujoRealProyectadoModelo = require("./flujoRealProyectado")
const mssqlConcar = require("../dbConnectionMSSQLClass")()
var Excel = require('exceljs');
var workbook = new Excel.Workbook();
var fs = require('fs');
const flujoRealProyectado = require("./flujoRealProyectado");

const fc_graficos = {

    egresoProyeccionReal: async function ({ anio }) {
        const dataGrafico = await mssqlConcar.ejecutarQueryPreparado(`EXEC SP_FLUJOGRAFICO_VER_EGRESOS '${anio}'`, {})
        return dataGrafico
    },
    ingresosProyeccionReal: async function ({ anio }) {
        const data = await mssqlConcar.ejecutarQueryPreparado(`EXEC SP_FLUJOGRAFICO_VER_INGRESOS  '${anio}'`, {})
        return data
    },
    saldoProyeccionReal: async function ({ anio }) {
        const data = await mssqlConcar.ejecutarQueryPreparado(`EXEC SP_FLUJOGRAFICO_VER_SALDOS  '${anio}'`, {})
        return data
    },


    flujoEfectivo: async function ({ anio }) {
        const data = await mssqlConcar.ejecutarQueryPreparado(`exec SP_FLUJOGRAFICO_VER_FUENTEEFECTIVO  '${anio}'`, {})
        return data
    },

    usoEfectivo: async function ({ anio }) {
        const data = await mssqlConcar.ejecutarQueryPreparado(`exec SP_FLUJOGRAFICO_VER_USODEEFECTIVO '${anio}'`, {})
        return data
    },


    exportarExcel: async function ({ anio }) {

        try {
            const rutaTemplateHC = `./template/plantilla graficos flujo proyectado real.xlsx`;
            if (fs.existsSync(`./template/graficos flujo proyectado real.xlsx`)) {
                fs.unlinkSync(`./template/graficos flujo proyectado real.xlsx`)
            }
            const dataReal = await flujoRealProyectado.resumenReal({ anio })
            const dataEgresos = await this.egresoProyeccionReal({ anio })
            const dataIngresos = await this.ingresosProyeccionReal({ anio })
            const dataSaldos = await this.saldoProyeccionReal({ anio })
            const borderStyles = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            const fillStyle = { type: 'pattern', pattern: 'solid', fgColor: { argb: '52AEA7' } };
            const dataExcel = fs.readFileSync(rutaTemplateHC);
            const wor = await workbook.xlsx.load(dataExcel)
            const sheet = wor.getWorksheet("real");
            const sheetEgresos = wor.getWorksheet("Egresos");
            const sheetIngreso = wor.getWorksheet("Ingresos");
            const sheetSaldos = wor.getWorksheet("Saldos");

            let initRowReal = 3
            for (const detalleReal of dataReal) {
                sheet.getCell(`A${initRowReal}`).value = detalleReal.concepto
                sheet.getCell(`A${initRowReal}`).border = borderStyles


                sheet.getCell(`B${initRowReal}`).value = detalleReal.tipof
                sheet.getCell(`B${initRowReal}`).border = borderStyles

                sheet.getCell(`C${initRowReal}`).value = Number(detalleReal.acumulado.toFixed(detalleReal.decimales))
                sheet.getCell(`C${initRowReal}`).border = borderStyles
                sheet.getCell(`C${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_acum.replace("#", '') } }
                sheet.getCell(`C${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };

                sheet.getCell(`D${initRowReal}`).value = Number(detalleReal.eneReal.toFixed(detalleReal.decimales))
                sheet.getCell(`D${initRowReal}`).border = borderStyles
                sheet.getCell(`D${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_real.replace("#", '') } }
                sheet.getCell(`D${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };

                sheet.getCell(`E${initRowReal}`).value = Number(detalleReal.eneProy.toFixed(detalleReal.decimales))
                sheet.getCell(`E${initRowReal}`).border = borderStyles
                sheet.getCell(`E${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_proy.replace("#", '') } }
                sheet.getCell(`E${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };


                sheet.getCell(`F${initRowReal}`).value = Number(detalleReal.febReal.toFixed(detalleReal.decimales))
                sheet.getCell(`F${initRowReal}`).border = borderStyles
                sheet.getCell(`F${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_real.replace("#", '') } }
                sheet.getCell(`F${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };


                sheet.getCell(`G${initRowReal}`).value = Number(detalleReal.febProy.toFixed(detalleReal.decimales))
                sheet.getCell(`G${initRowReal}`).border = borderStyles
                sheet.getCell(`G${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_proy.replace("#", '') } }
                sheet.getCell(`G${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };


                sheet.getCell(`H${initRowReal}`).value = Number(detalleReal.marReal.toFixed(detalleReal.decimales))
                sheet.getCell(`H${initRowReal}`).border = borderStyles
                sheet.getCell(`H${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_real.replace("#", '') } }
                sheet.getCell(`H${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };


                sheet.getCell(`I${initRowReal}`).value = Number(detalleReal.marProy.toFixed(detalleReal.decimales))
                sheet.getCell(`I${initRowReal}`).border = borderStyles
                sheet.getCell(`I${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_proy.replace("#", '') } }
                sheet.getCell(`I${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };


                sheet.getCell(`J${initRowReal}`).value = Number(detalleReal.abrReal.toFixed(detalleReal.decimales))
                sheet.getCell(`J${initRowReal}`).border = borderStyles
                sheet.getCell(`J${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_real.replace("#", '') } }
                sheet.getCell(`J${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };


                sheet.getCell(`K${initRowReal}`).value = Number(detalleReal.abrProy.toFixed(detalleReal.decimales))
                sheet.getCell(`K${initRowReal}`).border = borderStyles
                sheet.getCell(`K${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_proy.replace("#", '') } }
                sheet.getCell(`K${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };


                sheet.getCell(`L${initRowReal}`).value = Number(detalleReal.mayReal.toFixed(detalleReal.decimales))
                sheet.getCell(`L${initRowReal}`).border = borderStyles
                sheet.getCell(`L${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_real.replace("#", '') } }
                sheet.getCell(`L${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };


                sheet.getCell(`M${initRowReal}`).value = Number(detalleReal.mayProy.toFixed(detalleReal.decimales))
                sheet.getCell(`M${initRowReal}`).border = borderStyles
                sheet.getCell(`M${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_proy.replace("#", '') } }
                sheet.getCell(`M${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };


                sheet.getCell(`N${initRowReal}`).value = Number(detalleReal.junReal.toFixed(detalleReal.decimales))
                sheet.getCell(`N${initRowReal}`).border = borderStyles
                sheet.getCell(`N${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_real.replace("#", '') } }
                sheet.getCell(`N${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };


                sheet.getCell(`O${initRowReal}`).value = Number(detalleReal.junProy.toFixed(detalleReal.decimales))
                sheet.getCell(`O${initRowReal}`).border = borderStyles
                sheet.getCell(`O${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_proy.replace("#", '') } }
                sheet.getCell(`O${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };


                sheet.getCell(`P${initRowReal}`).value = Number(detalleReal.julReal.toFixed(detalleReal.decimales))
                sheet.getCell(`P${initRowReal}`).border = borderStyles
                sheet.getCell(`P${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_real.replace("#", '') } }
                sheet.getCell(`P${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };


                sheet.getCell(`Q${initRowReal}`).value = Number(detalleReal.julProy.toFixed(detalleReal.decimales))
                sheet.getCell(`Q${initRowReal}`).border = borderStyles
                sheet.getCell(`Q${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_proy.replace("#", '') } }
                sheet.getCell(`Q${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };


                sheet.getCell(`R${initRowReal}`).value = Number(detalleReal.agoReal.toFixed(detalleReal.decimales))
                sheet.getCell(`R${initRowReal}`).border = borderStyles
                sheet.getCell(`R${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_real.replace("#", '') } }
                sheet.getCell(`R${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };


                sheet.getCell(`S${initRowReal}`).value = Number(detalleReal.agoProy.toFixed(detalleReal.decimales))
                sheet.getCell(`S${initRowReal}`).border = borderStyles
                sheet.getCell(`S${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_proy.replace("#", '') } }
                sheet.getCell(`S${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };

                sheet.getCell(`T${initRowReal}`).value = Number(detalleReal.setReal.toFixed(detalleReal.decimales))
                sheet.getCell(`T${initRowReal}`).border = borderStyles
                sheet.getCell(`T${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_real.replace("#", '') } }
                sheet.getCell(`T${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };

                sheet.getCell(`U${initRowReal}`).value = Number(detalleReal.setProy.toFixed(detalleReal.decimales))
                sheet.getCell(`U${initRowReal}`).border = borderStyles
                sheet.getCell(`U${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_proy.replace("#", '') } }
                sheet.getCell(`U${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };

                sheet.getCell(`V${initRowReal}`).value = Number(detalleReal.octReal.toFixed(detalleReal.decimales))
                sheet.getCell(`V${initRowReal}`).border = borderStyles
                sheet.getCell(`V${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_real.replace("#", '') } }
                sheet.getCell(`V${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };

                sheet.getCell(`W${initRowReal}`).value = Number(detalleReal.octProy.toFixed(detalleReal.decimales))
                sheet.getCell(`W${initRowReal}`).border = borderStyles
                sheet.getCell(`W${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_proy.replace("#", '') } }
                sheet.getCell(`W${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };

                sheet.getCell(`X${initRowReal}`).value = Number(detalleReal.novReal.toFixed(detalleReal.decimales))
                sheet.getCell(`X${initRowReal}`).border = borderStyles
                sheet.getCell(`X${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_real.replace("#", '') } }
                sheet.getCell(`X${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };

                sheet.getCell(`Y${initRowReal}`).value = Number(detalleReal.novProy.toFixed(detalleReal.decimales))
                sheet.getCell(`Y${initRowReal}`).border = borderStyles
                sheet.getCell(`Y${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_proy.replace("#", '') } }
                sheet.getCell(`Y${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };

                sheet.getCell(`Z${initRowReal}`).value = Number(detalleReal.dicReal.toFixed(detalleReal.decimales))
                sheet.getCell(`Z${initRowReal}`).border = borderStyles
                sheet.getCell(`Z${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_real.replace("#", '') } }
                sheet.getCell(`Z${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };

                sheet.getCell(`AA${initRowReal}`).value = Number(detalleReal.dicProy.toFixed(detalleReal.decimales))
                sheet.getCell(`AA${initRowReal}`).border = borderStyles
                sheet.getCell(`AA${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_proy.replace("#", '') } }
                sheet.getCell(`AA${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };
                /*            sheet.getCell(`AB${initRow}`).value = detalle.totalReal
                           sheet.getCell(`AB${initRow}`).border = borderStyles
                           sheet.getCell(`AC${initRow}`).value = detalle.totalProy
                           sheet.getCell(`AC${initRow}`).border = borderStyles */

                initRowReal++
            }
            for (let i = 0; i < dataEgresos.length; i++) {
                const dataEgreso = dataEgresos[i];
                const row = sheetEgresos.getRow(i + 4)
                row.getCell(2).value = dataEgreso.EGRESO_REAL
                row.getCell(2).border = borderStyles
                row.getCell(3).value = dataEgreso.EGRESO_PROY
                row.getCell(3).border = borderStyles

            }
            for (let i = 0; i < dataIngresos.length; i++) {
                const dataIngreso = dataIngresos[i];
                const row = sheetIngreso.getRow(i + 4)
                row.getCell(2).value = dataIngreso.INGRESO_REAL
                row.getCell(2).border = borderStyles
                row.getCell(3).value = dataIngreso.INGRESO_PROY
                row.getCell(3).border = borderStyles

            }
            for (let i = 0; i < dataSaldos.length; i++) {
                const dataSaldo = dataSaldos[i];
                const row = sheetSaldos.getRow(i + 4)
                row.getCell(2).value = dataSaldo.SALDO_REAL
                row.getCell(2).border = borderStyles
                row.getCell(3).value = dataSaldo.SALDO_PROY
                row.getCell(3).border = borderStyles

            }
            await wor.xlsx.writeFile(`./template/graficos flujo proyectado real.xlsx`)
            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "/supergen-be/template/datos flujo comparativo.xlsx"
            }
            return json;
        } catch (error) {
            console.log("err", error)
            throw error;
        }


    },

}

module.exports = fc_graficos
