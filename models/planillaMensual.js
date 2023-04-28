
const mssqlClass = require('../dbConnectionMSSQLClass')()
const mysqlClass = require("../dbConnectionClass")
const moment = require('moment');
moment.locale("es")
const Excel = require('exceljs');
const workbook = new Excel.Workbook();
const ServerError = require('../error');
var fs = require('fs');

const planillaMensual = {
    resumen: async function ({ anio }) {
        const data = await mssqlClass.ejecutarQueryPreparado(`exec SP_PROVISION_PLANILLA_ANUAL '${anio}'`, {})
        const total = data.reduce((prev, curr) => {
            prev.SUELDOS += curr.SUELDOS
            prev.SALARIOS += curr.SALARIOS
            prev.GRATI_O += curr.GRATI_O
            prev.GRATI_E += curr.GRATI_E
            prev.VACA_O += curr.VACA_O
            prev.VACA_E += curr.VACA_E
            prev.CTS_O += curr.CTS_O
            prev.CTS_E += curr.CTS_E
            prev.ESSSALUD_O += curr.ESSSALUD_O
            prev.ESSALUD_E += curr.ESSALUD_E
            prev.AFP += curr.AFP
            prev.ONP += curr.ONP
            prev.EsSalud += curr.EsSalud
            prev.Renta5ta += curr.Renta5ta
            return prev;
        }, {
            SUELDOS: 0,
            SALARIOS: 0,
            GRATI_O: 0,
            GRATI_E: 0,
            VACA_O: 0,
            VACA_E: 0,
            CTS_O: 0,
            CTS_E: 0,
            ESSSALUD_O: 0,
            ESSALUD_E: 0,
            AFP: 0,
            ONP: 0,
            EsSalud: 0,
            Renta5ta: 0
        })
        data.push({ ...total, MES: "TOTAL" })
        return data
    },
    exportarExcel: async function ({ anio }) {
        try {
            const rutaTemplateHC = `./template/plantilla planilla  mensual.xlsx`;
            const data = await this.resumen({ anio })
            if (fs.existsSync(`./template/planilla mensual.xlsx`)) {
                fs.unlinkSync(`./template/planilla mensual.xlsx`)
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
            const formato = `#,###0.00`
            sheet.getCell("B3").value = `PROVISIONES ${anio}`
            for (const detalle of data) {
                sheet.getCell(`B${initRow}`).value = detalle.MES
                sheet.getCell(`B${initRow}`).border = borderStyles

                sheet.getCell(`C${initRow}`).value = detalle.SUELDOS
                sheet.getCell(`C${initRow}`).border = borderStyles
                sheet.getCell(`C${initRow}`).numFmt = formato;

                sheet.getCell(`D${initRow}`).value = detalle.SALARIOS
                sheet.getCell(`D${initRow}`).border = borderStyles
                sheet.getCell(`D${initRow}`).numFmt = formato;

                sheet.getCell(`E${initRow}`).value = detalle.GRATI_E
                sheet.getCell(`E${initRow}`).border = borderStyles
                sheet.getCell(`E${initRow}`).numFmt = formato;

                sheet.getCell(`F${initRow}`).value = detalle.GRATI_O
                sheet.getCell(`F${initRow}`).border = borderStyles
                sheet.getCell(`F${initRow}`).numFmt = formato;

                sheet.getCell(`G${initRow}`).value = detalle.VACA_E
                sheet.getCell(`G${initRow}`).border = borderStyles
                sheet.getCell(`G${initRow}`).numFmt = formato;

                sheet.getCell(`H${initRow}`).value = detalle.VACA_E
                sheet.getCell(`H${initRow}`).border = borderStyles
                sheet.getCell(`H${initRow}`).numFmt = formato;

                sheet.getCell(`I${initRow}`).value = detalle.CTS_E
                sheet.getCell(`I${initRow}`).border = borderStyles
                sheet.getCell(`I${initRow}`).numFmt = formato;

                sheet.getCell(`J${initRow}`).value = detalle.CTS_O
                sheet.getCell(`J${initRow}`).border = borderStyles
                sheet.getCell(`J${initRow}`).numFmt = formato;

                sheet.getCell(`K${initRow}`).value = detalle.ESSALUD_E
                sheet.getCell(`K${initRow}`).border = borderStyles
                sheet.getCell(`K${initRow}`).numFmt = formato;

                sheet.getCell(`L${initRow}`).value = detalle.ESSSALUD_O
                sheet.getCell(`L${initRow}`).border = borderStyles
                sheet.getCell(`L${initRow}`).numFmt = formato;

                sheet.getCell(`M${initRow}`).value = detalle.AFP
                sheet.getCell(`M${initRow}`).border = borderStyles
                sheet.getCell(`M${initRow}`).numFmt = formato;

                sheet.getCell(`N${initRow}`).value = detalle.ONP
                sheet.getCell(`N${initRow}`).border = borderStyles
                sheet.getCell(`N${initRow}`).numFmt = formato;

                sheet.getCell(`O${initRow}`).value = detalle.EsSalud
                sheet.getCell(`O${initRow}`).border = borderStyles
                sheet.getCell(`O${initRow}`).numFmt = formato;

                sheet.getCell(`P${initRow}`).value = detalle.Renta5ta
                sheet.getCell(`P${initRow}`).border = borderStyles
                sheet.getCell(`P${initRow}`).numFmt = formato;
                initRow++
            }
            await wor.xlsx.writeFile(`./template/planilla mensual.xlsx`)
            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "/supergen-be/template/planilla mensual.xlsx"
            }
            return json;
        } catch (error) {
            console.log("err", error)
            throw error;
        }
    }
}

module.exports = planillaMensual