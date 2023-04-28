const mssqlConcar = require("./../dbConnectionMSSQLClass")()

const fc_tipoFlujCaja = {
    guardar: async function (objeto) {
        try {
            await mssqlConcar.insertar("fc_tipoFlujo", [{ descripcion: objeto.descripcion }])
        } catch (error) {
            throw new Error(error)
        }

    },
    editar: async function (objeto) {
        try {
            await mssqlConcar.actualizar("fc_tipoFlujo", { descripcion: objeto.descripcion }, { id: objeto.id })
        } catch (error) {
            throw new Error(error)
        }
    },
    listar: async function () {
        try {
            const lista = await mssqlConcar.ejecutarQueryPreparado(`select * from fc_tipoFlujo where activo=1`, {})
            return lista
        } catch (error) {
            throw new Error(error)
        }
    },
    eliminar: async function (objetoId) {
        try {
            await mssqlConcar.actualizar("fc_tipoFlujo", { activo: 0 }, { id: objetoId })
        } catch (error) {
            throw new Error(error)
        }

    }

}

module.exports = fc_tipoFlujCaja
