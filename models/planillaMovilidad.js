

const db = require('../dbconnection');
const { poolPromise } = require('../dbconnectionMSSQL');
const sendEmail = require('./sendEmail');
const usuario = require('./usuario');
const moment = require("moment");
const contabCpeModel = require('./contab_cpe');
const { resolve } = require('path');
const mysql = require("../dbconnectionPromise")
var fs = require('fs');
var Excel = require('exceljs');
const DBCostsSG = require('./DBCostsSG');
var workbook = new Excel.Workbook();
const estadosPlanillaMovilidad = [
    { estado: 0, name: "Creado" },
    { estado: 1, name: "Enviado a Aprobar" },
    { estado: 2, name: "Aprobado por jefe" },
    { estado: 3, name: "Aprobado pro Gerancia" },
    { estado: 4, name: "Transferido" },
    { estado: 5, name: "Rechazado" },
    { estado: 6, name: "Cerrado" },
]

const planillaMovilidadModelo = {

    guardar: async function ({ detalles = [], ...planillaMovilidad }, usuarioRegistro) {
        const connection = await mysql.connection();
        try {
            const upp = await this.traerUppPorNombre(planillaMovilidad.upp)
            const result = await connection.query("insert into pla_requerimiento(correlativo,numero,anio,fecha,dni,fechaRegistro,usuarioRegistro,uppId,responsableId) values (?,?,?,?,?,?,?,?,?)", [planillaMovilidad.correlativo, planillaMovilidad.numero, moment().format("YYYY"), moment(planillaMovilidad.fecha).format("YYYY-MM-DD"), planillaMovilidad.dni, new Date(), usuarioRegistro,
            upp.id, planillaMovilidad.responsable.id]);
            await this.guardarDetalle(detalles, result.insertId)
        } catch (error) {
            console.error("Error", error)
            throw error;
        } finally {
            connection.release();
        }
    },
    checkCaja: async function (planillaRequerimiento) {
        const connection = await mysql.connection();
        try {
            connection.query(`update pla_requerimiento set seleccionCajachica=0 where id=${planillaRequerimiento};update pla_requerimientodetalle set estado=1  where planillaRequerimientoId=${planillaRequerimiento} `)
        } catch (error) {
            console.error("Error", error)
            throw error;
        } finally {
            connection.release();
        }
    },

    editar: async function ({ detalles = [], ...planillaMovilidad }) {
        const connection = await mysql.connection();
        try {
            await connection.query("update  pla_requerimiento set fecha=?,dni=?,responsableId=? where id=?", [moment(planillaMovilidad.fecha).format("YYYY-MM-DD"), planillaMovilidad.dni, planillaMovilidad.responsable.id, planillaMovilidad.id]);
            await db.query("delete from pla_requerimientodetalle where planillaRequerimientoId=?", [planillaMovilidad.id])
            await this.guardarDetalle(detalles, planillaMovilidad.id)
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    },
    traerUppPorNombre: async function (uppName) {
        const connection = await mysql.connection();
        try {
            const cajaUpp = await connection.query("select * from caj_upp where nombre=?", [uppName]);
            if (cajaUpp.length == 0) {
                throw new Error(`La unidad productiva ${uppName} no existe`)
            }
            return cajaUpp[0]
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }


    },
    guardarDetalle: async function (detalles = [], planillaMovilidadId) {
        const connection = await mysql.connection();
        try {

            const detalleValores = detalles.map(d => [d.motivo, d.fechaMovilidad, d.tipo, d.origen, d.destino, d.importe, planillaMovilidadId])
            await connection.query("insert into pla_requerimientodetalle(motivo,fechaMovilidad,tipo,origen,destino,importe,planillaRequerimientoId) values ?", [detalleValores]);
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    },
    enviarAAprobar: async function (planillaMovilidadId) {
        try {
            const planilla = await this.buscarPorId(planillaMovilidadId)
            const correos = await contabCpeModel.listarCorreosPorUppYPropiedad(planilla.upp.id, ["aprobacionPlanilla"])
            console.log("correos", correos)
            const html = `<p>Se ha generado la Planilla de movilidad para ser aprobado</p>
            <p>Fecha:${moment().format("YYYY-MM-DD")}</p>
            <p>Usuario:${planilla.responsable.nombre}</p>
            <a href='http://portal.supergen.net/supergen-fe/#!/planilla-movilidad-logistica'>Ver</a>`
            await this.actualizacionGenericaPlanillaMovilidad({ estado: "Enviado a  aprobar" }, planillaMovilidadId)
            if (correos.length > 0) {
                await sendEmail.sendEmail(`Planilla N° ${planilla.correlativo} ${planilla.upp.nombre} para Aprobar`, correos, html)
            }

        } catch (error) {
            console.error(error)
            throw error;
        }
    },
    enviarARevisar: async function (planillaMovilidadId) {

        try {
            const planilla = await this.buscarPorId(planillaMovilidadId)
            console.log(planilla)
            const correos = await contabCpeModel.listarCorreosPorUppYPropiedad(planilla.upp.id, ["preRevisionPlanilla"])
            console.log("correos", correos)
            const html = `<p>Se ha generado la Planilla ${planilla.correlativo} para ser Revisado</p>
            <p>Fecha:${moment().format("YYYY-MM-DD")}</p>
            <p>Usuario:${planilla.responsable.nombre}</p>
            `
            await this.actualizacionGenericaPlanillaMovilidad({ estado: "Enviado a revisar" }, planillaMovilidadId)
            if (correos.length > 0) {
                await sendEmail.sendEmail(`Planilla N° ${planilla.correlativo} ${planilla.upp.nombre} para Revisar`, correos, html)
            }

        } catch (error) {
            console.error(error)
            throw error;
        }

    },
    rechazarGerencia: async function ({ descripcionErrorGerencia, id }) {
        await this.actualizacionGenericaPlanillaMovilidad({ descripcionErrorGerencia, estado: "Rechazado por gerencia" }, id)

    },
    liquidar: async function (planillaMovilidadId) {
        const connection = await mysql.connection();
        try {

            await connection.query("update pla_requerimiento set estado='Liquidado' where id=?", [planillaMovilidadId]);
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }


    },
    actualizarDetallePlanilla: async function (detalles = []) {
        const connection = await mysql.connection();
        try {

            const query = this.queryActualizacionPlanillaMovilidadDetalleBatch(detalles.map(d => ({ estado: d.estado ? 1 : 0, id: d.id })))
            await connection.query(query);
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }

    },

    buscarPorId: async function (planillaMovilidadId) {
        const connection = await mysql.connection();
        try {
            const planillas = await connection.query("select pla.*,DATE_FORMAT(pla.fechaRegistro,'%Y-%m-%d') fechaRegistro,ca.nombre as nombreUpp,uR.idUsuario idUsuarioRegistro,uR.Nombre nombreUsuarioRegistro,uRevision.*,caj.nombre as  responsableNombre,caj.firmaUrl as firmaResponsable from pla_requerimiento pla inner join caj_upp ca on ca.id=pla.uppId left join usuario uR on uR.idUsuario=pla.usuarioRegistro left join usuario uRevision on uRevision.idUsuario=pla.usuarioRevision left join caj_responsable caj on caj.id=pla.responsableId where pla.id=? ", [planillaMovilidadId]);


            if (planillas.length == 0) {
                throw new Error("La planilla con el id " + planillaMovilidadId + " No existe")
            }
            const planillasMap = planillas.map(c => ({
                ...c, upp: { id: c.uppId, nombre: c.nombreUpp },
                usuarioRegistro: { id: c.idUsuarioRegistro, nombre: c.nombreUsuarioRegistro },
                usuarioRevision: { id: c.idUsuario, nombre: c.Nombre },
                responsable: { id: c.responsableId, nombre: c.responsableNombre, firmaUrl: c.firmaResponsable }
            }))

            return planillasMap[0];
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }



    },

    listarPlanillaPorEstadosYFechas: async function ({ fechaInicio, fechaFin, estados = [] }) {
        const connection = await mysql.connection();
        try {
            const planillas = await connection.query("select pla.*,DATE_FORMAT(pla.fechaRegistro,'%Y-%m-%d') fechaRegistro,ca.nombre as nombreUpp,uR.idUsuario idUsuarioRegistro,uR.Nombre nombreUsuarioRegistro,uRevision.*,caj.nombre as  responsableNombre,caj.firmaUrl as firmaResponsable from pla_requerimiento pla inner join caj_upp ca on ca.id=pla.uppId left join usuario uR on uR.idUsuario=pla.usuarioRegistro left join usuario uRevision on uRevision.idUsuario=pla.usuarioRevision left join caj_responsable caj on caj.id=pla.responsableId where pla.fechaRegistro between ? and ?   and seleccionCajaChica=0 and pla.estado in(?) ", [moment(fechaInicio).format("YYYY-MM-DD"), moment(fechaFin).format("YYYY-MM-DD"), estados]);
            const planillasMap = planillas.map(c => ({
                ...c, upp: { id: c.uppId, nombre: c.nombreUpp },
                usuarioRegistro: { id: c.idUsuarioRegistro, nombre: c.nombreUsuarioRegistro },
                usuarioRevision: { id: c.idUsuario, nombre: c.Nombre },
                responsable: { id: c.responsableId, nombre: c.responsableNombre, firmaUrl: c.firmaResponsable }
            }))

            return planillasMap;
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }

    },
    listarDetallePorPlanilla: async function (planillaId) {
        const connection = await mysql.connection();
        try {
            const detalles = await connection.query(`select *,DATE_FORMAT(fechaMovilidad,'%Y-%m-%d') fechaMovilidad  from pla_requerimientodetalle where planillaRequerimientoId=?`, [planillaId]);
            return detalles
        } catch (error) {
            throw error;
        } finally {


            connection.release();
        }

    },

    exportarExcel: async function ({ detalles = [], ...planilla }) {

        try {
            const borderStyles = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            const styleCell = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '002060' }
            }


            const rutaTemplatePedidos = "./template/Planilla Movilidad Detallado Exportable.xlsx";
            if (fs.existsSync(`.${rutaTemplatePedidos}`)) {
                fs.unlinkSync(`.${rutaTemplatePedidos}`);
            }

            await workbook.xlsx.readFile("./template/planilla movilidad.xlsx")
            const sheet = workbook.getWorksheet("Hoja1");
            sheet.getCell("B8").value = `USUARIO:${planilla.usuarioRegistro.nombre}`
            sheet.getCell("I8").value = `DNI:${planilla.dni}`
            sheet.getCell("J8").value = `AREA:${planilla.upp}`
            for (let i = 0; i < detalles.length; i++) {
                const dataCurrent = detalles[i];
                sheet.getCell(`B${i + 11}`).value = dataCurrent.fechaMovilidad
                sheet.getCell(`B${i + 11}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`B${i + 11}`).border = borderStyles;
                if (dataCurrent.tipo == "C") {
                    sheet.getCell(`C${i + 11}`).value = "X";
                } else {
                    sheet.getCell(`C${i + 11}`).value = "X"

                }
                sheet.getCell(`C${i + 11}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`C${i + 11}`).border = borderStyles;
                sheet.getCell(`D${i + 11}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`D${i + 11}`).border = borderStyles;
                sheet.getCell(`G${i + 11}`).value = dataCurrent.motivo;
                sheet.getCell(`G${i + 11}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`G${i + 11}`).border = borderStyles;
                sheet.getCell(`I${i + 11}`).value = dataCurrent.origen;
                sheet.getCell(`I${i + 11}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`I${i + 11}`).border = borderStyles;
                sheet.getCell(`J${i + 11}`).value = dataCurrent.destino;
                sheet.getCell(`J${i + 11}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`J${i + 11}`).border = borderStyles;
                sheet.getCell(`K${i + 11}`).value = dataCurrent.importe;
                sheet.getCell(`K${i + 11}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`K${i + 11}`).border = borderStyles;

            }
            const total = detalles.reduce((prev, curr) => {
                prev += curr.importe
                return prev
            }, 0).toFixed(2) * 1
            sheet.getCell(`B${detalles.length + 11}`).value = "(T) Taxi (C) Colectivo";
            sheet.getCell(`B${detalles.length + 11}`).alignment = { vertical: "middle", horizontal: "center" };
            sheet.getCell(`B${detalles.length + 11}`).border = borderStyles;

            sheet.getCell(`B${detalles.length + 14}`).value = moment(planilla.fecha).format("YYYY-MM-DD");
            sheet.getCell(`B${detalles.length + 14}`).alignment = { vertical: "middle", horizontal: "center" };
            sheet.getCell(`B${detalles.length + 15}`).value = "FECHA";
            sheet.getCell(`B${detalles.length + 15}`).alignment = { vertical: "middle", horizontal: "center" };


            sheet.getCell(`J${detalles.length + 14}`).value = "TOTAL S/.";
            sheet.getCell(`J${detalles.length + 14}`).alignment = { vertical: "middle", horizontal: "center" };
            sheet.getCell(`J${detalles.length + 14}`).border = borderStyles;

            sheet.getCell(`K${detalles.length + 14}`).value = total;
            sheet.getCell(`K${detalles.length + 14}`).alignment = { vertical: "middle", horizontal: "center" };
            sheet.getCell(`K${detalles.length + 14}`).border = borderStyles;
            await workbook.xlsx.writeFile(rutaTemplatePedidos)

            return { templateUrl: `/supergen-be/template/Planilla Movilidad Detallado Exportable.xlsx` }
        } catch (error) {
            console.log("err", error)
            throw error;
        }



    },
    ultimoCorrelativoPorUpp: async function (upp) {
        const connection = await mysql.connection();
        try {
            const yearMonth = moment()
            const data = await connection.query("select  anio,caR.id,CONVERT(numero,UNSIGNED INTEGER)    numero from pla_requerimiento caR inner join caj_upp cu on cu.id=caR.uppId where cu.nombre=? order by caR.id desc limit 1 ", [upp])
            console.log(data)
            let { anio = yearMonth.format("YYYY"), numero = 0 } = data[0].anio != null && data[0] || {}
            console.log("anio=", anio, numero)
            let correlativo = numero ? numero + 1 : 1
            if (yearMonth.format("YYYY") != anio) {
                correlativo = 1
                anio = yearMonth.format("YYYY")
            }

            return { correlativo: `PM${upp}${anio}_${correlativo.toString().padStart(4, "0")}`, numero: correlativo };

        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }



    },


    listarAgrupados: async function ({ fechaInicio, fechaFin }) {
        const connection = await mysql.connection();
        try {
            const listaPlanillaMovilidadConDetalles = []
            let listaPlanillasAgrupados = []
            const planillas = await connection.query("select pla.*,DATE_FORMAT(pla.fechaRegistro,'%Y-%m-%d') fechaRegistro,ca.nombre as nombreUpp,uR.idUsuario idUsuarioRegistro,uR.Nombre nombreUsuarioRegistro,uRevision.*,caj.nombre as  responsableNombre,caj.firmaUrl as firmaResponsable from pla_requerimiento pla inner join caj_upp ca on ca.id=pla.uppId left join usuario uR on uR.idUsuario=pla.usuarioRegistro left join usuario uRevision on uRevision.idUsuario=pla.usuarioRevision left join caj_responsable caj on caj.id=pla.responsableId where pla.fechaRegistro between ? and ? and pla.estado='Enviado a  aprobar'", [moment(fechaInicio).format("YYYY-MM-DD"), moment(fechaFin).format("YYYY-MM-DD")]);
            if (planillas.length > 0) {
                const planillasMap = planillas.map(c => ({
                    ...c, upp: { id: c.uppId, nombre: c.nombreUpp },
                    usuarioRegistro: { id: c.idUsuarioRegistro, nombre: c.nombreUsuarioRegistro },
                    usuarioRevision: { id: c.idUsuario, nombre: c.Nombre },
                    responsable: { id: c.responsableId, nombre: c.responsableNombre, firmaUrl: c.firmaResponsable }
                }))
                const planillasIds = planillas.map(p => p.id)
                const detallesPlanillas = await connection.query("select *,DATE_FORMAT(fechaMovilidad,'%Y-%m-%d') fechaMovilidad  from pla_requerimientodetalle where planillaRequerimientoId in(?)", [planillasIds]);
                planillasMap.forEach((curr, index, array) => {
                    const { upp, usuarioRegistro, responsable, ...planillaActual } = curr
                    const planillasIds = array.filter(a => a.responsable.id == responsable.id && a.upp.id == upp.id).map(p => p.id)
                    const detalles = detallesPlanillas.filter(d => planillasIds.includes(d.planillaRequerimientoId))
                    const detallesMap = detallesPlanillas.filter(d => planillasIds.includes(d.planillaRequerimientoId)).map((d, index) => ({ ...d, planillaActual: { ...planillaActual, usuarioRegistro, responsable, upp }, show: index == 0, rowSpan: detalles.length }))
                    if (listaPlanillasAgrupados.findIndex(l => l.planillaActual.responsable.id == responsable.id && l.planillaActual.upp.id == upp.id) == -1 && listaPlanillaMovilidadConDetalles.findIndex(l => l.responsable.id == responsable.id && l.upp.id == upp.id) == -1) {
                        listaPlanillasAgrupados = listaPlanillasAgrupados.concat(detallesMap)
                        listaPlanillaMovilidadConDetalles.push({ ...planillaActual, usuarioRegistro, responsable, upp, detalles })
                    }
                })

            }





            return { lista: listaPlanillaMovilidadConDetalles, agrupado: listaPlanillasAgrupados }
        } catch (error) {
            console.log("err", error)
            throw error;
        } finally {
            connection.release();
        }



    },


    rechazarGerencia: async function ({ descripcionErrorGerencia, id }) {





    },

    listarPorFechasYUpp: async function ({ fechaInicio, fechaFin, uppName, verPlanillas = false }, usuarioRegistro) {

        const connection = await mysql.connection();
        let queryUser = " and usuarioRegistro=" + usuarioRegistro
        if (verPlanillas) {
            queryUser = ''
        }
        try {
            const upp = await this.traerUppPorNombre(uppName)
            const planillas = await connection.query("select pla.*,DATE_FORMAT(pla.fechaRegistro,'%Y-%m-%d') fechaRegistro,ca.nombre as nombreUpp,uR.idUsuario idUsuarioRegistro,usuarioAprobacion.Nombre nombreUsuarioAprobacion ,uR.Nombre nombreUsuarioRegistro,uRevision.*,caj.nombre as  responsableNombre,caj.firmaUrl as firmaResponsable from pla_requerimiento pla inner join caj_upp ca on ca.id=pla.uppId left join usuario uR on uR.idUsuario=pla.usuarioRegistro left join usuario uRevision on uRevision.idUsuario=pla.usuarioRevision left join usuario usuarioAprobacion  on usuarioAprobacion.idUsuario=pla.usuarioAprobacion left join caj_responsable caj on caj.id=pla.responsableId where pla.fechaRegistro between ? and ? and pla.uppId=?" + queryUser, [moment(fechaInicio).format("YYYY-MM-DD"), moment(fechaFin).format("YYYY-MM-DD"), upp.id]);
            const planillasMap = planillas.map(c => ({
                ...c, upp: { id: c.uppId, nombre: c.nombreUpp },
                usuarioRegistro: { id: c.idUsuarioRegistro, nombre: c.nombreUsuarioRegistro },
                usuarioRevision: { id: c.idUsuario, nombre: c.Nombre },
                responsable: { id: c.responsableId, nombre: c.responsableNombre, firmaUrl: c.firmaResponsable },
                usuarioAprobacion: { id: c.usuarioAprobacion, nombre: c.nombreUsuarioAprobacion }
            }))
            return planillasMap
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }

    },

    listar: async function ({ fechaInicio, fechaFin }) {
        const connection = await mysql.connection();
        try {
            const planillas = await connection.query("select pla.*,DATE_FORMAT(pla.fechaRegistro,'%Y-%m-%d') fechaRegistro,ca.nombre as nombreUpp,uR.idUsuario idUsuarioRegistro,uR.Nombre nombreUsuarioRegistro,uRevision.*,caj.nombre as  responsableNombre,caj.firmaUrl as firmaResponsable from pla_requerimiento pla inner join caj_upp ca on ca.id=pla.uppId left join usuario uR on uR.idUsuario=pla.usuarioRegistro left join usuario uRevision on uRevision.idUsuario=pla.usuarioRevision left join caj_responsable caj on caj.id=pla.responsableId where pla.fechaRegistro between ? and ? ", [moment(fechaInicio).format("YYYY-MM-DD"), moment(fechaFin).format("YYYY-MM-DD")]);
            const planillasMap = planillas.map(c => ({
                ...c, upp: { id: c.uppId, nombre: c.nombreUpp },
                usuarioRegistro: { id: c.idUsuarioRegistro, nombre: c.nombreUsuarioRegistro },
                usuarioRevision: { id: c.idUsuario, nombre: c.Nombre },
                responsable: { id: c.responsableId, nombre: c.responsableNombre, firmaUrl: c.firmaResponsable }
            }))
            return planillasMap
        } catch (error) {
            console.error(error)
            throw error;
        } finally {
            connection.release();
        }

    },


    actualizarSeleccionDetalleYTextoRechazo: async function (detalles = []) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            const query = this.queryActualizacionPlanillaMovilidadDetalleBatch(detalles.map(d => ({ id: d.id, estado: d.estado ? 1 : 0, textoRechazo: d.textoRechazo })))
            await connection.query(query);
            await connection.query("COMMIT");
        } catch (error) {
            console.log("er", error);
            await connection.query("ROLLBACK");

            throw error;
        } finally {
            connection.release();
        }
    },

    actualizacionPlanillaMovilidadBatch: async function (planillas = []) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            const query = planillas.map(d => {
                const dataValues = Object.keys(d).filter(key => key != "id").map(key => {
                    let data = d[key]
                    if (typeof data == "string" && d[key]) {
                        data = `'${d[key]}'`
                    }
                    if (typeof data === "string" && !d[key]) {
                        console.log("entro")
                        data = `' '`
                    }

                    console.log("data", data, "tipe", typeof data, "key", key, "d")
                    return `${key}=${data}`
                }).join()
                return `update pla_requerimiento set ${dataValues} where id=${d.id}`
            }).join(";")

            await connection.query(query);
            await connection.query("COMMIT");
        } catch (error) {
            console.log("e", error);
            await connection.query("ROLLBACK");

            throw error;
        } finally {
            connection.release();
        }
    },
    listarPorIds: async function (ids = []) {

        const connection = await mysql.connection();
        try {
            const planillas = await connection.query("select pla.*,DATE_FORMAT(pla.fechaRegistro,'%Y-%m-%d') fechaRegistro,ca.nombre as nombreUpp,uR.idUsuario idUsuarioRegistro,uR.Nombre nombreUsuarioRegistro,uRevision.*,caj.nombre as  responsableNombre,caj.firmaUrl as firmaResponsable,uR.email as emailUsuarioRegistro from pla_requerimiento pla inner join caj_upp ca on ca.id=pla.uppId left join usuario uR on uR.idUsuario=pla.usuarioRegistro left join usuario uRevision on uRevision.idUsuario=pla.usuarioRevision left join caj_responsable caj on caj.id=pla.responsableId where pla.id in(?) ", [ids]);
            const planillasMap = planillas.map(c => ({
                ...c, upp: { id: c.uppId, nombre: c.nombreUpp },
                usuarioRegistro: { id: c.idUsuarioRegistro, nombre: c.nombreUsuarioRegistro, email: c.emailUsuarioRegistro },
                usuarioRevision: { id: c.idUsuario, nombre: c.Nombre },
                responsable: { id: c.responsableId, nombre: c.responsableNombre, firmaUrl: c.firmaResponsable }
            }))

            return planillasMap;
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }


    },
    aprobarPlanillasPorDetalles: async function (detalles = [], usuario) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            const correosAlias = await contabCpeModel.listarCorreosPorAlias(["CONTABILIDAD"])
            const planillaRequerimientoIds = (await connection.query("select planillaRequerimientoId from  pla_requerimientodetalle where id in(?)", [detalles.map(d => d.id)])).map(d => d.planillaRequerimientoId);
            const planillasIdsUnicos = planillaRequerimientoIds.reduce((prev, curr) => {
                if (prev.findIndex(p => p == curr) == -1) {
                    prev.push(curr)
                }
                return prev;
            }, [])
            const planillas = await this.listarPorIds(planillasIdsUnicos)
            let correos = await contabCpeModel.listarCorreosPorUppYPropiedad(planillas.map(p => p.upp.id), ["aprobacionContabilidad"])
            correos = correos.concat(correosAlias)

            if (planillaRequerimientoIds.length > 0) {
                await connection.query("update pla_requerimiento set estado=? ,usuarioAprobacion=? where id in(?) ", ["Aprobado por gerencia", usuario, planillaRequerimientoIds])
            }
            const html = planillas.map(planilla => `<p>${planilla.correlativo}</p>
            <p>Fecha:${moment().format("YYYY-MM-DD")}</p>
            <p>Usuario:${planilla.responsable.nombre}</p>
            <a href='http://portal.supergen.net/supergen-fe/#!/planilla-movilidad-logistica'>Ver</a>`)
            if (correos.length > 0) {
                await sendEmail.sendEmail(`Planillas Aprobadas`, correos, `Las siguientes planillas fueron aprobadas:${html}`)
            }

            for (const planilla of planillas) {
                const { usuarioRegistro } = planilla
                const htmlPlanilla = `<p>${planilla.correlativo}</p>
                <p>Fecha:${moment().format("YYYY-MM-DD")}</p>`
                sendEmail.sendEmail(`Planilla Aprobada`, [usuarioRegistro.email], htmlPlanilla)
            }

            await connection.query("COMMIT");
        } catch (error) {
            console.log("e", error);

            await connection.query("ROLLBACK");

            throw error;
        } finally {
            connection.release();
        }


    },
    rechazarPlanillasPorDetalles: async function (detalles = []) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            const correos = await contabCpeModel.listarCorreosPorAlias(["CONTABILIDAD"])

            const detallesConSoloTextoRechazo = detalles.map(d => ({ textoRechazo: d.textoRechazo, id: d.id }))
            const queryActualizacionDetalles = this.queryActualizacionPlanillaMovilidadDetalleBatch(detallesConSoloTextoRechazo)
            const planillaRequerimientoIds = (await connection.query("select planillaRequerimientoId from  pla_requerimientodetalle where id in(?)", [detalles.map(d => d.id)])).map(d => d.planillaRequerimientoId);
            const planillasIdsUnicos = planillaRequerimientoIds.reduce((prev, curr) => {
                if (prev.findIndex(p => p == curr) == -1) {
                    prev.push(curr)
                }
                return prev;
            }, [])
            const planillas = await this.listarPorIds(planillasIdsUnicos)

            const html = planillas.map(planilla => `<p>${planilla.correlativo}</p>
            <p>Fecha:${moment().format("YYYY-MM-DD")}</p>
            <p>Usuario:${planilla.responsable.nombre}</p>
            <a href='http://portal.supergen.net/supergen-fe/#!/planilla-movilidad-logistica'>Ver</a>`)
            if (correos.length > 0) {
                await sendEmail.sendEmail(`Planillas Rechazadas`, correos, `Las siguientes planillas fueron rechazad:${html}`)
            }


            if (planillaRequerimientoIds.length > 0) {

                await connection.query("update pla_requerimiento set estado=? where id in(?)", ["Rechazado por gerencia", planillaRequerimientoIds])
            }

            await connection.query(queryActualizacionDetalles)
            await connection.query("COMMIT");
            for (const planilla of planillas) {
                const { usuarioRegistro } = planilla
                const htmlPlanilla = `<p>${planilla.correlativo}</p>
                <p>Fecha:${moment().format("YYYY-MM-DD")}</p>`
                sendEmail.sendEmail(`Planilla Rechazada`, [usuarioRegistro.email], htmlPlanilla)


            }
        } catch (error) {
            console.log("e", error);

            await connection.query("ROLLBACK");

            throw error;
        } finally {
            connection.release();
        }


    },


    queryActualizacionPlanillaMovilidadDetalleBatch: function (detalles = []) {
        return detalles.map(d => {
            const dataValues = Object.keys(d).filter(key => key != "id").map(key => {
                let data = d[key]
                if (typeof data == "string" && d[key]) {
                    data = `'${d[key]}'`
                }
                if (typeof data === "string" && !d[key]) {
                    console.log("entro")
                    data = `' '`
                }

                console.log("data", data, "tipe", typeof data, "key", key, "d")
                return `${key}=${data} `
            }).join()
            return `update pla_requerimientodetalle set ${dataValues} where id = ${d.id} `
        }).join(";")
    },

    actualizacionGenericaPlanillaMovilidad: async function (props = {}, id) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            await connection.query("update  pla_requerimiento set " + Object.keys(props).map(key => key + "=? ").join(",") + " where id=? ", [...Object.values(props), id]);
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");

            throw error;
        } finally {
            connection.release();
        }
    },

}

module.exports = planillaMovilidadModelo;