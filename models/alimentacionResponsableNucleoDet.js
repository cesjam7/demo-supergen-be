const moment = require("moment");
const ServerError = require("../error");

const mssql = require("../dbConnectionMSSQLClass")()
const mysql = require("../dbConnectionClass")
const alimentacionResponsableNucleo = {
    guardar: async function ({ data = [], idCabecera }) {
        const fechaRegistro = moment().format("YYYY-MM-DD")
        const codigoTrabs = data.map(d => d.codigoTrab.trim())
        const message = await this.validarCodigoTrabajador(codigoTrabs, idCabecera)
        if (message != "") {
            throw new ServerError(message, 400)
        }
/*         await mssql.ejecutarQueryPreparado(`delete from alim_responsableNucleo_det where idCabecera=${idCabecera} `)
 */        await mssql.insertar("alim_responsableNucleo_det", data.map(d => ({ codigoTrab: d.codigoTrab, nombreTrab: d.nombreTrab, dni: d.codigoTrab, tipoPlanilla: d.tipoPlanilla, es_guardian: d.esGuardian, fechaRegistro, idCabecera })))

    },
    transferir: async function ({ granjaDestino, trabajador }) {
        try {
            const dataCabecera = await this.detallePorGranja(granjaDestino)
            const fechaRegistro = moment().format("YYYY-MM-DD")
            await mssql.ejecutarQueryPreparado(`delete from alim_responsableNucleo_det where id=${trabajador.id}`, {})
            await mssql.insertar("alim_responsableNucleo_det", [{ codigoTrab: trabajador.codigoTrab, nombreTrab: trabajador.nombreTrab, dni: trabajador.codigoTrab, tipoPlanilla: trabajador.tipoPlanilla, es_guardian: trabajador.esGuardian, fechaRegistro, idCabecera: dataCabecera.id }])
        } catch (error) {
            throw error;
        }
    },
    detallePorGranja: async function (granja) {
        const data = await mssql.ejecutarQueryPreparado(`select responsableNucleo.*,responsable.nombres as nombreResponsable from alim_responsableNucleo responsableNucleo join alim_responsable responsable on responsable.id=responsableNucleo.idResponsable where idGranja=${granja.idGranja}`, {}, true)
        return data
    },
    validarCodigoTrabajador: async function (codigoTrab = [], idCabecera) {
        let message = ""
        const codigoTrabMap = codigoTrab.map(c => `'${c}'`)
        const data = await mssql.ejecutarQueryPreparado(`select codigoTrab,nombreTrab from alim_responsableNucleo_det where codigoTrab in(${codigoTrabMap.join()}) ${idCabecera ? ` and idCabecera=${idCabecera} ` : ''}`, {})
        for (const d of data) {
            if (message != "") break;
            message = `El trabajador ${d.nombreTrab} con codigo ${d.codigoTrab} ya se encuentra registrado`
        }
        return message
    },
    listarDetalleTrabajadoresPorIdCabecera: async function (idCabecera,) {
        const data = await mssql.ejecutarQueryPreparado(`select *,es_guardian as esGuardian from alim_responsableNucleo_det where idCabecera=${idCabecera}`, {})
        return data
    },
    listarTrabajadoresSupergen: async function () {
        const data = await mssql.ejecutarQueryPreparado(`SELECT pe.emp_code as codigoTrab,CONCAT(pe.first_name,' ',pe.last_name)  as nombreTrab  FROM Biotime.dbo.personnel_employee pe
LEFT JOIN Biotime.dbo.iclock_transaction it ON pe.id = it.emp_id
WHERE pe.department_id = 6 GROUP BY pe.emp_code, pe.first_name, pe.last_name
`, {})
        return data
    },
    seleccionarTrabajadores: async function (listaDni = []) {
        let data = []
        const listaDniMap = listaDni.map(d => `'${d}'`)
        if (listaDniMap.length > 0) {
            data = await mssql.ejecutarQueryPreparado(`SELECT w.P010_CODIG as codigoTrab, w.DNI as dni, w.P010_NOMBR as nombreTrab,w.TIPO_PANILLA as tipoPlanilla FROM (SELECT P010_CODIG,P010_LIBEL DNI, P010_NOMBR,'OBREROS' TIPO_PANILLA 
            FROM RSPLACAR.DBO.PL0002PERS01 WHERE P010_SITUA='01' OR P010_FCESE>='01/09/2020' 
            UNION ALL
            SELECT P010_CODIG,P010_LIBEL DNI, P010_NOMBR,'EMPLEADOS' TIPO_PANILLA 
            FROM RSPLACAR_01.DBO.PL0002PERS01 WHERE P010_SITUA='01' OR P010_FCESE>='01/09/2020') w
            WHERE w.DNI in (${listaDniMap.join()})  ORDER BY codigoTrab DESC`, {})
            data = data.length > 0 ? [data[0]] : []
        }
        return data;
    },
    eliminarTrabajador: async function (id) {

        await mssql.ejecutarQueryPreparado(`delete from alim_responsableNucleo_det where id=${id}`, {})
    },
    listarTrabajadores: async function (id) {
        try {
            const fechaHoy = moment().format('DD/MM/YYYY')
            const fechaMañana = moment().add(1, "day").format("DD/MM/YYYY")
            let trabajadores = []
            const fechaActual = moment().format('DD/MM/YYYY')
            const responsable = await mssql.ejecutarQueryPreparado(`select id from alim_responsable where idUsuario=${id}`, {}, true)
            if (responsable) {
                console.log(`exec SP_ALIMENTO_DETALLENUCLEO ${responsable.id},'${fechaActual}'`)
                const data = await mssql.ejecutarQueryPreparado(`exec SP_ALIMENTO_DETALLENUCLEO ${responsable.id},'${fechaActual}'`, {})
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
    listarTrabajadoresPorUsuarioYFecha: async function ({ idUser, fecha }) {
        try {
            const fechaHoy = moment(fecha, 'YYYY-MM-DD').format('DD/MM/YYYY')
            const fechaMañana = moment(fecha, "YYYY-MM-DD").add(1, "day").format("DD/MM/YYYY")
            let trabajadores = []
            const fechaActual = moment().format('DD/MM/YYYY')
            /*             const responsable = await mssql.ejecutarQueryPreparado(`select id from alim_responsable where idUsuario=${idUser}`, {}, true)
             */
            const data = await mssql.ejecutarQueryPreparado(`exec SP_ALIMENTO_DETALLENUCLEO_EDITA ${idUser},'${fechaHoy}'`, {})
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
    borrarMarcacion: async function ({ fecha, codigoEmpleado }) {
        console.log(`exec SP_ALIMENTO_BORRA_MARCACION '${fecha}','${codigoEmpleado}'`)
        await mssql.ejecutarQueryPreparado(`exec SP_ALIMENTO_BORRA_MARCACION '${fecha}','${codigoEmpleado}'`, {})
    },
    borrarMarcacionCena: async function ({ fecha, codigoEmpleado }) {
        console.log(`exec SP_ALIMENTO_BORRA_MARCACION '${fecha}','${codigoEmpleado}'`)
        await mssql.ejecutarQueryPreparado(`exec SP_ALIMENTO_BORRA_MARCACION_CENA  '${fecha}','${codigoEmpleado}'`, {})
    },



    listarGuardianesPorFechaPortar: async function ({ id, fecha }) {
        try {
            const fechaHoyMoment = moment(fecha, "DD/MM/YYYY")
            const fechaMañana = fechaHoyMoment.clone().add(1, "day").format("DD/MM/YYYY")
            let trabajadores = []
            console.log(`exec SP_ALIMENTO_DETALLENUCLEO_guardian ${id},'${fecha}'`)
            const data = await mssql.ejecutarQueryPreparado(`exec SP_ALIMENTO_DETALLENUCLEO_guardian ${id},'${fecha}'`, {})
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
    listarGuardianesPorFecha: async function ({ id, fecha }) {
        try {
            const fechaHoyMoment = moment(fecha, "YYYY-MM-DD")
            const fechaHoy = fechaHoyMoment.format('DD/MM/YYYY')
            const fechaMañana = fechaHoyMoment.clone().add(1, "day").format("DD/MM/YYYY")
            let trabajadores = []
            const fechaActual = moment().format('DD/MM/YYYY')
            const responsable = await mssql.ejecutarQueryPreparado(`select id from alim_responsable where idUsuario=${id}`, {}, true)
            if (responsable) {
                console.log(`exec SP_ALIMENTO_DETALLENUCLEO_guardian ${responsable.id},'${fechaActual}'`)
                const data = await mssql.ejecutarQueryPreparado(`exec SP_ALIMENTO_DETALLENUCLEO_guardian ${responsable.id},'${fechaActual}'`, {})
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
    listarGuardianes: async function (id) {
        try {
            const fechaHoy = moment().format('DD/MM/YYYY')
            const fechaMañana = moment().add(1, "day").format("DD/MM/YYYY")
            let trabajadores = []
            const fechaActual = moment().format('DD/MM/YYYY')
            const responsable = await mssql.ejecutarQueryPreparado(`select id from alim_responsable where idUsuario=${id}`, {}, true)
            if (responsable) {
                console.log(`exec SP_ALIMENTO_DETALLENUCLEO_guardian ${responsable.id},'${fechaActual}'`)
                const data = await mssql.ejecutarQueryPreparado(`exec SP_ALIMENTO_DETALLENUCLEO_guardian ${responsable.id},'${fechaActual}'`, {})
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
    listarGuardianesPortal: async function (id) {
        try {
            const fechaHoy = moment().format('DD/MM/YYYY')
            const fechaMañana = moment().add(1, "day").format("DD/MM/YYYY")
            let trabajadores = []
            const fechaActual = moment().format('DD/MM/YYYY')
            const responsable = await mssql.ejecutarQueryPreparado(`select id from alim_responsable where idUsuario=${id}`, {}, true)
            if (responsable) {
                const data = await mssql.ejecutarQueryPreparado(`exec SP_ALIMENTO_DETALLENUCLEO_GUARDIAN_EDITA ${responsable.id},'${fechaActual}'`, {})
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
    listaTrabajadoresNucle: async function () {


    },
    confirmarMarcacion: async function (empleados = [], usuarioId) {
        const fechaHoy = moment().format('DD/MM/YYYY')
        const fechaMañana = moment().add(1, "day").format("DD/MM/YYYY")

        for (const empleado of empleados) {
            const punchTimeTransform = moment(empleado.punch_time.punch_time).utc().format('DD/MM/YYYY HH:mm:ss')
            console.log(`exec SP_ALIMENTO_INSERTAMARCACION '${fechaHoy}',${empleado.punch_time.emp_id},'${empleado.punch_time.emp_code}','${empleado.punch_time.first_name}','${empleado.punch_time.last_name}','${punchTimeTransform}',
            ${empleado.punch_time.terminal_id},${empleado.idObjeto},'${empleado.nombreObjeto}','${empleado.tipo}','${empleado.idCosto.toString().padStart(5, '0')}','${empleado.nombreCosto}',${usuarioId}`)
            await mssql.ejecutarQueryPreparado(`exec SP_ALIMENTO_INSERTAMARCACION '${fechaHoy}',${empleado.punch_time.emp_id},'${empleado.punch_time.emp_code}','${empleado.punch_time.first_name}','${empleado.punch_time.last_name}','${punchTimeTransform}',
            ${empleado.punch_time.terminal_id},${empleado.idObjeto},'${empleado.nombreObjeto}','${empleado.tipo}','${empleado.idCosto.toString().padStart(5, '0')}','${empleado.nombreCosto}',${usuarioId}`, {})
        }
    },
    confirmarMarcacionGuardian: async function ({ guardianes = [], fecha }, usuarioId) {
        const fechaProcess = moment(fecha, ["YYYY-MM-DD", "DD/MM/YYYY"]).format('DD/MM/YYYY')
        for (const empleado of guardianes) {
            const punchTimeTransform = moment(empleado.punch_time.punch_time).utc().format('DD/MM/YYYY HH:mm:ss')
            console.log(`exec SP_ALIMENTO_INSERTAMARCACION '${fechaProcess}',${empleado.punch_time.emp_id},'${empleado.punch_time.emp_code}','${empleado.punch_time.first_name}','${empleado.punch_time.last_name}','${punchTimeTransform}',
            ${empleado.punch_time.terminal_id},${empleado.idObjeto},'${empleado.nombreObjeto}','${empleado.tipo}','${empleado.idCosto.toString().padStart(5, '0')}','${empleado.nombreCosto}','S','N',0,${usuarioId}`)
            await mssql.ejecutarQueryPreparado(`exec SP_ALIMENTO_INSERTACENA_DESAYUNO_GUARDIAN '${fechaProcess}',${empleado.punch_time.emp_id},'${empleado.punch_time.emp_code}','${empleado.punch_time.first_name}','${empleado.punch_time.last_name}','${punchTimeTransform}',
            ${empleado.punch_time.terminal_id},${empleado.idObjeto},'${empleado.nombreObjeto}','${empleado.tipo}','${empleado.idCosto.toString().padStart(5, '0')}','${empleado.nombreCosto}','S','N',0,${usuarioId}`, {})
        }
    },
    confirmarMarcacionEmpleadosFecha: async function ({ trabajadores = [], fecha }, usuarioId) {
        const fechaHoy = moment(fecha, "YYYY-MM-DD").format('DD/MM/YYYY')
        for (const empleado of trabajadores) {
            const punchTimeTransform = moment(empleado.punch_time.punch_time).utc().format('DD/MM/YYYY HH:mm:ss')
            console.log(`exec SP_ALIMENTO_INSERTAMARCACION '${fechaHoy}',${empleado.punch_time.emp_id},'${empleado.punch_time.emp_code}','${empleado.punch_time.first_name}','${empleado.punch_time.last_name}','${punchTimeTransform}',
            ${empleado.punch_time.terminal_id},${empleado.idObjeto},'${empleado.nombreObjeto}','${empleado.tipo}','${empleado.idCosto.toString().padStart(5, '0')}','${empleado.nombreCosto}',${usuarioId}`)
            await mssql.ejecutarQueryPreparado(`exec SP_ALIMENTO_INSERTAMARCACION '${fechaHoy}',${empleado.punch_time.emp_id},'${empleado.punch_time.emp_code}','${empleado.punch_time.first_name}','${empleado.punch_time.last_name}','${punchTimeTransform}',
            ${empleado.punch_time.terminal_id},${empleado.idObjeto},'${empleado.nombreObjeto}','${empleado.tipo}','${empleado.idCosto.toString().padStart(5, '0')}','${empleado.nombreCosto}',${usuarioId}`, {})
        }
    }

}
module.exports = alimentacionResponsableNucleo;