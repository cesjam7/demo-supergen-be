const db = require('../dbconnection');
const { poolPromise } = require('../dbconnectionMSSQL');
const sendEmail = require('./sendEmail');
const usuario = require('./usuario');
const moment = require("moment");
const { resolve } = require('path');
const mysql = require("../dbconnectionPromise")
var fs = require('fs');
var Excel = require('exceljs');
var workbook = new Excel.Workbook();
const mysqlConnection = require("../dbConnectionClass");
const { isNumber } = require('lodash');
const states = [
    { estado: 1, name: "Creado" },
    { estado: 2, name: "En Aprobacion" },
    { estado: 3, name: "Aprobado Parcialmente" },
    { estado: 4, name: "Aprobado" },
    { estado: 5, name: "Eliminado" },
    { estado: 6, name: "Rechazado" }

]
const statesReqDet = [
    { estado: 0, name: "Creado" },
    { estado: 1, name: "Aprobado" },
    { estado: 2, name: "Cotizado" }
]
const urlForCcosto = [
    { ccosto: "granj", url: "/reqGranja" },
    { ccosto: "admin", url: "/reqAdministracion" },
    { ccosto: "plant", url: "/reqPlanta" }
]
moment.locale('es');

const requerimientos = {
    updateEstadoFechaCierreAndUsuarioRevisionFindReq: (req) => {
        return new Promise((resolve, reject) => {
            db.query("update requerimiento  SET Estado = ? ,Fecha_revision=?,idUsuarioRevision=? where idRequerimiento=? ", [2, new Date(), req.user, req.id], (err, result) => {
                if (err) reject(err)

                resolve()
            })
        })

    },
    updateEstadoFechaAprobacionAndUsuarioAprobacion: async (req, state = 3) => {
        const connection = await mysql.connection();
        await connection.query("update requerimiento  SET Estado = ? ,Fecha_aprobacion=?,idUsuario_aprobacion=? where idRequerimiento=? ", [state, new Date(), req.user, req.idRequerimiento]);
        connection.release();
    },
    /*    getDestinatariosFindTypeProccess: (typeProccess) => {
           console.log("destinatarios")
           return new Promise((reject, resolve) => {
               db.query(`select email from destinatarios_log where ${typeProccess}=1 and Estado=1`, (err, result) => {
                   console.log("error", err)
                   if (err) reject(err)
   
                   resolve(result);
               })
           })
       }, */
    estaPermitidoActualizarRequermiento: (reqId) => {
        return new Promise((resolve, reject) => {
            db.query("Select Estado from requerimiento where idRequerimiento=?", [reqId], (err, results) => {
                if (err) reject(err)
                resolve(results[0].Estado == 1)
            })
        })
    },
    actualizarObservacionRequerimientoDetalle: async function (requerimientoDetalles = []) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            const query = requerimientoDetalles.map((req) => `update requerimiento_det set observacion='${req.observacion}' where idRequerimientoDet=${req.id};`).join()
            await connection.query(query);
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }


    },
    cambiarEstadoACotizadoRequerimientoDetalle: async function (requerimientoDetalleIds = [], estado = 2) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            await connection.query("update requerimiento_det set Estado=? where IdRequerimientodet in(" + requerimientoDetalleIds.join() + ") ", [estado])
            await connection.query("COMMIT");

        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
        /*   return new Promise((resolve, reject) => {
              db.query("update requerimiento_det set Estado=2 where IdRequerimientodet in(" + requerimientoDetalleIds.join() + ") ", (err, result) => {
                  if (err) reject(err)
                  resolve()
              })
          }) */
    },
    eliminarRequerimiento: async (idRequerimiento) => {
        console.log("idRe", idRequerimiento)
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            await connection.query("update requerimiento set Estado=5 where idRequerimiento=?", [idRequerimiento])
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
    },
    getDestinesForProcessCierre: () => {
        return new Promise((resolve, reject) => {
            db.query(`select email from destinatarios_log where aprobacion_req=1 and Estado=1`, (err, result) => {
                console.log("error", err)
                if (err) reject(err)

                resolve(result);
            })
        })
    },
    getDestinesForAprobacionReq: () => {
        return new Promise((resolve, reject) => {
            db.query(`select email from destinatarios_log where aprobacion_prof_prov=1 and Estado=1`, (err, result) => {
                if (err) reject(err)
                resolve(result);

            })
        })
    },
    updateEstadoDelDetalleDelRequerimiento: function (detalle, estado = 1) {
        return new Promise((resolve, reject) => {
            db.query(`update requerimiento_det  SET Estado = ?  where IdRequerimientodet=? `, [detalle.id], (err, result) => {
                if (err) reject(err)
                resolve();
            })
        })
    },
    cierreReq: async function (req) {
        const requirimiento = this;
        return new Promise((resolve, reject) => {
            usuario.getusuarioById(req.user, async function (err, result) {
                if (err) {
                    reject(err)
                }
                try {
                    const user = result
                    const userRegister = await usuario.getusuarioByIdPromise(req.idUsuario);
                    await requirimiento.updateEstadoFechaCierreAndUsuarioRevisionFindReq(req)
                    const destinesEmail = (await requirimiento.getDestinesForProcessCierre()).map((destine) => (destine.email));
                    destinesEmail.push(user[0].email);
                    console.log("destineEmail", destinesEmail)
                    destinesEmail.push(userRegister[0].email)
                    const email = {
                        subject: `Requerimiento N° ${req.folio} ${req.ccosto} para Aprobar `,
                        html: `
                                              <div>
                                              <h2>Se ha generado el requerimiento para ser aprobado</h2> 
                                              <p>Fecha:${moment().format("YYYY-MM-DD H:mm")}</p>
                                              <p>Usuario:${user[0].Nombre}</p>
                                              <a href='http://159.65.47.181/supergen-fe/#!/seguimiento-logistica'>Ver</a>
                                              </div>
                                              `,
                        destines: destinesEmail,
                    }
                    sendEmail.sendEmail(email.subject, email.destines, email.html)
                    resolve({
                        message: "Corre enviado automaticamente por el portal web"
                    })
                } catch (error) {
                    reject(error)
                }
            })

        })
    },
    aprobarRequerimiento: async function (req) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            const numeroRequerimientoDetalle = (await connection.query("select Estado from requerimiento_det where idRequerimiento=? and Estado=1", [req.idRequerimiento])).length
            if (numeroRequerimientoDetalle == 0) {
                throw { message: "Al menos debe estar seleccionado un Item para poder aprobar el requerimiento" }
            }
            await this.updateEstadoFechaAprobacionAndUsuarioAprobacion(req, 4);
            const destinatarios = (await this.getDestinesForAprobacionReq()).map((destinataries) => destinataries.email);
            const user = await usuario.getusuarioByIdPromise(req.idUsuario);
            destinatarios.push(user[0].email)
            this.enviarCorreosAUsuarioAprobacion(req, destinatarios, req.ruta)
            await connection.query("COMMIT");
        } catch (error) {
            console.log(error)
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            await connection.release();

        }
    },
    guardarSeleccionRequerimentDet: async function (req) {
        const requeriment = this;
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            /*     const isAprobed = req.detalles.filter((detalle) => detalle.Estado).length == req.detalles.length
                if (isAprobed) {
                    const destinatarios = (await requeriment.getDestinesForAprobacionReq()).map((destinataries) => destinataries.email);
                    const user = await usuario.getusuarioByIdPromise(req.idUsuario);
                    destinatarios.push(user[0].email)
                    requeriment.enviarCorreosAUsuarioAprobacion(req, destinatarios, req.ruta)
                } 
    
                await requeriment.updateEstadoFechaAprobacionAndUsuarioAprobacion(req, isAprobed ? 4 : 3);*/
            console.log("rque", req)
            const updateBatchReqDet = req.detalles.map((detalle) => ({ Estado: detalle.Estado ? 1 : 0, cantidadAprobada: detalle.Cantidad_aprobada, id: detalle.id }))
                .map((object) => (`update requerimiento_det set Estado=${object.Estado},Cantidad_aprobada=${object.cantidadAprobada} where IdRequerimientodet=${object.id} and Estado!=2;`))
                .join("")
            await connection.query(updateBatchReqDet)
            await connection.query("COMMIT");
        } catch (error) {
            console.log(error)
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            await connection.release();

        }
    },
    enviarCorreosAUsuarioAprobacion: function (requeriment, userEmail, urlParsed) {
        const url = urlForCcosto.find((object) => object.ccosto == requeriment.ccosto).url || "defecto";
        const html = `<div>
        <h2>Se ha aprobado el requerimiento</h2> 
        <p>Fecha:${moment().format("YYYY-MM-DD H:mm")}</p>
        <a href=${urlParsed + url}>Ver</a>
        </div>`
        const subject = `Requerimiento N° ${moment().format("YYYY")}-${requeriment.CodRequerimiento} ${requeriment.ccosto} ha sido Aprobado `
        sendEmail.sendEmail(subject, [userEmail], html);
    },
    getFamiliasPorRequerimientoAprobados: (requerimentAproved = []) => {
        return new Promise((resolve, reject) => {
            db.query(`SELECT  req_det.familia_CONCAR as familia from requerimiento req 
            INNER JOIN requerimiento_det req_det on req.idRequerimiento=req_det.IdRequerimiento
            where req.idRequerimiento in(${requerimentAproved.join(",")}) GROUP BY req_det.familia_CONCAR`, (err, results) => {
                if (err) reject(err)
                resolve(results)
            })
        })
    },
    getRequerimientoDetPorFamiliasYRequerimientosSeleccionados: (familias = [], requerimientos = []) => {
        return new Promise((resolve, reject) => {
            db.query(`select req_det.IdRequerimientodet as id ,req_det.observacion,req_det.Codigo_prod as codigoProducto ,CONCAT(DATE_FORMAT(req.Fecha_Requerimiento,'%Y'),'-',req.CodRequerimiento) as nombreReq ,req_det.UM_CONCAR as um,req.ccosto,req_det.familia_CONCAR as familia,req_det.Iditem as 'order',Descripcion as descripcion,req_det.Cantidad_aprobada as cantidad from requerimiento_det req_det
            INNER JOIN requerimiento req on req.idRequerimiento=req_det.IdRequerimiento
            where req_det.familia_CONCAR in(?) and req.idRequerimiento in(?) and req_det.Estado=1`, [familias, requerimientos], (err, results) => {
                if (err) reject(err)
                resolve(results)
            })
        })
    },
    getRequerimientosAprobados: (fechaInicio, fechaFin) => {
        return new Promise((resolve, reject) => {
            db.query(`SELECT req.idRequerimiento as id,
            CONCAT(req.serie,lpad(req.CodRequerimiento,4,'0'),' ',req.ccosto)as name ,
            req.ccosto,req.IdTipoReq as tipoReq  FROM requerimiento req
              WHERE req.Estado=4 and req.Fecha_Registro BETWEEN '${moment(fechaInicio, "YYYY-MM-DD").format("YYYY-MM-DD")}' and '${moment(fechaFin, "YYYY-MM-DD").format("YYYY-MM-DD")}'   order by req.Fecha_Registro  desc`, (err, results) => {
                if (err) reject(err)
                resolve(results);
            })
        })
    },
    rechazarRequerimiento: async function (requerimientoId, usuarioRechazoId, textoRechazo) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            const requerimiento = (await connection.query("select * from requerimiento where idRequerimiento=?", [requerimientoId]))[0]
            const usuarioRechazo = (await usuario.getusuarioByIdPromise(usuarioRechazoId))[0]
            const usuarioRevision = (await usuario.getusuarioByIdPromise(requerimiento.idUsuarioRevision))[0]
            const html = `<div>
            <h2>Se ha rechazado el requerimiento</h2> 
            <p>Rechazado Por:${textoRechazo}</p>
            <p>Revisado Por:${usuarioRechazo.Nombre}</p>
            <p>Fecha:${moment().format("YYYY-MM-DD H:mm")}</p>
            </div>`
            const subject = `Requerimiento N° ${moment().format("YYYY")}-${requerimiento.CodRequerimiento} ${requerimiento.ccosto} ha sido Rechazado `
            await connection.query("update requerimiento set textoRechazo=?,Estado=6 where idRequerimiento=?", [textoRechazo, requerimientoId])
            await connection.query("COMMIT");
            sendEmail.sendEmail(subject, [usuarioRevision.email], html);
        } catch (error) {
            console.log(error)
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();

        }
    },
    regresarRequerimiento: async function (requerimientoId) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            const detalleRequerimiento = await connection.query(`select IdRequerimientodet as id from requerimiento_det where IdRequerimiento=${requerimientoId}`)
            const itemsCotizacion = await connection.query(`select idDetalle from cotizacion_det where idRequerimientoDet in(${detalleRequerimiento.map(d => d.id).join()})`)
            if (detalleRequerimiento.length == itemsCotizacion.length) {
                throw new Error(`No es posible regresar el requerimiento por que todos los items se encuentran cotizados`)
            }
            const requerimiento = (await connection.query("select * from requerimiento where idRequerimiento=?", [requerimientoId]))[0]
            await connection.query("update requerimiento set Estado=1 where idRequerimiento=?", [requerimientoId])

            await connection.query("COMMIT");

            const usuarioCreacion = (await usuario.getusuarioByIdPromise(requerimiento.idUsuario))[0]
            const html = `<div>
            <h2>Se ha regresado el requerimiento ${requerimiento.serie}-${requerimiento.CodRequerimiento} ${requerimiento.ccosto}</h2> 
            <p>Fecha:${moment().format("YYYY-MM-DD H:mm")}</p>
            </div>`
            const subject = `Requerimiento N° ${requerimiento.serie}-${requerimiento.CodRequerimiento} ${requerimiento.ccosto} ha sido Regresado `
            sendEmail.sendEmail(subject, [usuarioCreacion.email], html);
        } catch (error) {
            console.log(error)
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();

        }
    },
    exportarExcelConsultaLogistica: async function ({ año, unidadProductiva, nombreRequerimiento, requerimientoDetalleStatus = [] }) {
        try {
            const rutaTemplateHC = `./template/PLANTILLA_CONSREQUERIMIENTO.xlsx`;
            const alignmentStyle = { vertical: "middle", horizontal: "center", wrapText: true }

            const borderStylesC = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            if (fs.existsSync(`./template/consulta requerimiento.xlsx`)) {
                fs.unlinkSync(`./template/consulta requerimiento.xlsx`)
            }
            const wor = await workbook.xlsx.readFile(rutaTemplateHC)
            const sheet = wor.worksheets[0];
            sheet.getCell("D4").value = unidadProductiva
            sheet.getCell("D5").value = nombreRequerimiento == undefined ? '' : nombreRequerimiento
            sheet.getCell("D6").value = año
            for (let i = 0; i < requerimientoDetalleStatus.length; i++) {
                const requerimientoStatusActual = requerimientoDetalleStatus[i]
                const dataUpps = requerimientoStatusActual.upps ? requerimientoStatusActual.upps.reduce((prev, curr) => {
                    prev.guiaRemision += curr.C5_CNUMDOC + "\r"
                    prev.fechaRemision += moment(curr.C5_DFECDOC).format("YYYY-MM-DD") + "\r"
                    prev.transferido += curr.C6_NCANTID + "\r"
                    return prev
                }, { guiaRemision: "", fechaRemision: '', transferido: '' }) : { guiaRemision: "", fechaRemision: '', transferido: '' }
                sheet.getCell("B" + (i + 10)).value = i + 1
                sheet.getCell("B" + (i + 10)).border = borderStylesC
                sheet.getCell("B" + (i + 10)).alignment = alignmentStyle
                sheet.getCell("C" + (i + 10)).value = requerimientoStatusActual.Codigo_prod
                sheet.getCell("C" + (i + 10)).border = borderStylesC;
                sheet.getCell("C" + (i + 10)).alignment = alignmentStyle
                sheet.getCell("D" + (i + 10)).value = requerimientoStatusActual.Descripcion
                sheet.getCell("D" + (i + 10)).border = borderStylesC
                sheet.getCell("D" + (i + 10)).alignment = alignmentStyle
                sheet.getCell("E" + (i + 10)).value = requerimientoStatusActual.observacion
                sheet.getCell("E" + (i + 10)).border = borderStylesC
                sheet.getCell("E" + (i + 10)).alignment = alignmentStyle
                sheet.getCell("F" + (i + 10)).value = requerimientoStatusActual.familia
                sheet.getCell("F" + (i + 10)).border = borderStylesC
                sheet.getCell("F" + (i + 10)).alignment = alignmentStyle


                sheet.getCell("G" + (i + 10)).value = requerimientoStatusActual.requerida
                sheet.getCell("G" + (i + 10)).border = borderStylesC
                sheet.getCell("G" + (i + 10)).alignment = alignmentStyle

                sheet.getCell("H" + (i + 10)).value = ''
                sheet.getCell("H" + (i + 10)).border = borderStylesC
                sheet.getCell("H" + (i + 10)).alignment = alignmentStyle
                sheet.getCell("I" + (i + 10)).value = requerimientoStatusActual.cotizada
                sheet.getCell("I" + (i + 10)).alignment = alignmentStyle
                sheet.getCell("I" + (i + 10)).border = borderStylesC
                sheet.getCell("J" + (i + 10)).value = requerimientoStatusActual.totalAlmacenH ? requerimientoStatusActual.totalAlmacenH.C6_NCANTID : null
                sheet.getCell("J" + (i + 10)).border = borderStylesC
                sheet.getCell("J" + (i + 10)).alignment = alignmentStyle

                sheet.getCell("K" + (i + 10)).value = dataUpps.guiaRemision
                sheet.getCell("K" + (i + 10)).border = borderStylesC
                sheet.getCell("K" + (i + 10)).alignment = alignmentStyle
                sheet.getCell("L" + (i + 10)).value = dataUpps.fechaRemision
                sheet.getCell("L" + (i + 10)).border = borderStylesC
                sheet.getCell("L" + (i + 10)).alignment = alignmentStyle

                sheet.getCell("M" + (i + 10)).value = dataUpps.transferido
                sheet.getCell("M" + (i + 10)).border = borderStylesC
                sheet.getCell("M" + (i + 10)).alignment = alignmentStyle

                sheet.getCell("N" + (i + 10)).value = requerimientoStatusActual.cantidadRecepcionada
                sheet.getCell("N" + (i + 10)).border = borderStylesC
                sheet.getCell("N" + (i + 10)).alignment = alignmentStyle
            }
            await workbook.xlsx.writeFile(`./template/consulta requerimiento.xlsx`)

            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "/supergen-be/template/consulta requerimiento.xlsx"
            }
            return json;


        } catch (error) {
            throw error;
        }

    },


    estadisticaRequerimientoFiltradoPorFechaMayores: async function (fecha) {
        const connection = await mysql.connection();
        const estados = ["APROBADO", "COTIZADO",
            "COTIZACIONES POR APROBAR", "COTIZACIONES APROBADAS",
            "COTIZACION TRANSFERIDAS",
            'O/C', 'N/I']
        try {
            const requerimientos = await connection.query("select idRequerimiento ,concat(serie,lpad(CodRequerimiento,4,'0'),' ',ccosto,' ',ifnull(mes,'Aun no tiene un mes definido')) as nombre,concat(serie,lpad(CodRequerimiento,4,'0')) as code,Fecha_Registro from requerimiento where  Estado>=2 and Estado<>5 and Fecha_Registro>=? and tipo='mensual' and mes is not null", [fecha])
            /*  for (let i = 0; i < requerimientos.length; i++) {
                 requerimientos[i].estadistica = await this.estadisticaPorRequerimiento(requerimientos[i].idRequerimiento)
             } */
            for (let requerimiento of requerimientos) {
                requerimiento.estadistica = await this.estadisticaPorRequerimiento(requerimiento.idRequerimiento)
            }
            return { data: requerimientos, estados };
        } catch (error) {
            console.log("error", error)
            throw error;
        } finally {
            connection.release();

        }
    },
    drawFirmaAprobado: function (idUsuarioAprobado, texto, workbook, excel, lastRow, initColum = 2) {
        const borderStyles = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
        };
        const firmaImage = workbook.addImage({
            buffer: fs.readFileSync(`./firmas/${idUsuarioAprobado}/firma.jpg`),
            extension: "jpg",
        })
        const row = excel.getRow(lastRow + 1);
        row.getCell(initColum).value = `${texto}`
        row.getCell(initColum).border = borderStyles;
        excel.mergeCells(lastRow + 2, initColum, lastRow + 6, initColum)
        excel.addImage(firmaImage, {
            tl: { col: initColum - 1, row: lastRow + 1 },
            ext: { width: 80, height: 80 },
            editAs: "absolute"

        })
        return { lastRow, lastColumn: initColum + 1 }
    },
    exportarExcelRequerimientoGranja: async function (requeriment, mostrarUsuarioRevision = "s", mostrarUsuarioAprobacion = "n") {
        const rutaTemplateHC = `/template/Reporte requerimiento granja.xlsx`;
        const requerimientoFile = this;
        const borderStyles = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
        };
        try {
            requeriment.detalles = await this.getDetailByGranja(requeriment.id);
            if (fs.existsSync(`.${rutaTemplateHC}`)) {
                fs.unlinkSync(`.${rutaTemplateHC}`)
            }
            workbook.xlsx.readFile("./template/Plantilla Requerimiento Granja.xlsx").then(() => {
                return new Promise((resolve, reject) => {
                    workbook.eachSheet(async (worksheet, sheetId) => {
                        try {

                            worksheet.getCell("K6").value = `N° REQ: ${requeriment.CodRequerimiento}`
                            worksheet.getCell("A6").value = `SOLICITADO POR: ${requeriment.Solicitante.Desc_Solicitante}`
                            worksheet.getCell("A8").value = `FECHA: ${moment(requeriment.Fecha_Requerimiento).format("YYYY-MM-DD")}`
                            worksheet.getCell("L8").value = requeriment.IdTipoReq.Desc_tipoReq
                            let cellN = 12;
                            for (let i = 0; i < requeriment.detalles.length; i++) {
                                const c = requeriment.detalles[i];
                                worksheet.getCell('A' + (cellN)).value = c.Detalle.AR_FAMILIA
                                worksheet.getCell(`A${cellN}`).border = borderStyles;
                                worksheet.getCell('B' + (cellN)).value = c.Detalle.AR_CDESCRI
                                worksheet.getCell(`B${cellN}`).border = borderStyles;

                                worksheet.getCell('C' + (cellN)).value = c.observacion
                                worksheet.getCell(`C${cellN}`).border = borderStyles;
                                worksheet.getCell('D' + (cellN)).value = c.G1
                                worksheet.getCell(`D${cellN}`).border = borderStyles;
                                worksheet.getCell('E' + (cellN)).value = c.G2
                                worksheet.getCell(`E${cellN}`).border = borderStyles;
                                worksheet.getCell('F' + (cellN)).value = c.G3
                                worksheet.getCell(`F${cellN}`).border = borderStyles;
                                worksheet.getCell('G' + (cellN)).value = c.G4
                                worksheet.getCell(`G${cellN}`).border = borderStyles;
                                worksheet.getCell('H' + (cellN)).value = c.G5
                                worksheet.getCell(`H${cellN}`).border = borderStyles;
                                worksheet.getCell('I' + (cellN)).value = c.G6
                                worksheet.getCell(`I${cellN}`).border = borderStyles;
                                worksheet.getCell('J' + (cellN)).value = c.G7
                                worksheet.getCell(`J${cellN}`).border = borderStyles;
                                worksheet.getCell('K' + (cellN)).value = c.Gabriela
                                worksheet.getCell(`K${cellN}`).border = borderStyles;
                                worksheet.getCell('L' + (cellN)).value = c.Total
                                worksheet.getCell(`L${cellN}`).border = borderStyles;
                                worksheet.getCell('M' + (cellN)).value = c.Detalle.AR_UM
                                worksheet.getCell(`M${cellN}`).border = borderStyles;
                                worksheet.getCell('N' + (cellN)).value = c.Prioridad.Desc_Prioridad
                                worksheet.getCell(`N${cellN}`).border = borderStyles;
                                cellN++
                            }
                            let initRow = cellN
                            let initColumn = 2
                            if (requeriment.usuarioRevision && mostrarUsuarioRevision == "s") {
                                const { lastColumn, lastRow } = requerimientoFile.drawFirmaAprobado(requeriment.idUsuarioRevision, 'Aprobado por ' + requeriment.usuarioRevision, workbook, worksheet, initRow, initColumn)
                                initColumn = lastColumn + 1

                            }
                            if (requeriment.usuarioAprobacion && mostrarUsuarioAprobacion != "n") {
                                requerimientoFile.drawFirmaAprobado(requeriment.idUsuario_aprobacion, 'Revisado por ' + requeriment.usuarioAprobacion, workbook, worksheet, initRow, initColumn)


                            }
                            setTimeout(() => resolve(), 2000);
                        } catch (error) {
                            console.log("Errror", error)
                        }

                    })
                }).then(async () => {
                    workbook.xlsx.writeFile(`.${rutaTemplateHC}`).then(() => {
                        console.log("xls file is wrrites")
                    })

                })
            })
            json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: rutaTemplateHC
            }
        } catch (err) {
            console.log('error :>> ', err);
            json = {
                success: false,
                message: "Error en el servidor => /Cartilla/ExportExcel",
                rutaCM: rutaTemplateHC
            }
        }
        return json;
    },
    exportarExcelRequerimientoPlanta: async function (requeriment, mostrarUsuarioRevision = "s", mostrarUsuarioAprobacion = "n") {
        const borderStyles = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
        };
        const rutaTemplateHC = `/template/Reporte requerimiento planta.xlsx`;
        const requerimientoFile = this;
        try {
            if (fs.existsSync(`.${rutaTemplateHC}`)) {
                fs.unlinkSync(`.${rutaTemplateHC}`)
            }
            requeriment.detalles = await this.getDetalleByIdPlanta(requeriment.id)
            workbook.xlsx.readFile("./template/Plantilla Requerimiento Planta.xlsx").then(() => {
                return new Promise((resolve, reject) => {
                    workbook.eachSheet(async (worksheet, sheetId) => {
                        try {

                            worksheet.getCell("A6").value = `SOLICITADO POR: ${requeriment.Solicitante.Desc_Solicitante}`
                            worksheet.getCell("A8").value = `FECHA: ${moment(requeriment.Fecha_Requerimiento).format("YYYY-MM-DD")}`
                            worksheet.getCell("D6").value = `N° REQ: ${requeriment.CodRequerimiento}`
                            worksheet.getCell("E8").value = requeriment.IdTipoReq.Desc_tipoReq
                            let cellN = 12;
                            for (let i = 0; i < requeriment.detalles.length; i++) {
                                const c = requeriment.detalles[i];
                                worksheet.getCell('A' + (cellN)).value = c.Detalle.AR_FAMILIA
                                worksheet.getCell(`A${cellN}`).border = borderStyles;
                                worksheet.getCell('B' + (cellN)).value = c.Detalle.AR_CDESCRI
                                worksheet.getCell(`B${cellN}`).border = borderStyles;
                                worksheet.getCell('C' + (cellN)).value = c.observacion
                                worksheet.getCell(`C${cellN}`).border = borderStyles;
                                worksheet.getCell('D' + (cellN)).value = c.cantidad
                                worksheet.getCell(`D${cellN}`).border = borderStyles;
                                worksheet.getCell('E' + (cellN)).value = c.Detalle.AR_UM
                                worksheet.getCell(`E${cellN}`).border = borderStyles;
                                worksheet.getCell('F' + (cellN)).value = c.Prioridad.Desc_Prioridad
                                worksheet.getCell(`F${cellN}`).border = borderStyles;
                                cellN++
                            }

                            /*    if (requeriment.usuarioRevision) {
                                   requerimientoFile.drawFirmaAprobado(requeriment.idUsuarioRevision, requeriment.usuarioRevision, workbook, worksheet, cellN)
                               } */

                            let initRow = cellN
                            let initColumn = 2
                            if (requeriment.usuarioRevision && mostrarUsuarioRevision == "s") {
                                const { lastColumn, lastRow } = requerimientoFile.drawFirmaAprobado(requeriment.idUsuarioRevision, 'Aprobado por ' + requeriment.usuarioRevision, workbook, worksheet, initRow, initColumn)
                                initColumn = lastColumn + 1

                            }
                            if (requeriment.usuarioAprobacion && mostrarUsuarioAprobacion != "n") {
                                requerimientoFile.drawFirmaAprobado(requeriment.idUsuario_aprobacion, 'Revisado por ' + requeriment.usuarioAprobacion, workbook, worksheet, initRow, initColumn)


                            }
                            /*          if (requeriment.usuarioRevision && mostrarUsuarioRevision == "s") {
                                         requerimientoFile.drawFirmaAprobado(requeriment.idUsuarioRevision, 'Aprobado por ' + requeriment.usuarioRevision, workbook, worksheet, cellN)
                                     }
                                     if (requeriment.usuarioAprobacion && mostrarUsuarioAprobacion != "n") {
                                         requerimientoFile.drawFirmaAprobado(requeriment.idUsuario_aprobacion, 'Revisado por ' + requeriment.usuarioAprobacion, workbook, worksheet, cellN)
         
         
                                     } */
                            setTimeout(() => resolve(), 2000);
                        } catch (error) {
                            console.log("Errror", error)
                        }

                    })
                }).then(async () => {
                    workbook.xlsx.writeFile(`.${rutaTemplateHC}`).then(() => {
                        console.log("xls file is wrrites")
                    })

                })
            })
            json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: rutaTemplateHC
            }
        } catch (err) {
            console.log('error :>> ', err);
            json = {
                success: false,
                message: "Error en el servidor => /Cartilla/ExportExcel",
                rutaCM: rutaTemplateHC
            }
        }
        return json;

    },
    getDetailGeneral: async function (reqId, code) {
        var results = await db.query(`
        SELECT 
        det.*,
        sol.Desc_Solicitante,
        tipo.Desc_tipoReq,
        us.Nombre,
        pri.Desc_Prioridad  ,
        area.Desc_Area as descripcionArea
        FROM requerimiento_det det 
        left JOIN requerimiento req ON  req.idRequerimiento = det.IdRequerimiento
        left JOIN req_solicitante sol ON req.IdSolicitante = sol.IdSolicitante
        left JOIN req_tiporeq tipo ON req.IdTipoReq = tipo.IdTipoReq
        left JOIN req_prioridad pri ON det.IdPrioridad = pri.Cod_Prioridad
        left JOIN req_area area ON det.IdArea = area.IdArea
        left JOIN usuario us ON req.idUsuario = us.idUsuario  WHERE det.IdRequerimiento = ${reqId} order by req.CodRequerimiento asc`);
        codigos = results.map(p => "'" + p.Codigo_prod + "'");
        codigos = codigos.filter((thing, index, self) =>
            index === self.findIndex((t) => (
                t === thing
            ))
        )
        codigos = codigos.join(',');
        let response = []
        if (codigos != '') {
            const pool = await poolPromise;
            var query = `SELECT A.C5_CALMA,A.C5_CNUMDOC,A.C5_DFECDOC,C5_CRFTDOC,A.C5_CRFNDOC,A.C5_CNUMORD ,B.C6_CCODIGO,C6_CDESCRI, C6_NCANTID
            FROM RSFACCAR.dbo.AL0003MOVC A LEFT JOIN RSFACCAR.dbo.AL0003MOVD B ON B.C6_CTD=A.C5_CTD AND B.C6_CALMA=A.C5_CALMA  
            AND B.C6_CNUMDOC=A.C5_CNUMDOC and a.C5_CTD='GS'
            where A.C5_CRFNDO2 = '${code}' and C6_CCODIGO in (${codigos})`;
            response = await pool.query(query);
            response = response.recordset;
        }

        //console.log(response);C6_CDESCRI
        for (let index = 0; index < results.length; index++) {
            const element = results[index];
            let detalles = response.filter(p => p.C6_CDESCRI.trim() === element.Descripcion.trim())
            if (detalles.length > 0) {
                let total = detalles.reduce((counter, element) =>
                    counter + element.C6_NCANTID
                    , 0)
                results[index].sql_server_total = total;
            } else {
                results[index].sql_server_total = 0;
            }
        }
        const detalleMap = results.map((result) =>
        ({
            id: result.IdRequerimientodet,
            estado: result.Estado,
            Total: result.Cantidad,
            sql_server_total: result.sql_server_total,
            ...result,
            IdItem: result.Iditem,
            Detalle: { AR_CCODIGO: result.Codigo_prod, AR_FAMILIA: result.familia_CONCAR, AR_CDESCRI: result.Descripcion, AR_UM: result.UM_CONCAR },
            Prioridad: { IdPrioridad: result.IdPrioridad, Desc_Prioridad: result.Desc_Prioridad },
            Area: { idArea: result.IdArea, descripcion: result.descripcionArea },
            Fecha_atencion: result.Fecha_Atencion
        })
        )
        return detalleMap;
    },
    estadisticaPorRequerimiento: async function (requerimientoId, code) {
        try {
            const estadistica = [{ nombre: "APROBADO", valor: 0 }, { nombre: "COTIZADO", valor: 0 },
            { nombre: "COTIZACIONES POR APROBAR", valor: 0 }, { nombre: "COTIZACIONES APROBADAS", valor: 0 },
            { nombre: "COTIZACION TRANSFERIDAS", valor: 0 },
            { nombre: 'O/C', valor: 0 }, { nombre: 'N/I', valor: 0 }, { nombre: "Transferencia UPP", valor: 0 }]

            const requerimiento = await db.query(`select Fecha_Requerimiento,ccosto,mes from requerimiento where idRequerimiento=?`, [requerimientoId]);
            const fechaRequerimientoMoment = moment(requerimiento[0].Fecha_Requerimiento)
            const mes = requerimiento[0].mes || moment(requerimiento[0].Fecha_Requerimiento).format("MMMM")
            const ccosto = requerimiento[0].ccosto
            const requerimientoDet = await this.getDetailGeneral(requerimientoId, code);

            const numeroItems = requerimientoDet.length;
            const numeroTotalRequerimientoDetalleAprobados = requerimientoDet.filter((det) => det.Estado == 1 || det.Estado == 2).length
            if (numeroTotalRequerimientoDetalleAprobados == numeroItems) {
                estadistica[0].valor = 100;
                let ids = requerimientoDet.map((det) => det.id);
                const numeroTotalRequerimientoDetalleCotizado = await this.numeroDeDetalleRequerimientoCotizado(ids, [1, 4])
                const numeroTotalRequerimientoDetalleCotizacionPorAprobar = await this.numeroDeDetalleRequerimientoCotizado(requerimientoDet.map((det) => det.id), [2])
                const numeroTotalRequerimientoDetalleCotizacionTransferido = await this.numeroDeDetalleRequerimientoCotizado(requerimientoDet.map((det) => det.id), [5])
                const numeroTotalRequerimientoDetalleCotizacioneAprobadas = await this.numeroDeDetalleRequerimientoCotizado(requerimientoDet.map((det) => det.id), [3])
                estadistica[1].valor = parseFloat((numeroTotalRequerimientoDetalleCotizado / numeroItems) * 100).toFixed(2)
                estadistica[2].valor = parseFloat((numeroTotalRequerimientoDetalleCotizacionPorAprobar / numeroItems) * 100).toFixed(2)
                estadistica[3].valor = parseFloat((numeroTotalRequerimientoDetalleCotizacioneAprobadas / numeroItems) * 100).toFixed(2)
                estadistica[4].valor = parseFloat((numeroTotalRequerimientoDetalleCotizacionTransferido / numeroItems) * 100).toFixed(2)
                let res = await this.findOC(requerimientoId);
                estadistica[5].valor = res.oc.toFixed(2);
                estadistica[6].valor = res.ni.toFixed(2);
                console.log("mes", mes, "ccosto", ccosto, fechaRequerimientoMoment.format("YYYY-MM-DD"))
                const listaMesesPorUnidadProductiva = await this.filtrarRequerimientoFechaYUnidadProductivaMensual({ fecha: fechaRequerimientoMoment.format("YYYY"), unidadProductiva: ccosto })
                if (mes) estadistica[7].valor = (listaMesesPorUnidadProductiva.find(l => l.mes.toLowerCase().trim() == mes.toLowerCase().trim()).porcentajetotal * 100).toFixed(2)
            }
            return estadistica;
        } catch (error) {
            throw new Error(error)
        }
    },
    async findOC(id) {
        let ocs = 0, nis = 0;

        const data = await db.query(`call GetOcTotal(${id})`);
        if (data.length > 0) {
            const pool = await poolPromise;
            const { total, ids } = data[0][0];
            let response = await pool.query(`exec GetTotalOCNi '${ids}'`);
            if (response.recordset.length > 0) {
                const { total_oc, total_ni } = response.recordset[0];
                ocs = (parseInt(total_oc) * 100) / parseInt(total);
                nis = (parseInt(total_ni) * 100) / parseInt(total);
                console.log(nis)
                /* let ocIds = [];
     
                 for (let r of response.recordset) {
                     ocs += parseFloat(r.OC_NCANORD);
                     ocIds.push(r.OC_CNUMORD.trim());
                 }
                 if (ocIds.length > 0) {
     
                     for (let o in ocIds) {
                         let notes = await pool.query(`exec Lista_NotaIngreso '${o}'`);
                         if (notes.recordset.length > 0) {
                             for (let n of notes.recordset) {
                                 nis += parseFloat(n.C6_NCANTID);
                             }
                         }
                     }
                 }*/
            }

        }


        return {
            oc: ocs,
            ni: nis
        };

    },
    numeroDeDetalleRequerimientoCotizado: function (idsRequerimientoDetalle = [], estadosCotizacion = []) {
        return new Promise((resolve, reject) => {
            db.query("select count(DISTINCT cot_prov.idRequerimientoDet) totalRequerimientoDetalle from cotizacion_prov cot_prov inner join cotizacion cot on cot.idCotizacion=cot_prov.idCotizacion where idRequerimientoDet in(" + idsRequerimientoDetalle.join() + ") and cot.estado in(" + estadosCotizacion.join() + ")", (err, result) => {
                if (err) reject(err)
                resolve(result[0].totalRequerimientoDetalle)
            })
        })
    },
    calculoFechaEnvioCantidadEnviadaEstadoData: async function () {
        try {
            await mysqlConnection.insertar("requerimiento_log", [{ fecha: moment().format("YYYY-MM-DD HH:mm:ss") }])
            const fechaLogistica = await mysqlConnection.ejecutarQueryPreparado("select valorLongText from variables_generales where idvg=15", {}, true)
            if (!fechaLogistica) throw new Error(`No exite una configuracion para la fecha de logistica`)
            const requerimientosCabecera = await mysqlConnection.ejecutarQueryPreparado(` select 
              rdf.idRequerimiento,
              concat(
                  rdf.serie,
                  lpad(rdf.CodRequerimiento,4,'0'),
                  ' ',
                  rdf.ccosto,
                  ' ',
                  rdf.tipo,
                  '-',
                  COALESCE(rdf.mes,rdf.Fecha_requerimiento),
                  '      ',
                  cast(SUM(COALESCE(rd.porcentajeRecepcion,0)) as decimal(10,2)),
                  '%'
              ) as nombre,
              concat(rdf.serie,lpad(rdf.CodRequerimiento,4,'0')) as code
              ,rdf.Fecha_requerimiento
              from requerimiento rdf  inner join requerimiento_det rd on rd.IdRequerimiento=rdf.idRequerimiento where   rdf.Fecha_Registro>='${fechaLogistica.valorLongText}' and rdf.estado>=2 and rdf.estado<>5 and rdf.mes is not null
              GROUP BY rdf.idRequerimiento`, {})

            for (const requerimiento of requerimientosCabecera) {
                requerimiento.detalles = await this.statusPerRequirement(requerimiento.idRequerimiento, requerimiento.code)
                requerimiento.Fecha_Requerimiento = moment(requerimiento.Fecha_requerimiento, "YYYY-MM-DD").utc()
                for (const detalle of requerimiento.detalles) {
                    //  if (detalle.IdRequerimientodet == 102597) {

                    let estadoConsolidado = "Pendiente"
                    const fechas = detalle.upps ? detalle.upps.map(d => moment(d.C5_DFECDOC).utc()) : []
                    const fechasOrdendas = fechas.sort((a, b) => {
                        if (b.isBefore(a)) return -1
                        if (a.isBefore(b)) return 1
                        return 0
                    })
                    const fechaMasRecienteMoment = fechasOrdendas[0] ? fechasOrdendas[0] : null
                    detalle.cantidadEnviada = isNumber(detalle.totalUpps) ? detalle.totalUpps : null
                    detalle.fechaEnvio = null
                    detalle.tiempo = null
                    detalle.conformidad = null
                    if (detalle.Cantidad_aprobada == detalle.cantidadEnviada) {
                        estadoConsolidado = "COMPLETO"
                    }
                    if (detalle.Cantidad_aprobada < detalle.cantidadEnviada && detalle.cantidadEnviada > 0) {
                        estadoConsolidado = "Parcial"
                    }
                    detalle.estadoConsolidado = estadoConsolidado
                    if ((detalle.cantidadEnviada == 0 || estadoConsolidado == 'Pendiente') && !fechaMasRecienteMoment) {
                        detalle.conformidad = "F"
                        continue
                    }
                    const fechaProcesamiento = moment(`${fechaMasRecienteMoment.utc().format("YYYY-MM")}-05`).utc()
                    const fechaMaximoAtencionPrioridadUrgente = moment(`${requerimiento.Fecha_Requerimiento.format("YYYY-MM")}-15`).utc()
                    const fechaMaximoAtencionPrioridadNormal = moment(`${requerimiento.Fecha_Requerimiento.clone().add(1, "M").utc().format("YYYY-MM")}-05`)
                    detalle.fechaEnvio = fechaMasRecienteMoment.format("YYYY-MM-DD")
                    detalle.tiempo = Number(fechaMasRecienteMoment.diff(fechaProcesamiento, "days"))

                    if (detalle.prioridad.trim() == 'Urgente') {
                        if (fechaMasRecienteMoment.isSameOrBefore(fechaMaximoAtencionPrioridadUrgente)) {
                            detalle.conformidad = "C"

                        }

                        if (fechaMasRecienteMoment.isAfter(fechaMaximoAtencionPrioridadUrgente)) {

                            detalle.conformidad = "NC"
                        }
                    }
                    if (detalle.prioridad.trim() == 'Normal') {
                        if (fechaMasRecienteMoment.isSameOrBefore(fechaMaximoAtencionPrioridadNormal)) {
                            detalle.conformidad = "C"
                        }
                        if (fechaMasRecienteMoment.isAfter(fechaMaximoAtencionPrioridadNormal)) {
                            detalle.conformidad = "NC"
                        }
                    }



                    // }



                }


            }
            let dataActualizacion = []
            for (const requerimiento of requerimientosCabecera) {
                dataActualizacion = dataActualizacion.concat(requerimiento.detalles.map(d => `update requerimiento_det set cantidadEnviada=${d.cantidadEnviada},fechaEnvio=${d.fechaEnvio ? `'${d.fechaEnvio}'` : null},estadoConsolidado=${d.estadoConsolidado ? `'${d.estadoConsolidado}'` : null},tiempo=${d.tiempo},conformidad=${d.conformidad ? `'${d.conformidad}'` : null} where IdRequerimientodet=${d.IdRequerimientodet}`))
            }
            for (let i = 0; i < dataActualizacion.length; i += 700) {
                const queryActualizacionDetalle = dataActualizacion.slice(i, i + 700)
                await mysqlConnection.ejecutarQueryPreparado(queryActualizacionDetalle.join(";"), {})

            }
        } catch (error) {
            throw error
        }




    }


    ,


    filtrarRequerimientoFechaYUnidadProductiva: function (params) {
        return new Promise((resolve, reject) => {
            db.query(`
            select 
            rdf.idRequerimiento,
            concat(
                rdf.serie,
                lpad(rdf.CodRequerimiento,4,'0'),
                ' ',
                rdf.ccosto,
                ' ',
                rdf.tipo,
                '-',
                COALESCE(rdf.mes,rdf.Fecha_requerimiento),
                '      ',
                cast(SUM(COALESCE(rd.porcentajeRecepcion,0)) as decimal(10,2)),
                '%'
            ) as nombre,
            concat(rdf.serie,lpad(rdf.CodRequerimiento,4,'0')) as code
            from requerimiento rdf  inner join requerimiento_det rd on rd.IdRequerimiento=rdf.idRequerimiento where   DATE_FORMAT(rdf.Fecha_Registro,'%Y')=? and rdf.ccosto=? and rdf.estado>=2 and rdf.estado<>5 and rdf.mes is not null
            GROUP BY rdf.idRequerimiento;
            `, [params.fecha, params.unidadProductiva], (error, results) => {
                if (error) reject(error)
                resolve(results);

            })
        })
    },
    filtrarRequerimientoFechaYUnidadProductivaMensual: async function (params) {
        try {
            var data = await db.query(`
            select 
            rdf.idRequerimiento,
            concat(
                rdf.serie,
                lpad(rdf.CodRequerimiento,4,'0'),
                ' ',
                rdf.ccosto,
                ' ',
                rdf.tipo,
                '-',
                COALESCE(rdf.mes,rdf.Fecha_Registro)
            ) as nombre,
            concat(rdf.serie,lpad(rdf.CodRequerimiento,4,'0')) as code,
            MONTH(rdf.Fecha_Registro) as Mes
            from requerimiento rdf 
            inner join requerimiento_det rd on rd.IdRequerimiento=rdf.idRequerimiento
            where YEAR(rdf.Fecha_Registro)=?
            and rdf.ccosto=?
            and rdf.estado>=2
            and rdf.estado<>5
            and rdf.tipo = 'mensual' 
            GROUP BY rdf.idRequerimiento
            ;
            `, [params.fecha, params.unidadProductiva]);

            var ids = data.map(p => p.idRequerimiento).join(',');
            var codigos = data.map(p => "'" + p.code.trim() + "'").join(',');

            var redata = await this.statusAllRequirement(ids, codigos);

            var MesDeInicio = moment(params.fecha + '-01-01', 'YYYY-MM-DD');
            var MesDeFin = moment(params.fecha + '-12-01', 'YYYY-MM-DD');
            var exporteddata = [];
            while (MesDeInicio.isSameOrBefore(MesDeFin)) {

                var datadelmes = redata.filter((r) => {
                    return moment(r.Fecha_Requerimiento).month() == MesDeInicio.month()
                })
                var totalrequerido = datadelmes.reduce((acu, ele) => (
                    acu + ele.requerida
                ), 0);
                var totaltransferida = datadelmes.reduce((acu, ele) => (
                    acu + parseInt(ele.sql_server_total)
                ), 0);
                var totalcantidadaprobada = datadelmes.reduce((acu, ele) => (
                    acu + parseInt(ele.Cantidad_aprobada)
                ), 0);
                var idRequerimiento = datadelmes.map(ele => (
                    ele.IdRequerimiento
                ));
                const porcentajetotal = datadelmes.reduce((acu, ele) => (
                    acu + parseFloat(ele.porcentaje)
                ), 0);
                //porcentajetotal = ((1/datadelmes.length)*(totaltransferida/totalcantidadaprobada)).toFixed(2);
                var codes = datadelmes.filter(ele => ele.codes != undefined);
                codes = codes.map(ele => ele.codes);
                if (totalrequerido > 0) {
                    if (totaltransferida > 0) {
                        //var porcentaje = ((totaltransferida/totalrequerido)*100).toFixed(2) + " %";
                        //var porcentaje = (porcentajetotal*(1/datadelmes.length)).toFixed(2) + " %";
                    } else {
                        var porcentaje = (0).toFixed(2) + " %";
                    }

                    const obj = {
                        mes: MesDeInicio.format('MMMM'),
                        totalrequerido: totalrequerido,
                        totaltransferida: totaltransferida,
                        porcentaje: porcentaje,
                        porcentajetotal,
                        idRequerimiento: idRequerimiento.join(','),
                        codes: codes.join(',')
                    }
                    exporteddata.push({ ...obj });
                }
                MesDeInicio.add(1, "M")
            }
            return exporteddata;
        } catch (error) {
            console.log(error.message);
        }
    },
    exportarExcelRequerimientoAdministracion: async function (requeriment, mostrarUsuarioRevision = "s", mostrarUsuarioAprobacion = "n") {
        const rutaTemplateHC = `/template/Reporte Administracion.xlsx`;
        const borderStyles = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
        };
        const requerimientoFile = this;
        try {
            requeriment.detalle = await this.getDetalleByIdAdmin(requeriment.idRequerimiento)
            if (fs.existsSync(`.${rutaTemplateHC}`)) {
                fs.unlinkSync(`.${rutaTemplateHC}`)
            }
            workbook.xlsx.readFile("./template/Plantilla Requerimiento Administracion.xlsx").then(() => {
                return new Promise((resolve, reject) => {

                    workbook.eachSheet(async (worksheet, sheetId) => {
                        try {

                            worksheet.getCell("A6").value = `SOLICITADO POR: ${requeriment.Solicitante.Desc_Solicitante}`

                            worksheet.getCell("A8").value = `FECHA: ${requeriment.Fecha_Requerimiento}`
                            worksheet.getCell("E6").value = `N° REQ: ${requeriment.CodRequerimiento}`
                            let cellN = 12;
                            for (let i = 0; i < requeriment.detalle.length; i++) {
                                const c = requeriment.detalle[i];
                                worksheet.getCell('A' + (cellN)).value = i + 1;
                                worksheet.getCell(`A${cellN}`).border = borderStyles;
                                worksheet.getCell('B' + (cellN)).value = c.Detalle.AR_FAMILIA
                                worksheet.getCell(`B${cellN}`).border = borderStyles;
                                worksheet.getCell('C' + (cellN)).value = c.Detalle.AR_CDESCRI
                                worksheet.getCell(`C${cellN}`).border = borderStyles;
                                worksheet.getCell('D' + (cellN)).value = c.observacion
                                worksheet.getCell(`D${cellN}`).border = borderStyles;
                                worksheet.getCell('E' + (cellN)).value = c.Area.Desc_Area
                                worksheet.getCell(`E${cellN}`).border = borderStyles;
                                worksheet.getCell('F' + (cellN)).value = c.cantidad
                                worksheet.getCell(`F${cellN}`).border = borderStyles;
                                worksheet.getCell('G' + (cellN)).value = c.Unidadmedida
                                worksheet.getCell(`G${cellN}`).border = borderStyles;
                                worksheet.getCell('H' + (cellN)).value = c.Prioridad.Desc_Prioridad
                                worksheet.getCell(`H${cellN}`).border = borderStyles;
                                cellN++
                            }

                            /*  if (requeriment.usuarioRevision) {
                                 requerimientoFile.drawFirmaAprobado(requeriment.idUsuarioRevision, requeriment.usuarioRevision, workbook, worksheet, cellN)
                             } */
                            if (requeriment.usuarioRevision && mostrarUsuarioRevision == "s") {
                                requerimientoFile.drawFirmaAprobado(requeriment.idUsuarioRevision, 'Aprobado por ' + requeriment.usuarioRevision, workbook, worksheet, cellN)
                            }
                            if (requeriment.usuarioAprobacion && mostrarUsuarioAprobacion != "n") {
                                requerimientoFile.drawFirmaAprobado(requeriment.idUsuario_aprobacion, 'Revisado por ' + requeriment.usuarioAprobacion, workbook, worksheet, cellN)


                            }
                            setTimeout(() => resolve(), 2000);
                        } catch (error) {
                            console.log("Errror", error)
                        }

                    })
                }).then(async () => {
                    workbook.xlsx.writeFile(`.${rutaTemplateHC}`).then(() => {
                        console.log("xls file is wrrites")
                    })

                })
            })
            json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: rutaTemplateHC
            }
        } catch (err) {
            console.log('error :>> ', err);
            json = {
                success: false,
                message: "Error en el servidor => /Cartilla/ExportExcel",
                rutaCM: rutaTemplateHC
            }
        }
        return json;
    },
    getHistoricForProduct: async (productCode) => {
        try {
            const pool = await poolPromise
            const result = await pool.request()
                .query(`Exec dbo.SP_Log_Historico_Precio '${productCode}'`)
            return result.recordset;
        } catch (error) {
            throw new Error(error)
        }
    },


    exportarExcelRequerimientoConsolidado: async ({ lotes = [], requerimientoData = [] }) => {

        try {
            const rutaTemplateHC = `./template/plantilla requerimiento consolidado.xlsx`;
            const alignmentStyle = { vertical: "middle", horizontal: "center", wrapText: true }

            const borderStylesC = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            const fondoCantidadIngreso = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '8FAADC' }
            }
            if (fs.existsSync(`./template/consulta requerimiento consolidado.xlsx`)) {
                fs.unlinkSync(`./template/consulta requerimiento consolidado.xlsx`)
            }
            const wor = await workbook.xlsx.readFile(rutaTemplateHC)
            const sheet = wor.worksheets[0];
            const rowHeaderUnidadProductiva = sheet.getRow(2)
            const rowUnidadProductivaNombre = sheet.getRow(1)
            rowUnidadProductivaNombre.getCell(6).value = "UNIDAD PRODUCTIVA"
            rowUnidadProductivaNombre.getCell(6).alignment = alignmentStyle
            rowUnidadProductivaNombre.getCell(6).border = borderStylesC
            rowUnidadProductivaNombre.getCell(6).fill = fondoCantidadIngreso
            sheet.mergeCells(1, 6, 1, 5 + lotes.length)

            for (let j = 0; j < lotes.length; j++) {
                rowHeaderUnidadProductiva.getCell((j + 6)).value = lotes[j]
                rowHeaderUnidadProductiva.getCell((j + 6)).alignment = alignmentStyle
                rowHeaderUnidadProductiva.getCell((j + 6)).border = borderStylesC
                rowHeaderUnidadProductiva.getCell((j + 6)).fill = fondoCantidadIngreso
            }
            rowHeaderUnidadProductiva.getCell((lotes.length + 6)).value = "Total"
            rowHeaderUnidadProductiva.getCell((lotes.length + 6)).alignment = alignmentStyle
            rowHeaderUnidadProductiva.getCell((lotes.length + 6)).border = borderStylesC
            for (let i = 0; i < requerimientoData.length; i++) {
                const requerimientoStatusActual = requerimientoData[i]
                const row = sheet.getRow(i + 3)
                sheet.getCell("A" + (i + 3)).value = requerimientoStatusActual.familia
                sheet.getCell("A" + (i + 3)).border = borderStylesC
                sheet.getCell("A" + (i + 3)).alignment = alignmentStyle
                sheet.getCell("B" + (i + 3)).value = requerimientoStatusActual.Descripcion
                sheet.getCell("B" + (i + 3)).border = borderStylesC;
                sheet.getCell("B" + (i + 3)).alignment = alignmentStyle
                sheet.getCell("C" + (i + 3)).value = requerimientoStatusActual.observacion
                sheet.getCell("C" + (i + 3)).border = borderStylesC
                sheet.getCell("C" + (i + 3)).alignment = alignmentStyle
                sheet.getCell("D" + (i + 3)).value = requerimientoStatusActual.UM_CONCAR
                sheet.getCell("D" + (i + 3)).border = borderStylesC
                sheet.getCell("D" + (i + 3)).alignment = alignmentStyle
                sheet.getCell("E" + (i + 3)).value = requerimientoStatusActual.Desc_Prioridad
                sheet.getCell("E" + (i + 3)).border = borderStylesC
                sheet.getCell("E" + (i + 3)).alignment = alignmentStyle


                sheet.getCell("G" + (i + 3)).value = requerimientoStatusActual.Cantidad_aprobada
                sheet.getCell("G" + (i + 3)).border = borderStylesC
                sheet.getCell("G" + (i + 3)).alignment = alignmentStyle

                for (let j = 0; j < requerimientoStatusActual.valores.length; j++) {
                    const valor = requerimientoStatusActual.valores[j]
                    row.getCell((j + 6)).value = valor
                    row.getCell((j + 6)).border = borderStylesC
                    row.getCell((j + 6)).alignment = alignmentStyle
                }
                row.getCell((requerimientoStatusActual.valores.length + 6)).value = requerimientoStatusActual.total
                row.getCell((requerimientoStatusActual.valores.length + 6)).border = borderStylesC
                row.getCell((requerimientoStatusActual.valores.length + 6)).alignment = alignmentStyle


            }
            await workbook.xlsx.writeFile(`./template/consulta requerimiento consolidado.xlsx`)

            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "/supergen-be/template/consulta requerimiento consolidado.xlsx"
            }
            return json;


        } catch (error) {
            console.error(error);
            throw error;
        }

    },


    estadisticaRequerimientoFiltradoPorFechaMayores: async function (fecha) {
        const connection = await mysql.connection();
        const estados = ["APROBADO", "COTIZADO",
            "COTIZACIONES POR APROBAR", "COTIZACIONES APROBADAS",
            "COTIZACION TRANSFERIDAS",
            'O/C', 'N/I']
        try {
            const requerimientos = await connection.query("select idRequerimiento ,concat(serie,lpad(CodRequerimiento,4,'0'),' ',ccosto,' ',ifnull(mes,'Aun no tiene un mes definido')) as nombre,concat(serie,lpad(CodRequerimiento,4,'0')) as code,Fecha_Registro from requerimiento where  Estado>=2 and Estado<>5 and Fecha_Registro>=? and tipo='mensual' and mes is not null", [fecha])
            /*  for (let i = 0; i < requerimientos.length; i++) {
                 requerimientos[i].estadistica = await this.estadisticaPorRequerimiento(requerimientos[i].idRequerimiento)
             } */
            for (let requerimiento of requerimientos) {
                requerimiento.estadistica = await this.estadisticaPorRequerimiento(requerimiento.idRequerimiento)
            }
            return { data: requerimientos, estados };
        } catch (error) {
            console.log("error", error)
            throw error;
        } finally {
            connection.release();

        }

    },
    consultaRequerimientoConsolidado: async ({ periodo }) => {
        const connection = await mysql.connection();
        try {
            const requerimientos = await connection.query(`select det.familia_CONCAR as familia,det.UM_CONCAR,DATE_FORMAT(req.Fecha_Registro,'%Y%m') fechaRegistro,TRIM(det.Descripcion) Descripcion,concat(req.serie,lpad(req.CodRequerimiento,4,'0')) as folio, COALESCE(det.observacion, '') observacion,req.tipo,rp.Desc_Prioridad,det.Cantidad from requerimiento req inner join requerimiento_det det on det.IdRequerimiento=req.idRequerimiento
            inner join req_prioridad rp on rp.IdPrioridad=det.IdPrioridad
            where req.mes is not null and DATE_FORMAT(req.Fecha_Registro,'%Y%m')=? and req.estado<>6
            GROUP BY folio ,COALESCE(det.observacion, ''),TRIM(det.Descripcion);`, [periodo])
            const requerimientoData = []

            const lotes = await connection.query("select concat(req.serie,lpad(req.CodRequerimiento,4,'0')) as folio from requerimiento req where req.mes is not null and  DATE_FORMAT(req.Fecha_Registro,'%Y%m')=? GROUP BY folio; ", [periodo])
            const lotesNombres = lotes.map(l => l.folio)
            for (const requerimiento of requerimientos) {
                const requerimientosFiltrados = requerimientos.filter(r => r.Descripcion == requerimiento.Descripcion && r.observacion == requerimiento.observacion)
                const lotesFolioPorRequerimiento = requerimientosFiltrados.map(l => l.folio)
                const totalCantidadPorRequerimiento = requerimientosFiltrados.reduce((prev, curr) => prev += curr.Cantidad, 0)
                requerimiento.total = totalCantidadPorRequerimiento
                requerimiento.valores = lotesNombres.map(l => {
                    const lote = requerimientosFiltrados.find(r => r.folio == l)
                    return lote ? lote.Cantidad : 0
                })
                if (!requerimientoData.find(r => r.Descripcion == requerimiento.Descripcion && r.observacion == requerimiento.observacion)) {

                    requerimientoData.push({ ...requerimiento, total: totalCantidadPorRequerimiento })

                }
            }

            return { lotes: lotesNombres, requerimientoData }
        } catch (error) {
            console.log(error)
            throw error;
        } finally {
            connection.release();

        }
    },
    getAllreqFindCcosto: async (ccosto, fechaInicio = "", fechaFin = "", estadoRequerimiento) => {
        ccosto = ccosto == "todos" ? '' : ccosto;
        console.log("fecgas", fechaFin, "in", fechaInicio)
        try {
            let totalNumeroPorRequerimientos = []
            let rows = await db.query(`SELECT req.*,DATE_FORMAT(req.Fecha_revision,'%Y-%m-%d') as Fecha_revision,
            userAprob.Nombre as usuarioAprobacion,DATE_FORMAT(req.Fecha_Registro,'%Y-%m-%d') as Fecha_Registro,
            userRevision.Nombre as usuarioRevision,DATE_FORMAT(req.Fecha_Requerimiento,'%Y-%m-%d') as 
            Fecha_Requerimiento, sol.Desc_Solicitante,sol.Cod_Solicitante,tipo.Cod_TipoReq, tipo.Desc_tipoReq,
             us.Nombre,concat(req.serie,lpad(req.CodRequerimiento,4,'0')) as folio
            FROM requerimiento req
            INNER JOIN req_solicitante sol ON req.IdSolicitante = sol.Cod_Solicitante
            INNER JOIN req_tiporeq tipo ON req.IdTipoReq = tipo.IdTipoReq
            INNER JOIN usuario as us ON req.idUsuario = us.idUsuario 
            LEFT JOIN usuario as userRevision on userRevision.idUsuario=req.idUsuarioRevision
LEFT JOIN  usuario as userAprob on userAprob.idUsuario=req.idUsuario_aprobacion
            WHERE req.ccosto like  '%${ccosto}%' and req.Estado<> 5 and Fecha_Registro  BETWEEN '${moment(fechaInicio, "YYYY-MM-DD").format("YYYY-MM-DD")}' and  '${moment(fechaFin, "YYYY-MM-DD").format("YYYY-MM-DD")}'  order by req.idRequerimiento desc`);
            console.log(rows[0])
            if (rows.length > 0) {
                totalNumeroPorRequerimientos = await db.query(`select count(Codigo_prod) nro,A.idRequerimiento from requerimiento A 
                left join requerimiento_det B on B.IdRequerimiento=A.idRequerimiento
                where A.idRequerimiento in(${rows.map(d => d.idRequerimiento).join()}) and B.Estado='1' GROUP BY A.idRequerimiento
                 `)
            }


            let rowsMap = rows.map((row) => {
                const stateName = states.find((state) => state.estado == row.Estado)
                if (row.Estado == 4) {
                    const total = totalNumeroPorRequerimientos.find(d => d.idRequerimiento == row.idRequerimiento)
                    row.nro = total ? total : 0
                    row.estadoNroRequerimientos = row.nro == 0 ? 'Cotizado' : 'Pendiente'

                }
                return { ...row, EstadoName: stateName ? stateName.name : "" }
            })
            if (estadoRequerimiento && estadoRequerimiento != 'todos') {
                const requerimientosAprobados = rowsMap.filter(d => d.Estado == 4)
                const requerimientosFiltrado = requerimientosAprobados.filter(d => d.estadoNroRequerimientos == estadoRequerimiento)
                rowsMap = rowsMap.filter(d => d.Estado != 4).concat(requerimientosFiltrado)
            }
            if (rows.length == 0) {
                return {
                    success: false,
                    message: `No se encontraron registros`,
                    rows
                }
            }
            return {
                success: true,
                rows: rowsMap
            }
        } catch (error) {
            console.log(error)
            return {
                err: error,
                message: 'Error al obtener todos los requerimientos',
                err_code: 'ERR_GET_ALL_REQS_001'
            }
        }
    },
    getAllreqGranja: async (granja) => {
        try {
            let rows = await db.query(`SELECT req.*, sol.Desc_Solicitante, tipo.Desc_tipoReq, us.Nombre FROM requerimiento req
            INNER JOIN req_solicitante sol ON req.IdSolicitante = sol.IdSolicitante
            INNER JOIN req_tiporeq tipo ON req.IdTipoReq = tipo.IdTipoReq
            INNER JOIN usuario us ON req.idUsuario = us.idUsuario WHERE ccosto = 'granj' order by req.idRequerimiento asc`);
            if (rows.length == 0) {
                return {
                    success: false,
                    message: `No se encontraron registros`,
                    rows
                }
            }
            return {
                success: true,
                rows
            }
        } catch (error) {
            console.log(error)
            return {
                err: error,
                message: 'Error al obtener todos los requerimientos',
                err_code: 'ERR_GET_ALL_REQS_001'
            }
        }
    },
    getAllreqAdmin: async (admin) => {
        try {
            let rows = await db.query(`SELECT req.*, sol.Desc_Solicitante, tipo.Desc_tipoReq, us.Nombre FROM requerimiento req
            INNER JOIN req_solicitante sol ON req.IdSolicitante = sol.IdSolicitante
            INNER JOIN req_tiporeq tipo ON req.IdTipoReq = tipo.IdTipoReq
            INNER JOIN usuario us ON req.idUsuario = us.idUsuario WHERE ccosto = '${admin}' order by req.idRequerimiento asc`);
            if (rows.length == 0) {
                return {
                    success: false,
                    message: `No se encontraron registros`,
                    rows
                }
            }
            return {
                success: true,
                rows
            }
        } catch (error) {
            console.log(error)
            return {
                err: error,
                message: 'Error al obtener todos los requerimientos admin',
                err_code: 'ERR_GET_ALL_REQS_001'
            }
        }
    },
    addReqGranja: async (det) => {
        return new Promise((resolve, reject) => {
            let serie = `${(new Date()).getFullYear()}G`;
            db.query(`INSERT INTO requerimiento (CodRequerimiento,IdSolicitante,Fecha_Requerimiento,
                Fecha_Registro, IdTipoReq, idUsuario, ccosto,serie,tipo,mes) 
                 values(?,?,?,?,?,?,?,?,?,?)`, [det.CodRequerimiento, det.Solicitante.Cod_Solicitante,
            det.Fecha_Requerimiento, new Date(), det.IdTipoReq.Cod_TipoReq, det.idUsuario,
                "granj", serie, det.tipo, det.mes], (err, result) => {
                    if (err) {
                        reject(err)
                    }
                    const idRequerimiento = result.insertId
                    const detalleMap = det.detalles.map((detalle) => { return [idRequerimiento, detalle.IdItem, detalle.Detalle.AR_CCODIGO.trim(), detalle.Detalle.AR_CDESCRI.trim(), detalle.Total, detalle.Total, detalle.G1, detalle.G2, detalle.G3, detalle.G4, detalle.G5, detalle.G6, detalle.G7, detalle.Gabriela, detalle.Detalle.AR_FAMILIA, detalle.Prioridad.IdPrioridad, detalle.Fecha_atencion, new Date(), detalle.Detalle.AR_UM, detalle.observacion] });
                    db.query(`INSERT INTO requerimiento_det(IdRequerimiento,IdItem,Codigo_prod,Descripcion, Cantidad,Cantidad_aprobada,G1,G2,G3,G4,G5,G6,G7,Gabriela,familia_CONCAR,IdPrioridad, Fecha_Atencion, Fecha_Registro,UM_CONCAR,observacion) 
                               VALUES ?`, [detalleMap], (err, result) => {
                        if (err) {
                            reject(err)
                        }
                        resolve({
                            success: true,
                            message: "Registro exitoso"
                        })
                    })
                })
        })

    },
    addReqPlanta: (det) => {
        return new Promise((resolve, reject) => {
            let serie = `${(new Date()).getFullYear()}P`;
            db.query(`INSERT INTO requerimiento(CodRequerimiento, IdSolicitante, Fecha_Requerimiento, Fecha_Registro, IdTipoReq, idUsuario,ccosto,serie,tipo,mes) 
            values(?,?,?,?,?,?,?,?,?,?)`,
                [det.CodRequerimiento, det.Solicitante.Cod_Solicitante, det.Fecha_Requerimiento, new Date(),
                det.IdTipoReq.Cod_TipoReq, det.idUsuario, 'plant', serie, det.tipo, det.mes], (err, result) => {
                    if (err) {
                        reject(err)
                    }
                    const idRequerimiento = result.insertId;
                    const detalleMap = det.detalles.map((detalle) => ([idRequerimiento, detalle.Detalle.AR_CCODIGO, detalle.cantidad, detalle.cantidad, detalle.Prioridad.Cod_Prioridad, detalle.Area.Cod_Area,
                        Number(detalle.Marca.Cod_marcasg), Number(detalle.Motivo.Cod_motivosg), detalle.IdItem, new Date(), detalle.Detalle.AR_CDESCRI, detalle.Detalle.AR_FAMILIA, detalle.Fecha_atencion, detalle.Detalle.AR_UM, detalle.observacion]))
                    db.query(`INSERT INTO requerimiento_det(IdRequerimiento, Codigo_prod,Cantidad,Cantidad_aprobada ,IdPrioridad, IdArea, IdMarca_SG, IdMotivo_SG, Iditem, Fecha_Registro,Descripcion,familia_CONCAR,Fecha_Atencion,UM_CONCAR,observacion) 
                VALUES ?`, [detalleMap], (err, result) => {
                        if (err) {
                            reject(err)
                        }
                        resolve({
                            success: true,
                            message: "Registro exitoso"
                        })
                    })
                })
        })
    },
    actualizarCantidadRequerimientoDet: (requerimientosDet) => {
        return new Promise((resolve, reject) => {
            const queryBatch = requerimientosDet.map((reqDet) => `update requerimiento_det set cantidad=${reqDet.cantidad} where idRequerimientoDet=${reqDet.id};`).join("");
            db.query(queryBatch, (err, result) => {
                if (err) reject(err)
                resolve();
            })
        })
    },
    addReqAdmin: (det) => {
        return new Promise((resolve, reject) => {
            let serie = `${(new Date()).getFullYear()}A`;
            db.query(`INSERT INTO requerimiento(CodRequerimiento, IdSolicitante, Fecha_Requerimiento,
                 Fecha_Registro, IdTipoReq, idUsuario, ccosto,serie,tipo,mes) 
            values(?,?,?,?,?,?,?,?,?,?)`, [det.CodRequerimiento, det.Solicitante.Cod_Solicitante,
            det.Fecha_Requerimiento, new Date(), det.IdTipoReq.Cod_TipoReq, det.idUsuario,
            det.ccosto, serie, det.tipo, det.mes], (err, result) => {
                if (err) reject(err)
                const idRequerimiento = result.insertId;
                const detallesMap = det.detalle.map((detalle) => ([idRequerimiento, detalle.Detalle.AR_CCODIGO.trim(), detalle.Detalle.AR_CDESCRI.trim(), detalle.cantidad, detalle.cantidad,
                    detalle.Prioridad.Cod_Prioridad, detalle.Area.Cod_Area, detalle.numIncubadora, new Date(), detalle.Detalle.AR_FAMILIA, detalle.Unidadmedida, moment(detalle.fecAtencion).format("YYYY-MM-DD"), detalle.observacion]))
                db.query(`INSERT INTO requerimiento_det(IdRequerimiento, Codigo_prod, Descripcion, Cantidad,Cantidad_aprobada,IdPrioridad, IdArea, Iditem, Fecha_Registro,familia_CONCAR,UM_CONCAR,Fecha_Atencion,observacion) 
                VALUES ?`, [detallesMap], (err, result) => {
                    if (err) reject(err)

                    resolve({
                        success: true,
                        message: "Registro exitoso"
                    })
                })
            })
        })
    },
    updateReqPlanta: function (req, idReq) {
        const requerimientoFile = this;
        return new Promise(async (resolve, reject) => {
            if (!await requerimientoFile.estaPermitidoActualizarRequermiento(idReq)) {
                reject("No esta permitido editar el requerimiento");
            }
            db.query(`UPDATE requerimiento  SET IdSolicitante = ?, Fecha_Requerimiento = ?, IdTipoReq = ?, idUsuario =?,tipo=?,mes=? WHERE idRequerimiento = ? `,
                [req.Solicitante.Cod_Solicitante, req.Fecha_Requerimiento, req.IdTipoReq.Cod_TipoReq, req.idUsuario, req.tipo, req.mes, idReq], async (err, result) => {
                    if (err) {
                        reject(err)
                    }
                    const listaProductosCotizados = await this.getDetalleRequerimientosQueSeEncuentrenCotizados(idReq)
                    if (listaProductosCotizados.length > 0) {
                        req.detalles = req.detalles.filter(d => !listaProductosCotizados.includes(d.Detalle.AR_CCODIGO.trim()))
                    }
                    const whereDelete = listaProductosCotizados.length > 0 ? `and  not Codigo_prod in(${listaProductosCotizados.map(c => `'${c}'`).join()})` : ''
                    await db.query(`DELETE FROM requerimiento_det WHERE IdRequerimiento = ? ${whereDelete}`, [idReq]);
                    const detalleMap = req.detalles.map((detalle) => ([idReq, detalle.Detalle.AR_CCODIGO, detalle.cantidad, detalle.cantidad, detalle.Prioridad.IdPrioridad, detalle.Area.Cod_Area, Number(detalle.Marca.Cod_marcasg), Number(detalle.Motivo.Cod_motivosg), detalle.IdItem, new Date(), detalle.Detalle.AR_CDESCRI, detalle.Detalle.AR_FAMILIA, moment(detalle.fecAtencion).format("YYYY-MM-DD"), detalle.Detalle.AR_UM, detalle.observacion, (detalle.Estado ? detalle.Estado : 0)]))
                    db.query(`INSERT INTO requerimiento_det(IdRequerimiento, Codigo_prod,Cantidad,Cantidad_aprobada ,IdPrioridad, IdArea, IdMarca_SG, IdMotivo_SG, Iditem, Fecha_Registro,Descripcion,familia_CONCAR,Fecha_Atencion,UM_CONCAR,observacion,Estado) 
                    VALUES ?`, [detalleMap], (err, result) => {
                        if (err) {
                            reject(err)
                        }
                        resolve({
                            success: true,
                            message: "Registro exitoso"
                        })
                    })
                })
        })
    },
    updateReqAdmin: async function (req, idReq) {
        const requerimientoFile = this;
        try {
            const dta = await requerimientoFile.estaPermitidoActualizarRequermiento(idReq);
            console.log(dta)
            if (!await requerimientoFile.estaPermitidoActualizarRequermiento(idReq)) {
                const error = new Error();
                error.message = "No esta permitido editar el requerimiento"
                throw error;
            }
            await db.query(`UPDATE requerimiento  SET IdSolicitante = ?, Fecha_Requerimiento = ?, IdTipoReq = ?, idUsuario =?,tipo=?,mes=? WHERE  idRequerimiento= ? `,
                [req.Solicitante.Cod_Solicitante, req.Fecha_Requerimiento, req.IdTipoReq.Cod_TipoReq, req.idUsuario, req.tipo, req.mes, idReq])
            const listaProductosCotizados = await this.getDetalleRequerimientosQueSeEncuentrenCotizados(idReq)
            if (listaProductosCotizados.length > 0) {
                req.detalle = req.detalle.filter(d => !listaProductosCotizados.includes(d.Detalle.AR_CCODIGO.trim()))
            }
            const whereDelete = listaProductosCotizados.length > 0 ? `and  not Codigo_prod in(${listaProductosCotizados.map(c => `'${c}'`).join()})` : ''
            await db.query(`DELETE FROM requerimiento_det WHERE IdRequerimiento = ? ${whereDelete}`, [idReq]);
            const detalleMap = req.detalle.map((detalle) => ([idReq, detalle.Detalle.AR_CCODIGO.trim(), detalle.Detalle.AR_CDESCRI, detalle.cantidad,
                detalle.cantidad, detalle.Prioridad.Cod_Prioridad, detalle.Area.Cod_Area, detalle.numIncubadora, detalle.Unidadmedida.trim(), detalle.Unidadmedida.trim(), new Date(), detalle.Detalle.AR_FAMILIA, moment(detalle.fecAtencion).format("YYYY-MM-DD"), detalle.observacion, (detalle.Estado ? detalle.Estado : 0)]))

            await db.query(`INSERT INTO requerimiento_det(IdRequerimiento, Codigo_prod, Descripcion, Cantidad, Cantidad_aprobada,IdPrioridad, IdArea, Iditem, IdUM, UM_CONCAR,Fecha_Registro,familia_CONCAR,Fecha_Atencion,observacion,Estado) 
                    VALUES ?`, [detalleMap])
            return {
                success: true,
                message: "Datos Actualizados Correctamente"
            }
        } catch (error) {
            return {
                success: false,
                message: "Error en el registro de req-administracion",
                err: error.message
            }
        }
    },
    updateReqGranja: function (det, idReq) {
        const requerimientoFile = this;
        det = det.filter(d => d.Estado != 2)
        return new Promise(async (resolve, reject) => {
            if (!await requerimientoFile.estaPermitidoActualizarRequermiento(idReq)) {
                reject("No esta permitido editar el requerimiento");
            }
            db.query(`UPDATE requerimiento  SET IdSolicitante = ?, Fecha_Requerimiento = ?, Fecha_Registro = ?, IdTipoReq = ?, idUsuario =?,tipo=?,mes=? WHERE idRequerimiento = ? `,
                [det.Solicitante.Cod_Solicitante, det.Fecha_Requerimiento, new Date(), det.IdTipoReq.Cod_TipoReq, det.idUsuario, det.tipo, det.mes, idReq], async (err, result) => {
                    if (err) {

                        reject(err)
                    }
                    const listaProductosCotizados = await this.getDetalleRequerimientosQueSeEncuentrenCotizados(idReq)
                    if (listaProductosCotizados.length > 0) {
                        det.detalles = det.detalles.filter(d => !listaProductosCotizados.includes(d.Detalle.AR_CCODIGO.trim()))
                    }
                    const whereDelete = listaProductosCotizados.length > 0 ? `and  not Codigo_prod in(${listaProductosCotizados.map(c => `'${c}'`).join()})` : ''
                    await db.query(`DELETE FROM requerimiento_det WHERE IdRequerimiento = ? ${whereDelete}`, [idReq]);
                    const detalleMap = det.detalles.map((detalle) => {
                        return [idReq, detalle.IdItem, detalle.Detalle.AR_CCODIGO.trim(), detalle.Detalle.AR_CDESCRI.trim(), detalle.Total, detalle.Total, detalle.G1, detalle.G2, detalle.G3, detalle.G4, detalle.G5, detalle.G6, detalle.G7, detalle.Gabriela, detalle.Detalle.AR_FAMILIA,
                            detalle.Prioridad.IdPrioridad, new Date(detalle.Fecha_atencion), new Date(), detalle.Detalle.AR_UM, detalle.observacion, (detalle.Estado ? detalle.Estado : 0)]
                    });
                    db.query(`INSERT INTO requerimiento_det(IdRequerimiento,IdItem,Codigo_prod,Descripcion, Cantidad,Cantidad_aprobada,G1,G2,G3,G4,G5,G6,G7,Gabriela,familia_CONCAR,IdPrioridad, Fecha_Atencion, Fecha_Registro,UM_CONCAR,observacion,Estado) 
                    VALUES ?`, [detalleMap], (err, result) => {
                        if (err) {
                            reject(err)
                        }
                        resolve({
                            success: true,
                            message: "Datos Actualizados Correctamente"
                        })
                    })
                })



        })
    },
    getDetalleRequerimientosQueSeEncuentrenCotizados: async function (idRequeriemiento) {
        const detallesRequerimiento = await db.query(`select Codigo_prod,IdRequerimientodet from requerimiento_det where IdRequerimiento=${idRequeriemiento} and Estado=2`)
        const listaProductosCotizados = await db.query(`select codig_prod from cotizacion_det where codig_prod in(${detallesRequerimiento.map(d => `'${d.Codigo_prod}'`).join()}) and idRequerimientoDet in(${detallesRequerimiento.map(d => `'${d.IdRequerimientodet}'`).join()})`)
        return listaProductosCotizados.map(s => s.codig_prod)
    },
    deleteRequerimientos: async (idReq) => {

    },
    selectMaxReq: (ccosto, year) => {
        if (!year) {
            year = (new Date()).getFullYear();
        }
        return new Promise((resolve, reject) => {
            db.query(`SELECT MAX(CONVERT(CodRequerimiento,UNSIGNED INTEGER)) 
            as maxId FROM requerimiento WHERE ccosto =?
             and date_format(Fecha_Requerimiento,'%Y')= ?`, [ccosto, year], (err, result) => {
                if (err) {
                    reject(err)
                }
                resolve(result[0].maxId == null ? 1 : Number(result[0].maxId) + 1)

            });
        })
    },
    getTIpoReq: async () => {
        let rows = await db.query('SELECT * FROM req_tiporeq');
        return rows;
    },
    getTIpoMotivo: async () => {
        let rows = await db.query('SELECT * FROM req_motivosg where estado=1');
        return rows;
    },
    saveMotivo: (newMotivo) => {
        return new Promise((resolve, reject) => {
            db.query("insert into req_motivosg(Cod_motivosg,Desc_Motivo) values(?,?)", [newMotivo.Cod_motivosg, newMotivo.Desc_Motivo], (err, result) => {
                if (err) reject(err)
                resolve();
            })
        })
    },
    editMotivo: (motivo, motivoId) => {
        return new Promise((resolve, reject) => {
            db.query("update req_motivosg set Cod_motivosg=?,Desc_Motivo=? where IdMotivo=?", [motivo.Cod_motivosg, motivo.Desc_Motivo, motivoId], (err, result) => {
                if (err) reject(err)
                resolve();
            })
        })
    },
    editMarca: (marca, marcaId) => {
        return new Promise((resolve, reject) => {
            db.query("update req_marcasg set Cod_marcasg=?,Desc_Marca=? where IdMarca=?", [marca.Cod_marcasg, marca.Desc_Marca, marcaId], (err, result) => {
                if (err) reject(err)
                resolve();
            })
        })
    },
    saveMarca: async (newMarca) => {
        return new Promise((resolve, reject) => {
            db.query("insert into req_marcasg(Cod_marcasg,Desc_Marca) values(?,?)", [newMarca.Cod_marcasg, newMarca.Desc_Marca], (err, result) => {
                if (err) reject(err)
                resolve();
            })
        })
    },
    getPrioridad: async () => {
        let rows = await db.query('SELECT * FROM req_prioridad where IdPrioridad<>2 order by Desc_Prioridad');
        return rows;
    },
    getArea: async () => {
        let rows = await db.query('SELECT * FROM req_area');
        return rows;
    },
    getMarca: async () => {
        let rows = await db.query('SELECT * FROM req_marcasg where estado=1');
        return rows;
    },
    getUM: async () => {
        let json = {}
        try {
            const pool = await poolPromise
            const result = await pool.request()
                .query(`SELECT TG_CCLAVE, TG_CDESCRI FROM RSFACCAR.DBO.AL0003TABL WHERE TG_CCOD = '05' ORDER BY TG_CCLAVE`)
            json = {
                rows: result.recordset,
                success: true,
                message: "Extracción de Unidad de medida exitoso."
            }
        } catch (error) {
            console.log('error :>> ', error);
            json = {
                error: error.code,
                success: false,
                message: "Error en el servidor"
            }
        }
        return json
    },
    getCantidadCotizadaConRequerimientoPorRequerimientoDetId: (idRequerimientoDet) => {
        return new Promise((resolve, reject) => {
            db.query("select   CONCAT(DATE_FORMAT(req.Fecha_Requerimiento,'%Y'),'-',req.CodRequerimiento) as nombreReq,req.ccosto ,req_det.Cantidad_aprobada as cantidadAprobada  from requerimiento_det req_det inner join requerimiento req on req.idRequerimiento=req_det.IdRequerimiento where req_det.IdRequerimientodet=?", [idRequerimientoDet], (err, results) => {
                if (err) reject(err)
                console.log("resul", results[0])
                resolve(results[0]);
            })
        })


    },

    getDetailByGranja: (granjaId) => {
        return new Promise((resolve, reject) => {
            db.query(`SELECT det.*, sol.Desc_Solicitante, tipo.Desc_tipoReq,
        us.Nombre, pri.Desc_Prioridad   FROM requerimiento_det det 
    INNER JOIN requerimiento req ON  req.idRequerimiento = det.IdRequerimiento
    INNER JOIN req_solicitante sol ON req.IdSolicitante = sol.IdSolicitante
    INNER JOIN req_tiporeq tipo ON req.IdTipoReq = tipo.IdTipoReq
    INNER JOIN req_prioridad pri ON det.IdPrioridad = pri.Cod_Prioridad
    INNER JOIN usuario us ON req.idUsuario = us.idUsuario  WHERE det.IdRequerimiento = ${granjaId} order by req.CodRequerimiento asc`, (err, results) => {
                const detalleMap = results.map((result) => ({
                    id: result.IdRequerimientodet,
                    Total: result.Cantidad, ...result, IdItem: result.Iditem, Detalle: { AR_CCODIGO: result.Codigo_prod, AR_FAMILIA: result.familia_CONCAR, AR_CDESCRI: result.Descripcion, AR_UM: result.UM_CONCAR }, Prioridad: { IdPrioridad: result.IdPrioridad, Desc_Prioridad: result.Desc_Prioridad }, Fecha_atencion: result.Fecha_Atencion
                }))
                if (err) {
                    reject(err)
                }
                resolve(detalleMap)
            })

        })

    },
    getSolicitantes: async () => {
        let rows = await db.query(`SELECT * FROM req_solicitante`);
        return rows;
    },
    getDetalleByIdPlanta: async (id) => {
        return new Promise((resolve, reject) => {
            db.query(`SELECT det.*, sol.Desc_Solicitante,sol.Cod_Solicitante, tipo.Desc_tipoReq,
        us.Nombre, pri.Desc_Prioridad,pri.Cod_Prioridad, mo.Desc_Motivo,mo.IdMotivo,mo.Cod_motivosg,ma.IdMarca,ma.Cod_marcasg, ma.Desc_Marca,ar.IdArea,ar.Cod_Area, ar.Desc_Area
    FROM requerimiento_det det 
    INNER JOIN requerimiento req ON  req.IdRequerimiento = det.IdRequerimiento
    INNER JOIN req_solicitante sol ON req.IdSolicitante = sol.IdSolicitante
    INNER JOIN req_tiporeq tipo ON req.IdTipoReq = tipo.IdTipoReq
    INNER JOIN req_prioridad pri ON det.IdPrioridad = pri.Cod_Prioridad
    INNER JOIN req_motivosg mo ON det.IdMotivo_SG = mo.Cod_motivosg
    INNER JOIN req_marcasg ma ON det.IdMarca_SG = ma.Cod_marcasg
    INNER JOIN req_area ar ON det.IdArea = ar.Cod_Area
    INNER JOIN usuario us ON req.idUsuario = us.idUsuario  WHERE det.IdRequerimiento = ${id} order by det.Iditem asc`, (err, results) => {
                if (err) {
                    reject(err)
                }
                const detalleMap = results.map((result) => ({
                    id: result.IdRequerimientodet,
                    cantidad: result.Cantidad,
                    observacion: result.observacion,
                    IdItem: result.Iditem,
                    Detalle: { AR_CCODIGO: result.Codigo_prod, AR_FAMILIA: result.familia_CONCAR, AR_CDESCRI: result.Descripcion, AR_UM: result.UM_CONCAR },
                    Prioridad: { IdPrioridad: result.IdPrioridad, Desc_Prioridad: result.Desc_Prioridad, Cod_Prioridad: result.Cod_Prioridad },
                    Fecha_atencion: result.Fecha_Atencion,
                    Motivo: {
                        IdMotivo: result.IdMotivo,
                        Cod_motivosg: result.Cod_motivosg,
                        Desc_Motivo: result.Desc_Motivo
                    },
                    Area: {
                        Cod_Area: result.Cod_Area,
                        Desc_Area: result.Desc_Area,
                        IdArea: result.IdArea
                    },
                    Marca: {
                        IdMarca: result.IdMarca,
                        Desc_Marca: result.Desc_Marca,
                        Cod_marcasg: result.Cod_marcasg
                    }
                }))
                resolve(detalleMap)
            })
        })
    },
    getDetalleByIdAdmin: async (id) => {
        return new Promise((resolve, reject) => {
            db.query(`SELECT det.*,det.UM_CONCAR as  Unidadmedida, sol.Desc_Solicitante, tipo.Desc_tipoReq,
            us.Nombre, pri.Desc_Prioridad, ar.Desc_Area
        FROM requerimiento_det det 
        INNER JOIN requerimiento req ON  req.idRequerimiento = det.IdRequerimiento
        INNER JOIN req_solicitante sol ON req.IdSolicitante = sol.IdSolicitante
        INNER JOIN req_tiporeq tipo ON req.IdTipoReq = tipo.IdTipoReq
        INNER JOIN req_prioridad pri ON det.IdPrioridad = pri.Cod_Prioridad
        INNER JOIN req_area ar ON det.IdArea = ar.Cod_Area
        INNER JOIN usuario us ON req.idUsuario = us.idUsuario  WHERE det.IdRequerimiento = ${id}`, (error, results) => {
                if (error) { reject(error) }
                results = results.map((element) => {
                    element.numIncubadora = element.Iditem;
                    element.cantidad = element.Cantidad;
                    element.fecAtencion = moment(element.Fecha_Atencion).format("YYYY-MM-DD");
                    element.Unidadmedida = element.UM_CONCAR
                    element.Detalle = {
                        AR_CDESCRI: element.Descripcion,
                        AR_CCODIGO: element.Codigo_prod,
                        AR_FAMILIA: element.familia_CONCAR
                    }
                    element.Prioridad = {
                        Desc_Prioridad: element.Desc_Prioridad,
                        Cod_Prioridad: element.IdPrioridad
                    },
                        element.Area = {
                            Desc_Area: element.Desc_Area,
                            Cod_Area: element.IdArea
                        }

                    return element
                })
                resolve(results)
            })
        })
    },
    getDetalleByIdGranja: async (id) => {
        let rows = db.query(`SELECT det.*, sol.Desc_Solicitante, tipo.Desc_tipoReq,
            us.Nombre, pri.Desc_Prioridad, mo.Desc_Motivo, ma.Desc_Marca, ar.Desc_Area
        FROM requerimiento_det det 
        INNER JOIN requerimiento req ON  req.CodRequerimiento = det.IdRequerimiento
        INNER JOIN req_solicitante sol ON req.IdSolicitante = sol.IdSolicitante
        INNER JOIN req_tiporeq tipo ON req.IdTipoReq = tipo.IdTipoReq
        INNER JOIN req_prioridad pri ON det.IdPrioridad = pri.Cod_Prioridad
        INNER JOIN req_motivosg mo ON det.IdMotivo_SG = mo.Cod_motivosg
        INNER JOIN req_marcasg ma ON det.IdMarca_SG = ma.Cod_marcasg
        INNER JOIN req_area ar ON det.IdArea = ar.Cod_Area
        INNER JOIN usuario us ON req.idUsuario = us.idUsuario  WHERE det.IdRequerimiento = ${id}`)
        return rows;
    },
    async getOcOrders(id) {
        let sql = `
select numero_orden   from cotizacion_transferencia where id_cotizacion in(select DISTINCT co.idCotizacion from requerimiento rq INNER JOIN requerimiento_det rd 
    on rd.IdRequerimiento=rq.idRequerimiento inner join cotizacion_prov cp on cp.idRequerimientoDet=rd.IdRequerimientodet INNER JOIN cotizacion co on co.idCotizacion=cp.idCotizacion  WHERE rq.idRequerimiento=${id}
    and cp.estado=1 and co.estado=5)`
        const data = await db.query(sql);
        return data.map(d => `'${d.numero_orden.trim()}'`)
    },

    async getEntryNotes(id) {
        let ocs = await requerimientos.getOcOrders(id);
        let recordset = []
        if (ocs.length > 0) {
            let sql = `SELECT  A.C5_CNUMORD as oc ,a.C5_CCODPRO, C6_NCANTID as quantity,C6_CCODIGO as code, C6_CDESCRI as descripcion,C5_CCODPRO as codigoProveedor, REPLACE(REPLACE(REPLACE(C.OC_COMENTA,CHAR(9),''),CHAR(10),''),CHAR(13),'')
             as observacion
     FROM RSFACCAR.dbo.AL0003MOVC A LEFT JOIN RSFACCAR.dbo.AL0003MOVD B ON B.C6_CTD=A.C5_CTD AND B.C6_CALMA=A.C5_CALMA  
     AND B.C6_CNUMDOC=A.C5_CNUMDOC	LEFT JOIN RSFACCAR.dbo.CO0003MOVD C ON C.OC_CNUMORD=A.C5_CNUMORD  AND C.OC_CCODIGO=C6_CCODIGO AND CAST(C.OC_CITEM AS INT) = CAST (B.C6_CITEM AS INT)
     where A.C5_CNUMORD in(${ocs.join()})`;
            const pool = await poolPromise;
            recordset = (await pool.query(sql)).recordset;
            /*         for (let rec of recordset) {
                        result[rec.code.trim()] = { cantidad: rec.quantity, descripcion: rec.descripcion, };
                    } */
        }
        return recordset;
    },
    async getTransfersPerRequirement(code) {
        const pool = await poolPromise;
        const { recordset } = await pool.query(`exec Lista_NotaIngreso_upp '${code}'`);
        console.log("re", recordset)
        let result = {};
        for (let rec of recordset) {
            result[rec.C6_CCODIGO] = {
                almacen: rec.C5_CALMA,
                fecha: rec.C5_DFECDOC,
                cantidad_upp: rec.C6_NCANTID,
            };
        }
        return result;

    },
    async updateCantidadRecepcionada({ IdRequerimientodet, cantidadRecepcionada, porcentajeRecepcion }) {
        try {
            await db.query("update requerimiento_det   SET cantidadRecepcionada = ?,porcentajeRecepcion = ? where IdRequerimientodet=? ", [cantidadRecepcionada, Number(porcentajeRecepcion ? porcentajeRecepcion : 0), IdRequerimientodet]);
        } catch (error) {
            throw error;
        }
    },
    async actualizarCantidadRecepcionadaLotes(requerimientos = []) {
        for (const r of requerimientos) {
            await this.updateCantidadRecepcionada(r)
        }
    },



    async statusPerRequirement(id, code) {
        /*        const notes = await requerimientos.getEntryNotes(id);
               const upps = await requerimientos.getTransfersPerRequirement(code); */
        let ordenCompraSqlServer = []
        const pool = await poolPromise;
        let sql = `select 
        rd.IdRequerimientodet,
        rd.porcentajeRecepcion,
        @q:=if(ifnull(cd.idRequerimientoDet,-1)>0,
        rd.Cantidad_aprobada,0) as q,
        rd.cantidadRecepcionada,
        rd.Codigo_prod,
        rd.Descripcion,
        rd.observacion,
        rd.Cantidad as requerida,
        DATE_FORMAT(c.fecha_cotizacion,'%Y-%m-%d') as fecha_cotizacion,
        rd.Cantidad_aprobada,
        if(c.estado=5,@q,0) as transferida,
        if(c.estado in(3,5),@q,0) as cotizada,
        rd.familia_CONCAR as familia,
        rd.Estado,c.idCotizacion,prioridad.Desc_Prioridad as prioridad
        from requerimiento_det as rd
        left join cotizacion_prov as cd on cd.idRequerimientoDet=rd.IdRequerimientodet
        left join cotizacion as c  on (c.idCotizacion=cd.idCotizacion and c.estado in(3,5) )
        left join req_prioridad as prioridad on prioridad.IdPrioridad=rd.IdPrioridad
        where rd.IdRequerimiento=${id}
        group by rd.IdRequerimientodet  order by rd.Descripcion `;
        const data = await db.query(sql);
        const { recordset: upps } = await pool.query(`exec Lista_NotaIngreso_UPP '${code}'`)
        const { recordset: uppsSoloAlgunosProductos } = await pool.query(`exec Lista_NotaIngreso_compra '${code}'`)
        if (data.length > 0) {
            const cotizaciones = data.filter(d => d.idCotizacion != null || d.idCotizacion != undefined).map(d => d.idCotizacion)
            if (cotizaciones.length > 0) {
                const ordenesCompra = await db.query(`select numero_orden,id_cotizacion from cotizacion_transferencia where id_cotizacion in(${cotizaciones.join()})`)
                for (const d of data) {
                    if (d.Codigo_prod == "ARV05000006") {
                        console.log("d", d)
                    }
                    const ordenCompraPorCotizacion = ordenesCompra.filter(o => o.id_cotizacion == d.idCotizacion)
                    if (ordenCompraPorCotizacion.length == 0) continue;
                    const orderCompraMap = ordenCompraPorCotizacion.map(d => d.numero_orden).join()
                    const { recordset } = await pool.query(`exec Lista_NotaIngreso '${orderCompraMap}'`)
                    d.totalAlmacenH = recordset.find(o => o.C6_CCODIGO.trim() == d.Codigo_prod.trim())
                    d.upps = [];
                    d.totalUpps = 0;
                    const uppsFilter = upps && upps.length > 0 ? upps.filter(u => u && u.C6_CCODIGO && (u.C6_CCODIGO.trim() == d.Codigo_prod.trim())) : []
                    const totalUpps = uppsFilter.reduce((prev, curr) => prev += curr.C6_NCANTID, 0)
                    const uppsFilterSoloAlgunosProductos = uppsSoloAlgunosProductos && uppsSoloAlgunosProductos.length > 0 ? uppsSoloAlgunosProductos.filter(u => u && u.C6_CCODIGO && (u.C6_CCODIGO.trim() == d.Codigo_prod.trim())) : []
                    const totalUppsSoloAlgunosProductos = uppsFilterSoloAlgunosProductos.reduce((prev, curr) => prev += curr.C6_NCANTID, 0)
                    d.totalUpps = totalUppsSoloAlgunosProductos + totalUpps
                    d.upps = uppsFilter.concat(uppsFilterSoloAlgunosProductos)
                }
            }

        }

        /*     codigos = data.map(p => "'" + p.Codigo_prod + "'");
            codigos = codigos.filter((thing, index, self) =>
                index === self.findIndex((t) => (
                    t === thing
                ))
            ) */
        /*    codigos = codigos.join(',');
           var query = `SELECT A.C5_CALMA,A.C5_CNUMDOC,A.C5_DFECDOC,C5_CRFTDOC,A.C5_CRFNDOC,A.C5_CNUMORD ,B.C6_CCODIGO,C6_CDESCRI, C6_NCANTID
           FROM RSFACCAR.dbo.AL0003MOVC A LEFT JOIN RSFACCAR.dbo.AL0003MOVD B ON B.C6_CTD=A.C5_CTD AND B.C6_CALMA=A.C5_CALMA  
           AND B.C6_CNUMDOC=A.C5_CNUMDOC and a.C5_CTD='GS'
           where A.C5_CRFNDO2 = '${code}' and C6_CCODIGO in (${codigos})`;
           let response = await pool.query(query);
           response = response.recordset;
               let have_upps = Object.keys(upps).length > 0;
           let have_notes = Object.keys(notes).length > 0; */

        /*      if (have_notes || have_upps) {
                 for (let d of data) {
                     let detalles = response.filter(p => p.C6_CDESCRI.trim() === d.Descripcion.trim())
                     if (detalles.length > 0) {
                         let total = detalles.reduce((counter, element) =>
                             counter + element.C6_NCANTID
                             , 0)
                         d.sql_server_total = total;
                         d.porcentaje = ((d.Cantidad_aprobada / d.requerida) * (d.transferida / d.Cantidad_aprobada) * 100).toFixed(2) + '%';
                     } else {
                         d.sql_server_total = 0;
                     }
                     if (have_notes) {
                         const producto = notes.find((note) => {
                             const dataObservacion = d.observacion ? d.observacion.trim() : null;
                             const noteObservacion = note.observacion ? note.observacion.trim() : null;
                             return note.code.trim() == d.Codigo_prod.trim() && noteObservacion == dataObservacion;
                         });
                         d.cantidad_comprada = producto ? producto.quantity : null;
                     }
                     if (have_upps) {
                         Object.assign(d, upps[d.Codigo_prod]);
                     }
                 }
             } */
        /*         if (have_notes || have_upps) {
                    for (let d of data) {
                        let detalles = response.filter(p => p.C6_CCODIGO.trim() === d.Codigo_prod.trim())
                        if (detalles.length > 0) {
                            let total = detalles.reduce((counter, element) =>
                                counter + element.C6_NCANTID
                                , 0)
                            d.sql_server_total = total;
                            d.porcentaje = ((d.Cantidad_aprobada / d.requerida) * (d.transferida / d.Cantidad_aprobada) * 100).toFixed(2) + '%';
                        } else {
                            d.sql_server_total = 0;
                        }
                        if (have_notes) {
                            const producto = notes.find((note) => {
                                const dataObservacion = d.observacion ? d.observacion.trim() : null;
                                const noteObservacion = note.observacion ? note.observacion.trim() : null;
                                return note.code.trim() == d.Codigo_prod.trim() && noteObservacion == dataObservacion;
                            });
                            d.cantidad_comprada = producto ? producto.quantity : null;
                        }
                        if (have_upps) {
                            Object.assign(d, upps[d.Codigo_prod]);
                        }
                    }
                } */
        return data;
    },
    exportarInformacionRequerimientoCumplimiento: async function ({ upps = [], meses = [], anio, prioridades = [] }) {
        try {
            const data = await this.getInformacionRequerimientoCumplmiento({ upps, meses, anio, prioridades })
            const rutaTemplateHC = `./template/plantilla estadistica requerimiento cumplimiento.xlsx`;
            const alignmentStyle = { vertical: "middle", horizontal: "center", wrapText: true }

            const borderStylesC = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            if (fs.existsSync(`./template/estadistica requerimiento cumplimiento.xlsx`)) {
                fs.unlinkSync(`./template/estadistica requerimiento cumplimiento.xlsx`)
            }
            const wor = await workbook.xlsx.readFile(rutaTemplateHC)
            const sheet = wor.worksheets[0];

            for (let j = 0; j < data.dataMensual.length; j++) {
                const dataMensual = data.dataMensual[j]
                dataMensual.data.unshift(dataMensual.name)
                sheet.getRow(j + 2).values = dataMensual.data
            }
            for (let i = 0; i < data.data.length; i++) {
                const d = data.data[i]
                sheet.getCell("B" + (i + 8)).value = d.MES
                sheet.getCell("B" + (i + 8)).border = borderStylesC
                sheet.getCell("B" + (i + 8)).alignment = alignmentStyle

                sheet.getCell("C" + (i + 8)).value = d.SEDE
                sheet.getCell("C" + (i + 8)).border = borderStylesC;
                sheet.getCell("C" + (i + 8)).alignment = alignmentStyle
                sheet.getCell("D" + (i + 8)).value = d.DETALLE
                sheet.getCell("D" + (i + 8)).border = borderStylesC
                sheet.getCell("D" + (i + 8)).alignment = alignmentStyle
                sheet.getCell("E" + (i + 8)).value = d.UM
                sheet.getCell("E" + (i + 8)).border = borderStylesC
                sheet.getCell("E" + (i + 8)).alignment = alignmentStyle
                sheet.getCell("F" + (i + 8)).value = d.PRIORIDAD
                sheet.getCell("F" + (i + 8)).border = borderStylesC
                sheet.getCell("F" + (i + 8)).alignment = alignmentStyle


                sheet.getCell("G" + (i + 8)).value = d.PEDIDO
                sheet.getCell("G" + (i + 8)).border = borderStylesC
                sheet.getCell("G" + (i + 8)).alignment = alignmentStyle

                sheet.getCell("H" + (i + 8)).value = d.ENVIADO
                sheet.getCell("H" + (i + 8)).border = borderStylesC
                sheet.getCell("H" + (i + 8)).alignment = alignmentStyle

                sheet.getCell("I" + (i + 8)).value = d.ESTADO
                sheet.getCell("I" + (i + 8)).alignment = alignmentStyle
                sheet.getCell("I" + (i + 8)).border = borderStylesC
                sheet.getCell("J" + (i + 8)).value = d.CONFORMIDAD
                sheet.getCell("J" + (i + 8)).border = borderStylesC
                sheet.getCell("J" + (i + 8)).alignment = alignmentStyle


            }
            await workbook.xlsx.writeFile(`./template/estadistica requerimiento cumplimiento.xlsx`)

            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "/supergen-be/template/estadistica requerimiento cumplimiento.xlsx"
            }
            return json;


        } catch (error) {
            throw error;
        }



    },
    exportarInformacionRequerimientoMensual: async function ({ upps = [], meses = [], anio }) {
        try {
            const data = await this.getInformacionRequerimientoMensual({ upps, meses, anio })
            const rutaTemplateHC = `./template/plantilla estadistica requerimiento mensual.xlsx`;
            const alignmentStyle = { vertical: "middle", horizontal: "center", wrapText: true }

            const borderStylesC = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            if (fs.existsSync(`./template/estadistica requerimiento mensual.xlsx`)) {
                fs.unlinkSync(`./template/estadistica requerimiento mensual.xlsx`)
            }
            const wor = await workbook.xlsx.readFile(rutaTemplateHC)
            const sheet = wor.worksheets[0];

            for (let j = 0; j < data.dataMensual.length; j++) {
                const dataMensual = data.dataMensual[j]
                dataMensual.data.unshift(dataMensual.name)
                sheet.getRow(j + 2).values = dataMensual.data
            }
            for (let i = 0; i < data.data.length; i++) {
                const d = data.data[i]
                sheet.getCell("B" + (i + 8)).value = d.MES
                sheet.getCell("B" + (i + 8)).border = borderStylesC
                sheet.getCell("B" + (i + 8)).alignment = alignmentStyle

                sheet.getCell("C" + (i + 8)).value = d.SEDE
                sheet.getCell("C" + (i + 8)).border = borderStylesC;
                sheet.getCell("C" + (i + 8)).alignment = alignmentStyle
                sheet.getCell("D" + (i + 8)).value = d.DETALLE
                sheet.getCell("D" + (i + 8)).border = borderStylesC
                sheet.getCell("D" + (i + 8)).alignment = alignmentStyle
                sheet.getCell("E" + (i + 8)).value = d.UM
                sheet.getCell("E" + (i + 8)).border = borderStylesC
                sheet.getCell("E" + (i + 8)).alignment = alignmentStyle
                sheet.getCell("F" + (i + 8)).value = d.PRIORIDAD
                sheet.getCell("F" + (i + 8)).border = borderStylesC
                sheet.getCell("F" + (i + 8)).alignment = alignmentStyle


                sheet.getCell("G" + (i + 8)).value = d.PEDIDO
                sheet.getCell("G" + (i + 8)).border = borderStylesC
                sheet.getCell("G" + (i + 8)).alignment = alignmentStyle

                sheet.getCell("H" + (i + 8)).value = d.ENVIADO
                sheet.getCell("H" + (i + 8)).border = borderStylesC
                sheet.getCell("H" + (i + 8)).alignment = alignmentStyle

                sheet.getCell("I" + (i + 8)).value = d.ESTADO
                sheet.getCell("I" + (i + 8)).alignment = alignmentStyle
                sheet.getCell("I" + (i + 8)).border = borderStylesC
                sheet.getCell("J" + (i + 8)).value = d.CONFORMIDAD
                sheet.getCell("J" + (i + 8)).border = borderStylesC
                sheet.getCell("J" + (i + 8)).alignment = alignmentStyle


            }
            await workbook.xlsx.writeFile(`./template/estadistica requerimiento mensual.xlsx`)

            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "/supergen-be/template/estadistica requerimiento mensual.xlsx"
            }
            return json;


        } catch (error) {
            throw error;
        }



    },
    getInformacionRequerimientoMensual: async function ({ upps = [], meses = [], anio }) {
        try {
            const dataMensual = []
            const uppsMap = upps.map(u => `'${u}'`)
            const data = await mysqlConnection.ejecutarQueryPreparado(`SELECT Y.* FROM (
        SELECT  month(A.Fecha_Requerimiento) mes_nro,case month(A.Fecha_Requerimiento) 
        WHEN 1 THEN 'Enero'
        WHEN 2 THEN  'Febrero'
        WHEN 3 THEN 'Marzo' 
        WHEN 4 THEN 'Abril' 
        WHEN 5 THEN 'Mayo'
        WHEN 6 THEN 'Junio'
        WHEN 7 THEN 'Julio'
        WHEN 8 THEN 'Agosto'
        WHEN 9 THEN 'Septiembre'
        WHEN 10 THEN 'Octubre'
        WHEN 11 THEN 'Noviembre'
        WHEN 12 THEN 'Diciembre'
         END MES  , case when ccosto='granj' then 'GRANJA' else case when ccosto='plant' then 'PLANTA' else  
         case when ccosto='admin' then 'ADMIN' else '' end end end SEDE,B.familia_CONCAR FAMILIA, B.Descripcion DETALLE,
         C.Desc_Prioridad PRIORIDAD,B.UM_CONCAR UM, B.Cantidad_aprobada PEDIDO,B.CantidadEnviada ENVIADO, B.estadoConsolidado ESTADO,
         B.fechaenvio FECHA, B.tiempo TIEMPO, B.conformidad CONFORMIDAD
          
         from requerimiento A left join requerimiento_det B on B.idRequerimiento=A.idRequerimiento
         left join req_prioridad C on C.IdPrioridad=B.IdPrioridad
         where year(A.Fecha_Requerimiento)='${anio}' and month(A.Fecha_Requerimiento) in (${meses.join()}) 
        and A.tipo='mensual' and A.ccosto IN (${uppsMap.join()})
        )Y
        order by mes_nro,SEDE,FAMILIA,DETALLE
        
        `, {})

            let pushDataC = []
            let pushDataP = []
            let pushDataPa = []
            for (const mes of meses) {
                const listaTotalMensual = data.filter(d => d.mes_nro == mes)
                const totalCompleto = listaTotalMensual.filter(d => d.ESTADO == 'COMPLETO').length
                const totalPendiente = listaTotalMensual.filter(d => d.ESTADO == 'Pendiente').length
                const totalParcial = listaTotalMensual.filter(d => d.ESTADO == 'Parcial').length
                const calculoCompleto = listaTotalMensual.length == 0 ? 0 : (totalCompleto / listaTotalMensual.length * 100)
                const calculoPendiente = listaTotalMensual.length == 0 ? 0 : (totalPendiente / listaTotalMensual.length * 100)
                const calculoParcial = listaTotalMensual.length == 0 ? 0 : (totalParcial / listaTotalMensual.length * 100)

                /*      pushDataC = dataMensual.find("COMPLETO") ? dataMensual.find("COMPLETO") : []
                     pushDataP = dataMensual.find("PENDIENTE") ? dataMensual.find("PENDIENTE") : []
                     pushDataPa = dataMensual.find("PARCIAL") ? dataMensual.find("PARCIAL") : [] */
                pushDataC.push(Number(calculoCompleto.toFixed(2)))
                pushDataP.push(Number(calculoPendiente.toFixed(2)))
                pushDataPa.push(Number(calculoParcial.toFixed(2)))

            }
            dataMensual.push({ name: "COMPLETO", data: pushDataC, color: "#92D14F" })
            dataMensual.push({ name: "PENDIENTE", data: pushDataP, color: "#FE0000" })
            dataMensual.push({ name: "PARCIAL", data: pushDataPa, color: "#02AFF1" })
            const totalCompleto = data.filter(d => d.ESTADO == 'COMPLETO').length
            const totalPendiente = data.filter(d => d.ESTADO == 'Pendiente').length
            const totalParcial = data.filter(d => d.ESTADO == 'Parcial').length
            return { data, totalCompleto, totalPendiente, totalParcial, dataMensual }
        } catch (error) {
            throw error
        }




    },
    getInformacionRequerimientoCumplmiento: async function ({ upps = [], meses = [], anio, prioridades = [] }) {
        try {
            const dataMensual = []
            const uppsMap = upps.map(u => `'${u}'`)
            const data = await mysqlConnection.ejecutarQueryPreparado(`SELECT Y.* FROM (
        SELECT  month(A.Fecha_Requerimiento) mes_nro,case month(A.Fecha_Requerimiento) 
        WHEN 1 THEN 'Enero'
        WHEN 2 THEN  'Febrero'
        WHEN 3 THEN 'Marzo' 
        WHEN 4 THEN 'Abril' 
        WHEN 5 THEN 'Mayo'
        WHEN 6 THEN 'Junio'
        WHEN 7 THEN 'Julio'
        WHEN 8 THEN 'Agosto'
        WHEN 9 THEN 'Septiembre'
        WHEN 10 THEN 'Octubre'
        WHEN 11 THEN 'Noviembre'
        WHEN 12 THEN 'Diciembre'
         END MES  , case when ccosto='granj' then 'GRANJA' else case when ccosto='plant' then 'PLANTA' else  
         case when ccosto='admin' then 'ADMIN' else '' end end end SEDE,B.familia_CONCAR FAMILIA, B.Descripcion DETALLE,
         C.Desc_Prioridad PRIORIDAD,B.UM_CONCAR UM, B.Cantidad_aprobada PEDIDO,B.CantidadEnviada ENVIADO, B.estadoConsolidado ESTADO,
         B.fechaenvio FECHA, B.tiempo TIEMPO, B.conformidad CONFORMIDAD
          
         from requerimiento A left join requerimiento_det B on B.idRequerimiento=A.idRequerimiento
         left join req_prioridad C on C.IdPrioridad=B.IdPrioridad
         where year(A.Fecha_Requerimiento)='${anio}' and month(A.Fecha_Requerimiento) in (${meses.join()}) 
        and A.tipo='mensual' and A.ccosto IN (${uppsMap.join()})
        and B.Idprioridad in (${prioridades.join()})
        )Y
        order by mes_nro,SEDE,FAMILIA,DETALLE
        
        `, {})

            let pushDataC = []
            let pushDataNc = []
            let pushDataF = []
            for (const mes of meses) {
                const listaTotalMensual = data.filter(d => d.mes_nro == mes)
                const totalCompleto = listaTotalMensual.filter(d => d.CONFORMIDAD && d.CONFORMIDAD.trim() == 'C').length
                const totalNoCumple = listaTotalMensual.filter(d => d.CONFORMIDAD && d.CONFORMIDAD.trim() == 'NC').length
                const totalFallo = listaTotalMensual.filter(d => d.CONFORMIDAD && d.CONFORMIDAD.trim() == 'F').length
                const calculoCompleto = listaTotalMensual.length == 0 ? 0 : (totalCompleto / listaTotalMensual.length * 100)
                const calculoNoCumple = listaTotalMensual.length == 0 ? 0 : (totalNoCumple / listaTotalMensual.length * 100)
                const calculoFallo = listaTotalMensual.length == 0 ? 0 : (totalFallo / listaTotalMensual.length * 100)
                pushDataC.push(Number(calculoCompleto.toFixed(2)))
                pushDataNc.push(Number(calculoNoCumple.toFixed(2)))
                pushDataF.push(Number(calculoFallo.toFixed(2)))

            }
            dataMensual.push({ name: "C", data: pushDataC, color: "#92D14F" })
            dataMensual.push({ name: "NC", data: pushDataNc, color: "#FDC100" })
            dataMensual.push({ name: "F", data: pushDataF, color: "#FE0002" })
            const totalCompleto = data.filter(d => d.CONFORMIDAD && d.CONFORMIDAD.trim() == 'C').length
            const totalNoCumple = data.filter(d => d.CONFORMIDAD && d.CONFORMIDAD.trim() == 'NC').length
            const totalFallo = data.filter(d => d.CONFORMIDAD && d.CONFORMIDAD.trim() == 'F').length
            return { data, totalCompleto, totalFallo, totalNoCumple, dataMensual }
        } catch (error) {
            throw error
        }




    },
    exportarExcelMensual: async function (data) {

    },
    async statusAllRequirement(id, code) {
        const notes = [];//await requerimientos.getEntryNotes(id);
        const upps = [];
        //await requerimientos.getTransfersPerRequirement(code);
        let sql = `select 
        rd.IdRequerimiento,
        re.Fecha_Requerimiento,
        rd.IdRequerimientodet,
        rd.porcentajeRecepcion,
        @q:=if(ifnull(cd.idRequerimientoDet,-1)>0,rd.Cantidad_aprobada,0) as q,
        rd.cantidadRecepcionada,
        rd.Codigo_prod,
        rd.Descripcion,
        rd.observacion,
        rd.Cantidad as requerida,
        DATE_FORMAT(c.fecha_cotizacion,'%Y-%m-%d') as fecha_cotizacion,
        month(re.Fecha_Requerimiento) as fechaRequerimientoMonth,
        rd.Cantidad_aprobada,
        if(c.estado=5,@q,0) as transferida,
        if(c.estado in(3,5),@q,0) as cotizada,
        rd.familia_CONCAR as familia
        from requerimiento_det as rd
        left join requerimiento as re on re.idRequerimiento=rd.IdRequerimiento
        left join cotizacion_prov as cd on cd.idRequerimientoDet=rd.IdRequerimientodet
        left join cotizacion as c  on (c.idCotizacion=cd.idCotizacion and c.estado in(3,5) )
        where rd.IdRequerimiento in (${id})
        group by rd.IdRequerimientodet  order by rd.Descripcion `;
        const data = await db.query(sql);
        codigos = data.map(p => "'" + p.Codigo_prod.trim() + "'");
        codigos = codigos.filter((thing, index, self) =>
            index === self.findIndex((t) => (
                t === thing
            ))
        )
        codigos = codigos.join(',');
        const pool = await poolPromise;
        var query = `SELECT A.C5_CRFNDO2,A.C5_CALMA,A.C5_CNUMDOC,A.C5_DFECDOC,C5_CRFTDOC,A.C5_CRFNDOC,A.C5_CNUMORD ,B.C6_CCODIGO,C6_CDESCRI, C6_NCANTID
        FROM RSFACCAR.dbo.AL0003MOVC A LEFT JOIN RSFACCAR.dbo.AL0003MOVD B ON B.C6_CTD=A.C5_CTD AND B.C6_CALMA=A.C5_CALMA  
        AND B.C6_CNUMDOC=A.C5_CNUMDOC and a.C5_CTD='GS'
        where A.C5_CRFNDO2 in (${code}) and C6_CCODIGO in (${codigos})`;
        let response = await pool.query(query);
        response = response.recordset;
        //console.log(response);C6_CDESCRI

        let have_upps = Object.keys(upps).length > 0;
        let have_notes = Object.keys(notes).length > 0;

        for (let d of data) {
            var mm = moment(d.Fecha_Requerimiento).month();
            let detalles = response.filter(p => p.C6_CDESCRI.trim() === d.Descripcion.trim())
            let coincidencias = data.filter(p => moment(p.Fecha_Requerimiento).month() == moment(d.Fecha_Requerimiento).month())
            if (detalles.length > 0) {
                var reques = await db.query(`select concat(rdf.serie,lpad(rdf.CodRequerimiento,4,'0')) as code from requerimiento rdf where idRequerimiento = ?`, [d.IdRequerimiento]);
                reques = reques[0];
                detalles = detalles.filter(p => p.C5_CRFNDO2.trim() == reques.code.trim());
                let total = detalles.reduce((counter, element) =>
                    counter + element.C6_NCANTID
                    , 0)
                let codes = detalles.map((element) => {
                    if (element.C5_CRFNDO2.trim() != '') {
                        return "'" + element.C5_CRFNDO2.trim() + "'"
                    }
                }
                )
                d.sql_server_total = total;
                d.codes = codes.join(',');
                //d.porcentaje = ((d.Cantidad_aprobada/d.requerida)*(d.transferida/d.Cantidad_aprobada)*100).toFixed(2)+'%';
                //d.porcentaje = ((1/data.length)*(d.sql_server_total/d.Cantidad_aprobada)).toFixed(2);
                var c1 = Number((1 / coincidencias.length).toFixed(9));
                var c2 = d.Cantidad_aprobada == 0 ? 0 : Number((d.sql_server_total / d.Cantidad_aprobada).toFixed(9));
                d.porcentaje = Number((c1 * c2).toFixed(9));
                /*    if (d.porcentaje >= 1) {
                       console.log("porcentaje infinito", d.porcentaje);
                   } */
            } else {
                d.sql_server_total = 0;
                d.porcentaje = 0;
            }
        }
        return data;
    },
    async getBlackListProducts() {
        let sql = "select code from black_list_products";
        const data = await db.query(sql);
        if (data) {
            return data.map(p => p.code);
        }
        return [];
    }
}
module.exports = requerimientos;