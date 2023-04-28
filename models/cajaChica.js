

const db = require('../dbconnection');
const { poolPromise } = require('../dbconnectionMSSQL');
const sendEmail = require('./sendEmail');
const usuario = require('./usuario');
const moment = require("moment");
moment.locale("es")
const contabCpeModel = require('./contab_cpe');
const { resolve } = require('path');
const mysql = require("../dbconnectionPromise")
const planillaMovilidadModel = require('./planillaMovilidad')
const cotizacionModel = require('./cotizacion')
var fs = require('fs');
var Excel = require('exceljs');
const DBCostsSG = require('./DBCostsSG');

var workbook = new Excel.Workbook();
const estadosCajaChicha = [
    { estado: 0, name: "Creado" },
    { estado: 1, name: "Enviado a Aprobar" },
    { estado: 2, name: "Aprobado por jefe" },
    { estado: 3, name: "Aprobado pro Gerancia" },
    { estado: 4, name: "Transferido" },
    { estado: 5, name: "Rechazado" },
    { estado: 6, name: "Cerrado" },
]

const estadosDetalleCajaChica = {
    "0": "No Seleccionado",
    "1": "Seleccionado",
    "2": "Transferido",
    "3": "Solicitud parcialmente",
    "4": "liquidado",
    "5": "Aprobado parcialmente"
}



const cajaChicaModel = {

    guardar: async function (cajaChica, usuarioRegistro) {
        const connection = await mysql.connection();
        const todayMoment = moment()

        try {
            await connection.query("START TRANSACTION");

            const { detalles } = cajaChica
            const upp = await this.traerUppPorNombre(cajaChica.upp)
            const result = await connection.query("insert into caj_requerimiento(fondo,fecha,anio,correlativo,numero,gastoFechaInicial,gastoFechaFinal,responsableId,uppId,fechaRegistro,usuarioRegistro) values(?,?,?,?,?,?,?,?,?,?,?)", [cajaChica.fondo,
            moment(cajaChica.fecha).format("YYYY-MM-DD"), todayMoment.format("YYYY"), cajaChica.correlativo,
            cajaChica.numero, moment(cajaChica.gastoFechaInicial).format("YYYY-MM-DD"), moment(cajaChica.gastoFechaFinal).format("YYYY-MM-DD"), cajaChica.responsable.id, upp.id, new Date(), usuarioRegistro])
            /*         const detallesValues = detalles.map(d => [d.fechaEmision, d.tipoDocumento, d.serie, d.numeroDocumento, d.emisor, d.ruc, d.base, d.descripcion, d.total, d.tipo.id, result.insertId])
                    await connection.query("insert into caj_requerimientodetalle(fechaEmision,tipoDocumento,serie,numeroDocumento,emisor,ruc,base,descripcion,total,tipoId,cajaRequerimientoId) values ?", [detallesValues])
            */
            await this.guardarDetalle(detalles, result.insertId)

            await connection.query("COMMIT");


        } catch (error) {
            console.error("Error", error);
            await connection.query("ROLLBACK");

            throw error;
        } finally {
            connection.release();
        }
    },

    guardarResponsable: async function (responsable) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            await connection.query("insert into caj_responsable(nombre,email,uppId,firmaUrl,administraCaja,firmaNombre,fechaRegistro,dni)values(?,?,?,?,?,?,?,?)", [responsable.nombre, responsable.email, responsable.uppId, responsable.firmaUrl, responsable.administraCaja, responsable.firmaNombre, new Date(), responsable.dni])
            await connection.query("COMMIT");
        } catch (error) {
            console.error("Error", error);
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }


    },
    liquidarDetalle: async function (detalleId) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            const detalle = (await connection.query("select id,total from caj_requerimientodetalle where id=?", [detalleId]))[0]
            await connection.query("update caj_requerimientodetalle set liquidado=?,estado=4 where id=?", [detalle.total, detalleId])
            await connection.query("COMMIT");
        } catch (error) {
            console.error("Error", error);
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
    },
    eliminarResponsable: async function (responsableId) {
        const connection = await mysql.connection();
        try {
            await connection.query("update caj_responsable set estado=? where id=?", [0, responsableId])
        } catch (error) {
            console.error("Error", error);
            throw error;
        } finally {
            connection.release();
        }

    },
    editarResponsable: async function (responsable) {
        const connection = await mysql.connection();
        try {
            const result = await connection.query("update caj_responsable set email=?,uppId=?,firmaUrl=?,firmaNombre=?,administraCaja=?,dni=? where id=?", [responsable.email, responsable.uppId, responsable.firmaUrl, responsable.firmaNombre, responsable.administraCaja, responsable.dni, responsable.id])
            return result;
        } catch (error) {
            console.error("Error", error);
            throw error;
        } finally {
            connection.release();
        }

    },
    listarResponsable: async function () {
        const connection = await mysql.connection();
        try {
            const result = await connection.query("select caR.*,cupp.nombre nombreUpp from caj_responsable caR inner join caj_upp cupp on cupp.id=caR.uppId where caR.estado=1")
            return result.map(r => ({ ...r, upp: { id: r.uppId, nombre: r.nombreUpp } }));
        } catch (error) {
            console.error("Error", error);
            throw error;
        } finally {
            connection.release();
        }
    },
    listarUpp: async function () {

        const connection = await mysql.connection();

        try {

            const result = await connection.query("select * from caj_upp")

            return result;


        } catch (error) {
            console.error("Error", error);
            throw error;
        } finally {
            connection.release();
        }

    },
    listarDetallePorId: async function (id) {
        const connection = await mysql.connection();
        try {
            console.log("entro")
            const detallesMap = []
            const detalles = await connection.query("select  cajD.*,DATE_FORMAT(cajD.fechaEmision,'%Y-%m-%d') fechaEmision,ctipo.id as tipoId,ctipo.descripcion as cajaDescripcion,ctdoc.id tdocId,ctdoc.validaSunat,ctdoc.transferir,ctdoc.abreviatura,ctdoc.tipo tdocTipo,archivo.nombre nombreArchivo,archivo.id idArchivo,archivo.url urlArchivo,cR.nombre nombreResponsable from caj_requerimientodetalle cajD inner join caj_tipo  ctipo on ctipo.id=cajD.tipoId inner join contab_tdoc ctdoc on ctdoc.id=cajD.tipoDocumento left join caj_archivos archivo on archivo.cajRequerimientoDetalleId=cajD.id left join caj_responsable cR on cR.id=cajD.responsableId  where cajaRequerimientoId=?", [id]);

            for (let i = 0; i < detalles.length; i++) {
                const contabCurrent = detalles[i]
                const archivosFilter = detalles.filter(c => c.id == contabCurrent.id).map(a => ({ nombre: a.nombreArchivo, url: a.urlArchivo }))
                const archivos = detalles.filter(c => c.id == contabCurrent.id).every(a => a.nombreArchivo && a.urlArchivo) && archivosFilter || []
                if (detallesMap.findIndex(c => c.id == contabCurrent.id) == -1) {
                    detallesMap.push({ ...contabCurrent, tipo: { id: contabCurrent.tipoId, descripcion: contabCurrent.cajaDescripcion }, tipoDocumento: { id: contabCurrent.tdocId, tipo: contabCurrent.tdocTipo, validaSunat: contabCurrent.validaSunat, transferir: contabCurrent.transferir, abreviatura: contabCurrent.abreviatura }, archivos, responsable: { id: contabCurrent.responsableId, nombre: contabCurrent.nombreResponsable } })
                }
            }

            return detallesMap
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
    transferirSispagEnLote: async function (cajaChica, user) {
        try {

            await this.transferirSisPag(cajaChica, user)

        } catch (error) {
            console.log("e", error);
            throw error;
        }

    },

    transferirSisPag: async function ({ detalles = [], ...cajaChica }, usuario) {
        const connection = await mysql.connection();
        try {
            const detallesTransferir = detalles.filter(d => d.tipoDocumento.transferir == "S")
            const pool = await poolPromise
            let queryPool = ""
            let queryLocal = ""
            for (const detalle of detallesTransferir) {
                const tipoCambio = await cotizacionModel.traerTipoCambioPorFecha(detalle.fechaEmision);
                if (!tipoCambio) { throw new Error(`la Fecha documento ${detalle.fechaEmision} no tiene tipo de cambio`) }
                const payloadConcar = {
                    fechaConcar: `'${moment(detalle.fechaEmision, "YYYY-MM-DD").format("YYMMDD")}'`,
                    fechaHoyConcar: `'${moment().format("YYMMDD")}'`,
                    fecha: `CONVERT(DATETIME,'${moment(detalle.fechaEmision, "YYYY-MM-DD").format("YYYY-MM-DD")}')`,
                    fechaVencimiento: `'${moment(detalle.fechaEmision, "YYYY-MM-DD").format("YYMMDD")}'`,
                    fechaHoy: `CONVERT(DATETIME,'${moment().format("YYYY-MM-DD")}')`,
                    tipoDoc: detalle.tipoDocumento.abreviatura,
                    CP_CCODMON: "'MN'",
                    CP_NTIPCAM: tipoCambio.toString(),
                    CP_NIMPOMN: detalle.total,
                    CP_NIMPOUS: (detalle.total / tipoCambio).toFixed(2) * 1,
                    CP_NSALDMN: detalle.total,
                    CP_NSALDUS: (detalle.total / tipoCambio).toFixed(2) * 1,
                    CP_NIGVMN: detalle.tipoDocumento.tipo == "Boleta" ? 0 : (detalle.total - detalle.base).toFixed(2) * 1,
                    CP_NIGVUS: detalle.tipoDocumento.tipo == "Boleta" ? 0 : ((detalle.total - detalle.base).toFixed(2) * 1 / tipoCambio).toFixed(2) * 1,
                    CP_CNDOCRE: detalle.comprobante,
                    CP_CDEBHAB: detalle.tipoDocumento.abreviatura == "NA" ? "D" : "H"
                }

                queryPool += `insert into RSCONCAR.dbo.CP0003CART(CP_CVANEXO,CP_CCODIGO,CP_CTIPDOC,CP_CNUMDOC,CP_CFECDOC,CP_CFECVEN,CP_CFECREC,CP_CSITUAC,CP_CDEBHAB,CP_CCODMON
                    ,CP_NTIPCAM,CP_NIMPOMN,CP_NIMPOUS,CP_NSALDMN,CP_NSALDUS,CP_NIGVMN,CP_NIGVUS,CP_NIMP2MN,CP_NIMP2US,CP_NIMPAJU,CP_CCUENTA,CP_CAREA,CP_CFECUBI,CP_CTDOCRE,
                    CP_CNDOCRE,CP_CFDOCRE,CP_CCOGAST,CP_CDESCRI,CP_DFECCRE,CP_DFECMOD,CP_CUSER,CP_NINAFEC,CP_DFECDOC,CP_DFECVEN,CP_DFECREC,CP_DFDOCRE,CP_CCENCOR,CP_CIMAGEN,CP_CVANERF,CP_CCODIRF,
                    CP_NPORRE) values('P','${detalle.ruc}','${detalle.tipoDocumento.abreviatura}','${detalle.comprobante}',${payloadConcar.fechaConcar},${payloadConcar.fechaVencimiento},${payloadConcar.fechaHoyConcar},'R','${payloadConcar.CP_CDEBHAB}',
                    ${payloadConcar.CP_CCODMON},${payloadConcar.CP_NTIPCAM},${payloadConcar.CP_NIMPOMN},${payloadConcar.CP_NIMPOUS},${payloadConcar.CP_NSALDMN},${payloadConcar.CP_NSALDUS},${payloadConcar.CP_NIGVMN},
                    ${payloadConcar.CP_NIGVUS},0,0,0,'','LO',${payloadConcar.fechaConcar},'VB','${detalle.comprobante}',${payloadConcar.fechaConcar},'01','COMPRA',${payloadConcar.fechaHoy},${payloadConcar.fechaHoy},'SIST',
                    '0',${payloadConcar.fecha},${payloadConcar.fechaVencimiento},${payloadConcar.fechaHoy},${payloadConcar.fechaHoy},'00003','0','P','${detalle.ruc}',0);`
                queryLocal += `update caj_requerimientodetalle set estado=3,fechaTransferencia='${moment().format("YYYY-MM-DD")}',usuarioTransferencia=${usuario} where id=${detalle.id};`
            }
            console.log("q", queryPool)

            await pool.request()
                .query(queryPool)
            if (queryLocal != "") {
                await connection.query(queryLocal);
            }
            let estadoCajaRequerimiento = "Transferido parcialmente"
            const requerimientoDetalles = await connection.query("select  rD.estado,tdoc.* from caj_requerimientodetalle rD inner join contab_tdoc tdoc on tdoc.id=rD.tipoDocumento where cajaRequerimientoId=? and tdoc.transferir='S' and rD.estado=1 and rD.sunatCodigo=1", [cajaChica.id]);
            const requerimientoDetallesTransferidos = requerimientoDetalles.filter(d => d.estado == 3)
            if (requerimientoDetallesTransferidos.length == requerimientoDetalles.length) {
                estadoCajaRequerimiento = "Transferido"
            }
            await connection.query("update caj_requerimiento set estado=? where id=?", [estadoCajaRequerimiento, cajaChica.id])
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            connection.release();
        }




    },
    editar: async function (cajaChica) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            await connection.query("update  caj_requerimiento set fondo=?,fecha=?,gastoFechaInicial=?,gastoFechaFinal=?,responsableId=? where id=?", [cajaChica.fondo, moment(cajaChica.fecha).format("YYYY-MM-DD"), moment(cajaChica.gastoFechaInicial).format("YYYY-MM-DD"), moment(cajaChica.gastoFechaFinal).format("YYYY-MM-DD"), cajaChica.responsable.id, cajaChica.id])
            const detalles = cajaChica.detalles.filter(d => d.id && ![3, 5, 4].includes(d.estado))
            const detallesNuevos = cajaChica.detalles.filter(d => !d.id && d.estado != 3)
            await connection.query(`delete from caj_requerimientodetalle where estado not in(3,4,5) and cajaRequerimientoId=?`, [cajaChica.id]);
            await this.guardarDetalle(detalles.concat(detallesNuevos), cajaChica.id)
            await connection.query("COMMIT");

        } catch (error) {
            console.error("Error", error);
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
    },
    enviarAAprobar: async function (cajaChicaId, usuarioRevision) {

        try {
            let usuarioRevisionProcesado = usuarioRevision
            let estadoTransicionCaja = "Enviado a  aprobar"
            const cajaChica = await this.buscarPorId(cajaChicaId)
            const cajaEsAdministracion = cajaChica.upp.nombre.toString().toLowerCase() == "administracion"
            const usuarioGerente = await usuario.traerUsuarioPorRol("Gerente General")
            const correos = await contabCpeModel.listarCorreosPorUppYPropiedad(cajaChica.upp.id, ["aprobacionCaja"])
            if (cajaEsAdministracion) {
                estadoTransicionCaja = "Aprobado por gerencia"
                usuarioRevisionProcesado = usuarioGerente.id
            }
            console.log("correos", correos)
            const html = `<p>Se ha generado la Caja para ser aprobado</p>
            <p>Fecha:${moment().format("YYYY-MM-DD")}</p>
            <p>Usuario:${cajaChica.responsable.nombre}</p>
            <a href='http://portal.supergen.net/supergen-fe/#!/caja-chica-logistica'>Ver</a>`
            await this.actualizacionGenericaCajaChica({ fechaRevision: moment().format("YYYY-MM-DD"), estado: estadoTransicionCaja, usuarioRevision: usuarioRevisionProcesado }, cajaChicaId)
            if (correos.length > 0 && !cajaEsAdministracion) {
                await sendEmail.sendEmail(`Caja N° ${cajaChica.correlativo} ${cajaChica.upp.nombre} para Aprobar`, correos, html)
            }

        } catch (error) {
            console.error(error)
            throw error;
        }

    },
    enviarAAprobarParcialmente: async function ({ detalles = [], ...cajaChica }) {
        const connection = await mysql.connection();

        try {
            const correos = await contabCpeModel.listarCorreosPorUppYPropiedad(cajaChica.upp.id, ["aprobacionCaja"])
            const html = `<p>Se ha generado la Caja para ser aprobado</p>
            <p>Fecha:${moment().format("YYYY-MM-DD")}</p>
            <p>Usuario:${cajaChica.responsable.nombre}</p>
            <a href='http://portal.supergen.net/supergen-fe/#!/caja-chica-logistica'>Ver</a>`
            await this.actualizacionGenericaCajaChica({ estado: "Aprobar parcialmente" }, cajaChica.id)

            const queryBatchCajaChicaDetalle = this.queryActualizacionCajaChicaDetalleBatch(detalles.map(d => ({ estado: 3, id: d.id })))
            await connection.query(queryBatchCajaChicaDetalle)
            if (correos.length > 0) {
                await sendEmail.sendEmail(`Caja N° ${cajaChica.correlativo} ${cajaChica.upp.nombre} para Aprobar`, correos, html)
            }
        } catch (error) {
            console.error(error)
            throw error;
        } finally {
            connection.release();

        }


    },
    enviarARevisar: async function (cajaChicaId) {

        try {
            const cajaChica = await this.buscarPorId(cajaChicaId)
            const correos = await contabCpeModel.listarCorreosPorUppYPropiedad(cajaChica.upp.id, ["preRevisionCaja"])
            console.log("correos", correos)
            const html = `<p>Se ha generado la Caja para ser Revisado</p>
            <p>Fecha:${moment().format("YYYY-MM-DD")}</p>
            <p>Usuario:${cajaChica.responsable.nombre}</p>
            `
            await this.actualizacionGenericaCajaChica({ estado: "Enviado a revisar" }, cajaChicaId)
            if (correos.length > 0) {
                await sendEmail.sendEmail(`Caja N° ${cajaChica.correlativo} ${cajaChica.upp.nombre} para Revisar`, correos, html)
            }

        } catch (error) {
            console.error(error)
            throw error;
        }

    },
    buscarPorId: async function (cajaChicaId) {
        const connection = await mysql.connection();
        try {
            const cajaChica = await connection.query("select cajRequerimiento.*,DATE_FORMAT(cajRequerimiento.fechaRegistro,'%Y-%m-%d') fechaRegistro,DATE_FORMAT(cajRequerimiento.gastoFechaInicial,'%Y-%m-%d')   gastoFechaInicial,DATE_FORMAT(cajRequerimiento.fecha,'%Y-%m-%d')   fecha,DATE_FORMAT(cajRequerimiento.gastoFechaFinal,'%Y-%m-%d')   gastoFechaFinal,cr.id as responsableId,cr.nombre responsableNombre,cr.firmaUrl,cr.email emailResponsable,upp.id as uppId,upp.nombre uppNombre,userRevision.Nombre as usuarioRevision,cajRequerimiento.usuarioRevision as usuarioRevisionId from caj_requerimiento cajRequerimiento inner join caj_upp upp on upp.id=cajRequerimiento.uppId inner join caj_responsable cr on cr.id=cajRequerimiento.responsableId LEFT JOIN usuario as userRevision on userRevision.idUsuario=cajRequerimiento.usuarioRevision where cajRequerimiento.id=?", [cajaChicaId]);
            if (cajaChica.length == 0) {
                throw new Error('La caja con id ' + cajaChicaId + "No existe")
            }

            const cajaChicaMap = cajaChica.map(c => ({ ...c, responsable: { id: c.responsableId, nombre: c.responsableNombre, firmaUrl: c.firmaUrl, email: c.emailResponsable }, upp: { id: c.uppId, nombre: c.uppNombre } }))
            return cajaChicaMap[0]

        } catch (error) {
            console.error("Error", error);
            throw error;
        } finally {
            connection.release();
        }
    },
    cerrar: async function (cajaChicaId) {
        await this.actualizacionGenericaCajaChica({ estado: "Cerrado" }, cajaChicaId)
    },

    aprobarContabilidad: async function (cajaChicaId) {
        await this.actualizacionGenericaCajaChica({ estado: "Aprobado contabilidad" }, cajaChicaId)

    },
    dataResumido: async function ({ detalles = [], ...cajaChica }) {
        const connection = await mysql.connection();
        try {

            const fechaGastoFechaInicialMoment = moment(cajaChica.gastoFechaInicial)

            const fechaGastoFechaFinalMoment = moment(cajaChica.gastoFechaFinal)
            const fechaInicialSemana = fechaGastoFechaInicialMoment.clone().startOf("week")
            const fechaFinalSemana = fechaGastoFechaInicialMoment.clone().endOf("week").subtract(1, "day");

            const dias = [{ dia: "Lunes", numero: 1, fecha: "" }, { dia: "Martes", numero: 2, fecha: "" }, { dia: "Miercoles", numero: 3, fecha: "" }, { dia: "Jueves", numero: 4, fecha: "" }, { dia: "Viernes", numero: 5, fecha: "" },
            { dia: "Sabado", numero: 6, fecha: "" }, { dia: "Otros", numero: -1, fecha: "" }, { dia: "Total", numero: -2, fecha: "" }]

            let index = 0;
            while (fechaGastoFechaInicialMoment.isSameOrBefore(fechaGastoFechaFinalMoment) && fechaGastoFechaInicialMoment.isSameOrBefore(fechaFinalSemana)) {

                const index = dias.findIndex(d => d.numero == fechaGastoFechaInicialMoment.format("d"))
                if (index > -1) {
                    dias[index].fecha = fechaGastoFechaInicialMoment.format("DD-MM")
                    console.log("d", dias[index])
                }
                fechaGastoFechaInicialMoment.add(1, "day")
            }

            const dataRequrimientoDetalleSum = await connection.query("select A.fechaEmision,A.tipoId,B.descripcion,sum(A.total) total from caj_requerimientodetalle A left join caj_tipo B on B.id=A.tipoId where A.cajaRequerimientoId=? group by A.fechaEmision,A.tipoId,B.descripcion order by A.fechaEmision ", [cajaChica.id]);
            const tiposConValoresMap = dataRequrimientoDetalleSum.map(d => ({ tipo: { id: d.tipoId, descripcion: d.descripcion }, fechaEmision: d.fechaEmision, total: d.total, valores: [] }))

            let valoresTotalesPorDia = []
            for (let i = 0; i < tiposConValoresMap.length; i++) {
                const { fechaEmision, valores, total, tipo } = tiposConValoresMap[i]
                const fechaEmisionMoment = moment(fechaEmision)
                for (let j = 0; j < dias.length; j++) {
                    const diaActual = dias[j]
                    if (fechaEmisionMoment.format("DD-MM") == diaActual.fecha && (diaActual.dia != "Otros" || diaActual.dia != "Total")) {
                        valores.push({ diaActual, total })
                    } else if (diaActual.dia != "Otros" || diaActual.dia != "Total") {
                        valores.push({ diaActual, total: 0 })
                    }
                }
            }
            const tiposConValoresAgrupados = tiposConValoresMap.reduce((prev, curr, index, array) => {
                const valores = array.filter(a => a.tipo.id == curr.tipo.id).map(a => a.valores).flat().reduce((preview, current, index, array) => {
                    if (preview.findIndex(c => c.diaActual.dia == current.diaActual.dia) == -1) {
                        const totalPorDia = array.filter(c => c.diaActual.dia == current.diaActual.dia).reduce((prev, curr) => prev += curr.total, 0)
                        preview.push({ ...current, total: totalPorDia })
                    }
                    return preview;
                }, [])
                if (prev.findIndex(p => p.tipo.id == curr.tipo.id) == -1) {
                    prev.push({ ...curr, valores })
                }
                return prev;
            }, [])
            const totalesOtros = tiposConValoresMap.filter(d => moment(d.fechaEmision).isAfter(fechaFinalSemana))


            for (let i = 0; i < tiposConValoresAgrupados.length; i++) {
                const { tipo, valores } = tiposConValoresAgrupados[i]
                const total = totalesOtros.filter(t => t.tipo.id == tipo.id).reduce((prev, curr) => prev += curr.total, 0)

                const sumaTotal = valores.reduce((prev, curr) => prev += curr.total, 0)
                valores[valores.length - 1].total = sumaTotal + total
                valores[valores.length - 2].total = total
            }
            const valoresTipos = tiposConValoresAgrupados.map(d => d.valores).flat()
            for (let i = 0; i < dias.length; i++) {
                const diaActual = dias[i]
                const totalPorDia = valoresTipos.filter(v => v.diaActual.dia == diaActual.dia).reduce((prev, curr) => prev += curr.total, 0)
                valoresTotalesPorDia.push(totalPorDia.toFixed(2) * 1)
            }
            return { dias, tiposConValoresAgrupados, valoresTotalesPorDia }

        } catch (error) {
            console.log("e", error)
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();

        }

    },

    exportarExcelResumido: async function ({ detalles = [], ...cajaChica }) {
        try {
            const borderStyles = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            const rutaTemplatePedidos = "./template/Caja Chica Resumido Exportable.xlsx";
            if (fs.existsSync(`.${rutaTemplatePedidos}`)) {
                fs.unlinkSync(`.${rutaTemplatePedidos}`);
            }
            /*             const fechaGastoFechaInicialMoment = moment(cajaChica.gastoFechaInicial)
                        const fechaGastoFechaFinalMoment = moment(cajaChica.gastoFechaFinal)
                        const dias = [{ dia: "Lunes", numero: 1 }, { dia: "Martes", numero: 2 }, { dia: "Miercoles", numero: 3 }, { dia: "Jueves", numero: 4 }, { dia: "Viernes", numero: 5 },
                        { dia: "Sabado", numero: 6 }, { dia: "Otros", numero: -1 }, { dia: "Total", numero: -2 }]
                        const tiposConValoresMap = detalles.map(d => ({ tipo: d.tipo, fechaEmision: d.fechaEmision, total: d.total, valores: [] }))
                        let valoresTotalesPorDia = []
                        for (let i = 0; i < tiposConValoresMap.length; i++) {
                            const { fechaEmision, valores, total, tipo } = tiposConValoresMap[i]
                            const fechaEmisionMoment = moment(fechaEmision)
                            for (let j = 0; j < dias.length; j++) {
                                const diaActual = dias[j]
                                if (fechaEmisionMoment.isBetween(fechaGastoFechaInicialMoment, fechaGastoFechaFinalMoment, null, "[]") && fechaEmisionMoment.isoWeekday() == diaActual.numero && (diaActual.dia != "Otros" || diaActual.dia != "Total")) {
                                    valores.push({ diaActual, total })
                                    diaActual.fecha = fechaEmisionMoment.format("DD-MM")
                                } else if (diaActual.dia != "Otros" || diaActual.dia != "Total") {
                                    valores.push({ diaActual, total: 0 })
                                }
                            }
                        }
                        const tiposConValoresAgrupados = tiposConValoresMap.reduce((prev, curr, index, array) => {
                            const valores = array.filter(a => a.tipo.id == curr.tipo.id).map(a => a.valores).flat().reduce((preview, current, index, array) => {
                                if (preview.findIndex(c => c.diaActual.dia == current.diaActual.dia) == -1) {
                                    const totalPorDia = array.filter(c => c.diaActual.dia == current.diaActual.dia).reduce((prev, curr) => prev += curr.total, 0)
                                    preview.push({ ...current, total: totalPorDia })
                                }
                                return preview;
                            }, [])
                            if (prev.findIndex(p => p.tipo.id == curr.tipo.id) == -1) {
                                prev.push({ ...curr, valores })
                            }
                            return prev;
                        }, [])
                        const totalesOtros = detalles.filter(d => !moment(d.fechaEmision).isBetween(fechaGastoFechaInicialMoment, fechaGastoFechaFinalMoment, null, "[]")).map(d => ({ tipo: d.tipo, fechaEmision: d.fechaEmision, total: d.total }));
                        for (let i = 0; i < tiposConValoresAgrupados.length; i++) {
                            const { tipo, valores } = tiposConValoresAgrupados[i]
                            const total = totalesOtros.filter(t => t.tipo.id == tipo.id).reduce((prev, curr) => prev += curr.total, 0)
            
                            const sumaTotal = valores.reduce((prev, curr) => prev += curr.total, 0)
                            valores[valores.length - 1].total = sumaTotal + total
                            valores[valores.length - 2].total = total
            
                        }
            
                        const valoresTipos = tiposConValoresAgrupados.map(d => d.valores).flat()
                        for (let i = 0; i < dias.length; i++) {
                            const diaActual = dias[i]
                            const totalPorDia = valoresTipos.filter(v => v.diaActual.dia == diaActual.dia).reduce((prev, curr) => prev += curr.total, 0)
                            valoresTotalesPorDia.push(totalPorDia)
                        } */
            await workbook.xlsx.readFile("./template/Caja Chica Resumido.xlsx")
            const sheet = workbook.getWorksheet("Hoja1");
            const { dias, tiposConValoresAgrupados, valoresTotalesPorDia } = await this.dataResumido(cajaChica)
            const soloDias = dias.filter(d => d.numero > 0)

            const filaDias = sheet.getRow(9)
            for (let k = 0; k < soloDias.length; k++) {
                filaDias.getCell(k + 2).value = `${soloDias[k].dia.toUpperCase()}:${soloDias[k].fecha && soloDias[k].fecha || '......'}`
            }
            sheet.getCell("B5").value = cajaChica.upp.nombre
            sheet.getCell("B6").value = cajaChica.responsable.nombre
            sheet.getCell("B7").value = cajaChica.fondo
            sheet.getCell("H6").value = `FECHA:${moment(cajaChica.fecha).format("DD-MM-YYYY")}`
            sheet.getCell("D7").value = `GASTO DEL:${moment(cajaChica.gastoFechaInicial).format("DD-MM-YYYY")}`
            sheet.getCell("H7").value = `AL:${moment(cajaChica.gastoFechaFinal).format("DD-MM-YYYY")}`
            for (let i = 0; i < tiposConValoresAgrupados.length; i++) {
                const { valores, ...dataCurrent } = tiposConValoresAgrupados[i];
                sheet.getCell(`A${i + 11}`).value = dataCurrent.tipo.descripcion;
                sheet.getCell(`A${i + 11}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`A${i + 11}`).border = borderStyles;
                const row = sheet.getRow(i + 11)
                for (let j = 0; j < valores.length; j++) {
                    row.getCell(j + 2).value = valores[j].total;
                    row.getCell(j + 2).alignment = { vertical: "middle", horizontal: "center" };
                    row.getCell(j + 2).border = borderStyles;
                }
            }
            const filaTotales = sheet.getRow(tiposConValoresAgrupados.length + 11)
            filaTotales.getCell(1).value = "TOTAL"
            filaTotales.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
            filaTotales.getCell(1).border = borderStyles;
            for (let j = 0; j < valoresTotalesPorDia.length; j++) {
                filaTotales.getCell(j + 2).value = valoresTotalesPorDia[j]
                filaTotales.getCell(j + 2).alignment = { vertical: "middle", horizontal: "center" };
                filaTotales.getCell(j + 2).border = borderStyles;

            }

            const totalDetalles = detalles.reduce((prev, curr) => prev + curr.total, 0)
            sheet.getCell(`G${valoresTotalesPorDia.length + 15}`).value = "SALDO TOTAL:"
            sheet.getCell(`G${valoresTotalesPorDia.length + 15}`).alignment = { vertical: "middle", horizontal: "center" };
            sheet.getCell(`G${valoresTotalesPorDia.length + 15}`).border = borderStyles;
            sheet.getCell(`H${valoresTotalesPorDia.length + 15}`).value = (totalDetalles - cajaChica.fondo).toFixed(2)
            sheet.getCell(`H${valoresTotalesPorDia.length + 15}`).alignment = { vertical: "middle", horizontal: "center" };
            sheet.getCell(`H${valoresTotalesPorDia.length + 15}`).border = borderStyles;

            await workbook.xlsx.writeFile(rutaTemplatePedidos)
            return { templateUrl: `/supergen-be/template/Caja Chica Resumido Exportable.xlsx` }
        } catch (error) {
            console.log("err", error)
            throw error;
        }


    },
    exportarExcelDetallado: async function ({ detalles = [], ...cajaChica }) {
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


            const rutaTemplatePedidos = "./template/Caja Chica Detallado Exportable.xlsx";
            if (fs.existsSync(`.${rutaTemplatePedidos}`)) {
                fs.unlinkSync(`.${rutaTemplatePedidos}`);
            }

            await workbook.xlsx.readFile("./template/Caja Chica Detallado.xlsx")
            const sheet = workbook.getWorksheet("CAJA CHICA");
            sheet.getCell("A2").value = `LIQUIDACION DE GASTOS O CAJA CHICA-${cajaChica.correlativo.toUpperCase()}`
            for (let i = 0; i < detalles.length; i++) {
                const dataCurrent = detalles[i];
                console.log("base", dataCurrent.igv)
                sheet.getCell(`A${i + 5}`).value = moment(dataCurrent.fechaEmision).format("DD-MM-YYYYY");
                sheet.getCell(`A${i + 5}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`A${i + 5}`).border = borderStyles;

                sheet.getCell(`B${i + 5}`).value = dataCurrent.tipoDocumento.tipo;
                sheet.getCell(`B${i + 5}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`B${i + 5}`).border = borderStyles;


                sheet.getCell(`C${i + 5}`).value = dataCurrent.serie;
                sheet.getCell(`C${i + 5}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`C${i + 5}`).border = borderStyles;

                sheet.getCell(`D${i + 5}`).value = dataCurrent.numeroDocumento;
                sheet.getCell(`D${i + 5}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`D${i + 5}`).border = borderStyles;


                sheet.getCell(`E${i + 5}`).value = dataCurrent.ruc;
                sheet.getCell(`E${i + 5}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`E${i + 5}`).border = borderStyles;


                sheet.getCell(`F${i + 5}`).value = dataCurrent.emisor;
                sheet.getCell(`F${i + 5}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`F${i + 5}`).border = borderStyles;


                sheet.getCell(`G${i + 5}`).value = dataCurrent.base;
                sheet.getCell(`G${i + 5}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`G${i + 5}`).border = borderStyles;

                sheet.getCell(`H${i + 5}`).value = dataCurrent.igv;
                sheet.getCell(`H${i + 5}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`H${i + 5}`).border = borderStyles;


                sheet.getCell(`I${i + 5}`).value = dataCurrent.total;
                sheet.getCell(`I${i + 5}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`I${i + 5}`).border = borderStyles;

                sheet.getCell(`J${i + 5}`).value = dataCurrent.descripcion;
                sheet.getCell(`J${i + 5}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`J${i + 5}`).border = borderStyles;

            }
            const total = detalles.reduce((prev, curr) => {
                prev += curr.total
                return prev
            }, 0)
            sheet.getCell(`I${detalles.length + 5}`).value = total;
            sheet.getCell(`I${detalles.length + 5}`).alignment = { vertical: "middle", horizontal: "center" };
            sheet.getCell(`I${detalles.length + 5}`).border = borderStyles;
            await workbook.xlsx.writeFile(rutaTemplatePedidos)

            return { templateUrl: `/supergen-be/template/Caja Chica Detallado Exportable.xlsx` }
        } catch (error) {
            console.log("err", error)
            throw error;
        }



    },

    rechazarPorGerencia: async function ({ detalles = [], ...cajaChica }) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            const correoRegistro = (await usuario.getusuarioByIdPromise(cajaChica.usuarioRegistro))[0].email
            await this.actualizacionGenericaCajaChica({ descripcionErrorGerencia: cajaChica.descripcionErrorGerencia, estado: "Rechazado por gerencia" }, cajaChica.id)
            const query = this.queryActualizacionCajaChicaDetalleBatch(detalles.map(d => ({ id: d.id, estado: 0 })))
            console.log("query", query)
            await connection.query(query)
            await connection.query("COMMIT");

        } catch (error) {
            await connection.query("ROLLBACK");

            throw error;
        } finally {
            connection.release();

        }


    },


    actualizarCajaChicaDetalle: async function (detalles = []) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            const query = this.queryActualizacionCajaChicaDetalleBatch(detalles.map(d => ({ id: d.id, estado: d.estado ? 1 : 0 })))
            console.log("query", query)
            await connection.query(query)
            await connection.query("COMMIT");


        } catch (error) {
            await connection.query("ROLLBACK");

            throw error;
        } finally {
            connection.release();

        }

    },

    aprobarCajaChicaGerencia: async function ({ detalles = [], ...cajaChica }, userId) {


        const connection = await mysql.connection();
        try {
            const cajaChicaBd = await this.buscarPorId(cajaChica.id)
            const correos = await contabCpeModel.listarCorreosPorUppYPropiedad(cajaChicaBd.upp.id, ["aprobacionContabilidad"])
            const correoUsuarioRegistro = (await usuario.getusuarioByIdPromise(cajaChicaBd.usuarioRegistro))[0].email
            correos.unshift(correoUsuarioRegistro)
            console.log("correos", correos)
            let estadoDetalles = 1
            let estadoCajaChica = "Aprobado por gerencia";
            if (cajaChica.estado == "Aprobar parcialmente") {
                estadoCajaChica = "Aprobado parcialmente por gerencia"
                estadoDetalles = 5
            }
            const html = `
            <p>Fecha:${moment().format("YYYY-MM-DD")}</p>
            <p>Usuario:${cajaChicaBd.responsable.nombre}</p>
            <a href='http://portal.supergen.net/supergen-fe/#!/caja-chica-logistica'>Ver</a>`
            await connection.query("START TRANSACTION");
            const detallesSeleccionado = (await connection.query("select count(id) numeroCajaDetalleSeleccionado from caj_requerimientodetalle where estado=1 and cajaRequerimientoId=? limit 1", [cajaChica.id]))[0].numeroCajaDetalleSeleccionado
            if (detallesSeleccionado == 0) {
                throw new Error("Al menos debe haber un detalle seleccionado para poder aprobar");
            }
            const currentDate = moment().format("YYYY-MM-DD")
            await this.actualizacionGenericaCajaChica({ estado: estadoCajaChica, usuarioAprobacion: userId, fechaAprobacion: currentDate }, cajaChica.id)
            const query = this.queryActualizacionCajaChicaDetalleBatch(detalles.filter(e => e.estado != 4).map(d => ({ id: d.id, estado: estadoDetalles })))
            await connection.query(query)
            await connection.query("COMMIT");
            if (correos.length > 0) {
                await sendEmail.sendEmail(`Caja N° ${cajaChicaBd.correlativo} ${cajaChicaBd.upp.nombre} Ha sido Aprobado`, correos, html)
            }

        } catch (error) {
            await connection.query("ROLLBACK");

            throw error;
        } finally {
            connection.release();

        }


    },

    reevaluarSunat: async function (detalles = []) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            console.log("d", detalles)
            for (const detalle of detalles) {
                if (detalle.tipoDocumento.validaSunat == "S" && (detalle.serie.toString().startsWith("F") || detalle.serie.toString().startsWith("E"))) {
                    const { estadoCp: sunatCodigo, estadoCp_name: sunatRespuesta } = await contabCpeModel.checkStateCp({ ruc: detalle.ruc, tipoDoc: detalle.tipoDocumento.id, comprobante: `${detalle.serie}-${detalle.numeroDocumento}`, total: detalle.total, fecha: detalle.fechaEmision })
                    detalle.sunatCodigo = sunatCodigo
                    detalle.sunatRespuesta = sunatRespuesta
                }
            }
            const queryMap = detalles.map(d => `update caj_requerimientodetalle set sunatRespuesta='${d.sunatRespuesta}',sunatCodigo='${d.sunatCodigo}' where id=${d.id}`)
            await connection.query(queryMap.join(";"));
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
    },
    guardarDetalle: async function (detalles = [], cajaChicaId) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            const providers = await DBCostsSG.getProvidersContab()

            for (const detalle of detalles) {
                const { condicion } = await contabCpeModel.getStatusForRuc(detalle.ruc.trim())
                if (detalle.tipoDocumento.validaSunat == "S") {
                    const { estadoCp: sunatCodigo, estadoCp_name: sunatRespuesta } = await contabCpeModel.checkStateCp({ ruc: detalle.ruc, tipoDoc: detalle.tipoDocumento.id, comprobante: `${detalle.serie}-${detalle.numeroDocumento}`, total: detalle.total, fecha: detalle.fechaEmision })
                    detalle.sunatCodigo = sunatCodigo
                    detalle.sunatRespuesta = sunatRespuesta
                    detalle.estadoProveedor = condicion
                }
                detalle.provEncontrado = providers.findIndex(p => p.AC_CCODIGO.trim() == detalle.ruc.trim()) != -1 ? "S" : "N"
            }
            const detallesValues = detalles.map(d => [d.responsable ? d.responsable.id : null, d.planillaMovilidadId, d.fechaEmision, d.tipoDocumento.id, d.serie, d.numeroDocumento, d.emisor, d.ruc.trim(), d.base, d.descripcion, d.total, d.tipo.id, cajaChicaId, d.sunatCodigo, d.sunatRespuesta, d.estadoProveedor, d.igv, `${d.serie}-${d.numeroDocumento}`, d.provEncontrado])
            const planillasSeleccionados = detalles.filter(d => d.planillaMovilidadId > 0).map(d => ({ id: d.planillaMovilidadId, seleccionCajaChica: 1 }))

            if (planillasSeleccionados.length > 0) {
                await planillaMovilidadModel.actualizacionPlanillaMovilidadBatch(planillasSeleccionados)

            }
            const ids = detalles.filter(d => d.id)
            if (ids.length > 0) {
                await db.query(`delete from caj_archivos where cajRequerimientoDetalleId in (${ids.map(d => d.id).join(",")})`);
            }
            const result = await connection.query("insert into caj_requerimientodetalle(responsableId,planillaMovilidadId,fechaEmision,tipoDocumento,serie,numeroDocumento,emisor,ruc,base,descripcion,total,tipoId,cajaRequerimientoId,sunatCodigo,sunatRespuesta,estadoProveedor,igv,comprobante,provEncontrado) values ?", [detallesValues])
            console.log(result.insertId)

            const detalleMap = detalles.map((d, index) => ({ ...d, id: result.insertId + index, }))
            console.log("detalleMap", detalleMap)
            const dataFiles = detalleMap.map(d => d.archivos.map(ar => ({ ...ar, cajaRequerimientoDetalleId: d.id }))).flat()
            console.log(dataFiles)
            if (dataFiles.length > 0) {
                const dataValuesFiles = dataFiles.map(d => [d.nombre, d.url, d.cajaRequerimientoDetalleId])
                await connection.query("insert into caj_archivos(nombre,url,cajRequerimientoDetalleId) values ?", [dataValuesFiles])
            }

            await connection.query("COMMIT");

        } catch (error) {
            await connection.query("ROLLBACK");

            throw error;
        } finally {
            connection.release();
        }
    },
    agregarArchivo: async function ({ archivo, detalleId }) {
        const connection = await mysql.connection();
        try {
            await connection.query(`insert into caj_archivos(nombre,url,cajRequerimientoDetalleId) values(?,?,?) `, [archivo.nombre, archivo.url, detalleId]);
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }

    },



    listFilterDateAndUpp: async function ({ fechaInicio, fechaFin, uppName, verPlanillas = false }, usuarioRegistro) {
        const connection = await mysql.connection();
        let queryUser = " and usuarioRegistro=" + usuarioRegistro
        if (verPlanillas) {
            queryUser = ''
        }
        try {
            const upp = await this.traerUppPorNombre(uppName)
            const cajaChica = await connection.query("select cajRequerimiento.*,DATE_FORMAT(cajRequerimiento.fechaRegistro,'%Y-%m-%d') fechaRegistro,DATE_FORMAT(cajRequerimiento.gastoFechaInicial,'%Y-%m-%d')   gastoFechaInicial,DATE_FORMAT(cajRequerimiento.fecha,'%Y-%m-%d')   fecha,DATE_FORMAT(cajRequerimiento.gastoFechaFinal,'%Y-%m-%d')   gastoFechaFinal,cr.id as responsableId,cr.nombre responsableNombre,cr.firmaUrl,cr.email emailResponsable,upp.id as uppId,upp.nombre uppNombre,userRevision.Nombre as usuarioRevision,cajRequerimiento.usuarioRevision as usuarioRevisionId,usuarioAprobacion.Nombre as usuarioAprobacion,cajRequerimiento.usuarioAprobacion as usuarioAprobacionId from caj_requerimiento cajRequerimiento inner join caj_upp upp on upp.id=cajRequerimiento.uppId inner join caj_responsable cr on cr.id=cajRequerimiento.responsableId LEFT JOIN usuario as userRevision on userRevision.idUsuario=cajRequerimiento.usuarioRevision left join usuario as usuarioAprobacion on usuarioAprobacion.idUsuario=cajRequerimiento.usuarioAprobacion where cajRequerimiento.fechaRegistro between ? and ? and cajRequerimiento.uppId=?" + queryUser, [moment(fechaInicio).format("YYYY-MM-DD"), moment(fechaFin).format("YYYY-MM-DD"), upp.id]);
            const cajaChicaMap = cajaChica.map(c => ({ ...c, responsable: { id: c.responsableId, nombre: c.responsableNombre, firmaUrl: c.firmaUrl, email: c.emailResponsable }, upp: { id: c.uppId, nombre: c.uppNombre } }))
            return cajaChicaMap
        } catch (error) {
            console.error(error)
            throw error;
        } finally {
            connection.release();
        }

    },
    listarPorFechas: async function ({ fechaInicio, fechaFin }) {

        const connection = await mysql.connection();
        try {
            const cajaChica = await connection.query("select cajRequerimiento.*,DATE_FORMAT(cajRequerimiento.fechaRegistro,'%Y-%m-%d') fechaRegistro,DATE_FORMAT(cajRequerimiento.gastoFechaInicial,'%Y-%m-%d')   gastoFechaInicial,DATE_FORMAT(cajRequerimiento.fecha,'%Y-%m-%d')   fecha,DATE_FORMAT(cajRequerimiento.gastoFechaFinal,'%Y-%m-%d')   gastoFechaFinal,cr.id as responsableId,cr.nombre responsableNombre,cr.firmaUrl,cr.email emailResponsable,upp.id as uppId,upp.nombre uppNombre,userRevision.Nombre as usuarioRevision,cajRequerimiento.usuarioRevision as usuarioRevisionId from caj_requerimiento cajRequerimiento inner join caj_upp upp on upp.id=cajRequerimiento.uppId inner join caj_responsable cr on cr.id=cajRequerimiento.responsableId LEFT JOIN usuario as userRevision on userRevision.idUsuario=cajRequerimiento.usuarioRevision where cajRequerimiento.fechaRegistro between ? and ?", [moment(fechaInicio).format("YYYY-MM-DD"), moment(fechaFin).format("YYYY-MM-DD")]);
            const cajaChicaMap = cajaChica.map(c => ({ ...c, responsable: { id: c.responsableId, nombre: c.responsableNombre, firmaUrl: c.firmaUrl, email: c.emailResponsable }, upp: { id: c.uppId, nombre: c.uppNombre } }))
            return cajaChicaMap
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }

    },
    listarTipo: async function () {
        const connection = await mysql.connection();
        try {
            const tipo = await connection.query("select * from caj_tipo");
            return tipo
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }

    },
    listarPlacas: async function () {
        const connection = await mysql.connection();
        try {
            const placas = await connection.query("select * from caj_placa where estado=1");
            return placas
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }

    },
    grabarPlaca: async function (placa) {
        const connection = await mysql.connection();
        try {
            await connection.query("insert into caj_placa(codigo) values(?)", [placa.codigo]);
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }

    },
    editarPlaca: async function (placa) {
        const connection = await mysql.connection();
        try {
            await connection.query("update caj_placa set codigo=? where id=?", [placa.codigo, placa.id]);
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }

    },
    eliminarPlaca: async function (placaId) {
        const connection = await mysql.connection();
        try {
            await connection.query("update caj_placa set estado=0 where id=?", [placaId]);
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    },
    grabarTipo: async function (tipo) {
        const connection = await mysql.connection();
        try {
            await connection.query("insert into caj_tipo(descripcion,mostrarPlacas) values(?,?)", [tipo.descripcion, tipo.mostrarPlacas]);
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }

    },
    editarTipo: async function (tipo) {
        const connection = await mysql.connection();
        try {
            await connection.query("update caj_tipo set descripcion=?,mostrarPlacas=? where id=?", [tipo.descripcion, tipo.mostrarPlacas, tipo.id]);
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }

    },
    ultimoCorrelativoPorUpp: async function (upp) {

        const connection = await mysql.connection();
        try {
            const yearMonth = moment()
            const data = await connection.query("select anio ,caR.id, CONVERT(numero,UNSIGNED INTEGER)  numero from caj_requerimiento caR inner join caj_upp cu on cu.id=caR.uppId where cu.nombre=?  order by caR.id desc limit 1", [upp])
            console.log(data)
            let { anio = yearMonth.format("YYYY"), numero = 0 } = data[0].anio != null && data[0] || {}
            console.log("anio=", anio, numero)
            let correlativo = numero ? numero + 1 : 1
            if (yearMonth.format("YYYY") != anio) {
                correlativo = 1
                anio = yearMonth.format("YYYY")
            }

            return { correlativo: `${upp}_${anio}_${correlativo.toString().padStart(4, "0")}`, numero: correlativo };

        } catch (error) {
            throw error;
        } finally {
            await connection.release();
        }



    },

    listarResponsablesForUpp: async function (uppName) {
        const connection = await mysql.connection();
        try {
            const responsables = await connection.query("select r.* from caj_responsable r inner join caj_upp c on r.uppId=c.id where c.nombre=? and r.estado=1", [uppName]);
            return responsables
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    },

    listarUpp: async function () {
        const connection = await mysql.connection();
        try {
            const responsables = await connection.query("select * from caj_upp");
            return responsables
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }


    },
    transferir: async function () {




    },



    actualizacionGenericaCajaChica: async function (props = {}, id) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            await connection.query("update  caj_requerimiento set " + Object.keys(props).map(key => key + "=? ").join(",") + " where id=? ", [...Object.values(props), id]);
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");

            throw error;
        } finally {
            connection.release();
        }
    },
    queryActualizacionCajaChicaDetalleBatch: function (detalles = []) {
        return detalles.map(d => {
            const dataValues = Object.keys(d).filter(key => key != "id").map(key => `${key}=${d[key]}`).join()
            return `update caj_requerimientodetalle set ${dataValues} where id=${d.id}`
        }).join(";")
    }





};


module.exports = cajaChicaModel;
