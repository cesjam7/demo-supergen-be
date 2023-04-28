const mssqlConcar = require("./../dbConnectionMSSQLClass")()

const fc_subFamilia = {
    guardar: async function (objeto) {
        try {
            await mssqlConcar.insertar("fc_subFamilia", [{ descripcion: objeto.descripcion }])
        } catch (error) {
            throw new Error(error)
        }

    },
    editar: async function (objeto) {
        try {
            await mssqlConcar.actualizar("fc_subFamilia", { descripcion: objeto.descripcion }, { id: objeto.id })
        } catch (error) {
            throw new Error(error)
        }
    },
    listar: async function () {
        try {
            const lista = await mssqlConcar.ejecutarQueryPreparado(`select * from fc_subFamilia where activo=1`, {})
            return lista
        } catch (error) {
            throw new Error(error)
        }
    },
    eliminar: async function (objetoId) {
        try {
            await mssqlConcar.actualizar("fc_subFamilia", { activo: 0 }, { id: objetoId })
        } catch (error) {
            throw new Error(error)
        }

    }

}

module.exports = fc_subFamilia
