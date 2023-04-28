
const mssqlClass = require('../dbConnectionMSSQLClass')()
const mysqlClass = require("../dbConnectionClass")
const moment = require('moment');
moment.locale("es")
const Excel = require('exceljs');
const ServerError = require('../error');
const workbook = new Excel.Workbook();

const provisionAperturaModelo = {
    verificarInformacion: async function ({ anio, tipoPlanilla = 'OBREROS', tipoProvision }) {
        const dataProvCabcera = await mssqlClass.ejecutarQueryPreparado(`select id from prov_cabecera where tipoPlanilla='${tipoPlanilla}' and tipoProvision='${tipoProvision}' and periodo='${anio}00'`, {}, true)
        return { exist: dataProvCabcera != null || dataProvCabcera != undefined }
    },
    procesar: async function ({ anio, tipoPlanilla = 'OBREROS', tipoProvision }, idUsuario) {
        try {

            const anioAnterior = moment(anio, "YYYY").subtract(1, "y").startOf("y")
            const anioMes = `${anio}00`
            console.log(`select id from periodo_provision where anio='${anioAnterior.format("YYYY")}' and estado=1`)
            const dataPeriodoProvision = await mysqlClass.ejecutarQueryPreparado(`select id from periodo_provision where anio='${anioAnterior.format("YYYY")}' and estado=1`, {})
            if (dataPeriodoProvision.length > 0) {
                throw new Error(`No se puede aperturar el año porque el año anterior tiene periodos abiertos`)
            }
            const data = await mssqlClass.ejecutarQueryPreparado(`EXEC SP_GENERA_APERTURAVACACIONES '${anioMes}', '${tipoPlanilla}', '${tipoProvision}','HABIL'`, {})
            console.log("data", data)
            await mssqlClass.insertar("prov_cabecera", [{
                periodo: anioMes,
                tipoProvision,
                tipoPlanilla,
                condicion: 'HABIL',
                idEstado: 0, idUsuario,
                fechaRegistro: moment().format("YYYY-MM-DD"),
                anio,
                mes: '00'
            }])
        } catch (error) {
            throw error;
        }
    },
    consultar: async function ({ anio, tipoProvision, tipoPlanilla = 'OBREROS' }) {
        let dataDetalle = []
        console.log(`select id from prov_cabecera where tipoPlanilla='${tipoPlanilla}' and tipoProvision='${tipoProvision}' and periodo='${anio}00'`)
        const dataProvCabcera = await mssqlClass.ejecutarQueryPreparado(`select id from prov_cabecera where tipoPlanilla='${tipoPlanilla}' and tipoProvision='${tipoProvision}' and periodo='${anio}00'`, {})

        if (dataProvCabcera.length > 0) {
            console.log("ENTROOOO")
            dataDetalle = await mssqlClass.ejecutarQueryPreparado(`select *,FORMAT(fechaIngreso,'yyyy/MM/dd') as fechaIngresoFormat,FORMAT(fechaCese,'yyyy/MM/dd') as fechaCeseFormat FROM prov_detalle where idcabecera  in(${dataProvCabcera.map(d => d.id).join()}) `, {})
        }
        return dataDetalle
    },
    exportExcel: async function ({ anio, tipoProvision, tipoPlanilla = 'OBREROS' }) {
        try {
            const data = await mssqlClass.ejecutarQueryPreparado(`SELECT A.anio,A.tipoPlanilla,A.tipoProvision ,B.nroDni,b.nombres,b.fechaIngreso,b.area,b.montoMensual
FROM prov_cabecera A 
left join prov_detalle B on B.idCabecera=A.id
where A.tipoProvision='${tipoProvision}' and A.tipoPlanilla='${tipoPlanilla}' and A.periodo='${anio}00'
`, {})
            const urlTemplate = `./template/Plantilla Apertura.xlsx`
            const workbookExcel = await workbook.xlsx.readFile(urlTemplate)
            const sheetPl = workbookExcel.getWorksheet("Hoja1")
            sheetPl.getCell("B2").value = `DETALLE DE APERTURA-AÑO:${anio}`
            sheetPl.getCell("B3").value = `TIPO PROVISION:${tipoPlanilla}`
            for (let i = 0; i < data.length; i++) {
                const dataCurrent = data[i]
                sheetPl.getCell(`A${i + 6}`).value = dataCurrent.nroDni
                sheetPl.getCell(`B${i + 6}`).value = dataCurrent.nombres
                sheetPl.getCell(`C${i + 6}`).value = dataCurrent.fechaIngreso
                sheetPl.getCell(`D${i + 6}`).value = dataCurrent.area
                sheetPl.getCell(`E${i + 6}`).value = dataCurrent.montoMensual
            }
            await workbook.xlsx.writeFile("./template/exportacion provision apertura.xlsx")
            return { url: `/supergen-be/template/exportacion provision apertura.xlsx` }
        } catch (error) {
            throw error
        }
    },

    pintarExcel: function (sheet, startRowIndex = 1, startColumnIndex = 1, headers = [], bodies = [], numberColumnsOfFirstColum = 0, pintarExcelVacio = false) {
        try {
            const borderStyles = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            const alignmentStyle = { vertical: "middle", horizontal: "center", wrapText: true }
            let lastRowIndex = startRowIndex + headers.length + bodies.length
            const numeroColumnas = headers[0].datos.reduce((prev, curr) => {
                prev += (curr.colSpan ? curr.colSpan : 1);
                return prev;
            }, 0)
            let lastColumnIndex = startColumnIndex + 1 + numeroColumnas
            for (let i = 0; i < headers.length; i++) {
                let lastIndexCol = startColumnIndex + 1
                const { color = "#343A40", ...headerActual } = headers[i]
                let accAnterior = 1;
                const rowIndexActual = startRowIndex + i
                const rowActual = sheet.getRow(rowIndexActual)
                const cellActual = rowActual.getCell(startColumnIndex)
                if (headerActual.item != "" || pintarExcelVacio) {

                    cellActual.border = borderStyles
                    cellActual.value = headerActual.item
                    cellActual.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: color.replace("#", "") },
                        bgColor: { argb: color.replace("#", "") }
                    }
                    cellActual.alignment = alignmentStyle
                }
                for (let j = 0; j < headerActual.datos.length; j++) {
                    const { color: colorDato = "#343A40", ...datoActual } = headerActual.datos[j]
                    let initColumn = startColumnIndex + 1 + j
                    lastIndexCol += datoActual.colSpan ? datoActual.colSpan : 1
                    if (headerActual.datos[j - 1]) {
                        accAnterior += headerActual.datos[j - 1].colSpan
                    }
                    if (datoActual.colSpan > 1) {
                        sheet.mergeCells(rowIndexActual, accAnterior + 1 + (startColumnIndex > 1 ? startColumnIndex - 1 : 0), rowIndexActual, lastIndexCol - 1)
                        initColumn += lastIndexCol
                    }
                    const cellActualDato = rowActual.getCell(lastIndexCol - 1)

                    cellActualDato.value = datoActual.titulo ? datoActual.titulo : datoActual.valor
                    cellActualDato.alignment = alignmentStyle
                    cellActualDato.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: colorDato.replace("#", "") },
                        bgColor: { argb: colorDato.replace("#", "") }
                    }
                    cellActualDato.border = borderStyles
                }
            }
            for (let i = 0; i < bodies.length; i++) {
                const { color = "ffffff", ...bodieActual } = bodies[i]
                const rowIndexActual = headers.length + 1 + i + (startRowIndex == 1 ? 0 : startRowIndex - 1)
                const rowActual = sheet.getRow(rowIndexActual)
                const cellActual = rowActual.getCell(startColumnIndex + numberColumnsOfFirstColum)
                if (bodieActual.item != "") {
                    cellActual.border = borderStyles
                    cellActual.value = bodieActual.item
                }

                cellActual.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: color.replace("#", "") },
                    bgColor: { argb: color.replace("#", "") }
                }
                cellActual.alignment = alignmentStyle
                for (let j = 0; j < bodieActual.datos.length; j++) {
                    const { color: colorDato = "ffffff", ...datoActual } = bodieActual.datos[j]
                    let initColumn = startColumnIndex + 1 + j + numberColumnsOfFirstColum
                    const cellActualDato = rowActual.getCell(initColumn)
                    cellActualDato.value = datoActual.valor
                    cellActualDato.alignment = alignmentStyle
                    cellActualDato.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: colorDato.replace("#", "") },
                        bgColor: { argb: colorDato.replace("#", "") }
                    }
                    cellActualDato.border = borderStyles
                }
            }

            return { lastRowIndex, lastColumnIndex }

        } catch (error) {
            throw new ServerError(error.message, 500)
        }


    }
}

module.exports = provisionAperturaModelo