const moment = require("moment");
const ServerError = require("../error");

const mssql = require("../dbConnectionMSSQLClass")()
const mysql = require("../dbConnectionClass")
const confirmacionRuta = {
    eliminarTrabajador: async function (id) {
        await mssql.ejecutarQueryPreparado(`delete from alim_responsableNucleo_det where id=${id}`, {})
    },
    listarRutas: async function () {
        const data = await mssql.ejecutarQueryPreparado(`select * from alim_ruta where activo=1`, {})
        return data
    },

    confirmarRuta: async function (empleados = [], usuarioId, fecha = null) {
        const fechaActualMoment = fecha ? moment(fecha, 'DD/MM/YYYY') : moment()
        const fechaHoy = fechaActualMoment.format('DD/MM/YYYY')
        for (const empleado of empleados) {
            if (empleado.cena) {
                empleado.ruta = { id: 0 }
            }
            empleado.movilidad = empleado.cena ? "N" : 'S'
            empleado.cena = empleado.cena ? 'S' : 'N'
            const punchTimeTransform = moment(empleado.punch_time.punch_time).utc().format('DD/MM/YYYY HH:mm:ss')
            await mssql.ejecutarQueryPreparado(`exec SP_ALIMENTO_INSERTACENA_MOVILIDAD '${fechaHoy}',${empleado.punch_time.emp_id},'${empleado.punch_time.emp_code}','${empleado.punch_time.first_name}','${empleado.punch_time.last_name}','${punchTimeTransform}',
                        ${empleado.punch_time.terminal_id},${empleado.idObjeto},'${empleado.nombreObjeto}','${empleado.tipo}','${empleado.idCosto.toString().padStart(5, '0')}','${empleado.nombreCosto}','${empleado.cena}','${empleado.movilidad}',${empleado.ruta.id},${usuarioId}`, {})
        }
    },
    confirmarRutaGuardian: async function ({ guardianes = [], fecha }, usuarioId) {
        const fechaHoyMoment = moment(fecha, ["YYYY-MM-DD", "DD/MM/YYYY"])
        const fechaMananaMoment = fechaHoyMoment.clone().add(1, "day")
        const fechaHoy = moment(fecha, ["YYYY-MM-DD", "DD/MM/YYYY"]).format('DD/MM/YYYY')
        const fechaManana = fechaMananaMoment.format('DD/MM/YYYY')
        for (const empleado of guardianes) {
            const punchTimeTransform = moment(empleado.punch_time.punch_time).utc().format('DD/MM/YYYY HH:mm:ss')
            if (empleado.almuerzo) {
                empleado.ruta = { id: 0 }
            }
            empleado.movilidad = empleado.cena ? "N" : 'S'
            console.log(`exec SP_ALIMENTO_INSERTAALMUERZO_MOVILIDAD_GUARDIAN '${fechaHoy}',${empleado.punch_time.emp_id},'${empleado.punch_time.emp_code}','${empleado.punch_time.first_name}','${empleado.punch_time.last_name}','${punchTimeTransform}',
${empleado.punch_time.terminal_id},${empleado.idObjeto},'${empleado.nombreObjeto}','${empleado.tipo}','${empleado.idCosto.toString().padStart(5, '0')}','${empleado.nombreCosto}',${usuarioId},${empleado.ruta.id}`)
            await mssql.ejecutarQueryPreparado(`exec SP_ALIMENTO_INSERTAALMUERZO_MOVILIDAD_GUARDIAN '${fechaHoy}',${empleado.punch_time.emp_id},'${empleado.punch_time.emp_code}','${empleado.punch_time.first_name}','${empleado.punch_time.last_name}','${punchTimeTransform}',
            ${empleado.punch_time.terminal_id},${empleado.idObjeto},'${empleado.nombreObjeto}','${empleado.tipo}','${empleado.idCosto.toString().padStart(5, '0')}','${empleado.nombreCosto}',${usuarioId},${empleado.ruta.id}`, {})
        }
    },
    listarTrabajadores: async function (id) {
        try {
            const fechaHoy = moment().format('DD/MM/YYYY')
            const fechaMañana = moment().add(1, "day").format("DD/MM/YYYY")
            let trabajadores = []
            const fechaActual = moment().format('DD/MM/YYYY')
            const responsable = await mssql.ejecutarQueryPreparado(`select id from alim_responsable where idUsuario=${id}`, {}, true)
            if (responsable) {
                console.log(`exec SP_ALIMENTO_DETALLENUCLEO2 ${responsable.id},'${fechaActual}'`)
                const data = await mssql.ejecutarQueryPreparado(`exec SP_ALIMENTO_DETALLENUCLEO2 ${responsable.id},'${fechaActual}'`, {})
                if (data.length > 0) {
                    data[0].show = true
                    data[0].rowSpan = data.length
                    trabajadores = data
                }
                for (const trabajador of trabajadores) {
                    trabajador.punch_time = await mssql.ejecutarQueryPreparado(`exec SP_ALIMENTO_CONFIRMAMARCACION '${trabajador.codigoTrab}','${fechaHoy}','${fechaMañana}'`, {}, true)
                }
            }

            return trabajadores

        } catch (error) {
            throw new Error(error.message)
        }

    },
    listarTrabajadoresPorFecha: async function (id, fecha) {
        try {
            const fechaHoy = moment(fecha, 'YYYY-MM-DD').format('DD/MM/YYYY')
            const fechaMañana = moment(fecha, 'YYYY-MM-DD').add(1, "day").format("DD/MM/YYYY")
            let trabajadores = []
            const fechaActual = moment(fecha, 'YYYY-MM-DD').format('DD/MM/YYYY')
            const data = await mssql.ejecutarQueryPreparado(`exec SP_ALIMENTO_DETALLENUCLEO2 ${id},'${fechaActual}'`, {})
            if (data.length > 0) {
                data[0].show = true
                data[0].rowSpan = data.length
                trabajadores = data
            }
            for (const trabajador of trabajadores) {
                console.log(`exec SP_ALIMENTO_CONFIRMAMARCACION '${trabajador.codigoTrab}','${fechaHoy}','${fechaMañana}'`)
                trabajador.punch_time = await mssql.ejecutarQueryPreparado(`exec SP_ALIMENTO_CONFIRMAMARCACION '${trabajador.codigoTrab}','${fechaHoy}','${fechaMañana}'`, {}, true)
            }

            return trabajadores

        } catch (error) {
            throw new Error(error.message)
        }

    },
    eliminarCenaMovilidad: async function ({ fecha, codigoEmpleado }) {

        try {
            const fechaMoment = moment(fecha, "YYYY-MM-DD").format("YYYY/MM/DD")
            await mssql.ejecutarQueryPreparado(`exec SP_ALIMENTO_BORRA_MARCACION_CENA  '${fechaMoment}','${codigoEmpleado}'`, {})
        } catch (error) {

            throw new Error(error.message)
        }

    },
    listarGuardianes: async function (id) {
        try {
            const fechaHoy = moment().format('DD/MM/YYYY')
            const fechaMañana = moment().add(1, "day").format("DD/MM/YYYY")
            let trabajadores = []
            const fechaActual = moment().format('DD/MM/YYYY')
            const responsable = await mssql.ejecutarQueryPreparado(`select id from alim_responsable where idUsuario=${id}`, {}, true)
            if (responsable) {
                console.log(`exec SP_ALIMENTO_DETALLENUCLEO_GUARDIAN2   ${responsable.id},'${fechaActual}'`)
                const data = await mssql.ejecutarQueryPreparado(`exec SP_ALIMENTO_DETALLENUCLEO_GUARDIAN2   ${responsable.id},'${fechaActual}'`, {})
                if (data.length > 0) {
                    data[0].show = true
                    data[0].rowSpan = data.length
                    trabajadores = data
                }
                for (const trabajador of trabajadores) {
                    trabajador.punch_time = await mssql.ejecutarQueryPreparado(`exec SP_ALIMENTO_CONFIRMAMARCACION '${trabajador.codigoTrab}','${fechaHoy}','${fechaMañana}'`, {}, true)
                }
            }

            return trabajadores

        } catch (error) {
            throw new Error(error.message)
        }
    },
    listarGuardianesPorFechaPortal: async function ({ fecha, id }) {
        try {
            const fechaMañana = moment(fecha, 'DD/MM/YYYY').add(1, "day").format("DD/MM/YYYY")
            console.log(`exec SP_ALIMENTO_DETALLENUCLEO_GUARDIAN2   ${id},'${fecha}'`)
            const data = await mssql.ejecutarQueryPreparado(`exec SP_ALIMENTO_DETALLENUCLEO_GUARDIAN2   ${id},'${fecha}'`, {})
            let trabajadores = []
            if (data.length > 0) {
                data[0].show = true
                data[0].rowSpan = data.length
                trabajadores = data
            }
            for (const trabajador of trabajadores) {
                trabajador.punch_time = await mssql.ejecutarQueryPreparado(`exec SP_ALIMENTO_CONFIRMAMARCACION '${trabajador.codigoTrab}','${fecha}','${fechaMañana}'`, {}, true)
            }
            return trabajadores

        } catch (error) {
            throw new Error(error.message)
        }
    },
    listarGuardianesPortal: async function (id) {
        try {
            const fechaHoy = moment().format('DD/MM/YYYY')
            const fechaMañana = moment().add(1, "day").format("DD/MM/YYYY")
            let trabajadores = []
            const fechaActual = moment().format('DD/MM/YYYY')
            const responsable = await mssql.ejecutarQueryPreparado(`select id from alim_responsable where idUsuario=${id}`, {}, true)
            if (responsable) {
                console.log(`exec SP_ALIMENTO_DETALLENUCLEO_GUARDIAN2_EDITA   ${responsable.id},'${fechaActual}'`)
                const data = await mssql.ejecutarQueryPreparado(`exec SP_ALIMENTO_DETALLENUCLEO_GUARDIAN2_EDITA   ${responsable.id},'${fechaActual}'`, {})
                if (data.length > 0) {
                    data[0].show = true
                    data[0].rowSpan = data.length
                    trabajadores = data
                }
                for (const trabajador of trabajadores) {
                    trabajador.punch_time = await mssql.ejecutarQueryPreparado(`exec SP_ALIMENTO_CONFIRMAMARCACION '${trabajador.codigoTrab}','${fechaHoy}','${fechaMañana}'`, {}, true)
                }
            }

            return trabajadores

        } catch (error) {
            throw new Error(error.message)
        }

    },

}
module.exports = confirmacionRuta;