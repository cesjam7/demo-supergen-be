const { poolPromise } = require('../dbconnectionMSSQL')
var db = require('../dbconnection');
var fs = require('fs');
var Excel = require('exceljs');
var workbook = new Excel.Workbook();
var comprobantes = {
    exportarExcel:async function ({ guias = [] }) {
        try {
            const rutaTemplateHC = `./template/plantilla  guias remision.xlsx`;
            const alignmentStyle = { vertical: "middle", horizontal: "center", wrapText: true }

            const borderStylesC = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            if (fs.existsSync(`./template/guias de remision.xlsx`)) {
                fs.unlinkSync(`./template/guias de remision.xlsx`)
            }
            const wor = await workbook.xlsx.readFile(rutaTemplateHC)
            const sheet = wor.worksheets[0];
            for (let index = 0; index < guias.length; index++) {
                const guiaActual = guias[index]
                sheet.getCell("C" + (index + 5)).value = guiaActual.serie_comprobante + "-" + guiaActual.numero_comprobante.toString().padStart(8, "0");
                sheet.getCell("C" + (index + 5)).border = borderStylesC
                sheet.getCell("C" + (index + 5)).alignment = alignmentStyle

                sheet.getCell("D" + (index + 5)).value = guiaActual.razon_social
                sheet.getCell("D" + (index + 5)).border = borderStylesC
                sheet.getCell("D" + (index + 5)).alignment = alignmentStyle

                sheet.getCell("E" + (index + 5)).value = guiaActual.fecha_comprobante
                sheet.getCell("E" + (index + 5)).border = borderStylesC
                sheet.getCell("E" + (index + 5)).alignment = alignmentStyle

                sheet.getCell("F" + (index + 5)).value = guiaActual.fecha_registro
                sheet.getCell("F" + (index + 5)).border = borderStylesC
                sheet.getCell("F" + (index + 5)).alignment = alignmentStyle

                sheet.getCell("G" + (index + 5)).value = this.mensajeSunatMedianteCodigo(guiaActual.cod_sunat)
                sheet.getCell("G" + (index + 5)).border = borderStylesC
                sheet.getCell("G" + (index + 5)).alignment = alignmentStyle

            }
            await workbook.xlsx.writeFile(`./template/guias de remision.xlsx`)

            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "/supergen-be/template/guias de remision.xlsx"
            }
            return json;
        } catch (error) {
            console.log(error)
            throw error;
        }
    },
    mensajeSunatMedianteCodigo: function (codigoSunat = 0) {
        let mensaje = "pendiente"
        if (codigoSunat != '' && codigoSunat != 0 && codigoSunat != 4000) {
            mensaje = "enviado con error"
        }
        if (codigoSunat == '0' || codigoSunat == '4000') {
            mensaje = "enviado y recibido"
        }
        return mensaje;
    },
    getAllseries: function (callback) {
        return db.query("Select * from series", callback);
    },
    agregarSerie: function (serie, unidad, senasa, callback) {
        return db.query("INSERT INTO series (serie, unidad_productiva, registro_senasa) values(?,?,?)", [serie, unidad, senasa], callback);
    },
    editarSerie: function (id, serie, unidad, senasa, callback) {
        return db.query("UPDATE series set serie=?, unidad_productiva=?, registro_senasa=? WHERE id=?", [serie, unidad, senasa, id], callback);
    },
    seriesUsuarios: function (serie_id, usuarios, callback) {
        console.log('usuarios', usuarios)
        db.query("delete from series_usuarios where serie_id=?", [serie_id]);

        for (let index = 0; index < usuarios.length; index++) {
            db.query("INSERT INTO series_usuarios (serie_id, user_id) values(?,?)", [serie_id, usuarios[index]], callback);

            if ((index + 1) == usuarios.length) return 1;
        }
    },
    getSeriesUsuarios: function (callback) {
        return db.query("Select * from series_usuarios INNER JOIN series ON series.id = series_usuarios.serie_id", callback);
    },
    getAllitems: async function () {
        let json = {}
        try {
            const pool = await poolPromise
            const result = await pool.request()
                .query(`SELECT-- A.*,
A.C5_CRUC, A.C5_CALMA,A.C5_CNUMDOC,A.C5_DFECDOC,A.C5_CRFTDOC, A.C5_CRFNDOC,A.C5_CCODMOV,G.TM_CDESCRI DES_TIPOMOV,
A.C5_CCODCLI,A.C5_CNOMCLI,A.C5_CRUC ,A.C5_CCODTRA,A.C5_CNOMTRA,A.C5_CCODVEH,A.C5_CDESTIN,
A.C5_CDIRENV, B.TR_CNOMBRE NOMBRE_EMPTRANS,B.TR_CDIRECC DIRECCION_EMPTRANS, B.TR_CRUC RUC_EMPTRANS,B.TR_CAUTMTC AUTORIZACION_MTC,
B.TR_CNOMFER NOMBRE_CHOFER,
B.TR_CLICCON LICENCIA_CHOFER, B.TR_CMARCA MARCA_EMPTRANS, B.TR_CPLACA  PLACA_EMPTRANS,
C.A1_CDIRECC+' - '+A1_CDISTRI+'-'+C.A1_CPROV+'-'+C.A1_CDEPT  DIRECCION_PARTIDA,
C.A1_CDIRECC,A1_CDISTRI,C.A1_CPROV,C.A1_CDEPT,
D.DE_CDIRECC+' - '+D.DE_CDISTRI+' - '+D.DE_CPROV+' - '+D.DE_CDEPT  DIRECCION_ENTREGA,
D.DE_CDIRECC,D.DE_CDISTRI,D.DE_CPROV,D.DE_CDEPT,

E.C6_CCODIGO,E.C6_CDESCRI,E.C6_NCANTID,E.C6_NPESO,F.AR_CUNIDAD,E.C6_NPREUNI, E.C6_NIMPUS,
H.AC_CRUC, H.AC_CNOMCIA, H.AC_CDIRCIA, H.AC_CDISTRI, H.AC_CPROVIN, H.AC_CPAIS, H.AC_CTELEF1,
CASE WHEN A.C5_CTD='GS' THEN 'GUIA DE REMISION ELECTRONICA' END TIPO_DOCUMENTO
, E.*
FROM RSFACCAR..AL0003MOVC A 
LEFT JOIN RSFACCAR..AL0003TRAN B ON B.TR_CCODIGO=A.C5_CCODTRA
left join RSFACCAR..AL0003ALMA C ON C.A1_CALMA=A.C5_CALMA
left join RSFACCAR..FT0003CLID D on D.DE_CCODCLI=A.C5_CCODCLI AND D.DE_CCODUBI=A.C5_CDESTIN
left join RSFACCAR..AL0003MOVD E on E.C6_CALMA=A.C5_CALMA AND E.C6_CTD=A.C5_CTD AND E.C6_CNUMDOC=A.C5_CNUMDOC
left join RSFACCAR..AL0003ARTI F on F.AR_CCODIGO=E.C6_CCODIGO
left join RSFACCAR..AL0003TABM G ON G.TM_CTIPMOV=A.C5_CTIPMOV AND G.TM_CCODMOV=A.C5_CCODMOV
LEFT JOIN RSFACCAR..ALCIAS H ON (H.AC_CCIA=0003)
WHERE 
A.C5_CTD='GS' AND COALESCE(H.AC_CCIA,'')<>''
ORDER BY A.C5_DFECDOC ASC, A.C5_CTD, A.C5_CNUMDOC ASC, E.C6_CITEM ASC`)
            json = {
                success: true,
                message: "Extracción de comprobantes realizada satisfactoriamente.",
                rows: result.recordset
            }
        } catch (error) {
            json = {
                success: false,
                message: "Error en la ruta comprobantes/getTrabajadores",
                error: error.code,
                rows: []
            }
        }
        return json
    },
    getItemsFilters: async function (almacen, tipodoc, numdoc) {
        let json = {}
        try {
            const pool = await poolPromise
            const result = await pool.request()
                .query(`SELECT-- A.*,
A.C5_CRUC, A.C5_CALMA,A.C5_CNUMDOC,A.C5_DFECDOC,A.C5_CRFTDOC, A.C5_CRFNDOC,A.C5_CCODMOV,G.TM_CDESCRI DES_TIPOMOV,
A.C5_CCODCLI,A.C5_CNOMCLI,A.C5_CRUC ,A.C5_CCODTRA,A.C5_CNOMTRA,A.C5_CCODVEH,A.C5_CDESTIN,
A.C5_CDIRENV, B.TR_CNOMBRE NOMBRE_EMPTRANS,B.TR_CDIRECC DIRECCION_EMPTRANS, B.TR_CRUC RUC_EMPTRANS,B.TR_CAUTMTC AUTORIZACION_MTC,
B.TR_CNOMFER NOMBRE_CHOFER,
B.TR_CLICCON LICENCIA_CHOFER, B.TR_CMARCA MARCA_EMPTRANS, B.TR_CPLACA  PLACA_EMPTRANS,
C.A1_CDIRECC+' - '+A1_CDISTRI+'-'+C.A1_CPROV+'-'+C.A1_CDEPT  DIRECCION_PARTIDA,
C.A1_CDIRECC,A1_CDISTRI,C.A1_CPROV,C.A1_CDEPT,
D.DE_CDIRECC+' - '+D.DE_CDISTRI+' - '+D.DE_CPROV+' - '+D.DE_CDEPT  DIRECCION_ENTREGA,
D.DE_CDIRECC,D.DE_CDISTRI,D.DE_CPROV,D.DE_CDEPT,

E.C6_CCODIGO,E.C6_CDESCRI,E.C6_NCANTID,E.C6_NPESO,F.AR_CUNIDAD,E.C6_NPREUNI, E.C6_NIMPUS,
H.AC_CRUC, H.AC_CNOMCIA, H.AC_CDIRCIA, H.AC_CDISTRI, H.AC_CPROVIN, H.AC_CPAIS, H.AC_CTELEF1,
CASE WHEN A.C5_CTD='GS' THEN 'GUIA DE REMISION ELECTRONICA' END TIPO_DOCUMENTO
, E.*
FROM RSFACCAR..AL0003MOVC A 
LEFT JOIN RSFACCAR..AL0003TRAN B ON B.TR_CCODIGO=A.C5_CCODTRA
left join RSFACCAR..AL0003ALMA C ON C.A1_CALMA=A.C5_CALMA
left join RSFACCAR..FT0003CLID D on D.DE_CCODCLI=A.C5_CCODCLI AND D.DE_CCODUBI=A.C5_CDESTIN
left join RSFACCAR..AL0003MOVD E on E.C6_CALMA=A.C5_CALMA AND E.C6_CTD=A.C5_CTD AND E.C6_CNUMDOC=A.C5_CNUMDOC
left join RSFACCAR..AL0003ARTI F on F.AR_CCODIGO=E.C6_CCODIGO
left join RSFACCAR..AL0003TABM G ON G.TM_CTIPMOV=A.C5_CTIPMOV AND G.TM_CCODMOV=A.C5_CCODMOV
LEFT JOIN RSFACCAR..ALCIAS H ON (H.AC_CCIA=0003)
WHERE 
A.C5_CTD='GS' AND COALESCE(H.AC_CCIA,'')<>''
AND E.C6_CALMA = '`+ almacen + `' AND C6_CTD = '` + tipodoc + `' AND C6_CNUMDOC = '` + numdoc + `'
ORDER BY A.C5_DFECDOC ASC, A.C5_CTD, A.C5_CNUMDOC ASC, E.C6_CITEM ASC`)
            json = {
                success: true,
                message: "Extracción de items realizada satisfactoriamente.",
                rows: result.recordset
            }
        } catch (error) {
            json = {
                success: false,
                message: "Error en la ruta comprobantes/getItemsFilters",
                error: error.code,
                rows: []
            }
        }
        return json
    },
    getAllcomprobantes: async function (series) {
        let series_array = series.split(',')
        var series_user = []
        for (let index = 0; index < series_array.length; index++) {
            series_user.push("'" + series_array[index].trim() + "'")
        }
        console.log('series_user', series_user)
        let json = {}
        try {
            const pool = await poolPromise
            const result = await pool.request()
                // CL_CDOCIDE 1 extranjero, 
                .query(`SELECT-- A.*,
 A.C5_CRUC, A.C5_CALMA,A.C5_CNUMDOC,A.C5_DFECDOC,A.C5_CRFTDOC, A.C5_CRFNDOC,A.C5_CCODMOV,G.TM_CDESCRI DES_TIPOMOV,
A.C5_CCODCLI,A.C5_CNOMCLI,A.C5_CRUC ,A.C5_CCODTRA,A.C5_CNOMTRA,A.C5_CCODVEH,A.C5_CDESTIN,
A.C5_CDIRENV, B.TR_CNOMBRE NOMBRE_EMPTRANS,B.TR_CDIRECC DIRECCION_EMPTRANS, B.TR_CRUC RUC_EMPTRANS,B.TR_CAUTMTC AUTORIZACION_MTC,
B.TR_CNOMFER NOMBRE_CHOFER,
B.TR_CLICCON LICENCIA_CHOFER, B.TR_CMARCA MARCA_EMPTRANS, B.TR_CPLACA  PLACA_EMPTRANS,
C.A1_CDIRECC+' - '+A1_CDISTRI+'-'+C.A1_CPROV+'-'+C.A1_CDEPT  DIRECCION_PARTIDA,
C.A1_CDIRECC,A1_CDISTRI,C.A1_CPROV,C.A1_CDEPT,
D.DE_CDIRECC+' - '+D.DE_CDISTRI+' - '+D.DE_CPROV+' - '+D.DE_CDEPT  DIRECCION_ENTREGA,
D.DE_CDIRECC,D.DE_CDISTRI,D.DE_CPROV,D.DE_CDEPT,
H.AC_CRUC, H.AC_CNOMCIA, H.AC_CDIRCIA, H.AC_CDISTRI, H.AC_CPROVIN, H.AC_CPAIS, H.AC_CTELEF1,
A.C5_CTD, I.CL_CDOCIDE
FROM RSFACCAR..AL0003MOVC A 
LEFT JOIN RSFACCAR..AL0003TRAN B ON B.TR_CCODIGO=A.C5_CCODTRA
left join RSFACCAR..AL0003ALMA C ON C.A1_CALMA=A.C5_CALMA
left join RSFACCAR..FT0003CLID D on D.DE_CCODCLI=A.C5_CCODCLI AND D.DE_CCODUBI=A.C5_CDESTIN
left join RSFACCAR..AL0003TABM G ON G.TM_CTIPMOV=A.C5_CTIPMOV AND G.TM_CCODMOV=A.C5_CCODMOV
LEFT JOIN RSFACCAR..ALCIAS H ON (H.AC_CCIA=0003)
LEFT JOIN RSFACCAR..FT0003CLIE I ON I.CL_CCODCLI=A.C5_CCODCLI
WHERE
 a.C5_DFECDOC>='02/14/2021'
AND A.C5_CTD='GS' AND COALESCE(H.AC_CCIA,'')<>''
AND A.C5_CNUMDOC NOT IN (SELECT C5_CNUMDOC FROM AL0003MOVC_TMP )
AND SUBSTRING(A.C5_CNUMDOC,1,4) IN (${series_user.join(',')})
ORDER BY A.C5_DFECDOC ASC, A.C5_CTD, A.C5_CNUMDOC ASC`)
            json = {
                success: true,
                message: "Extracción de comprobantes realizada satisfactoriamente. 2",
                rows: result.recordset
            }
        } catch (error) {
            json = {
                success: false,
                message: "Error en la ruta comprobantes/getAllcomprobantes",
                error: error.code,
                rows: []
            }
        }
        return json
    },
    guardarComprobante: async function (calma, ctd, numdoc) {
        try {
            const pool = await poolPromise
            var query = "INSERT INTO DBCostsSG.[dbo].[AL0003MOVC_TMP](C5_CALMA,C5_CTD,C5_CNUMDOC)VALUES("+calma+','+ctd+','+"'"+numdoc+"'"+')';
            const result = await pool.request().query(query);
            var json = {
                success: true,
                message: "Ingresado correctamente en sql server",
                error: null,
                rows: result
            }
            console.log('json insert',json);
            return json    
        } catch (error) {
            var json = {
                success: true,
                message: "Ingresado correctamente en sql server",
                error: error.message,
                rows: result
            }
            console.log('json insert',json);
            return json 
        }
        
    }
};

module.exports = comprobantes;
