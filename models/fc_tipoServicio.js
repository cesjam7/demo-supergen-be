const mssqlConcat = require("./../dbConnectionMSSQLClass")()

const fc_tipoServicio = {
    guardar: async function (objeto) {
        try {
            await mssqlConcat.insertar("fc_tipoServicio", [{descripcion: objeto.descripcion}])
        } catch (error) {
            throw new Error(error)
        }

    },
    editar: async function (objeto) {
        try {
            await mssqlConcat.actualizar("fc_tipoServicio", { descripcion: objeto.descripcion }, { id: objeto.id })
        } catch (error) {
            throw new Error(error)
        }
    },
    listar: async function () {
        try {
            const lista = await mssqlConcat.ejecutarQueryPreparado(`select * from fc_tipoServicio where activo=1`, {})
            return lista
        } catch (error) {
            throw new Error(error)
        }
    },
    eliminar: async function (objetoId) {
        try {
            await mssqlConcat.actualizar("fc_tipoServicio", { activo: 0 }, { id: objetoId })
        } catch (error) {
            throw new Error(error)
        }

    }

}

module.exports = fc_tipoServicio
