const moment = require("moment")
const Excel = require('exceljs');
var fs = require('fs');
const mysqlClass = require("../dbConnectionClass");
const ServerError = require("../error");

const workbook = new Excel.Workbook();
const flujoRealProyectado = {

    cartillaVirtual: async function ({ periodo, tipo, lote, sexo, edad }) {
        const { idProduccion } = lote
        const resumenProduccionHuevos = []
        let resumenPeso = { nombre: 'Peso corporal', semana: 0, TipoGenero: '', estandar_hembra: 0, estadar_macho: 0, real_macho: 0, real_hembra: 0, dif_hembra: 0, dif_macho: 0 }
        let resumenAlimento = { nombre: 'Alimentos Gr/Ave/Día', semana: 0, TipoGenero: '', estandar_hembra: 0, estadar_macho: 0, real_macho: 0, real_hembra: 0, dif_hembra: 0, dif_macho: 0 }
        let produccionHTotal = { nombre: 'Prod H. Total(%)', semana: 0, TipoGenero: '', estandar_hembra: 0, estadar_macho: 0, real_macho: 0, real_hembra: 0, dif_hembra: 0, dif_macho: 0 }
        let produccionHIncubablesTotal = { nombre: 'Prod H. Incub(%)', semana: 0, TipoGenero: '', estandar_hembra: 0, estadar_macho: 0, real_macho: 0, real_hembra: 0, dif_hembra: 0, dif_macho: 0 }
        let produccioPesoHuevo = { nombre: 'Peso Huevos(Gr)', semana: 0, TipoGenero: '', estandar_hembra: 0, estadar_macho: 0, real_macho: 0, real_hembra: 0, dif_hembra: 0, dif_macho: 0 }



        let dataDespachoMap = { saldo_anterior: 0, venta: 0, fertilidad: 0, hc_eliminados: 0, total_hc: 0, saldo_fin: 0 }
        let queryProduccionInicio = `select 
        sum(case when B.sexo='H' then A.saldo_fin_sem else 0 end) poblacion_inicial_hembra,
        sum(case when B.sexo='M' then A.saldo_fin_sem else 0 end) poblacion_inicial_macho
         from mortalidad_prod_sem A 
        left join lotes B on B.idLote=A.idLote
        where A.idProduccion='${idProduccion}' and A.semana_prod=${edad - 1} and B.TipoGenero='${sexo}'
        
        `
        if (edad == 25) {
            queryProduccionInicio = `select 
            sum(case when A.sexo='H' then A.Num_Aves_Fin_Levante else 0 end) poblacion_inicial_hembra,
            sum(case when A.sexo='M' then A.Num_Aves_Fin_Levante else 0 end) poblacion_inicial_macho
            from lotes A where A.idProduccion=${idProduccion} and A.TipoGenero='${sexo}'
            `
        }

        const dataResumenPhi = await mysqlClass.ejecutarQueryPreparado(`select idProduccion,IdLote,max(fechaRegistro) Fecha,Semana  Edad,
sum(HNI_Comercial) Piso, 
case when sum(TotalDiarioProd_Huevo)<>0 then round( (sum(HNI_Comercial)/sum(TotalDiarioProd_Huevo))*100,2) else 0 end porc_piso,
sum(HNI_DY) doble_yema,
case when sum(HNI_DY)<>0 then round( (sum(HNI_DY)/sum(TotalDiarioProd_Huevo))*100,2) else 0 end porc_doble_yema,
sum(HNI_Comercial)+sum(HNI_DY) total1,
sum(HNI_Roto) Roto,
case when sum(HNI_Roto)<>0 then round( (sum(HNI_Roto)/sum(TotalDiarioProd_Huevo))*100,2) else 0 end porc_roto,
sum(HNI_Farf) farfara,
case when sum(HNI_Farf)<>0 then round( (sum(HNI_Farf)/sum(TotalDiarioProd_Huevo))*100,2) else 0 end porc_farfara,
 sum(TotalHI) totalHI,
case when sum(TotalHI)<>0 then round( (sum(TotalHI)/sum(TotalDiarioProd_Huevo))*100,2) else 0 end porc_totalhi,
 sum(TotalDiarioProd_Huevo) produccion_total  from (
select A.idProduccion,A.IdLote,A.Semana,A.Edad, 
A.TotalDiarioProd_Huevo,  A.TotalHI,PorHI ,
A.HNI_Comercial,A.HNI_DY,A.HNI_Roto,(coalesce(HNI_Farf,0)+HNI_Elim) HNI_Farf,A.fechaRegistro,
A.TotalHI Cantidad
from supergen.produccion_huevos_det A 
left join supergen.lotes B on B.idLote=A.idLote
where A.idProduccion=${idProduccion} and A.semana_prod=${edad} 
and B.TipoGenero='${sexo}' 
)w
group by idProduccion,IdLote,Semana
`, {})

        const resumenPesoBd = await mysqlClass.ejecutarQueryPreparado(`select 'Peso corporal' as nombre,idProduccion, semana,TipoGenero ,
sum(peso_real_hembra)  as real_hembra, sum(peso_real_macho)  as real_macho,
sum(peso_standard_hembra) estandar_hembra, sum(peso_standard_macho) estandar_macho,
sum(peso_dif_hembra) dif_hembra, sum(peso_dif_macho) dif_macho from (
select A.idProduccion, A.semana,B.TipoGenero ,
case when B.sexo='H' then A.peso_actual_ave else 0 end peso_real_hembra,
case when B.sexo='M' then A.peso_actual_ave else 0 end peso_real_macho,
case when B.sexo='H' then A.peso_standard_ave else 0 end peso_standard_hembra,
case when B.sexo='M' then A.peso_standard_ave else 0 end peso_standard_macho,
case when B.sexo='H' then A.peso_dif_ave else 0 end peso_dif_hembra,
case when B.sexo='M' then A.peso_dif_ave else 0 end peso_dif_macho
from peso_semana_prod_det A
left join lotes B on B.idLote=A.idLote
where A.idProduccion='${idProduccion}' and A.Semana=${edad} and B.TipoGenero='${sexo}'
)w
group by idProduccion, Semana,TipoGenero;`, {}, true)
        const produccionHTotalBd = await mysqlClass.ejecutarQueryPreparado(`select 'Prod H. Total(%)' as nombre, idProduccion, semana,TipoGenero ,
        sum(peso_real_hembra) real_hembra, sum(peso_real_macho) real_macho,
        sum(peso_standard_hembra) estandar_hembra, sum(peso_standard_macho) estandar_huevo_macho,
        sum(peso_dif_hembra) dif_hembra, sum(peso_dif_macho) dif_macho from (
        select A.idProduccion, A.semana,B.TipoGenero ,
        case when B.sexo='H' then A.peso_actual_huevo else 0 end peso_real_hembra,
        case when B.sexo='M' then A.peso_actual_huevo else 0 end peso_real_macho,
        case when B.sexo='H' then A.peso_standard_huevo else 0 end peso_standard_hembra,
        case when B.sexo='M' then A.peso_standard_huevo else 0 end peso_standard_macho,
        case when B.sexo='H' then A.peso_dif_huevo else 0 end peso_dif_hembra,
        case when B.sexo='M' then A.peso_dif_huevo else 0 end peso_dif_macho
        from peso_semana_prod_det A
        left join lotes B on B.idLote=A.idLote
        where A.idProduccion='${idProduccion}' and A.Semana=${edad} and B.TipoGenero='${sexo}'
        )w
        group by idProduccion, Semana,TipoGenero
        
`, {}, true)
        const produccioPesoHuevoBd = await mysqlClass.ejecutarQueryPreparado(`select 'Peso Huevos(Gr)' as nombre,idProduccion, semana_prod,TipoGenero ,
sum(ph_total_hembra) real_hembra, sum(ph_total_macho) real_macho,
sum(ph_total_STD_hembra) estanda_hembra, sum(ph_total_STD_macho) estandar_macho,
round(case when sum(ph_total_STD_hembra) <>0 then ((sum(ph_total_hembra) - sum(ph_total_STD_hembra))/sum(ph_total_STD_hembra)) *100  else 0 end,2) dif_hembra,
round(case when sum(ph_total_STD_macho) <>0 then ((sum(ph_total_macho) - sum(ph_total_STD_macho))/sum(ph_total_STD_macho)) *100  else 0 end,2) dif_macho
from (
select A.idProduccion, A.semana_prod,B.TipoGenero ,
case when B.sexo='H' then A.Act_Avedia else 0 end ph_total_hembra,
case when B.sexo='M' then A.Act_Avedia else 0 end ph_total_macho,
case when B.sexo='H' then A.STD_Act_Avedia else 0 end ph_total_STD_hembra,
case when B.sexo='M' then A.STD_Act_Avedia else 0 end ph_total_STD_macho
from produccion_huevos_sem A
left join lotes B on B.idLote=A.idLote
where A.idProduccion='${idProduccion}' and A.semana_prod=${edad} and B.TipoGenero='${sexo}'
)w
group by idProduccion, semana_prod,TipoGenero
`, {}, true)

        const resumenAlimentoBd = await mysqlClass.ejecutarQueryPreparado(`select 'Alimentos Gr/Ave/Día' as nombre,idProduccion, semana,TipoGenero ,
        sum(CantRealAlimento_hembra) real_hembra, sum(CantRealAlimento_macho) real_macho,
        sum(STD_hembra) estandar_hembra, sum(STD_macho) estandar_macho,
        round(case when sum(STD_hembra) <>0 then ((sum(CantRealAlimento_hembra) - sum(STD_hembra))/sum(STD_hembra)) *100  else 0 end,2) dif_hembra,
        round(case when sum(STD_macho) <>0 then ((sum(CantRealAlimento_macho) - sum(STD_macho))/sum(STD_macho)) *100  else 0 end,2) dif_macho
        from (
        select A.idProduccion, A.semana,B.TipoGenero ,
        case when B.sexo='H' then A.Ave_Dia_Gr_Grafico else 0 end CantRealAlimento_hembra,
        case when B.sexo='M' then A.Ave_Dia_Gr_Grafico else 0 end CantRealAlimento_macho,
        case when B.sexo='H' then A.STD else 0 end STD_hembra,case when B.sexo='M' then A.STD else 0 end STD_macho
        from alimento_prod_sem A left join lotes B on B.idLote=A.idLote
        where A.idProduccion='${idProduccion}' and A.semana=${edad} and B.TipoGenero='${sexo}'
        )w group by idProduccion, semana,TipoGenero
        `, {}, true)
        const produccionHIncubablesTotalBd = await mysqlClass.ejecutarQueryPreparado(`select 'Prod H. Incub(%)' as nombre,idProduccion, semana_prod,TipoGenero ,
        sum(phi_total_hembra) real_hembra, sum(phi_total_macho) real_macho,
        sum(phi_total_STD_hembra) estandar_hembra, sum(phi_total_STD_macho) estdandar_macho,
        round(case when sum(phi_total_STD_hembra) <>0 then ((sum(phi_total_hembra) - sum(phi_total_STD_hembra))/sum(phi_total_STD_hembra)) *100  else 0 end,2) dif_hembra,
        round(case when sum(phi_total_STD_macho) <>0 then ((sum(phi_total_macho) - sum(phi_total_STD_macho))/sum(phi_total_STD_macho)) *100  else 0 end,2) dif_macho
        from (
        select A.idProduccion, A.semana_prod,B.TipoGenero ,
        case when B.sexo='H' then A.PorHI else 0 end phi_total_hembra,
        case when B.sexo='M' then A.PorHI else 0 end phi_total_macho,
        case when B.TipoGenero='LH' then (select Porc_hi from standard_prod_hembra where idProd=28) 
        else case when B.TipoGenero='LM' then (select Porc_hi from standard_prod_macho where idProd=28) else 0 end  end phi_total_STD_hembra,
        0 phi_total_STD_macho
        from produccion_huevos_sem A
        left join lotes B on B.idLote=A.idLote
        where A.idProduccion='${idProduccion}' and A.semana_prod=${edad} and B.TipoGenero='${sexo}'
        )w
        group by idProduccion, semana_prod,TipoGenero
        
        
        `, {}, true)


        const dataInicialProduccion = await mysqlClass.ejecutarQueryPreparado(queryProduccionInicio, {}, true)
        let data = await mysqlClass.ejecutarQueryPreparado(`select idProduccion, semana,semana_prod,TipoGenero,nombre_dia,fecha2,
sum(mortalidad_hembra) mortalidad_hembra,
sum(mortalidad_macho) mortalidad_macho ,
sum(descarte_hembra) descarte_hembra,
sum(descarte_macho) descarte_macho from (
select A.idProduccion, A.semana,A.semana_prod,B.TipoGenero ,
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
from mortalidad_prod_det A 
left join lotes B on B.idLote=A.idLote
where A.idProduccion='${idProduccion}' and A.semana_prod=${edad} and B.TipoGenero='${sexo}'
)w
group by idProduccion, semana,semana_prod,TipoGenero,nombre_dia,fecha2
order by fecha2
`, {})
        const dataHuevosIncubables = await mysqlClass.ejecutarQueryPreparado(`select A.idProduccion,A.IdLote,A.Semana,A.Edad, 
CASE DAYOFWEEK(STR_TO_DATE(A.fechaRegistro, '%d-%m-%Y'))
 WHEN 1 THEN 'Domingo'
 WHEN 2 THEN 'Lunes'
 WHEN 3 THEN 'Martes'
 WHEN 4 THEN 'Miércoles'
 WHEN 5 THEN 'Jueves'
 WHEN 6 THEN 'Viernes'
 WHEN 7 THEN 'Sábado'  END nombre_dia,
A.TotalDiarioProd_Huevo,  A.TotalHI,PorHI ,
A.HNI_Comercial,A.HNI_DY,A.HNI_Roto,(coalesce(HNI_Farf,0)+HNI_Elim) HNI_Farf,A.fechaRegistro,
A.TotalHI Cantidad
from supergen.produccion_huevos_det A  left join supergen.lotes B on B.idLote=A.idLote
where A.idProduccion=${idProduccion} and A.semana_prod=${edad}  and B.TipoGenero='${sexo}' order by A.fechaRegistro;
`, {})
        let dataProcess = data.map(d => (
            [{ value: d.nombre_dia, colSpan: 1 },
            { value: d.fecha2, colSpan: 1 },
            { value: d.mortalidad_hembra, colSpan: 1 },
            { value: d.mortalidad_macho, colSpan: 1 },
            { value: "", colSpan: 1 },
            { value: d.descarte_hembra, colSpan: 1 },
            { value: d.descarte_macho, colSpan: 1 },
            { value: 0, colSpan: 1 },
            { value: 0, colSpan: 1 }]))

        const fechaInicial = data.length > 0 ? moment(data[0].fecha2, 'DD/MM/YYYY') : null
        const fechaFinal = data.length > 0 ? moment(data[data.length - 1].fecha2, 'DD/MM/YYYY') : null
        const dataAlimento = await mysqlClass.ejecutarQueryPreparado(`select idProduccion, semana,semana_prod,TipoGenero,fecha2,
(SELECT GROUP_CONCAT(DISTINCT tipoalimento_hembra ORDER BY tipoalimento_hembra asc SEPARATOR '- ')w )  tipoalimento_hembra ,
(SELECT GROUP_CONCAT(DISTINCT tipoalimento_macho ORDER BY tipoalimento_macho asc SEPARATOR '- ')w )  tipoalimento_macho ,
sum(alimento_hembra) alimento_hembra, sum(alimento_macho) alimento_macho from (  
select A.idProduccion, A.semana,A.semana_prod,B.TipoGenero , date_format(A.fecha, "%d/%m/%Y") fecha2,
A.idAlimento,
case when B.sexo='H' then C.nombreAlimento else '' end tipoalimento_hembra,
case when B.sexo='M' then C.nombreAlimento else '' end tipoalimento_macho,

case when B.sexo='H' then A.CantAlimento else 0 end alimento_hembra,
case when B.sexo='M' then A.CantAlimento else 0 end alimento_macho
from alimento_prod_det A
left join lotes B on B.idLote=A.idLote
left join tipo_alimento C on C.idAlimento=A.idAlimento
where A.idProduccion='${idProduccion}' and A.semana_prod=${edad} and B.TipoGenero='${sexo}' and coalesce(A.CantAlimento,0)>0
)w
group by idProduccion, semana,semana_prod,TipoGenero,fecha2
order by fecha2
`, {})

        if (resumenPesoBd) {
            resumenPeso = resumenPesoBd

        }
        if (resumenAlimentoBd) {
            resumenAlimento = resumenAlimentoBd
        }
        if (produccionHTotalBd) {
            produccionHTotal = produccionHTotalBd
        }
        if (produccionHIncubablesTotalBd) {
            produccionHIncubablesTotal = produccionHIncubablesTotalBd
        }
        if (produccioPesoHuevoBd) {
            produccioPesoHuevo = produccioPesoHuevoBd
        }
        resumenProduccionHuevos.push(resumenPeso)
        resumenProduccionHuevos.push(resumenAlimento)
        resumenProduccionHuevos.push(produccionHTotal)
        resumenProduccionHuevos.push(produccionHIncubablesTotal)
        resumenProduccionHuevos.push(produccioPesoHuevo)
        let dataComprobantes = []


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
            const dataDespachoBd = await mysqlClass.ejecutarQueryPreparado(`select idProduccion,IdLote,saldo_anterior,venta,fertilidad,hc_eliminados,total_hc ,
            (saldo_anterior+total_hc-venta-fertilidad) saldo_fin 
            from (                             
            select idProduccion,IdLote,sum(HNI_Comercial) + sum(HNI_DY) -
            (select sum(case when TipoOperacion='V' then Cantidad else 0 end) +
                   sum(case when TipoOperacion='PF' then Cantidad else 0 end)  
            from salidas_huevos_comerciales A INNER JOIN lotes B ON B.idLote = A.idLote
                                        WHERE B.idProduccion = ${idProduccion} and B.TipoGenero='${sexo}'
                                        and A.Fecha<'${fechaInicial.format("YYYY-MM-DD")}')  saldo_anterior,
            
             (select sum(case when TipoOperacion='V' then Cantidad else 0 end) 
            from salidas_huevos_comerciales A INNER JOIN lotes B ON B.idLote = A.idLote
                                        WHERE A.Fecha BETWEEN '${fechaInicial.format("YYYY-MM-DD")}' and '${fechaFinal.format("YYYY-MM-DD")}'
                                        and B.idProduccion = ${idProduccion} and B.TipoGenero='${sexo}') venta,
            
             (select  sum(case when TipoOperacion='PF' then Cantidad else 0 end) 
            from salidas_huevos_comerciales A INNER JOIN lotes B ON B.idLote = A.idLote
                                        WHERE A.Fecha BETWEEN '${fechaInicial.format("YYYY-MM-DD")}' and '${fechaFinal.format("YYYY-MM-DD")}'
                                        and B.idProduccion = ${idProduccion} and B.TipoGenero='${sexo}') fertilidad,
            
            (select sum(HNI_Roto) +sum(HNI_Farf)   from (
            select A.idProduccion,A.IdLote,A.Semana,A.Edad, 
            A.TotalDiarioProd_Huevo,  A.TotalHI,PorHI ,
            A.HNI_Comercial,A.HNI_DY,A.HNI_Roto,(coalesce(HNI_Farf,0)+HNI_Elim) HNI_Farf,A.fechaRegistro,
            A.TotalHI Cantidad
            from supergen.produccion_huevos_det A 
            left join supergen.lotes B on B.idLote=A.idLote
            where A.idProduccion = ${idProduccion} and A.semana_prod=${edad} 
            and B.TipoGenero='${sexo}' 
            )w
            group by idProduccion,IdLote,Semana) hc_eliminados,
            
            (select sum(HNI_Comercial) +sum(HNI_DY)   from (
            select A.idProduccion,A.IdLote,A.Semana,A.Edad, 
            A.TotalDiarioProd_Huevo,  A.TotalHI,PorHI ,
            A.HNI_Comercial,A.HNI_DY,A.HNI_Roto,(coalesce(HNI_Farf,0)+HNI_Elim) HNI_Farf,A.fechaRegistro,
            A.TotalHI Cantidad
            from supergen.produccion_huevos_det A 
            left join supergen.lotes B on B.idLote=A.idLote
            where A.idProduccion = ${idProduccion} and A.semana_prod=${edad} 
            and B.TipoGenero='${sexo}' 
            )w
            group by idProduccion,IdLote,Semana) total_hc
              from (
            select A.idProduccion,A.IdLote,A.Semana,A.Edad, 
            A.TotalDiarioProd_Huevo,  A.TotalHI,PorHI ,
            A.HNI_Comercial,A.HNI_DY,A.HNI_Roto,(coalesce(HNI_Farf,0)+HNI_Elim) HNI_Farf,A.fechaRegistro,
            A.TotalHI Cantidad
            from supergen.produccion_huevos_det A 
            left join supergen.lotes B on B.idLote=A.idLote
            where A.idProduccion = ${idProduccion} and A.semana_prod<${edad} 
            and B.TipoGenero='${sexo}' 
            )w
            group by idProduccion,IdLote
            )
            t
            `, {}, true)
            dataDespachoMap = dataDespachoBd
            const dataTraslado = await mysqlClass.ejecutarQueryPreparado(`select w.Fecha,destino,(Traslado_Hembra+ Cant_Ingreso_Hembra) Traslado_Hembra,
            (Traslado_Macho+ Cant_Ingreso_Macho) Traslado_Macho ,VentasLH Ventas_Hembra,VentasLM Ventas_Macho
from (
            select Fecha,dt.lote destino ,COALESCE(SUM(IF(lo.sexo = 'H',
            tsv.Traslado, 0)),0)*-1 AS Traslado_Hembra,  
            COALESCE(SUM(IF(lo.sexo = 'M',tsv.Traslado,0)),0)*-1 AS Traslado_Macho,
            0 AS Cant_Ingreso_Hembra,                                0 AS Cant_Ingreso_Macho,
COALESCE(SUM(IF(lo.TipoGenero = "LH",tsv.Venta, 0)
            ),0) AS VentasLH,
COALESCE(SUM(IF(lo.TipoGenero = "LM",tsv.Venta, 0)),0) AS VentasLM
            FROM traslado_ingreso_ventas tsv
            INNER JOIN lotes lo ON lo.idLote = tsv.idLoteOrigen
            left JOIN lotes dt ON dt.idLote = tsv.idLoteDestino

            WHERE (idProduccionOrigen = '${idProduccion}' ) and lo.TipoGenero='${sexo}'
            AND (Fecha between '${fechaInicial.format("YYYY-MM-DD")}' AND '${fechaFinal.format("YYYY-MM-DD")}') 
            union all
            SELECT Fecha,dt.lote destino,0 AS Traslado_Hembra, 0 AS Traslado_Macho,
            COALESCE(SUM(IF(lo.sexo = "H",
            tsv.Cant_Ingreso, 0)),0) AS Cant_Ingreso_Hembra,   
            COALESCE(SUM(IF(lo.sexo = 'M',tsv.Cant_Ingreso, 0)),0) AS Cant_Ingreso_Macho,
0 AS VentaLH, 0 AS VentaLM
            FROM traslado_ingreso_ventas tsv INNER JOIN lotes lo ON lo.idLote = tsv.idLoteDestino
            left JOIN lotes dt ON dt.idLote = tsv.idLoteDestino
            WHERE idProduccionDestino = '${idProduccion}' and lo.TipoGenero='${sexo}'
            AND Fecha between '${fechaInicial.format("YYYY-MM-DD")}' AND '${fechaFinal.format("YYYY-MM-DD")}'
) w 
            where Fecha is not null

`, {})


            for (const da of dataProcess) {
                const dataEncontrada = dataTraslado.find(d => moment(d.Fecha, 'YYYY-MM-DD').isSame(moment(da[1].value, 'DD/MM/YYYY')))
                da.push({
                    value: dataEncontrada ? Number(dataEncontrada.Traslado_Hembra).toFixed(2).toLocaleString(
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
                da.push({
                    value: dataEncontrada ? Number(dataEncontrada.Ventas_Hembra).toFixed(2).toLocaleString(
                        'en',
                        { minimumFractionDigits: 2 }
                    ) : 0, colSpan: 1
                })
                da.push({
                    value: dataEncontrada ? Number(dataEncontrada.Ventas_Macho).toFixed(2).toLocaleString(
                        'en',
                        { minimumFractionDigits: 2 }
                    ) : 0, colSpan: 1
                })
            }

            const dataComprobantesBd = await mysqlClass.ejecutarQueryPreparado(`select DATE_FORMAT(A.fecha_comprobante,'%Y-%m-%d') as fechaComprobante, max(A.concar) nrocomprobante,'PLANTA INCUBACION' Destino 
            from facturacion.doc_electronico A
            where A.fecha_comprobante>='${fechaInicial.format("YYYY-MM-DD")}' and A.fecha_comprobante<='${fechaFinal.format("YYYY-MM-DD")}' and A.serie_comprobante='T006'
            and A.id_motivotraslado='04'
            group by A.fecha_comprobante
            order by A.fecha_comprobante
            `, {})
            dataComprobantes = dataComprobantesBd
        }

        for (let i = 0; i < dataProcess.length; i++) {
            const da = dataProcess[i]
            let saldoAnteriorHembra = i == 0 ? dataInicialProduccion.poblacion_inicial_hembra : dataProcess[i - 1] ? dataProcess[i - 1][7].value : 0
            let saldoAnteriorMacho = i == 0 ? dataInicialProduccion.poblacion_inicial_macho : dataProcess[i - 1] ? dataProcess[i - 1][8].value : 0
            da[7].value = Number(Number(saldoAnteriorHembra) - Number(da[2].value) - Number(da[5].value) + Number(da[13].value) - Number(da[15].value)).toFixed(2).toLocaleString(
                'en',
                { minimumFractionDigits: 2 }
            )
            da[8].value = Number(Number(saldoAnteriorMacho) - Number(da[3].value) - Number(da[6].value) + Number(da[14].value) - Number(da[16].value)).toFixed(2).toLocaleString(
                'en',
                { minimumFractionDigits: 2 }
            )
        }
        const dDespacho = [{ nombreDespacho: 'Saldo Anterior Huevo Comercial (Granja)', valorDespacho: dataDespachoMap.saldo_anterior },
        { nombreDespacho: 'Venta de Huevo Comercial - Normal', valorDespacho: dataDespachoMap.venta },
        { nombreDespacho: 'Venta de Huevo Comercial.- Doble Yema', valorDespacho: 0 },
        { nombreDespacho: 'Prueba fertilidad', valorDespacho: dataDespachoMap.fertilidad },
        { nombreDespacho: 'Huevo Comercial Eliminado(Roto, fisura)', valorDespacho: dataDespachoMap.hc_eliminados },
        { nombreDespacho: 'Saldo Huevo Comercial(Granja)', valorDespacho: dataDespachoMap.saldo_fin },
        ]

        let dataProduccionHuevosMap = dataHuevosIncubables.map((d, index) => {
            const fechaRegistro = moment(d.fechaRegistro, "DD-MM-YYYY")
            const dataComprobante = dataComprobantes.find(d => d.fechaComprobante == fechaRegistro.format("YYYY-MM-DD"))
            const saldoAves = dataProcess.find(d => {
                const fechaMap = moment(d[1].value, 'DD/MM/YYYY')
                return fechaRegistro.isSame(fechaMap)
            })
            const valorDespacho = dDespacho[index]
            return {
                ...d, fechaRegistro: fechaRegistro.format("YYYY-MM-DD"), porcentaje: saldoAves && Number(saldoAves.length) > 6 ? Number(d.TotalDiarioProd_Huevo / Number(saldoAves[7].value) * 100).toFixed(2) : 0,
                fechaComprobante: dataComprobante ? dataComprobante.fechaComprobante : '',
                cantidadComprobante: dataComprobante ? d.TotalHI : 0,
                guiaComprobante: dataComprobante ? dataComprobante.nrocomprobante : '',
                destino: dataComprobante ? dataComprobante.Destino : '',
                ...valorDespacho
            }
        })
        const sumaTotalDataProduccion = dataProduccionHuevosMap.reduce((prev, curr) => {
            prev.TotalDiarioProd_Huevo += curr.TotalDiarioProd_Huevo
            prev.porcentaje += Number(curr.porcentaje)
            prev.TotalHI += curr.TotalHI
            prev.PorHI += curr.PorHI
            prev.HNI_Comercial += curr.HNI_Comercial
            prev.HNI_DY += curr.HNI_DY
            prev.HNI_Roto += curr.HNI_Roto
            prev.HNI_Farf += curr.HNI_Farf
            prev.cantidadComprobante += curr.cantidadComprobante
            return prev;
        }, {
            cantidadComprobante: 0,
            TotalDiarioProd_Huevo: 0,
            porcentaje: 0,
            TotalHI: 0,
            PorHI: 0,
            HNI_Comercial: 0,
            HNI_DY: 0,
            HNI_Roto: 0,
            HNI_Farf: 0
        })
        dataProduccionHuevosMap.push({
            ...sumaTotalDataProduccion, porcentaje: dataProduccionHuevosMap.length > 0 ? Number(sumaTotalDataProduccion.porcentaje / dataProduccionHuevosMap.length).toFixed(2) : 0,
            PorHI: dataProduccionHuevosMap.length > 0 ? Number(sumaTotalDataProduccion.PorHI / dataProduccionHuevosMap.length).toFixed(2) : 0,
            nombre_dia: 'Total', fechaRegistro: '',

        })
        dataProcess.unshift([{ value: "Poblacion inicial", colSpan: 7 },
        { value: dataInicialProduccion.poblacion_inicial_hembra, colSpan: 1 },
        { value: dataInicialProduccion.poblacion_inicial_macho, colSpan: 1 },
        { value: "", colSpan: 1 }, { value: "", colSpan: 1 }, { value: "", colSpan: 1 },
        { value: "", colSpan: 1 },
        { value: "", colSpan: 1 },
        { value: "", colSpan: 1 },
        { value: "", colSpan: 1 },
        { value: "", colSpan: 1 }])
        const dataSumMortalidad = data.reduce((prev, curr) => {
            prev.mortalidad_hembra += curr.mortalidad_hembra
            prev.mortalidad_macho += curr.mortalidad_macho
            prev.descarte_macho += curr.descarte_macho
            prev.descarte_hembra += curr.descarte_hembra
            return prev;
        }, {
            mortalidad_hembra: 0,
            mortalidad_macho: 0,
            destino: 0,
            descarte_hembra: 0,
            descarte_macho: 0,
            saldo_hembra: 0,
            saldo_macho: 0,
        })
        const dataSumAlimento = dataAlimento.reduce((prev, curr) => {
            prev.alimento_hembra += curr.alimento_hembra
            prev.alimento_macho += curr.alimento_macho
            return prev
        }, { alimento_hembra: 0, alimento_macho: 0 })
        const dataSumMortalidadArray = Object.keys(dataSumMortalidad).map(d => ({ value: Number(dataSumMortalidad[d].toFixed(2)), colSpan: 1 }))
        const dataSumAlimentodArray = Object.keys(dataSumAlimento).map(d => ({ value: Number(dataSumAlimento[d].toFixed(2)), colSpan: 1 }))
        dataProcess.push([{ value: "", colSpan: 1 }, { value: "TOTAL", colSpan: 1 }, ...dataSumMortalidadArray, ...dataSumAlimentodArray, { value: "", colSpan: 1 }, { value: "", colSpan: 1 }])
        return { data: dataProcess, dataProduccionHuevos: dataProduccionHuevosMap, dataResumenPhi, resumenProduccionHuevos }
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

module.exports = flujoRealProyectado
