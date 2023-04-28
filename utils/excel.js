const fs = require("fs")
var Excel = require('exceljs');
const ServerError = require("../error");
var workbook = new Excel.Workbook();

const excelUtil = {

    async transformExcelAJson(excelRuta, celdasConValidaciones, rowNumber = 2, nombreSheet = "USADOS") {
        try {
            const excel = await workbook.xlsx.readFile(excelRuta)
            const sheet = excel.getWorksheet(nombreSheet)
            let errores = []
            let dataRows = []
            sheet.eachRow({ includeEmpty: false }, function (row, rowNumberP) {
                const data = {}
                if (rowNumberP >= rowNumber) {
                    for (let i = 0; i < celdasConValidaciones.length; i++) {
                        const celdaConValidacionActual = celdasConValidaciones[i]
                        const valor = row.findCell(i + 1) ? row.findCell(i + 1).value : undefined;
                        if (celdaConValidacionActual.validate && !celdaConValidacionActual.fn(valor)) {
                            throw new ServerError(`${celdaConValidacionActual.message} Fila: ${rowNumberP}`)
                        } else {
                            let valorMap = ""
                            const { result = "no" } = valor || {}
                            if (result == "no") {
                                valorMap = valor
                            } else {
                                valorMap = result
                            }
                            /*  if (celdaConValidacionActual.column == "S") {
                                 console.log("v", valor, "valor mar", valorMap,"r",result,"field",celdaConValidacionActual.field)
                             } */

                            data[celdaConValidacionActual.field] = valorMap
                        }
                    }
                    dataRows.push({ ...data })

                }

            })
            if (fs.existsSync(excelRuta)) {
                fs.unlinkSync(excelRuta)

            }
            if (errores.length > 0) {
                throw new Error(errores)

            }
            return dataRows
        } catch (error) {
            console.log("e", error)
            throw error
        }


    },
    async transformExcelAJsonValorPorDefecto(excelRuta, celdasConValidaciones, rowNumber = 2, nombreSheet = "USADOS") {
        try {
            const excel = await workbook.xlsx.readFile(excelRuta)
            const sheet = excel.getWorksheet(nombreSheet)
            let errores = []
            let dataRows = []
            sheet.eachRow({ includeEmpty: false }, function (row, rowNumberP) {
                const data = {}
                if (rowNumberP >= rowNumber) {
                    for (let i = 0; i < celdasConValidaciones.length; i++) {
                        const celdaConValidacionActual = celdasConValidaciones[i]
                        const valor = row.findCell(i + 1) ? row.findCell(i + 1).value : undefined
                        if (celdaConValidacionActual.validate && !celdaConValidacionActual.fn(valor)) {
                            throw new ServerError(`${celdaConValidacionActual.message} Linea: ${rowNumberP}`)
                        } else {
                            let valorMap = ""
                            const { result = "no" } = valor || {}
                            if (result == "no") {
                                valorMap = valor
                            } else {
                                valorMap = result
                            }
                            /*  if (celdaConValidacionActual.column == "S") {
                                 console.log("v", valor, "valor mar", valorMap,"r",result,"field",celdaConValidacionActual.field)
                             } */

                            data[celdaConValidacionActual.field] = valorMap ? valorMap : celdaConValidacionActual.defaultValue
                        }
                    }
                    dataRows.push({ ...data })

                }

            })
            if (fs.existsSync(excelRuta)) {
                fs.unlinkSync(excelRuta)

            }
            if (errores.length > 0) {
                throw new Error(errores)

            }
            return dataRows
        } catch (error) {
            console.log("e", error)
            throw error
        }


    },
}

module.exports = excelUtil