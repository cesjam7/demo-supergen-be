const moment = require("moment")
const mysqlConnection = require("../dbConnectionClass")
const sendEmailModelo = require("./sendEmail")
const usuario = require("./usuario")
const listaEstadosDescripcion = { "1": { descripcion: "Aprobado", solicitar: false }, "3": { descripcion: "Rechazado", solicitar: false }, '0': { solicitar: false, descripcion: "Pendiente" } }
const granjaSolicitudAperturaModelo = {
    consultar: async function ({ tipo, lote, semana }) {

        let dataReturn = { solicitar: false, descripcion: "Pendiente" }
        const dataSolicitudBd = await this.traerPorTipoLoteYSemana({ tipo, lote, semana })
        console.log("d", dataSolicitudBd)
        dataReturn = dataSolicitudBd ? listaEstadosDescripcion[dataSolicitudBd.idEstado.toString()] : { solicitar: false, descripcion: "Pendiente" }
        if (!dataSolicitudBd) {
            let query = `select idProduccion as id,Semana,Estado from mortalidad_prod_sem where idProduccion=${lote.id} and Semana=${semana} `
            if (tipo == "L") {
                query = `select idLevante as id,semana,Estado from mortalidadsem where idLevante=${lote.id} and Semana=${semana} `
            }
            const data = await mysqlConnection.ejecutarQueryPreparado(query, {})
            const solicitar = data.every(d => d.Estado == 0)
            dataReturn.solicitar = solicitar
            dataReturn.descripcion = solicitar ? 'Cerrado' : 'Abierto'
            if (data.length == 0) {
                dataReturn.solicitar = false
                dataReturn.descripcion = "No existe la semana con el lote"
            }
        }

        return dataReturn

    },
    solicitar: async function ({ tipo, lote, semana }, idUsuarioPeticion) {
        const dataSolicitudBd = await this.traerPorTipoLoteYSemana({ tipo, lote, semana })
        if (dataSolicitudBd) {
            throw new Error(`Ya existe una solicitud del lote ${lote.Nombre} con la semana ${semana}`)
        }
        const usuarioSolicitud = await usuario.getusuarioByIdPromise(idUsuarioPeticion)
        const tipoExtendido = tipo == "L" ? "LEVANTE" : "PRODUCCION"
        const fechaSolicitud = moment().format("YYYY-MM-DD HH:mm:ss")
        const usuariosAprobacion = await mysqlConnection.ejecutarQueryPreparado(`select email from solicitud_destinatarios where aprobacionSolicitud=1`, {})
        await mysqlConnection.insertar("solicitud_apertura", [{ tipo, idObjeto: lote.id, semana, idUsuarioSolicitud: idUsuarioPeticion, fechaSolicitud }])
        await sendEmailModelo.sendEmail(`Solicitud de aprobacion ${tipoExtendido} lote ${lote.Nombre}`, usuariosAprobacion.map(u => u.email), `<p>Solicitud aprobación de apertura de semana ${semana} de lote ${tipoExtendido} ${lote.Nombre}</p>
        <p>Se solicita su aprobacion para apertura de semana <a href='http://portal.supergen.net/supergen-fe/#!/granja/aprobacion-apertura'>Ver</a></p>
        <p>Atte.</p>
        <p>${usuarioSolicitud[0].Nombre}</p>`)
    },
    traerPorTipoLoteYSemana: async function ({ tipo, lote, semana, estado }) {
        const dataSolicitudBd = await mysqlConnection.ejecutarQueryPreparado(`select s.id,s.idEstado from solicitud_apertura s left join produccion p on p.idProduccion=s.idObjeto left join levantes l on l.idLevante=s.idObjeto where tipo='${tipo}' and s.idObjeto=${lote.id} and semana=${semana} ${estado ? `and idEstado=${estado}` : ''}`, {}, true)
        return dataSolicitudBd
    },
    aprobar: async function (id, idUsuarioAprobacion) {
        const granjaSolicitudApertura = await mysqlConnection.ejecutarQueryPreparado(`select s.*,case tipo WHEN 'L' then l.Nombre WHEN 'P' then p.Nombre  else null end as loteNombre from solicitud_apertura s left join produccion p on p.idProduccion=s.idObjeto left join levantes l on l.idLevante=s.idObjeto where s.id=${id}`, {}, true)
        const tipoExtendido = granjaSolicitudApertura.tipo == "L" ? "LEVANTE" : "PRODUCCION"
        let queryUpdateMortalidad = `update mortalidadsem set Estado=1 where idLevante=${granjaSolicitudApertura.idObjeto} and Semana=${granjaSolicitudApertura.semana}`
        let queryAnioMes = `select min(fecha) fecha from mortalidad_det where idLevante=${granjaSolicitudApertura.idObjeto} and Semana=${granjaSolicitudApertura.semana}`
        if (granjaSolicitudApertura.tipo == "P") {
            queryUpdateMortalidad = `update  mortalidad_prod_sem set Estado=1 where idProduccion=${granjaSolicitudApertura.idObjeto} and Semana=${granjaSolicitudApertura.semana}`
            queryAnioMes = `select min(fecha)  fecha from mortalidad_prod_det where idProduccion=${granjaSolicitudApertura.idObjeto} and Semana=${granjaSolicitudApertura.semana}`
        }
        const anioMesPeriodo = await mysqlConnection.ejecutarQueryPreparado(queryAnioMes, {}, true)
        await mysqlConnection.ejecutarQueryPreparado(queryUpdateMortalidad, {})
        if (anioMesPeriodo) {
            const periodo = moment(anioMesPeriodo.fecha).format("YYYYMM")
            await mysqlConnection.ejecutarQueryPreparado(`update periodo set Estado=1 where YearMonth='${periodo}'`, {})
        }
        const [usuarioSolicitud] = await usuario.getusuarioByIdPromise(granjaSolicitudApertura.idUsuarioSolicitud)
        await mysqlConnection.actualizar("solicitud_apertura", { idEstado: 1, idUsuarioAprobacion, fechaAprobacion: moment().format("YYYY-MM-DD HH:mm:ss") }, { id })
        await sendEmailModelo.sendEmail(`Aprobacion solicitud de apertura lote ${granjaSolicitudApertura.loteNombre} semana ${granjaSolicitudApertura.semana}`, [usuarioSolicitud.email], `<p>Semana ${granjaSolicitudApertura.semana} de lote ${tipoExtendido} ${granjaSolicitudApertura.loteNombre}</p>
        <p>Se aprobó la apertura de la semana</p>`)
    },
    listarPendientes: async function () {
        const data = await mysqlConnection.ejecutarQueryPreparado(`select s.*,case tipo WHEN 'L' then l.Nombre WHEN 'P' then p.Nombre  else null end as loteNombre,u.Nombre as nombreUsuario from solicitud_apertura s left join produccion p on p.idProduccion=s.idObjeto left join levantes l on l.idLevante=s.idObjeto join usuario u on u.idUsuario=s.idUsuarioSolicitud where s.idEstado=0`, {})
        return data.map(d => ({ ...d, usuario: { id: d.idUsuarioSolicitud, nombre: d.nombreUsuario }, lote: { id: d.idObjeto, nombre: d.loteNombre } }));
    },
    rechazar: async function (id) {
        const granjaSolicitudApertura = await mysqlConnection.ejecutarQueryPreparado(`select s.*,case tipo WHEN 'L' then l.Nombre WHEN 'P' then p.Nombre  else null end as loteNombre from solicitud_apertura s left join produccion p on p.idProduccion=s.idObjeto left join levantes l on l.idLevante=s.idObjeto where s.id=${id}`, {}, true)
        const tipoExtendido = granjaSolicitudApertura.tipo == "L" ? "LEVANTE" : "PRODUCCION"
        const [usuarioSolicitud] = await usuario.getusuarioByIdPromise(granjaSolicitudApertura.idUsuarioSolicitud)
        await mysqlConnection.actualizar("solicitud_apertura", { idEstado: 3 }, { id })
        await sendEmailModelo.sendEmail(`Rechazo de apertura lote ${granjaSolicitudApertura.loteNombre} semana ${granjaSolicitudApertura.semana}`, [usuarioSolicitud.email], `<p>Semana ${granjaSolicitudApertura.semana} de lote ${tipoExtendido} ${granjaSolicitudApertura.loteNombre}</p>
        <p>Se rechazó la apertura de la semana</p>`)
    }
}

module.exports = granjaSolicitudAperturaModelo