const mssqlConcar = require("../dbConnectionMSSQLClass")()

const fc_tipoAnexoModelo = {
    guardar: async function (objeto) {
        try {
            await mssqlConcar.insertar("fc_tipo_anexo", [{ anexo: objeto.anexo, id: objeto.id }])
        } catch (error) {
            throw new Error(error)
        }

    },
    editar: async function (objeto) {
        try {
            await mssqlConcar.actualizar("fc_tipo_anexo", { anexo: objeto.anexo }, { id: objeto.id })
        } catch (error) {
            throw new Error(error)
        }
    },
    listarProveedoresPorTipoAnexo: async function (anexo) {
        const lista = await mssqlConcar.ejecutarQueryPreparado(`SELECT ACODANE as ruc,ADESANE as nombre  FROM VE_PROVEEDORES WHERE AVANEXO='${anexo.id}' ORDER BY ADESANE`, {})
        return lista
    },
    listar: async function () {
        try {
            const lista = await mssqlConcar.ejecutarQueryPreparado(`select * from fc_tipo_anexo`, {})
            return lista
        } catch (error) {
            console.log("error", error)
            throw new Error(error)
        }
    },
    eliminar: async function (objetoId) {
        try {
            await mssqlConcar.actualizar("fc_tipo_anexo", { activo: 0 }, { id: objetoId })
        } catch (error) {
            throw new Error(error)
        }

    }

}

module.exports = fc_tipoAnexoModelo
