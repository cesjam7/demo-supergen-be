const mysql = require("../dbconnectionPromise")
const { poolPromise } = require('../dbconnectionMSSQL');
const statesCpe = { "Transferido": "Transferido", "Creado": "Creado", "Anulado": "Anulado" }
const axios = require("axios");
const xml2js = require("xml2js")
const DBCostsSG = require('./DBCostsSG');
const fs = require('fs');
const moment = require('moment');
var Excel = require('exceljs')
var workbook = new Excel.Workbook()
const cotizacionModel = require('./cotizacion')
const contabCpe = {
    save: async function (contabCpe, userId) {
        const connection = await mysql.connection();
        try {
            contabCpe.provEncontrado = "N"
            await connection.query("START TRANSACTION");
            const numberMaximunForComprobantes = Number((await this.getAjustesExtranetFornProperty("diasGracia"))[0])
            const diferenceDays = moment().diff(moment(contabCpe.fecha, "YYYY-MM-DD"), "days")
            const todayMoment = moment()
            if (diferenceDays > numberMaximunForComprobantes) {

                throw new Error(`El comprobante ${contabCpe.comprobante} ya no puede ser entregado ya que sobrepaso la fecha limite,solo se admiten ${numberMaximunForComprobantes} dias como maximo.`)

            }
            const providers = await DBCostsSG.getProvidersContab()
            if (providers.findIndex(p => p.AC_CCODIGO.trim() == contabCpe.ruc.trim()) != -1) {
                contabCpe.provEncontrado = "S"
            }

            /*             const cpeFilter = await connection.query("select * from contab_cpe where preveedor=? and comprobante=?", [provider, comprobante]);
             */
            const cpeForProviderAndComprobante = await this.listCpeFilterForComprobanteAndProveedor({ comprobante: contabCpe.comprobante, provider: contabCpe.ruc.trim() })
            if (cpeForProviderAndComprobante.length > 0) {
                throw new Error(`El comprobante ${contabCpe.comprobante} ya ha sido registrado, consulte con el proveedor: ${contabCpe.ruc}`)
            }
            const data = await this.getStatusForRuc(contabCpe.ruc)
            const { estadoCp: sunatCodigo, estadoCp_name: sunatRespuesta } = await this.checkStateCp({ ruc: contabCpe.ruc, tipoDoc: contabCpe.tipoDoc, comprobante: contabCpe.comprobante, total: contabCpe.total, fecha: contabCpe.fecha })
            const result = await connection.query("insert into contab_cpe(sunatCodigo,sunatRespuesta,tipo,base,correlativo,numero,anio,mes,usuarioId,detraccion,emisor,ruc,provEncontrado,tipoDoc,comprobante,fecha,total,moneda,igv,fechaVencimiento,estado,updated_at) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ",
                [sunatCodigo, sunatRespuesta, contabCpe.tipo, contabCpe.base, contabCpe.correlativo, contabCpe.numero, todayMoment.format("YYYY"), todayMoment.format("MM"), userId, contabCpe.detraccion, contabCpe.emisor.trim(), contabCpe.ruc.trim(), contabCpe.provEncontrado, contabCpe.tipoDoc, contabCpe.comprobante, moment(contabCpe.fecha, "YYYY-MM-DD", "YYYY-MM-DD").format("YYYY-MM-DD"), contabCpe.total, contabCpe.moneda, contabCpe.igv, moment(contabCpe.fechaVencimiento, "YYYY-MM-DD").format("YYYY-MM-DD"), data.condicion, new Date()])

            if (contabCpe.archivos && contabCpe.archivos.length > 0) {
                const filesValues = contabCpe.archivos.map(a => [a.nombre, a.url, result.insertId])
                await connection.query("insert into contab_files(name,url,contab_cpe) values ? ",
                    [filesValues])
            }
            await connection.query("COMMIT");
        } catch (error) {
            console.error("Error", error)
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }

    },
    getStatusForRuc: async function (ruc) {
        const initValues = {
            "nombre": null,
            "tipoDocumento": null,
            "numeroDocumento": null,
            "estado": null,
            "condicion": null,
            "direccion": null,
            "ubigeo": null,
            "viaTipo": null,
            "viaNombre": null,
            "zonaCodigo": null,
            "zonaTipo": null,
            "numero": null,
            "interior": null,
            "lote": null,
            "dpto": null,
            "manzana": null,
            "kilometro": null,
            "distrito": null,
            "provincia": null,
            "departamento": null
        }
        return new Promise(async (resolve, reject) => {
            await axios.get(`http://159.65.47.181/consultas/?ruc=${ruc.trim()}`).then(({ data }) => {
                resolve(data)
            }).catch((error) => { resolve(initValues) })
        })
    },
    checkStateCp: async function ({ ruc, tipoDoc, comprobante, total, fecha }) {
        const initValues = { estadoCp: 0, estadoCp_name: null }
        return new Promise(function (resolve, reject) {
            const comprobanteSplit = comprobante.split("-")
            const numero = comprobanteSplit[1]
            const serie = comprobanteSplit[0]
            axios.get(`http://portal.supergen.net/facturacion/api/comprobantes/verificar_estado/${ruc.trim()}/${tipoDoc}/${serie}/${numero}/${fecha}/${total}`).then(async ({ data }) => {
                resolve(data)
            }).catch((err) => {
                resolve(initValues)
            })


        })



    },
    guardarDestinatario: async function (destinatarioContabilidad) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");

            await connection.query("insert into contab_destinatarios(email,alias,aprobacionCaja,aprobacionPlanilla,aprobacionContabilidad,preRevisionCaja,PreRevisionPlanilla,uppId) values(?,?,?,?,?,?,?,?)", [destinatarioContabilidad.email, destinatarioContabilidad.alias,
            destinatarioContabilidad.aprobacionCaja, destinatarioContabilidad.aprobacionPlanilla, destinatarioContabilidad.aprobacionContabilidad, destinatarioContabilidad.preRevisionCaja, destinatarioContabilidad.preRevisionPlanilla, destinatarioContabilidad.upp.id]);
            await connection.query("COMMIT");
        } catch (error) {
            console.error(error);
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }


    },
    editarDestinatario: async function (destinatarioContabilidad) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");

            await connection.query("update  contab_destinatarios set email=?,alias=?,aprobacionCaja=?,aprobacionPlanilla=?,aprobacionContabilidad=?,preRevisionCaja=?,preRevisionPlanilla=?,uppId=? where id=?", [destinatarioContabilidad.email, destinatarioContabilidad.alias,
            destinatarioContabilidad.aprobacionCaja, destinatarioContabilidad.aprobacionPlanilla, destinatarioContabilidad.aprobacionContabilidad, destinatarioContabilidad.preRevisionCaja, destinatarioContabilidad.preRevisionPlanilla, destinatarioContabilidad.upp.id, destinatarioContabilidad.id]);
            await connection.query("COMMIT");
        } catch (error) {
            console.error(error);
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
    },

    eliminarDestinatario: async function (destinatarioId) {
        const connection = await mysql.connection();
        try {

            await connection.query("update contab_destinatarios set estado='Desactivado' where id=?", [destinatarioId]);
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            connection.release();
        }

    },

    listarDestinatarios: async function () {
        const connection = await mysql.connection();
        try {
            const data = await connection.query("select cd.*,upp.nombre as uppNombre from  contab_destinatarios cd inner join caj_upp upp on upp.id=cd.uppId where estado='Activado'");
            return data.map(d => ({ ...d, upp: { id: d.uppId, nombre: d.uppNombre }, aprobacionCaja: Boolean(d.aprobacionCaja), aprobacionPlanilla: Boolean(d.aprobacionPlanilla), aprobacionContabilidad: Boolean(d.aprobacionContabilidad), preRevisionCaja: Boolean(d.preRevisionCaja), preRevisionPlanilla: Boolean(d.preRevisionPlanilla) }))
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            connection.release();
        }

    },

    listarCorreosPorAlias: async function (alias = []) {
        const connection = await mysql.connection();
        try {
            const data = await connection.query(`select email from contab_destinatarios where alias in(?) and estado='Activado'`, [alias]);
            return data.map(d => d.email)
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            connection.release();
        }



    },
    listarCorreosPorUppYPropiedad: async function (uppId, propiedades = []) {
        const uppIds = Array.isArray(uppId) ? uppId : [uppId]
        const propiedadesMap = propiedades.map(p => `${p}=1`)
        const connection = await mysql.connection();
        try {
            const data = await connection.query(`select email from contab_destinatarios where uppId in(?) and  ${propiedadesMap.join(",")} and estado='Activado'`, [uppIds, uppId]);
            return data.map(d => d.email)
        } catch (error) {
            console.error(error);
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
    transferConcar: async function (contabCpe, userId) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            const pool = await poolPromise

            await connection.query("update contab_cpe set transferido=1,usuarioTransferencia=?,fechaTransferencia=CURRENT_TIMESTAMP() where id=?", [userId, contabCpe.id]);
            const tipoCambio = await cotizacionModel.traerTipoCambioPorFecha(contabCpe.fecha);
            if (!tipoCambio) { throw new Error(`la Fecha documento ${contabCpe.fecha} no tiene tipo de cambio`) }




            const payloadConcar = {
                fechaConcar: `'${moment(contabCpe.fecha, "YYYY-MM-DD").format("YYMMDD")}'`,
                fechaHoyConcar: `'${moment().format("YYMMDD")}'`,
                fecha: `CONVERT(DATETIME,'${moment(contabCpe.fecha, "YYYY-MM-DD").format("YYYY-MM-DD")}')`,
                fechaVencimiento: `'${moment(contabCpe.fechaVencimiento, "YYYY-MM-DD").format("YYMMDD")}'`,
                fechaHoy: `CONVERT(DATETIME,'${moment().format("YYYY-MM-DD")}')`,
                tipoDoc: contabCpe.tipoDoc == "01" ? "'FT'" : "'NA'",
                CP_CCODMON: contabCpe.moneda == 'PEN' ? "'MN'" : "'US'",
                CP_NTIPCAM: tipoCambio.toString(),
                CP_NIMPOMN: contabCpe.moneda == 'PEN' ? contabCpe.total : (contabCpe.total * tipoCambio).toFixed(2) * 1,
                CP_NIMPOUS: contabCpe.moneda == 'PEN' ? (contabCpe.total / tipoCambio).toFixed(2) * 1 : contabCpe.total,
                CP_NSALDMN: contabCpe.moneda == 'PEN' ? contabCpe.total : (contabCpe.total * tipoCambio).toFixed(2) * 1,
                CP_NSALDUS: contabCpe.moneda == 'PEN' ? (contabCpe.total / tipoCambio).toFixed(2) * 1 : contabCpe.total,
                CP_NIGVMN: contabCpe.moneda == 'PEN' ? contabCpe.igv : (contabCpe.igv * tipoCambio).toFixed(2) * 1,
                CP_NIGVUS: contabCpe.moneda == 'PEN' ? (contabCpe.igv / tipoCambio).toFixed(2) * 1 : contabCpe.igv,
                CP_CNDOCRE: contabCpe.correlativo
            }

            const query = `insert into RSCONCAR.dbo.CP0003CART(CP_CVANEXO,CP_CCODIGO,CP_CTIPDOC,CP_CNUMDOC,CP_CFECDOC,CP_CFECVEN,CP_CFECREC,CP_CSITUAC,CP_CDEBHAB,CP_CCODMON
                ,CP_NTIPCAM,CP_NIMPOMN,CP_NIMPOUS,CP_NSALDMN,CP_NSALDUS,CP_NIGVMN,CP_NIGVUS,CP_NIMP2MN,CP_NIMP2US,CP_NIMPAJU,CP_CCUENTA,CP_CAREA,CP_CFECUBI,CP_CTDOCRE,
                CP_CNDOCRE,CP_CFDOCRE,CP_CCOGAST,CP_CDESCRI,CP_DFECCRE,CP_DFECMOD,CP_CUSER,CP_NINAFEC,CP_DFECDOC,CP_DFECVEN,CP_DFECREC,CP_DFDOCRE,CP_CCENCOR,CP_CIMAGEN,CP_CVANERF,CP_CCODIRF,
                CP_NPORRE) values('P','${contabCpe.ruc}',${payloadConcar.tipoDoc},'${contabCpe.comprobante}',${payloadConcar.fechaConcar},${payloadConcar.fechaVencimiento},${payloadConcar.fechaHoyConcar},'R','H',
                ${payloadConcar.CP_CCODMON},${payloadConcar.CP_NTIPCAM},${payloadConcar.CP_NIMPOMN},${payloadConcar.CP_NIMPOUS},${payloadConcar.CP_NSALDMN},${payloadConcar.CP_NSALDUS},${payloadConcar.CP_NIGVMN},
                ${payloadConcar.CP_NIGVUS},0,0,0,'','LO',${payloadConcar.fechaConcar},'VB','${contabCpe.comprobante}',${payloadConcar.fechaConcar},'01','COMPRA',${payloadConcar.fechaHoy},${payloadConcar.fechaHoy},'SIST',
                '0',${payloadConcar.fecha},${payloadConcar.fechaVencimiento},${payloadConcar.fechaHoy},${payloadConcar.fechaHoy},'00003','0','P','${contabCpe.ruc}',0)`
            await pool.request()
                .query(query)
            await connection.query("COMMIT");
        } catch (error) {
            console.error(error);
            await connection.query("ROLLBACK");

            throw error;
        } finally {
            connection.release();
        }


    },


    revaluateSunat: async function (contabCpes = []) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            for (const contabCpeo of contabCpes) {
                const { estadoCp: estadoSunat, estadoCp_name: sunatRespuesta } = await this.checkStateCp(contabCpeo)
                console.log("estado", estadoSunat, "descripcion", sunatRespuesta)
                contabCpeo.estadoSunat = estadoSunat
                contabCpeo.sunatRespuesta = sunatRespuesta
            }
            const queryMap = contabCpes.map((c) => `update contab_cpe set sunatCodigo=${c.estadoSunat},sunatRespuesta='${c.sunatRespuesta}' where id=${c.id}`)
            await connection.query(queryMap.join(";"));
            await connection.query("COMMIT");
        } catch (error) {
            console.error(error);
            await connection.query("ROLLBACK");

            throw error;
        } finally {
            connection.release();
        }

    },
    getDetractions: async function () {
        const pool = await poolPromise
        const result = (await pool.request()
            .query(`select TCLAVE,TDESCRI from RSCONCAR.dbo.CT0003TAGP where TCOD='28' order by TCLAVE`)).recordset
        return result
    },
    transformXmlToJson: async function (pathXml) {
        try {
            let type = 'Invoice'
            const xml = fs.readFileSync(pathXml, { encoding: "utf8" });
            const parser = new xml2js.Parser({ trim: true, });

            const result = await parser.parseStringPromise(xml)
            if (result.CreditNote) {
                type = 'CreditNote';
            }
            let paymentDueDate = result[type]["ext:UBLExtensions"]
            let paymentTermsDate = null

            let arr = {}
            console.log(result[type])
            if (result[type]["n2:DueDate"] && result[type]["n2:IssueDate"] && result[type]["n2:ID"] && result[type]["n2:InvoiceTypeCode"]) {
                console.log(result[type]['n1:TaxTotal'][0]['n2:TaxAmount'][0])
                arr = {
                    'emisor': result[type]['cac:Signature'][0]['cac:SignatoryParty'][0]['cac:PartyName'][0]["cbc:Name"][0],
                    'ruc': result[type]['cac:Signature'][0]['cac:SignatoryParty'][0]['cac:PartyIdentification'][0]["cbc:ID"][0],
                    'comprobante': result[type]['n2:ID'][0]["_"],
                    'fechaVencimiento': result[type]['n2:DueDate'][0]["_"],
                    'fecha': result[type]['n2:IssueDate'][0]["_"],
                    "tipoDoc": result[type]["n2:InvoiceTypeCode"][0]["_"],
                    "igv": result[type]['n1:TaxTotal'][0]['n2:TaxAmount'][0]['_'],
                    'total': result[type]['n1:TaxTotal'][0]['n1:TaxSubtotal'][0]["n2:TaxableAmount"][0]["_"] * 1,
                    'moneda': result[type]['n2:DocumentCurrencyCode'][0]['_'],
/*                     'cliente': result[type]['cac:AccountingCustomerParty'][0]['cac:Party'][0]['cac:PartyLegalEntity'][0]['cbc:RegistrationName'][0]
 */                }


            } else if (result[type]['cac:AccountingSupplierParty'][0]['cbc:CustomerAssignedAccountID'] != undefined) {
                arr = {
                    'emisor': result[type]['cac:AccountingSupplierParty'][0]['cac:Party'][0]['cac:PartyLegalEntity'][0]['cbc:RegistrationName'][0],
                    'ruc': result[type]['cac:AccountingSupplierParty'][0]['cbc:CustomerAssignedAccountID'][0],
                    'comprobante': result[type]['cbc:ID'][0],
                    'fechaVencimiento': result[type]['cbc:DueDate'] != undefined ? result[type]['cbc:DueDate'][0] : null,
                    'fecha': result[type]['cbc:IssueDate'][0],
                    'total': result[type]['cac:LegalMonetaryTotal'][0]['cbc:PayableAmount'][0]['_'],
                    'moneda': result[type]['cac:LegalMonetaryTotal'][0]['cbc:PayableAmount'][0]['$']['currencyID'],
                    'cliente': result[type]['cac:AccountingCustomerParty'][0]['cac:Party'][0]['cac:PartyLegalEntity'][0]['cbc:RegistrationName'][0]
                }
            } else if (result[type]['cac:AccountingSupplierParty'][0]['cac:Party'][0]['cac:PartyLegalEntity'] != undefined) {
                arr = {
                    'emisor': result[type]['cac:AccountingSupplierParty'][0]['cac:Party'][0]['cac:PartyLegalEntity'][0]['cbc:RegistrationName'][0],
                    'ruc': result[type]['cac:AccountingSupplierParty'][0]['cac:Party'][0]['cac:PartyIdentification'][0]['cbc:ID'][0]['_'],
                    'comprobante': result[type]['cbc:ID'][0],
                    'fechaVencimiento': result[type]['cbc:DueDate'] != undefined ? result[type]['cbc:DueDate'][0] : null,
                    'fecha': result[type]['cbc:IssueDate'][0],
                    'total': result[type]['cac:LegalMonetaryTotal'][0]['cbc:PayableAmount'][0]['_'],
                    'moneda': result[type]['cac:LegalMonetaryTotal'][0]['cbc:PayableAmount'][0]['$']['currencyID'],
                    'cliente': result[type]['cac:AccountingCustomerParty'][0]['cac:Party'][0]['cac:PartyLegalEntity'][0]['cbc:RegistrationName'][0]
                }
            } else if (result[type]['cac:AccountingSupplierParty'][0]['cac:Party'][0]['cac:PartyName'] != undefined) {
                arr = {
                    'emisor': result[type]['cac:AccountingSupplierParty'][0]['cac:Party'][0]['cac:PartyName'][0]['cbc:Name'][0],
                    'ruc': result[type]['cac:AccountingSupplierParty'][0]['cac:Party'][0]['cac:PartyTaxScheme'][0]['cbc:CompanyID'][0]['_'],
                    'comprobante': result[type]['cbc:ID'][0],
                    'fechaVencimiento': result[type]['cbc:DueDate'] != undefined ? result[type]['cbc:DueDate'][0] : null,
                    'fecha': result[type]['cbc:IssueDate'][0],
                    'total': result[type]['cac:LegalMonetaryTotal'][0]['cbc:PayableAmount'][0]['_'],
                    'moneda': result[type]['cac:LegalMonetaryTotal'][0]['cbc:PayableAmount'][0]['$']['currencyID'],
                    'cliente': result[type]['cac:AccountingCustomerParty'][0]['cac:Party'][0]['cac:PartyTaxScheme'][0]['cbc:RegistrationName'][0],
                }
            }
            if (result[type]['cac:TaxTotal'] != undefined) {
                arr['igv'] = result[type]['cac:TaxTotal'][0]['cbc:TaxAmount'][0]['_'];
                arr["base"] = result[type]['cac:TaxTotal'][0]['cac:TaxSubtotal'][0]["cbc:TaxableAmount"][0]["_"];
            } else if (!arr.igv) {
                arr['igv'] = '';
            }
            /*       if (result[type]['cac:AccountingCustomerParty'][0]['cac:Party'][0]['cac:PartyIdentification'] != undefined) {
                      arr['clienteRuc'] = result[type]['cac:AccountingCustomerParty'][0]['cac:Party'][0]['cac:PartyIdentification'][0]['cbc:ID'][0]['_'];
                  } else if (result[type]['cac:AccountingCustomerParty'][0]['cbc:CustomerAssignedAccountID'] != undefined) {
                      arr['clienteRuc'] = result[type]['cac:AccountingCustomerParty'][0]['cbc:CustomerAssignedAccountID'][0];
                  } else {
                      arr['clienteRuc'] = '';
                  } */
            if (result.CreditNote != undefined) {
                arr['tipoDoc'] = '07';
                arr['referencia'] = result[type]['cac:DiscrepancyResponse'][0]['cbc:ReferenceID'][0];
                arr['referenciaCodigo'] = result[type]['cac:DiscrepancyResponse'][0]['cbc:ResponseCode'][0];
                arr['referenciaDescripcion'] = result[type]['cac:DiscrepancyResponse'][0]['cbc:Description'][0];
            } else {
                if (result[type]['cbc:InvoiceTypeCode'] && result[type]['cbc:InvoiceTypeCode'].length > 0 && result[type]['cbc:InvoiceTypeCode'][0]['_'] != undefined) {
                    arr['tipoDoc'] = result[type]['cbc:InvoiceTypeCode'][0]['_'];
                } else if (result[type]['cbc:InvoiceTypeCode'] && result[type]['cbc:InvoiceTypeCode'].length > 0) {
                    arr['tipoDoc'] = result[type]['cbc:InvoiceTypeCode'][0];
                }
                arr['referencia'] = '';
                arr['referenciaCodigo'] = '';
                arr['referenciaDescripcion'] = '';
            }
            if (!arr.fechaVencimiento) {
                const paymentDateBcp = paymentDueDate[0]["ext:UBLExtension"]
                if (paymentDateBcp.length > 1 && paymentDateBcp[1]["ext:ExtensionContent"] && paymentDateBcp[1]["ext:ExtensionContent"][0]["CustomText"] && paymentDateBcp[1]["ext:ExtensionContent"][0]["CustomText"].length >= 1) {
                    paymentTermsDate = moment(paymentDateBcp[1]["ext:ExtensionContent"][0]["CustomText"][0]["Text"].find(k => k["$"].name == "FechaVencimientoCuota")._, "DD/MM/YYYY").format("YYYY-MM-DD")
                }
                if (!paymentTermsDate) {
                    const paymentTerms = result[type]["cac:PaymentTerms"]
                    if (paymentTerms && paymentTerms.length >= 2) {
                        paymentTermsDate = result[type]["cac:PaymentTerms"][1]["cbc:PaymentDueDate"][0]
                    }

                }

            }

            if (paymentTermsDate) arr["fechaVencimiento"] = paymentTermsDate
            fs.unlinkSync(pathXml)
            const providers = await DBCostsSG.getProvidersContab()
            arr.emisor = null
            const index = providers.findIndex(p => p.AC_CCODIGO.trim() == arr.ruc.trim())
            if (index != -1) {
                arr.emisor = providers[index].AC_CNOMBRE
            }
            return arr;

        } catch (error) {
            console.error(error);
            throw error;
        }

    },
    exportExcel: async function (data = [], filtros) {
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

            const fontStyle1 = {
                bold: true,
                color: { argb: 'FFFFFF' }
            }
            const rutaTemplatePedidos = "./template/pedidos exportados.xlsx";
            if (fs.existsSync(`.${rutaTemplatePedidos}`)) {
                fs.unlinkSync(`.${rutaTemplatePedidos}`);
            }

            await workbook.xlsx.readFile("./template/pedidos.xlsx")
            const sheet = workbook.getWorksheet(1);
            sheet.getCell("C2").value = `AÑO:${filtros.anio && filtros.anio || 'Todos los años'} MES:${filtros.mes && filtros.mes || 'Todos los meses'}`
            for (let i = 0; i < data.length; i++) {
                const dataCurrent = data[i];
                sheet.getCell(`A${i + 7}`).value = dataCurrent.correlativo;
                sheet.getCell(`A${i + 7}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`A${i + 7}`).border = borderStyles;

                sheet.getCell(`B${i + 7}`).value = dataCurrent.tipoDoc;
                sheet.getCell(`B${i + 7}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`B${i + 7}`).border = borderStyles;


                sheet.getCell(`C${i + 7}`).value = dataCurrent.comprobante;
                sheet.getCell(`C${i + 7}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`C${i + 7}`).border = borderStyles;

                sheet.getCell(`D${i + 7}`).value = dataCurrent.ruc;
                sheet.getCell(`D${i + 7}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`D${i + 7}`).border = borderStyles;


                sheet.getCell(`E${i + 7}`).value = dataCurrent.emisor;
                sheet.getCell(`E${i + 7}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`E${i + 7}`).border = borderStyles;


                sheet.getCell(`F${i + 7}`).value = dataCurrent.cliente;
                sheet.getCell(`F${i + 7}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`F${i + 7}`).border = borderStyles;


                sheet.getCell(`G${i + 7}`).value = dataCurrent.total;
                sheet.getCell(`G${i + 7}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`G${i + 7}`).border = borderStyles;

                sheet.getCell(`H${i + 7}`).value = dataCurrent.fechaRegistro;
                sheet.getCell(`H${i + 7}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`H${i + 7}`).border = borderStyles;
                sheet.getCell(`H${i + 7}`).font = fontStyle1;


                sheet.getCell(`I${i + 7}`).value = dataCurrent.fecha;
                sheet.getCell(`I${i + 7}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`I${i + 7}`).border = borderStyles;

                sheet.getCell(`J${i + 7}`).value = dataCurrent.fechaVencimiento;
                sheet.getCell(`J${i + 7}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`J${i + 7}`).border = borderStyles;



                sheet.getCell(`K${i + 7}`).value = dataCurrent.sunatRespuesta;
                sheet.getCell(`K${i + 7}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`K${i + 7}`).border = borderStyles;


                sheet.getCell(`L${i + 7}`).value = dataCurrent.estado;
                sheet.getCell(`L${i + 7}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`L${i + 7}`).border = borderStyles;


                sheet.getCell(`M${i + 7}`).value = dataCurrent.totalPagado;
                sheet.getCell(`M${i + 7}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`M${i + 7}`).border = borderStyles;

                sheet.getCell(`N${i + 7}`).value = dataCurrent.fechaPago;
                sheet.getCell(`N${i + 7}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`N${i + 7}`).border = borderStyles;



                sheet.getCell(`O${i + 7}`).value = dataCurrent.transferido == 0 ? 'NO' : "SI";
                sheet.getCell(`O${i + 7}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`O${i + 7}`).border = borderStyles;

            }
            await workbook.xlsx.writeFile(rutaTemplatePedidos)

            return { templateUrl: `/supergen-be/template/pedidos exportados.xlsx` }
        } catch (error) {
            throw error;
        }




    },
    getIgvValue: async function () {
        const connection = await mysql.connection();
        try {
            const configuracion = (await connection.query("select value from configuracion where name='igv'"))[0].value || 0
            return Number(configuracion)
        } catch (error) {
            console.error(error)
            throw error;
        } finally {
            connection.release();
        }
    },

    addPdf: async function (file, contabId) {
        const connection = await mysql.connection();
        try {
            await connection.query("insert into contab_files(name,url,contab_cpe) values(?,?,?)", [file.name, file.url, contabId])

        } catch (error) {
            console.error(error)
            throw error;
        } finally {
            connection.release();
        }

    },
    getListTypeDocument: async function () {
        const connection = await mysql.connection();
        try {
            const typeDocuments = await connection.query("select * from contab_tdoc")
            return typeDocuments
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    },
    list: async function ({ mes = "", anio = "", opcion = "", propiedad, proveedor, anulado }) {
        const connection = await mysql.connection();
        try {
            const contabMap = []
            const contab_cpe = (await connection.query(`select contab.*,DATE_FORMAT(fechaVencimiento,'%Y-%m-%d') fechaVencimiento,DATE_FORMAT(created_at,'%Y-%m-%d') fechaRegistro,DATE_FORMAT(fecha,'%Y-%m-%d') fecha,files.name,files.url from contab_cpe contab inner join contab_files files on files.contab_cpe=contab.id where DATE_FORMAT(${propiedad},'%Y')  like '%${anio && anio || ''}%' and DATE_FORMAT(${propiedad},'%m') like '%${mes && mes || ''}%'  and transferido like '%${opcion && opcion || ''}%'
            
            and ruc like '%${proveedor && proveedor.AC_CCODIGO.trim() || ''}%' and contab.anulado=?`, [anulado ? 1 : 0])).map(c => ({ ...c, pagos: [], totalDolares: 0, totalSoles: 0 }))
            for (let i = 0; i < contab_cpe.length; i++) {
                const contabCurrent = contab_cpe[i]
                const archivos = contab_cpe.filter(c => c.id == contabCurrent.id).map(a => ({ name: a.name, url: `${a.url}` }))

                if (contabMap.findIndex(c => c.id == contabCurrent.id) == -1) {
                    contabMap.push({ ...contabCurrent, archivos })
                }
            }
            if (contabMap.length > 0) {

                const pool = await poolPromise
                const providers = contabMap.map(c => `'${c.ruc.trim()}'`).join(",")
                const comprobantes = contabMap.map(c => `'${c.comprobante.trim()}'`).join(",")
                const paymenthForProbvider = (await pool.request().query(`select * from RSCONCAR.dbo.CP0003PAGO WHERE PG_CCODIGO IN (${providers}) AND PG_CNUMDOC IN (${comprobantes})`)).recordset


                for (const con of contabMap) {
                    const payments = paymenthForProbvider.filter(
                        pago => pago.PG_CCODIGO.trim() === con.ruc.trim() && pago.PG_CNUMDOC.trim() === con.comprobante.trim()
                    ).map(p => ({ ...p, PG_CFECCOM: moment(p.PG_CFECCOM, "YYMMDD").format("YYYY-MM-DD") }))
                    con.totalDolares = payments.reduce((prev, element) => prev + element.PG_NIMPOUS, 0)
                    con.totalSoles = payments.reduce((counter, element) => counter + element.PG_NIMPOMN, 0)
                    const { PG_CFECCOM: fechaPago = "" } = payments[payments.length - 1] || {}
                    con.pagos = payments
                    con.fechaPago = fechaPago
                }
            }
            return contabMap;
        } catch (error) {
            console.error(error)
            throw error;
        } finally {
            connection.release();
        }

    },
    checkStatus: async function ({ rucCliente, id }) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            const { data } = await axios.get(`http://159.65.47.181/consultas/?ruc=${rucCliente}`)

            console.log("data: ", data)
            await connection.query("update contab_cpe set estado=? WHERE id = ?", [data.condicion, id])
            await connection.query("COMMIT");

        } catch (error) {
            await connection.query("ROLLBACK");

            throw error;
        } finally {
            connection.release();
        }


    },

    anular: async function ({ id, userId }) {
        const connection = await mysql.connection();
        try {

            await connection.query("update contab_cpe set anulado=1,fechaAnulado = CURRENT_TIMESTAMP(), usuarioAnulacion = ? WHERE id = ?", [userId, id])

        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }

    },
    lastNumberOfOrder: async function () {
        const connection = await mysql.connection();
        try {
            const yearMonth = moment()
            const data = await connection.query("select max(anio) anio,max(mes) mes, MAX(CONVERT(numero,UNSIGNED INTEGER))  numero from contab_cpe where mes is not null")
            console.log(data)
            const { anio = yearMonth.format("YYYY"), mes = yearMonth.format("MM"), numero = 0 } = data[0].anio != null && data[0] || {}
            console.log("anio=", anio, mes, numero)
            let correlativo = numero ? numero + 1 : 1
            if (yearMonth.format("YYYY") != anio) {
                correlativo = 1
            }

            return { correlativo: `${anio}${mes}${correlativo.toString().padStart(4, "0")}`, numero: correlativo };

        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }


    },


    listCpeForProviders: async function ({ }) { },


    listCpeFilterForComprobanteAndProveedor: async function ({ comprobante, provider }) {
        const connection = await mysql.connection();
        const cpeFilter = await connection.query("select * from contab_cpe where ruc=? and comprobante=? and anulado!=1", [provider, comprobante]);
        connection.release();
        return cpeFilter

    },

    getFilesForContabCpe: async function ({ contabCpeId }) {



    },


    getAjustesExtranetFornProperty: async function (nameProperty) {
        const connection = await mysql.connection();
        const values = await connection.query("select valor from contab_ajustes_extranet where propiedad=? ", [nameProperty]);
        connection.release();
        return values
    },
    getAjustesExtranetObectForProperty: async function (nameProperty) {
        const connection = await mysql.connection();
        try {

            const values = await connection.query("select valor from contab_ajustes_extranet where propiedad=? ", [nameProperty]);
            if (!values[0].valor) { throw new Error("No existe la propiedad") }
            return values[0].valor
        } catch (error) {
            console.log("e", error)
            throw error;
        } finally {
            connection.release();

        }

    }


}

module.exports = contabCpe;