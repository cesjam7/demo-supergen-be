const moment = require("moment")
const mssqlConcar = require("../dbConnectionMSSQLClass")()
const Excel = require('exceljs');
var fs = require('fs');
const mysqlClass = require("../dbConnectionClass");
const ServerError = require("../error");

const workbook = new Excel.Workbook();
const flujoRealProyectado = {



    exportarExcel: async function ({ datos = [], dataReal = [] }) {
        try {
            const rutaTemplateHC = `./template/Plantilla Exportacion Datos flujo comparativo.xlsx`;
            if (fs.existsSync(`./template/datos flujo comparativo.xlsx`)) {
                fs.unlinkSync(`./template/datos flujo comparativo.xlsx`)
            }
            const borderStyles = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            const fillStyle = { type: 'pattern', pattern: 'solid', fgColor: { argb: '52AEA7' } };

            const wor = await workbook.xlsx.readFile(rutaTemplateHC)
            const sheet = wor.getWorksheet("real");
            const ANIO = datos.length > 0 ? dataReal[0].ANIO : "Sin año"
            const sheetDatos = workbook.getWorksheet("datos")
            sheetDatos.getCell(`B2`).value = `AÑO:${ANIO}`
            let initRow = 6
            let initRowReal = 3
            for (const detalleReal of dataReal) {
                const cantidadDecimales = detalleReal.decimales = 0 ? '' : '0'.repeat(detalleReal.decimales)
                const formato = `#,###0${cantidadDecimales != '' ? '.'.concat(cantidadDecimales) : ''}`
                sheet.getCell(`A${initRowReal}`).value = detalleReal.concepto
                sheet.getCell(`A${initRowReal}`).border = borderStyles


                sheet.getCell(`B${initRowReal}`).value = detalleReal.tipof
                sheet.getCell(`B${initRowReal}`).border = borderStyles

                sheet.getCell(`C${initRowReal}`).value = Number(detalleReal.acumulado.toFixed(detalleReal.decimales))
                sheet.getCell(`C${initRowReal}`).numFmt = formato;
                sheet.getCell(`C${initRowReal}`).border = borderStyles
                sheet.getCell(`C${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_acum.replace("#", '') } }
                sheet.getCell(`C${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };

                sheet.getCell(`D${initRowReal}`).value = Number(detalleReal.eneReal.toFixed(detalleReal.decimales))
                sheet.getCell(`D${initRowReal}`).border = borderStyles
                sheet.getCell(`D${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_real.replace("#", '') } }
                sheet.getCell(`D${initRowReal}`).numFmt = formato;
                sheet.getCell(`D${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };

                sheet.getCell(`E${initRowReal}`).value = Number(detalleReal.eneProy.toFixed(detalleReal.decimales))
                sheet.getCell(`E${initRowReal}`).border = borderStyles
                sheet.getCell(`E${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_proy.replace("#", '') } }
                sheet.getCell(`E${initRowReal}`).numFmt = formato;
                sheet.getCell(`E${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };


                sheet.getCell(`F${initRowReal}`).value = Number(detalleReal.febReal.toFixed(detalleReal.decimales))
                sheet.getCell(`F${initRowReal}`).border = borderStyles
                sheet.getCell(`F${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_real.replace("#", '') } }
                sheet.getCell(`F${initRowReal}`).numFmt = formato;
                sheet.getCell(`F${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };


                sheet.getCell(`G${initRowReal}`).value = Number(detalleReal.febProy.toFixed(detalleReal.decimales))
                sheet.getCell(`G${initRowReal}`).border = borderStyles
                sheet.getCell(`G${initRowReal}`).numFmt = formato;
                sheet.getCell(`G${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_proy.replace("#", '') } }
                sheet.getCell(`G${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };


                sheet.getCell(`H${initRowReal}`).value = Number(detalleReal.marReal.toFixed(detalleReal.decimales))
                sheet.getCell(`H${initRowReal}`).border = borderStyles
                sheet.getCell(`H${initRowReal}`).numFmt = formato;
                sheet.getCell(`H${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_real.replace("#", '') } }
                sheet.getCell(`H${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };


                sheet.getCell(`I${initRowReal}`).value = Number(detalleReal.marProy.toFixed(detalleReal.decimales))
                sheet.getCell(`I${initRowReal}`).border = borderStyles
                sheet.getCell(`I${initRowReal}`).numFmt = formato;
                sheet.getCell(`I${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_proy.replace("#", '') } }
                sheet.getCell(`I${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };


                sheet.getCell(`J${initRowReal}`).value = Number(detalleReal.abrReal.toFixed(detalleReal.decimales))
                sheet.getCell(`J${initRowReal}`).border = borderStyles
                sheet.getCell(`J${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_real.replace("#", '') } }
                sheet.getCell(`J${initRowReal}`).numFmt = formato;
                sheet.getCell(`J${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };


                sheet.getCell(`K${initRowReal}`).value = Number(detalleReal.abrProy.toFixed(detalleReal.decimales))
                sheet.getCell(`K${initRowReal}`).border = borderStyles
                sheet.getCell(`K${initRowReal}`).numFmt = formato;
                sheet.getCell(`K${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_proy.replace("#", '') } }
                sheet.getCell(`K${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };


                sheet.getCell(`L${initRowReal}`).value = Number(detalleReal.mayReal.toFixed(detalleReal.decimales))
                sheet.getCell(`L${initRowReal}`).border = borderStyles
                sheet.getCell(`L${initRowReal}`).numFmt = formato;
                sheet.getCell(`L${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_real.replace("#", '') } }
                sheet.getCell(`L${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };


                sheet.getCell(`M${initRowReal}`).value = Number(detalleReal.mayProy.toFixed(detalleReal.decimales))
                sheet.getCell(`M${initRowReal}`).border = borderStyles
                sheet.getCell(`M${initRowReal}`).numFmt = formato;
                sheet.getCell(`M${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_proy.replace("#", '') } }
                sheet.getCell(`M${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };


                sheet.getCell(`N${initRowReal}`).value = Number(detalleReal.junReal.toFixed(detalleReal.decimales))
                sheet.getCell(`N${initRowReal}`).border = borderStyles
                sheet.getCell(`N${initRowReal}`).numFmt = formato;
                sheet.getCell(`N${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_real.replace("#", '') } }
                sheet.getCell(`N${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };


                sheet.getCell(`O${initRowReal}`).value = Number(detalleReal.junProy.toFixed(detalleReal.decimales))
                sheet.getCell(`O${initRowReal}`).border = borderStyles
                sheet.getCell(`O${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_proy.replace("#", '') } }
                sheet.getCell(`O${initRowReal}`).numFmt = formato;
                sheet.getCell(`O${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };


                sheet.getCell(`P${initRowReal}`).value = Number(detalleReal.julReal.toFixed(detalleReal.decimales))
                sheet.getCell(`P${initRowReal}`).border = borderStyles
                sheet.getCell(`P${initRowReal}`).numFmt = formato;
                sheet.getCell(`P${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_real.replace("#", '') } }
                sheet.getCell(`P${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };


                sheet.getCell(`Q${initRowReal}`).value = Number(detalleReal.julProy.toFixed(detalleReal.decimales))
                sheet.getCell(`Q${initRowReal}`).border = borderStyles
                sheet.getCell(`Q${initRowReal}`).numFmt = formato;
                sheet.getCell(`Q${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_proy.replace("#", '') } }
                sheet.getCell(`Q${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };


                sheet.getCell(`R${initRowReal}`).value = Number(detalleReal.agoReal.toFixed(detalleReal.decimales))
                sheet.getCell(`R${initRowReal}`).border = borderStyles
                sheet.getCell(`R${initRowReal}`).numFmt = formato;
                sheet.getCell(`R${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_real.replace("#", '') } }
                sheet.getCell(`R${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };


                sheet.getCell(`S${initRowReal}`).value = Number(detalleReal.agoProy.toFixed(detalleReal.decimales))
                sheet.getCell(`S${initRowReal}`).border = borderStyles
                sheet.getCell(`S${initRowReal}`).numFmt = formato;
                sheet.getCell(`S${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_proy.replace("#", '') } }
                sheet.getCell(`S${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };

                sheet.getCell(`T${initRowReal}`).value = Number(detalleReal.setReal.toFixed(detalleReal.decimales))
                sheet.getCell(`T${initRowReal}`).border = borderStyles
                sheet.getCell(`T${initRowReal}`).numFmt = formato;
                sheet.getCell(`T${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_real.replace("#", '') } }
                sheet.getCell(`T${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };

                sheet.getCell(`U${initRowReal}`).value = Number(detalleReal.setProy.toFixed(detalleReal.decimales))
                sheet.getCell(`U${initRowReal}`).border = borderStyles
                sheet.getCell(`U${initRowReal}`).numFmt = formato;
                sheet.getCell(`U${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_proy.replace("#", '') } }
                sheet.getCell(`U${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };

                sheet.getCell(`V${initRowReal}`).value = Number(detalleReal.octReal.toFixed(detalleReal.decimales))
                sheet.getCell(`V${initRowReal}`).border = borderStyles
                sheet.getCell(`V${initRowReal}`).numFmt = formato;
                sheet.getCell(`V${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_real.replace("#", '') } }
                sheet.getCell(`V${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };

                sheet.getCell(`W${initRowReal}`).value = Number(detalleReal.octProy.toFixed(detalleReal.decimales))
                sheet.getCell(`W${initRowReal}`).border = borderStyles
                sheet.getCell(`W${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_proy.replace("#", '') } }
                sheet.getCell(`W${initRowReal}`).numFmt = formato;
                sheet.getCell(`W${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };

                sheet.getCell(`X${initRowReal}`).value = Number(detalleReal.novReal.toFixed(detalleReal.decimales))
                sheet.getCell(`X${initRowReal}`).numFmt = formato;
                sheet.getCell(`X${initRowReal}`).border = borderStyles
                sheet.getCell(`X${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_real.replace("#", '') } }
                sheet.getCell(`X${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };

                sheet.getCell(`Y${initRowReal}`).value = Number(detalleReal.novProy.toFixed(detalleReal.decimales))
                sheet.getCell(`Y${initRowReal}`).numFmt = formato;
                sheet.getCell(`Y${initRowReal}`).border = borderStyles
                sheet.getCell(`Y${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_proy.replace("#", '') } }
                sheet.getCell(`Y${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };

                sheet.getCell(`Z${initRowReal}`).value = Number(detalleReal.dicReal.toFixed(detalleReal.decimales))
                sheet.getCell(`Z${initRowReal}`).border = borderStyles
                sheet.getCell(`Z${initRowReal}`).numFmt = formato;
                sheet.getCell(`Z${initRowReal}`).fill = { ...fillStyle, fgColor: { argb: detalleReal.color_real.replace("#", '') } }
                sheet.getCell(`Z${initRowReal}`).font = {
                    color: { argb: detalleReal.font_letra.replace("#", '') },
                    bold: detalleReal.negrita.trim() == "bold"
                };

                sheet.getCell(`AA${initRowReal}`).value = Number(detalleReal.dicProy.toFixed(detalleReal.decimales))
                sheet.getCell(`AA${initRowReal}`).border = borderStyles
                sheet.getCell(`AA${initRowReal}`).numFmt = formato;
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
            for (const detalle of datos) {
                const cantidadDecimales = detalle.decimales = 0 ? '' : '0'.repeat(detalle.decimales)
                const formato = `#,###0.00`
                console.log("formato", formato, "decimales", cantidadDecimales)
                sheetDatos.getCell(`A${initRow}`).value = detalle.familia
                sheetDatos.getCell(`A${initRow}`).border = borderStyles
                sheetDatos.getCell(`B${initRow}`).value = detalle.subfamilia
                sheetDatos.getCell(`B${initRow}`).border = borderStyles

                sheetDatos.getCell(`C${initRow}`).value = detalle.tiposervicio
                sheetDatos.getCell(`C${initRow}`).border = borderStyles

                sheetDatos.getCell(`D${initRow}`).value = detalle.eneReal
                sheetDatos.getCell(`D${initRow}`).border = borderStyles
                sheetDatos.getCell(`D${initRow}`).numFmt = formato;

                sheetDatos.getCell(`E${initRow}`).value = detalle.eneProy
                sheetDatos.getCell(`E${initRow}`).border = borderStyles
                sheetDatos.getCell(`E${initRow}`).numFmt = formato;

                sheetDatos.getCell(`F${initRow}`).value = detalle.febReal
                sheetDatos.getCell(`F${initRow}`).border = borderStyles
                sheetDatos.getCell(`F${initRow}`).numFmt = formato;

                sheetDatos.getCell(`G${initRow}`).value = detalle.febProy
                sheetDatos.getCell(`G${initRow}`).border = borderStyles
                sheetDatos.getCell(`G${initRow}`).numFmt = formato;

                sheetDatos.getCell(`H${initRow}`).value = detalle.marReal
                sheetDatos.getCell(`H${initRow}`).border = borderStyles
                sheetDatos.getCell(`H${initRow}`).numFmt = formato;

                sheetDatos.getCell(`I${initRow}`).value = detalle.marProy
                sheetDatos.getCell(`I${initRow}`).border = borderStyles
                sheetDatos.getCell(`I${initRow}`).numFmt = formato;

                sheetDatos.getCell(`J${initRow}`).value = detalle.abrReal
                sheetDatos.getCell(`J${initRow}`).border = borderStyles
                sheetDatos.getCell(`J${initRow}`).numFmt = formato;

                sheetDatos.getCell(`K${initRow}`).value = detalle.abrProy
                sheetDatos.getCell(`K${initRow}`).border = borderStyles
                sheetDatos.getCell(`K${initRow}`).numFmt = formato;

                sheetDatos.getCell(`L${initRow}`).value = detalle.mayReal
                sheetDatos.getCell(`L${initRow}`).border = borderStyles
                sheetDatos.getCell(`L${initRow}`).numFmt = formato;

                sheetDatos.getCell(`M${initRow}`).value = detalle.mayProy
                sheetDatos.getCell(`M${initRow}`).border = borderStyles
                sheetDatos.getCell(`M${initRow}`).numFmt = formato;

                sheetDatos.getCell(`N${initRow}`).value = detalle.junReal
                sheetDatos.getCell(`N${initRow}`).border = borderStyles
                sheetDatos.getCell(`N${initRow}`).numFmt = formato;
                sheetDatos.getCell(`O${initRow}`).value = detalle.junProy
                sheetDatos.getCell(`O${initRow}`).border = borderStyles
                sheetDatos.getCell(`O${initRow}`).numFmt = formato;
                sheetDatos.getCell(`P${initRow}`).value = detalle.julReal
                sheetDatos.getCell(`P${initRow}`).border = borderStyles
                sheetDatos.getCell(`P${initRow}`).numFmt = formato;

                sheetDatos.getCell(`Q${initRow}`).value = detalle.julProy
                sheetDatos.getCell(`Q${initRow}`).border = borderStyles
                sheetDatos.getCell(`Q${initRow}`).numFmt = formato;

                sheetDatos.getCell(`R${initRow}`).value = detalle.agoReal
                sheetDatos.getCell(`R${initRow}`).border = borderStyles
                sheetDatos.getCell(`R${initRow}`).numFmt = formato;

                sheetDatos.getCell(`S${initRow}`).value = detalle.agoProy
                sheetDatos.getCell(`S${initRow}`).border = borderStyles
                sheetDatos.getCell(`S${initRow}`).numFmt = formato;

                sheetDatos.getCell(`T${initRow}`).value = detalle.setReal
                sheetDatos.getCell(`T${initRow}`).border = borderStyles
                sheetDatos.getCell(`T${initRow}`).numFmt = formato;

                sheetDatos.getCell(`U${initRow}`).value = detalle.setProy
                sheetDatos.getCell(`U${initRow}`).border = borderStyles
                sheetDatos.getCell(`U${initRow}`).numFmt = formato;

                sheetDatos.getCell(`V${initRow}`).value = detalle.octReal
                sheetDatos.getCell(`V${initRow}`).border = borderStyles
                sheetDatos.getCell(`V${initRow}`).numFmt = formato;

                sheetDatos.getCell(`W${initRow}`).value = detalle.octProy
                sheetDatos.getCell(`W${initRow}`).border = borderStyles
                sheetDatos.getCell(`W${initRow}`).numFmt = formato;


                sheetDatos.getCell(`X${initRow}`).value = detalle.novReal
                sheetDatos.getCell(`X${initRow}`).border = borderStyles
                sheetDatos.getCell(`X${initRow}`).numFmt = formato;

                sheetDatos.getCell(`Y${initRow}`).value = detalle.novProy
                sheetDatos.getCell(`Y${initRow}`).border = borderStyles
                sheetDatos.getCell(`Y${initRow}`).numFmt = formato;
                sheetDatos.getCell(`Z${initRow}`).value = detalle.dicReal
                sheetDatos.getCell(`Z${initRow}`).border = borderStyles
                sheetDatos.getCell(`Z${initRow}`).numFmt = formato;
                sheetDatos.getCell(`AA${initRow}`).value = detalle.dicProy
                sheetDatos.getCell(`AA${initRow}`).border = borderStyles
                sheetDatos.getCell(`AA${initRow}`).numFmt = formato;
                sheetDatos.getCell(`AB${initRow}`).value = detalle.totalReal
                sheetDatos.getCell(`AB${initRow}`).border = borderStyles
                sheetDatos.getCell(`AB${initRow}`).numFmt = formato;
                sheetDatos.getCell(`AC${initRow}`).value = detalle.totalProy
                sheetDatos.getCell(`AC${initRow}`).border = borderStyles
                sheetDatos.getCell(`AC${initRow}`).numFmt = formato;
                initRow++
            }


            await wor.xlsx.writeFile(`./template/datos flujo comparativo.xlsx`)
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

    exportarPago: async function (idCabecera) {
        try {
            const rutaTemplateHC = `./template/Plantilla Pago CTS.xlsx`;
            const detalles = await this.listarDetallesPorCabecera(idCabecera)
            const montoMensualTotal = detalles.reduce((prev, curr) => prev += curr.montoMensual, 0)
            if (fs.existsSync(`./template/Pago VACACIONES.xlsx`)) {
                fs.unlinkSync(`./template/Pago VACACIONES.xlsx`)
            }
            const borderStyles = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            const wor = await workbook.xlsx.readFile(rutaTemplateHC)
            const sheet = wor.worksheets[0];
            let initRow = 6

            for (const detalle of detalles) {
                sheet.getCell(`A${initRow}`).value = detalle.nroDni
                sheet.getCell(`A${initRow}`).border = borderStyles
                sheet.getCell(`B${initRow}`).value = detalle.nombres
                sheet.getCell(`B${initRow}`).border = borderStyles
                sheet.getCell(`C${initRow}`).value = detalle.fechaIngreso
                sheet.getCell(`C${initRow}`).border = borderStyles
                sheet.getCell(`D${initRow}`).value = detalle.fechaCese
                sheet.getCell(`D${initRow}`).border = borderStyles
                sheet.getCell(`E${initRow}`).value = detalle.area
                sheet.getCell(`E${initRow}`).border = borderStyles
                sheet.getCell(`F${initRow}`).value = detalle.montoMensual
                sheet.getCell(`F${initRow}`).border = borderStyles
                initRow++
            }
            sheet.getCell(`F${initRow}`).value = montoMensualTotal
            sheet.getCell(`F${initRow}`).border = borderStyles

            await wor.xlsx.writeFile(`./template/Pago VACACIONES.xlsx`)
            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "/supergen-be/template/Pago VACACIONES.xlsx"
            }
            return json;
        } catch (error) {
            console.log("err", error)
            throw error;
        }
    },
    resumenDatos: async function ({ anio }) {
        try {
            const data = await mssqlConcar.ejecutarQueryPreparado(`EXEC SP_FLUJOREAL_VER_RESUMEN   '${anio}'`, {})
            return data.map(d => ({
                ...d, eneReal: d.ENE_REAL, eneProy: d.ENE_PROY, febReal: d.FEB_REAL, febProy: d.FEB_PROY, marReal: d.MAR_REAL, marProy: d.MAR_PROY, abrReal: d.ABR_REAL, abrProy: d.ABR_PROY, mayReal: d.MAY_REAL, mayProy: d.MAY_PROY,
                junReal: d.JUN_REAL, junProy: d.JUN_PROY, julReal: d.JUL_REAL, julProy: d.JUL_PROY, agoReal: d.AGO_REAL, agoProy: d.AGO_PROY, setReal: d.SET_REAL, setProy: d.SET_PROY, octReal: d.OCT_REAL, octProy: d.OCT_PROY, novReal: d.NOV_REAL, novProy: d.NOV_PROY, dicReal: d.DIC_REAL, dicProy: d.DIC_PROY,
                totalReal: d.TOTAL_REAL, totalProy: d.TOTAL_PROY
            }))
        } catch (error) {
            throw error;
        }

    },
    procesarReal: async function ({ anio }) {
        await mssqlConcar.ejecutarQueryPreparado(`exec SP_FLUJOREAL_PROCESAR '${anio}'`,{})

    },
    resumenReal: async function ({ anio }) {
        try {
            const data = await mssqlConcar.ejecutarQueryPreparado(`exec SP_FLUJOCOMPARATIVO_VER_RESUMEN '${anio}'`, {})
            return data.map(d => ({
                concepto: d.concepto_fc,
                ...d, eneReal: d.ene_real, eneProy: d.ene_proy, febReal: d.feb_real, febProy: d.feb_proy, marReal: d.mar_real, marProy: d.mar_proy, abrReal: d.abr_real, abrProy: d.abr_proy, mayReal: d.may_real, mayProy: d.may_proy,
                junReal: d.jun_real, junProy: d.jun_proy, julReal: d.jul_real, julProy: d.jul_proy, agoReal: d.ago_real, agoProy: d.ago_proy, setReal: d.set_real, setProy: d.set_proy, octReal: d.oct_real, octProy: d.oct_proy, novReal: d.nov_real, novProy: d.nov_proy, dicReal: d.dic_real, dicProy: d.dic_proy,
            }))
        } catch (error) {
            throw error;
        }

    },


}

module.exports = flujoRealProyectado
