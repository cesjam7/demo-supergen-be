const moment = require("moment");
const mssql = require("../dbConnectionMSSQLClass")()
const alimentacionTarifaRuta = {
    guardar: async function ({ ruta, tarifa }, usuarioId) {
        const fechaRegistro = moment().format("YYYY-MM-DD")
        await mssql.insertar("alim_tarifa_ruta", [{ idRuta: ruta.id, tarifa, fechaRegistro }])
    },
    listar: async function () {
        const data = await mssql.ejecutarQueryPreparado(`select tarifaRuta.*,ruta.nombre as rutaNombre from alim_tarifa_ruta tarifaRuta join alim_ruta ruta on ruta.id=tarifaRuta.idRuta where tarifaRuta.activo=1`, {})
        return data.map(d => ({ ...d, ruta: { id: d.idRuta, nombre: d.rutaNombre } }))
    },
    editar: async function ({ ruta, tarifa, id }) {
        await mssql.actualizar("alim_tarifa_ruta", { idRuta: ruta.id, tarifa }, { id })
    },
    eliminar: async function (id) {
        await mssql.actualizar("alim_tarifa_ruta", { activo: 0 }, { id })
    }

}
module.exports = alimentacionTarifaRuta;