const moment = require("moment")
const Excel = require('exceljs');
const workbook = new Excel.Workbook();
const mssqlConcar = require("../dbConnectionMSSQLClass")()

const fc_proveedor_tipo_servicio = {
    guardar: async function ({ proveedor, tipoServicio }, idUsuario) {
        try {
            await mssqlConcar.insertar("fc_proveedor_tipo_servicio", [{ ruc: proveedor.ruc, proveedor: proveedor.nombre, tipoProveedor: proveedor.tipo, idTipoServicio: tipoServicio.id, idUsuario, fechaRegistro: moment().format("YYYY-MM-DD") }])
        } catch (error) {
            throw new Error(error)
        }

    },
    listarProveedores: async function () {
        const proveedores = await mssqlConcar.ejecutarQueryPreparado(`SELECT ACODANE as ruc,ADESANE as nombre,TIPO_PROV as tipo FROM VE_PROVEEDORCONCAR ORDER BY ADESANE`, {})
        return proveedores
    },
    listarTipoServicio: async function () {
        const proveedores = await mssqlConcar.ejecutarQueryPreparado(`SELECT * tipo FROM fc_tipoServicio `, {})
        return proveedores
    },
    editar: async function ({ proveedor, tipoServicio, id }) {
        try {
            await mssqlConcar.actualizar("fc_proveedor_tipo_servicio", { ruc: proveedor.ruc, proveedor: proveedor.nombre, tipoProveedor: proveedor.tipo, idTipoServicio: tipoServicio.id }, { id })
        } catch (error) {
            throw new Error(error)
        }
    },
    listar: async function () {
        try {
            const lista = await mssqlConcar.ejecutarQueryPreparado(`select fcTipoServicio.*,t.id as idTipoServicio1,t.descripcion as descripcionTipoServicio from fc_proveedor_tipo_servicio fcTipoServicio join fc_tipoServicio t on t.id=fcTipoServicio.idTipoServicio where estado=1`, {})
            return lista.map(l => ({ ...l, proveedor: { tipo: l.tipoProveedor, ruc: l.ruc, nombre: l.proveedor }, tipoServicio: { id: l.idTipoServicio1, descripcion: l.descripcionTipoServicio } }))
        } catch (error) {
            throw new Error(error)
        }
    },
    eliminar: async function (objetoId) {
        try {
            await mssqlConcar.actualizar("fc_proveedor_tipo_servicio", { estado: 0 }, { id: objetoId })
        } catch (error) {
            throw new Error(error)
        }

    },
    exportarExcel: async function () {
        try {

            const data = await this.listar()
            const urlTemplate = `./template/Pantilla Proveedor Tipo Servicio.xlsx`
            const workbookExcel = await workbook.xlsx.readFile(urlTemplate)
            const sheetPl = workbookExcel.getWorksheet("Hoja1")

            for (let i = 0; i < data.length; i++) {
                const dataCurrent = data[i]
                sheetPl.getCell(`A${i + 2}`).value = dataCurrent.proveedor.ruc
                sheetPl.getCell(`B${i + 2}`).value = dataCurrent.proveedor.nombre
                sheetPl.getCell(`C${i + 2}`).value = dataCurrent.tipoServicio.id
                sheetPl.getCell(`D${i + 2}`).value = dataCurrent.tipoServicio.descripcion
                sheetPl.getCell(`E${i + 2}`).value = dataCurrent.proveedor.tipo

            }
            await workbook.xlsx.writeFile("./template/exportacion Pantilla Proveedor Tipo Servicio.xlsx")
            return { url: `/supergen-be/template/exportacion Pantilla Proveedor Tipo Servicio.xlsx` }
        } catch (error) {
            throw error
        }

    }

}

module.exports = fc_proveedor_tipo_servicio
