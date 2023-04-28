
const mssqlClass = require('../dbConnectionMSSQLClass')()
const mysqlClass = require("../dbConnectionClass")
const moment = require('moment');
moment.locale("es")
const Excel = require('exceljs');
const workbook = new Excel.Workbook();
const ServerError = require('../error');

const provisionCosteoModelo = {
    verificarInformacion: async function ({ anio, mes, tipoPlanilla = 'OBREROS' }) {
        const dataCabecera = await mssqlClass.ejecutarQueryPreparado(`select id from prov_costeo_cab where anio='${anio}' and mes='${mes}' and tipoPlanilla='${tipoPlanilla}' and idEstado<>0`, {}, true)
        return { exist: dataCabecera != null || dataCabecera != undefined }
    },
    procesar: async function ({ anio, mes, tipoPlanilla = 'OBREROS' }, idUsuario) {

        const periodo = moment(`${anio}${mes}`, "YYYYMM")
        const periodoProvision = await mysqlClass.ejecutarQueryPreparado(`select estado from periodo_provision where anioMes='${periodo.format("YYYYMM")}'`, {}, true)
        if (!periodoProvision) {
            throw new Error("Periodo no creado")
        }
        if (periodoProvision && periodoProvision.estado == 0) {
            throw new Error("No se puede procesar, periodo Cerrado, solo Consulte")
        }
        const fechaInicialPeriodo = periodo.clone().startOf("M").format("YYYY-MM-DD")
        const fechaRegistro = moment().format("YYYY-MM-DD")
        console.log(`EXEC  SP_LEECONSOLIDADO '${periodo.format("YYYYMM")}', '${tipoPlanilla}'`)
        const dataCentroCostosMysql = await mysqlClass.ejecutarQueryPreparado(`select idEmp,idC,NombreCC,Periodo from tareo_centro_costos where Periodo='${periodo.format("YYYYMM")}'`, {})

        const dataObreros = await mssqlClass.ejecutarQueryPreparado(`EXEC  SP_LEECONSOLIDADO '${periodo.format("YYYYMM")}', '${tipoPlanilla}'`, {})
        await mssqlClass.ejecutarQueryPreparado(`delete from prov_costeo_cab where periodo='${periodo.format("YYYYMM")}' and tipoPlanilla='${tipoPlanilla}'`, {})
        /*   const dataCabecera = await mssqlClass.insertar("prov_costeo_cab", [{ fecha: fechaRegistro, periodo: periodo.format("YYYYMM"), mes, anio, tipoPlanilla, idUsuario }]) */
        const dataCabecera = await mssqlClass.ejecutarQueryPreparado(`insert into prov_costeo_cab(fecha,periodo,mes,anio,tipoPlanilla,idUsuario) values('${fechaRegistro}','${periodo.format('YYYYMM')}','${mes}','${anio}','${tipoPlanilla}',${idUsuario});SELECT SCOPE_IDENTITY() as id;`, {}, true)
        const dataObrerosMap = dataObreros.map(d => ({
            nroDni: d.NRODNI, nombres: d.NOMBRES, fechaCese: d.FECHACESE ? moment(d.FECHACESE).format("YYYY-MM-DD") : null, fechaIngreso: d.FECHAINGRESO ? moment(d.FECHAINGRESO).format("YYYY-MM-DD") : null, centroCosto: d.CENTROCOSTO, area: d.AREA, salarios: d.SALARIOS, esSalud: d.ESSALUD,
            vacaciones: d.VACACIONES, cts: d.CTS, gratificacion: d.GRATIFICACION, fechaRegistro, idCabecera: dataCabecera.id,
            otros: d.OTROS

        }))
        const dataMortalidad = await mysqlClass.ejecutarQueryPreparado(`select w.idLevante,C.nombre,sum(w.saldoinicial) saldoInicial,C.ccosto from (
                select B.idLevante,A.fecha,A.idlote,B.lote, A.saldoinicial  from 
                prod_mortalidaddiaria A left join lotes B on B.idLote=A.idlote 
                where A.fecha='${fechaInicialPeriodo}' 
                )w left join levantes C on C.idLevante=w.idLevante
                group by w.idLevante,C.nombre,C.ccosto
                `, {})
        const saldoInicialTotal = dataMortalidad.reduce((prev, curr) => prev += curr.saldoInicial, 0)
        const dataMortalidadConRatio = dataMortalidad.map((mortalidad) => ({ idLevante: mortalidad.idLevante, periodo: periodo.format("YYYYMM"), nombre: mortalidad.nombre, ccosto: mortalidad.ccosto, saldoInicial: mortalidad.saldoInicial, ratio: (mortalidad.saldoInicial / saldoInicialTotal) * 100 }))
        await mssqlClass.ejecutarQueryPreparado(`delete from prov_costomortalidad where periodo='${periodo.format("YYYYMM")}'`, {})
        if (dataMortalidadConRatio.length > 0) {
            await mssqlClass.insertar("prov_costomortalidad", dataMortalidadConRatio)
        }
        await mssqlClass.ejecutarQueryPreparado(`delete from tareo_centro_costos where Periodo='${periodo.format("YYYYMM")}'`, {})
        if (dataCentroCostosMysql.length > 0) {
            await mssqlClass.insertar("tareo_centro_costos", dataCentroCostosMysql)
        }
        if (dataObrerosMap.length > 0) {
            await mssqlClass.insertar("prov_costeo_detalle", dataObrerosMap)
        }

        await mssqlClass.ejecutarQueryPreparado(`exec SP_PROCESA_COSTEODISTRIBUCION '${periodo.format("YYYYMM")}','${tipoPlanilla}'`, {})
        const dataLotesGabriela = await mssqlClass.ejecutarQueryPreparado(`SELECT * FROM prov_costeocongabriela where periodo='${periodo.format("YYYYMM")}' and tipoplanilla='${tipoPlanilla}'`, {})
        const dataLotesSinGabriela = await mssqlClass.ejecutarQueryPreparado(`SELECT * FROM prov_costeosingabriela where  periodo='${periodo.format("YYYYMM")}' and tipoplanilla='${tipoPlanilla}'`, {})
        const totalGabriela = dataLotesGabriela.reduce((prev, curr) => {
            prev.salario += curr.salario
            prev.essalud += curr.essalud
            prev.vacaciones += curr.vacaciones
            prev.cts += curr.cts
            prev.gratificacion += curr.gratificacion
            return prev;
        }, { salario: 0, essalud: 0, vacaciones: 0, cts: 0, gratificacion: 0 })
        const totalSinGabriela = dataLotesSinGabriela.reduce((prev, curr) => {
            prev.salario += curr.salario
            prev.essalud += curr.essalud
            prev.vacaciones += curr.vacaciones
            prev.cts += curr.cts
            prev.gratificacion += curr.gratificacion
            return prev;
        }, { salario: 0, essalud: 0, vacaciones: 0, cts: 0, gratificacion: 0 })
        dataLotesGabriela.push({ ...totalGabriela, ccosto: "", nombrecc: "Total" })
        dataLotesSinGabriela.push({ ...totalSinGabriela, ccosto: "", nombrecc: "Total" })
        dataMortalidadConRatio.push({ idLevante: 0, periodo: "", nombre: "Total", ccosto: "", saldoInicial: saldoInicialTotal, ratio: 100 })
        return { obreros: dataObrerosMap, lotes: dataMortalidadConRatio, dataLotesGabriela, dataLotesSinGabriela }


    },
    consultar: async function ({ anio, mes, tipoPlanilla = 'OBREROS' }) {
        const periodo = moment(`${anio}${mes}`, "YYYYMM").format("YYYYMM")
        const fechaInicialPeriodo = moment(periodo, "YYYYMM").startOf("M").format("YYYY-MM-DD")
        const dataLotesGabriela = await mssqlClass.ejecutarQueryPreparado(`SELECT * FROM prov_costeocongabriela where periodo='${periodo}' and tipoplanilla='${tipoPlanilla}'`, {})
        const dataLotesSinGabriela = await mssqlClass.ejecutarQueryPreparado(`SELECT * FROM prov_costeosingabriela where  periodo='${periodo}' and tipoplanilla='${tipoPlanilla}'`, {})
        const obreros = await mssqlClass.ejecutarQueryPreparado(`select B.*,FORMAT(B.fechaIngreso,'yyyy/MM/dd') as fechaIngresoFormat,FORMAT(B.fechaCese,'yyyy/MM/dd') as fechaCeseFormat from prov_costeo_cab A INNER join prov_costeo_detalle B on b.idCabecera=A.id
        where A.tipoPlanilla='${tipoPlanilla}' and A.periodo='${periodo}'
        `, {})
        /*         const dataMortalidad = await mysqlClass.ejecutarQueryPreparado(`select w.idLevante,C.nombre,sum(w.saldoinicial) saldoInicial,C.ccosto from (
                    select B.idLevante,A.fecha,A.idlote,B.lote, A.saldoinicial  from 
                    prod_mortalidaddiaria A left join lotes B on B.idLote=A.idlote 
                    where A.fecha='${fechaInicialPeriodo}' 
                    )w left join levantes C on C.idLevante=w.idLevante
                    group by w.idLevante,C.nombre,C.ccosto
                    `, {}) */
        const dataMortalidad = await mssqlClass.ejecutarQueryPreparado(`select * from prov_costomortalidad where periodo='${periodo}'`, {})
        const saldoInicialTotal = dataMortalidad.reduce((prev, curr) => prev += curr.saldoInicial, 0)
        const dataMortalidadConRatio = [...dataMortalidad]
        const totalGabriela = dataLotesGabriela.reduce((prev, curr) => {
            prev.salario += curr.salario
            prev.essalud += curr.essalud
            prev.vacaciones += curr.vacaciones
            prev.cts += curr.cts
            prev.gratificacion += curr.gratificacion
            return prev;
        }, { salario: 0, essalud: 0, vacaciones: 0, cts: 0, gratificacion: 0 })
        const totalSinGabriela = dataLotesSinGabriela.reduce((prev, curr) => {
            prev.salario += curr.salario
            prev.essalud += curr.essalud
            prev.vacaciones += curr.vacaciones
            prev.cts += curr.cts
            prev.gratificacion += curr.gratificacion
            return prev;
        }, { salario: 0, essalud: 0, vacaciones: 0, cts: 0, gratificacion: 0 })
        dataLotesGabriela.push({ ...totalGabriela, ccosto: "", nombrecc: "Total" })
        dataLotesSinGabriela.push({ ...totalSinGabriela, ccosto: "", nombrecc: "Total" })
        dataMortalidadConRatio.push({ idLevante: 0, periodo: "", nombre: "Total", ccosto: "", saldoInicial: saldoInicialTotal, ratio: 100 })
        return { obreros, dataLotesGabriela, dataLotesSinGabriela, lotes: dataMortalidadConRatio }
    },
    exportExcel: async function ({ anio, mes, tipoPlanilla = 'OBREROS' }) {
        try {
            const { dataLotesGabriela, dataLotesSinGabriela, lotes, obreros } = await this.consultar({ anio, mes, tipoPlanilla })


            const propiedadesObreros = ["nroDni", "nombres", "fechaIngreso", "area", "salarios", "esSalud", "vacaciones", "cts", "gratificacion", "otros"]
            const propiedadesGabriela = ["nombrecc", "salario", "essalud", "vacaciones", "cts", "gratificacion", "otros"]
            const propiedadesLotes = ["nombre", "saldoInicial", "ratio", "tipo", "ratio2"]
            const obrerosMap = obreros.map(obrero => ({ item: "", datos: propiedadesObreros.map(key => ({ valor: obrero[key], titulo: obrero[key], colSpan: 1 })) }))
            const dataLotesGabrielaMap = dataLotesGabriela.map(grabriela => ({ item: "", datos: propiedadesGabriela.map(key => ({ valor: grabriela[key], titulo: grabriela[key], colSpan: 1 })) }))
            const dataLotesSinGabrielaMap = dataLotesSinGabriela.map(grabriela => ({ item: "", datos: propiedadesGabriela.map(key => ({ valor: grabriela[key], titulo: grabriela[key], colSpan: 1 })) }))
            const lotesMap = lotes.map(lote => ({ item: "", datos: propiedadesLotes.map(key => ({ valor: lote[key], titulo: lote[key], colSpan: 1 })) }))

            const headerObreros = [{
                item: "", datos: [{ valor: "DNI", titulo: "DNI", colSpan: 1 }, { valor: "Nombres", titulo: "Nombres", colSpan: 1 }, { valor: "fecha Ingreso", titulo: "Fecha Ingreso", colSpan: 1 }, { valor: "C.Costo", titulo: "C.Costo", colSpan: 1 },
                { valor: "Salarios", titulo: "Salarios", colSpan: 1 }, { valor: "Essalud", titulo: "Essalud", colSpan: 1 }, { valor: "Vacaciones", titulo: "Vacaciones", colSpan: 1 },
                { valor: "CTS", titulo: "CTS", colSpan: 1 }, { valor: "Gratificaciones", titulo: "Gratificaciones", colSpan: 1 }, { valor: "Otros", titulo: "Otros", colSpan: 1 }]
            }]
            const headerGabrierla = [{
                item: "", datos: [{ valor: "C.Costo", titulo: "C.Costo", colSpan: 1 }, { valor: "Salarios", titulo: "Salarios", colSpan: 1 }, { valor: "Essalud", titulo: "Essalud", colSpan: 1 }, { valor: "Vacaciones", titulo: "Vacaciones", colSpan: 1 },
                { valor: "CTS", titulo: "CTS", colSpan: 1 }, { valor: "Gratificaciones", titulo: "Gratificaciones", colSpan: 1 },
                { valor: "Otros", titulo: "Otros", colSpan: 1 }]
            }]
            const headerSinGabrierla = [{
                item: "", datos: [{ valor: "C.Costo", titulo: "C.Costo", colSpan: 1 }, { valor: "Salarios", titulo: "Salarios", colSpan: 1 }, { valor: "Essalud", titulo: "Essalud", colSpan: 1 }, { valor: "Vacaciones", titulo: "Vacaciones", colSpan: 1 },
                { valor: "CTS", titulo: "CTS", colSpan: 1 }, { valor: "Gratificaciones", titulo: "Gratificaciones", colSpan: 1 }, { valor: "Otros", titulo: "Otros", colSpan: 1 }]
            }]
            const headerLotes = [{
                item: "", datos: [{ valor: "Nombre", titulo: "Nombre", colSpan: 1 }, { valor: "Saldo Total", titulo: "Saldo Total", colSpan: 1 }, { valor: "Porcentaje", titulo: "%", colSpan: 1 }, { valor: "Tipo", titulo: "Tipo", colSpan: 1 }, { valor: "% P/L", titulo: "% P/L", colSpan: 1 }]
            }]
            const periodo = moment(`${anio}${mes}`, "YYYYMM")

            const urlTemplate = `./template/Plantilla Costeo.xlsx`
            const workbookExcel = await workbook.xlsx.readFile(urlTemplate)
            const sheetPl = workbookExcel.getWorksheet("Costeo")
            sheetPl.getCell("B3").value = `PERIODO:${periodo.format("MMMM")} ${periodo.format("YYYY")}`
            sheetPl.getCell("B2").value = `DETALLE DE COSTEO- ${tipoPlanilla}`
            const { lastRowIndex, lastColumnIndex } = this.pintarExcel(sheetPl, 6, 1, headerObreros, obrerosMap, 0, false)
            const { lastRowIndex: ultimaFilaGabriela } = this.pintarExcel(sheetPl, 6, lastColumnIndex + 3, headerGabrierla, dataLotesGabrielaMap, 0, false)
            const { lastRowIndex: ultimaFilaSinGabrieal } = this.pintarExcel(sheetPl, ultimaFilaGabriela + 2, lastColumnIndex + 3, headerSinGabrierla, dataLotesSinGabrielaMap, 0, false)
            this.pintarExcel(sheetPl, ultimaFilaSinGabrieal + 2, lastColumnIndex + 3, headerLotes, lotesMap, 0, false)
            await workbook.xlsx.writeFile("./template/exportacion costeo.xlsx")
            return { url: `/supergen-be/template/exportacion costeo.xlsx` }
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
                const { color = "#FFFFFF", ...headerActual } = headers[i]
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
                        fgColor: { argb: "FFFFFF" },
                        bgColor: { argb: "FFFFFF" }
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
                    cellActualDato.font = { color: { argb: "FFFFFF" } };
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

module.exports = provisionCosteoModelo