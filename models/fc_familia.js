const mssqlConcar = require("./../dbConnectionMSSQLClass")()

const fc_familia = {
    guardar: async function (objeto) {
        try {
            await mssqlConcar.insertar("fc_familia", [{ descripcion: objeto.descripcion }])
        } catch (error) {
            throw new Error(error)
        }

    },
    editar: async function (objeto) {
        try {
            await mssqlConcar.actualizar("fc_familia", { descripcion: objeto.descripcion }, { id: objeto.id })
        } catch (error) {
            throw new Error(error)
        }
    },
    listar: async function () {
        try {
            const lista = await mssqlConcar.ejecutarQueryPreparado(`select * from fc_familia where activo=1`, {})
            return lista
        } catch (error) {
            console.log("error", error)
            throw new Error(error)
        }
    },
    eliminar: async function (objetoId) {
        try {
            await mssqlConcar.actualizar("fc_familia", { activo: 0 }, { id: objetoId })
        } catch (error) {
            throw new Error(error)
        }

    }

}

module.exports = fc_familia
