var db = require('../dbconnection');
const excelUtil = require('../utils/excel');
const mysqlClass = require("../dbConnectionClass");
const ServerError = require('../error');
const moment = require('moment');
var programasvacunacion = {
    getAllProgramasVacunacion: async function () {
        let rows = await db.query("SELECT * FROM programasvacunacion");
        return rows;
    },
    getProgramasVacunacionByid: async function (id) {
        let cabecera = await db.query("SELECT * FROM programasvacunacion WHERE idProgramaVacunacion= ?", [id]);
        let detalle = await db.query(`SELECT idProgramaVacunacion, GROUP_CONCAT(idDetalleProgramaVacunacion) as ids, GROUP_CONCAT(Enfermedad SEPARATOR ' + ') as Enfermedades, 
        pd.Semana, pd.Dia, pd.FechaAplicacion, pd.idVacuna, pd.Vacuna, pd.idLaboratorio, pd.Laboratorio, 
        pd.ViaAplicacion, pd.Dosis, pd.idDistribuidor, pd.Distribuidor, pd.FechaRegistro, us.Nombre
        FROM programasvacunacion_det pd
        INNER JOIN usuario us ON us.idUsuario = pd.idUsuario
        WHERE pd.idProgramaVacunacion = ? 
        GROUP BY pd.FechaAplicacion, pd.idVacuna, pd.Vacuna, pd.ViaAplicacion, pd.Dosis, pd.Semana, 
        pd.Dia, pd.idLaboratorio, pd.Laboratorio, pd.idDistribuidor, pd.Distribuidor, pd.FechaRegistro, us.Nombre, idProgramaVacunacion
        ORDER BY pd.Dia`, [id]);
        return {
            cabecera,
            detalle
        };
    },
    addProgramaVacunacion: async function (Inv) {
        let rows = await db.query("SELECT SUM(NumHembras) as NumHembras FROM lotes WHERE idLevante = ? GROUP BY idLevante", [Inv.IdLevante])
        let NroAves = rows[0].NumHembras;
        return await db.query("INSERT INTO programasvacunacion ( Nombre, Descripcion, IdLevante, NombreLote, NroAves, FechaCreacion, idUser) VALUES (?,?,?,?,?,?,?)",
            [Inv.Nombre, Inv.Descripcion, Inv.IdLevante, Inv.NombreLote, NroAves, new Date(Inv.FechaCreacion), Inv.idUser])
    },
    importarData: async function (excelRuta, idProgramacionVacunacion, idUsuario) {
        let errors = []
        let dataProcess = []
        const fechaRegistro = moment().format("YYYY-MM-DD")
        const inicioFilaData = 2
        const celdasConValidaciones = [
            { column: "A", validate: true, message: "Dia", fn: function (valor) { return valor != null && !valor != undefined; }, field: "dia" },
            {
                column: "B", validate: true, message: "Fecha de aplicacion requerido", fn: function (valor) { return valor != null && !valor != undefined; }, message: "", field: "fechaAplicacion",
            },
            {
                column: "C", validate: true, message: "Via aplicacion requerido", fn: function (valor) { return valor != null && !valor != undefined; }, message: "", field: "viaAplicacion"
            },
            { column: "D", validate: true, field: "dosis", message: "La dosis es requerida", fn: function (valor) { return valor != null && !valor != undefined; } },
            { column: "E", validate: true, message: "vacuna abreviacion requerido", fn: function (valor) { return valor != null && !valor != undefined; }, field: "vacunaAbreviacion" },
            { column: "F", validate: true, message: "Enfermedad abreviacion requerido", fn: function (valor) { return valor != null && !valor != undefined; }, field: "enfermedadAbreviacion" },
            { column: "G", validate: true, message: "Laboratorio requerido", fn: function (valor) { return valor != null && !valor != undefined; }, field: "laboratorio" },
            { column: "H", validate: true, message: "Distribucion requerido", fn: function (valor) { return valor != null && !valor != undefined; }, field: "distribuidor" },
        ];
        const data = await excelUtil.transformExcelAJson(excelRuta, celdasConValidaciones, inicioFilaData, "Hoja1")
        const vacunas = data.map(d => `'${d.vacunaAbreviacion.trim()}'`)
        const enfermedades = data.map(d => `'${d.enfermedadAbreviacion.trim()}'`)
        const laboratorios = data.map(d => `'${d.laboratorio.trim()}'`)
        const distribuidores = data.map(d => `'${d.distribuidor.trim()}'`)
        const vacunasBd = await mysqlClass.ejecutarQueryPreparado(`select idVacuna,Abreviacion,Nombre from vacunas where Abreviacion in(${vacunas.join()})`, {})
        const enfermedadesBd = await mysqlClass.ejecutarQueryPreparado(`select idEnfermedad,Abreviacion,Nombre from enfermedades where Abreviacion in(${enfermedades.join()})`, {})
        const laboratoriosBd = await mysqlClass.ejecutarQueryPreparado(`select idLaboratorio,laboratorio from laboratorios where laboratorio in(${laboratorios.join()})`, {})
        const distribuidoresBd = await mysqlClass.ejecutarQueryPreparado(`select idEmpresa,Empresa from empresas_distribuidoras where Empresa in(${distribuidores.join()})`, {})

        for (let i = 0; i < data.length; i++) {
            const d = data[i]
            const vacuna = vacunasBd.find(v => v.Abreviacion == d.vacunaAbreviacion)
            const enfermedad = enfermedadesBd.find(e => e.Abreviacion == d.enfermedadAbreviacion)
            const laboratorio = laboratoriosBd.find(l => l.laboratorio == d.laboratorio)
            const distribuidor = distribuidoresBd.find(di => di.Empresa == d.distribuidor)
            if (!vacuna) { throw new ServerError(`La vacuna  ${d.vacunaAbreviacion} no existe para la fila ${i + inicioFilaData}`) }
            if (!enfermedad) { throw new ServerError(`La enfermedad  ${d.enfermedadAbreviacion} no existe para la fila ${i + inicioFilaData}`) }
            if (!laboratorio) { throw new ServerError(`El laboratorio  ${d.laboratorio} no existe para la fila ${i + inicioFilaData}`) }
            if (!distribuidor) { throw new ServerError(`El distribuidor  ${d.distribuidor} no existe para la fila ${i + inicioFilaData}`) }
            dataProcess.push({ ...d, vacuna, enfermedad, laboratorio, distribuidor, semana: Math.ceil(d.dia / 7), fechaAplicacion: moment(d.fechaAplicacion, 'DD/MM/YYYY').format("YYYY-MM-DD") })
        }

        await mysqlClass.insertar("programasvacunacion_det", dataProcess.map(d => ({
            idProgramaVacunacion: idProgramacionVacunacion, Semana: d.semana, Dia: d.dia, FechaAplicacion: d.fechaAplicacion, idEnfermedad: d.enfermedad.idEnfermedad,
            Enfermedad: d.enfermedad.Nombre, idVacuna: d.vacuna.idVacuna, Vacuna: d.vacuna.Nombre, idLaboratorio: d.laboratorio.idLaboratorio, Laboratorio: d.laboratorio.laboratorio,
            ViaAplicacion: d.viaAplicacion, Dosis: d.dosis, idDistribuidor: d.distribuidor.idEmpresa, Distribuidor: d.distribuidor.Empresa, FechaRegistro: fechaRegistro,
            idUsuario

        })))



    },
    eliminarProgamacionDetalle: async function (ids = []) {
        await mysqlClass.ejecutarQueryPreparado(`delete from programasvacunacion_det where idDetalleProgramaVacunacion in(${ids.join()})`, {})

    },
    addDetalleProgramaVacunacion: async function (Programa) {
        let arrayErrors = [];
        for (let i = 0; i < Programa.Enfermedad.length; i++) {
            const e = Programa.Enfermedad[i];
            let sel = await db.query("SELECT * FROM programasvacunacion_det WHERE idProgramaVacunacion = ? and Dia = ? and idEnfermedad = ?",
                [Programa.idProgramaVacunacion, Programa.Dia, e.idEnfermedad])
            if (sel.length == 0) {
                await db.query(`INSERT INTO programasvacunacion_det(
                    idProgramaVacunacion, Semana, Dia, FechaAplicacion, idEnfermedad, Enfermedad, idVacuna, Vacuna,
                    idLaboratorio, Laboratorio, ViaAplicacion, Dosis, idDistribuidor, Distribuidor, FechaRegistro, 
                    idUsuario) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    [Programa.idProgramaVacunacion, Programa.Semana, Programa.Dia, new Date(Programa.FechaAplicacion),
                    e.idEnfermedad, e.Nombre, Programa.Vacuna.idVacuna, Programa.Vacuna.Nombre,
                    Programa.Laboratorio.idLaboratorio, Programa.Laboratorio.laboratorio, Programa.ViaAplicacion,
                    Programa.Dosis, Programa.Distribuidor.idEmpresa, Programa.Distribuidor.Empresa,
                    new Date(Programa.FechaRegistro), Programa.idUser])
            } else {
                arrayErrors.push("La Enfermedad " + e.Nombre + "ya tiene un registro para el dia seleccionado.");
            }
        }
        return {
            success: true,
            message: 'Se ha registrado correctamente.',
            errores: arrayErrors
        }
    },
    updateProgramasVacunacion: async function (Inv, id) {
        let rows = await db.query("UPDATE programasvacunacion set Nombre = ?, Descripcion = ? WHERE idProgramaVacunacion = ?",
            [Inv.Nombre, Inv.Descripcion, id]);
        return rows;
    },
    updateDetalleProgramaVacunacion: async function (Programa, id) {
        let array = id.split(',');
        for (let i = 0; i < array.length; i++) {
            const e = array[i];
            await db.query("DELETE FROM programasvacunacion_det WHERE idDetalleProgramaVacunacion = ?", [e])
        }
        let arrayErrors = [];
        for (let i = 0; i < Programa.Enfermedad.length; i++) {
            const e = Programa.Enfermedad[i];
            let sel = await db.query("SELECT * FROM programasvacunacion_det WHERE idProgramaVacunacion = ? and Dia = ? and idEnfermedad = ?",
                [Programa.idProgramaVacunacion, Programa.Dia, e.idEnfermedad])
            if (sel.length == 0) {
                await db.query(`INSERT INTO programasvacunacion_det (
                    idProgramaVacunacion, Semana, Dia, FechaAplicacion, idEnfermedad, Enfermedad, idVacuna, Vacuna,
                    idLaboratorio, Laboratorio, ViaAplicacion, Dosis, idDistribuidor, Distribuidor, FechaRegistro, 
                    idUsuario) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    [Programa.idProgramaVacunacion, Programa.Semana, Programa.Dia,
                    new Date(Programa.FechaAplicacion), e.idEnfermedad, e.Nombre, Programa.Vacuna.idVacuna,
                    Programa.Vacuna.Nombre, Programa.Laboratorio.idLaboratorio, Programa.Laboratorio.laboratorio,
                    Programa.ViaAplicacion, Programa.Dosis, Programa.Distribuidor.idEmpresa,
                    Programa.Distribuidor.Empresa, new Date(Programa.FechaRegistro), Programa.idUsuario])
            } else {
                arrayErrors.push("La Enfermedad " + e.Nombre + "ya tiene un registro para el dia seleccionado.");
            }
        }
        return {
            success: true,
            message: 'Se ha actualizado correctamente.',
            errores: arrayErrors
        }
    },
    deleteProgramasVacunacion: async function (id) {
        return await db.query("DELETE FROM programasvacunacion WHERE idProgramaVacunacion = ?", [id]);
    },

    deleteProgramasVacunacionDet: async function (id) {
        let array = id.split(',');
        for (let i = 0; i < array.length; i++) {
            const e = array[i];
            let rows = await db.query("DELETE FROM programasvacunacion_det WHERE idDetalleProgramaVacunacion = ?", [e]);
        }
        return {
            success: true,
            message: 'Se eliminó correctamente.'
        }
    }
}
module.exports = programasvacunacion;