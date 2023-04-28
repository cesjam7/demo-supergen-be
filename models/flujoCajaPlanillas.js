const moment = require("moment")
const mssqlConcar = require("../dbConnectionMSSQLClass")()
const mysqlClass = require("../dbConnectionClass")
const Excel = require('exceljs');
var fs = require('fs');

const workbook = new Excel.Workbook();
const provisionCts = {
    consultarResumenMensual: async function ({ anio, mes }) {
        const data = await mssqlConcar.ejecutarQueryPreparado(`exec SP_LEE_REPORTEPLANILLA '${anio}${mes}'`, {})
        const liquidado = await mssqlConcar.ejecutarQueryPreparado(`exec SP_LEE_REPORTEPLANILLALIQ   '${anio}${mes}'`, {})
        return { data, liquidado }

    },
    procesarResumenMensal: async function ({ anio, mes }) {
        await mssqlConcar.ejecutarQueryPreparado(`exec SP_INSERTA_REPORTEPLANILLA  '${anio}${mes}'`)
    },
    consultarResumenGeneral: async function ({ anio, tipoPlanilla, centroCosto, desde, hasta }) {
        console.log(`exec SP_REPORTEPLANILLA_RESUMEN    '${anio}',${tipoPlanilla ? `'${tipoPlanilla}'` : ''},'${desde}','${hasta}',${centroCosto ? `'${centroCosto}'` : ''}`)
        const data = await mssqlConcar.ejecutarQueryPreparado(`exec SP_REPORTEPLANILLA_RESUMEN    '${anio}',${tipoPlanilla ? `'${tipoPlanilla}'` : ''},'${desde}','${hasta}' ,${centroCosto ? `'${centroCosto}'` : ''}`, {})
        return this.agruparPorTipoPlanilla(data)

    },
    agruparPorTipoPlanilla: async function (data = []) {
        let dataAgrupada = [];
        let sumaTotal = {
            abr: 0,
            ago: 0,
            dic: 0,
            ene: 0,
            feb: 0,
            jul: 0,
            jun: 0,
            mar: 0,
            may: 0,
            nov: 0,
            oct: 0,
            seti: 0,
            total: 0
        }
        const tipoPlanillas = data.reduce((prev, curr) => {
            if (!prev.find(p => p.trim() == curr.tipoplanilla.trim())) {
                prev.push(curr.tipoplanilla)
            }
            return prev;
        }, [])

        for (const planilla of tipoPlanillas) {
            const dataFiltrada = data.filter(p => p.tipoplanilla == planilla)
            const total = dataFiltrada.reduce((prev, curr) => {
                prev.abr += curr.abr ? curr.abr : 0
                prev.ago += curr.ago ? curr.ago : 0
                prev.dic += curr.dic ? curr.dic : 0
                prev.ene += curr.ene ? curr.ene : 0
                prev.feb += curr.feb ? curr.feb : 0
                prev.jul += curr.jul ? curr.jul : 0
                prev.jun += curr.jun ? curr.jun : 0
                prev.mar += curr.mar ? curr.mar : 0
                prev.may += curr.may ? curr.may : 0
                prev.nov += curr.nov ? curr.nov : 0
                prev.oct += curr.oct ? curr.oct : 0
                prev.seti += curr.seti ? curr.seti : 0
                prev.total += curr.total ? curr.total : 0
                return prev;
            }, {
                abr: 0,
                ago: 0,
                dic: 0,
                ene: 0,
                feb: 0,
                jul: 0,
                jun: 0,
                mar: 0,
                may: 0,
                nov: 0,
                oct: 0,
                seti: 0,
                total: 0
            })
            dataFiltrada.push({
                ...total, tipo: "SUB TOTAL",
                tipoplanilla: ""
            })
            sumaTotal.abr += total.abr
            sumaTotal.ago += total.ago
            sumaTotal.dic += total.dic
            sumaTotal.ene += total.ene
            sumaTotal.feb += total.feb
            sumaTotal.jun += total.jun
            sumaTotal.jul += total.jul
            sumaTotal.mar += total.mar
            sumaTotal.may += total.may
            sumaTotal.nov += total.nov
            sumaTotal.oct += total.oct
            sumaTotal.seti += total.seti
            sumaTotal.total += total.total
            dataAgrupada = dataAgrupada.concat(dataFiltrada)
        }
        dataAgrupada.push({ ...sumaTotal, tipo: "TOTAL", tipoplanilla: "" })
        return dataAgrupada
    },
    procesarResumenAnual: async function ({ anio, mes }) {
        await mssqlConcar.ejecutarQueryPreparado(`exec SP_INSERTA_REPORTEPLANILLA  '${anio}${mes}'`)
    },
    exportarResumenMensual: async function ({ data = [], liquidado = [] }) {
        try {
            const rutaTemplateHC = `./template/plantilla flujo caja mensual.xlsx`;
            if (fs.existsSync(`./template/flujo caja mensual.xlsx`)) {
                fs.unlinkSync(`./template/flujo caja mensual.xlsx`)
            }
            const borderStyles = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            const wor = await workbook.xlsx.readFile(rutaTemplateHC)
            const sheet = wor.worksheets[0];
            let initRow = 3
            if (data.length > 0) {
                sheet.getCell(`A${initRow - 1}`).value = "Remuneraciones"
                sheet.getCell(`A${initRow}`).value = 'Periodo'
                sheet.getCell(`A${initRow}`).border = borderStyles
                sheet.getCell(`B${initRow}`).value = 'Tipo planilla'
                sheet.getCell(`B${initRow}`).border = borderStyles
                sheet.getCell(`C${initRow}`).value = 'Año'
                sheet.getCell(`C${initRow}`).border = borderStyles
                sheet.getCell(`D${initRow}`).value = 'Mes'
                sheet.getCell(`D${initRow}`).border = borderStyles
                sheet.getCell(`E${initRow}`).value = 'Area'
                sheet.getCell(`E${initRow}`).border = borderStyles
                sheet.getCell(`F${initRow}`).value = 'snp_401'
                sheet.getCell(`F${initRow}`).border = borderStyles
                sheet.getCell(`G${initRow}`).value = 'qtacategoria_405'
                sheet.getCell(`G${initRow}`).border = borderStyles
                sheet.getCell(`H${initRow}`).value = 'afpley_407'
                sheet.getCell(`H${initRow}`).border = borderStyles
                sheet.getCell(`I${initRow}`).value = 'afp174_440'
                sheet.getCell(`I${initRow}`).border = borderStyles
                sheet.getCell(`J${initRow}`).value = 'afpcomflujo_441'
                sheet.getCell(`J${initRow}`).border = borderStyles
                sheet.getCell(`K${initRow}`).value = 'afpcommix_445'
                sheet.getCell(`K${initRow}`).border = borderStyles
                sheet.getCell(`L${initRow}`).value = 'adelpvac_450'
                sheet.getCell(`L${initRow}`).border = borderStyles
                sheet.getCell(`M${initRow}`).value = 'adelanto2_451'
                sheet.getCell(`M${initRow}`).border = borderStyles
                sheet.getCell(`N${initRow}`).value = 'retencionjud_788'
                sheet.getCell(`N${initRow}`).border = borderStyles
                sheet.getCell(`O${initRow}`).value = 'adelquincena_793'
                sheet.getCell(`O${initRow}`).border = borderStyles
                sheet.getCell(`P${initRow}`).value = 'adelgratif_794'
                sheet.getCell(`P${initRow}`).border = borderStyles
                sheet.getCell(`Q${initRow}`).value = 'total_neto'
                sheet.getCell(`Q${initRow}`).border = borderStyles
                sheet.getCell(`R${initRow}`).value = 'cts'
                sheet.getCell(`R${initRow}`).border = borderStyles
                sheet.getCell(`S${initRow}`).value = 'total'
                sheet.getCell(`S${initRow}`).border = borderStyles
                initRow++
                for (const detalle of data) {
                    sheet.getCell(`A${initRow}`).value = detalle.periodo
                    sheet.getCell(`A${initRow}`).border = borderStyles
                    sheet.getCell(`B${initRow}`).value = detalle.tipoplanilla
                    sheet.getCell(`B${initRow}`).border = borderStyles
                    sheet.getCell(`C${initRow}`).value = detalle.anio
                    sheet.getCell(`C${initRow}`).border = borderStyles

                    sheet.getCell(`D${initRow}`).value = detalle.mes_str
                    sheet.getCell(`D${initRow}`).border = borderStyles

                    sheet.getCell(`E${initRow}`).value = detalle.area
                    sheet.getCell(`E${initRow}`).border = borderStyles

                    sheet.getCell(`F${initRow}`).value = detalle.snp_401
                    sheet.getCell(`F${initRow}`).border = borderStyles

                    sheet.getCell(`G${initRow}`).value = detalle.qtacategoria_405
                    sheet.getCell(`G${initRow}`).border = borderStyles

                    sheet.getCell(`H${initRow}`).value = detalle.afpley_407
                    sheet.getCell(`H${initRow}`).border = borderStyles

                    sheet.getCell(`I${initRow}`).value = detalle.afp174_440
                    sheet.getCell(`I${initRow}`).border = borderStyles

                    sheet.getCell(`J${initRow}`).value = detalle.afpcomflujo_441
                    sheet.getCell(`J${initRow}`).border = borderStyles

                    sheet.getCell(`K${initRow}`).value = detalle.afpcommix_445
                    sheet.getCell(`K${initRow}`).border = borderStyles

                    sheet.getCell(`L${initRow}`).value = detalle.adelpvac_450
                    sheet.getCell(`L${initRow}`).border = borderStyles

                    sheet.getCell(`M${initRow}`).value = detalle.adelanto2_451
                    sheet.getCell(`M${initRow}`).border = borderStyles

                    sheet.getCell(`N${initRow}`).value = detalle.retencionjud_788
                    sheet.getCell(`N${initRow}`).border = borderStyles

                    sheet.getCell(`O${initRow}`).value = detalle.adelquincena_793
                    sheet.getCell(`O${initRow}`).border = borderStyles

                    sheet.getCell(`P${initRow}`).value = detalle.adelgratif_794
                    sheet.getCell(`P${initRow}`).border = borderStyles

                    sheet.getCell(`Q${initRow}`).value = detalle.total_neto
                    sheet.getCell(`Q${initRow}`).border = borderStyles

                    sheet.getCell(`R${initRow}`).value = detalle.cts
                    sheet.getCell(`R${initRow}`).border = borderStyles

                    sheet.getCell(`S${initRow}`).value = detalle.total
                    sheet.getCell(`S${initRow}`).border = borderStyles
                    initRow++
                }
            }
            if (liquidado.length > 0) {
                initRow++
                sheet.getCell(`A${initRow}`).value = "Liquidados"
                initRow++
                sheet.getCell(`A${initRow}`).value = 'Periodo'
                sheet.getCell(`A${initRow}`).border = borderStyles
                sheet.getCell(`B${initRow}`).value = 'Tipo planilla'
                sheet.getCell(`B${initRow}`).border = borderStyles
                sheet.getCell(`C${initRow}`).value = 'Año'
                sheet.getCell(`C${initRow}`).border = borderStyles
                sheet.getCell(`D${initRow}`).value = 'Mes'
                sheet.getCell(`D${initRow}`).border = borderStyles
                sheet.getCell(`E${initRow}`).value = 'Area'
                sheet.getCell(`E${initRow}`).border = borderStyles
                sheet.getCell(`F${initRow}`).value = 'Neto'
                sheet.getCell(`F${initRow}`).border = borderStyles
                sheet.getCell(`G${initRow}`).value = 'Afp'
                sheet.getCell(`G${initRow}`).border = borderStyles
                sheet.getCell(`H${initRow}`).value = 'Snp'
                sheet.getCell(`H${initRow}`).border = borderStyles
                sheet.getCell(`I${initRow}`).value = 'Otros'
                sheet.getCell(`I${initRow}`).border = borderStyles
                sheet.getCell(`J${initRow}`).value = 'Total'
                sheet.getCell(`J${initRow}`).border = borderStyles
                initRow++
                for (const detalle of liquidado) {
                    sheet.getCell(`A${initRow}`).value = detalle.periodo
                    sheet.getCell(`A${initRow}`).border = borderStyles
                    sheet.getCell(`B${initRow}`).value = detalle.tipoplanilla
                    sheet.getCell(`B${initRow}`).border = borderStyles
                    sheet.getCell(`C${initRow}`).value = detalle.anio
                    sheet.getCell(`C${initRow}`).border = borderStyles

                    sheet.getCell(`D${initRow}`).value = detalle.mes_str
                    sheet.getCell(`D${initRow}`).border = borderStyles

                    sheet.getCell(`E${initRow}`).value = detalle.area
                    sheet.getCell(`E${initRow}`).border = borderStyles

                    sheet.getCell(`F${initRow}`).value = detalle.neto
                    sheet.getCell(`F${initRow}`).border = borderStyles

                    sheet.getCell(`G${initRow}`).value = detalle.afp
                    sheet.getCell(`G${initRow}`).border = borderStyles

                    sheet.getCell(`H${initRow}`).value = detalle.snp
                    sheet.getCell(`H${initRow}`).border = borderStyles

                    sheet.getCell(`I${initRow}`).value = detalle.otros
                    sheet.getCell(`I${initRow}`).border = borderStyles

                    sheet.getCell(`J${initRow}`).value = detalle.total
                    sheet.getCell(`J${initRow}`).border = borderStyles
                    initRow++
                }
            }



            await wor.xlsx.writeFile(`./template/flujo caja mensual.xlsx`)
            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "/supergen-be/template/flujo caja mensual.xlsx"
            }
            return json;
        } catch (error) {
            console.log("err", error)
            throw error;
        }
    },
    exportarResumenGeneral: async function (data = []) {
        try {
            const rutaTemplateHC = `./template/plantilla flujo caja mensual.xlsx`;
            if (fs.existsSync(`./template/flujo caja general.xlsx`)) {
                fs.unlinkSync(`./template/flujo caja general.xlsx`)
            }
            const borderStyles = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            const wor = await workbook.xlsx.readFile(rutaTemplateHC)
            const sheet = wor.worksheets[0];
            let initRow = 3
            sheet.getCell(`A${initRow}`).value = 'Periodo'
            sheet.getCell(`A${initRow}`).border = borderStyles
            sheet.getCell(`B${initRow}`).value = 'Tipo planilla'
            sheet.getCell(`B${initRow}`).border = borderStyles

            sheet.getCell(`C${initRow}`).value = 'Tipo'
            sheet.getCell(`C${initRow}`).border = borderStyles
            sheet.getCell(`D${initRow}`).value = 'Ene'
            sheet.getCell(`D${initRow}`).border = borderStyles
            sheet.getCell(`E${initRow}`).value = 'Feb'
            sheet.getCell(`E${initRow}`).border = borderStyles
            sheet.getCell(`F${initRow}`).value = 'Mar'
            sheet.getCell(`F${initRow}`).border = borderStyles
            sheet.getCell(`G${initRow}`).value = 'Abr'
            sheet.getCell(`G${initRow}`).border = borderStyles
            sheet.getCell(`H${initRow}`).value = 'May'
            sheet.getCell(`H${initRow}`).border = borderStyles
            sheet.getCell(`I${initRow}`).value = 'Jun'
            sheet.getCell(`I${initRow}`).border = borderStyles
            sheet.getCell(`J${initRow}`).value = 'Jul'
            sheet.getCell(`J${initRow}`).border = borderStyles
            sheet.getCell(`K${initRow}`).value = 'Ago'
            sheet.getCell(`K${initRow}`).border = borderStyles

            sheet.getCell(`L${initRow}`).value = 'Seti'
            sheet.getCell(`L${initRow}`).border = borderStyles

            sheet.getCell(`M${initRow}`).value = 'Oct'
            sheet.getCell(`M${initRow}`).border = borderStyles

            sheet.getCell(`N${initRow}`).value = 'Nov'
            sheet.getCell(`N${initRow}`).border = borderStyles
            sheet.getCell(`O${initRow}`).value = 'Dic'
            sheet.getCell(`O${initRow}`).border = borderStyles

            sheet.getCell(`P${initRow}`).value = 'Total'
            sheet.getCell(`P${initRow}`).border = borderStyles
            initRow++
            for (const detalle of data) {
                sheet.getCell(`A${initRow}`).value = detalle.periodo
                sheet.getCell(`A${initRow}`).border = borderStyles

                sheet.getCell(`B${initRow}`).value = detalle.tipoplanilla
                sheet.getCell(`B${initRow}`).border = borderStyles

                sheet.getCell(`C${initRow}`).value = detalle.tipo
                sheet.getCell(`C${initRow}`).border = borderStyles

                sheet.getCell(`D${initRow}`).value = detalle.ene
                sheet.getCell(`D${initRow}`).border = borderStyles
                sheet.getCell(`D${initRow}`).numFmt = '#,###';
                
                sheet.getCell(`E${initRow}`).value = detalle.feb
                sheet.getCell(`E${initRow}`).border = borderStyles
                sheet.getCell(`E${initRow}`).numFmt = '#,###';
                
                sheet.getCell(`F${initRow}`).value = detalle.mar
                sheet.getCell(`F${initRow}`).border = borderStyles
                sheet.getCell(`F${initRow}`).numFmt = '#,###';
                
                sheet.getCell(`G${initRow}`).value = detalle.abr
                sheet.getCell(`G${initRow}`).border = borderStyles
                sheet.getCell(`G${initRow}`).numFmt = '#,###';
                
                sheet.getCell(`H${initRow}`).value = detalle.may
                sheet.getCell(`H${initRow}`).border = borderStyles
                sheet.getCell(`H${initRow}`).numFmt = '#,###';
                
                sheet.getCell(`I${initRow}`).value = detalle.jun
                sheet.getCell(`I${initRow}`).border = borderStyles
                sheet.getCell(`I${initRow}`).numFmt = '#,###';
                
                sheet.getCell(`J${initRow}`).value = detalle.jul
                sheet.getCell(`J${initRow}`).border = borderStyles
                sheet.getCell(`J${initRow}`).numFmt = '#,###';
                
                sheet.getCell(`K${initRow}`).value = detalle.ago
                sheet.getCell(`K${initRow}`).border = borderStyles
                sheet.getCell(`K${initRow}`).numFmt = '#,###';
                
                sheet.getCell(`L${initRow}`).value = detalle.seti
                sheet.getCell(`L${initRow}`).border = borderStyles
                sheet.getCell(`L${initRow}`).numFmt = '#,###';
                
                sheet.getCell(`M${initRow}`).value = detalle.oct
                sheet.getCell(`M${initRow}`).border = borderStyles
                sheet.getCell(`M${initRow}`).numFmt = '#,###';
                
                sheet.getCell(`N${initRow}`).value = detalle.nov
                sheet.getCell(`N${initRow}`).border = borderStyles
                sheet.getCell(`N${initRow}`).numFmt = '#,###';
                
                sheet.getCell(`O${initRow}`).value = detalle.dic
                sheet.getCell(`O${initRow}`).border = borderStyles
                sheet.getCell(`O${initRow}`).numFmt = '#,###';
                
                sheet.getCell(`P${initRow}`).value = detalle.total
                sheet.getCell(`P${initRow}`).border = borderStyles
                sheet.getCell(`P${initRow}`).numFmt = '#,###';
                if (detalle.tipo == 'SUB TOTAL') {
                    sheet.getCell(`A${initRow}`).font = { color: { argb: "FF0037" }, bold: true };
                    sheet.getCell(`B${initRow}`).font = { color: { argb: "FF0037" }, bold: true };
                    sheet.getCell(`C${initRow}`).font = { color: { argb: "FF0037" }, bold: true };
                    sheet.getCell(`D${initRow}`).font = { color: { argb: "FF0037" }, bold: true };
                    sheet.getCell(`E${initRow}`).font = { color: { argb: "FF0037" }, bold: true };
                    sheet.getCell(`F${initRow}`).font = { color: { argb: "FF0037" }, bold: true };
                    sheet.getCell(`G${initRow}`).font = { color: { argb: "FF0037" }, bold: true };
                    sheet.getCell(`H${initRow}`).font = { color: { argb: "FF0037" }, bold: true };
                    sheet.getCell(`I${initRow}`).font = { color: { argb: "FF0037" }, bold: true };
                    sheet.getCell(`J${initRow}`).font = { color: { argb: "FF0037" }, bold: true };
                    sheet.getCell(`K${initRow}`).font = { color: { argb: "FF0037" }, bold: true };
                    sheet.getCell(`L${initRow}`).font = { color: { argb: "FF0037" }, bold: true };
                    sheet.getCell(`M${initRow}`).font = { color: { argb: "FF0037" }, bold: true };
                    sheet.getCell(`N${initRow}`).font = { color: { argb: "FF0037" }, bold: true };
                    sheet.getCell(`O${initRow}`).font = { color: { argb: "FF0037" }, bold: true };
                    sheet.getCell(`P${initRow}`).font = { color: { argb: "FF0037" }, bold: true };
                }
                if (detalle.tipo == 'TOTAL') {
                    sheet.getCell(`A${initRow}`).font = { size: 16, bold: true };
                    sheet.getCell(`B${initRow}`).font = { size: 16, bold: true };
                    sheet.getCell(`C${initRow}`).font = { size: 16, bold: true };
                    sheet.getCell(`D${initRow}`).font = { size: 16, bold: true };
                    sheet.getCell(`E${initRow}`).font = { size: 16, bold: true };
                    sheet.getCell(`F${initRow}`).font = { size: 16, bold: true };
                    sheet.getCell(`G${initRow}`).font = { size: 16, bold: true };
                    sheet.getCell(`H${initRow}`).font = { size: 16, bold: true };
                    sheet.getCell(`I${initRow}`).font = { size: 16, bold: true };
                    sheet.getCell(`J${initRow}`).font = { size: 16, bold: true };
                    sheet.getCell(`K${initRow}`).font = { size: 16, bold: true };
                    sheet.getCell(`L${initRow}`).font = { size: 16, bold: true };
                    sheet.getCell(`M${initRow}`).font = { size: 16, bold: true };
                    sheet.getCell(`N${initRow}`).font = { size: 16, bold: true };
                    sheet.getCell(`O${initRow}`).font = { size: 16, bold: true };
                    sheet.getCell(`P${initRow}`).font = { size: 16, bold: true };
                }
                initRow++
            }




            await wor.xlsx.writeFile(`./template/flujo caja general.xlsx`)
            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "/supergen-be/template/flujo caja general.xlsx"
            }
            return json;
        } catch (error) {
            console.log("err", error)
            throw error;
        }
    }

}

module.exports = provisionCts
