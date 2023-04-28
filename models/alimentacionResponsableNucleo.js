const moment = require("moment");
const ServerError = require("../error");

const mssql = require("../dbConnectionMSSQLClass")()
const mysql = require("../dbConnectionClass")
const alimentacionResponsableNucleo = {
    guardar: async function ({ granja, responsable, tipo, objeto, isLevante, costo }, usuarioId) {
        let propiedadObjeto = "idLevante"
        if (!isLevante) {
            propiedadObjeto = "idProduccion"
        }
        const dataResponsable = await mssql.ejecutarQueryPreparado(`select id from alim_responsableNucleo where idGranja=${granja.id}`, {}, true)
        if (dataResponsable) {
            throw new ServerError(`Ya existe la granja ${granja.granja} registrado`,500)
        }
        await mssql.insertar("alim_responsableNucleo", [{ idGranja: granja.id, granja: granja.granja, tipo, idResponsable: responsable.id, idCosto: costo.id, nombreCosto: costo.nombre, idObjeto: objeto[propiedadObjeto], nombreObjeto: objeto.Nombre, fechaRegistro: moment().format("YYYY-MM-DD") }])
    },
    listar: async function () {
        const data = await mssql.ejecutarQueryPreparado(`select responsableNucleo.*,r.nombres as nombreResponsable,r.idUsuario from alim_responsableNucleo responsableNucleo join alim_responsable r on r.id=responsableNucleo.idResponsable`, {})
        return data.map(d => ({ ...d, granja: { id: d.idGranja, granja: d.granja }, responsable: { id: d.idResponsable, nombres: d.nombreResponsable,idUsuario:d.idUsuario }, objeto: { id: d.idObjeto, Nombre: d.nombreObjeto }, costo: { id: d.idCosto, nombre: d.nombreCosto } }))
    },
    editar: async function ({ granja, responsable, id, costo, tipo, objeto, isLevante }) {
        let propiedadObjeto = "idLevante"
        if (!isLevante) {
            propiedadObjeto = "idProduccion"
        }
        const dataResponsable = await mssql.ejecutarQueryPreparado(`select id from alim_responsableNucleo where idGranja=${granja.id}  and id<> ${id}`, {}, true)
        if (dataResponsable) {
            throw new ServerError(`Ya existe la granja ${granja.granja} registrado`,500)
        }
        const idObjeto = objeto[propiedadObjeto] ? objeto[propiedadObjeto] : objeto.id
        await mssql.actualizar("alim_responsableNucleo", { idGranja: granja.id, granja: granja.granja, tipo, idCosto: costo.id, nombreCosto: costo.nombre, idObjeto, nombreObjeto: objeto.Nombre, idResponsable: responsable.id, fechaModificacion: moment().format("YYYY-MM-DD") }, { id })
    },
    listarGranjas: async function () {

        const data = await mysql.ejecutarQueryPreparado(`select *,Granja as granja,idGranja as id from granjas where Estado=1`, {})
        return data
    }

}
module.exports = alimentacionResponsableNucleo;