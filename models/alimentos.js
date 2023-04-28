const moment = require('moment');
moment.locale('es');
var fs = require('fs')
var db = require('../dbconnection');
const mysql = require("../dbconnectionPromise")
const dbAlimento = require("./DBAlimentosSG")
const { poolPromise } = require('../dbconnectionMSSQL');
const cotizacionModel = require("./cotizacion")
const periodoKardex = require("./periodo_f33")
const levanteAlimento = require("./levanteAlimento")
const loteModel = require("./lotes")
var Excel = require('exceljs')
var workbook = new Excel.Workbook()
const { Buffer } = require('buffer');
const { periodoIsOpen } = require('./periodo_f33');

var Alimentos = {

    getAllAlimento: function (callback) {

        return db.query("Select * from tipo_alimento", callback);

    },
    getAlimentoById: function (id, callback) {

        return db.query("select * from tipo_alimento where idAlimento=?", [id], callback);
    },
    getAlimentoByIdLevante: function (id, callback) {
        return db.query("select * from alimento_levante_sem where idLevante=? order by CantRealAlimento ASC", [id], callback);
    },
    getAlimentoLevantes: function (callback) {
        return db.query("SELECT * FROM lotes", callback);
    },
    getAlimentoLevante: async function (id) {
        return await db.query(`SELECT li.Linea, lo.idLevante, lo.idLote, li.CodLinea FROM levantes le
        INNER JOIN lotes lo on lo.idLevante = le.idLevante
        INNER JOIN lineas li on li.idLinea = lo.idLinea
                WHERE lo.idLevante = ?
                ORDER BY li.Linea DESC`, [id]);
    },
    postAlimentoSemana: async function (lotes) {
        return await db.query("SELECT idLote, Semana, CantRealAlimento FROM alimento_levante_sem " +
            "WHERE idLote IN (" + lotes.lotes.join() + ") " +
            "ORDER BY idLote, Semana");
    },



    transferirAlimentoDespacho: async function ({ data = [], ...despacho }) {
        const connection = await mysql.connection();
        const pool = await poolPromise
        let nroMovimiento = null
        const fechaSeleccionadoMoment = moment(data[0].fecha)
        try {
            await connection.query("START TRANSACTION");
            const { recordset } = await pool.request().query("select (A1_NNUMSAL+1) correlativo from RSFACCAR.dbo.AL0003ALMA where A1_CALMA='0003'")
            nroMovimiento = recordset[0].correlativo
            console.log("mov", nroMovimiento, "re", recordset)
            let ccosto = null
            if (despacho.tipo == "L" || despacho.tipo == "LEVANTE") {
                ccosto = (await connection.query("select idLevante,ccosto,Nombre from levantes where idLevante=?", [despacho.idObjeto]))[0].ccosto
            } else {

                ccosto = (await connection.query(" select idProduccion,ccosto,Nombre from produccion where idProduccion=?", [despacho.idObjeto]))[0].ccosto
            }
            const result = await pool.request()
                .query(`exec [dbo].[SP_AL0003MOVC_Inserta] @C5_CALMA='0003',@C5_CTD='PS',@C5_CNUMDOC='${nroMovimiento.toString().padStart(11, "0")}',@C5_CLOCALI='0001',
        @C5_DFECDOC='${fechaSeleccionadoMoment.format('YYYY-MM-DD')}',@C5_CTIPMOV='S',@C5_CCODMOV='PR',@C5_CSITUA='',@C5_CRFTDOC='VA',@C5_CRFNDOC='${despacho.nroSerie}',@C5_CSOLI='01',@C5_CCENCOS='${ccosto}',
        @C5_CRFALMA='',@C5_CGLOSA1='',@C5_CGLOSA2='',@C5_CGLOSA3='En Transito'
        
        ,@C5_CTIPANE='',@C5_CCODANE='',@C5_CUSUCRE='GRA01',@C5_CUSUMOD='',@C5_CCODCLI='',@C5_CNOMCLI='',@C5_CRUC='',@C5_CCODCAD='',@C5_CCODINT='',@C5_CCODTRA='',@C5_CNOMTRA='',@C5_CCODVEH='',@C5_CTIPGUI='',
        @C5_CSITGUI='',@C5_CGUIFAC='',@C5_CDESTIN='',@C5_CDIRENV='',@C5_CNUMORD='',@C5_CTIPORD='',@C5_CGUIDEV='',@C5_CCODPRO='',@C5_CNOMPRO='',@C5_CCIAS='',@C5_CFORVEN='',@C5_CCODMON='',@C5_CVENDE='',@C5_NTIPCAM=0,
        @C5_CCODAGE='',@C5_CNUMPED='',@C5_CDIRECC='',@C5_NIMPORT=0,@C5_CTIPO='',@C5_CSUBDIA='',@C5_CCOMPRO='',@C5_NPORDE1=0,@C5_NPORDE2=0,@C5_CTF='',@C5_NFLETE=0,@C5_CCODAUT='',@C5_CRFTDO2='',@C5_CRFNDO2='',@C5_CNUMLIQ='',@C5_CORDEN='',@C5_CTIPOGS='',@C5_CCODFER='',@C5_CGLOSA4='',@C5_CVENDE2='',
        @C5_CESTDEV='',@C5_CEXTOR='',@C5_CRENOM='',@C5_CRERUC='',@C5_CREREF='',@C5_CDSNOM='',@C5_CDSRUC='',@C5_CLLECIU='',@C5_CPARCIU='',@C5_CTTRACT='',@C5_CTRASRE='',@C5_CTRAREM='',@C5_CLICCON='',@C5_CSBNOM='',@C5_CSBRUC='',@C5_CSBMTC='',@C5_CMONPER='',@C5_NIMPPER=0,@C5_CFPERCP='',@C5_CESTFIN='',
        @C5_CFLGPEN='F',@C5_CTIPFOR='',@C5_NPORPER=0,@C5_CFLGTRM='',@C5_CAGETRA='',@C5_CCONTAI='',@C5_CDOCEST='',@C5_CSUNEST='',@C5_CPROEST='',@C5_DFECCDR=null,@C5_CCOMEST='',@C5_CFMANU='',@C5_CFIRMDIG='',@C5_CHFIRMDIG='',@C5_CTED='',@C5_CFREPRO='',@C5_CTIPDES='',@C5_CEMAIL='',@C5_CTE='',@C5_CCODTAL='',
        @C5_CCODMOD='',@C5_CUNIDAD='',@C5_NPESO=0,@C5_NCANTBULT=0,@C5_CCODMOT='',@C5_CDOCIDE='',@C5_CFCONTIG='',@C5_NREINDCL=0,@C5_NREINDCLB=0,@C5_CERRCOD='',@C5_CSOLEST='',@C5_CFBAJA='',@C5_CFNOVEDAD='',@C5_CHASHRS='',@C5_CTIPFAC='',@C5_COTRMOT=''  `)
            let index = 1;
            for (const detalle of data) {

                const { recordset } = await pool.request().query(`SELECT RTRIM(AR_CDESCRI) DESCRIP FROM RSFACCAR.dbo.AL0003ARTI WHERE AR_CCODIGO='${detalle.alimento.codAlimento}' `)
                console.log("resultset", recordset)
                const descripcion = recordset[0].DESCRIP
                await pool.request()
                    .query(`exec [dbo].[SP_AL0003MOVD_Inserta] @C6_CTD='PS',@C6_CNUMDOC='${nroMovimiento.toString().padStart(11, "0")}',@C6_CITEM='${index.toString().padStart(4, "0")}', @C6_CCODIGO='${detalle.alimento.codAlimento}',@C6_NCANTID=${detalle.cantidadDespachada},@C6_DFECDOC='${fechaSeleccionadoMoment.format("YYYY-MM-DD")}',@C6_CCODMOV='PR'
                    ,@C6_NTIPCAM=0,@C6_CCENCOS='${ccosto}',@C6_CDESCRI='${descripcion}',@C6_NCANREQ=0,@C6_CCTACMO='2411102',@C6_CNUMORD='',@C6_CUMREF='' `)
                index++
            }

            await connection.query("update  confirmacionIngresoAlimento set estado=1, valeEsoftcom=? where id in(?) ", [nroMovimiento, data.map(d => d.id).concat([despacho.id])])
            await connection.query("COMMIT");
        } catch (error) {
            console.log("e", error);
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }




    },
    crearConfirmacionIngresosDespacho: async function ({ data = [], tipo, lote, user, granja, nroSerie }) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            const periodoFirstItem = moment(data[0].fecha, "YYYY-MM-DD").format("YYYYMM")
            console.log("periodo", periodoFirstItem)
            if (!await periodoIsOpen(periodoFirstItem)) {
                throw new Error("El Periodo Se encuentra Cerrado")


            }
            const dataNroSerie = await connection.query("select id from confirmacionIngresoAlimento where nroSerie=? and idGranja=?", [nroSerie, granja.idGranja]);
            if (dataNroSerie.length > 0) {
                throw new Error("El numero de serie se encuentra registrado")
            }

            const dataValues = data.map(d => [moment(d.fecha).format("YYYYMM"), d.fecha, tipo == "L" ? lote.idLevante : lote.idProduccion, d.alimento.idAlimento, tipo, d.cantidadDespachada, d.observacion, d.nroSacos, nroSerie, granja.idGranja, user, new Date(), new Date()])
            await connection.query("insert into confirmacionIngresoAlimento(periodo,fecha,idObjeto,idAlimento,tipo,cantidadDespachada,observacion,nroSacos,nroSerie,idGranja,idUsuario,fechaReg,fechaMod) values ? ", [dataValues])
            await connection.query("COMMIT");
        } catch (error) {
            console.log("e", error);
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }

    },
    ultimoNroSeriePorGranja: async function (idGranja) {
        const connection = await mysql.connection();
        try {
            const data = await connection.query(`SELECT MAX(CONVERT(nroSerie,UNSIGNED INTEGER)) 
            as nroSerie FROM confirmacionIngresoAlimento WHERE idGranja =?
             `, [idGranja]);
            const dataSerie = ((data.length > 0 && data[0].nroSerie || 0) + 1).toString().padStart(6, "0")
            return dataSerie
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
    },
    listarDetalleDespacho: async function (nroSerie, idGranja) {
        const connection = await mysql.connection();
        try {
            const listaKardex = await connection.query("select ci.id,ci.cantidadDespachada,DATE_FORMAT(ci.fecha,'%Y-%m-%d') as fecha,ci.nroSacos,ci.nroGuia,ci.cantidadEsoftcom,ci.observacion,ci.idAlimento,ci.cantidadConfirmada,ta.* from confirmacionIngresoAlimento ci inner JOIN tipo_alimento ta on ta.idAlimento=ci.idAlimento where ci.nroSerie=? and ci.idGranja=?", [nroSerie, idGranja])
            const listaDespacho = listaKardex.map(l => ({ ...l, alimento: { idAlimento: l.idAlimento, nombreAlimento: l.nombreAlimento, codAlimento: l.codAlimento } }))
            return listaDespacho;
        } catch (error) {
            console.log("e", error)
            throw error;
        } finally {
            connection.release();
        }


    },

    async listarDespachosSinConfirmacion() {
        const connection = await mysql.connection();
        try {
            const listaKardex = await connection.query("select ci.id,ci.cantidadDespachada,DATE_FORMAT(ci.fecha,'%Y-%m-%d') as fecha,ci.nroSacos,ci.nroGuia,ci.cantidadEsoftcom,ci.observacion,ci.idAlimento,ci.cantidadConfirmada,ci.tipo,ci.idObjeto,ci.nroSerie,ta.* from confirmacionIngresoAlimento ci inner JOIN tipo_alimento ta on ta.idAlimento=ci.idAlimento where ci.cantidadConfirmada is null")
            const listaDespacho = listaKardex.map(l => ({ ...l, alimento: { idAlimento: l.idAlimento, nombreAlimento: l.nombreAlimento, codAlimento: l.codAlimento } }))
            return listaDespacho;
        } catch (error) {
            console.log("e", error)
            throw error;
        } finally {
            connection.release();
        }

    },



    updateCantidadConfirmada: async function ({ id, cantidadConfirmada }) {
        const connection = await mysql.connection();
        try {

            const confirmacionIngreso = (await connection.query("select periodo from confirmacionIngresoAlimento where id=?", [id]))[0]
            console.log("c", confirmacionIngreso)
            if (!await periodoIsOpen(confirmacionIngreso.periodo)) {
                throw new Error("El periodo esta cerrado")
            }
            await connection.query("update confirmacionIngresoAlimento set cantidadConfirmada=? where id=?", [cantidadConfirmada, id])

        } catch (error) {
            console.log("e", error)
            throw error;
        } finally {
            connection.release();
        }

    },
    actualizarCantidadConfirmadaBatch: async function (despachos = []) {
        const connection = await mysql.connection();
        try {
            const despachosFilter = despachos.filter(d => d.cantidadConfirmada)
            const query = despachosFilter.map(d => `update confirmacionIngresoAlimento set cantidadConfirmada=${d.cantidadConfirmada} where id=${d.id}`)
            /*    const confirmacionIngreso = (await connection.query("select periodo from confirmacionIngresoAlimento where id=?", [id]))[0]
               console.log("c", confirmacionIngreso)
               if (!await periodoIsOpen(confirmacionIngreso.periodo)) {
                   throw new Error("El periodo esta cerrado")
               } */
            await connection.query(query.join(";"))

        } catch (error) {
            console.log("e", error)
            throw error;
        } finally {
            connection.release();
        }


    },
    exportarExcelConfirmaconDeIngresos: async function ({ data = [], cabecera }) {
        try {
            const rutaTemplateHC = `./template/Plantilla Nota Despacho.xlsx`;
            const alignmentStyle = { vertical: "middle", horizontal: "center", wrapText: true }

            const borderStylesC = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            if (fs.existsSync(`./template/nota despacho.xlsx`)) {
                fs.unlinkSync(`./template/nota despacho.xlsx`)
            }
            const wor = await workbook.xlsx.readFile(rutaTemplateHC)
            const sheet = wor.worksheets[0];
            sheet.getCell("B8").value = moment(cabecera.fecha).format("YYYY-MM-DD")
            sheet.getCell("C8").value = `Lote: ${cabecera.lote.Nombre}`
            sheet.getCell("D8").value = `${cabecera.granja.Granja}`
            sheet.getCell("E8").value = `SERIE:${cabecera.granja.serie_guia}-${cabecera.nroSerie}`
            const totalLength = data.length
            for (let i = 0; i < data.length; i++) {
                const dataActual = data[i]
                sheet.getCell("A" + (i + 11)).value = i + 1
                sheet.getCell("A" + (i + 11)).border = borderStylesC
                sheet.getCell("A" + (i + 11)).alignment = alignmentStyle
                sheet.getCell("B" + (i + 11)).value = dataActual.alimento.codAlimento
                sheet.getCell("B" + (i + 11)).border = borderStylesC;
                sheet.getCell("B" + (i + 11)).alignment = alignmentStyle
                sheet.getCell("C" + (i + 11)).value = dataActual.alimento.nombreAlimento
                sheet.getCell("C" + (i + 11)).border = borderStylesC
                sheet.getCell("C" + (i + 11)).alignment = alignmentStyle
                sheet.getCell("D" + (i + 11)).value = dataActual.nroSacos
                sheet.getCell("D" + (i + 11)).border = borderStylesC
                sheet.getCell("D" + (i + 11)).alignment = alignmentStyle
                sheet.getCell("E" + (i + 11)).value = dataActual.cantidadDespachada
                sheet.getCell("E" + (i + 11)).border = borderStylesC
                sheet.getCell("E" + (i + 11)).alignment = alignmentStyle
                sheet.getCell("F" + (i + 11)).value = dataActual.observacion
                sheet.getCell("F" + (i + 11)).border = borderStylesC
                sheet.getCell("F" + (i + 11)).alignment = alignmentStyle
            }
            const total = data.reduce((prev, cur) => {
                prev.totalSacos += cur.nroSacos
                prev.totalCantidadDespachada += cur.cantidadDespachada

                return prev
            }, { totalSacos: 0, totalCantidadDespachada: 0 })
            console.log(total, totalLength + 2)
            sheet.getCell("C" + (totalLength + 11)).value = "Total"
            sheet.getCell("C" + (totalLength + 11)).border = borderStylesC
            sheet.getCell("C" + (totalLength + 11)).alignment = alignmentStyle
            sheet.getCell("D" + (totalLength + 11)).value = total.totalSacos
            sheet.getCell("D" + (totalLength + 11)).border = borderStylesC
            sheet.getCell("D" + (totalLength + 11)).alignment = alignmentStyle
            sheet.getCell("E" + (totalLength + 11)).value = total.totalCantidadDespachada
            sheet.getCell("E" + (totalLength + 11)).border = borderStylesC
            sheet.getCell("E" + (totalLength + 11)).alignment = alignmentStyle
            await workbook.xlsx.writeFile(`./template/nota despacho.xlsx`)

            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "/supergen-be/template/nota despacho.xlsx"
            }
            return json;


        } catch (error) {
            console.log(error)
            throw error;
        }


    },
    listarConfirmacionIngresoDespacho: async function ({ isLevante, fechaInicio, fechaFin, lote, tipo }) {
        const connection = await mysql.connection();
        try {
            let idObjeto = null
            if (tipo && lote) {
                idObjeto = isLevante ? lote.idLevante : lote.idProduccion
            }
            const listaKardex = await connection.query(
                `select ci.id,ci.periodo,ci.valeEsoftcom,ci.fecha,ci.estado,ci.idObjeto,IF(ci.tipo='L','LEVANTE','PRODUCCION') as tipo,ci.nroSerie,g.idGranja,g.Granja,g.serie_guia from confirmacionIngresoAlimento ci inner join granjas g on g.idGranja=ci.idGranja where ci.fecha BETWEEN ? and ? and ci.tipo like '%${tipo && tipo || ''}%' and ci.idObjeto like '%${idObjeto && idObjeto || ''}%' group by ci.nroSerie,g.idGranja `
                , [moment(fechaInicio).format("YYYY-MM-DD"), moment(fechaFin).format("YYYY-MM-DD")])

            for (let i = 0; i < listaKardex.length; i++) {
                const kardexActual = listaKardex[i]
                const loteLevante = (await connection.query("Select * from levantes where idLevante=? ORDER BY idLevante DESC", [kardexActual.idObjeto]))[0]
                const loteProduccion = (await connection.query("Select * from produccion where idProduccion=? ORDER BY idProduccion DESC", [kardexActual.idObjeto]))[0]
                if (kardexActual.tipo == "LEVANTE") {
                    kardexActual.lote = { idObjeto: loteLevante.idLevante, Nombre: loteLevante.Nombre }
                }
                if (kardexActual.tipo == "PRODUCCION") {
                    kardexActual.lote = { idObjeto: loteProduccion.idProduccion, Nombre: loteProduccion.Nombre }
                }
                kardexActual["granja"] = { idGranja: kardexActual.idGranja, Granja: kardexActual.Granja, serie_guia: kardexActual.serie_guia }

            }
            return listaKardex;
        } catch (error) {
            console.log("e", error)
            throw error;
        } finally {
            connection.release();
        }
    },
    crearConfirmacionDeIngresos: async function ({ data = [], periodo, tipo, lote, user, alimento }) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");

            if (data.length > 0) {
                await connection.query("delete from confirmacionIngresoAlimento where periodo=? and tipo =? and idAlimento=? and idObjeto=?", [periodo, tipo, alimento.idAlimento, tipo === 'P' ? lote.idProduccion : lote.idLevante]);
            }

            //alimento
            //id
            const dataValues = data.map(d => [periodo, d.fecha, tipo == "L" ? lote.idLevante : lote.idProduccion, d.idAlimento, tipo, d.nroGuia, d.cantidadEsoftcom, d.cantidadConfirmada, user, new Date(), new Date()])
            await connection.query("insert into confirmacionIngresoAlimento(periodo,fecha,idObjeto,idAlimento,tipo,nroGuia,cantidadEsoftcom,cantidadConfirmada,idUsuario,fechaReg,fechaMod) values ? ", [dataValues])
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
    },

    generarKardexAlimento: async function ({ periodo, tipo, lote, user, granja, alimento }) {
        const connection = await mysql.connection();
        try {
            let propiedad = "idProduccion"
            if (tipo == "L") propiedad = "idLevante"
            await connection.query("START TRANSACTION");
            await connection.query("delete from  prod_kardexalimento where periodo=? and idAlimento=? and tipo=? and ccosto=?  ", [periodo, alimento.idAlimento, tipo, lote.ccosto])

            const dataConfirmacionIngresosGroup = await connection.query(`select confirmacionIngreso.fecha,sum(confirmacionIngreso.cantidadConfirmada) cantidadConfirmada,GROUP_CONCAT(confirmacionIngreso.nroSerie) nroSerie from confirmacionIngresoAlimento confirmacionIngreso
            where confirmacionIngreso.idAlimento=? and confirmacionIngreso.periodo=? and idObjeto=${lote[propiedad]} GROUP BY confirmacionIngreso.fecha`, [alimento.idAlimento, periodo,]);

            const dataConfirmacionIngresos = await connection.query(`select confirmacionIngreso.fecha,confirmacionIngreso.id,confirmacionIngreso.nroSerie from confirmacionIngresoAlimento confirmacionIngreso
            where confirmacionIngreso.idAlimento=? and confirmacionIngreso.periodo=? `, [alimento.idAlimento, periodo,]);
            const listaCodigoGenetico = ["L9", "L7", "L4", "L1"]
            let querySelect = `select lo.Sexo,lo.TipoGenero,lo.lote,lo.lote_str,concat(YEAR(aD.Fecha),LPAD(MONTH(aD.Fecha),2,'0')) periodo, aD.CantAlimento,aD.Fecha,aD.idLevante as idObjeto,aD.Semana
            from alimento_levante_det aD inner  join lotes lo on lo.idLote=aD.idLote
            where idAlimento=${alimento.idAlimento} and concat(YEAR(aD.Fecha),LPAD(MONTH(aD.Fecha),2,'0'))=${periodo}
            and aD.idLevante=${lote.idLevante}
            order by aD.Fecha;`

            if (tipo == 'P') {
                querySelect = `
select lo.Sexo,lo.TipoGenero, CONCAT(YEAR(prodDet.fecha),LPAD(MONTH(prodDet.Fecha),2,'0')) periodo,lo.lote,lo.lote_str,prodDet.Fecha,prodDet.CantAlimento,prodDet.idProduccion as idObjeto,prodDet.Semana from alimento_prod_det prodDet inner join lotes lo on  lo.idLote=prodDet.idLote 
where prodDet.idProduccion=${lote.idProduccion} and prodDet.idAlimento=${alimento.idAlimento} and  CONCAT(YEAR(prodDet.fecha),LPAD(MONTH(prodDet.Fecha),2,'0'))=${periodo}  order by prodDet.Fecha;`

            }
            const momentPeriodo = moment(periodo, "YYYYMM")
            const listaConfirmadaEsoftConPorFecha = await dbAlimento.listarKardexAlimento({ alimento: alimento, periodo, lote: lote })
            const listaConfirmadaUpdate = dataConfirmacionIngresos.map(d => {
                const { cantidadEsoftcom = null, nroGuia = null } = listaConfirmadaEsoftConPorFecha.find(l => l.fecha == moment(d.fecha).format("YYYY-MM-DD") && l.nroGuia == d.nroSerie) || {}


                return { ...d, cantidadEsoftcom, nroGuia }
            })

            const listaGenrica = await connection.query(querySelect)
            const diaInicioDelMes = momentPeriodo.clone().startOf("month")
            const diaFinDelMes = momentPeriodo.clone().endOf("month")
            const { saldoFinal: saldoFinalPeriodoAnterior = 0 } = (await connection.query("select saldoFinal from prod_kardexalimento where fecha=? and idObjeto=? and idAlimento=?", [momentPeriodo.clone().subtract(1, "month").endOf("month").format("YYYY-MM-DD"), lote[propiedad], alimento.idAlimento]))[0] || {}

            let listaConjuntaInsert = []
            let numeroDias = 0
            while (diaInicioDelMes.isSameOrBefore(diaFinDelMes)) {

                const { CantAlimento: cantidadAlimentoL9Produccion = 0, idObjeto: idObjetoProduccion = 0, Semana: semanaProduccion = 0 } = listaGenrica.find(l => moment(l.Fecha).isSame(diaInicioDelMes) && l.lote.includes(listaCodigoGenetico[0])) || {}
                const { CantAlimento: cantidadAlimentoL7Produccion = 0 } = listaGenrica.find(l => moment(l.Fecha).isSame(diaInicioDelMes) && l.lote.includes(listaCodigoGenetico[1])) || {}
                const { CantAlimento: cantidadAlimentoL4Produccion = 0 } = listaGenrica.find(l => moment(l.Fecha).isSame(diaInicioDelMes) && l.lote.includes(listaCodigoGenetico[2])) || {}
                const { CantAlimento: cantidadAlimentoL1Produccion = 0 } = listaGenrica.find(l => moment(l.Fecha).isSame(diaInicioDelMes) && l.lote.includes(listaCodigoGenetico[3])) || {}

                const { nroSerie = '', cantidadEsoftcom = null, cantidadConfirmada = null } = dataConfirmacionIngresosGroup.find(l => moment(l.fecha).isSame(diaInicioDelMes)) || {}

                let totalSalida = cantidadAlimentoL9Produccion + cantidadAlimentoL7Produccion + cantidadAlimentoL4Produccion + cantidadAlimentoL1Produccion
                const conjuntoInsert = {
                    periodo: periodo,
                    semana: semanaProduccion,
                    tipo: tipo,
                    descripcionlote: "",
                    granja: granja,
                    fecha: diaInicioDelMes.format("YYYY-MM-DD"),
                    ccosto: lote.ccosto,
                    alimento: alimento,
                    nroGuia: nroSerie, cantidadEsoftcom,
                    cantidadConfirmada,
                    idObjeto: tipo == "L" ? lote.idLevante : lote.idProduccion,
                    salidaL9: cantidadAlimentoL9Produccion,
                    salidaL7: cantidadAlimentoL7Produccion,
                    salidaL4: cantidadAlimentoL4Produccion,
                    salidaL1: cantidadAlimentoL1Produccion,
                    saldoFinal: 0,
                    saldoInicial: saldoFinalPeriodoAnterior,
                    totalSalida
                }
                //TODO:AQUI FALTA PONER EL CALCULO DEL SALDO INICIAL

                if (numeroDias > 0) {
                    conjuntoInsert.saldoInicial = listaConjuntaInsert[numeroDias - 1].saldoFinal

                }
                console.log("saldo inicial", conjuntoInsert.saldoInicial)

                if (tipo == "P") {
                    totalSalida = cantidadAlimentoL9Produccion + cantidadAlimentoL7Produccion + cantidadAlimentoL4Produccion + cantidadAlimentoL1Produccion;
                    conjuntoInsert.salidaL9 = cantidadAlimentoL9Produccion
                    conjuntoInsert.salidaL7 = cantidadAlimentoL7Produccion
                    conjuntoInsert.salidaL4 = cantidadAlimentoL4Produccion
                    conjuntoInsert.salidaL1 = cantidadAlimentoL1Produccion
                    conjuntoInsert.semana = semanaProduccion
                    conjuntoInsert.totalSalida = totalSalida
                }

                conjuntoInsert.saldoFinal = conjuntoInsert.saldoInicial + cantidadConfirmada - totalSalida
                listaConjuntaInsert.push(conjuntoInsert)
                numeroDias++

                diaInicioDelMes.add(1, "day")
            }

            const listaConjuntaInsertValues = listaConjuntaInsert.map(l => [l.periodo, l.fecha, l.granja.idGranja, l.semana, tipo, l.idObjeto, l.ccosto,
            l.alimento.idAlimento, l.descripcionlote, l.nroGuia, l.saldoInicial, l.cantidadEsoftcom, l.cantidadConfirmada, l.salidaL9 == null ? 0 : l.salidaL9, l.salidaL7 == null ? 0 : l.salidaL7, l.salidaL4 == null ? 0 : l.salidaL4, l.salidaL1 == null ? 0 : l.salidaL1, l.totalSalida == null ? 0 : l.totalSalida, l.saldoFinal, user, new Date(), new Date()])
            if (listaConfirmadaUpdate.length > 0) {
                const queyUpdateConfirmacionIngresos = listaConfirmadaUpdate.map(l => `update  confirmacionIngresoAlimento set nroGuia='${l.nroGuia}', cantidadEsoftcom=${l.cantidadEsoftcom} where id=${l.id}`)
                await connection.query(queyUpdateConfirmacionIngresos.join(";"));

            }

            if (await periodoKardex.periodoIsOpen(periodo)) {

                await connection.query("insert into prod_kardexalimento(periodo,fecha,idGranja,semana,tipo,idObjeto,ccosto,idAlimento,descripcionLote,nroGuia,saldoInicial,cantidadEsoftcom,cantidadConfirmada,salidaL9,salidaL7,salidaL4,salidaL1,totalSalida,saldoFinal,idUsuario,fechaReg,fechaMod) values ?", [listaConjuntaInsertValues])
            }



            await connection.query("COMMIT");

            return listaConjuntaInsert;
        } catch (error) {
            console.log(error)
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }

    },
    cronDiarioAlimento: async function () {
        const connection = await mysql.connection();
        try {
            const periodosAbiertos = await connection.query("select YearMonth from periodo_f33 where estado=1 order by YearMonth");
            if (periodosAbiertos.length > 0) {
                const levantes = await connection.query(`select A.idLevante,'L' as tipo,A.idAlimento,l.idGranja as granja,DATE_FORMAT(A.Fecha,'%Y%m') as periodo,B.codAlimento,C.ccosto
                from alimento_levante_det A left join tipo_alimento B on B.idAlimento=A.idAlimento
                left join levantes C on C.idLevante=A.idLevante
                left join lotes l on l.idLevante=A.idLevante
                where DATE_FORMAT(A.Fecha,'%Y%m') in(?)
                group by A.idLevante,A.idAlimento ,DATE_FORMAT(A.Fecha,'%Y%m')
order by DATE_FORMAT(A.Fecha,'%Y%m') asc;
                `, [periodosAbiertos.map(p => p.YearMonth)])
                const produccion = await connection.query(`select A.idProduccion,'P' as tipo,A.idAlimento ,B.codAlimento,l.idGranjaP as granja ,DATE_FORMAT(A.Fecha,'%Y%m') as periodo,C.ccosto
                from alimento_prod_det A left join tipo_alimento B on B.idAlimento=A.idAlimento left join produccion C on C.idProduccion=A.idProduccion
                left join lotes l on l.idProduccion=A.idProduccion where DATE_FORMAT(A.Fecha,'%Y%m') in(?)
                group by A.idProduccion,A.idAlimento ,DATE_FORMAT(A.Fecha,'%Y%m')
                order by DATE_FORMAT(A.Fecha,'%Y%m') asc;`, [periodosAbiertos.map(p => p.YearMonth)])
                const lotesAgrupados = levantes.concat(produccion)
                for (let i = 0; i < periodosAbiertos.length; i++) {
                    const periodo = periodosAbiertos[i].YearMonth
                    const lotesPorPeriodo = lotesAgrupados.filter(l => l.periodo == periodo)
                    console.log("lotesFiltrado", lotesPorPeriodo)
                    for (let j = 0; j < lotesPorPeriodo.length; j++) {
                        const { idLevante = null, idProduccion = null, ...loteALimentoActual } = lotesPorPeriodo[j]
                        const id = { idLevante }
                        if (loteALimentoActual.tipo == "P") {
                            delete id.idLevante
                            id["idProduccion"] = idProduccion
                        }
                        await this.generarKardexAlimento({ periodo, ...loteALimentoActual, alimento: { idAlimento: loteALimentoActual.idAlimento, codAlimento: loteALimentoActual.codAlimento }, granja: { idGranja: loteALimentoActual.granja }, lote: { ccosto: loteALimentoActual.ccosto, ...id }, user: 1, })

                    }
                }
            }


        } catch (error) {
            console.log("error", error)

        }
    },
    listarKardexPorAlimentoPeriodoLoteYTipo: async function ({ periodo, idAlimento, idObjeto, tipo }) {
        console.log("p", periodo, "idAlimento", idAlimento, "idO", idObjeto, "tipo", tipo)
        var kardexPorDia = { saldoInicial: null, cantidadConfirmada: null, fecha: null, dia: null, nroGuia: null, salidaL9: null, salidaL7: null, salidaL4: null, salidaL1: null, totalSalida: null }

        const connection = await mysql.connection();
        try {
            var periodo_ = periodo.slice(5, 6);
            periodo_ = parseInt(periodo_);
            periodo_ = periodo_ - 1;

            const periodoMoment = moment(periodo, "YYYYMM");
            var yearMoment = periodo.slice(0, 4);
            var monthMoment = periodo.slice(4, 6);
            periodo_ = periodo.replace(monthMoment, '0' + periodo_);
            yearMoment = periodo_.slice(0, 4);
            monthMoment = periodo_.slice(4, 6);
            const { saldoFinal = 0 } = (await connection.query("select saldoFinal from prod_kardexalimento where fecha = ? and idObjeto=? and idAlimento=?", [periodoMoment.clone().subtract(1, "month").endOf("month").format("YYYY-MM-DD"), idObjeto, idAlimento]))[0] || {}
            let listaKardex = []
            const diaInicioDelMes = periodoMoment.clone().startOf("month")
            const diaFinDelMes = periodoMoment.clone().endOf("month")

            const calculoTotalSemasEnUnMes = Math.floor(diaInicioDelMes.daysInMonth() / 7)
            let numeroDiasPorSemana = 0
            let ultimoViernesDelMes = diaInicioDelMes;
            const kardex = await connection.query("select * from prod_kardexalimento where periodo=? and idAlimento=? and idObjeto=? and tipo=? order by fecha asc", [periodo, idAlimento, idObjeto, tipo])


            while (diaInicioDelMes.isSameOrBefore(diaFinDelMes)) {
                const kardexActual = kardex.find(k => moment(k.fecha).format("YYYY-MM-DD") == diaInicioDelMes.format("YYYY-MM-DD"))
                if (kardexActual) {
                    kardexPorDia.saldoInicial = kardexActual.saldoInicial
                    kardexPorDia.cantidadConfirmada = kardexActual.cantidadConfirmada
                    kardexPorDia.fecha = moment(kardexActual.fecha).format("YYYY-MM-DD")
                    kardexPorDia.dia = diaInicioDelMes.format("dddd")
                    kardexPorDia.nroGuia = kardexActual.nroGuia
                    kardexPorDia.salidaL9 = Number(kardexActual.salidaL9).toFixed(2) * 1
                    kardexPorDia.salidaL4 = Number(kardexActual.salidaL4).toFixed(2) * 1
                    kardexPorDia.salidaL7 = Number(kardexActual.salidaL7).toFixed(2) * 1
                    kardexPorDia.salidaL1 = Number(kardexActual.salidaL1).toFixed(2) * 1
                    kardexPorDia.totalSalida = Number(kardexActual.totalSalida).toFixed(2) * 1
                    kardexPorDia.saldoFinal = Number(kardexActual.saldoFinal).toFixed(2) * 1
                    if (diaInicioDelMes.format("dddd") == "viernes") {
                        listaKardex.push({ ...kardexPorDia })
                        numeroDiasPorSemana++
                    }
                    if (diaInicioDelMes.format("dddd") == "viernes") {
                        ultimoViernesDelMes = diaInicioDelMes.clone()
                        listaKardex = this.calcularTotalKardex(listaKardex, numeroDiasPorSemana - 1, diaInicioDelMes)
                        numeroDiasPorSemana = 0;
                    } else {
                        listaKardex.push({ ...kardexPorDia })
                        numeroDiasPorSemana++
                    }
                }
                diaInicioDelMes.add(1, "day")


            }
            //    console.log("listaK", listaKardex)
            ultimoViernesDelMes.add(1, "day")
            const numeroDiasUltimaSemana = diaInicioDelMes.diff(ultimoViernesDelMes, "days")
            const data = this.calcularTotalKardex(listaKardex, numeroDiasUltimaSemana, diaInicioDelMes)
            data.unshift({ saldoInicial: null, cantidadConfirmada: null, fecha: null, dia: null, nroGuia: null, salidaL9: null, salidaL7: null, salidaL4: null, salidaL1: null, totalSalida: null, fecha: "Saldo Anterior", saldoFinal: saldoFinal })
            return data

        } catch (error) {
            console.log("e", error)
            throw error;
        } finally {
            connection.release();

        }


    },
    calcularTotalKardex(listaKardex = [], numeroDiasPorSemana, fechaActual) {
        const total = { saldoInicial: null, cantidadConfirmada: null, fecha: null, dia: null, nroGuia: null, salidaL9: null, salidaL7: null, salidaL4: null, salidaL1: null, salidaFinal: null }
        const listaKardexCalculoTotal = listaKardex.slice(listaKardex.findIndex(k => (k.fecha != "Saldo Anterior" || k.fecha != "Total") && (moment(k.fecha).format("YYYY-MM-DD") == moment(fechaActual).subtract(numeroDiasPorSemana, "days").format("YYYY-MM-DD"))))
        console.log("kardex", listaKardex, "fehca", moment(fechaActual).subtract(numeroDiasPorSemana, "days").format("YYYY-MM-DD"))
/*         const listaKardexCalculoTotal = listaKardex.slice(listaKardex.findIndex(k => (moment(k.fecha).format("YYYY-MM-DD") == moment(fechaActual).subtract(numeroDiasPorSemana, "day").format("YYYY-MM-DD"))))
 */        console.log("listaKardexCalculoTotal", listaKardexCalculoTotal)
        const calculoTotales = listaKardexCalculoTotal.reduce((prev, curr) => {
            prev.cantidadConfirmada += curr.cantidadConfirmada
            prev.salidaL9 += curr.salidaL9
            prev.salidaL7 += curr.salidaL7
            prev.salidaL4 += curr.salidaL4
            prev.salidaL1 += curr.salidaL1
            prev.totalSalida += curr.totalSalida
            prev.saldoFinal += curr.saldoFinal
            return prev;
        }, { cantidadConfirmada: 0, salidaL9: 0, salidaL7: 0, salidaL4: 0, salidaL1: 0, totalSalida: 0, saldoFinal: 0 })
        listaKardex.push({ ...total, fecha: "Total", salidaL9: Number(calculoTotales.salidaL9).toFixed(2) * 1, cantidadConfirmada: Number(calculoTotales.cantidadConfirmada).toFixed(2) * 1, salidaL7: Number(calculoTotales.salidaL7).toFixed(2) * 1, salidaL4: Number(calculoTotales.salidaL4).toFixed(2) * 1, salidaL1: Number(calculoTotales.salidaL1).toFixed(2) * 1, totalSalida: Number(calculoTotales.totalSalida).toFixed(2) * 1, saldoFinal: Number(calculoTotales.saldoFinal).toFixed(2) * 1 })
        return listaKardex;
    },
    listarKardexFiltrado: async function ({ periodo, tipo, lote, alimento,isLevante }) {
        const connection = await mysql.connection();
        try {
            let idObjeto = null
            if (tipo && lote) {
                idObjeto = isLevante ? lote.idLevante : lote.idProduccion
            }
            const listaKardex = await connection.query(
                `select kA.periodo,IF(kA.tipo='L','LEVANTE','PRODUCCION') as tipo,idObjeto,tA.nombreAlimento,tA.idAlimento,gra.* from prod_kardexalimento kA inner join tipo_alimento tA on tA.idAlimento=kA.idAlimento inner join granjas gra on gra.idGranja=kA.idGranja where kA.periodo=? and kA.tipo like '%${tipo && tipo || ''}%' and kA.idAlimento like '%${alimento && alimento.idAlimento || ''}%'  and kA.idObjeto like '%${idObjeto && idObjeto || ''}%' GROUP BY periodo,tipo,idObjeto,idAlimento;`, [periodo])
            for (let i = 0; i < listaKardex.length; i++) {
                const kardexActual = listaKardex[i]
                const loteLevante = (await connection.query("Select * from levantes where idLevante=? ORDER BY idLevante DESC", [kardexActual.idObjeto]))[0]
                const loteProduccion = (await connection.query("Select * from produccion where idProduccion=? ORDER BY idProduccion DESC", [kardexActual.idObjeto]))[0]
                if (kardexActual.tipo == "LEVANTE") {
                    kardexActual.lote = { idObjeto: loteLevante.idLevante, nombre: loteLevante.Nombre }
                }
                if (kardexActual.tipo == "PRODUCCION") {
                    kardexActual.lote = { idObjeto: loteProduccion.idProduccion, nombre: loteProduccion.Nombre }
                }
            }
            return listaKardex;
        } catch (error) {
            console.log("e", error)
            throw error;
        } finally {
            connection.release();
        }

    },
    listarKardex: async function () {
        const connection = await mysql.connection();
        try {
            const listaKardex = await connection.query(
                `select kA.periodo,IF(kA.tipo='L','LEVANTE','PRODUCCION') as tipo,idObjeto,tA.nombreAlimento,tA.idAlimento,gra.* from prod_kardexalimento kA inner join tipo_alimento tA on tA.idAlimento=kA.idAlimento inner join granjas gra on gra.idGranja=kA.idGranja  GROUP BY periodo,tipo,idObjeto,idAlimento;`)
            for (let i = 0; i < listaKardex.length; i++) {
                const kardexActual = listaKardex[i]
                const loteLevante = (await connection.query("Select * from levantes where idLevante=? ORDER BY idLevante DESC", [kardexActual.idObjeto]))[0]
                const loteProduccion = (await connection.query("Select * from produccion where idProduccion=? ORDER BY idProduccion DESC", [kardexActual.idObjeto]))[0]
                if (kardexActual.tipo == "LEVANTE") {
                    kardexActual.lote = { idObjeto: loteLevante.idLevante, nombre: loteLevante.Nombre }
                }
                if (kardexActual.tipo == "PRODUCCION") {
                    kardexActual.lote = { idObjeto: loteProduccion.idProduccion, nombre: loteProduccion.Nombre }
                }
            }
            return listaKardex;
        } catch (error) {
            console.log("e", error)
            throw error;
        } finally {
            connection.release();
        }

    },
    generarKardexAlimentoServicio: async function () {
        const connection = await mysql.connection();
        try {
            const periodos = await periodoKardex.getPeriodosEstado1()
            const tipos = ["AL", "AP"]
            const tipoAlimentos = await connection.query("select  nombreAlimento,idAlimento,Tipo from tipo_alimento where estado=1")
            const listaProduccion = await connection.query("Select * from produccion ORDER BY idProduccion DESC")
            const listaLevante = await connection.query("Select * from levantes ORDER BY idLevante DESC")
            //console.log(tipoAlimentos)
            let listaLoteSeleccionada = listaProduccion
            for (let m = 0; m < periodos.length; m++) {
                const periodo = periodos[m].YearMonth
                for (let i = 0; i < tipos.length; i++) {
                    const tipo = tipos[i]
                    const listaAlimentoFiltradoPorTipo = tipoAlimentos.filter(tipoA => tipo.includes(tipoA.Tipo))
                    if (tipo.includes("L")) {
                        listaLoteSeleccionada = listaLevante
                    }
                    for (let j = 0; j < listaLoteSeleccionada.length; j++) {
                        const lote = listaLoteSeleccionada[i]
                        const idObjeto = tipo.includes("L") ? "idLevante" : "idProduccion"
                        const granja = await loteModel.getGranjaPorProduccionOLevante1(lote[idObjeto], tipo.includes("L") ? "Levante" : "Produccion")
                        // console.log("l",listaAlimentoFiltradoPorTipo)
                        for (let k = 0; k < listaAlimentoFiltradoPorTipo.length; k++) {
                            const alimento = listaAlimentoFiltradoPorTipo[k]

                            await this.generarKardexAlimento({ periodo, tipo: tipo.replace("A", ""), lote, user: null, alimento, granja })
                        }

                    }
                }
            }

        } catch (error) {
            console.log("e", error)
            throw error;
        } finally {
            connection.release();

        }

    },

    getAlimentoSemana: async function (id, type) {
        let table = '';
        let filter = '';
        if (type) {

            if (type == 'real') {
                table = 'alimento_levante_sem';
            } else {
                filter = 'and  als.CantRealAlimentoDescartes>0';
                table = 'alimento_levante_sem_descarte';
            }
        } else {
            table = 'alimento_levante_sem_descarte';
        }
        let rows = []
        let sql = `SELECT als.CantRealAlimento, alsd.STD, als.Semana, als.idLote, li.CodLinea,
        als.CantRealAlimentoDescartes FROM ${table} als
        INNER JOIN lotes lo ON lo.idLote = als.idLote
        INNER JOIN lineas li ON li.idLinea = lo.idLinea
            
            left join alimento_levante_sem as alsd on (
                alsd.idLevante=als.idLevante and alsd.idLote=als.idLote
                and alsd.Semana=als.Semana
            )
        WHERE als.idLote = ? ${filter}
        GROUP BY als.Semana, als.CantRealAlimento, alsd.STD, als.idLote, li.CodLinea
        ORDER BY als.Semana ASC`;


        rows = await db.query(sql, [id]);

        if (rows.length > 0) {
            let ultimo = rows[rows.length - 1];
            let sql_det = `SELECT COUNT(DISTINCT(Edad)) as cant_days
            FROM alimento_levante_det ald
            WHERE ald.idLote = ? and ald.Semana = ?
            GROUP BY ald.Semana`;
            let cantidad_days = await db.query(sql_det, [id, ultimo.Semana]);

            if (cantidad_days.length > 0 && cantidad_days[0].cant_days < 7) {
                console.log('cantidad_days[0].cant_days :>> ', cantidad_days[0].cant_days);
                rows.pop();
            }
        }
        return rows;
    },
    getStandard: function (params, callback) { // NO cumple la funcion exacta ...
        db.query('SELECT CONCAT(sexo,"_",SUBSTRING(lote,LOCATE("-",lote) + 1)) as name, idLote FROM lotes WHERE idLote = ?', [params.idLote], (err, count) => {
            let name = "GramoAve" + count[0].name
            //let id = count[0].idLote
            console.log('name', name)
            console.log('count', count)
            console.log('count.name', count['name'])
            return db.query('SELECT Semana, ' + name + ' as nombre FROM standard_levante WHERE Semana Between 1 and ?', [params.semana], callback);
        });
    },
    getStandardGramo: function (params, callback) {
        let campo = 'hola';
        if (params.idLinea == 1) {
            campo = "GramoAveM_L1";
        } else if (params.idLinea == 4) {
            campo = "GramoAveH_L4";
        } else if (params.idLinea == 7) {
            campo = "GramoAveM_L7";
        } else if (params.idLinea == 9) {
            campo = "GramoAveH_L9";
        } else {
            console.log("error - " + params.idLinea)
        }
        return db.query('SELECT Semana, ' + campo + ' as valor_standard FROM standard_levante WHERE Semana Between 1 and ?', [params.semana], callback);
    },

    getStandardPeso: function (params, callback) {
        let campo = 'hola';
        if (params.idLinea == 1) {
            campo = "PesoM_L1";
        } else if (params.idLinea == 4) {
            campo = "PesoH_L4";
        } else if (params.idLinea == 7) {
            campo = "PesoM_L7";
        } else if (params.idLinea == 9) {
            campo = "PesoH_L9";
        } else {
            console.log("error - " + params.idLinea)
        }
        return db.query('SELECT Semana, ' + campo + ' as valor_standard FROM standard_levante WHERE Semana Between 1 and ?', [params.semana], callback);
    },

    addAlimento: function (Granja, callback) {
        //console.log(Granja.id);
        return db.query("INSERT INTO tipo_alimento (nombreAlimento, estado, codAlimento, Tipo) values(?,?,?,?)", [Granja.Granja, Granja.Estado, Granja.CodAlimento, Granja.Tipo], callback);
    },
    deleteAlimentos: function (id, callback) {
        return db.query("delete from tipo_alimento where idAlimento=?", [id], callback);
    },
    updateAlimento: function (id, Granja, callback) {
        return db.query("UPDATE tipo_alimento set codAlimento=?, nombreAlimento=?, estado=?, Tipo=? WHERE idAlimento=?", [Granja.codAlimento, Granja.nombreAlimento, Granja.estado, Granja.Tipo, id], callback);
    },
    deleteAll: function (item, callback) {

        var delarr = [];
        for (i = 0; i < item.length; i++) {

            delarr[i] = item[i].Id;
        }
        return db.query("delete from geproductos where IDPRODUCTO in (?)", [delarr], callback);
    },
    getUnidades: function (callback) {

        return db.query("Select * from geunidad", callback);

    },
    getAlimentos: async function (Hoja) {
        function nombreMes(param) {
            if (param == '01') {
                return 'Enero';
            } else if (param == '02') {
                return 'Febrero';
            } else if (param == '03') {
                return 'Marzo';
            } else if (param == '04') {
                return 'Abril';
            } else if (param == '05') {
                return 'Mayo';
            } else if (param == '06') {
                return 'Junio';
            } else if (param == '07') {
                return 'Julio';
            } else if (param == '08') {
                return 'Agosto';
            } else if (param == '09') {
                return 'Setiembre';
            } else if (param == '10') {
                return 'Octubre';
            } else if (param == '11') {
                return 'Noviembre';
            } else if (param == '12') {
                return 'Diciembre';
            }
        }

        function YearMonth(param) {
            let m = param.substr(4, 5);
            let y = param.substr(0, 4);

            return nombreMes(m) + " " + y;
        }

        function formatDate(params) {
            if (typeof params == "undefined") {
                var hoy = new Date();
            } else {
                var hoy = new Date(params);
            }
            var dd = hoy.getDate();
            var mm = hoy.getMonth() + 1;
            var yyyy = hoy.getFullYear();

            if (dd < 10) {
                dd = '0' + dd;
            }

            if (mm < 10) {
                mm = '0' + mm;
            }
            hoy = dd + '/' + mm + '/' + yyyy;
            return hoy;
        }

        function formatDateGuion(params) {
            if (typeof params == "undefined") {
                var hoy = new Date();
            } else {
                var hoy = new Date(params);
            }
            var dd = hoy.getDate();
            var mm = hoy.getMonth() + 1;
            var yyyy = hoy.getFullYear();

            if (dd < 10) {
                dd = '0' + dd;
            }

            if (mm < 10) {
                mm = '0' + mm;
            }
            hoy = yyyy + '-' + mm + '-' + dd;
            return hoy;
        }


        let lotes_str = await db.query(`SELECT * FROM (
                    SELECT CONCAT(GROUP_CONCAT(DISTINCT lo.lote_str ORDER BY lo.lote_str ASC SEPARATOR '-' ), '(PROD)') AS lote_str,
                    1 sortby, lo.idLevante
                    FROM alimento_prod_det apd 
                    INNER JOIN lotes lo ON lo.idLote = apd.idLote 
                    WHERE apd.Fecha BETWEEN '${Hoja.FechaInicio}' and '${Hoja.FechaFin}'
                    GROUP BY lo.idLevante 
                    UNION ALL 
                    SELECT CONCAT(GROUP_CONCAT(DISTINCT lo.lote_str ORDER BY lo.lote_str ASC SEPARATOR '-' ), '(LEV)') AS lote_str,
                    2 sortby, lo.idLevante
                    FROM alimento_levante_det ald 
                    INNER JOIN lotes lo ON lo.idLote = ald.idLote 
                    WHERE ald.Fecha BETWEEN '${Hoja.FechaInicio}' and '${Hoja.FechaFin}'
                    GROUP BY lo.idLevante
                    ) w 
                    GROUP BY w.lote_str, w.sortby, w.idLevante
                    ORDER BY w.sortby, w.lote_str`)

        let alimentos = await db.query(`SELECT idAlimento, AR_CDESCRI FROM (
                    SELECT ta.idAlimento, ta.nombreAlimento as AR_CDESCRI FROM alimento_levante_det ald
                    INNER JOIN tipo_alimento ta ON ta.idAlimento = ald.idAlimento
                    WHERE ald.Fecha BETWEEN '${Hoja.FechaInicio}' and '${Hoja.FechaFin}'
                    UNION ALL
                    SELECT ta.idAlimento, ta.nombreAlimento as AR_CDESCRI FROM alimento_prod_det apd
                    INNER JOIN tipo_alimento ta ON ta.idAlimento = apd.idAlimento
                    WHERE apd.Fecha BETWEEN '${Hoja.FechaInicio}' and '${Hoja.FechaFin}') w
                    GROUP BY idAlimento, AR_CDESCRI
                    ORDER BY AR_CDESCRI`)

        let rows2 = [];
        for (let j = 0; j < lotes_str.length; j++) {
            const l = lotes_str[j].lote_str;
            let div = l.split('-');
            let div2 = div[1].split('(');
            let lh = div[0];
            let lotes_lh = await db.query(`SELECT lo.idLote, li.CodLinea
            FROM lotes lo
            INNER JOIN lineas li ON li.idLinea = lo.idLinea
            WHERE lo.lote_str = '${lh}'
            ORDER BY li.CodLinea DESC`);
            let lm = div2[0];
            let lotes_lm = await db.query(`SELECT lo.idLote, li.CodLinea
            FROM lotes lo
            INNER JOIN lineas li ON li.idLinea = lo.idLinea
            WHERE lo.lote_str = '${lm}'
            ORDER BY li.CodLinea DESC`);
            let lop = div2[1].substr(0, 1);
            let consultal9
            let consultal7
            let consultal4
            let consultal1
            let numeros = [];
            for (let i = 0; i < alimentos.length; i++) {
                const e = alimentos[i];
                if (lop == 'P') {
                    consultal9 = await db.query(`SELECT IFNULL(SUM(CantAlimento),0) as CantAlimento
                            FROM alimento_prod_det ald 
                            WHERE ald.Fecha BETWEEN '${Hoja.FechaInicio}' and '${Hoja.FechaFin}'
                            and ald.idLote = '${lotes_lh[0].idLote}'
                            and ald.idAlimento = ${e.idAlimento}
                            GROUP BY ald.idLote`)
                } else {
                    consultal9 = await db.query(`SELECT SUM(CantAlimento) AS CantAlimento
                            FROM alimento_levante_det ald
                            WHERE ald.Fecha BETWEEN '${Hoja.FechaInicio}' AND '${Hoja.FechaFin}'
                            and ald.idLote = '${lotes_lh[0].idLote}'
                            and ald.idAlimento = ${e.idAlimento}
                            GROUP BY ald.idLote`)
                }
                if (consultal9.length != 0) {
                    numeros.push(consultal9[0].CantAlimento)
                } else {
                    numeros.push(0)
                }
            }
            for (let i = 0; i < alimentos.length; i++) {
                const e = alimentos[i];
                if (lop == 'P') {
                    consultal7 = await db.query(`SELECT IFNULL(SUM(CantAlimento),0) as CantAlimento
                            FROM alimento_prod_det ald 
                            WHERE ald.Fecha BETWEEN '${Hoja.FechaInicio}' and '${Hoja.FechaFin}'
                            and ald.idLote = '${lotes_lh[1].idLote}'
                            and ald.idAlimento = ${e.idAlimento}
                            GROUP BY ald.idLote`)
                } else {
                    consultal7 = await db.query(`SELECT IFNULL(SUM(CantAlimento),0) as CantAlimento
                            FROM alimento_levante_det ald
                            WHERE ald.Fecha BETWEEN '${Hoja.FechaInicio}' and '${Hoja.FechaFin}'
                            and ald.idLote = '${lotes_lh[1].idLote}'
                            and ald.idAlimento = ${e.idAlimento}
                            GROUP BY ald.idLote`)
                }
                if (consultal7.length != 0) {
                    numeros.push(consultal7[0].CantAlimento)
                } else {
                    numeros.push(0)
                }
            }
            for (let i = 0; i < alimentos.length; i++) {
                const e = alimentos[i];
                if (lop == 'P') {
                    consultal4 = await db.query(`SELECT IFNULL(SUM(CantAlimento),0) as CantAlimento
                            FROM alimento_prod_det ald 
                            WHERE ald.Fecha BETWEEN '${Hoja.FechaInicio}' and '${Hoja.FechaFin}'
                            and ald.idLote = '${lotes_lm[0].idLote}'
                            and ald.idAlimento = ${e.idAlimento}
                            GROUP BY ald.idLote`)
                } else {
                    consultal4 = await db.query(`SELECT IFNULL(SUM(CantAlimento),0) as CantAlimento
                            FROM alimento_levante_det ald
                            WHERE ald.Fecha BETWEEN '${Hoja.FechaInicio}' and '${Hoja.FechaFin}'
                            and ald.idLote = '${lotes_lm[0].idLote}'
                            and ald.idAlimento = ${e.idAlimento}
                            GROUP BY ald.idLote`)
                }
                if (consultal4.length != 0) {
                    numeros.push(consultal4[0].CantAlimento)
                } else {
                    numeros.push(0)
                }
            }
            for (let i = 0; i < alimentos.length; i++) {
                const e = alimentos[i];
                if (lop == 'P') {
                    consultal1 = await db.query(`SELECT IFNULL(SUM(CantAlimento),0) as CantAlimento
                            FROM alimento_prod_det ald 
                            WHERE ald.Fecha BETWEEN '${Hoja.FechaInicio}' and '${Hoja.FechaFin}'
                            and ald.idLote = '${lotes_lm[1].idLote}'
                            and ald.idAlimento = ${e.idAlimento}
                            GROUP BY ald.idLote`)
                } else {
                    consultal1 = await db.query(`SELECT IFNULL(SUM(CantAlimento),0)  as CantAlimento
                            FROM alimento_levante_det ald
                            WHERE ald.Fecha BETWEEN '${Hoja.FechaInicio}' AND '${Hoja.FechaFin}'
                            AND ald.idLote = '${lotes_lm[1].idLote}'
                            AND ald.idAlimento = ${e.idAlimento}
                            `)
                }
                if (consultal1.length != 0) {
                    numeros.push(consultal1[0].CantAlimento)
                } else {
                    numeros.push(0)
                }
            }
            rows2.push({
                tipo: l,
                numeros,
                class: ''
            })
        }



        let tablaCARTILLA = {
            AR_CDESCRI: alimentos,
            lotes: lotes_str,
            rows: rows2
        }

        if (alimentos.length == 0) {
            return {
                success: false,
                message: "No existen registros con el rango de fechas especificado"
            }
        }

        return {
            success: true,
            tablaCARTILLA,
            length: alimentos.length
        }

    },
    cronDiario: async function () {
        var periodos = await db.query("SELECT * FROM periodo_f33 WHERE Estado = 1");
        var arr_periodos = periodos.map(periodo => periodo.YearMonth);
        var periodos_ini = await db.query("SELECT MIN(FechaInicio) as fecha FROM periodo_f33 WHERE Estado = 1");
        periodos_ini = moment(periodos_ini[0].fecha).format("YYYY-MM-DD");
        var periodos_fin = await db.query("SELECT MAX(FechaFin) as fecha FROM periodo_f33 WHERE Estado = 1");
        periodos_fin = moment(periodos_fin[0].fecha).format("YYYY-MM-DD");
        var lotes_levante = await db.query("select * from lotes where idLevante in (select distinct idLevante from mortalidad_det where fecha>=? and fecha<=? )", [periodos_ini, periodos_fin]);
        var arr_levante = lotes_levante.map(lote_levante => lote_levante.idLevante).join(',');
        var lotes_produccion = await db.query("select * from lotes where idProduccion in (select distinct idProduccion from mortalidad_prod_det where fecha>=? and fecha<=? )", [periodos_ini, periodos_fin]);
        var arr_produccion = lotes_produccion.map(lote_produccion => lote_produccion.idProduccion).join(',');
        var log = await db.query("insert into reporte_mortalidad_diaria (fecha,fechahora) values (current_date(),current_timestamp())");
        log = await db.query("SELECT * FROM reporte_mortalidad_diaria WHERE id = ?", [log.insertId]);
        var lotes = lotes_levante.concat(lotes_produccion);
        lotes = lotes.filter((item, pos) => lotes.indexOf(item) === pos);
        var mortalidad_det_levante = await db.query(`
        SELECT fecha,ms.idMortalidadDet,lo.lote_str NombreLote,lo.idLote as idLote,lo.lote Lote,
        ms.idLevante,ms.Semana,SUBSTR(REPLACE(fecha,'-',''), 1, 6) as Periodo,0 as rowspan,
        #MIN(fecha) as MinimaFecha,
        #MAX(fecha) as MaximaFecha,
        DAY(ms.fecha) as RangoFecha,0 AS NroAvesInicioLH,ms.NoAves AS MortalidadLH,
        ms.NoEliminados as DescartesLH,ms.ErSex + ms.SelGen as VentasLH,0 as IngresosLH,
        0 as NroAvesFinalLH,0 AS NroAvesInicioLM,ms.NoAves AS MortalidadLM,ms.NoEliminados as DescartesLM,
        ms.ErSex + ms.SelGen as VentasLM,0 as IngresosLM,0 as NroAvesFinalLM
        FROM mortalidad_det ms
        INNER JOIN lotes lo ON lo.idLote = ms.idLote WHERE ms.idLevante IN (?)
        #AND SUBSTR(REPLACE(fecha,'-',''), 1, 6) = ?
        ORDER BY ms.fecha;`, [arr_levante]);
        var mortalidad_det_produccion = await db.query(`
        SELECT ms.idMortalidadDet,fecha,lo.idLote as idLote,lo.lote Lote,lo.lote_str as NombreLote,
        ms.idProduccion,ms.Semana,SUBSTR(REPLACE(fecha,'-',''), 1, 6) as Periodo,
        0 as rowspan,DAY(ms.fecha) as RangoFecha,
        #MIN(fecha) as MinimaFecha,
        #MAX(fecha) as MaximaFecha,
        0 AS NroAvesInicioLH,ms.NoAves AS MortalidadLH,ms.NoEliminados as DescartesLH,0 as VentasLH,
        0 as IngresosLH,0 as NroAvesFinalLH,0 AS NroAvesInicioLM,ms.NoAves AS MortalidadLM,
        ms.NoEliminados as DescartesLM,0 as VentasLM,0 as IngresosLM,0 as NroAvesFinalLM
        FROM mortalidad_prod_det ms
        INNER JOIN lotes lo ON lo.idLote = ms.idLote WHERE ms.idProduccion IN (?)
        #AND SUBSTR(REPLACE(fecha,'-',''), 1, 6) = ?
        ORDER BY ms.fecha`, [arr_produccion]);

        mortalidad_det_levante = mortalidad_det_levante.filter((mortalidad_det) => arr_periodos.includes(mortalidad_det.Periodo));
        //var arr_mortalidad_det_levante = mortalidad_det_levante.map(mortalidad_det => mortalidad_det.idMortalidadDet);
        mortalidad_det_produccion = mortalidad_det_produccion.filter((mortalidad_det) => arr_periodos.includes(mortalidad_det.Periodo));
        //var arr_mortalidad_det_produccion = mortalidad_det_produccion.map(mortalidad_det => mortalidad_det.idMortalidadDet);

        for (let index = 0; index < mortalidad_det_levante.length; index++) {
            const element = mortalidad_det_levante[index];
            let {
                idMortalidadDet, fecha, NombreLote, idLote, Lote, idLevante, Semana, Periodo, rowspan, RangoFecha,
                NroAvesInicioLH, MortalidadLH, DescartesLH, VentasLH, IngresosLH, NroAvesFinalLH, NroAvesInicioLM,
                MortalidadLM, DescartesLM, VentasLM, IngresosLM, NroAvesFinalLM, NroAvesInicio, NroAvesFinal, show,
                active
            } = element;
            let idGranja = lotes.find(element => element.idLote == idLote).idGranja;
            let lote = lotes.find(element => element.idLote == idLote);
            let lote_index = lotes.indexOf(lote);
            NroAvesInicio = lotes[lote_index].NumHembras;
            lotes[lote_index].NumHembras = lotes[lote_index].NumHembras - element.MortalidadLM - element.DescartesLM - element.VentasLM + element.IngresosLM;
            NroAvesFinal = lotes[lote_index].NumHembras;
            let user = 0;
            let tipo = 'L';

            let _fecha = new moment(fecha).format('YYYY-MM-DD');
            console.log('granja', [
                Periodo, _fecha, idLote,//idgranja,
                Semana,
                // tipo null, 
                idMortalidadDet,
                //id lote
                //saldo incial
                IngresosLM, MortalidadLM, DescartesLM, VentasLM, //fin de campaña
                user, tipo, NroAvesInicio, NroAvesFinal, idGranja
            ]);
            db.query(`CALL SP_INSERT_MORTALIDAD_DET (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
                Periodo, _fecha, idLote,//idgranja,
                Semana,
                // tipo null, 
                idMortalidadDet,
                //id lote
                //saldo incial
                IngresosLM, MortalidadLM, DescartesLM, VentasLM, //fin de campaña
                user, tipo, NroAvesInicio, NroAvesFinal, idGranja
            ]);
        }

        for (let index_ = 0; index_ < mortalidad_det_produccion.length; index_++) {
            const element_ = mortalidad_det_produccion[index_];
            let {
                idMortalidadDet, fecha, NombreLote, idLote, Lote, idLevante, Semana, Periodo, rowspan, RangoFecha,
                NroAvesInicioLH, MortalidadLH, DescartesLH, VentasLH, IngresosLH, NroAvesFinalLH, NroAvesInicioLM,
                MortalidadLM, DescartesLM, VentasLM, IngresosLM, NroAvesFinalLM, NroAvesInicio, NroAvesFinal, show,
                active
            } = element_;
            let idGranja = lotes_produccion.find(element => element.idLote == idLote).idGranjaP;
            let user = 0;
            let tipo = 'P';
            let lote = lotes.find(element => element.idLote == idLote);
            let lote_index = lotes.indexOf(lote);
            NroAvesInicio = lotes[lote_index].NumHembras;
            lotes[lote_index].NumHembras = lotes[lote_index].NumHembras - element_.MortalidadLM - element_.DescartesLM - element_.VentasLM + element_.IngresosLM;
            NroAvesFinal = lotes[lote_index].NumHembras;
            let _fecha = new moment(fecha).format('YYYY-MM-DD');
            console.log('granja', [
                Periodo, _fecha, idLote,//idgranja,
                Semana,
                // tipo null, 
                idMortalidadDet,
                //id lote
                //saldo incial
                IngresosLM, MortalidadLM, DescartesLM, VentasLM, //fin de campaña
                user, tipo, NroAvesInicio, NroAvesFinal, idGranja
            ]);
            db.query(`CALL SP_INSERT_MORTALIDAD_DET (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
                Periodo, _fecha, idLote,//idgranja,
                Semana,
                // tipo null, 
                idMortalidadDet,
                //id lote
                //saldo incial
                IngresosLM, MortalidadLM, DescartesLM, VentasLM, //fin de campaña
                user, tipo, NroAvesInicio, NroAvesFinal, idGranja
            ]);
        }

        return {
            periodos_ini: periodos_ini,
            periodos_fin: periodos_fin,
            levantes: lotes_levante,
            producciones: lotes_produccion,
            mortalidad_det_levante: mortalidad_det_levante,
            mortalidad_det_produccion: mortalidad_det_produccion,
            log: log,
            lotes: lotes
        }
    },
    exportexcel: async function (data, cabecera) {
        const rutaTemplateConsultaDetalle = "./template/nuevo_kardex_alimentos.xlsx";
        try {

            if (fs.existsSync(`.${rutaTemplateConsultaDetalle}`)) {
                fs.unlinkSync(`.${rutaTemplateConsultaDetalle}`);
            }
            const wor = await workbook.xlsx.readFile("./template/Plantilla F33_V1.xlsx")
            const sheet = wor.worksheets[0];
            const borderStyles = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            const fondoCantidadIngreso = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '9CC2E5' }
            }
            const fondoLotes = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '81458B' }
            }
            const fondoConsumoTotal = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF0000' }
            }
            const fondoSaldo = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '00B050' }
            }
            const fondoTotal = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFF00' }
            }

            sheet.getCell("F7").value = cabecera.Granja
            sheet.getCell("C8").value = cabecera.nombreAlimento
            sheet.getCell("C7").value = cabecera.lote.nombre
            sheet.getCell("F8").value = cabecera.tipo


            sheet.getCell("J8").value = `MES DE ${moment(cabecera.periodo, "YYYYMM").format("MMMM").toUpperCase()}`
            for (let index = 0; index < data.length; index++) {
                const element = data[index];
                sheet.getCell(`B${index + 12}`).value = element.fecha;
                sheet.getCell(`B${index + 12}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`B${index + 12}`).border = borderStyles;

                sheet.getCell(`C${index + 12}`).value = element.dia;
                sheet.getCell(`C${index + 12}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`C${index + 12}`).border = borderStyles;

                sheet.getCell(`D${index + 12}`).value = element.nroGuia;
                sheet.getCell(`D${index + 12}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`D${index + 12}`).border = borderStyles;

                sheet.getCell(`E${index + 12}`).value = element.cantidadConfirmada;
                sheet.getCell(`E${index + 12}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`E${index + 12}`).fill = fondoCantidadIngreso;
                sheet.getCell(`E${index + 12}`).border = borderStyles;

                sheet.getCell(`F${index + 12}`).value = element.salidaL9;
                sheet.getCell(`F${index + 12}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`F${index + 12}`).fill = fondoLotes;
                sheet.getCell(`F${index + 12}`).border = borderStyles;

                sheet.getCell(`G${index + 12}`).value = element.salidaL7;
                sheet.getCell(`G${index + 12}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`G${index + 12}`).fill = fondoLotes;
                sheet.getCell(`G${index + 12}`).border = borderStyles;

                sheet.getCell(`H${index + 12}`).value = element.salidaL4;
                sheet.getCell(`H${index + 12}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`H${index + 12}`).fill = fondoLotes;
                sheet.getCell(`H${index + 12}`).border = borderStyles;

                sheet.getCell(`I${index + 12}`).value = element.salidaL1;
                sheet.getCell(`I${index + 12}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`I${index + 12}`).fill = fondoLotes;
                sheet.getCell(`I${index + 12}`).border = borderStyles;

                sheet.getCell(`J${index + 12}`).value = element.totalSalida;
                sheet.getCell(`J${index + 12}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`J${index + 12}`).fill = fondoConsumoTotal;
                sheet.getCell(`J${index + 12}`).border = borderStyles;

                sheet.getCell(`K${index + 12}`).value = element.saldoFinal;
                sheet.getCell(`K${index + 12}`).alignment = { vertical: "middle", horizontal: "center" };
                sheet.getCell(`K${index + 12}`).fill = fondoSaldo;
                sheet.getCell(`K${index + 12}`).border = borderStyles;
                if (element.fecha == "Total") {
                    sheet.getCell(`B${index + 12}`).fill = fondoTotal;
                    sheet.getCell(`C${index + 12}`).fill = fondoTotal;
                    sheet.getCell(`D${index + 12}`).fill = fondoTotal;
                    sheet.getCell(`E${index + 12}`).fill = fondoTotal;
                    sheet.getCell(`F${index + 12}`).fill = fondoTotal;
                    sheet.getCell(`G${index + 12}`).fill = fondoTotal;
                    sheet.getCell(`H${index + 12}`).fill = fondoTotal;
                    sheet.getCell(`I${index + 12}`).fill = fondoTotal;
                    sheet.getCell(`J${index + 12}`).fill = fondoTotal;
                }
            }
            await workbook.xlsx.writeFile(`${rutaTemplateConsultaDetalle}`)

            json = {
                success: true,
                message: "Exportación realizada correctamente.",
                path: "/template/nuevo_kardex_alimentos.xlsx"
            }

        } catch (error) {
            console.log(error);

            json = {
                success: false,
                message: "Error en el servidor => /Cartilla/ExportExcel",
                rutaCM: rutaTemplateConsultaDetalle
            }
        }
        return json;
    }
};
module.exports = Alimentos;