const moment = require("moment")
const mssqlClass = require('../dbConnectionMSSQLClass')()
const fcPeriodoModelo = {
    guardar: async function (objeto, usuarioRegistro) {
        try {
            const fechaInicio = moment(`${objeto.anio}${objeto.mes}`, "YYYYMM").startOf("M").format("YYYY-MM-DD")
            const fechaFin = moment(`${objeto.anio}${objeto.mes}`, "YYYYMM").endOf("M").format("YYYY-MM-DD")
            await mssqlClass.insertar("fc_periodo", [{
                anio: objeto.anio,
                mes: objeto.mes,
                anioMes: `${objeto.anio}${objeto.mes}`,
                fechaRegistro: moment().format("YYYY-MM-DD"),
                fechaInicio,
                fechaFin,
                idUsuario: usuarioRegistro
            }])
        } catch (error) {
            throw new Error(error)
        }

    },
    editar: async function (objeto) {
        try {
            await mssqlClass.actualizar("fc_periodo", {
                anioMes: objeto.anioMes, mes: objeto.mes,
                fechaModificacion: moment().format("YYYY-MM-DD"),
                estado: objeto.estado

            }, { id: objeto.id })
        } catch (error) {
            throw new Error(error)
        }
    },
    listar: async function () {
        try {
            const lista = await mssqlClass.ejecutarQueryPreparado(`select id,anioMes,mes,anio,FORMAT(fechaRegistro,'yyyy-MM-dd') as fechaRegistro,FORMAT(fechaModificacion,'yyyy-MM-dd') as fechaModificacion,estado  from fc_periodo`, {})
            return lista
        } catch (error) {
            throw new Error(error)
        }
    },

}

module.exports = fcPeriodoModelo
