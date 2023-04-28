const moment = require('moment');
var db = require('../dbconnection');
var fs = require('fs');
var Excel = require('exceljs');
var workbook = new Excel.Workbook();
const mysql = require("../dbconnectionPromise")

const { poolPromise } = require('../dbconnectionMSSQL')
const sendEmail = require('./sendEmail');
const usuario = require('./usuario');
const requerimientoModel = require("./requerimientos");
const connection = require('../dbconnection');
const typesCcostEsoftcom = [
    {
        name: "Servicio", typeEsoftcom: "S", ocCcondic: "",
        citmPor: "",
        cdscPor: "",
        cigvPor: "",
        ciscPor: "",
        ocCtipent: "", ocNimpfac: 0
    },
    {
        name: "Compra", typeEsoftcom: "N", ocCcondic: "",
        citmPor: "",
        cdscPor: "",
        cigvPor: "",
        ciscPor: "",
        ocCtipent: "", ocNimpfac: 0
    }, {
        name: "Importacion", typeEsoftcom: "I", ocCcondic: "02",
        citmPor: "N",
        cdscPor: "N",
        cigvPor: "N",
        ciscPor: "N",
        ocCtipent: "01", ocNimpfac: ""
    }]
const states = [{ state: 1, name: "creado" },
{ state: 2, name: "Por aprobar" },
{ state: 3, name: "Aprobado" },
{ state: 4, name: "regresada a aprobar" },
{ state: 5, name: "transferido" },
{ state: 6, name: "Pendiente" },
{ state: 7, name: "eliminado" },
{ state: 8, name: "anulado" },
{ state: 9, name: "transferido parcialmente" }]
const porcentajeIGV = 0.18
const statesCotizacionProv = [
    {
        state: 0, name: "creado"

    },
    { state: 1, name: "seleccionado" },
    { state: 2, name: "anulado" },
    { state: 3, name: "transferido" }]
const ccostoConcar = [
    {
        ccosto: "admin", codigoConcar: "00001"
    },
    { ccosto: "granj", codigoConcar: "00003" },
    { ccosto: "plant", codigoConcar: "00002" }
]

const tipoMonedas = [
    { moneda: "Soles", tipo: "MN" },
    { moneda: "Dolares", tipo: "US" }
]
const cotizacion = {
    enviarDeAprobadoAPorAprobar: async (cotizacion) => {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            await connection.query("update cotizacion set estado=4,textoRegresoAprobar=? where idCotizacion=?", [cotizacion.textoRegresoAprobar, cotizacion.id])
            await connection.query("update cotizacion_prov set estado=0 where idCotizacion=?", [cotizacion.id])
            await connection.query("COMMIT")
        }
        catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            await connection.release();

        }
        return new Promise((resolve, reject) => {
            db.query("update cotizacion set estado=4,textoRegresoAprobar=? where idCotizacion=?", [cotizacion.textoRegresoAprobar, cotizacion.id], async (err, result) => {
                if (err) reject(err)
                resolve()
            })
        })

    },

    getDestinesForCotizacionAprob: () => {
        return new Promise((resolve, reject) => {
            db.query(`select email from destinatarios_log where cotizacion_aprob=1 and Estado=1`, (err, result) => {
                if (err) reject(err)
                resolve(result);

            })
        })
    },
    guardarCotizacionDet: async function (cotizacionesDet = [], cotizacionId = 0) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            const cotizacionesDetValues = cotizacionesDet.map((re) => [re.idCotizacion, re.codigoProducto, re.id])
            if (cotizacionId > 0) {
                await connection.query("DELETE FROM cotizacion_det WHERE idCotizacion = ?", [cotizacionId])
            }
            await connection.query("insert into cotizacion_det(idCotizacion,codig_prod,idRequerimientoDet) values?", [cotizacionesDetValues])
            await connection.query("COMMIT")
        }
        catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            await connection.release();

        }
        /*    const requerimiento = this;
           return new Promise(async (resolve, reject) => {
               const cotizacionesDetValues = cotizacionesDet.map((re) => [re.idCotizacion, re.codigoProducto, re.id])
               db.query("insert into cotizacion_det(idCotizacion,codig_prod,idRequerimientoDet) values?",
                   [cotizacionesDetValues], async (err, results) => {
                       if (err) reject(err)
                       resolve();
                        const requerimientoCotizaconDet = cotizacionesDet.map((cotizacionDet) => ([cotizacionDet.id, idCotizacionDetalle]));
                       await requerimiento.guardarCotizacionDetYRequerimientoDet(requerimientoCotizaconDet)
                        
                   })
           }) */
    },
    exportarCotizaciones: function (cotizacion) {
        let isTransformUs = false
        if (cotizacion.moneda == "MN" && cotizacion.monedaOC == "US") {
            isTransformUs = true;
        }
        const rutaTemplateHC = "/template/contizacion.xlsx";
        const borderStyles = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
        };
        try {
            if (fs.existsSync(`.${rutaTemplateHC}`)) {
                fs.unlinkSync(`.${rutaTemplateHC}`)
            }
            const cotizacionFile = this;
            workbook.xlsx.readFile("./template/plantilla_cotizaciones_aprobadas_y_transferidas.xlsx").then(() => {
                const listaValoresPintarMoneda = [`Sub Total ${cotizacion.monedaCambio}`, `Igv ${cotizacion.monedaCambio}`, `Total ${cotizacion.monedaCambio}`]
                return new Promise((resolve, reject) => {
                    workbook.eachSheet(async (worksheet, sheetId) => {
                        try {
                            worksheet.name = "cotizacion"
                            let cellN = 12;
                            worksheet.getCell("B6").value = cotizacion.solicitado.nombre
                            worksheet.getCell("B8").value = cotizacion.nroCotizacion.toString().padStart("000")
                            worksheet.getCell("J6").value = cotizacion.fechaCotizacion
                            worksheet.getCell("C8").value = `N° Requerimiento: ${cotizacion.numeroRequerimiento}`
                            const cotizacionesProv = cotizacion.cotizacionesProv;
                            let mergeCellIndex = 12;
                            for (let i = 0; i < cotizacionesProv.length; i++) {
                                const proveedor = cotizacionesProv[i]
                                for (let index = 0; index < proveedor.productos.length; index++) {
                                    const ccostValue = [{
                                        posicion: "D",
                                        ccosto: "granj",
                                        valor: null
                                    }, {
                                        posicion: "F",
                                        ccosto: "admin",
                                        valor: null
                                    }, {
                                        posicion: "E",
                                        ccosto: "plant",
                                        valor: null
                                    }]
                                    const producto = proveedor.productos[index]
                                    const total = isTransformUs && producto.us * producto.cantidad || producto.total
                                    worksheet.getCell('A' + (cellN)).value = proveedor.proveedor.proveedorCotizacion.AC_CNOMBRE;
                                    worksheet.getCell(`A${cellN}`).border = borderStyles;
                                    worksheet.getCell('B' + (cellN)).value = producto.producto.descripcion
                                    worksheet.getCell(`B${cellN}`).border = borderStyles;
                                    worksheet.getCell('C' + (cellN)).value = producto.observacion
                                    worksheet.getCell(`C${cellN}`).border = borderStyles;
                                    if (producto.producto.groupName) {
                                        cotizacionFile.selectValueGroupName(producto.producto.groupName, ccostValue).forEach((data) => {
                                            worksheet.getCell(data.posicion + (cellN)).value = data.valor
                                            worksheet.getCell(data.posicion + (cellN)).border = borderStyles;
                                        })
                                    }
                                    worksheet.getCell(`D${cellN}`).border = borderStyles;
                                    worksheet.getCell(`E${cellN}`).border = borderStyles;
                                    worksheet.getCell(`F${cellN}`).border = borderStyles;
                                    worksheet.getCell('G' + (cellN)).value = producto.cantidad
                                    worksheet.getCell(`G${cellN}`).border = borderStyles;
                                    worksheet.getCell('H' + (cellN)).value = producto.um;
                                    worksheet.getCell(`H${cellN}`).border = borderStyles;
                                    worksheet.getCell('I' + (cellN)).value = producto.precio;
                                    worksheet.getCell(`I${cellN}`).border = borderStyles;
                                    worksheet.getCell('J' + (cellN)).value = producto.us;
                                    worksheet.getCell(`J${cellN}`).border = borderStyles;
                                    worksheet.getCell('K' + (cellN)).value = total;
                                    worksheet.getCell(`K${cellN}`).border = borderStyles;
                          /*           if (listaValoresPintarMoneda.includes(producto.us)) {
                                        worksheet.getCell('L' + (cellN)).value = `${cotizacion.moneda}`;
                                    }
 */
                                    cellN += 1
                                }
                                worksheet.mergeCells(`A${mergeCellIndex}:A${cellN - 1}`)
                                mergeCellIndex = cellN;
                            }
                            if (cotizacion.idUsuarioAprobacion) {
                                this.drawFirma(cotizacion.idUsuarioAprobacion, "APROBADO POR: " + cotizacion.usuarioAprobacion, workbook, worksheet, cellN + 2)
                            }
                            /*                       worksheet.getCell("J" + (cellN + 1)).value = "SUBTOTAL"
                                                  worksheet.getCell("K" + (cellN + 1)).border = borderStyles
                      
                                                  worksheet.getCell("J" + (cellN + 2)).value = "IGV 18%"
                                                  worksheet.getCell("K" + (cellN + 2)).border = borderStyles
                      
                                                  worksheet.getCell("J" + (cellN + 3)).value = "TOTAL"
                                                  worksheet.getCell("K" + (cellN + 3)).border = borderStyles */
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
                rutaCM: `/supergen-be${rutaTemplateHC}`
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
    selectValueGroupName: function (groupName = "", array = []) {
        const groupNameArray = groupName.includes("/") != false ? groupName.split("/") : [{ groupName }].map((a) => a.groupName)
        return array.map((data) => {
            const group = groupNameArray.find((a) => a.includes(data.ccosto))
            if (group) {
                data.valor = group.replace(data.ccosto, "")
            }
            return data;
        })

    },
    drawFirma: function (idUsuarioAprobado, texto, workbook, excel, lastRow) {
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
        row.getCell(2).value = `${texto}`
        row.getCell(2).border = borderStyles;
        excel.mergeCells(lastRow + 2, 2, lastRow + 6, 2)
        excel.addImage(firmaImage, {
            tl: { col: 1, row: lastRow + 1 },
            ext: { width: 80, height: 80 },
            editAs: "absolute"

        })
    },
    exportarExcelCotizacionConsolidado: function (rows) {
        const rutaTemplateHC = "/template/contizacion consolidado.xlsx";
        try {
            if (fs.existsSync(`.${rutaTemplateHC}`)) {
                fs.unlinkSync(`.${rutaTemplateHC}`)
            }
            workbook.xlsx.readFile("./template/Plantilla cotizacion consolidado.xlsx").then(() => {
                return new Promise((resolve, reject) => {
                    workbook.eachSheet(async (worksheet, sheetId) => {
                        try {
                            worksheet.name = "Consolidado"
                            let cellN = 7;
                            for (let i = 0; i < rows.length; i++) {
                                const c = rows[i]
                                worksheet.getCell('A' + (cellN)).value = c.familia;
                                worksheet.getCell('B' + (cellN)).value = c.descripcion;
                                worksheet.getCell('C' + (cellN)).value = c.codigoProducto;
                                worksheet.getCell('D' + (cellN)).value = c.groupName;
                                worksheet.getCell('E' + (cellN)).value = c.total;
                                cellN++
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
                rutaCM: `/supergen-be${rutaTemplateHC}`
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
    guardarCotizacionDetYRequerimientoDet: function (requerimientosCotizaciones) {
        return new Promise((resolve, reject) => {
            db.query("insert into cotizaciondet_requerimientodet(idRequerimientoDet,idCotizacionDet) values ?", [requerimientosCotizaciones], (err, results) => {
                if (err) reject(err)
                resolve();
            })
        })
    },
    guardarCotizacionProv: async function (cotizaciones = [], cotizacionId) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            let cotizacionesMap = cotizaciones.reduce((acc, current) => {
                const requerimientosDet = current.producto.idRequerimientoDet.map((req => ({ idRequerimientoDet: req, ...current })))
                acc = acc.concat(requerimientosDet)
                return acc;
            }, [])
            cotizacionesMap =
                cotizacionesMap.map((cotizacion) => [cotizacion.idItem, cotizacion.proveedorCotizacion.precio, cotizacion.proveedorCotizacion.us,
                parseFloat(cotizacion.total), cotizacion.producto.descripcion, cotizacion.producto.codigoProducto,
                cotizacion.proveedorCotizacion.AC_CNOMBRE, cotizacion.proveedorCotizacion.AC_CCODIGO.toString().trim(), cotizacion.idCotizacion, cotizacion.producto.um, cotizacion.cantidad, cotizacion.idRequerimientoDet, moment(cotizacion.fechaEntrega).format("YYYY-MM-DD"), cotizacion.lugarEntrega, cotizacion.formaPago, cotizacion.producto.groupName, cotizacion.observacion, cotizacion.isIgv])
            if (cotizacionId > 0) {
                const requerimientoDetalleCotizacionProv = await connection.query("select idRequerimientoDet from cotizacion_prov where idCotizacion=?", [cotizacionId])
                if (requerimientoDetalleCotizacionProv.length > 0) {
                    await requerimientoModel.cambiarEstadoACotizadoRequerimientoDetalle(requerimientoDetalleCotizacionProv.map(cotizacionProv => (cotizacionProv.idRequerimientoDet)), 1)
                }
                await connection.query("DELETE FROM cotizacion_prov WHERE idCotizacion = ?", [cotizacionId])
            }
            await connection.query("insert into cotizacion_prov(idItem,precio,us,total,detalle_prod,cod_prod,nombreProv,codProv,idCotizacion,um,cantidad,idRequerimientoDet,fechaEntrega,lugarEntrega,formaPago,upp,observacion,igv) values ?", [cotizacionesMap]);
            const cotizacionRequerimientoDetalle = cotizaciones.map((cotizacion) => (cotizacion.producto.idRequerimientoDet)).reduce((acc, current) => {
                acc = acc.concat(current)
                return acc;
            }, [])
            await requerimientoModel.cambiarEstadoACotizadoRequerimientoDetalle(cotizacionRequerimientoDetalle)
            //await requerimientoModel.actualizarObservacionRequerimientoDetalle(cotizaciones.map((cotizacion) => ({ id: cotizacion.producto.idRequerimientoDet, observacion: cotizacion.observacion })));
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
        /*   return new Promise((resolve, reject) => {
              db.query("insert into cotizacion_prov(idItem,precio,total,detalle_prod,cod_prod,nombreProv,codProv,idCotizacion,um,cantidad,idRequerimientoDet,fechaEntrega,lugarEntrega,formaPago,upp) values ?", [cotizacionesMap], (err, result) => {
                  if (err) reject(err)
                  resolve();
              })
          }) */
    },
    editarCotizacion: async function (cotizacionParam) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            await connection.query(`update cotizacion set familia=?,upp=?,fecha_cotizacion=?,moneda=?,tipoReq=?,ccosto=?,
           estado=? where idCotizacion=?`,
                [cotizacionParam.familia, cotizacionParam.upp, moment(cotizacionParam.fechaCotizacion).format("YYYY-MM-DD"), cotizacionParam.moneda,
                cotizacionParam.tipoReq, cotizacionParam.ccosto, cotizacionParam.estado, cotizacionParam.id])
            if (cotizacionParam.adjuntos.length > 0) {
                await this.guardaAdjuntos(cotizacionParam.adjuntos, cotizacionParam.id)
            }
            let isIgv = 1;
            const { Desc_tipoReq = "NO EXISTE" } = (await connection.query("select * from req_tiporeq where IdTipoReq=?", [Number(cotizacionParam.tipoReq)]))[0] || {}
            if (Desc_tipoReq.includes("Importacion")) {
                isIgv = 0;
            }
            const requerimientosMap = cotizacionParam.requerimientos.map((requerimiento) => ({ ...requerimiento, idCotizacion: cotizacionParam.id }))
            await this.guardarCotizacionDet(requerimientosMap, cotizacionParam.id)
            if (cotizacionParam.estado != 6) {
                const cotizacionMap = cotizacionParam.cotizaciones.map((cotizacion) => ({ ...cotizacion, idCotizacion: cotizacionParam.id, isIgv }))
                await this.guardarCotizacionProv(cotizacionMap, cotizacionParam.id);
            }
            await connection.query("COMMIT");
        } catch (error) {
            console.log("erro", error)
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            await connection.release()
        }
    },
    eliminarCotizacion: async function (idCotizacion) {
        const connection = await mysql.connection();

        try {
            await connection.query("START TRANSACTION");
            await connection.query("COMMIT");
            const detallesProv = await this.detalleProvPorCotizacion(idCotizacion)
            await connection.query("update  cotizacion set estado=7 where idCotizacion=?", [idCotizacion])
            if (detallesProv.length > 0) {
                await requerimientoModel.cambiarEstadoACotizadoRequerimientoDetalle(detallesProv.map((cotizacion) => (cotizacion.producto.idRequerimientoDet)).reduce((acc, current) => {
                    if (!acc.find((r) => r == current)) acc.push(current)
                    return acc;
                }, []), 1)
            }
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;

        } finally {
            await connection.release()


        }
    },
    guardarCotizacion: async function (cotizaconCabecera) {
        const cotizacion = this;
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            let isIgv = 1;
            const { Desc_tipoReq = "NO EXISTE" } = (await connection.query("select * from req_tiporeq where IdTipoReq=?", [Number(cotizaconCabecera.tipoReq)]))[0] || {}
            if (Desc_tipoReq.includes("Importacion")) {
                isIgv = 0;
            }

            const results = await connection.query(`insert into cotizacion(idUsuario,fecha_registro,fecha_cotizacion,
    nro_cotizacion,familia,upp,moneda,ccosto,tipoReq,estado,store) values(?,?,?,?,?,?,?,?,?,?,?)`,
                [cotizaconCabecera.user, moment().toDate(),
                moment(cotizaconCabecera.fechaCotizacion).format("YYYY-MM-DD"),
                cotizaconCabecera.nroCotizacion, cotizaconCabecera.familia,
                cotizaconCabecera.upp, cotizaconCabecera.moneda
                    , cotizaconCabecera.ccosto, cotizaconCabecera.tipoReq,
                cotizaconCabecera.estado, cotizaconCabecera.store])
            const idCotizacion = results.insertId;
            if (cotizaconCabecera.adjuntos.length > 0) {
                await cotizacion.guardaAdjuntos(cotizaconCabecera.adjuntos, idCotizacion)
            }
            const requerimientosMap = cotizaconCabecera.requerimientos.map((requerimiento) => ({ ...requerimiento, idCotizacion: idCotizacion }))

            await cotizacion.guardarCotizacionDet(requerimientosMap);
            if (cotizaconCabecera.estado != 6) {
                const cotizacionMap = cotizaconCabecera.cotizaciones.map((cotizacion) => ({ ...cotizacion, idCotizacion: idCotizacion, isIgv }))
                await cotizacion.guardarCotizacionProv(cotizacionMap, 0);
            }
            await connection.query("COMMIT")
        } catch (error) {
            await connection.query("ROLLBACK")
            throw error;
        } finally {
            await connection.release();
        }


    },
    getFormaPago: function () {
        return new Promise(async (resolve, reject) => {
            try {

                const pool = await poolPromise
                const result = await pool.request().query(`Select * From RSCONCAR..CP0003TAGP Where TG_INDICE='51' Order By TG_DESCRI`)
                resolve(result.recordset)
            } catch (error) {
                reject(error)
            }
        })
    },
    guardaAdjuntos: async function (adjuntos = [], cotizacionId) {
        const connection = await mysql.connection();

        try {
            await connection.query("START TRANSACTION");
            const adjuntoMap = adjuntos.map((adjunto) => [adjunto.nombre, adjunto.url, "cotizacion", cotizacionId])
            await connection.query("insert into archivos(nombre,ruta,tipoObjeto,objetoId) values ?", [adjuntoMap])
            await connection.query("COMMIT")
        } catch (error) {
            await connection.query("ROLLBACK")
            throw error;
        } finally {
            await connection.release();
        }
        /*  return new Promise((resolve, reject) => {
             const adjuntoMap = adjuntos.map((adjunto) => [adjunto.nombre, adjunto.url, "cotizacion", cotizacionId])
             db.query("insert into archivos(nombre,ruta,tipoObjeto,objetoId) values ?", [adjuntoMap], (err, result) => {
                 if (err) reject(err)
                 resolve()
             })
 
         }) */
    },
    eliminarCotizacionProv: async (idCotizacionProv) => {
        const connection = await mysql.connection();

        try {
            const requerimientoDetalle = await connection.query("select idRequerimientoDet from cotizacion_prov where id=?", [idCotizacionProv]);
            await requerimientoModel.cambiarEstadoACotizadoRequerimientoDetalle([requerimientoDetalle[0].idRequerimientoDet], 1)
            await connection.query("update cotizacion_prov set estado=2 where id=?", [idCotizacionProv])
        } catch (error) {
            throw error;
        } finally {
            await connection.release();
        }
    },
    listarCoticacionesFiltrados: ({ fechaInicio = '', fechaFin = '', estados = [] }) => {
        return new Promise((resolve, reject) => {
            db.query(`select co.store,co.fecha_transferencia,co.monedaOc,co.fecha_registro,co.moneda,co.fecha_transferencia,
            usuarioTransferencia.Nombre as usuarioTransferencia,DATE_FORMAT(co.fecha_aprobacion,'%Y-%m-%d') 
            as fecha_aprobacion,co.idCotizacion as id,tipoReq.*,co.ccosto,
            co.familia,co.estado,co.upp,co.nro_cotizacion as nroCotizacion,
            DATE_FORMAT(co.fecha_cotizacion,'%Y-%m-%d') as fechaCotizacion,us.idUsuario,
            us.Nombre,(select r.idSolicitante from cotizacion_det as cd join requerimiento_det as rd 
                on rd.IdRequerimientodet=cd.idRequerimientoDet join requerimiento as r on 
                r.idRequerimiento=rd.IdRequerimiento where cd.idCotizacion=co.idCotizacion limit 1) 
                as idSolicitante
                 from cotizacion co 
            INNER JOIN usuario us on us.idUsuario=co.idUsuario 
            left join usuario as usuarioTransferencia on 
            usuarioTransferencia.idUsuario=co.idUsuarioTransferencia
            inner join req_tiporeq tipoReq on tipoReq.IdTipoReq=co.tipoReq
    where co.fecha_registro>='${moment(fechaInicio).format("YYYY-MM-DD")}' and 
    co.fecha_registro<='${moment(fechaFin).format("YYYY-MM-DD")}' 
    and co.estado in(${estados.join(',')})  
    order by co.nro_cotizacion asc`, (err, results) => {
                if (err) reject(err)
                const contizacionesMap = results.map((result) => ({
                    ...result, fecha_registro: moment(result.fecha_registro).format("YYYY-MM-DD"),
                    tipo: { id: result.tipoReq, nombre: result.Desc_tipoReq },
                    solicitado: { id: result.idUsuario, nombre: result.Nombre }, fecha_aprobacion: moment(result.fecha_aprobacion).format("YYYY-MM-DD")
                }))
                resolve(contizacionesMap)

            })
        })
    },
    listarCotizaciones: function (fechaInicio = "", fechaFin) {
        const cotizacionFile = this;
        return new Promise((resolve, reject) => {
            db.query(`select co.store,co.idCotizacion as id,co.monedaOC,co.familia,co.textoRegresoAprobar,co.estado,
            co.moneda,co.tipoReq,co.fecha_transferencia,
            (select group_concat(numero_orden)  from cotizacion_transferencia where 
            id_cotizacion=co.idCotizacion group by id_cotizacion)
             as req_sofcom,co.ccosto,
            uTran.Nombre as usuarioTransferencia,
            co.upp,co.nro_cotizacion as nroCotizacion,DATE_FORMAT(co.fecha_cotizacion,'%Y-%m-%d') as fechaCotizacion,
            us.idUsuario,us.Nombre,uAprobacion.Nombre as usuarioAprobacion,co.idUsuarioAprobacion from cotizacion 
            co INNER JOIN usuario us on us.idUsuario=co.idUsuario left join usuario uTran 
            on uTran.idUsuario=co.idUsuarioTransferencia left join usuario uAprobacion 
            on uAprobacion.idUsuario=co.idUsuarioAprobacion where co.fecha_registro BETWEEN '${moment(fechaInicio).format("YYYY-MM-DD")}' and '${moment(fechaFin).format("YYYY-MM-DD")}'
            order by co.nro_cotizacion desc `,
                async (err, results) => {
                    try {
                        if (err) reject(err)
                        let cotizacionesMap = results.map((result) => ({ ...result, solicitado: { id: result.idUsuario, nombre: result.Nombre }, estadoName: states.find(state => state.state == result.estado).name }))
                        if (cotizacionesMap.length > 0) {
                            const adjuntos = await cotizacionFile.listarAdjuntos(cotizacionesMap.map((cotizacion) => cotizacion.id));
                            const numeroRequerimientoCotizaciones = await db.query(`select distinct concat_ws('0', C.serie, C.CodRequerimiento) numeroRequerimiento,A.idCotizacion
                            from cotizacion_prov A 
                            left join requerimiento_det B on B.IdRequerimientodet=A.IdRequerimientoDet
                            left join requerimiento C on C.IdRequerimiento=B.IdRequerimiento
                            where A.idCotizacion in(${cotizacionesMap.map(m => m.id).join()}) and A.estado<>0`)
                            cotizacionesMap = cotizacionesMap.map((cotizacion) => {
                                cotizacion.adjuntos = adjuntos.filter((adjunto) => adjunto.objetoId == cotizacion.id)
                                cotizacion.numeroRequerimiento = numeroRequerimientoCotizaciones.filter(numero => numero.idCotizacion == cotizacion.id).map(c => c.numeroRequerimiento).join()
                                return cotizacion;
                            })
                        }
                        resolve(cotizacionesMap)

                    } catch (error) {

                    }
                })
        })
    },
    listarAdjuntos: (ids = []) => {
        return new Promise((resolve, reject) => {
            db.query(`select * from archivos where tipoObjeto='cotizacion' and objetoId in(${ids.join()}) and estado=1`, (err, results) => {
                if (err) reject(err)
                resolve(results);
            })
        })
    },
    detallesPorCotizacion: function (cotizacionId) {
        const contizacionFile = this
        return new Promise((resolve, reject) => {
            db.query(`select CONCAT(DATE_FORMAT(req.Fecha_Requerimiento,'%Y'),'-',req.CodRequerimiento) as nombreReq, req_det.Cantidad_aprobada as cantidadAprobada, cot_det.idRequerimientoDet as id,cot_det.codig_prod as codigoProducto,
            req_det.familia_CONCAR as familia,req_det.Cantidad as cantidad,req_det.Iditem as 'order',req_det.Descripcion as descripcion,req_det.observacion,
            req.ccosto from cotizacion_det cot_det INNER JOIN requerimiento_det req_det on req_det.IdRequerimientodet=cot_det.idRequerimientoDet 
            INNER JOIN requerimiento req on req.idRequerimiento=req_det.IdRequerimiento
            where cot_det.idCotizacion=?`, [cotizacionId], async (err, results) => {
                if (err) reject(err)
                try {
                    const cotizaciones = await contizacionFile.detalleProvPorCotizacion(cotizacionId)
                    resolve({ requerimientosDet: results, cotizaciones })

                } catch (error) {
                    reject(error)
                }
            })
        })
    },
    exportarExcelFiltrado: function (data) {
        let rutaCM = "/template/proveedor cotizaciones.xlsx";
        const fileCartilla = this;
        try {
            if (fs.existsSync("./template/proveedor cotizaciones.xlsx")) {
                fs.unlinkSync("./template/proveedor cotizaciones.xlsx")
            }
            workbook.xlsx.readFile('./template/Plantilla-cotizacion-proveedor.xlsx')
                .then(async function (work) {
                    return new Promise((resolve, reject) => {
                        workbook.eachSheet(async function (worksheet, sheetId) {
                            let cellN = 8;
                            const borderStyles = {
                                top: { style: "thin" },
                                left: { style: "thin" },
                                bottom: { style: "thin" },
                                right: { style: "thin" }
                            };
                            worksheet.getCell("B3").value = `DEL ${moment(data.cabecera.fechaInicio).format("YYYY-MM-DD")} AL ${moment(data.cabecera.fechaFin).format("YYYY-MM-DD")}`
                            worksheet.getCell("C5").value = `${data.cabecera.supplier.AC_CNOMBRE}`
                            const sumaTotalPrecion = parseFloat(data.detalles.reduce((prev, current) => prev + current.total, 0)).toFixed(2)
                            data.detalles.forEach((producto) => {
                                worksheet.getCell("B" + cellN).value = producto.nro_cotizacion
                                worksheet.getCell("B" + cellN).border = borderStyles;
                                worksheet.getCell("C" + cellN).value = producto.estado;
                                worksheet.getCell("C" + cellN).border = borderStyles;
                                worksheet.getCell("D" + cellN).border = borderStyles;
                                worksheet.getCell("D" + cellN).value = producto.fecha_cotizacion;
                                worksheet.getCell("E" + cellN).value = producto.moneda;
                                worksheet.getCell("E" + cellN).border = borderStyles;
                                worksheet.getCell("F" + cellN).value = producto.detalle_prod;
                                worksheet.getCell("F" + cellN).border = borderStyles;
                                worksheet.getCell("G" + cellN).value = producto.observacion;
                                worksheet.getCell("G" + cellN).border = borderStyles;
                                worksheet.getCell("H" + cellN).value = producto.cantidad;
                                worksheet.getCell("H" + cellN).border = borderStyles;
                                worksheet.getCell("I" + cellN).value = producto.precio;
                                worksheet.getCell("I" + cellN).border = borderStyles;
                                worksheet.getCell("J" + cellN).value = producto.total;
                                worksheet.getCell("J" + cellN).border = borderStyles;

                                if (producto.active) {
                                    worksheet.mergeCells(`B${cellN}:B${(producto.rowSpan - 1) + cellN}`)
                                    worksheet.mergeCells(`C${cellN}:C${(producto.rowSpan - 1) + cellN}`)
                                    worksheet.mergeCells(`D${cellN}:D${(producto.rowSpan - 1) + cellN}`)
                                    worksheet.mergeCells(`E${cellN}:E${(producto.rowSpan - 1) + cellN}`)

                                }
                                cellN++;
                            })
                            worksheet.getCell("I" + (cellN + 1)).value = 'SUB TOTAL';
                            worksheet.getCell("J" + (cellN + 1)).value = sumaTotalPrecion;
                            worksheet.getCell("J" + (cellN + 1)).border = borderStyles;

                            setTimeout(() => resolve(), 2000);
                        })
                    }).then(data => {
                        workbook.xlsx.writeFile("./template/proveedor cotizaciones.xlsx").then(function () {
                            console.log("xls file is written.");
                        });
                    })
                });
            json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM
            }
        } catch (error) {
            console.log('error :>> ', error);
            json = {
                success: false,
                message: "Error en el servidor => /Cartilla/ExportExcel",
                rutaCM
            }
        }
        return json
    },
    filtrarPorProveedorYFechas: async function (codigoProveedor, fechaInici, fechaFin) {
        const connection = await mysql.connection();

        try {
            const rows = await connection.query(`select co.idCotizacion,co.nro_cotizacion,DATE_FORMAT(co.fecha_registro,'%Y-%m-%d') as fecha_cotizacion,co.moneda,co.estado,cp.detalle_prod,cp.observacion,cp.precio,cp.total,cp.codProv,cp.nombreProv,cp.cantidad from cotizacion co INNER JOIN cotizacion_prov cp on cp.idCotizacion=co.idCotizacion
            where cp.estado=1 and co.estado in(3,5) and co.fecha_registro BETWEEN '${moment(fechaInici).format("YYYY-MM-DD")}' and '${moment(fechaFin).format("YYYY-MM-DD")}' and cp.codProv='${codigoProveedor}' `)
            return rows.reduce((prev, current, index) => {
                const exist = prev.find((data) => data.idCotizacion == current.idCotizacion) != null;
                if (!exist) {
                    const cotizacionFiltradas = rows.filter((data) => data.idCotizacion == current.idCotizacion)
                    prev = prev.concat(cotizacionFiltradas.map((data, index) => {
                        return { ...data, estado: states.find((state) => state.state == data.estado).name, rowSpan: cotizacionFiltradas.length, active: index == 0 }
                    }))
                }
                return prev;
            }, [])
        } catch (error) {
            throw error;

        } finally {
            await connection.release()


        }
    },
    deleteFile: function (id) {
        return new Promise((resolve, reject) => {
            db.query("update archivos set estado=0 where id=?", [id], (err, result) => {

                if (err) reject(err)
                resolve();
            })
        })
    },
    async validarRequerimientoEnCotizacion(idRequerimientoDetalle) {
        const cotizacionDetalle = await db.query(`select idDetalle from cotizacion_det where idRequerimientoDet=${idRequerimientoDetalle}`)
        return { permitido: cotizacionDetalle.length == 0 }
    },
    anularCotizacion: function (cotizacionId) {
        const cotizacionFile = this;
        return new Promise((resolve, reject) => {
            db.query("update cotizacion  set estado=8  where idCotizacion=?", [cotizacionId], async (err, result) => {
                try {
                    if (err) reject(err)
                    const cotizacionProv = (await cotizacionFile.detalleProvPorCotizacion(cotizacionId));
                    const cotizacionProvRequerimientoId = cotizacionProv.map((cot) => cot.producto.idRequerimientoDet).reduce((prev, idRequerimientoDet) => {
                        if (!prev.includes(idRequerimientoDet)) {
                            prev.push(idRequerimientoDet)
                        }
                        return prev;
                    }, [])
                    if (cotizacionProvRequerimientoId.length > 0) {
                        await requerimientoModel.cambiarEstadoACotizadoRequerimientoDetalle(cotizacionProvRequerimientoId, 1)
                    }
                    resolve();
                } catch (error) {
                    reject(error)
                }
            })

        })
        //

    },
    transicionarCotizacionEstadoDePorAprobarAAprobado: function (cotizacion, usuarioId) {
        const cotizacionFile = this;
        return new Promise(async (resolve, reject) => {
            db.query("update cotizacion  set estado=3 ,fecha_aprobacion=?,idUsuarioAprobacion=? where idCotizacion=?", [moment().format("YYYY-MM-DD"), usuarioId, cotizacion.id], async (err, result) => {
                try {
                    if (err) reject(err)
                    const destinatarios = (await cotizacionFile.getDestinesForCotizacionAprob()).map((des) => des.email);

                    //
                    const cotizacionProvNoSeleccionados = (await cotizacionFile.detalleProvPorCotizacion(cotizacion.id))
                        .filter((cotizacion, index, array) => array.filter(ar => ar.producto.idRequerimientoDet == cotizacion.producto.idRequerimientoDet).every((cotizacion) => cotizacion.estado == 0))
                    const cotizacionProvRequerimientoId = cotizacionProvNoSeleccionados.map((cot) => cot.producto.idRequerimientoDet).reduce((prev, idRequerimientoDet) => {
                        if (!prev.includes(idRequerimientoDet)) {
                            prev.push(idRequerimientoDet)
                        }
                        return prev;
                    }, [])
                    /*  if (cotizacionProvNoSeleccionados.length > 0) {
                         await db.query(`delete from cotizacion_prov where id in(${cotizacionProvNoSeleccionados.map(cot => cot.id).join()})`)
                     } */
                    if (cotizacionProvRequerimientoId.length > 0) {
                        await requerimientoModel.cambiarEstadoACotizadoRequerimientoDetalle(cotizacionProvRequerimientoId, 1)
                    }
                    const subject = `La cotizacion N°  ${moment().format("YYYY")}-${cotizacion.nroCotizacion} ha sido aprobada`;
                    const html = `<div>
                    <h2>Se ha aprobado el requerimiento</h2> 
                    <p>Fecha:${moment().format("YYYY-MM-DD H:mm")}</p>
                    <a href=${cotizacion.url}>Ver</a>
                    </div>`
                    sendEmail.sendEmail(subject, destinatarios, html);
                    resolve();
                } catch (error) {
                    reject(error)
                }

            })
        })
    },
    traerNumeroMaximoEsoftCom: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let number = 1;
                const pool = await poolPromise
                const result = await pool.request().query(`SELECT max(cast(RC_CNROREQ as integer)) NRO_REQ FROM RSFACCAR.DBO.AL0003REQC`)
                if (result.recordset[0]) number += result.recordset[0].NRO_REQ;
                resolve(number);
            } catch (error) {
                console.log("err", error)
                reject(error)
            }
        })

    },
    traerTipoCambioEsoftCom: () => {
        return new Promise(async (resolve, reject) => {
            try {
                const pool = await poolPromise
                const result = await pool.request().query(`Select XMEIMP2 from RSCONCAR..CTCAMB Where XFECCAM='${moment().format("YYMMDD")}' And XCODMON='US'`)
                resolve(result.recordset[0].XMEIMP2);
            } catch (error) {
                console.error("e", error)
                reject(error)
            }
        })
    },
    traerTipoCambioPorFecha: async (fecha) => {
        try {
            const pool = await poolPromise
            const result = await pool.request().query(`Select XMEIMP2 from RSCONCAR..CTCAMB Where XFECCAM='${moment(fecha, "YYYY-MM-DD").format("YYMMDD")}' And XCODMON='US'`)
            return result.recordset[0].XMEIMP2
        } catch (error) {
            console.error("e", error)
            throw error;
        }
    },
    /* eliminarCotizacion: async function (cotizacionId) {
        const connection = await mysql.connection();
 
        try {
            await connection.query("START TRANSACTION");
            await connection.query("update cotizacion estado=7 where id  idCotizacion=?", [cotizacionId])
            await
                await connection.query("COMMIT")
        } catch (error) {
            await connection.query("ROLLBACK")
            throw error;
        } finally {
            await connection.release();
        }
    }, */
    eliminarOrdenCompra: async function () {

    }, transferirAEsoftCom: async function (cotizacionCabecera, usuarioId) {
        try {

            return await this.quotationToEsoftt(cotizacionCabecera, usuarioId);
        } catch (error) {
            console.log("error", error)
            throw new Error("error", error)
        }

    },
    async quotationToEsoftt(args, user_id) {
        const connection = await mysql.connection();
        try {
            const pool = await poolPromise;
            const objetTypeEsftcom = typesCcostEsoftcom.find(t => t.name.includes(args.tipo.nombre))
            const type = objetTypeEsftcom.typeEsoftcom
            let ocNimpfac = 0
            let sql = `select Desc_Solicitante from req_solicitante where Cod_Solicitante='${args.idSolicitante}'`;
            const solicitante = await db.query(sql);
            if (solicitante.length == 0) {
                return { state: false, message: "Error al obtener el solicitante" };
            }

            let desc_solicitante = solicitante[0].Desc_Solicitante;
            const request_user = await usuario.getusuarioByIdPromise(args.idUsuario);
            if (request_user.length == 0) {
                return { state: false, message: "Error al obtener el usuario concar" };
            }
            const usuarioConcar = request_user[0].usuarioConcar;
            const codigoConcar = ccostoConcar.find((concar => concar.ccosto == args.ccosto)).codigoConcar;
            const providers = {};
            const { value: porcentajeIgv = 0.18 } = (await connection.query("select * from configuracion where name='igv'"))[0] || {}
            for (let c of args.cotizaciones) {
                if (providers.hasOwnProperty(c.codProv)) {
                    providers[c.codProv].items.push({
                        cantidad: c.cantidad,
                        total: c.total,
                        precio: c.precio,
                        detalle_prod: c.detalle_prod,
                        cod_prod: c.cod_prod,
                        observacion: (c.observacion || ""),
                        um: c.um,
                        igv: c.igv,
                        us: c.us

                    });
                    providers[c.codProv].total += c.total;
                } else {
                    providers[c.codProv] = {
                        nombreProv: c.nombreProv,
                        codProv: c.codProv,
                        total: c.total,
                        formaPago: c.formaPago,
                        lugarEntrega: c.lugarEntrega,
                        fechaEntrega: c.fechaEntrega,
                        items: [{
                            cantidad: c.cantidad,
                            total: c.total,
                            precio: c.precio,
                            detalle_prod: c.detalle_prod,
                            cod_prod: c.cod_prod,
                            observacion: (c.observacion || ""),
                            um: c.um,
                            igv: c.igv,
                            us: c.us
                        }]
                    };
                }

            }


            for (let keyp in providers) {

                let p = providers[keyp];
                const hasItemWithIgv = p.items.some(item => item.igv);
                const igvForProvider = hasItemWithIgv ? Number(porcentajeIgv) : 0;
                console.log("igvForProvider", igvForProvider)
                let sqln = `Select TN_CNUMSER,TN_NNUMERO From RSFACCAR..FT0003NUME 
                           where TN_CCODIGO='OC' AND TN_CNUMSER='0001' Order by TN_CCODIGO `;
                const { recordset } = await pool.query(sqln);
                if (recordset.length == 0) {
                    return { state: false, message: "Error al obtener el número de orden" };
                }
                let no = `${recordset[0].TN_CNUMSER}${((recordset[0].TN_NNUMERO || 1) + 1).toString().padStart(7, "0")}`
                //let no = `${recordset[0].TN_CNUMSER}${(`${recordset[0].TN_NNUMERO}` || '').padStart(7, "0")}`;
                let pen = 0;
                let usd = 0;

                if (args.monedaOC == "MN") {
                    pen = p.total;
                    usd = (p.total / args.tipoCambio).toFixed(2);

                } else {
                    usd = (p.total / args.tipoCambio).toFixed(2);
                    pen = p.total;
                    if (args.moneda == "US") {
                        usd = p.total
                        pen = p.total * args.tipoCambio
                    }
                }
                let usdIgv = (usd * (1 + igvForProvider)).toFixed(2);

                let penIgb = (pen * (1 + igvForProvider)).toFixed(2);
                if (objetTypeEsftcom.typeEsoftcom == "I") {
                    ocNimpfac = args.monedaOC == "MN" ? penIgb : usdIgv
                }
                let query = `exec SP_Log_Inserta_OC_Cab  @CNUMORD='${no}' ,@CCODPRO='${p.codProv}',
                          @CRAZSOC='${p.nombreProv}',
                          @CCOTIZA='${args.nroCotizacionProveedor}', @CCODMON='${args.monedaOC}' ,
                          @CFORPA1='${p.formaPago}' , @CFORPA2='',
                          @CFORPA3='', @NTIPCAM=${args.tipoCambio} ,
                          @DFECENT= '${moment(p.fechaEntrega).format("YYYY-MM-DD")}',
                                  @NPORDES=0  ,
                          @CCARDES ='' , @NIMPUS=${usdIgv}  ,
                          @NIMPMN  =${penIgb}  ,	 @CSOLICT= '${desc_solicitante}'  ,
                          @CTIPENV=''  ,	 @CLUGENT = '${p.lugarEntrega}'   ,
                          @CLUGFAC= 'JR. PACIFICO NRO. 355'  ,	 @CDETENT='' ,
                          @CSITORD='1' , @CUSUARI= '${usuarioConcar}'  ,
                          @DFECDOC='${moment().format("YYYY-MM-DD")}' ,
                                  @CTIPORD ='${type}' ,
                          @CRESPER1='' ,	 @CRESPER2 =''  ,
                          @CRESPER3 =''   ,	 @CRESCARG1   =''   ,
                          @CRESCARG2   =''  ,	 @CRESCARG3 =''  ,
                          @CCOPAIS ='PERÚ'  ,	 @CUSEA01=''  ,
                          @CUSEA02=''   ,	 @CUSEA03 ='' ,
                          @DFECR01  =NULL   ,	 @DFECR02 =NULL    ,
                          @DFECR03  =NULL    ,	 @CREMITE =''  ,
                          @CPERATE  =''   ,	 @CCONTA1  =''   ,
                          @CCONTA2   =''   ,	 @CCONTA3  =''   ,
                          @CNUMFAC  =''   ,	 @DFECEMB=NULL  ,
                          @CUNIORD  =''  ,	 @CCONVTA =''   ,
                          @CCONEMB   =''   ,	 @CCONDIC ='${objetTypeEsftcom.ocCcondic}'  ,
                          @CTIPENT   ='${objetTypeEsftcom.ocCtipent}',	 @CDIAENT =''  ,
                          @NFLEINT  =0  ,	 @NDOCCHA  =0   ,
                          @NFLETE   =0  ,	 @NSEGURO =0 ,
                          @NIMPFAC  =${ocNimpfac},	 @NIMPFOB =0   ,
                          @NIMPCF   =0   ,	 @NIMPCIF =0  ,
                          @CNUMREF  =''   ,	 @CTIPDSP  =''  ,
                          @CTIPDOC  ='CT'   ,	 @CALMDES ='${args.store}'  ,
                     
                          @CCOSTOC   ='${codigoConcar}'   ,	 @CDOCPAG =''   ,
                          @DFECPAG  =NULL   ,	 @DFECVEN   =NULL    ,
                          @CESTPAG  =''  ,	 @CMONPAG  ='' ,
                          @NIMPPAG   =0  ,	 @CGLOPAG  =''   ,
                          @CCODSOL  = '${args.idSolicitante}'   ,	 @CCODAGE =''   ,
                          @CCODTAL  =''   ,	 @CORDTRA  =''   ,
                          @CMEMO   =''   ,	 @CVIA  =''   ,
                          @CORIG  =''  ,	 @CFORWA  =''  ,
                          @CMBL  =''   ,	 @CFACIMP  =''  ,
                          @CPIOTO  =''   ,	 @CPROCC =''  ,
                          @CDESTI =''  ,	 @CHWL  =''   ,
                          @DFECPP  =NULL ,	 @DFECEC  =NULL ,
                          @DFECIP  =NULL ,	 @DFECIA  =NULL ,	 @DFECCUM =NULL `;

                await pool.query(query);
                let index = 1;
                for (let item of p.items) {
                    let nigvpor = porcentajeIgv * 100;
                    let porcentajeigvCalculado = porcentajeIgv;
                    if (item.igv == 0 || !item.igv) {
                        porcentajeigvCalculado = 0;
                        nigvpor = 0;
                    }
                    let igv = (parseFloat(item.total) * porcentajeigvCalculado).toFixed(2);
                    let peni = 0;
                    let usdi = 0;
                    let precio = (((args.moneda == "US" || args.moneda == "MN" || (args.moneda == "US" && args.monedaOC == "US")) && item.precio)) || 0

                    if (args.moneda == "MN" && args.monedaOC == "US") {
                        console.log("entro en l if")
                        precio = item.us
                    }
                    let puigv = (precio * parseFloat(1 + parseFloat(porcentajeigvCalculado))).toFixed(2);

                    if (args.monedaOC == "MN") {
                        usdi = ((parseFloat(item.total) + parseFloat(igv)) / args.tipoCambio).toFixed(2);
                        peni = parseFloat(item.total) + parseFloat(igv);
                    } else {
                        console.log("us", precio, "item total", item.total, "porcentajeC", porcentajeigvCalculado)
                        igv = parseFloat((precio * item.cantidad * porcentajeigvCalculado).toFixed(2))
                        //  usdi = parseFloat((parseFloat(item.us) + parseFloat(item.total * porcentajeigvCalculado) / args.tipoCambio).toFixed(2));
                        //  peni = parseFloat(((parseFloat(item.total) + parseFloat(igv)) * args.tipoCambio).toFixed(2));
                        usdi = parseFloat((parseFloat(precio * item.cantidad) + parseFloat(precio * item.cantidad * porcentajeigvCalculado))).toFixed(2)
                        peni = parseFloat((parseFloat(usdi * args.tipoCambio)).toFixed(2))

                    }
                    console.log("usdi", usdi, "peni", peni, "precio", precio, "puigv", puigv)
                    const codigoConcarFind = ccostoConcar.find((cc => cc.ccosto == args.ccosto)).codigoConcar
                    let detail = `exec SP_Log_Inserta_OC_Det 
                          @CNUMORD='${no}' ,
                    @CCODPRO='${p.codProv}', @CITEM='${index.toString().padStart("0", 3)}', @CCODIGO='${item.cod_prod}', @CCODREF='' ,
                    @CDESREF='${item.detalle_prod}' , @CUNIPRO='' ,	 @CDEUNPR ='' , @CUNIDAD='${item.um}'  ,
                    @NCANORD=${item.cantidad} , @NPREUNI=${puigv},	 @NPREUN2=${precio} , @NDSCPFI=0,
                    @NDESCFI=0 , @NDSCPIT=0,	 @NDESCIT=0 , @NDSCPAD =0  ,
                    @NDESCAD=0  , @NDSCPOR=0 ,	 @NDESCTO =0 , @NIGV =${igv} ,
                    @NIGVPOR  =${nigvpor} , @NISC =0 ,	 @NISCPOR=0  , @NCANTEN=0 ,
                    @NCANSAL =${item.cantidad}  , @NTOTUS=${usdi} ,	 @NTOTMN =${peni} , @COMENTA='${item.observacion.substring(0, 127)}' ,
                    @CESTADO=1,	 @FUNICOM='' ,	 @NCANREF =0 ,	 @CSERIE =''  ,
                    @NANCHO =0  ,	 @NCORTE=0  , @CTIPORD='${type}' ,
                    @CCENCOS ='${codigoConcarFind}'  ,	 @CNUMREQ='' ,	 @CSOLICI='${args.idSolicitante}' ,	 @CITEREQ='' ,
                    @CREFCOD ='',	 @CPEDINT  ='',	 @CITEINT   ='' ,	 @CREFCOM='',
                    @CNOMFAB =''  ,	 @NCANEMB =0,	 @DFECENT =NULL  ,	 @CITMPOR='${objetTypeEsftcom.citmPor}'  ,
                    @CDSCPOR='${objetTypeEsftcom.cdscPor}'  ,	 @CIGVPOR='${objetTypeEsftcom.cigvPor}'  ,	 @CISCPOR='${objetTypeEsftcom.ciscPor}' ,	 @NTOTMO=0 ,
                    @NUNXENV =0  ,	 @NNUMENV =0 ,	 @NCANFAC =0`;
                    index++;
                    await pool.query(detail);
                }

                await db.query(`insert into cotizacion_transferencia(id_cotizacion,numero_orden)
                            values(${args.id},'${no}')`);

            }
            await this.actualizarEstadoDetalleProv(args.cotizaciones.map(c => ({ ...c, estado: 3 })))
            const listaCotizaciones = (await this.detalleProvPorCotizacion(args.id)).filter(p => [1, 3].includes(p.estado.state))
            const isTotalCotizado = listaCotizaciones.filter(c => c.estado.state == 3).length == listaCotizaciones.length
            await this.updateFechaTransferenciaIdUsuarioAprobacion(user_id,
                args.id, '', args.nroCotizacionProveedor, args.monedaOC, isTotalCotizado ? 5 : 9);

        } catch (error) {
            throw error;
        } finally {
            connection.release()
        }

        return { state: true, message: "Operación exitosa" };
    },
    async getStores() {
        const pool = await poolPromise;
        const { recordsets } = await pool.query(`Select A1_CALMA as code,
       concat(A1_CDESCRI,'-',A1_CPROV) as description
       
         From RSFACCAR..AL0003ALMA Order by A1_CALMA`);

        return recordsets[0];


    },
    updateFechaTransferenciaIdUsuarioAprobacion: async function (usuarioTransferenciaId, cotizacionId, codigoEsofcom, nroCotizacionProveedor, monedaOC, state = 5) {
        return new Promise((resolve, reject) => {
            db.query("update cotizacion set estado=" + state + ", idUsuarioTransferencia=?,fecha_transferencia=?,req_sofcom=?,numeroCotizacionProveedor=?,monedaOC=? where idCotizacion=?", [usuarioTransferenciaId, moment().format("YYYY-MM-DD"), codigoEsofcom, nroCotizacionProveedor, monedaOC, cotizacionId], (err, result) => {
                if (err) reject(err)
                resolve();
            })
        })
    },
    insertarDetalleEsoftCom: async function (cotizacionDetalles, codigoEsoftCom, ccosto, moneda, tipoCambio) {
        try {
            const pool = await poolPromise
            cotizacionDetalles.forEach(async (cotizacionDetalle, index) => {
                const precioUnitarioEnSoles = parseFloat(moneda == "US" ? cotizacionDetalle.precio * tipoCambio : cotizacionDetalle.precio).toFixed(2);
                const precioUnitarioEnDolares = parseFloat(moneda == "MN" ? cotizacionDetalle.precio / tipoCambio : cotizacionDetalle.precio).toFixed(2)
                const totalEnSoles = parseFloat(moneda == "US" ? cotizacionDetalle.precio * cotizacionDetalle.cantidad * tipoCambio : cotizacionDetalle.precio * cotizacionDetalle.cantidad).toFixed(2);
                const totalEnDolares = parseFloat(moneda == "MN" ? cotizacionDetalle.precio * cotizacionDetalle.cantidad / tipoCambio : cotizacionDetalle.precio * cotizacionDetalle.cantidad).toFixed(2);
                await pool.request().query(`exec SP_Log_Inserta_Req_Det  '${codigoEsoftCom.toString().padStart(7, "0")}', '${(index + 1).toString().padStart(4, "0")}', '${cotizacionDetalle.producto.codigoProducto}', '${cotizacionDetalle.producto.descripcion}', '${cotizacionDetalle.producto.um}', ${cotizacionDetalle.cantidad}, '${ccostoConcar.find(cc => cc.ccosto = ccosto).codigoConcar}', '', 0, 7, 0, 0, ${cotizacionDetalle.cantidad}, ${precioUnitarioEnSoles}, ${precioUnitarioEnDolares},${precioUnitarioEnSoles}, ${precioUnitarioEnDolares}, 0, 0,${totalEnSoles}, ${totalEnDolares}, 0, 0, '',0, '', '', '',''`)
            })
        } catch (error) {
            console.log("err", error)
            throw new Error(error)
        }
    },
    insertarCabeceraEsoftCom: async function (cotizacionCabecera, usuarioId) {
        try {

            const pool = await poolPromise
            const usuarioConcar = (await usuario.getusuarioByIdPromise(cotizacionCabecera.idUsuario))[0].usuarioConcar;
            const codigoEsoftCom = cotizacionCabecera.numeroMaximoEsoftcom.toString().padStart(7, "0");
            const codigoConcar = ccostoConcar.find((concar => concar.ccosto == cotizacionCabecera.ccosto)).codigoConcar;
            const rucFirstProvider = cotizacionCabecera.cotizaciones[0].proveedorCotizacion.AC_CCODIGO
            let sql = ` exec SP_Log_Inserta_Req_Cab 
            '${codigoEsoftCom}',
             '${moment().format("YYYY-MM-DD")}',
              '${cotizacionCabecera.idSolicitante}', '00001', 
              '${codigoConcar}', 
              '${rucFirstProvider}',
               '7', '${usuarioConcar}',
                '${usuarioConcar}', 
                '${usuarioConcar}', 
                '${cotizacionCabecera.fecha_aprobacion}',
                 '${cotizacionCabecera.fecha_registro}',
                 '${cotizacionCabecera.fecha_registro}','', 
                 '${cotizacionCabecera.moneda}', 0, 0, 
                 ${cotizacionCabecera.tipoCambio}, '',
                  ${cotizacionCabecera.nroCotizacion},
                   '03', 
                   '${cotizacionCabecera.tipoReq.toString().padStart(2, "0")}',
                    '${usuarioConcar}', '${moment().format("YYYY-MM-DD")}',
                     '', '', '', 'T', '01', 
                     '${cotizacionCabecera.nroCotizacionProveedor}', ''`;

            await pool.request().query(sql);
            await this.updateFechaTransferenciaIdUsuarioAprobacion(usuarioId, cotizacionCabecera.id, codigoEsoftCom, cotizacionCabecera.nroCotizacionProveedor)
        } catch (error) {
            throw new Error(error)
        }
    },
    actualizarEstadoDetalleProv: (detallesProv) => {
        return new Promise((resolve, reject) => {
            const query = detallesProv.map((detalle) => `update  cotizacion_prov set estado = ${detalle.estado} where  id = ${detalle.id}; `).join("");
            db.query(query, (err, result) => {
                if (err) reject(err)
                resolve();
            })
        })
    },
    detalleProvPorCotizacion: (cotizacionId) => {
        return new Promise((resolve, reject) => {
            db.query(`SELECT co.*,DATE_FORMAT(co.fechaEntrega,'%Y-%m-%d') as fechaEntrega from cotizacion_prov co
            left join requerimiento_det as rd on rd.IdRequerimientodet=co.idRequerimientoDet
            WHERE co.idCotizacion =?`, [cotizacionId], (err, results) => {
                if (err) reject(err)
                const contizacionesProv = results.reduce((acc, current, array) => {
                    if (!acc.find((a => a.producto.codigoProducto == current.cod_prod && a.proveedorCotizacion.AC_CCODIGO == current.codProv && a.observacion == current.observacion))) {
                        const requerimientoDetGroup = results.filter(a => a.cod_prod == current.cod_prod && a.codProv == current.codProv).map((re) => re.idRequerimientoDet);
                        acc.push({
                            ...current, estado: statesCotizacionProv.find(w => w.state == current.estado), producto:
                                { descripcion: current.detalle_prod, codigoProducto: current.cod_prod, um: current.um, idRequerimientoDet: requerimientoDetGroup, groupName: current.upp }, proveedorCotizacion: { precio: current.precio, AC_CNOMBRE: current.nombreProv, AC_CCODIGO: current.codProv, us: current.us }
                        })
                    }
                    return acc;
                }, [])
                resolve(contizacionesProv)
            })
        })
    },
    ultimoCorrelativoCotizacion: () => {
        return new Promise((resolve, reject) => {
            db.query("select max(nro_cotizacion) as nroCotizacion from cotizacion", (err, results) => {
                if (err) reject(err)
                resolve(results[0].nroCotizacion ? results[0].nroCotizacion + 1 : 1);
            })
        })
    },
    getDestinesForAprobacionCotizacion: async function () {
        const connection = await mysql.connection();
        try {

            let emails = await connection.query("select email from  destinatarios_log where cotizacion_aprob=1 and Estado=1")
            return emails.map((data) => data.email);
        } catch (error) {
            throw error;
        } finally {
            await connection.release()
        }
    },
    enviarAprobarCotizacion: async function (cotizacion) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            const emails = (await connection.query("select email from  destinatarios_log where cotizacion_por_aprob=1 and Estado=1")).map((data) => data.email)
            await connection.query("update cotizacion set estado=2 where idCotizacion=?", [cotizacion.id])
            const email = {
                subject: `Cotizacion N° ${cotizacion.nroCotizacion} por Aprobar `,
                html: `
                                      <div>
                                      <h2>La cotizacion esta para aprobar</h2> 
                                      <p>Fecha:${moment().format("YYYY-MM-DD H:mm")}</p>
                                      <a href='http://159.65.47.181/supergen-fe/#!/seguimiento-logistica'>Ver</a>
                                      </div>
                                      `,
                destines: emails,
            }
            await sendEmail.sendEmail(email.subject, email.destines, email.html)
            await connection.query("COMMIT");

        } catch (error) {
            console.log("error", error)
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            await connection.release();

        }
    },
    actualizarCotizacionProv: function (cotizacionParam) {
        const cotizacionFile = this;
        return new Promise(async (resolve, reject) => {
            try {
                await db.query("DELETE FROM cotizacion_prov WHERE idCotizacion = ?", [cotizacionParam.id]);
                const cotizacionMap = cotizacionParam.cotizaciones.map((cotizacion) => ({ ...cotizacion, idCotizacion: cotizacionParam.id }))
                await cotizacionFile.guardarCotizacionProv(cotizacionMap);
                resolve()
            } catch (error) {
                reject(error)
            }

        })
    },


    async buildSheet(row, quotation, coin, payforms, store) {
        await workbook.xlsx.readFile("./template/PLANTILLA-COTIZACION.xlsx");
        const sheet = workbook.getWorksheet(1);
        sheet.getCell("C1").value = `${quotation} `;
        sheet.getCell("C2").value = row.proveedor.AC_CCODIGO;
        sheet.getCell("C3").value = row.proveedor.AC_CNOMBRE;
        sheet.getCell("C4").value = coin;
        let name = row.proveedor.AC_CCODIGO.trim() + "-" + row.proveedor.AC_CNOMBRE.trim();
        let index = 7;
        const border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
        let headers = ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];
        for (let h of headers) {
            sheet.getCell(`${h}6`).border = border;
        }

        for (let p of row.productos) {

            let a = sheet.getCell("A" + index);
            a.value = p.idRequerimientoDet;
            a.border = border;
            a.protection = {
                locked: true,
                hidden: true,
            };

            let b = sheet.getCell("B" + index);
            b.value = p.codigoProducto;
            b.border = border;
            b.protection = {
                locked: true,
                hidden: false,
            };
            let c = sheet.getCell("C" + index);
            c.value = p.descripcion;
            c.border = border;
            c.protection = {
                locked: true,
                hidden: false,
            };
            let d = sheet.getCell("D" + index);
            d.value = p.observacion;
            d.border = border;
            d.protection = {
                locked: true,
                hidden: false,
            };
            let e = sheet.getCell("E" + index);
            e.value = p.familia;
            e.border = border;
            e.protection = {
                locked: true,
                hidden: false,
            };
            let f = sheet.getCell("F" + index);
            f.value = p.um;
            f.border = border;
            f.protection = {
                hidden: false,
                locked: true,
            };
            let g = sheet.getCell("G" + index);
            g.value = p.groupName;
            g.border = border;
            g.protection = {
                hidden: false,
                locked: true,
            }
            let h = sheet.getCell("H" + index);
            h.border = border;
            h.value = p.total;
            h.protection = {
                hidden: false,
                locked: true,
            };
            let i = sheet.getCell("I" + index);
            i.border = border;
            i.protection = {
                locked: false,
                hidden: false,
            };
            i.dataValidation = {
                type: 'list',
                allowBlank: false,
                formulae: payforms,
                showInputMessage: true,
                promptTitle: 'Seleccione una opción',
                prompt: 'Seleccione una opción de la lista'

            };
            let j = sheet.getCell("J" + index);
            j.border = border;
            j.protection = {
                hidden: false,
                locked: false,
            };
            j.dataValidation = {
                type: 'text',
                operator: 'greaterThanOrEqual',
                showErrorMessage: true,
                allowBlank: false,
                showInputMessage: true,
                promptTitle: 'Ingrese una fecha',
                prompt: 'El formato debe ser DD/MM/YYYY, por ejemplo 25/01/2021'
            };
            let k = sheet.getCell("K" + index);
            k.value = store;
            k.border = border;
            k.protection = {
                locked: false,
                hidden: false,
            };
            k.dataValidation = {
                allowBlank: false,
            };

            let l = sheet.getCell("L" + index);
            l.border = border;
            l.protection = {
                locked: false,
                hidden: false,
            };
            l.dataValidation = {
                type: 'decimal',
                operator: 'greaterThanOrEqual',
                allowBlank: false,
                showInputMessage: true,
                showErrorMessage: true,

                promptTitle: 'Ingrese un número valido',
                prompt: 'El valor debe ser númerico y mayor que cero'
            };
            let m = sheet.getCell("M" + index);
            m.border = border
            m.protection = {
                locked: false,
                hidden: false,
            };
            index++;
        }
        await sheet.protect('supergenbe');

        const buffer = await workbook.xlsx.writeBuffer();
        return { name: name, b64: buffer.toString("base64") };

    },
    async exportProviders({ rows, quotation, coin, payforms, store }) {
        const buffers = [];
        for (let row of rows) {
            buffers.push(await cotizacion.buildSheet(row, quotation, coin, payforms, store));
        }
        return buffers;
    },
    async readSheets(path, { folio }) {
        try {
            const dataExcel = fs.readFileSync(path);
            const wor = await workbook.xlsx.load(dataExcel)
            const sheet = wor.worksheets[0];
            sheet.unprotect();
            let n = sheet.getCell("C1").value;
            if (parseInt(n) != parseInt(folio)) {
                return {
                    errors: ["Los números de las cotizaciones no coinciden"]
                };
            }
            let ruc = sheet.getCell("C2").value;
            let name = sheet.getCell("C3").value;
            let now = (new Date()).getTime();
            let evalTime = (v) => {
                v.setDate(v.getDate() + 1);
                return v.getTime();
            };
            let cells = [
                { column: "A", validate: false },
                { column: "B", validate: false },
                { column: "C", validate: false },
                { column: "D", validate: false },
                { column: "E", validate: false },
                { column: "F", validate: false },
                { column: "G", validate: false },
                { column: "H", validate: false },
                { column: "I", validate: false },
                {
                    column: "J", validate: true, message: 'La fecha no es correcta', fn: v => {

                        return typeof v == "object" && now <= evalTime(v);
                    }
                },
                { column: "K", validate: false },
                {
                    column: "L", validate: true, message: 'El precio no es válido', fn: (v) => {
                        return parseFloat(v) > 0
                    }
                },
                { column: "M", validate: false },

            ];
            let keys = ["id", "codigo", "producto", "observacion", "familia", "unidad", "uupp", "cantidad", "forma_pago", "fecha_entrega", "lugar_entrega", "precio", "us"];

            let ok = true;
            let rows = [];
            let index = 7;
            let errors = [];
            while (ok) {
                let row = {};
                let i = 0;
                for (let c of cells) {
                    let v = sheet.getCell(`${c.column}${index}`).value;
                    if ((v != null && v != "") || i == 5 || i == 3 || i == 12) {
                        if (c.validate) {
                            if (c.fn(v)) {
                                row[keys[i]] = v;
                            } else {
                                ok = false;
                                errors.push(`Error en la celda ${c.column}${index} valor[${v}], ${c.message}!`);
                                break;
                            }
                        } else {
                            row[keys[i]] = v;
                        }
                        i++;
                    } else {
                        ok = false;
                        errors.push(`Error en la celda ${c.column}${index} valor[${v}], el dato especificado no es válido!`);
                        break;
                    }

                }
                let l = Object.keys(row).length;
                if (l == keys.length) {
                    index++;
                    rows.push(row);
                } else if (l == 0) {
                    errors = [];
                    break;
                }

            }
            return { rows, errors, ruc, name };
        } catch (error) {
            console.log("err", error)
        }

    },
    async importProviders(files, args) {
        let response = {
            quotations: [],
            errors: []
        };

        for (let f of files) {
            let { rows, errors, ruc, name } = await cotizacion.readSheets(f.path, args);
            response.errors.push(...errors);
            //  fs.unlinkSync(f.path);
            if (errors.length > 0) {
                break;
            }
            let i = 1;
            for (let row of rows) {
                const idRequerimientoDet = JSON.parse(row.id);
                response.quotations.push({
                    idItem: i++,
                    proveedorCotizacion: {
                        AC_CCODIGO: ruc,
                        AC_CNOMBRE: name,
                        precio: parseFloat(parseFloat(row.precio).toFixed(2)),
                        us: row.us ? parseFloat(parseFloat(row.us).toFixed(2)) : null
                    },
                    producto: {
                        familia: row.familia,
                        descripcion: row.producto,
                        codigoProducto: row.codigo,
                        um: row.unidad,
                        total: row.cantidad,
                        idRequerimientoDet: Array.isArray(idRequerimientoDet) ? [...idRequerimientoDet] : [idRequerimientoDet],
                        groupName: row.uupp,

                    },
                    observacion: row.observacion,
                    cantidad: row.cantidad,
                    total: (parseFloat(row.precio) * parseFloat(row.cantidad)).toFixed(2),
                    formaPago: row.forma_pago.split("-")[0],
                    fechaEntrega: moment(row.fecha_entrega).format("YYYY-MM-DD"),
                    lugarEntrega: row.lugar_entrega,

                });
            }


        }
        return response;
    }
}

module.exports = cotizacion;