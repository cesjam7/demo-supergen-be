const mssqlConcar = require("../dbConnectionMSSQLClass")()

const fc_tdocModelo = {
    guardar: async function (objeto) {
        try {
            await mssqlConcar.insertar("fc_tdoc", [{ descripcion: objeto.descripcion, tipoDoc: objeto.tipoDoc }])
        } catch (error) {
            throw new Error(error)
        }

    },
    editar: async function (objeto) {
        try {
            await mssqlConcar.actualizar("fc_tdoc", { descripcion: objeto.descripcion, tipoDoc: objeto.tipoDoc }, { id: objeto.id })
        } catch (error) {
            throw new Error(error)
        }
    },
    listar: async function () {
        try {
            const lista = await mssqlConcar.ejecutarQueryPreparado(`select * from fc_tdoc`, {})
            return lista
        } catch (error) {
            throw new Error(error)
        }
    },

}

module.exports = fc_tdocModelo
