const moment = require("moment")
const Excel = require('exceljs');
var fs = require('fs');
const mysqlClass = require("../dbConnectionClass");
const ServerError = require("../error");

const workbook = new Excel.Workbook();
const levanteCartillaVirtual = {

    cartillaVirtual: async function ({ periodo, tipo, lote, sexo, edad }) {
        const { idLevante } = lote
        let sumaTotalSaldoAvesHembra = 0;
        let sumaTotalSaldoAvesMacho = 0;
        let queryLevanteInicio = `select 
        sum(case when B.sexo='H' then A.saldo_fin_sem else 0 end) poblacion_inicial_hembra,
        sum(case when B.sexo='M' then A.saldo_fin_sem else 0 end) poblacion_inicial_macho
         from mortalidadsem A 
        left join lotes B on B.idLote=A.idLote
        where A.idLevante='${idLevante}' and A.semana=${edad - 1} and B.TipoGenero='${sexo}'
        `
        if (edad == 1) {
            queryLevanteInicio = `select 
            sum(case when A.sexo='H' then A.NumHembras else 0 end) poblacion_inicial_hembra,
            sum(case when A.sexo='M' then A.NumHembras else 0 end) poblacion_inicial_macho
            from lotes A where A.idLevante=${idLevante}
            `
        }
        const dataInicialLevante = await mysqlClass.ejecutarQueryPreparado(queryLevanteInicio, {}, true)
        const dataPesos = await mysqlClass.ejecutarQueryPreparado(`select IdLevante, Semana,TipoGenero ,
sum(peso_real_hembra) peso_real_hembra, sum(peso_real_macho) peso_real_macho,
sum(peso_standard_hembra) peso_standard_hembra, sum(peso_standard_macho) peso_standard_macho,
sum(peso_dif_hembra) peso_dif_hembra, sum(peso_dif_macho) peso_dif_macho from (
select A.IdLevante, A.Semana,B.TipoGenero ,
case when B.sexo='H' then A.peso_actual else 0 end peso_real_hembra,
case when B.sexo='M' then A.peso_actual else 0 end peso_real_macho,
case when B.sexo='H' then A.peso_standard else 0 end peso_standard_hembra,
case when B.sexo='M' then A.peso_standard else 0 end peso_standard_macho,
case when B.sexo='H' then A.peso_dif else 0 end peso_dif_hembra,
case when B.sexo='M' then A.peso_dif else 0 end peso_dif_macho
from peso_semana_det A
left join lotes B on B.idLote=A.idLote
where A.idlevante='${idLevante}' and A.semana=${edad} and B.TipoGenero='${sexo}'
)w
group by IdLevante, Semana,TipoGenero
`, {}, true)
        const alimentoAveDia = await mysqlClass.ejecutarQueryPreparado(`select IdLevante, Semana,TipoGenero ,
sum(CantRealAlimento_hembra) CantRealAlimento_hembra, sum(CantRealAlimento_macho) CantRealAlimento_macho,
sum(STD_hembra) STD_hembra, sum(STD_macho) STD_macho,
sum(CantIncreSTD_hembra) CantIncreSTD_hembra, sum(CantIncreSTD_macho) CantIncreSTD_macho from (
select A.IdLevante, A.Semana,B.TipoGenero ,
case when B.sexo='H' then A.CantRealAlimento else 0 end CantRealAlimento_hembra,
case when B.sexo='M' then A.CantRealAlimento else 0 end CantRealAlimento_macho,
case when B.sexo='H' then A.STD else 0 end STD_hembra,
case when B.sexo='M' then A.STD else 0 end STD_macho,
case when B.sexo='H' then A.CantIncreSTD else 0 end CantIncreSTD_hembra,
case when B.sexo='M' then A.CantIncreSTD else 0 end CantIncreSTD_macho
from alimento_levante_sem A
left join lotes B on B.idLote=A.idLote
where A.idlevante='${idLevante}' and A.semana=${edad} and B.TipoGenero='${sexo}'
)w
group by IdLevante, Semana,TipoGenero
`, {}, true)
        const dataPesoAlimento = [[{ value: "Peso corporal", colSpan: 1 }, { value: Number(dataPesos.peso_standard_hembra).toFixed(2), colSpan: 1 },
        { value: Number(dataPesos.peso_standard_macho).toFixed(2), colSpan: 1 },
        { value: Number(dataPesos.peso_real_hembra).toFixed(2), colSpan: 1 },
        { value: Number(dataPesos.peso_real_macho).toFixed(2), colSpan: 1 },
        { value: Number(dataPesos.peso_dif_hembra).toFixed(2), colSpan: 1 },
        { value: Number(dataPesos.peso_dif_macho).toFixed(2), colSpan: 1 },
        ],
        [{ value: "Alimentos Gr/Ave/Día", colSpan: 1 },
        { value: Number(alimentoAveDia.STD_hembra).toFixed(2), colSpan: 1 },
        { value: Number(alimentoAveDia.STD_macho).toFixed(2), colSpan: 1 },
        { value: Number(alimentoAveDia.CantRealAlimento_hembra).toFixed(2), colSpan: 1 },
        { value: Number(alimentoAveDia.CantRealAlimento_macho).toFixed(2), colSpan: 1 },
        { value: Number(((Number(alimentoAveDia.CantRealAlimento_hembra) - alimentoAveDia.STD_hembra) / alimentoAveDia.STD_hembra) * 100).toFixed(2), colSpan: 1 },
        { value: Number(((Number(alimentoAveDia.CantRealAlimento_macho) - alimentoAveDia.STD_macho) / alimentoAveDia.STD_macho) * 100).toFixed(2), colSpan: 1 },
        ]]


        let data = await mysqlClass.ejecutarQueryPreparado(`select idLevante, semana,Edad,TipoGenero,nombre_dia,fecha2,
        sum(mortalidad_hembra) mortalidad_hembra,
        sum(mortalidad_macho) mortalidad_macho ,
        sum(descarte_hembra) descarte_hembra,
        sum(descarte_macho) descarte_macho from (
        select A.idLevante, A.semana,A.Edad,B.TipoGenero ,
            CASE DAYOFWEEK(A.fecha)
            WHEN 1 THEN 'Domingo'
            WHEN 2 THEN 'Lunes'
            WHEN 3 THEN 'Martes'
            WHEN 4 THEN 'Miércoles'
            WHEN 5 THEN 'Jueves'
            WHEN 6 THEN 'Viernes'
            WHEN 7 THEN 'Sábado'  END nombre_dia,date_format(A.fecha, "%d/%m/%Y") fecha2,
           
        case when B.sexo='H' then A.NoAves else 0 end mortalidad_hembra,
        case when B.sexo='M' then A.NoAves else 0 end mortalidad_macho,
        case when B.sexo='H' then A.NoEliminados else 0 end descarte_hembra,
        case when B.sexo='M' then A.NoEliminados else 0 end descarte_macho
        from mortalidad_det A 
        left join lotes B on B.idLote=A.idLote
        where A.idlevante='${idLevante}' and A.semana=${edad} and B.TipoGenero='${sexo}'
        )w
        group by idlevante, semana,Edad,TipoGenero,nombre_dia,fecha2
        order by fecha2
`, {})
        const fechaInicial = data.length > 0 ? moment(data[0].fecha2, 'DD/MM/YYYY') : null
        const fechaFinal = data.length > 0 ? moment(data[data.length - 1].fecha2, 'DD/MM/YYYY') : null
        const dataVenta = await mysqlClass.ejecutarQueryPreparado(`select idLevante, semana,Edad,TipoGenero,nombre_dia,fecha2,
        sum(venta_hembra) venta_hembra,
        sum(venta_macho) venta_macho from (
        select A.idLevante, A.semana,A.Edad,B.TipoGenero ,
            CASE DAYOFWEEK(A.fecha)
            WHEN 1 THEN 'Domingo'
            WHEN 2 THEN 'Lunes'
            WHEN 3 THEN 'Martes'
            WHEN 4 THEN 'Miércoles'
            WHEN 5 THEN 'Jueves'
            WHEN 6 THEN 'Viernes'
            WHEN 7 THEN 'Sábado'  END nombre_dia,date_format(A.fecha, "%d/%m/%Y") fecha2,
        case when B.sexo='H' then (coalesce(A.ErSex,0)+coalesce(A.SelGen,0))  else 0 end venta_hembra,
        case when B.sexo='M' then (coalesce(A.ErSex,0)+coalesce(A.SelGen,0)) else 0 end venta_macho
        from mortalidad_det A 
        left join lotes B on B.idLote=A.idLote
        where A.idlevante='${idLevante}' and A.semana=${edad} and B.TipoGenero='${sexo}'
        )w
        group by idlevante, semana,Edad,TipoGenero,nombre_dia,fecha2
        order by fecha2
`, {})
        const dataAlimento = await mysqlClass.ejecutarQueryPreparado(`select idLevante, semana,Edad,TipoGenero,fecha2,
        (SELECT GROUP_CONCAT(DISTINCT tipoalimento_hembra ORDER BY tipoalimento_hembra asc SEPARATOR '- ')w )  tipoalimento_hembra ,
       (SELECT GROUP_CONCAT(DISTINCT tipoalimento_macho ORDER BY tipoalimento_macho asc SEPARATOR '- ')w )  tipoalimento_macho ,
       sum(alimento_hembra) alimento_hembra, sum(alimento_macho) alimento_macho from (  
       select A.idLevante, A.semana,A.Edad,B.TipoGenero , date_format(A.fecha, "%d/%m/%Y") fecha2,
       A.idAlimento,
       case when B.sexo='H' then C.nombreAlimento else '' end tipoalimento_hembra,
       case when B.sexo='M' then C.nombreAlimento else '' end tipoalimento_macho,
       
       case when B.sexo='H' then A.CantAlimento else 0 end alimento_hembra,
       case when B.sexo='M' then A.CantAlimento else 0 end alimento_macho
       from alimento_levante_det A
       left join lotes B on B.idLote=A.idLote
       left join tipo_alimento C on C.idAlimento=A.idAlimento
       where A.idLevante='${idLevante}' and A.semana=${edad} and B.TipoGenero='${sexo}' and coalesce(A.CantAlimento,0)>0
       )w
       group by idLevante, semana,Edad,TipoGenero,fecha2
       order by fecha2
       
`, {})
        let dataProcess = data.map(d => ([{ value: d.nombre_dia, colSpan: 1 }, { value: d.fecha2, colSpan: 1 }, { value: d.mortalidad_hembra, colSpan: 1 }, { value: d.mortalidad_macho, colSpan: 1 }, { value: "", colSpan: 1 }, { value: d.descarte_hembra, colSpan: 1 }, { value: d.descarte_macho, colSpan: 1 }, { value: 0, colSpan: 1 }, { value: 0, colSpan: 1 }]))

        for (const da of dataProcess) {
            const alimentoEncontrado = dataAlimento.find(d => moment(d.fecha2, 'DD/MM/YYYY').isSame(moment(da[1].value, 'DD/MM/YYYY')))
            da.push({
                value: alimentoEncontrado ? Number(alimentoEncontrado.alimento_hembra).toFixed(2).toLocaleString(
                    'en',
                    { minimumFractionDigits: 2 }
                ) : 0, colSpan: 1
            })
            da.push({
                value: alimentoEncontrado ? Number(alimentoEncontrado.alimento_macho).toFixed(2).toLocaleString(
                    'en',
                    { minimumFractionDigits: 2 }
                ) : 0, colSpan: 1
            })
            da.push({ value: alimentoEncontrado ? alimentoEncontrado.tipoalimento_hembra.concat(alimentoEncontrado.tipoalimento_macho) : '', colSpan: 1 })
            da.push({
                value: alimentoEncontrado ? Number(alimentoEncontrado.alimento_macho + alimentoEncontrado.alimento_hembra).toFixed(2).toLocaleString(
                    'en',
                    { minimumFractionDigits: 2 }
                ) : 0, colSpan: 1
            })
        }

        if (fechaFinal && fechaInicial) {
            const dataTraslado = await mysqlClass.ejecutarQueryPreparado(`select w.Fecha,(Traslado_Hembra+ Cant_Ingreso_Hembra) Traslado_Hembra,
(Traslado_Macho+ Cant_Ingreso_Macho) Traslado_Macho from (
select Fecha,COALESCE(SUM(IF(lo.sexo = 'H',
tsv.Traslado, 0)),0)*-1 AS Traslado_Hembra,  
COALESCE(SUM(IF(lo.sexo = 'M',tsv.Traslado,0)),0)*-1 AS Traslado_Macho,
0 AS Cant_Ingreso_Hembra,
0 AS Cant_Ingreso_Macho
FROM traslado_ingreso_ventas tsv
INNER JOIN lotes lo ON lo.idLote = tsv.idLoteOrigen
WHERE (idProduccionOrigen = '${idLevante}' or idLevanteOrigen='${idLevante}')
AND (Fecha between '${fechaInicial.format("YYYY-MM-DD")}' AND '${fechaFinal.format("YYYY-MM-DD")}') 
AND lo.TipoGenero='${sexo}'
union all
SELECT Fecha,0 AS Traslado_Hembra, 0 AS Traslado_Macho,
COALESCE(SUM(IF(lo.sexo = 'H',
tsv.Cant_Ingreso, 0)),0) AS Cant_Ingreso_Hembra,   
COALESCE(SUM(IF(lo.sexo = 'M',tsv.Cant_Ingreso, 0)),0) AS Cant_Ingreso_Macho
FROM traslado_ingreso_ventas tsv INNER JOIN lotes lo ON lo.idLote = tsv.idLoteDestino
WHERE idProduccionDestino = '${idLevante}' AND Fecha between '${fechaInicial.format("YYYY-MM-DD")}' AND '${fechaFinal.format("YYYY-MM-DD")}' AND  lo.TipoGenero='${sexo}') w 
where Fecha is not null
`, {})
            for (const da of dataProcess) {
                const dataEncontrada = dataTraslado.find(d => moment(d.Fecha, 'YYYY-MM-DD').isSame(moment(da[1].value, 'DD/MM/YYYY')))
                da.push({
                    value: dataEncontrada ? Number(dataEncontrada.Traslado_Macho).toFixed(2).toLocaleString(
                        'en',
                        { minimumFractionDigits: 2 }
                    ) : 0, colSpan: 1
                })
                da.push({
                    value: dataEncontrada ? Number(dataEncontrada.Traslado_Macho).toFixed(2).toLocaleString(
                        'en',
                        { minimumFractionDigits: 2 }
                    ) : 0, colSpan: 1
                })
            }

        }
        for (const da of dataProcess) {
            const alimentoEncontrado = dataVenta.find(d => moment(d.fecha2, 'DD/MM/YYYY').isSame(moment(da[1].value, 'DD/MM/YYYY')))
            da.push({
                value: alimentoEncontrado ? Number(alimentoEncontrado.venta_hembra).toFixed(2).toLocaleString(
                    'en',
                    { minimumFractionDigits: 2 }
                ) : 0, colSpan: 1
            })
            da.push({
                value: alimentoEncontrado ? Number(alimentoEncontrado.venta_macho).toFixed(2).toLocaleString(
                    'en',
                    { minimumFractionDigits: 2 }
                ) : 0, colSpan: 1
            })
        }

        for (let i = 0; i < dataProcess.length; i++) {
            const da = dataProcess[i]
            let saldoAnteriorHembra = i == 0 ? dataInicialLevante.poblacion_inicial_hembra : dataProcess[i - 1] ? dataProcess[i - 1][7].value : 0
            let saldoAnteriorMacho = i == 0 ? dataInicialLevante.poblacion_inicial_macho : dataProcess[i - 1] ? dataProcess[i - 1][8].value : 0
            da[7].value = Number(Number(saldoAnteriorHembra) - Number(da[2].value) - Number(da[5].value) + Number(da[13].value) - Number(da[15].value)).toFixed(2).toLocaleString(
                'en',
                { minimumFractionDigits: 2 }
            )
            da[8].value = Number(Number(saldoAnteriorMacho) - Number(da[3].value) - Number(da[6].value) + Number(da[14].value) - Number(da[16].value)).toFixed(2).toLocaleString(
                'en',
                { minimumFractionDigits: 2 }
            )
            sumaTotalSaldoAvesHembra += Number(da[7].value).toFixed(2).toLocaleString(
                'en',
                { minimumFractionDigits: 2 }
            )
            sumaTotalSaldoAvesMacho += Number(da[8].value).toFixed(2).toLocaleString(
                'en',
                { minimumFractionDigits: 2 }
            )
        }

        dataProcess.unshift([{ value: "Poblacion inicial", colSpan: 7 }, { value: dataInicialLevante.poblacion_inicial_hembra, colSpan: 1 }, { value: dataInicialLevante.poblacion_inicial_macho, colSpan: 1 }, { value: "", colSpan: 1 }, { value: "", colSpan: 1 }, { value: "", colSpan: 1 }, { value: "", colSpan: 1 },])
        const dataSumMortalidad = data.reduce((prev, curr) => {
            prev.mortalidad_hembra += curr.mortalidad_hembra
            prev.mortalidad_macho += curr.mortalidad_macho

            return prev;
        }, {
            mortalidad_hembra: 0,
            mortalidad_macho: 0,
            destino: 0,
            saldo_hembra: 0,
            saldo_macho: 0,
        })
        const dataSumAlimento = dataAlimento.reduce((prev, curr) => {
            prev.alimento_hembra += curr.alimento_hembra
            prev.alimento_macho += curr.alimento_macho
            return prev
        }, { alimento_hembra: 0, alimento_macho: 0 })
        const dataSumMortalidadArray = Object.keys(dataSumMortalidad).map(d => ({
            value: Number(dataSumMortalidad[d]).toFixed(2).toLocaleString(
                'en',
                { minimumFractionDigits: 2 }
            ), colSpan: 1
        }))
        const dataSumAlimentodArray = Object.keys(dataSumAlimento).map(d => ({
            value: Number(dataSumAlimento[d]).toFixed(2).toLocaleString(
                'en',
                { minimumFractionDigits: 2 }
            ), colSpan: 1
        }))
        const ultimoSaldoHembra = dataProcess.length > 6 ? dataProcess[dataProcess.length - 1][7].value : 0
        const ultimoSaldoMacho = dataProcess.length > 6 ? dataProcess[dataProcess.length - 1][8].value : 0
        const dataTotal = [{ value: "TOTAL", colSpan: 2 }, ...dataSumMortalidadArray, {
            value: '', colSpan: 1
        }, {
            value: '', colSpan: 1
        }, ...dataSumAlimentodArray, { value: "", colSpan: 1 }, { value: "", colSpan: 1 }]
        dataProcess.push(dataTotal)
        const dataPorcentaje = [
            { value: "%", colSpan: 2 },
            {
                value: dataInicialLevante && dataInicialLevante.poblacion_inicial_hembra > 0 ? Number(Number(dataTotal[1].value) * 100 / dataInicialLevante.poblacion_inicial_hembra).toFixed(2).toLocaleString(
                    'en',
                    { minimumFractionDigits: 2 }
                ) : 0, colSpan: 1
            },
            {
                value: dataInicialLevante && dataInicialLevante.poblacion_inicial_macho > 0 ? Number(Number(dataTotal[2].value) * 100 / dataInicialLevante.poblacion_inicial_macho).toFixed(2).toLocaleString(
                    'en',
                    { minimumFractionDigits: 2 }
                ) : 0, colSpan: 1
            },
            { value: "", colSpan: 1 },
            {
                value: dataInicialLevante && dataInicialLevante.poblacion_inicial_hembra > 0 ? Number(Number(dataTotal[4].value) * 100 / dataInicialLevante.poblacion_inicial_hembra).toFixed(2).toLocaleString(
                    'en',
                    { minimumFractionDigits: 2 }
                ) : 0, colSpan: 1
            },
            {
                value: dataInicialLevante && dataInicialLevante.poblacion_inicial_macho > 0 ? Number(Number(dataTotal[5].value) * 100 / dataInicialLevante.poblacion_inicial_macho).toFixed(2).toLocaleString(
                    'en',
                    { minimumFractionDigits: 2 }
                ) : 0, colSpan: 1
            },
            {
                value: (Number(ultimoSaldoHembra) + Number(ultimoSaldoMacho)).toFixed(2), colSpan: 2
            },
            {
                value: '', colSpan: 2
            },
            { value: "", colSpan: 1 },
            { value: "", colSpan: 1 },
            { value: "", colSpan: 1 },
            { value: "", colSpan: 1 },
            { value: "", colSpan: 1 },
            { value: "", colSpan: 1 }
        ]
        dataProcess.push(dataPorcentaje)
        return { dataProcess, dataPesoAlimento }
    },
    exportarPago: async function (idCabecera) {
        try {
            const rutaTemplateHC = `./template/Plantilla Pago CTS.xlsx`;
            const detalles = await this.listarDetallesPorCabecera(idCabecera)
            const montoMensualTotal = detalles.reduce((prev, curr) => prev += curr.montoMensual, 0)
            if (fs.existsSync(`./template/Pago VACACIONES.xlsx`)) {
                fs.unlinkSync(`./template/Pago VACACIONES.xlsx`)
            }
            const borderStyles = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            const wor = await workbook.xlsx.readFile(rutaTemplateHC)
            const sheet = wor.worksheets[0];
            let initRow = 6

            for (const detalle of detalles) {
                sheet.getCell(`A${initRow}`).value = detalle.nroDni
                sheet.getCell(`A${initRow}`).border = borderStyles
                sheet.getCell(`B${initRow}`).value = detalle.nombres
                sheet.getCell(`B${initRow}`).border = borderStyles
                sheet.getCell(`C${initRow}`).value = detalle.fechaIngreso
                sheet.getCell(`C${initRow}`).border = borderStyles
                sheet.getCell(`D${initRow}`).value = detalle.fechaCese
                sheet.getCell(`D${initRow}`).border = borderStyles
                sheet.getCell(`E${initRow}`).value = detalle.area
                sheet.getCell(`E${initRow}`).border = borderStyles
                sheet.getCell(`F${initRow}`).value = detalle.montoMensual
                sheet.getCell(`F${initRow}`).border = borderStyles
                initRow++
            }
            sheet.getCell(`F${initRow}`).value = montoMensualTotal
            sheet.getCell(`F${initRow}`).border = borderStyles

            await wor.xlsx.writeFile(`./template/Pago VACACIONES.xlsx`)
            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "/supergen-be/template/Pago VACACIONES.xlsx"
            }
            return json;
        } catch (error) {
            console.log("err", error)
            throw error;
        }
    },



}

module.exports = levanteCartillaVirtual
