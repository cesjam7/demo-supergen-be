const moment = require("moment");
const mssql = require("../dbConnectionMSSQLClass")()
const alimentacionTarifa = {
    guardar: async function ({ nombre }, usuarioId) {
        const fechaRegistro = moment().format("YYYY-MM-DD")
        await mssql.insertar("alim_ruta", [{ nombre, fechaRegistro }])
    },
    listar: async function () {
        const data = await mssql.ejecutarQueryPreparado(`select * from alim_ruta where activo=1`, {})
        return data
    },
    listarTrabajadores: async function () {

        const data = await mssql.ejecutarQueryPreparado(`select A.id,A.idResponsable,B.nombres,A.idGranja,A.granja,A.tipo,A.idCosto,A.nombreCosto,A.idObjeto,A.nombreObjeto 
from DBCostsSG.dbo.alim_responsableNucleo A left join DBCostsSG.dbo.alim_responsable B on B.id=A.idResponsable order by A.granja
`, {})
        return data.map(d => ({ ...d, granja: { id: d.idGranja, nombre: d.granja }, objeto: { id: d.idObjeto, nombre: d.nombreObjeto } }))
    },
    editar: async function ({ nombre, id }) {
        await mssql.actualizar("alim_ruta", { nombre }, { id })
    },
    eliminar: async function (id) {
        await mssql.actualizar("alim_ruta", { activo: 0 }, { id })
    }

}
module.exports = alimentacionTarifa;