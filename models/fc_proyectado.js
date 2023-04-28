const moment = require("moment");
const excelUtil = require("../utils/excel");
const fcFamilia = require("./fc_familia")
const fcSubFamilia = require("./fc_subFamilia")
const fcTipoServicio = require("./fc_tipoServicio")
const fcTipoAnexo = require("./fc_tipoAnexo")
const fcTipoDocumento = require("./fc_tipoDoc")
const fcTipoFlujo = require("./fc_tipoFlujo");
const ServerError = require("../error");
const mssqlConcar = require("../dbConnectionMSSQLClass")()
var Excel = require('exceljs');
var workbook = new Excel.Workbook();
var fs = require('fs');

const fc_proyectado = {
    guardar: async function ({ detalles, ...objeto }, idUsuario) {
        try {
            const { mes, anio } = objeto
            const periodoBd = await mssqlConcar.ejecutarQueryPreparado(`select estado from fc_periodo where anioMes='${anio}${mes}'`, {}, true)
            if (periodoBd == undefined) throw new Error(`El periodo no está creado`)
            if (periodoBd.estado == 0) throw new Error(`El periodo está cerrado`)
            const montoSoles = detalles.filter(d => d.moneda == "MN").reduce((prev, curr) => prev += curr.totalPago, 0)
            const montoDolares = detalles.filter(d => d.moneda == "US").reduce((prev, curr) => prev += curr.totalPago, 0)
            let idCabecera = 0;
            const fechaRegistro = moment().format("YYYY-MM-DD")
            const cabeceraBd = await mssqlConcar.ejecutarQueryPreparado(`select id from fc_cabecera_flujo_proyectado where mes='${objeto.mes}' and anio='${objeto.anio}' and idEstado=1`, {}, true)
            if (cabeceraBd) {
                idCabecera = cabeceraBd.id
                await mssqlConcar.ejecutarQueryPreparado(`update fc_cabecera_flujo_proyectado set anio='${objeto.anio}', mes='${objeto.mes}',montoSoles=${montoSoles},montoDolares=${montoDolares} where id=${objeto.id}`, {})
/*                 await mssqlConcar.actualizar("fc_cabecera_flujo_proyectado", { anio: objeto.anio, mes: objeto.mes, montoSoles, montoDolares }, { id: idCabecera })
 */            } else {
                const query = await mssqlConcar.queryInsertarEnLotes("fc_cabecera_flujo_proyectado", [{ anio: objeto.anio, mes: objeto.mes, montoSoles, montoDolares, fechaRegistro, idUsuario, idEstado: 1, fechaFlujo: fechaRegistro }])
                const cabecera = await mssqlConcar.ejecutarQueryPreparado(`${query};SELECT SCOPE_IDENTITY() as id;`, {}, true)
                idCabecera = cabecera.id
            }
            await mssqlConcar.ejecutarQueryPreparado(`delete from fc_detalle_flujo_proyectado where idCabecera=${idCabecera}`, {})
            if (detalles.length > 0) {
                const detallesMap = detalles.map(d => ({
                    idCabecera, fechaPago: moment(d.fechaPago, ['DD/MM/YYYY', 'YYYY-MM-DD']).format("YYYY-MM-DD").toString(),
                    rucProveedor: d.proveedor.ruc.trim(),
                    nombreProveedor: d.proveedor.nombre.trim(),
                    numeroDocumento: d.numeroDocumento ? d.numeroDocumento : null,
                    descripcion: d.descripcion,
                    moneda: d.moneda,
                    totalPago: d.totalPago,
                    tipoCambio: d.tipoCambio,
                    me: d.me,
                    idTipoFlujo: d.tipoFlujo.id,
                    idFamilia: d.familia.id,
                    idSubFamilia: d.subFamilia.id,
                    idTipoServicio: d.tipoServicio.id,
                    idTipoDocumento: d.tipoDocumento.id,
                    idTipoAnexo: d.tipoAnexo.id,
                }))
                await mssqlConcar.insertar("fc_detalle_flujo_proyectado", detallesMap)
            }
        } catch (error) {
            throw new Error(error)
        }

    },
    actualizarTipoServicioFamiliaYSubFamilia: async function ({ tipoServicio, familia, subFamilia, tipoFlujo, id, periodo }) {
        const periodoBd = await mssqlConcar.ejecutarQueryPreparado(`select estado from fc_periodo  where anioMes='${periodo}'`, {}, true)
        if (periodoBd == undefined) throw new Error(`El periodo no está creado`)
        if (periodoBd.estado == 0) throw new Error(`El periodo ${periodo} esta cerrado`)
        await mssqlConcar.actualizar('fc_detalle_flujo_proyectado', { idFamilia: familia.id, idSubFamilia: subFamilia.id, idTipoServicio: tipoServicio.id, idTipoFlujo: tipoFlujo.id }, { id })
    },
    exportarExcel: async function (id) {


        try {
            const borderStyles = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            const styleCell = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '002060' }
            }

            const cabecera = await mssqlConcar.ejecutarQueryPreparado(`select * from fc_cabecera_flujo_proyectado where id=${id}`, {}, true)
            const listaDetalles = await mssqlConcar.ejecutarQueryPreparado(`EXEC SP_FLUJOPROY_LISTARREGISTRO  '${cabecera.anio}', '${cabecera.mes}', ${id};`, {})
            const listaDetallesResumido = await mssqlConcar.ejecutarQueryPreparado(`EXEC SP_FLUJOPROY_LISTARresumen   '${cabecera.anio}', '${cabecera.mes}', ${id};`, {})
            const rutaTemplatePedidos = "./template/Exportacion Flujo Proyectado.xlsx";
            if (fs.existsSync(`.${rutaTemplatePedidos}`)) {
                fs.unlinkSync(`.${rutaTemplatePedidos}`);
            }

            await workbook.xlsx.readFile("./template/Plantilla Exportacion Flujo Proyectado.xlsx")
            const sheetFlujo = workbook.getWorksheet("Flujo");
            const sheetResumido = workbook.getWorksheet("Resumen");
            sheetFlujo.getCell("B2").value = `AÑO:${cabecera.anio} MES:${cabecera.mes}`
            for (let i = 0; i < listaDetalles.length; i++) {
                const dataCurrent = listaDetalles[i];
                sheetFlujo.getCell(`A${i + 6}`).value = moment(dataCurrent.fechaPago).format("DD-MM-YYYYY");
                sheetFlujo.getCell(`A${i + 6}`).alignment = { vertical: "middle", horizontal: "center" };
                sheetFlujo.getCell(`A${i + 6}`).border = borderStyles;

                sheetFlujo.getCell(`B${i + 6}`).value = dataCurrent.Proveedor;
                sheetFlujo.getCell(`B${i + 6}`).alignment = { vertical: "middle", horizontal: "center" };
                sheetFlujo.getCell(`B${i + 6}`).border = borderStyles;


                sheetFlujo.getCell(`C${i + 6}`).value = dataCurrent.tipoDoc;
                sheetFlujo.getCell(`C${i + 6}`).alignment = { vertical: "middle", horizontal: "center" };
                sheetFlujo.getCell(`C${i + 6}`).border = borderStyles;

                sheetFlujo.getCell(`D${i + 6}`).value = dataCurrent.numeroDocumento;
                sheetFlujo.getCell(`D${i + 6}`).alignment = { vertical: "middle", horizontal: "center" };
                sheetFlujo.getCell(`D${i + 6}`).border = borderStyles;


                sheetFlujo.getCell(`E${i + 6}`).value = dataCurrent.descripcion;
                sheetFlujo.getCell(`E${i + 6}`).alignment = { vertical: "middle", horizontal: "center" };
                sheetFlujo.getCell(`E${i + 6}`).border = borderStyles;


                sheetFlujo.getCell(`F${i + 6}`).value = dataCurrent.Moneda;
                sheetFlujo.getCell(`F${i + 6}`).alignment = { vertical: "middle", horizontal: "center" };
                sheetFlujo.getCell(`F${i + 6}`).border = borderStyles;


                sheetFlujo.getCell(`G${i + 6}`).value = dataCurrent.totalPago;
                sheetFlujo.getCell(`G${i + 6}`).alignment = { vertical: "middle", horizontal: "center" };
                sheetFlujo.getCell(`G${i + 6}`).border = borderStyles;

                sheetFlujo.getCell(`H${i + 6}`).value = dataCurrent.tipoCambio;
                sheetFlujo.getCell(`H${i + 6}`).alignment = { vertical: "middle", horizontal: "center" };
                sheetFlujo.getCell(`H${i + 6}`).border = borderStyles;


                sheetFlujo.getCell(`I${i + 6}`).value = dataCurrent.me;
                sheetFlujo.getCell(`I${i + 6}`).alignment = { vertical: "middle", horizontal: "center" };
                sheetFlujo.getCell(`I${i + 6}`).border = borderStyles;

                sheetFlujo.getCell(`J${i + 6}`).value = dataCurrent.tipoFlujo;
                sheetFlujo.getCell(`J${i + 6}`).alignment = { vertical: "middle", horizontal: "center" };
                sheetFlujo.getCell(`J${i + 6}`).border = borderStyles;

                sheetFlujo.getCell(`K${i + 6}`).value = dataCurrent.familia;
                sheetFlujo.getCell(`K${i + 6}`).alignment = { vertical: "middle", horizontal: "center" };
                sheetFlujo.getCell(`K${i + 6}`).border = borderStyles;

                sheetFlujo.getCell(`L${i + 6}`).value = dataCurrent.subfamilia;
                sheetFlujo.getCell(`L${i + 6}`).alignment = { vertical: "middle", horizontal: "center" };
                sheetFlujo.getCell(`L${i + 6}`).border = borderStyles;

                sheetFlujo.getCell(`M${i + 6}`).value = dataCurrent.TipoServicio;
                sheetFlujo.getCell(`M${i + 6}`).alignment = { vertical: "middle", horizontal: "center" };
                sheetFlujo.getCell(`M${i + 6}`).border = borderStyles;

                sheetFlujo.getCell(`N${i + 6}`).value = dataCurrent.idTipoAnexo;
                sheetFlujo.getCell(`N${i + 6}`).alignment = { vertical: "middle", horizontal: "center" };
                sheetFlujo.getCell(`N${i + 6}`).border = borderStyles;

                sheetFlujo.getCell(`O${i + 6}`).value = dataCurrent.rucProveedor;
                sheetFlujo.getCell(`O${i + 6}`).alignment = { vertical: "middle", horizontal: "center" };
                sheetFlujo.getCell(`O${i + 6}`).border = borderStyles;

            }
            sheetResumido.getCell("B2").value = `AÑO:${cabecera.anio} MES:${cabecera.mes}`

            for (let i = 0; i < listaDetallesResumido.length; i++) {
                const dataCurrent = listaDetallesResumido[i];
                const row = sheetResumido.getRow(i + 6)
                row.getCell(1).value = dataCurrent.TipoServicio
                row.getCell(1).border = borderStyles;
                row.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
                row.getCell(2).value = dataCurrent.ME
                row.getCell(2).border = borderStyles;
                row.getCell(2).alignment = { vertical: "middle", horizontal: "center" };
            }
            await workbook.xlsx.writeFile(rutaTemplatePedidos)
            return { templateUrl: `/supergen-be/template/Exportacion Flujo Proyectado.xlsx` }
        } catch (error) {
            console.log("err", error)
            throw error;
        }

    },
    tipoCambioPorFecha: async function (periodo) {
        let valor = 0
        const data = await mssqlConcar.ejecutarQueryPreparado(`select XMEIMP2 from RSCONCAR.dbo.ctcamb where xfeccam='${periodo}' and XCODMON='US'`, {}, true)
        if (data) {
            valor = data.XMEIMP2
        }
        return valor
    },
    listar: async function () {
        try {
            const lista = await mssqlConcar.ejecutarQueryPreparado(`select * from fc_cabecera_flujo_proyectado where idEstado=1`, {})
            return lista
        } catch (error) {
            throw new Error(error)
        }
    },
    importar: async function (excelRuta) {
        let errors = []
        let dataProcess = []
        const monedaCambio = {
            "Dolares": "US",
            "Soles": "MD"
        }
        const celdasConValidaciones = [
            { column: "A", validate: true, message: "Fecha pago requerido", fn: function (valor) { return valor != null && !valor != undefined; }, field: "fechaPago" },
            {
                column: "B", validate: true, message: "Nombre del proveedor requerido", fn: function (valor) { return valor != null && !valor != undefined; }, message: "", field: "proveedorNombre",
            },
            {
                column: "C", validate: true, message: "Tipo documento requerido", fn: function (valor) { return valor != null && !valor != undefined; }, message: "", field: "tipoDocumentoNombre"
            },
            { column: "D", validate: false, field: "numeroDocumento" },
            { column: "E", validate: true, message: "Descripcion requerido", fn: function (valor) { return valor != null && !valor != undefined; }, field: "descripcion" },
            { column: "F", validate: true, message: "Moneda requerido", fn: function (valor) { return valor != null && !valor != undefined; }, field: "moneda" },
            { column: "G", validate: true, message: "Total pago requerido", fn: function (valor) { return valor != null && !valor != undefined; }, field: "totalPago" },
            { column: "H", validate: true, message: "Tipo cambio requerido", fn: function (valor) { return valor != null && !valor != undefined; }, field: "tipoCambio" },
            { column: "I", validate: true, message: "me requerido", fn: function (valor) { return valor != null && !valor != undefined; }, field: "me" },
            { column: "J", validate: true, message: "Tipo flujo requerido", fn: function (valor) { return valor != null && !valor != undefined; }, field: "tipoFlujoNombre" },
            { column: "K", validate: true, message: "Familia requerido", fn: function (valor) { return valor != null && !valor != undefined; }, field: "familiaNombre" },
            { column: "L", validate: true, message: "Sub familia requerido", fn: function (valor) { return valor != null && !valor != undefined; }, field: "subFamiliaNombre" },
            { column: "M", validate: true, message: "Tipo servicio requerido", fn: function (valor) { return valor != null && !valor != undefined; }, field: "tipoServicioNombre" },
            { column: "N", validate: true, message: "Tipo anexo requerido", fn: function (valor) { return valor != null && !valor != undefined; }, field: "tipoAnexoNombre" },
            { column: "O", validate: true, message: "Ruc proveedor requerido", fn: function (valor) { return valor != null && !valor != undefined; }, field: "rucProveedor" },
        ];
        const data = await excelUtil.transformExcelAJson(excelRuta, celdasConValidaciones, 2, "Hoja1")
        const familias = await fcFamilia.listar()
        const subFamilias = await fcSubFamilia.listar()
        const tipoServicios = await fcTipoServicio.listar()
        const anexos = await fcTipoAnexo.listar()
        const flujos = await fcTipoFlujo.listar()
        const tiposDocumentos = await fcTipoDocumento.listar()
        const familiasNombre = familias.map(f => f.descripcion.trim())
        const subFamiliasNombre = subFamilias.map(f => f.descripcion.trim())
        const tipoServicioNombre = tipoServicios.map(f => f.descripcion.trim())
        const anexosNombre = anexos.map(f => f.id.trim())
        const flujosNombre = flujos.map(f => f.descripcion.trim())
        const tipoDocumentoNombre = tiposDocumentos.map(f => f.tipoDoc)
        const indiceFamiliaNoEncontrada = data.findIndex(d => !familiasNombre.includes(d.familiaNombre.trim()))
        const indiceSubFamiliaNoEncontrada = data.findIndex(d => !subFamiliasNombre.includes(d.subFamiliaNombre.trim()))
        const indiceTipoServicioNoEncontrada = data.findIndex(d => !tipoServicioNombre.includes(d.tipoServicioNombre.trim()))
        const indiceAnexoNoEncontrada = data.findIndex(d => !anexosNombre.includes(d.tipoAnexoNombre.trim()))
        const indiceFlujoNoEncontrada = data.findIndex(d => !flujosNombre.includes(d.tipoFlujoNombre.trim()))
        const indiceTipoDocumentoNoEncontrada = data.findIndex(d => !tipoDocumentoNombre.includes(d.tipoDocumentoNombre.trim()))
        if (indiceFamiliaNoEncontrada >= 0) {
            const familiaExcel = data[indiceFamiliaNoEncontrada]
            errors.push(`La familia ${familiaExcel.familiaNombre} en la fila ${indiceFamiliaNoEncontrada + 2} no se encuentra registrada`)
        }
        if (indiceSubFamiliaNoEncontrada >= 0) {
            const subFamiliaExcel = data[indiceSubFamiliaNoEncontrada]
            errors.push(`La sub familia ${subFamiliaExcel.subFamiliaNombre} en la fila ${indiceSubFamiliaNoEncontrada + 2} no se encuentra registrada`)
        }
        if (indiceTipoServicioNoEncontrada >= 0) {
            const tipoServicioExcel = data[indiceTipoServicioNoEncontrada]
            errors.push(`El tipo de servicio ${tipoServicioExcel.tipoServicioNombre} en la fila ${indiceTipoServicioNoEncontrada + 2} no se encuentra registrada`)
        }
        if (indiceAnexoNoEncontrada >= 0) {
            const anexoExcel = data[indiceAnexoNoEncontrada]
            errors.push(`El anexo ${anexoExcel.tipoAnexoNombre} en la fila ${indiceAnexoNoEncontrada + 2} no se encuentra registrada`)
        }
        if (indiceFlujoNoEncontrada >= 0) {
            const flujoExcel = data[indiceFlujoNoEncontrada]
            errors.push(`El flujo ${flujoExcel.tipoFlujoNombre} en la fila ${indiceFlujoNoEncontrada + 2} no se encuentra registrada`)
        }
        if (indiceTipoDocumentoNoEncontrada >= 0) {
            const documentoExcel = data[indiceTipoDocumentoNoEncontrada]
            errors.push(`El tipo documento ${documentoExcel.tipoDocumentoNombre} en la fila ${indiceTipoDocumentoNoEncontrada + 2} no se encuentra registrada`)
        }

        if (errors.length > 0) {
            throw new ServerError(errors.join(";"), 400)
        }
        for (const dataBd of data) {
            const familia = familias.find(f => f.descripcion.trim() == dataBd.familiaNombre.trim())
            const subFamilia = subFamilias.find(f => f.descripcion.trim() == dataBd.subFamiliaNombre.trim())
            const tipoServicio = tipoServicios.find(f => f.descripcion.trim() == dataBd.tipoServicioNombre.trim())
            const tipoAnexo = anexos.find(f => f.id.trim() == dataBd.tipoAnexoNombre.trim())
            const tipoDocumento = tiposDocumentos.find(f => f.tipoDoc.trim() == dataBd.tipoDocumentoNombre.trim())
            const tipoFlujo = flujos.find(f => f.descripcion.trim() == dataBd.tipoFlujoNombre.trim())
            dataProcess.push({ familia, subFamilia, tipoServicio, tipoAnexo, tipoDocumento, tipoFlujo, proveedor: { ruc: dataBd.rucProveedor.toString(), nombre: dataBd.proveedorNombre }, fechaPago: moment(dataBd.fechaPago).format("YYYY-MM-DD"), ...dataBd, moneda: monedaCambio[dataBd.moneda] })

        }
        return dataProcess
    },
    listarDetallePorCabecera: async function (id) {
        try {
            const detalles = await mssqlConcar.ejecutarQueryPreparado(`select tipoAnexo.anexo as tipoAnexoNombre,detalleProyectado.*,familia.descripcion as familiaDescripcion,subFamilia.descripcion as subFamiliaDescripcion,
            tipoServicio.descripcion as tipoServicioDescripcion,tdoc.descripcion as tipoDocumentoDescripcion,tipoFlujo.descripcion as tipoFlujoDescripcion from fc_detalle_flujo_proyectado detalleProyectado join fc_familia familia on familia.id=detalleProyectado.idFamilia join fc_subFamilia subFamilia on subFamilia.id=detalleProyectado.idSubFamilia
            join fc_tipoServicio tipoServicio on tipoServicio.id=detalleProyectado.idTipoServicio join fc_tdoc tdoc on  tdoc.id=detalleProyectado.idTipoDocumento join fc_tipoFlujo tipoFlujo on tipoFlujo.id=detalleProyectado.idTipoFlujo
            join fc_tipo_anexo tipoAnexo on tipoAnexo.id=detalleProyectado.idTipoAnexo
            where idCabecera=${id}`, {})
            return detalles.map(d => ({
                ...d, proveedor: { ruc: d.rucProveedor, nombre: d.nombreProveedor },
                familia: { id: d.idFamilia, descripcion: d.familiaDescripcion },
                subFamilia: { id: d.idSubFamilia, descripcion: d.subFamiliaDescripcion },
                tipoFlujo: { id: d.idTipoFlujo, descripcion: d.tipoFlujoDescripcion },
                tipoServicio: { id: d.idTipoServicio, descripcion: d.tipoServicioDescripcion },
                tipoDocumento: { id: d.idTipoDocumento, descripcion: d.tipoDocumentoDescripcion },
                tipoAnexo: { id: d.idTipoAnexo, anexo: d.tipoAnexoNombre }
            }))
        } catch (error) {
            throw new Error(error)
        }

    },
    eliminar: async function (objetoId) {
        try {
            await mssqlConcar.actualizar("fc_cabecera_flujo_proyectado", { activo: 0 }, { id: objetoId })
        } catch (error) {
            throw new Error(error)
        }

    }

}

module.exports = fc_proyectado
