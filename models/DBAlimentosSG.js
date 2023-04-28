const { poolPromise } = require('../dbconnectionMSSQL')
var db = require('../dbconnection');
const moment = require('moment');
const usuario = require('./usuario');
var fs = require('fs');
var Excel = require('exceljs');
var workbook = new Excel.Workbook();
const mysql = require("../dbconnectionPromise")

const DBAlimentosSG = {
    listarMovimientoAlimentos: async function (params) {
        try {

            const pool = await poolPromise;
            const resultQuery = await pool.query(`exec Lista_Movim_Alimento ${params.anio},${params.mes}`)
            // return resultQuery.recordset.map((record) => ({ ...record, C5_DFECDOC: moment(record.C5_DFECDOC).format("YYYY-MM-DD") }))
            return resultQuery.recordset;
        } catch (error) {
            console.log("error", error)
        }
    },
    listarKardexAlimento: async function ({ alimento, periodo, lote }) {
        const connection = await mysql.connection();
        try {
            const dataConfirmacionIngresosUnido = []


            const pool = await poolPromise;
            const data = await pool.query(`exec SP_RSFACCAR_ConsumoAlimento_Det '${periodo}', '${alimento.codAlimento}', '${lote.ccosto}'`);
            //  const data = await pool.query(`exec SP_RSFACCAR_BY_YEARMONTH_STRING  '${periodo}','${alimento.codAlimento}', '${lote.ccosto}'`)
            /*        for (let i = 0; i < data.recordset.length; i++) {
                       const dataConfirmacionEsofcom = data.recordset[i]
                       const dataConfirmacionIngresosEncontrado = dataConfirmacionIngresos.find(d => {
                           return moment(d.fecha).format("YYYY-MM-DD") == moment(dataConfirmacionEsofcom.C5_DFECDOC).add(1, "day").format("YYYY-MM-DD")
                       })
                       console.log("data",dataConfirmacionIngresosEncontrado)
                       if (dataConfirmacionIngresosEncontrado) {
                           dataConfirmacionIngresosUnido.push({ ...dataConfirmacionIngresosEncontrado,  fecha: moment(dataConfirmacionIngresosEncontrado.fecha).format("YYYY-MM-DD"), cantidadEsoftcom: dataConfirmacionEsofcom.C6_NCANTID_SUM, cantidadConfirmada: dataConfirmacionIngresosEncontrado.cantidadConfirmada })
       
                       } else {
                           dataConfirmacionIngresosUnido.push({
                               periodo: periodo, fecha: moment(dataConfirmacionEsofcom.C5_DFECDOC).add(1, "day").format("YYYY-MM-DD"),
                               cantidadEsoftcom: dataConfirmacionEsofcom.C6_NCANTID_SUM,
                               nroGuia: dataConfirmacionEsofcom.c5_crfndoc,
                               cantidadConfirmada: null,
                           })
                       }
                   } */
            for (let i = 0; i < data.recordset.length; i++) {
                const dataConfirmacionEsofcom = data.recordset[i]

                dataConfirmacionIngresosUnido.push({
                    periodo: periodo,
                    fecha: moment(dataConfirmacionEsofcom.C5_DFECDOC, "YYYY-MM-DD").add(1, "day").format("YYYY-MM-DD"),
                    //fecha: moment(dataConfirmacionEsofcom.C5_DFECDOC).add(1, "day").format("YYYY-MM-DD"),
                    cantidadEsoftcom: dataConfirmacionEsofcom.C6_NCANTID_SUM,
                    nroGuia: dataConfirmacionEsofcom.c5_crfndoc,
                })
            }
            return dataConfirmacionIngresosUnido;
        } catch (error) {
            console.log(error)
            throw error;
        } finally {
            await connection.release();

        }

    },
    reaperturarAjustes: function (ajustes = [], userId) {
        return new Promise(async (resolve, reject) => {
            try {
                const user = (await usuario.getusuarioByIdPromise(userId))[0]
                const pool = await poolPromise;
                for (let i = 0; i < ajustes.length; i++) {
                    const ajuste = ajustes[i];
                    await pool.query(`update AL0003MOVC_AJ set C5_ESTADO=1 ,IDUSUARIOAPROBACION=null,C5_USUARIOAPROBA=null,C5_DFECREAPERTURA='${moment().format("MM/DD/YYYY")}',C5_USUARIOREAPERTURA='${user.Nombre}' ,
                    C5_DFECAPROBACION=null where C5_CALMA=${ajuste.C5_CALMA} and C5_CNUMDOC='${ajuste.C5_CNUMDOC}' and C5_CTD='PE'`)
                }
                resolve();
            } catch (error) {
                reject(error)
            }
        })
    },
    detallesPorParaCrearMovimientos: async function (nroDocumentos = []) {
        try {
            const pool = await poolPromise;
            const docMaps = nroDocumentos.map((doc) => `'${doc}'`).join(",");
            const resultQuery = await pool.query(`SELECT C6_CALMA,C6_CTD,C6_CNUMDOC,C6_CITEM,C6_CCODIGO,C6_CDESCRI,C6_NCANTID 
            FROM RSFACCAR..AL0003MOVD WHERE C6_CTD='PE' AND C6_CALMA='0003' AND C6_CNUMDOC IN (${docMaps})`)
            return resultQuery.recordset
        } catch (error) {
            console.log("error", error)
        }
    },
    ultimoNroAjuste: function () {
        let numberMax = 1;
        return new Promise(async (resolve, reject) => {
            try {

                const pool = await poolPromise;
                const numberMaxQuery = (await pool.query("select max(CAST(C6_CNUMAJUSTE as numeric)) as maxNumber from AL0003MOVD_AJ")).recordset[0];
                if (numberMaxQuery.maxNumber) numberMax = 1 + numberMaxQuery.maxNumber
                resolve(numberMax);

            } catch (error) {
                console.log("err", error)
                reject(error)
            }
        })
    },
    estaPermitidoEditarAjuste: function (ajuste) {
        return new Promise(async (resolve, reject) => {
            try {

                const pool = await poolPromise;
                const estadoRow = (await pool.query(`select C5_ESTADO  as estado from AL0003MOVC_AJ where C5_CALMA=${ajuste.C6_CALMA} and C5_CNUMDOC=${ajuste.C6_CNUMDOC} and C5_CTD='PE'`)).recordset[0];
                resolve(estadoRow.estado == 1)
            } catch (error) {
                reject(error)
            }
        })
    },
    exportaExcel: function (params) {
        let rutaCM = "/template/Ajuste Alimento.xlsx";
        const alimentoFile = this;
        try {
            if (fs.existsSync("./template/Ajuste Alimento.xlsx")) {
                fs.unlinkSync("./template/Ajuste Alimento.xlsx")
            }
            workbook.xlsx.readFile('./template/Plantilla Ajuste Alimento.xlsx')
                .then(async function (work) {
                    return new Promise((resolve, reject) => {
                        workbook.eachSheet(async function (worksheet, sheetId) {
                            try {

                                const pool = await poolPromise;
                                console.log(`exec Lista_Movim_Alimento_det '${params.anio}','${params.mes}'`)
                                const data = (await pool.query(`exec Lista_Movim_Alimento_det '${params.anio}','${params.mes}'`)).recordset;
                                const borderStyles = {
                                    top: { style: "thin" },
                                    left: { style: "thin" },
                                    bottom: { style: "thin" },
                                    right: { style: "thin" }
                                };
                                if (data.length > 0) {
                                    let cellInit = 4;
                                    data.forEach((element, index) => {
                                        worksheet.getCell(`A${cellInit}`).value = element.C5_CNUMDOC;
                                        worksheet.getCell(`A${cellInit}`).border = borderStyles;
                                        worksheet.getCell(`A${cellInit}`).font = {
                                            family: "calibri",
                                            size: 8,
                                        };
                                        worksheet.getCell(`B${cellInit}`).value = moment(element.C5_DFECDOC).format("YYYY-MM-DD");
                                        worksheet.getCell(`B${cellInit}`).border = borderStyles;
                                        worksheet.getCell(`B${cellInit}`).font = {
                                            family: "calibri",
                                            size: 8,
                                        };
                                        worksheet.getCell(`C${cellInit}`).value = element.C5_CGLOSA1;
                                        worksheet.getCell(`C${cellInit}`).border = borderStyles;
                                        worksheet.getCell(`C${cellInit}`).font = {
                                            family: "calibri",
                                            size: 8,
                                        };
                                        worksheet.getCell(`D${cellInit}`).value = element.C5_CNOMPRO;
                                        worksheet.getCell(`D${cellInit}`).border = borderStyles;
                                        worksheet.getCell(`D${cellInit}`).font = {
                                            family: "calibri",
                                            size: 8,
                                        };
                                        worksheet.getCell(`E${cellInit}`).value = element.C5_CRFNDOC;
                                        worksheet.getCell(`E${cellInit}`).border = borderStyles;
                                        worksheet.getCell(`E${cellInit}`).font = {
                                            family: "calibri",
                                            size: 8,
                                        };
                                        worksheet.getCell(`F${cellInit}`).value = element.C5_CNUMAJUSTE;
                                        worksheet.getCell(`F${cellInit}`).border = borderStyles;
                                        worksheet.getCell(`F${cellInit}`).font = {
                                            family: "calibri",
                                            size: 8,
                                        };
                                        worksheet.getCell(`G${cellInit}`).value = element.C5_USUARIOAJ;
                                        worksheet.getCell(`G${cellInit}`).border = borderStyles;
                                        worksheet.getCell(`G${cellInit}`).font = {
                                            family: "calibri",
                                            size: 8,
                                        };
                                        worksheet.getCell(`H${cellInit}`).value = moment(element.C5_DFECAJUSTE).format("YYYY-MM-DD");
                                        worksheet.getCell(`H${cellInit}`).border = borderStyles;
                                        worksheet.getCell(`H${cellInit}`).font = {
                                            family: "calibri",
                                            size: 8,
                                        };

                                        worksheet.getCell(`I${cellInit}`).value = element.C5_CCODPRO;
                                        worksheet.getCell(`I${cellInit}`).border = borderStyles;
                                        worksheet.getCell(`I${cellInit}`).font = {
                                            family: "calibri",
                                            size: 8,
                                        };

                                        worksheet.getCell(`J${cellInit}`).value = element.C6_CDESCRI;

                                        worksheet.getCell(`J${cellInit}`).border = borderStyles;
                                        worksheet.getCell(`J${cellInit}`).font = {
                                            family: "calibri",
                                            size: 8,
                                        };
                                        worksheet.getCell(`K${cellInit}`).value = element.C6_NUMGUIA;
                                        worksheet.getCell(`K${cellInit}`).border = borderStyles;
                                        worksheet.getCell(`K${cellInit}`).font = {
                                            family: "calibri",
                                            size: 8,
                                        };
                                        worksheet.getCell(`L${cellInit}`).value = Number(element.C6_NCANTID).toFixed(2);
                                        worksheet.getCell(`L${cellInit}`).border = borderStyles;
                                        worksheet.getCell(`L${cellInit}`).font = {
                                            family: "calibri",
                                            size: 8,
                                        };
                                        worksheet.getCell(`M${cellInit}`).value = Number(element.C6_NCANT_AJ).toFixed(2);
                                        worksheet.getCell(`M${cellInit}`).border = borderStyles;
                                        worksheet.getCell(`M${cellInit}`).font = {
                                            family: "calibri",
                                            size: 8,
                                        };

                                        worksheet.getCell(`N${cellInit}`).value = Number(element.C6_NCANT_DIFERENCIA).toFixed(2);
                                        worksheet.getCell(`N${cellInit}`).border = borderStyles;
                                        worksheet.getCell(`N${cellInit}`).font = {
                                            family: "calibri",
                                            size: 8,
                                        };
                                        cellInit++;
                                    })
                                }
                                console.log(data)
                            } catch (error) {
                                reject(error)
                            }


                            /* const consLevante = await db.query(`SELECT GROUP_CONCAT(DISTINCT lote_str ORDER BY lote_str 
                                SEPARATOR '-') as nombreLote FROM lotes WHERE idLevante = ${lotesSelected}`);
                            const nombreLote = consLevante.length != 0 ? consLevante[0].nombreLote : 'LH45-LM46'
                            const lotesName = nombreLote.split("-");
                            const borderStyles = {
                                top: { style: "thin" },
                                left: { style: "thin" },
                                bottom: { style: "thin" },
                                right: { style: "thin" }
                            };
                            worksheet.name = `${lotesName[0]}-${lotesName[1]} Alimento`;
                            worksheet.getCell("A2").value = `PRODUCCION CONSUMO ALIMENTOS ${nombreLote}-${moment().format("YYYY")}`
                            worksheet.getCell("A2").font = {
                                bold: true,
                                size: 12
                            }
                            worksheet.mergeCells(2, 1, 2, alimentos.length * 2 + 5);
                            let cellN = 5;
                            let cellP = 5;
                            let initNumberColumnForNubers = 4;
                            fileCartilla.generateCabeceraCartillaAlimentosPorLotes(alimentos, lotesName[0], worksheet)
                            fileCartilla.generateCabeceraCartillaAlimentosPorLotes(alimentos, lotesName[1], worksheet, alimentos.length + 5)
                            rowsAlimentos.forEach((alimento, index) => {
                                const row = worksheet.getRow(cellN);
                                if (alimento.show) {
                                    worksheet.getCell(`A${cellN}`).value = alimento.Periodo;
                                    worksheet.getCell(`A${cellN}`).font = {
                                        size: 9, family: "calibri"
                                    }
                                    worksheet.getCell(`B${cellN}`).value = alimento.RangoFecha;
                                    worksheet.getCell(`B${cellN}`).font = {
                                        size: 8,
                                        bold: true
                                    };
                                    worksheet.getCell(`B${cellN}`).border = borderStyles;
                                    worksheet.getCell(`C${cellN}`).value = `Semana ${alimento.Semana}`;
                                    worksheet.getCell(`C${cellN}`).font = {
                                        family: "calibri",
                                        size: 8,
                                        bold: true
                                    };
                                    worksheet.getCell(`C${cellN}`).border = borderStyles;
                                    alimento.numeros.forEach((numero) => {
                                        row.getCell(initNumberColumnForNubers).value = numero
                                        row.getCell(initNumberColumnForNubers).border = borderStyles;
                                        initNumberColumnForNubers++;
                                    })
                                    initNumberColumnForNubers = 4;
                                    if (alimento.active == true) {
                                        worksheet.mergeCells(`A${cellP}:A${(cellP + (alimento.rowspan - 1))}`)
                                        worksheet.getCell(`A${cellP}`).border = {
                                            top: { style: "thin" },
                                            left: { style: "thin" },
                                            bottom: { style: "thin" },
                                            right: { style: "thin" }
                                        }
                                        worksheet.getCell('A' + (cellP)).alignment = {
                                            vertical: 'middle',
                                            horizontal: 'center'
                                        }
                                        cellP = cellP + alimento.rowspan;
                                    }
                                    cellN++;
                                }
                            }) */
                            setTimeout(() => resolve(), 2000);
                        })
                    }).then(data => {
                        workbook.xlsx.writeFile("./template/Ajuste Alimento.xlsx").then(function () {
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
    editarDetalleAjusteAlimento: function (ajustesDet = []) {
        const alimentoFile = this;
        return new Promise(async (resolve, reject) => {
            try {
                const ajuste = ajustesDet[0]
                if (await alimentoFile.estaPermitidoEditarAjuste(ajuste)) {
                    const pool = await poolPromise;
                    for (let i = 0; i < ajustesDet.length; i++) {
                        const detalle = ajustesDet[i]
                        await pool.query(`update AL0003MOVD_AJ set C6_NCANT_AJ=${detalle.C6_NCANTIDAJUS}, C6_NUMGUIA='${detalle.C6_NUMGUIA}',C6_NCANT_DIFERENCIA=${detalle.C6_NCANTID - detalle.C6_NCANTIDAJUS} 
                        where    C6_CALMA='${detalle.C6_CALMA}' and C6_CNUMDOC='${detalle.C6_CNUMDOC}' and C6_CTD='PE' and C6_CITEM=${detalle.C6_CITEM} `)

                    }
                    resolve()
                } else {
                    reject("El ajuste ya fue aprobado y no se puede editar")
                }
            } catch (error) {
                console.log(error)
                reject(error)
            }

        })
    },
    aprobarAjusteAlimento: function (ajustes = [], userParameter) {
        return new Promise(async (resolve, reject) => {
            try {
                const user = (await usuario.getusuarioByIdPromise(userParameter))[0]
                const pool = await poolPromise;
                for (let i = 0; i < ajustes.length; i++) {
                    const ajuste = ajustes[i]
                    await pool.query(`update AL0003MOVC_AJ set C5_ESTADO=2 ,IDUSUARIOAPROBACION=${userParameter}, C5_USUARIOAPROBA='${user.Nombre}' ,
                    C5_DFECAPROBACION='${moment().format("MM/DD/YYYY HH:mm:ss")}' where C5_CALMA=${ajuste.C5_CALMA} and C5_CNUMDOC='${ajuste.C5_CNUMDOC}' and C5_CTD='PE' `)
                }
                resolve()
            } catch (error) {
                reject(error)
            }
        })
    },
    crearAjusteAlimento: function (ajustes = [], userId) {
        return new Promise(async (resolve, reject) => {
            try {
                const pool = await poolPromise;
                const user = (await usuario.getusuarioByIdPromise(userId))[0]
                /*   await pool.query(`insert into AL0003MOVC_AJ(C6_CALMA,C6_CTD,C6_CNUMDOC,C6_CNUMAJUSTE,C6_CITEM,C6_CCODIGO,C6_CDESCRI,C6_NCANTID,C6_NCANT_AJ,C6_NCANT_DIFERENCIA,C6_USUARIOAJ)
                  values('${ajuste.C6_CALMA}', '${ajuste.C6_CTD}', '${ajuste.C6_CNUMDOC}',1, '${ajuste.C6_CITEM}', '${ajuste.C6_CCODIGO.trim()}','${ajuste.C6_CDESCRI}', ${ajuste.C6_NCANTID}, ${ajuste.C6_NCANTIDAJUS}, ${(ajuste.C6_NCANTID - ajuste.C6_NCANTIDAJUS)}, '${user[0].Nombre}')`)
    */
                for (let i = 0; i < ajustes.length; i++) {
                    const cabecera = ajustes[i]
                    await pool.query(`insert into AL0003MOVC_AJ(C5_CALMA,C5_CTD,C5_CNUMDOC,C5_DFECAJUSTE,C5_CNUMAJUSTE,C5_USUARIOAJ,C5_ESTADO,C5_DFECDOC,IDUSUARIOAJUSTE)
                    values('${cabecera.C5_CALMA}', '${cabecera.C5_CTD}', '${cabecera.C5_CNUMDOC}','${moment().format("MM/DD/YYYY HH:mm:ss")}',${cabecera.nroAjuste},'${user.Nombre}', 1,'${cabecera.C5_DFECDOC}',${userId})`)
                    for (let j = 0; j < cabecera.detalles.length; j++) {
                        const detalle = cabecera.detalles[j]
                        await pool.query(`insert into AL0003MOVD_AJ(C6_CALMA, C6_CTD, C6_CNUMDOC, C6_CNUMAJUSTE, C6_CITEM, C6_CCODIGO, C6_CDESCRI, C6_NCANTID, C6_NCANT_AJ, C6_NCANT_DIFERENCIA, C6_DFECAJUSTE, C6_USUARIOAJ,C6_NUMGUIA,C6_DFECDOC)
        values('${detalle.C6_CALMA}', '${detalle.C6_CTD}', '${detalle.C6_CNUMDOC}', ${cabecera.nroAjuste}, '${detalle.C6_CITEM}', '${detalle.C6_CCODIGO.trim()}', '${detalle.C6_CDESCRI}', ${detalle.C6_NCANTID}, ${detalle.C6_NCANTIDAJUS}, ${(detalle.C6_NCANTIDAJUS - detalle.C6_NCANTID)}, '${moment().format("MM/DD/YYYY HH:mm:ss")}', '${user.Nombre}','${detalle.C6_NUMGUIA}','${cabecera.C5_DFECDOC}')`)
                    }
                }
                resolve()
            } catch (error) {
                reject(error)
                console.log("error", error)
            }
        })
    },
    detallesPorParaEditarMovimientos: async function (nroDocumentos = []) {
        try {
            const pool = await poolPromise;
            const docMaps = nroDocumentos.map((doc) => `'${doc}'`).join(",");
            const resultQuery = await pool.query(` select * from DBCostsSG..AL0003MOVD_AJ  WHERE C6_CTD = 'PE' AND C6_CALMA = '0003' AND C6_CNUMDOC IN(${docMaps})`)
            return resultQuery.recordset
        } catch (error) {
            console.log("error", error)
        }
    }
}
module.exports = DBAlimentosSG;