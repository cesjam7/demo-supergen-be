var db = require('../dbconnection');
var { poolPromise } = require('../dbconnectionMSSQL')
const { json } = require('body-parser');
const mysql = require("../dbconnectionPromise");
const moment = require('moment');
const cotizacionModel = require("./cotizacion")
var Produccion = {
    /*
    */

    getProduccionCotable: async function () {
        //console.log('asdasd');
        //return "asdasd";
        let json = {}
        try {
            const pool = await poolPromise
            const result = await pool.request()
                .query("select TCLAVE,TDESCRI from RSCONCAR.dbo.CT0003TAGP where tcod='05' AND TDESCRI LIKE 'LH%' ORDER BY TCLAVE DESC")
            json = {
                success: true,
                message: "Extracción de clientes realizada satisfactoriamente.",
                rows: result.recordset
            }
        } catch (error) {
            json = {
                success: false,
                message: "Error en la ruta clientes/getTrabajadores",
                error: error.code,
                rows: []
            }
        }
        return json
    },
    listarHuevosIncubables: async function () {
        //console.log('asdasd');
        //return "asdasd";
        try {
            const pool = await poolPromise
            const { recordset } = await pool.request()
                .query("select * from V_FiltraCodHuevos")
            return recordset
        } catch (error) {
            throw error
        }
    },


    getAllProduccion: function (callback) {
        console.log("enteo al all produccion")
        return db.query("Select * from produccion where seleccionadoReporte=1 ORDER BY idProduccion DESC", callback);
    },
    getProduccionById: async function (id) {
        return await db.query("select * from produccion where idProduccion = ? ORDER BY idProduccion DESC ", [id]);
    },
    getUltimaProduccion: function (callback) {
        return db.query("select idProduccion, idLevante from produccion ORDER BY idProduccion DESC Limit 0,1", callback);
    },
    getLotesProduccion: async function () {
        let rows = await db.query("Select idLevante, GROUP_CONCAT(lote) as Nombre from lotes where Estado = 1 AND idLevante != 0 and idProduccion = 0 GROUP BY idLevante");
        let lotes = [];
        for (let i = 0; i < rows.length; i++) {
            const e = rows[i];
            let r = await db.query("SELECT MAX(Semana) as Semana_max FROM mortalidadsem WHERE idLevante = ?", [e.idLevante]);
            if (r[0].Semana_max != null) {
                lotes.push(e);
            }
        }
        return lotes;
    },
    listarLotesAgrupadosPorProduccion: async function () {
        try {
            const lotesConProduccion = await db.query(`select idLote,lote,lote_str,estado,pr.idProduccion,pr.Nombre from lotes lo  inner join produccion pr on lo.idProduccion=pr.idProduccion 
            where pr.idProduccion<>0`)
            const lotesAgrupadosPorProduccion = []
            for (let i = 0; i < lotesConProduccion.length; i++) {
                const loteProduccionActual = lotesConProduccion[i]
                const lotes = lotesConProduccion.filter(lotesConProduccion => lotesConProduccion.idProduccion == loteProduccionActual.idProduccion).map(lote => ({ idLote: lote.idLote, loteStr: lote.lote_str, cerrado: lote.estado == 0 }))
                lotesAgrupadosPorProduccion.push({ idProduccion: loteProduccionActual.idProduccion, nombre: loteProduccionActual.Nombre, lotes })
                i = lotesConProduccion.map(l => l.idProduccion).lastIndexOf(loteProduccionActual.idProduccion)
            }

            return lotesAgrupadosPorProduccion
        } catch (error) {

        }
    },
    actualizarEstadoLotes: async function (lote, idUsuario) {
        try {
            await db.query("update lotes set Estado=?,usuarioCierre=?,fechaCierre=? where idLote=?", [lote.cerrado ? 0 : 1, idUsuario, new Date(), lote.idLote])
        } catch (error) {
            throw error
        }

    },
    getAllLotesProduccion: async function () {
        return await db.query("Select idLevante, GROUP_CONCAT(lote ORDER BY TipoGenero) as Nombre from lotes GROUP BY idLevante");
    },
    listarProduccionHuevosPorIdProduccionYFecha: async function ({ fecha }) {
        const connection = await mysql.connection();
        const fechaFormat = moment(fecha).format("DD-MM-YYYY")
        const fechaMoment = moment(fecha)
        const produccion = { nroMovimientoHi: null, nroMovimientoHc: null }
        try {

            const dataTransferenciaHuevos = await connection.query("select * from trans_prod_huevos  where fechaTransferencia=?", [fechaMoment.format("YYYY-MM-DD")])
            console.log("data", dataTransferenciaHuevos[0])
            if (dataTransferenciaHuevos.length > 0) {
                const { nroMovimientoHi, nroMovimientoHc } = dataTransferenciaHuevos[0]
                produccion.nroMovimientoHi = nroMovimientoHi;
                produccion.nroMovimientoHc = nroMovimientoHc
            }
            const dataHuevosIncubables = await connection.query(
                `
                select A.idProduccion,A.IdLote,B.lote,B.TipoGenero, A.Semana,A.fechaRegistro,A.TotalHI as TotalHuevo,
                case when B.TipoGenero='LH' then C.codigoHuevoIncubableLh else 
                case when B.TipoGenero='LM' then C.codigoHuevoIncubableLm end end Codigohuevo  ,C.ccosto,'HI' Tipo
                from produccion_huevos_det A left join lotes B on B.idLote=A.IdLote
                left join produccion C on C.idProduccion=A.idProduccion 
                where A.fechaRegistro=?`, [fechaFormat])
            const dataHuevosComerciales = await connection.query(
                `
                select A.idProduccion,null as lote,null as IdLote,null as TipoGenero, A.Semana,A.fechaRegistro,
                C.CodigohuevoComercial Codigohuevo  
                ,C.ccosto,'HC' Tipo,sum(A.TotalHNI_Comercial) TotalHuevo
                from produccion_huevos_det A left join lotes B on B.idLote=A.IdLote
                left join produccion C on C.idProduccion=A.idProduccion 
                where A.fechaRegistro=? 
                group by A.idProduccion, A.Semana,A.fechaRegistro, C.CodigohuevoComercial ,C.ccosto`, [fechaFormat])
            return { produccion, detalles: dataHuevosIncubables.concat(dataHuevosComerciales) }
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }

    },
    //TODO:FALTA QUERY DEL DETALLE
    transferenciaProduccionHuevos: async function ({ detalle = [], fechaSeleccionado }, idUsuario) {

        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");

            const detallesHi = detalle.filter(d => d.Tipo == "HI").filter(d => d.TotalHuevo > 0)
            const detallesHc = detalle.filter(d => d.Tipo == "HC").filter(d => d.TotalHuevo > 0)
            const { ccosto } = detalle[0]
            const pool = await poolPromise
            let nroMovimientoHc = ''
            let nroMovimientoHi = ''
            const fechaSeleccionadoMoment = moment(fechaSeleccionado)
            const tasaTipoCambio = await cotizacionModel.traerTipoCambioPorFecha(fechaSeleccionadoMoment.format("YYYY-MM-DD"))

            if (detallesHi.length > 0) {
                let index = 1;
                const { recordset } = await pool.request().query("select (A1_NNUMENT+1) correlativo from RSFACCAR.dbo.AL0003ALMA where A1_CALMA='0003'")
                nroMovimientoHi = recordset[0].correlativo
                console.log("mov", nroMovimientoHi, "re", recordset)
                const result = await pool.request()
                    .query(`exec [dbo].[SP_AL0003MOVC_Inserta] @C5_CALMA='0003',@C5_CTD='PE',@C5_CNUMDOC='${nroMovimientoHi.toString().padStart(11, "0")}',@C5_CLOCALI='0001',
            @C5_DFECDOC='${fechaSeleccionadoMoment.format('YYYY-MM-DD')}',@C5_CTIPMOV='E',@C5_CCODMOV='EP',@C5_CSITUA='V',@C5_CRFTDOC='OT',@C5_CRFNDOC='${fechaSeleccionadoMoment.format('DDMMYY')}',@C5_CSOLI='',@C5_CCENCOS='${ccosto}',
            @C5_CRFALMA='',@C5_CGLOSA1='',@C5_CGLOSA2='',@C5_CGLOSA3='',@C5_CTIPANE='',@C5_CCODANE='',@C5_CUSUCRE='GRA01',@C5_CUSUMOD='',@C5_CCODCLI='',@C5_CNOMCLI='',@C5_CRUC='',@C5_CCODCAD='',@C5_CCODINT='',@C5_CCODTRA='',@C5_CNOMTRA='',@C5_CCODVEH='',@C5_CTIPGUI='',
            @C5_CSITGUI='',@C5_CGUIFAC='',@C5_CDESTIN='',@C5_CDIRENV='',@C5_CNUMORD='',@C5_CTIPORD='',@C5_CGUIDEV='',@C5_CCODPRO='',@C5_CNOMPRO='',@C5_CCIAS='',@C5_CFORVEN='',@C5_CCODMON='MN',@C5_CVENDE='',@C5_NTIPCAM=${tasaTipoCambio},
            @C5_CCODAGE='',@C5_CNUMPED='',@C5_CDIRECC='',@C5_NIMPORT=0,@C5_CTIPO='V',@C5_CSUBDIA='',@C5_CCOMPRO='',@C5_NPORDE1=0,@C5_NPORDE2=0,@C5_CTF='',@C5_NFLETE=0,@C5_CCODAUT='',@C5_CRFTDO2='',@C5_CRFNDO2='',@C5_CNUMLIQ='',@C5_CORDEN='',@C5_CTIPOGS='',@C5_CCODFER='',@C5_CGLOSA4='',@C5_CVENDE2='',
            @C5_CESTDEV='',@C5_CEXTOR='',@C5_CRENOM='',@C5_CRERUC='',@C5_CREREF='',@C5_CDSNOM='',@C5_CDSRUC='',@C5_CLLECIU='',@C5_CPARCIU='',@C5_CTTRACT='',@C5_CTRASRE='',@C5_CTRAREM='',@C5_CLICCON='',@C5_CSBNOM='',@C5_CSBRUC='',@C5_CSBMTC='',@C5_CMONPER='',@C5_NIMPPER=0,@C5_CFPERCP='',@C5_CESTFIN='',
            @C5_CFLGPEN='',@C5_CTIPFOR='',@C5_NPORPER=0,@C5_CFLGTRM='',@C5_CAGETRA='',@C5_CCONTAI='',@C5_CDOCEST='',@C5_CSUNEST='',@C5_CPROEST='',@C5_DFECCDR=null,@C5_CCOMEST='',@C5_CFMANU='',@C5_CFIRMDIG='',@C5_CHFIRMDIG='',@C5_CTED='',@C5_CFREPRO='',@C5_CTIPDES='',@C5_CEMAIL='',@C5_CTE='',@C5_CCODTAL='',
            @C5_CCODMOD='',@C5_CUNIDAD='',@C5_NPESO=0,@C5_NCANTBULT=0,@C5_CCODMOT='',@C5_CDOCIDE='',@C5_CFCONTIG='',@C5_NREINDCL=0,@C5_NREINDCLB=0,@C5_CERRCOD='',@C5_CSOLEST='',@C5_CFBAJA='',@C5_CFNOVEDAD='',@C5_CHASHRS='',@C5_CTIPFAC='',@C5_COTRMOT=''  `)
                for (const detalleHi of detallesHi) {
                    const { recordset } = await pool.request().query(`SELECT RTRIM(AR_CDESCRI) DESCRIP FROM RSFACCAR.dbo.AL0003ARTI WHERE AR_CCODIGO='${detalleHi.Codigohuevo}' `)
                    console.log("resultset", recordset)
                    const descripcionHuevo = recordset[0].DESCRIP
                    await pool.request()
                        .query(`exec [dbo].[SP_AL0003MOVD_Inserta] @C6_CTD='PE',@C6_CNUMDOC='${nroMovimientoHi.toString().padStart(11, "0")}',@C6_CITEM='${index.toString().padStart(4, "0")}', @C6_CCODIGO='${detalleHi.Codigohuevo}',@C6_NCANTID=${detalleHi.TotalHuevo},@C6_DFECDOC='${fechaSeleccionadoMoment.format("YYYY-MM-DD")}',@C6_CCODMOV='EP'
                        ,@C6_NTIPCAM=${tasaTipoCambio},@C6_CCENCOS='${detalleHi.ccosto}',@C6_CDESCRI='${descripcionHuevo}',@C6_NCANREQ=0,@C6_CCTACMO='',@C6_CNUMORD='',@C6_CUMREF='' `)
                    index++
                }



            }
            if (detallesHc.length > 0) {
               /*  let index = 1;
                const { recordset } = await pool.request().query("select (A1_NNUMENT+1) correlativo from RSFACCAR.dbo.AL0003ALMA where A1_CALMA='0003'")
                nroMovimientoHc = recordset[0].correlativo
                await pool.request()
                    .query(`exec [dbo].[SP_AL0003MOVC_Inserta] @C5_CALMA='0003',@C5_CTD='PE',@C5_CNUMDOC='${nroMovimientoHc.toString().padStart(11, "0")}',@C5_CLOCALI='0001',
                @C5_DFECDOC='${fechaSeleccionadoMoment.format('YYYY-MM-DD')}',@C5_CTIPMOV='E',@C5_CCODMOV='EP',@C5_CSITUA='V',@C5_CRFTDOC='OT',@C5_CRFNDOC='${fechaSeleccionadoMoment.format('DDMMYY')}',@C5_CSOLI='',@C5_CCENCOS='${ccosto}',
                @C5_CRFALMA='',@C5_CGLOSA1='',@C5_CGLOSA2='',@C5_CGLOSA3='',@C5_CTIPANE='',@C5_CCODANE='',@C5_CUSUCRE='GRA02',@C5_CUSUMOD='',@C5_CCODCLI='',@C5_CNOMCLI='',@C5_CRUC='',@C5_CCODCAD='',@C5_CCODINT='',@C5_CCODTRA='',@C5_CNOMTRA='',@C5_CCODVEH='',@C5_CTIPGUI='',
                @C5_CSITGUI='',@C5_CGUIFAC='',@C5_CDESTIN='',@C5_CDIRENV='',@C5_CNUMORD='',@C5_CTIPORD='',@C5_CGUIDEV='',@C5_CCODPRO='',@C5_CNOMPRO='',@C5_CCIAS='',@C5_CFORVEN='',@C5_CCODMON='MN',@C5_CVENDE='',@C5_NTIPCAM=${tasaTipoCambio},
                @C5_CCODAGE='',@C5_CNUMPED='',@C5_CDIRECC='',@C5_NIMPORT=0,@C5_CTIPO='V',@C5_CSUBDIA='',@C5_CCOMPRO='',@C5_NPORDE1=0,@C5_NPORDE2=0,@C5_CTF='',@C5_NFLETE=0,@C5_CCODAUT='',@C5_CRFTDO2='',@C5_CRFNDO2='',@C5_CNUMLIQ='',@C5_CORDEN='',@C5_CTIPOGS='',@C5_CCODFER='',@C5_CGLOSA4='',@C5_CVENDE2='',
                @C5_CESTDEV='',@C5_CEXTOR='',@C5_CRENOM='',@C5_CRERUC='',@C5_CREREF='',@C5_CDSNOM='',@C5_CDSRUC='',@C5_CLLECIU='',@C5_CPARCIU='',@C5_CTTRACT='',@C5_CTRASRE='',@C5_CTRAREM='',@C5_CLICCON='',@C5_CSBNOM='',@C5_CSBRUC='',@C5_CSBMTC='',@C5_CMONPER='',@C5_NIMPPER=0,@C5_CFPERCP='',@C5_CESTFIN='',
                @C5_CFLGPEN='',@C5_CTIPFOR='',@C5_NPORPER=0,@C5_CFLGTRM='',@C5_CAGETRA='',@C5_CCONTAI='',@C5_CDOCEST='',@C5_CSUNEST='',@C5_CPROEST='',@C5_DFECCDR=null,@C5_CCOMEST='',@C5_CFMANU='',@C5_CFIRMDIG='',@C5_CHFIRMDIG='',@C5_CTED='',@C5_CFREPRO='',@C5_CTIPDES='',@C5_CEMAIL='',@C5_CTE='',@C5_CCODTAL='',
                @C5_CCODMOD='',@C5_CUNIDAD='',@C5_NPESO=0,@C5_NCANTBULT=0,@C5_CCODMOT='',@C5_CDOCIDE='',@C5_CFCONTIG='',@C5_NREINDCL=0,@C5_NREINDCLB=0,@C5_CERRCOD='',@C5_CSOLEST='',@C5_CFBAJA='',@C5_CFNOVEDAD='',@C5_CHASHRS='',@C5_CTIPFAC='',@C5_COTRMOT=''  `)
                for (const detalleHc of detallesHc) {
                    const { recordset } = await pool.request().query(`SELECT RTRIM(AR_CDESCRI) DESCRIP FROM RSFACCAR.dbo.AL0003ARTI WHERE AR_CCODIGO='${detalleHc.Codigohuevo}' `)
                    console.log("resultset", recordset)
                    const descripcionHuevo = recordset[0].DESCRIP
                    await pool.request()
                        .query(`exec [dbo].[SP_AL0003MOVD_Inserta] @C6_CTD='PE',@C6_CNUMDOC='${nroMovimientoHc.toString().padStart(11, "0")}',@C6_CITEM='${index.toString().padStart(4, "0")}', @C6_CCODIGO='${detalleHc.Codigohuevo}',@C6_NCANTID=${detalleHc.TotalHuevo},@C6_DFECDOC='${fechaSeleccionadoMoment.format("YYYY-MM-DD")}',@C6_CCODMOV='EP'
                        ,@C6_NTIPCAM=${tasaTipoCambio},@C6_CCENCOS='${detalleHc.ccosto}',@C6_CDESCRI='${descripcionHuevo}',@C6_NCANREQ=0,@C6_CCTACMO='',@C6_CNUMORD='',@C6_CUMREF=''  `)
                    index++
                } */


            }
            const { insertId } = await connection.query("insert into trans_prod_huevos(fechaTransferencia,idUsuario,nroMovimientoHc,nroMovimientoHi,fechaRegistro) values(?,?,?,?,?)",
                [moment(fechaSeleccionado).format("YYYY-MM-DD"), idUsuario, nroMovimientoHc, nroMovimientoHi, new Date()]);
            const detallesValues = detalle.map((d, index) => [insertId, (index + 1).toString().padStart(5, "0"), d.idProduccion, d.IdLote, d.Tipo, d.Lote, d.TipoGenero, d.Semana, d.TotalHuevo, d.Codigohuevo, d.ccosto])
            await connection.query("insert into trans_prod_huevos_detalle(idTransferenciaProHuevos,idItem,idProduccion,idLote,Tipo,Lote,TipoGenero,Semana,TotalHuevo,Codigohuevo,ccosto) values ?", [detallesValues])
            await connection.query("COMMIT");

        } catch (error) {
            console.error(error)
            await connection.query("ROLLBACK");

            throw error;
        } finally {
            connection.release();
        }



    },
    listarDetalleProduccionHuevo: async function (produccionHuevoId) {
        const connection = await mysql.connection();
        try {
            const detalle = await connection.query("select * from trans_prod_huevos_detalle tr left join lotes lo on lo.idLote=tr.idLote  where idTransferenciaProHuevos=?", [produccionHuevoId])

            return detalle
        } catch (error) {
            throw error;
        }
    },
    validarFechaTransferenciaTransferenciaHuevos: async function (fechaTransferencia) {

    },
    listarTransferenciaHuevos: async function () {

        const connection = await mysql.connection();
        try {
            const data = await connection.query("select *,DATE_FORMAT(prod.fechaTransferencia,'%Y-%m-%d') fechaTransferencia from trans_prod_huevos prod inner join usuario u on u.idUsuario=prod.idUsuario order by fechaTransferencia DESC");
            return data;
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    },

    addProduccion: async function (Produccion) {
        let f = Produccion.Nombre.split('-');
        let f2 = f.sort();
        let rows = await db.query(`INSERT INTO produccion (Nombre, FechaIniProduccion, FechaFinProduccion, 
        FechaInicioDepreciacion, idLevante, ccosto,codigoHuevoIncubableLm,codigoHuevoIncubableLh,codigoHuevoComercial) values(?,?,?,?,?,?,?,?,?)`, [f2.join('-'), Produccion.FechaIniProduccion,
        Produccion.FechaFinProduccion, Produccion.FechaInicioDepreciacion, Produccion.idLevante, Produccion.ccosto, Produccion.codigoHuevoIncubableLm.trim(), Produccion.codigoHuevoIncubableLh.trim(), Produccion.codigoHuevoComercial.trim()]);
        return rows;
    },
    updateSeleccionReporte: async function (data = [], user) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            const queryMap = data.map(d => (`update produccion set seleccionadoReporte=${d.seleccionadoReporte && 1 || 0}, usuarioReporte=${user}, fechaReporte='${moment().format("YYYY-MM-DD")}' where idProduccion=${d.idProduccion}`))
            await connection.query(queryMap.join(";"))
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }


    },
    updateProduccionLotes: function (id, Produccion, callback) {
        let Num_Aves_Fin_Levante = Produccion.Num_Aves_Fin_Levante;
        for (let i = 0; i < Num_Aves_Fin_Levante.length; i++) {
            const element = Num_Aves_Fin_Levante[i];
            db.query("UPDATE lotes set Num_Aves_Fin_Levante= ?, idProduccion = ?, idGranjaP = ?, idGalponP = ? WHERE idLevante = ? and idLote = ?", [element.Num_Aves_Fin_Levante, id, Number(element.idGranjaP), Number(element.idGalponP), Produccion.idLevante, element.idLote], callback);
        }
        return
    },
    getNumAvesFinLevante: async function (Produccion) {
        let count = await db.query("SELECT MAX(Semana) as Semana_max FROM mortalidadsem WHERE idLevante = ?", Produccion.idLevante);
        return db.query("SELECT l.idLote, l.lote, l.lote_str, l.Sexo, m.saldo_fin_sem as Num_Aves_Fin_Levante FROM lotes l INNER JOIN mortalidadsem m ON m.idLote = l.idLote WHERE l.idLevante = ? and m.Semana = ?", [Produccion.idLevante, count[0].Semana_max]);
    },
    getLotesCompararProd: async function () {

        let rows = await db.query("Select l.*, gal.Galpon, lin.Linea, gra.Granja " +
            "from lotes l " +
            "LEFT JOIN galpones gal ON gal.idGalpon = l.idGalpon " +
            "LEFT JOIN lineas lin ON lin.idLinea = l.idLinea " +
            "LEFT JOIN granjas gra ON gra.idGranja = l.idGranja " +
            "WHERE idLevante != 0 and l.idProduccion != 0 and l.Sexo = 'H'" +
            "ORDER BY l.CorrelativoLote DESC ");

        for (let i = 0; i < rows.length; i++) {
            const element = rows[i];
            element.Style = {
                'opacity': '0.65'
            }
        }
        return rows;
    },
    updateProd: async function (Produccion) {
        let json
        try {
            let cons_prod = await db.query(`UPDATE produccion SET FechaFinProduccion=? ,FechaInicioDepreciacion = ?, ccosto = ? 
            WHERE idProduccion = ?`, [moment(Produccion.FechaFinProduccion).format("YYYY-MM-DD"), Produccion.FechaInicioDepreciacion, Produccion.ccosto, Produccion.idProduccion]);
            json = {
                success: true,
                message: "Actualizado correctamente"
            }
        } catch (error) {
            console.log('error :>> ', error);
            json = {
                success: false,
                message: "Error en el Servidor 'POST /produccion/updateProd/' "
            }
        }
        return json;
    }
}
module.exports = Produccion;