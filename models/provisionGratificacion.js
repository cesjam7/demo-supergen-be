const moment = require("moment")
const mssqlConcar = require("../dbConnectionMSSQLClass")()
const Excel = require('exceljs');
var fs = require('fs');
const mysqlClass = require("./../dbConnectionClass");
const ServerError = require("../error");

const workbook = new Excel.Workbook();
const provisionGratificacion = {
    guardar: async function ({ detalleDocumentos = [], detalles = [], ...cabecera }, usuarioRegistro) {
        try {
            let idCabecera = 0
            const periodo = `${cabecera.anio}${cabecera.mes}`
            const fechaRegistro = moment().format("YYYY-MM-DD")
            const cabeceraEntity = await mssqlConcar.ejecutarQueryPreparado(`select id from prov_cabecera where periodo='${periodo}' and tipoPlanilla='${cabecera.tipoPlanilla}' and tipoProvision='GRATIFICACION' and condicion='${cabecera.condicion}'`, {}, true)
            if (cabeceraEntity) {
                idCabecera = cabeceraEntity.id
            }
            if (!idCabecera) {
                const cabeceraEntidad = await mssqlConcar.ejecutarQueryPreparado(`insert into prov_cabecera(periodo,tipoProvision,tipoPlanilla,condicion,fechaRegistro,idEstado,idUsuario,anio,mes,fecha) values('${periodo}','GRATIFICACION','${cabecera.tipoPlanilla}','${cabecera.condicion}','${moment().format("YYYY-MM-DD")}',0,${usuarioRegistro},'${cabecera.anio}','${cabecera.mes}','${moment(periodo, 'YYYYMM').startOf("M").format("YYYY-MM-DD")}');SELECT SCOPE_IDENTITY() as id;`, {}, true)
                idCabecera = cabeceraEntidad.id
            }
            await mssqlConcar.ejecutarQueryPreparado(`delete from prov_cabeceraDocumentos where idCabecera=${idCabecera}`, {})
            /*          if (detalleDocumentos.length > 0) {
                         await mssqlConcar.insertar("prov_cabeceraDocumentos", detalleDocumentos.map(d => ({ nroDiario: d.nroDiario, comprobante: d.nroComprobante, glosa: d.glosa, fechaRegistro: moment().format("YYYY-MM-DD"), idEstado: 0, idUsuario: usuarioRegistro, idCabecera, fechaComprobante: moment(d.fechaComprobante).format("YYYY-MM-DD") })))
                     } */
            if (detalleDocumentos.length > 0) {
                const query = await mssqlConcar.queryInsertarEnLotes("prov_cabeceraDocumentos", detalleDocumentos.map(d => ({ nroDiario: d.nroDiario.toString(), comprobante: d.nroComprobante.toString(), glosa: d.glosa.toString(), fechaRegistro: moment().format("YYYY-MM-DD").toString(), idEstado: 0, idUsuario: usuarioRegistro, idCabecera, fechaComprobante: moment(d.fechaComprobante).format("YYYY-MM-DD") })))
                /*                 await mssqlConcar.insertar("prov_cabeceraDocumentos",)
                 */
                await mssqlConcar.ejecutarQueryPreparado(query, {})
            }
            const detallesMap = detalleDocumentos.map(d => ({ periodo, tipoPlanilla: cabecera.tipoPlanilla, condicion: cabecera.condicion, comprobante: d.nroComprobante, nroDiario: d.nroDiario }))

            await mssqlConcar.ejecutarQueryPreparado(`delete from prov_detalle where idCabecera=${idCabecera}`, {})
            for (const detalle of detallesMap) {
                await mssqlConcar.ejecutarQueryPreparado(`exec SP_INSERTA_DETALLEGRATIFICACION '${detalle.periodo}', '${detalle.tipoPlanilla}', '${detalle.condicion}','${detalle.nroDiario}','${detalle.comprobante}',${idCabecera}`, {})
            }
        } catch (error) {
            console.error(error)
            throw new Error(error)
        }

    },
    crearDetalles: async function ({ detalles = [], idCabecera }) {
        const fechaRegistro = moment().format("YYYY-MM-DD")
        await mssqlConcar.ejecutarQueryPreparado(`delete from prov_detalle where idCabecera=${idCabecera}`, {})
        await mssqlConcar.insertar("prov_detalle", detalles.map(d => ({ ...d, idCabecera, fechaRegistro })))

    },

    exportarDetalle: async function (idCabecera) {
        try {
            const rutaTemplateHC = `./template/Plantilla Provision CTS.xlsx`;
            const detalles = await this.listarDetallesPorCabecera(idCabecera)
            const montoMensualTotal = detalles.reduce((prev, curr) => prev += curr.montoMensual, 0)
            if (fs.existsSync(`./template/Provision VACACIONES.xlsx`)) {
                fs.unlinkSync(`./template/Provision VACACIONES.xlsx`)
            }
            const borderStyles = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            const wor = await workbook.xlsx.readFile(rutaTemplateHC)
            const sheet = wor.worksheets[0];
            let initRow = 5
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

            await wor.xlsx.writeFile(`./template/Provision VACACIONES.xlsx`)
            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "/supergen-be/template/Provision VACACIONES.xlsx"
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
    resumen: async function ({ anio, tipoPlanilla }) {
        try {
            const listaPropiedadesDatos = ["SALDO_INICIAL", "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "ABONO_JUNIO", "AJUSTEPAGOS_JUNIO", "JULIO", "AGOSTO", "SETIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE", "ABONO_DICIEMBRE", "SALDO_ANIO", "TOTAL_PAGOS", "SALDO_FINAL"]
            const dataProcess = []
            const data = await mssqlConcar.ejecutarQueryPreparado(`exec SP_RESUMENGRATIFICACION  '${anio}' , '${tipoPlanilla}'`, {})
            for (let i = 0; i < data.length; i++) {
                const dataActual = data[i]
                const datos = Object.keys(dataActual).filter(key => listaPropiedadesDatos.includes(key)).map(key => dataActual[key])
                let dataResumen = { nombres: dataActual.NOMBRES, tipoPlanilla: dataActual.TIPOPLANILLA, condicion: dataActual.CONDICION, nroDni: dataActual.NRODNI, fechaCese: dataActual.FECHACESE, fechaIngreso: dataActual.FECHAINGRESO, centroCosto: dataActual.CENTROCOSTO, area: dataActual.AREA, datos }
                dataProcess.push(dataResumen)

            }
            return dataProcess
        } catch (error) {
            throw error;
        }

    },
    eliminarProvision: async function ({ anio, mes, tipoPlanilla, condicion }) {

        const periodo = `${anio}${mes}`
        const message = await this.validarPeriodo(periodo)
        if (message != "") {
            throw new Error(message)
        }
        await mssqlConcar.ejecutarQueryPreparado(`delete from prov_cabecera where periodo='${periodo}' and tipoPlanilla='${tipoPlanilla}' and condicion='${condicion}' and tipoProvision='GRATIFICACION'`, {})

    },
    crearPago: async function ({ pagos = [], detalleDocumentos = [], ...cabecera }, usuarioRegistro) {
        let idCabecera = 0
        const fechaRegistro = moment().format("YYYY-MM-DD")
        const periodo = `${cabecera.anio}${cabecera.mes}`
        const cabeceraEntity = await mssqlConcar.ejecutarQueryPreparado(`select id from prov_cabecera where periodo='${periodo}' and tipoPlanilla='${cabecera.tipoPlanilla}' and tipoProvision='GRATIFICACION' and condicion='${cabecera.condicion}'`, {}, true)
        if (cabeceraEntity) {
            idCabecera = cabeceraEntity.id
        }
        if (!idCabecera) {
            const cabeceraEntidad = await mssqlConcar.insertar("prov_cabecera", [{ periodo: `${cabecera.anio}${cabecera.mes}`, tipoProvision: 'GRATIFICACION', tipoPlanilla: cabecera.tipoPlanilla, condicion: cabecera.condicion, fechaRegistro: moment().format("YYYY-MM-DD"), idEstado: 0, idUsuario: usuarioRegistro, anio: cabecera.anio, mes: cabecera.mes, fecha: moment(`${cabecera.anio}${cabecera.mes}`, 'YYYYMM').startOf("M").format("YYYY-MM-DD") }])
            idCabecera = cabeceraEntidad.id
        }
        if (detalleDocumentos.length > 0) {
            await mssqlConcar.ejecutarQueryPreparado(`delete from prov_cabeceraDocumentos where idCabecera=${idCabecera}`, {})

            await mssqlConcar.insertar("prov_cabeceraDocumentos", detalleDocumentos.map(d => ({ nroDiario: d.nroDiario, comprobante: d.nroComprobante, glosa: d.glosa, fechaRegistro: moment().format("YYYY-MM-DD"), idEstado: 0, idUsuario: usuarioRegistro, idCabecera, fechaComprobante: moment(d.fechaComprobante).format("YYYY-MM-DD"), tipoComprobante: "Pago" })))
        }
        if (pagos.length > 0) {
            await mssqlConcar.ejecutarQueryPreparado(`delete from prov_pago where idCabecera=${idCabecera}`, {})
            await mssqlConcar.insertar("prov_pago", pagos.map(d => ({ ...d, idCabecera, fechaRegistro })))
        }
    },
    listarPago: async function ({ periodo, tipoPlanilla, condicion }) {
        const message = await this.validarPeriodo(periodo)
        if (message != "") {
            throw new Error(message)
        }
        const data = await mssqlConcar.ejecutarQueryPreparado(`EXEC SP_LEEDIARIO_PAGOSGRATIFICACION   '${periodo}','${tipoPlanilla}','${condicion}'`, {})
        return data.map(a => ({ nroDiario: a.DIARIO.trim(), nroComprobante: a.NROCOMPROB, glosa: a.CGLOSA, fechaComprobante: a.FECHA_COMPROB }))
    },
    listarPagoDetalles: async function (detalles = []) {
        let dataProcess = []
        for (const detalle of detalles) {
            const data = await mssqlConcar.ejecutarQueryPreparado(`EXEC SP_LEEDIARIO_DETALLEPAGOGRATIFICACION    '${detalle.periodo}','${detalle.tipoPlanilla}','${detalle.condicion}','${detalle.nroDiario}','${detalle.comprobante}'`, {})
            dataProcess = dataProcess.concat(data.map(d => ({ nroDni: d.NRO_DNI.trim(), nombres: d.NOMBRES, comprobante: detalle.comprobante, nroDiario: detalle.nroDiario, fechaCese: d.FEC_CESE, fechaIngreso: d.FEC_ING, centroCosto: d.CENTROCOSTO, area: d.AREA, montoMensual: d.MONTO_MES, pagoMensual: d.PAGO_MES, saldoMensual: d.SALO_MES, fechaPago: d.FECHA_PAGO, cuenta: d.CUENTA })))
        }
        return dataProcess
    },
    validarPeriodo: async function (periodo) {
        let message = ""
        const periodoBd = await mysqlClass.ejecutarQueryPreparado(`select estado from periodo_provision where anioMes='${periodo}'`, {}, true)
        console.log("periodo", periodoBd)
        if (!periodoBd) {
            message = "El Periodo no esta creado"

        }
        if (message == "" && periodoBd.estado == 0) {
            message = "Periodo Cerrado"
        }
        return message
    },
    exportatPagosDeResumen: async function ({ anio, tipoPlanilla, nroDni }) {
        const detalles = await this.pagosDeResumen({ anio, tipoPlanilla, nroDni })
        try {
            const rutaTemplateHC = `./template/Plantilla_Detalle_Pagos_trabajador.xlsx`;
            if (fs.existsSync(`./template/Detalle_Pagos_trabajador_gratificacion.xlsx`)) {
                fs.unlinkSync(`./template/Detalle_Pagos_trabajador_gratificacion.xlsx`)
            }
            const borderStyles = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            const wor = await workbook.xlsx.readFile(rutaTemplateHC)
            const sheet = wor.worksheets[0];
            let initRow = 5
            for (const detalle of detalles) {
                sheet.getCell(`A${initRow}`).value = detalle.nroDni
                sheet.getCell(`A${initRow}`).border = borderStyles
                sheet.getCell(`B${initRow}`).value = detalle.nombres
                sheet.getCell(`B${initRow}`).border = borderStyles
                sheet.getCell(`C${initRow}`).value = detalle.montoPago
                sheet.getCell(`C${initRow}`).border = borderStyles
                sheet.getCell(`D${initRow}`).value = detalle.fechaPago
                sheet.getCell(`D${initRow}`).border = borderStyles
            }
            await wor.xlsx.writeFile(`./template/Detalle_Pagos_trabajador_gratificacion.xlsx`)
            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "/supergen-be/template/Detalle_Pagos_trabajador_gratificacion.xlsx"
            }
            return json;
        } catch (error) {
            console.log("err", error)
            throw error;
        }
    },

    pagosDeResumen: async function ({ anio, tipoPlanilla, nroDni }) {
        const data = await mssqlConcar.ejecutarQueryPreparado(`exec SP_LEEDETALLEPAGOTRABAJADOR '${anio}','${tipoPlanilla}','GRATIFICACION','${nroDni}'`, {})
        return data.map(d => ({ ...d, montoPago: d.Monto_pagado }))
    },
    exportarResumido: async function ({ anio, tipoPlanilla }) {
        const detalles = await this.resumen({ anio, tipoPlanilla })
        try {
            const rutaTemplateHC = `./template/Plantilla Resumen Provision Gratificacion Anual.xlsx`;
            if (fs.existsSync(`./template/Resumen Provision Gratificacion.xlsx`)) {
                fs.unlinkSync(`./template/Resumen Provision Gratificacion.xlsx`)
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
                let indexCol = 6
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
                const row = sheet.getRow(initRow)
                for (const dato of detalle.datos) {
                    row.getCell(indexCol).value = dato
                    row.getCell(indexCol).border = borderStyles
                    indexCol++
                }
                initRow++
            }
            await wor.xlsx.writeFile(`./template/Resumen Provision Gratificacion.xlsx`)
            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "/supergen-be/template/Resumen Provision Gratificacion.xlsx"
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
            if (fs.existsSync(`./template/Pago CTS.xlsx`)) {
                fs.unlinkSync(`./template/Pago CTS.xlsx`)
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

            await wor.xlsx.writeFile(`./template/Pago CTS.xlsx`)
            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "/supergen-be/template/Pago CTS.xlsx"
            }
            return json;
        } catch (error) {
            console.log("err", error)
            throw error;
        }


    },
    listarDetallesPorCabecera: async function (idCabecera) {
        return await mssqlConcar.ejecutarQueryPreparado(`select * from prov_detalle where idCabecera=${idCabecera}`, {})
    },
    listarPagosPorCabecera: async function (idCabecera) {
        return await mssqlConcar.ejecutarQueryPreparado(`select * from prov_pago where idCabecera=${idCabecera}`, {})
    },

    listarDetalles: async function (detalles) {
        let dataProcess = []
        for (const detalle of detalles) {
            const data = await mssqlConcar.ejecutarQueryPreparado(`EXEC SP_LEEDIARIO_DETALLEGRATIFICACION  '${detalle.periodo}','${detalle.tipoPlanilla}','${detalle.condicion}','${detalle.nroDiario}','${detalle.comprobante}'`, {})
            if (data) {
                dataProcess = dataProcess.concat(data.map(d => ({ nroDni: d.NRO_DNI.trim(), nombres: d.NOMBRES, fechaCese: d.FEC_CESE, fechaIngreso: d.FEC_ING, centroCosto: d.CENTROCOSTO, area: d.AREA, montoMensual: d.MONTO_MES, pagoMensual: d.PAGO_MES, saldoMensual: d.SALDO_MES, fechaPago: d.FECHA_PAGO, cuenta: d.CUENTA })))
            }
        }
        return dataProcess
    },
    importar: async function ({ periodo, tipoPlanilla, condicion }) {
        const message = await this.validarPeriodo(periodo)
        if (message != "") {
            throw new Error(message)
        }
        const dataComprobantes = await mssqlConcar.ejecutarQueryPreparado(`EXEC SP_LEEDIARIO '${periodo}','${tipoPlanilla}','${condicion}'`, {})
        return dataComprobantes.map(a => ({ nroDiario: a.DIARIO.trim(), nroComprobante: a.NROCOMPROB, glosa: a.CGLOSA, fechaComprobante: a.FECHA_COMPROB }))
    },
    editar: async function (objeto) {
        try {

        } catch (error) {
            throw new Error(error)
        }
    },
    listar: async function ({ tipoPlanilla, condicion, desde, hasta, anio }) {
        try {
            const fechaInicial = moment(anio.concat(desde), 'YYYYMM').startOf("M").format("YYYY-MM-DD")
            const fechaFinal = moment(anio.concat(hasta), 'YYYYMM').startOf("M").format("YYYY-MM-DD")
            const data = await mssqlConcar.ejecutarQueryPreparado(`select provCabecera.tipoPlanilla,provCabecera.id as cabeceraId,provDcumentos.id as provDocumentosId,provCabecera.periodo,provCabecera.condicion,provDcumentos.nroDiario,provDcumentos.tipoComprobante,provDcumentos.comprobante,provDcumentos.glosa,FORMAT(provDcumentos.fechaComprobante,'yyyy-MM-dd') as fechaComprobante from prov_cabecera provCabecera join prov_cabeceraDocumentos provDcumentos on provDcumentos.idCabecera=provCabecera.id where tipoPlanilla like '%${tipoPlanilla && tipoPlanilla || ''}%'  and provCabecera.condicion like '%${condicion && condicion || ''}%' and provCabecera.tipoProvision='GRATIFICACION' and fecha >= '${fechaInicial}' and fecha<='${fechaFinal}'`, {})
            const dataProcess = data.reduce((prev, curr, indexReduce, array) => {
                const cabeceraFiltrada = array.filter(a => a.cabeceraId == curr.cabeceraId)
                if (!prev.find(p => p.cabeceraId == curr.cabeceraId)) {
                    prev = prev.concat(cabeceraFiltrada.map((item, index) => ({ ...item, rowSpan: cabeceraFiltrada.length, show: index == 0 })))
                }
                return prev;
            }, [])
            return dataProcess;
        } catch (error) {
            throw new Error(error)
        }
    },

    //Ajustes

    exportarExcelAjuste: async function (detallesFront) {
        try {
            const rutaTemplateHC = `./template/Plantilla Ajustes Gratificación.xlsx`;
            const detalles = detallesFront
            const montoMensualTotal = detalles.reduce((prev, curr) => prev += curr.montoMensual, 0)
            if (fs.existsSync(`./template/Provision Ajuste Gratificacion.xlsx`)) {
                fs.unlinkSync(`./template/Provision Ajuste Gratificacion.xlsx`)
            }
            const borderStyles = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            const wor = await workbook.xlsx.readFile(rutaTemplateHC)
            const sheet = wor.worksheets[0];
            let initRow = 5
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

            await wor.xlsx.writeFile(`./template/Provision Ajuste Gratificacion.xlsx`)
            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "/supergen-be/template/Provision Ajuste Gratificacion.xlsx"
            }
            return json;
        } catch (error) {
            console.log("err", error)
            throw error;
        }
    },
    guardarAjuste: async function ({ detalleDocumentos = [], detalles = [], ...cabecera }, usuarioRegistro) {
        const periodo = `${cabecera.anio}${cabecera.mes}`
        const fechaRegistro = moment().format("YYYY-MM-DD")
        const cabeceraBd = await mssqlConcar.ejecutarQueryPreparado(`select id from prov_cabecera where periodo='${periodo}' and tipoPlanilla='${cabecera.tipoPlanilla}' and tipoProvision='GRATIFICACION' and condicion='${cabecera.condicion}'`, {}, true)
        if (!cabeceraBd) {
            throw new ServerError(`No existe provision para el periodo ${periodo}`, 400)
        }
        const idCabecera = cabeceraBd.id
        if (detalles.length > 0) {
            await mssqlConcar.ejecutarQueryPreparado(`delete from prov_ajuste where idCabecera=${idCabecera}`, {})
            const queryInsertDetalle = await mssqlConcar.queryInsertarEnLotes("prov_ajuste", detalles.map(d => ({ ...d, idCabecera, fechaRegistro, fechaIngreso: moment(d.fechaIngreso).format("YYYY-MM-DD"), fechaCese: d.fechaCese ? moment(d.fechaCese).format("YYYY-MM") : null })))
            await mssqlConcar.ejecutarQueryPreparado(queryInsertDetalle, {})
        }
        if (detalleDocumentos.length > 0) {
            const query = await mssqlConcar.queryInsertarEnLotes("prov_cabeceraDocumentos", detalleDocumentos.map(d => ({ nroDiario: d.nroDiario.toString(), tipoComprobante: "Ajuste", comprobante: d.nroComprobante.toString(), glosa: d.glosa.toString(), fechaRegistro, idEstado: 0, idUsuario: usuarioRegistro, idCabecera, fechaComprobante: moment(d.fechaComprobante).format("YYYY-MM-DD") })))
            await mssqlConcar.ejecutarQueryPreparado(query, {})

        }
    },
    listarAjustes: async function (detalles = []) {
        let dataProcess = []
        for (const detalle of detalles) {
            const data = await mssqlConcar.ejecutarQueryPreparado(`EXEC SP_LEEDIARIO_DETALLEAJUSTEGRATIFICACION  '${detalle.periodo}','${detalle.tipoPlanilla}','${detalle.condicion}','${detalle.nroDiario}','${detalle.comprobante}'`, {})
            dataProcess = dataProcess.concat(data.map(d => ({ nroDni: d.NRO_DNI.trim(), nombres: d.NOMBRES, comprobante: detalle.comprobante, nroDiario: detalle.nroDiario, fechaCese: d.FEC_CESE, fechaIngreso: d.FEC_ING, centroCosto: d.CENTROCOSTO, area: d.AREA, montoMensual: d.MONTO_MES, pagoMensual: d.PAGO_MES, saldoMensual: d.SALO_MES, fechaPago: d.FECHA_PAGO, cuenta: d.CUENTA })))
        }
        return dataProcess


    },

    ajustesPorCabecera: async function (cabeceraId) {
        const data = await mssqlConcar.ejecutarQueryPreparado(`select * from prov_ajuste where idCabecera=${cabeceraId}`, {})
        const sumaTotal = data.reduce((prev, curr) => prev += curr.montoMensual, 0)
        return { data, sumaTotal };
    },
    detallesDocumentosAjustes: async function ({ periodo, tipoPlanilla, condicion }) {
        const message = await this.validarPeriodo(periodo)
        if (message != "") {
            throw new Error(message)
        }
        const dataComprobantes = await mssqlConcar.ejecutarQueryPreparado(`EXEC SP_LEEDIARIO_AJUSTEGRATIFICACION  '${periodo}','${tipoPlanilla}','${condicion}'`, {})
        return dataComprobantes.map(a => ({ nroDiario: a.DIARIO.trim(), nroComprobante: a.NROCOMPROB, glosa: a.CGLOSA, fechaComprobante: a.FECHA_COMPROB }))
    },

    detalleAjusteTrabajador: async function ({ anio, tipoPlanilla, nroDni }) {
        const data = await mssqlConcar.ejecutarQueryPreparado(`exec SP_LEEDETALLEAJUSTETRABAJADOR '${anio}','${tipoPlanilla}','GRATIFICACION','${nroDni}'`, {})
        const montoTotal = data.reduce((prev, curr) => prev += curr.Monto_pagado, 0)
        return { data, montoTotal }
    },
    exportarDetalleAjusteTrabajador: async function ({ data, montoTotal }) {
        try {
            const rutaTemplateHC = `./template/Plantilla_Detalle_Ajustes_trabajador.xlsx`;
            if (fs.existsSync(`./template/Detalle ajuste trabajador.xlsx`)) {
                fs.unlinkSync(`./template/Detalle ajuste trabajador.xlsx`)
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

            for (const detalle of data) {
                sheet.getCell(`A${initRow}`).value = detalle.nroDni
                sheet.getCell(`A${initRow}`).border = borderStyles
                sheet.getCell(`B${initRow}`).value = detalle.nombres
                sheet.getCell(`B${initRow}`).border = borderStyles
                sheet.getCell(`C${initRow}`).value = detalle.Monto_pagado
                sheet.getCell(`C${initRow}`).border = borderStyles
                sheet.getCell(`D${initRow}`).value = detalle.fechaPago
                sheet.getCell(`D${initRow}`).border = borderStyles
                initRow++
            }
            sheet.getCell(`C${initRow}`).value = montoTotal
            sheet.getCell(`C${initRow}`).border = borderStyles

            await wor.xlsx.writeFile(`./template/Detalle ajuste trabajador.xlsx`)
            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "/supergen-be/template/Detalle ajuste trabajador.xlsx"
            }
            return json;
        } catch (error) {
            console.log("err", error)
            throw error;
        }
    }

}

module.exports = provisionGratificacion
