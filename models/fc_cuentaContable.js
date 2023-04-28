const moment = require("moment")
const ServerError = require("../error")

const mssqlConcar = require("./../dbConnectionMSSQLClass")()
const fc_cuentaContable = {
    guardar: async function (objeto, usuarioRegistro) {
        try {
            let idCuenta = null
            let descripcionCuenta = null
            if (objeto.cuenta && objeto.cuenta.id) {
                idCuenta = objeto.cuenta.id
                descripcionCuenta = objeto.cuenta.descripcion
            }
            const data = await mssqlConcar.ejecutarQueryPreparado(`select id from fc_cuentaFlujo where idTipoServicio=${objeto.tipoServicio.id}`, {})

            if (data.length > 0) {
                throw new Error("Ya existe el tipo de servicio registrado")
            }
            const query = await mssqlConcar.queryInsertarEnLotes("fc_cuentaFlujo", [{
                idTipoServicio: objeto.tipoServicio.id,
                idFamilia: objeto.familia.id,
                idSubFamilia: objeto.subFamilia.id,
                idCuenta,
                descripcionCuenta,
                fechaRegistro: moment().format("YYYY-MM-DD"),
                idUsuario: usuarioRegistro,
                idTipoFlujo: objeto.tipoFlujo.id
            }])
            console.log("query", query)
            await mssqlConcar.ejecutarQueryPreparado(query, {})
        } catch (error) {
            console.log("error", error)
            throw new ServerError(error)
        }

    },
    editar: async function (objeto) {
        try {
            let idCuenta = null
            let descripcionCuenta = null
            if (objeto.cuenta && objeto.cuenta.id) {
                idCuenta = objeto.cuenta.id
                descripcionCuenta = objeto.cuenta.descripcion
            }
            const data = await mssqlConcar.ejecutarQueryPreparado(`select id from fc_cuentaFlujo where idTipoServicio=${objeto.tipoServicio.id} and idFamilia=${objeto.tipoServicio.id} and id!=${objeto.id} and  idSubFamilia=${objeto.subFamilia.id} ${idCuenta ? `and idCuenta=${idCuenta}` : ''}`, {})

            if (data.length > 0) {
                throw new Error("Ya existe un flujo con esos datos")
            }
            await mssqlConcar.actualizar("fc_cuentaFlujo", {
                idTipoServicio: objeto.tipoServicio.id,
                idFamilia: objeto.familia.id,
                idSubFamilia: objeto.subFamilia.id,
                idCuenta,
                descripcionCuenta,
            }, { id: objeto.id })
        } catch (error) {
            throw new Error(error)
        }
    },
    listarPorTipoServicio: async function (tipoServicioId) {
        const valuesNull = {
            familia: { id: null },
            subFamilia: { id: null },
            tipoServicio: { id: null },
            cuenta: { id: null },
            tipoFlujo: { id: null }
        }
        let valuesProcess = valuesNull
        const flujoCuentaContable = await mssqlConcar.ejecutarQueryPreparado(`select tflujo.descripcion as tipoFlujoDescripcion,fcCuentaFlujo.*,fcFamilia.descripcion as descripcionFamilia,fcTipoServicio.descripcion as descripcionTipoServicio,fcSubFamilia.descripcion as descripcionSubFamilia from fc_cuentaFlujo fcCuentaFlujo join fc_familia fcFamilia on fcFamilia.id=fcCuentaFlujo.idFamilia
        join fc_tipoServicio fcTipoServicio on fcTipoServicio.id=fcCuentaFlujo.idTipoServicio join fc_subFamilia fcSubFamilia on fcSubFamilia.id=fcCuentaFlujo.idSubFamilia join fc_tipoFlujo tflujo on tflujo.id=fcCuentaFlujo.idTipoFlujo where idTipoServicio=${tipoServicioId}
        `, {}, true)
        if (flujoCuentaContable) {
            valuesProcess = {
                familia: { id: flujoCuentaContable.idFamilia, descripcion: flujoCuentaContable.descripcionFamilia },
                subFamilia: { id: flujoCuentaContable.idSubFamilia, descripcion: flujoCuentaContable.descripcionSubFamilia },
                tipoServicio: { id: flujoCuentaContable.idTipoServicio, descripcion: flujoCuentaContable.descripcionTipoServicio },
                cuenta: { id: flujoCuentaContable.idCuenta, descripcion: flujoCuentaContable.descripcionCuenta },
                tipoFlujo: { id: flujoCuentaContable.idTipoFlujo, descripcion: flujoCuentaContable.tipoFlujoDescripcion }
            }
        }
        return valuesProcess

    },
    listarCuentas: async function () {
        const dataCuentas = await mssqlConcar.ejecutarQueryPreparado(`EXEC SP_LEECUENTACONTABLE`, {})
        return dataCuentas
    },
    listar: async function () {
        try {
            const lista = await mssqlConcar.ejecutarQueryPreparado(`select tflujo.descripcion as tipoFlujoDescripcion,fcCuentaFlujo.*,fcFamilia.descripcion as descripcionFamilia,fcTipoServicio.descripcion as descripcionTipoServicio,fcSubFamilia.descripcion as descripcionSubFamilia from fc_cuentaFlujo fcCuentaFlujo join fc_familia fcFamilia on fcFamilia.id=fcCuentaFlujo.idFamilia
            join fc_tipoServicio fcTipoServicio on fcTipoServicio.id=fcCuentaFlujo.idTipoServicio join fc_subFamilia fcSubFamilia on fcSubFamilia.id=fcCuentaFlujo.idSubFamilia join fc_tipoFlujo tflujo on tflujo.id=fcCuentaFlujo.idTipoFlujo
            `, {})
            return lista.map(l => ({
                ...l, familia: { id: l.idFamilia, descripcion: l.descripcionFamilia },
                subFamilia: { id: l.idSubFamilia, descripcion: l.descripcionSubFamilia },
                tipoServicio: { id: l.idTipoServicio, descripcion: l.descripcionTipoServicio },
                cuenta: { id: l.idCuenta, descripcion: l.descripcionCuenta },
                tipoFlujo: { id: l.idTipoFlujo, descripcion: l.tipoFlujoDescripcion }
            }))
        } catch (error) {
            throw new Error(error)
        }
    },

}

module.exports = fc_cuentaContable
