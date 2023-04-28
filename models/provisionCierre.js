const moment = require("moment")
const mysqlConnexion = require("./../dbConnectionClass")

const provisionCierre = {
    guardar: async function (objeto, usuarioRegistro) {
        try {
            const fechaInicio = moment(`${objeto.anio}${objeto.mes}`, "YYYYMM").startOf("M").format("YYYY-MM-DD")
            const fechaFin = moment(`${objeto.anio}${objeto.mes}`, "YYYYMM").endOf("M").format("YYYY-MM-DD")
            await mysqlConnexion.insertar("periodo_provision", [{
                anio: objeto.anio.toString(),
                mes: objeto.mes.toString(),
                anioMes: `${objeto.anio}${objeto.mes}`,
                fechaRegistro: moment().format("YYYY-MM-DD"),
                fechaInicio: fechaInicio.toString(),
                fechaFin: fechaFin.toString(),
                idUsuario: usuarioRegistro
            }])
        } catch (error) {
            throw new Error(error)
        }

    },
    editar: async function (objeto) {
        try {
            await mysqlConnexion.actualizar("periodo_provision", {
                anioMes: objeto.anioMes, mes: objeto.mes,
                fechaInicio: moment(objeto.fechaInicio).format("YYYY-MM-DD"),
                fechaFin: moment(objeto.fechaFin).format("YYYY-MM-DD"),
                fechaModificacion: moment().format("YYYY-MM-DD"),
                estado: objeto.estado

            }, { id: objeto.id })
        } catch (error) {
            throw new Error(error)
        }
    },
    listar: async function () {
        try {
            const lista = await mysqlConnexion.ejecutarQueryPreparado(`select id,anioMes,mes,anio,DATE_FORMAT(fechaRegistro,'%Y-%m-%d') as fechaRegistro,DATE_FORMAT(fechaModificacion,'%Y-%m-%d') as fechaModificacion,estado  from periodo_provision`, {})
            return lista
        } catch (error) {
            throw new Error(error)
        }
    },

}

module.exports = provisionCierre
