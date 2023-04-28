var db = require('../dbconnection');

var Aviagen = {
    LOP_L: async function(Data) {
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
        let lotes = await db.query(`SELECT * FROM lotes lo
        INNER JOIN levantes le ON le.idLevante = lo.idLevante
        INNER JOIN galpones ga ON ga.idGalpon = lo.idGalpon
        INNER JOIN granjas gr ON gr.idGranja = lo.idGranja
        INNER JOIN lineas li ON li.idLinea = lo.idLinea
        WHERE lo.idLevante != 1
        ORDER BY CorrelativoLote`)
        let array = [];
        let array2 = [];
        for (let i = 0; i < lotes.length; i++) {
            const e = lotes[i];
            let r = await db.query(`SELECT * 
            FROM data_aviagen da
            INNER JOIN lotes lo ON lo.idLote = da.idLote
            INNER JOIN usuario us ON us.idUsuario = da.idUser
            WHERE da.idLote = ? and da.LOP = 'L'`,[e.idLote]);
            if(r.length == 0){
                let mortalidad = await db.query(`SELECT * FROM 
                mortalidadsem WHERE idLote = ? ORDER BY Semana`,[e.idLote]);
                let ultimaSemana = mortalidad[mortalidad.length-1].Semana;
                let cantidad_days = await db.query(`SELECT COUNT(DISTINCT(Edad)) as cant_days
                FROM mortalidad_det md
                WHERE md.idLote = ? and md.Semana = ?
                GROUP BY md.Semana`, [e.idLote, ultimaSemana]);
                if (cantidad_days[0].cant_days < 7) {
                    mortalidad.pop();
                    ultimaSemana = ultimaSemana - 1;
                }
                let alimentos = await db.query(`SELECT * FROM 
                alimento_levante_sem WHERE idLote = ? and Semana <= ? ORDER BY Semana`,
                [e.idLote, ultimaSemana]);
                let pesos = await db.query(`SELECT * FROM 
                peso_semana_det WHERE idLote = ? and Semana <= ? ORDER BY Semana`,
                [e.idLote,ultimaSemana])
                array.push({
                    Tipo : Data.Tipo,
                    lote_info : e,
                    mortalidad,
                    alimentos,
                    pesos,
                    ultimaSemana
                })
            }else{
                array2.push(r[0]);
                let ultimaSemana_R = r[0].SemanaUltima;
                let mortalidad = await db.query(`SELECT * FROM 
                mortalidadsem WHERE idLote = ? and Semana > ? ORDER BY Semana`,
                [e.idLote,ultimaSemana_R]);
                if(mortalidad.length != 0){
                    let ultimaSemana = mortalidad[mortalidad.length-1].Semana;
                    let cantidad_days = await db.query(`SELECT COUNT(DISTINCT(Edad)) as cant_days
                    FROM mortalidad_det md
                    WHERE md.idLote = ? and md.semana = ?
                    GROUP BY md.semana`, [e.idLote, ultimaSemana]);
                    // console.log('cantidad_days :>> ', cantidad_days);
                    if (cantidad_days[0].cant_days < 7) {
                        mortalidad.pop();
                        ultimaSemana = ultimaSemana - 1;
                    }
                    let ultimodia = await db.query(`SELECT idLote, fecha
                    FROM mortalidad_det
                    WHERE idLote = ? and semana = ? and Edad = ?`, 
                    [e.idLote, ultimaSemana_R+1, (7*(ultimaSemana_R+1)-6)])
                    let fecha = ultimodia[0].fecha;
                    let alimentos = await db.query(`SELECT * FROM 
                    alimento_levante_sem WHERE idLote = ? and Semana <= ? and Semana > ? ORDER BY Semana`,
                    [e.idLote, ultimaSemana, ultimaSemana_R]);
                    let pesos = await db.query(`SELECT * FROM 
                    peso_semana_det WHERE idLote = ? and Semana <= ? and Semana > ? ORDER BY Semana`,
                    [e.idLote,ultimaSemana, ultimaSemana_R])
                    e.FechaIniLevante = fecha;
                    array.push({
                        Tipo : Data.Tipo,
                        lote_info : e,
                        mortalidad,
                        alimentos,
                        pesos,
                        ultimaSemana
                    })
                }
            }
        }
        let rows = [];
        for (let w = 0; w < array.length; w++) {
            const e = array[w];
            let alimentosem = e.alimentos
            let mortalidadsem = e.mortalidad
            let pesosem = e.pesos
            let fe = new Date(e.lote_info.FechaIniLevante);
            for (let i = 0; i < mortalidadsem.length; i++) {
                const element = alimentosem[i];
                const element2 = mortalidadsem[i];
                const element3 = pesosem[i];
                if (i == 0) {
                    fe.setDate(fe.getDate() + 6);
                } else {
                    fe.setDate(fe.getDate() + 7);
                }
                var f = formatDate(fe);
                if (element2.PorcAcumSelGen == null) {
                    element2.PorcAcumSelGen = 0;
                }
                if (element2.PorcAcumErSex == null) {
                    element2.PorcAcumErSex = 0
                }
                if (element2.PorcAcumEliminados == null) {
                    element2.PorcAcumEliminados = 0
                }
                if (element2.PorcMortalidadTot == null) {
                    element2.PorcMortalidadTot = 0
                }
                var selecccionGen = 0;
                if (e.lote_info.SeleccionGenetica == 1) {
                    selecccionGen = true;
                } else {
                    selecccionGen = false;
                }
                let json = {}
                if (typeof element3 == "undefined" && typeof element == "undefined") {
                    json = {
                        Semana: element2.Semana,
                        saldo_fin_sem: element2.saldo_fin_sem,
                        NoAves: element2.NoAves,
                        PorcMortalidad: element2.PorcMortalidad,
                        PorcAcumMortalidad: element2.PorcAcumMortalidad,
                        SelGen: element2.SelGen,
                        PorcSelGen: element2.PorcSelGen,
                        PorcAcumSelGen: element2.PorcAcumSelGen,
                        ErSex: element2.ErSex,
                        PorcErSex: element2.PorcErSex,
                        PorcAcumErSex: element2.PorcAcumErSex,
                        NoEliminados: element2.NoEliminados,
                        PorcEliminados: element2.PorcEliminados,
                        PorcAcumEliminados: element2.PorcAcumEliminados,
                        PorcMortalidadTot: element2.PorcMortalidadTot,
                        CantAlimentoSem: 0,
                        CantAcumAlimento: 0,
                        CantRealAlimento: 0,
                        CantIncreAlimento: 0,
                        STD: 0,
                        CantIncreSTD: 0,
                        IncrementoSTDG_A: 0,
                        descripAlimento: '-',
                        peso_actual: 0,
                        peso_standard: 0,
                        peso_dif: 0,
                        uniformidad: 0,
                        ganancia_real: 0,
                        ganancia_std: 0,
                        Coef_V: 0,
                        SeleccionGenetica: selecccionGen
                    }
                } else if (typeof element3 == "undefined") {
                    json = {
                        Semana: element2.Semana,
                        saldo_fin_sem: element2.saldo_fin_sem,
                        NoAves: element2.NoAves,
                        PorcMortalidad: element2.PorcMortalidad,
                        PorcAcumMortalidad: element2.PorcAcumMortalidad,
                        SelGen: element2.SelGen,
                        PorcSelGen: element2.PorcSelGen,
                        PorcAcumSelGen: element2.PorcAcumSelGen,
                        ErSex: element2.ErSex,
                        PorcErSex: element2.PorcErSex,
                        PorcAcumErSex: element2.PorcAcumErSex,
                        NoEliminados: element2.NoEliminados,
                        PorcEliminados: element2.PorcEliminados,
                        PorcAcumEliminados: element2.PorcAcumEliminados,
                        PorcMortalidadTot: element2.PorcMortalidadTot,
                        CantAlimentoSem: element.CantAlimentoSem,
                        CantAcumAlimento: element.CantAcumAlimento,
                        CantRealAlimento: element.CantRealAlimento,
                        CantIncreAlimento: element.CantIncreAlimento,
                        STD: element.STD,
                        CantIncreSTD: element.CantIncreSTD,
                        IncrementoSTDG_A: element.IncrementoSTDG_A,
                        descripAlimento: element.descripAlimento,
                        peso_actual: 0,
                        peso_standard: 0,
                        peso_dif: 0,
                        uniformidad: 0,
                        ganancia_real: 0,
                        ganancia_std: 0,
                        Coef_V: 0,
                        SeleccionGenetica: selecccionGen
                    }
                } else if (typeof element == "undefined") {
                    if (element3.ganancia_real == null) {
                        element3.ganancia_real = 0;
                    }
                    if (element3.ganancia_std == null) {
                        element3.ganancia_std = 0;
                    }
                    json = {
                        Semana: element2.Semana,
                        saldo_fin_sem: element2.saldo_fin_sem,
                        NoAves: element2.NoAves,
                        PorcMortalidad: element2.PorcMortalidad,
                        PorcAcumMortalidad: element2.PorcAcumMortalidad,
                        SelGen: element2.SelGen,
                        PorcSelGen: element2.PorcSelGen,
                        PorcAcumSelGen: element2.PorcAcumSelGen,
                        ErSex: element2.ErSex,
                        PorcErSex: element2.PorcErSex,
                        PorcAcumErSex: element2.PorcAcumErSex,
                        NoEliminados: element2.NoEliminados,
                        PorcEliminados: element2.PorcEliminados,
                        PorcAcumEliminados: element2.PorcAcumEliminados,
                        PorcMortalidadTot: element2.PorcMortalidadTot,
                        CantAlimentoSem: 0,
                        CantAcumAlimento: 0,
                        CantRealAlimento: 0,
                        CantIncreAlimento: 0,
                        STD: 0,
                        CantIncreSTD: 0,
                        IncrementoSTDG_A: 0,
                        descripAlimento: 0,
                        peso_actual: element3.peso_actual,
                        peso_standard: element3.peso_standard,
                        peso_dif: element3.peso_dif,
                        uniformidad: element3.uniformidad,
                        ganancia_real: element3.ganancia_real,
                        ganancia_std: element3.ganancia_std,
                        Coef_V: element3.Coef_V,
                        SeleccionGenetica: selecccionGen
                    }
                } else {
                    if (element3.ganancia_real == null) {
                        element3.ganancia_real = 0;
                    }
                    if (element3.ganancia_std == null) {
                        element3.ganancia_std = 0;
                    }
                    json = {
                        Semana: element2.Semana,
                        saldo_fin_sem: element2.saldo_fin_sem,
                        NoAves: element2.NoAves,
                        PorcMortalidad: element2.PorcMortalidad,
                        PorcAcumMortalidad: element2.PorcAcumMortalidad,
                        SelGen: element2.SelGen,
                        PorcSelGen: element2.PorcSelGen,
                        PorcAcumSelGen: element2.PorcAcumSelGen,
                        ErSex: element2.ErSex,
                        PorcErSex: element2.PorcErSex,
                        PorcAcumErSex: element2.PorcAcumErSex,
                        NoEliminados: element2.NoEliminados,
                        PorcEliminados: element2.PorcEliminados,
                        PorcAcumEliminados: element2.PorcAcumEliminados,
                        PorcMortalidadTot: element2.PorcMortalidadTot,
                        CantAlimentoSem: element.CantAlimentoSem,
                        CantAcumAlimento: element.CantAcumAlimento,
                        CantRealAlimento: element.CantRealAlimento,
                        CantIncreAlimento: element.CantIncreAlimento,
                        STD: element.STD,
                        CantIncreSTD: element.CantIncreSTD,
                        IncrementoSTDG_A: element.IncrementoSTDG_A,
                        descripAlimento: element.descripAlimento,
                        peso_actual: element3.peso_actual,
                        peso_standard: element3.peso_standard,
                        peso_dif: element3.peso_dif,
                        uniformidad: element3.uniformidad,
                        ganancia_real: element3.ganancia_real,
                        ganancia_std: element3.ganancia_std,
                        Coef_V: element3.Coef_V,
                        SeleccionGenetica: selecccionGen
                    }
                }
                json.fecha = f;
                json.Granja = e.lote_info.Granja;
                json.Galpon = e.lote_info.Galpon;
                json.lote = e.lote_info.lote;
                json.CodLinea = e.lote_info.CodLinea;
                json.NumHembras = e.lote_info.NumHembras;
                if(i == 0){
                    json.class = "tabla-td1"
                }
                rows.push(json)
            }
        }
        return {
            tabla : rows,
            rows: array,
            tablainfo: array2,
            Tipo : Data.Tipo
        };
    },
    LOP_P: async function(Data) {
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
        let lotes = await db.query(`SELECT * FROM lotes lo
        INNER JOIN produccion pr ON pr.idProduccion = lo.idProduccion
        INNER JOIN galpones ga ON ga.idGalpon = lo.idGalponP
        INNER JOIN granjas gr ON gr.idGranja = lo.idGranjaP
        WHERE pr.idProduccion != 0 and pr.idLevante != 1
        GROUP BY lo.lote_str
        ORDER BY lo.CorrelativoLote`)
        let array = [];
        let array2 = [];
        for (let i = 0; i < lotes.length; i++) {
            const e = lotes[i];
            let r = await db.query(`SELECT * 
            FROM data_aviagen da
            INNER JOIN lotes lo ON lo.idLote = da.idLote
            INNER JOIN usuario us ON us.idUsuario = da.idUser
            WHERE da.idLote = ? and da.LOP = 'P'`,[e.idLote]);
            if(r.length == 0){
                let mortalidad = await db.query(`SELECT * FROM mortalidad_prod_sem l
                INNER JOIN lotes lo ON lo.idLote = l.idLote
                INNER JOIN lineas li ON li.idLinea = lo.idLinea
                WHERE lo.lote_str = ? ORDER BY l.semana_prod ASC, lo.Sexo ASC`,[e.lote_str])
                let ultimaSemana = mortalidad[mortalidad.length-1].Semana;
                let cantidad_days = await db.query(`SELECT COUNT(DISTINCT(Edad)) as cant_days
                FROM mortalidad_prod_det mpd
                INNER JOIN lotes lo ON lo.idLote = mpd.idLote
                WHERE lo.lote_str = ? and mpd.semana = ?
                GROUP BY mpd.semana`, [e.lote_str, ultimaSemana]);
                if (cantidad_days[0].cant_days < 7) {
                    mortalidad.pop();
                    mortalidad.pop();
                    ultimaSemana = ultimaSemana - 1;
                }
                let alimentos = await db.query(`SELECT * FROM alimento_prod_sem l 
                INNER JOIN lotes lo ON lo.idLote = l.idLote 
                INNER JOIN lineas li ON li.idLinea = lo.idLinea 
                WHERE lo.lote_str = ? and l.Semana <= ? ORDER BY l.Semana ASC, lo.Sexo ASC`,
                [e.lote_str, (ultimaSemana-24)]);
                let pesos = await db.query(`SELECT * FROM peso_semana_prod_det l 
                INNER JOIN lotes lo ON lo.idLote = l.idLote 
                INNER JOIN lineas li ON li.idLinea = lo.idLinea 
                WHERE lo.lote_str = ? and l.Semana <= ? ORDER BY l.Semana ASC, lo.Sexo ASC`,
                [e.lote_str, (ultimaSemana-24)])
                let huevos = await db.query(`SELECT * FROM produccion_huevos_sem l 
                INNER JOIN lotes lo ON lo.idLote = l.idLote 
                INNER JOIN lineas li ON li.idLinea = lo.idLinea 
                WHERE lo.lote_str = ? and l.Semana <= ? ORDER BY l.Semana ASC, lo.Sexo ASC`,
                [e.lote_str, ultimaSemana])
                array.push({
                    Tipo : Data.Tipo,
                    lote_info : e,
                    ultimaSemana,
                    mortalidad,
                    alimentos,
                    pesos,
                    huevos
                })
            }else{
                array2.push(r[0]);
                let ultimaSemana_R = r[0].SemanaUltima;
                let mortalidad = await db.query(`SELECT * FROM mortalidad_prod_sem l
                INNER JOIN lotes lo ON lo.idLote = l.idLote
                INNER JOIN lineas li ON li.idLinea = lo.idLinea
                WHERE lo.lote_str = ? and l.Semana > ? ORDER BY l.semana_prod ASC, lo.Sexo ASC`,
                [e.lote_str,ultimaSemana_R])
                if(mortalidad.length != 0){
                    let ultimaSemana = mortalidad[mortalidad.length-1].Semana;
                    let cantidad_days = await db.query(`SELECT COUNT(DISTINCT(Edad)) as cant_days
                    FROM mortalidad_prod_det mpd
                    INNER JOIN lotes lo ON lo.idLote = mpd.idLote
                    WHERE lo.lote_str = ? and mpd.semana = ?
                    GROUP BY mpd.semana`, [e.lote_str, ultimaSemana]);
                    if (cantidad_days[0].cant_days < 7) {
                        mortalidad.pop();
                        mortalidad.pop();
                        ultimaSemana = ultimaSemana - 1;
                    }
                    let ultimodia = await db.query(`SELECT idLote, fecha
                    FROM mortalidad_prod_det
                    WHERE idLote = ? and semana = ? and Edad = ?`, 
                    [e.idLote, ultimaSemana_R+1, (7*(ultimaSemana_R-23)-6)])
                    let fecha = ultimodia[0].fecha;
                    let alimentos = await db.query(`SELECT * FROM alimento_prod_sem l 
                    INNER JOIN lotes lo ON lo.idLote = l.idLote 
                    INNER JOIN lineas li ON li.idLinea = lo.idLinea 
                    WHERE lo.lote_str = ? and l.Semana <= ? and l.Semana > ?  ORDER BY l.Semana ASC, lo.Sexo ASC`,
                    [e.lote_str, (ultimaSemana-24),(ultimaSemana_R-24)]);
                    let pesos = await db.query(`SELECT * FROM peso_semana_prod_det l 
                    INNER JOIN lotes lo ON lo.idLote = l.idLote 
                    INNER JOIN lineas li ON li.idLinea = lo.idLinea 
                    WHERE lo.lote_str = ? and l.Semana <= ? and l.Semana > ?  ORDER BY l.Semana ASC, lo.Sexo ASC`,
                    [e.lote_str, (ultimaSemana-24),(ultimaSemana_R-24)])
                    let huevos = await db.query(`SELECT * FROM produccion_huevos_sem l 
                    INNER JOIN lotes lo ON lo.idLote = l.idLote 
                    INNER JOIN lineas li ON li.idLinea = lo.idLinea 
                    WHERE lo.lote_str = ? and l.Semana <= ? and l.Semana > ?  ORDER BY l.Semana ASC, lo.Sexo ASC`,
                    [e.lote_str, ultimaSemana,ultimaSemana_R])
                    e.FechaIniProduccion = fecha;
                    array.push({
                        Tipo : Data.Tipo,
                        lote_info : e,
                        ultimaSemana,
                        mortalidad,
                        alimentos,
                        pesos,
                        huevos
                    })
                }
            }
        }
        let rows = [];
        for (let w = 0; w < array.length; w++) {
            const e = array[w];
            let alimentosem = e.alimentos
            let mortalidadsem = e.mortalidad
            let pesosem = e.pesos
            let huevossem = e.huevos
            let fe = new Date(e.lote_info.FechaIniProduccion);
            let j = 0
            for (let i = 0; i < mortalidadsem.length; i = i + 2) {
                const element = alimentosem[i];
                const element_M = alimentosem[i + 1];
                const element2 = mortalidadsem[i];
                const element2_M = mortalidadsem[i + 1];
                const element3 = pesosem[i];
                const element3_M = pesosem[i + 1];
                const element4 = huevossem[j];
                if (i == 0) {
                    fe.setDate(fe.getDate() + 6);
                } else {
                    fe.setDate(fe.getDate() + 7);
                }
                var f = formatDate(fe);
                if (element2.PorcAcumSelGen == null) {
                    element2.PorcAcumSelGen = 0;
                }
                if (element2.PorcAcumErSex == null) {
                    element2.PorcAcumErSex = 0
                }
                if (element2.PorcAcumEliminados == null) {
                    element2.PorcAcumEliminados = 0
                }
                if (element2.PorcMortalidadTot == null) {
                    element2.PorcMortalidadTot = 0
                }
                let json
                if (typeof element == "undefined" && typeof element3 == "undefined" && typeof element4 == "undefined") {
                    json = {
                        fecha: f,
                        Semana: element2.Semana,
                        semana_prod: element2.semana_prod,
                        NumHembras: element2.saldo_fin_sem,
                        NumMachos: element2_M.saldo_fin_sem,
                        PorcApareo: element2_M.PorcApareo,
                        NoAves: element2.NoAves,
                        NoAves_M: element2_M.NoAves,
                        PorcMortalidad: element2.PorcMortalidad,
                        PorcMortalidad_M: element2_M.PorcMortalidad,
                        PorcAcumMortalidad: element2.PorcAcumMortalidad,
                        PorcAcumMortalidad_M: element2_M.PorcAcumMortalidad,
                        MDH: element2.MortalidadTot,
                        MDH_Porc: element2.PorcMortalidadTot,
                        MDH_Porc_Acum: element2.PorcMortalidadTot_Acum,
                        PTH: 0,
                        PTH_Acum: 0,
                        Acum_x_Gall: 0,
                        STD_Gall: 0,
                        AveDiaSem: 0,
                        AveDiaSTD: 0,
                        PorHI: 0,
                        TotalHI: 0,
                        TotalHI_Acum: 0,
                        Acum_Galle_Enca: 0,
                        STD_HI: 0,
                        Ncto_Sem: 0,
                        Ncto_STD: 0,
                        AveDiaGrHem: 0,
                        SemKilos: 0,
                        SemKilos_Acum: 0,
                        HemGr: 0,
                        IncreHemGr: 0,
                        STDHem: 0,
                        AveDiaGrMac: 0,
                        SemKilos_M: 0,
                        SemKilos_Acum_M: 0,
                        MacGr: 0,
                        IncreMacGr: 0,
                        STDMac: 0,
                        NoEliminados_HEM: element2.NoEliminados,
                        NoEliminados_HEM_Acum: element2.NoEliminados_Acum,
                        NoEliminados_MAC: element2_M.NoEliminados,
                        NoEliminados_MAC_Acum: element2_M.NoEliminados_Acum,
                        Peso_HEM: 0,
                        STD_HEM: 0,
                        DIF_HEM: 0,
                        Peso_MAC: 0,
                        STD_MAC: 0,
                        DIF_MAC: 0,
                        Huevos_SEM: 0,
                        Huevos_STD: 0,
                        Huevos_DIF: 0,
                        Huevos_MASA_SEM: 0,
                        Huevos_MASA_STD: 0
                    }
                } else if (typeof element3 != "undefined" && typeof element != "undefined" && typeof element4 != "undefined" && typeof element_M == "undefined") {
                    json = {
                        fecha: f,
                        Semana: element2.Semana,
                        semana_prod: element2.semana_prod,
                        NumHembras: element2.saldo_fin_sem,
                        NumMachos: element2_M.saldo_fin_sem,
                        PorcApareo: element2_M.PorcApareo,
                        NoAves: element2.NoAves,
                        NoAves_M: element2_M.NoAves,
                        PorcMortalidad: element2.PorcMortalidad,
                        PorcMortalidad_M: element2_M.PorcMortalidad,
                        PorcAcumMortalidad: element2.PorcAcumMortalidad,
                        PorcAcumMortalidad_M: element2_M.PorcAcumMortalidad,
                        MDH: element2.MortalidadTot,
                        MDH_Porc: element2.PorcMortalidadTot,
                        MDH_Porc_Acum: element2.PorcMortalidadTot_Acum,
                        PTH: element4.TotalSemProd_Huevo,
                        PTH_Acum: element4.TotalSemProd_Huevo_Acum,
                        Acum_x_Gall: element4.Acum_x_Gall,
                        STD_Gall: element4.STD_Acum_Gall,
                        AveDiaSem: element4.Act_Avedia,
                        AveDiaSTD: element4.STD_Act_Avedia,
                        PorHI: element4.PorHI,
                        TotalHI: element4.TotalHI,
                        TotalHI_Acum: element4.TotalHI_Acum,
                        Acum_Galle_Enca: element4.Acum_Gall_Encase,
                        STD_HI: element4.STD_HI,
                        Ncto_Sem: 0,
                        Ncto_STD: 0,
                        AveDiaGrHem: element.Ave_Dia_Gr,
                        SemKilos: element.CantAlimentoSem,
                        SemKilos_Acum: element.CantAcumAlimento,
                        HemGr: element.gramos,
                        IncreHemGr: element.Increm_gramos,
                        STDHem: element.STD,
                        AveDiaGrMac: 0,
                        SemKilos_M: 0,
                        SemKilos_Acum_M: 0,
                        MacGr: 0,
                        IncreMacGr: 0,
                        STDMac: 0,
                        NoEliminados_HEM: element2.NoEliminados,
                        NoEliminados_HEM_Acum: element2.NoEliminados_Acum,
                        NoEliminados_MAC: element2_M.NoEliminados,
                        NoEliminados_MAC_Acum: element2_M.NoEliminados_Acum,
                        Peso_HEM: element3.peso_actual_ave,
                        STD_HEM: element3.peso_standard_ave,
                        DIF_HEM: element3.peso_dif_ave,
                        Peso_MAC: element3_M.peso_actual_ave,
                        STD_MAC: element3_M.peso_standard_ave,
                        DIF_MAC: element3_M.peso_dif_ave,
                        Huevos_SEM: element3.peso_actual_huevo,
                        Huevos_STD: element3.peso_standard_huevo,
                        Huevos_DIF: element3.peso_dif_huevo,
                        Huevos_MASA_SEM: element3.masa_huevo,
                        Huevos_MASA_STD: element3.masa_standard_huevo
                    }
                } else if (typeof element3 != "undefined" && typeof element != "undefined" && typeof element4 != "undefined") {
                    json = {
                        fecha: f,
                        Semana: element2.Semana,
                        semana_prod: element2.semana_prod,
                        NumHembras: element2.saldo_fin_sem,
                        NumMachos: element2_M.saldo_fin_sem,
                        PorcApareo: element2_M.PorcApareo,
                        NoAves: element2.NoAves,
                        NoAves_M: element2_M.NoAves,
                        PorcMortalidad: element2.PorcMortalidad,
                        PorcMortalidad_M: element2_M.PorcMortalidad,
                        PorcAcumMortalidad: element2.PorcAcumMortalidad,
                        PorcAcumMortalidad_M: element2_M.PorcAcumMortalidad,
                        MDH: element2.MortalidadTot,
                        MDH_Porc: element2.PorcMortalidadTot,
                        MDH_Porc_Acum: element2.PorcMortalidadTot_Acum,
                        PTH: element4.TotalSemProd_Huevo,
                        PTH_Acum: element4.TotalSemProd_Huevo_Acum,
                        Acum_x_Gall: element4.Acum_x_Gall,
                        STD_Gall: element4.STD_Acum_Gall,
                        AveDiaSem: element4.Act_Avedia,
                        AveDiaSTD: element4.STD_Act_Avedia,
                        PorHI: element4.PorHI,
                        TotalHI: element4.TotalHI,
                        TotalHI_Acum: element4.TotalHI_Acum,
                        Acum_Galle_Enca: element4.Acum_Gall_Encase,
                        STD_HI: element4.STD_HI,
                        Ncto_Sem: 0,
                        Ncto_STD: 0,
                        AveDiaGrHem: element.Ave_Dia_Gr,
                        SemKilos: element.CantAlimentoSem,
                        SemKilos_Acum: element.CantAcumAlimento,
                        HemGr: element.gramos,
                        IncreHemGr: element.Increm_gramos,
                        STDHem: element.STD,
                        AveDiaGrMac: element_M.Ave_Dia_Gr,
                        SemKilos_M: element_M.CantAlimentoSem,
                        SemKilos_Acum_M: element_M.CantAcumAlimento,
                        MacGr: element_M.gramos,
                        IncreMacGr: element_M.Increm_gramos,
                        STDMac: element_M.STD,
                        NoEliminados_HEM: element2.NoEliminados,
                        NoEliminados_HEM_Acum: element2.NoEliminados_Acum,
                        NoEliminados_MAC: element2_M.NoEliminados,
                        NoEliminados_MAC_Acum: element2_M.NoEliminados_Acum,
                        Peso_HEM: element3.peso_actual_ave,
                        STD_HEM: element3.peso_standard_ave,
                        DIF_HEM: element3.peso_dif_ave,
                        Peso_MAC: element3_M.peso_actual_ave,
                        STD_MAC: element3_M.peso_standard_ave,
                        DIF_MAC: element3_M.peso_dif_ave,
                        Huevos_SEM: element3.peso_actual_huevo,
                        Huevos_STD: element3.peso_standard_huevo,
                        Huevos_DIF: element3.peso_dif_huevo,
                        Huevos_MASA_SEM: element3.masa_huevo,
                        Huevos_MASA_STD: element3.masa_standard_huevo
                    }
                } else if (typeof element == "undefined" && typeof element3 != "undefined" && typeof element4 != "undefined") {
                    json = {
                        fecha: f,
                        Semana: element2.Semana,
                        semana_prod: element2.semana_prod,
                        NumHembras: element2.saldo_fin_sem,
                        NumMachos: element2_M.saldo_fin_sem,
                        PorcApareo: element2_M.PorcApareo,
                        NoAves: element2.NoAves,
                        NoAves_M: element2_M.NoAves,
                        PorcMortalidad: element2.PorcMortalidad,
                        PorcMortalidad_M: element2_M.PorcMortalidad,
                        PorcAcumMortalidad: element2.PorcAcumMortalidad,
                        PorcAcumMortalidad_M: element2_M.PorcAcumMortalidad,
                        MDH: element2.MortalidadTot,
                        MDH_Porc: element2.PorcMortalidadTot,
                        MDH_Porc_Acum: element2.PorcMortalidadTot_Acum,
                        PTH: element4.TotalSemProd_Huevo,
                        PTH_Acum: element4.TotalSemProd_Huevo_Acum,
                        Acum_x_Gall: element4.Acum_x_Gall,
                        STD_Gall: element4.STD_Acum_Gall,
                        AveDiaSem: element4.Act_Avedia,
                        AveDiaSTD: element4.STD_Act_Avedia,
                        PorHI: element4.PorHI,
                        TotalHI: element4.TotalHI,
                        TotalHI_Acum: element4.TotalHI_Acum,
                        Acum_Galle_Enca: element4.Acum_Gall_Encase,
                        STD_HI: element4.STD_HI,
                        Ncto_Sem: 0,
                        Ncto_STD: 0,
                        AveDiaGrHem: 0,
                        SemKilos: 0,
                        SemKilos_Acum: 0,
                        HemGr: 0,
                        IncreHemGr: 0,
                        STDHem: 0,
                        AveDiaGrMac: 0,
                        SemKilos_M: 0,
                        SemKilos_Acum_M: 0,
                        MacGr: 0,
                        IncreMacGr: 0,
                        STDMac: 0,
                        NoEliminados_HEM: element2.NoEliminados,
                        NoEliminados_HEM_Acum: element2.NoEliminados_Acum,
                        NoEliminados_MAC: element2_M.NoEliminados,
                        NoEliminados_MAC_Acum: element2_M.NoEliminados_Acum,
                        Peso_HEM: element3.peso_actual_ave,
                        STD_HEM: element3.peso_standard_ave,
                        DIF_HEM: element3.peso_dif_ave,
                        Peso_MAC: element3_M.peso_actual_ave,
                        STD_MAC: element3_M.peso_standard_ave,
                        DIF_MAC: element3_M.peso_dif_ave,
                        Huevos_SEM: element3.peso_actual_huevo,
                        Huevos_STD: element3.peso_standard_huevo,
                        Huevos_DIF: element3.peso_dif_huevo,
                        Huevos_MASA_SEM: element3.masa_huevo,
                        Huevos_MASA_STD: element3.masa_standard_huevo
                    }
                } else if (typeof element != "undefined" && typeof element3 == "undefined" && typeof element4 != "undefined") {
                    json = {
                        fecha: f,
                        Semana: element2.Semana,
                        semana_prod: element2.semana_prod,
                        NumHembras: element2.saldo_fin_sem,
                        NumMachos: element2_M.saldo_fin_sem,
                        PorcApareo: element2_M.PorcApareo,
                        NoAves: element2.NoAves,
                        NoAves_M: element2_M.NoAves,
                        PorcMortalidad: element2.PorcMortalidad,
                        PorcMortalidad_M: element2_M.PorcMortalidad,
                        PorcAcumMortalidad: element2.PorcAcumMortalidad,
                        PorcAcumMortalidad_M: element2_M.PorcAcumMortalidad,
                        MDH: element2.MortalidadTot,
                        MDH_Porc: element2.PorcMortalidadTot,
                        MDH_Porc_Acum: element2.PorcMortalidadTot_Acum,
                        PTH: element4.TotalSemProd_Huevo,
                        PTH_Acum: element4.TotalSemProd_Huevo_Acum,
                        Acum_x_Gall: element4.Acum_x_Gall,
                        STD_Gall: element4.STD_Acum_Gall,
                        AveDiaSem: element4.Act_Avedia,
                        AveDiaSTD: element4.STD_Act_Avedia,
                        PorHI: element4.PorHI,
                        TotalHI: element4.TotalHI,
                        TotalHI_Acum: element4.TotalHI_Acum,
                        Acum_Galle_Enca: element4.Acum_Gall_Encase,
                        STD_HI: element4.STD_HI,
                        Ncto_Sem: 0,
                        Ncto_STD: 0,
                        AveDiaGrHem: element.Ave_Dia_Gr,
                        SemKilos: element.CantAlimentoSem,
                        SemKilos_Acum: element.CantAcumAlimento,
                        HemGr: element.gramos,
                        IncreHemGr: element.Increm_gramos,
                        STDHem: element.STD,
                        AveDiaGrMac: element_M.Ave_Dia_Gr,
                        SemKilos_M: element_M.CantAlimentoSem,
                        SemKilos_Acum_M: element_M.CantAcumAlimento,
                        MacGr: element_M.gramos,
                        IncreMacGr: element_M.Increm_gramos,
                        STDMac: element_M.STD,
                        NoEliminados_HEM: element2.NoEliminados,
                        NoEliminados_HEM_Acum: element2.NoEliminados_Acum,
                        NoEliminados_MAC: element2_M.NoEliminados,
                        NoEliminados_MAC_Acum: element2_M.NoEliminados_Acum,
                        Peso_HEM: 0,
                        STD_HEM: 0,
                        DIF_HEM: 0,
                        Peso_MAC: 0,
                        STD_MAC: 0,
                        DIF_MAC: 0,
                        Huevos_SEM: 0,
                        Huevos_STD: 0,
                        Huevos_DIF: 0,
                        Huevos_MASA_SEM: 0,
                        Huevos_MASA_STD: 0
                    }
                } else if (typeof element != "undefined" && typeof element3 != "undefined" && typeof element4 == "undefined") {
                    json = {
                        fecha: f,
                        Semana: element2.Semana,
                        semana_prod: element2.semana_prod,
                        NumHembras: element2.saldo_fin_sem,
                        NumMachos: element2_M.saldo_fin_sem,
                        PorcApareo: element2_M.PorcApareo,
                        NoAves: element2.NoAves,
                        NoAves_M: element2_M.NoAves,
                        PorcMortalidad: element2.PorcMortalidad,
                        PorcMortalidad_M: element2_M.PorcMortalidad,
                        PorcAcumMortalidad: element2.PorcAcumMortalidad,
                        PorcAcumMortalidad_M: element2_M.PorcAcumMortalidad,
                        MDH: element2.MortalidadTot,
                        MDH_Porc: element2.PorcMortalidadTot,
                        MDH_Porc_Acum: element2.PorcMortalidadTot_Acum,
                        PTH: 0,
                        PTH_Acum: 0,
                        Acum_x_Gall: 0,
                        STD_Gall: 0,
                        AveDiaSem: 0,
                        AveDiaSTD: 0,
                        PorHI: 0,
                        TotalHI: 0,
                        TotalHI_Acum: 0,
                        Acum_Galle_Enca: 0,
                        STD_HI: 0,
                        Ncto_Sem: 0,
                        Ncto_STD: 0,
                        AveDiaGrHem: element.Ave_Dia_Gr,
                        SemKilos: element.CantAlimentoSem,
                        SemKilos_Acum: element.CantAcumAlimento,
                        HemGr: element.gramos,
                        IncreHemGr: element.Increm_gramos,
                        STDHem: element.STD,
                        AveDiaGrMac: element_M.Ave_Dia_Gr,
                        SemKilos_M: element_M.CantAlimentoSem,
                        SemKilos_Acum_M: element_M.CantAcumAlimento,
                        MacGr: element_M.gramos,
                        IncreMacGr: element_M.Increm_gramos,
                        STDMac: element_M.STD,
                        NoEliminados_HEM: element2.NoEliminados,
                        NoEliminados_HEM_Acum: element2.NoEliminados_Acum,
                        NoEliminados_MAC: element2_M.NoEliminados,
                        NoEliminados_MAC_Acum: element2_M.NoEliminados_Acum,
                        Peso_HEM: element3.peso_actual_ave,
                        STD_HEM: element3.peso_standard_ave,
                        DIF_HEM: element3.peso_dif_ave,
                        Peso_MAC: element3_M.peso_actual_ave,
                        STD_MAC: element3_M.peso_standard_ave,
                        DIF_MAC: element3_M.peso_dif_ave,
                        Huevos_SEM: element3.peso_actual_huevo,
                        Huevos_STD: element3.peso_standard_huevo,
                        Huevos_DIF: element3.peso_dif_huevo,
                        Huevos_MASA_SEM: element3.masa_huevo,
                        Huevos_MASA_STD: element3.masa_standard_huevo
                    }
                } else if (typeof element == "undefined" && typeof element3 == "undefined" && typeof element4 != "undefined") {
                    json = {
                        fecha: f,
                        Semana: element2.Semana,
                        semana_prod: element2.semana_prod,
                        NumHembras: element2.saldo_fin_sem,
                        NumMachos: element2_M.saldo_fin_sem,
                        PorcApareo: element2_M.PorcApareo,
                        NoAves: element2.NoAves,
                        NoAves_M: element2_M.NoAves,
                        PorcMortalidad: element2.PorcMortalidad,
                        PorcMortalidad_M: element2_M.PorcMortalidad,
                        PorcAcumMortalidad: element2.PorcAcumMortalidad,
                        PorcAcumMortalidad_M: element2_M.PorcAcumMortalidad,
                        MDH: element2.MortalidadTot,
                        MDH_Porc: element2.PorcMortalidadTot,
                        MDH_Porc_Acum: element2.PorcMortalidadTot_Acum,
                        PTH: element4.TotalSemProd_Huevo,
                        PTH_Acum: element4.TotalSemProd_Huevo_Acum,
                        Acum_x_Gall: element4.Acum_x_Gall,
                        STD_Gall: element4.STD_Acum_Gall,
                        AveDiaSem: element4.Act_Avedia,
                        AveDiaSTD: element4.STD_Act_Avedia,
                        PorHI: element4.PorHI,
                        TotalHI: element4.TotalHI,
                        TotalHI_Acum: element4.TotalHI_Acum,
                        Acum_Galle_Enca: element4.Acum_Gall_Encase,
                        STD_HI: element4.STD_HI,
                        Ncto_Sem: 0,
                        Ncto_STD: 0,
                        AveDiaGrHem: 0,
                        SemKilos: 0,
                        SemKilos_Acum: 0,
                        HemGr: 0,
                        IncreHemGr: 0,
                        STDHem: 0,
                        AveDiaGrMac: 0,
                        SemKilos_M: 0,
                        SemKilos_Acum_M: 0,
                        MacGr: 0,
                        IncreMacGr: 0,
                        STDMac: 0,
                        NoEliminados_HEM: element2.NoEliminados,
                        NoEliminados_HEM_Acum: element2.NoEliminados_Acum,
                        NoEliminados_MAC: element2_M.NoEliminados,
                        NoEliminados_MAC_Acum: element2_M.NoEliminados_Acum,
                        Peso_HEM: 0,
                        STD_HEM: 0,
                        DIF_HEM: 0,
                        Peso_MAC: 0,
                        STD_MAC: 0,
                        DIF_MAC: 0,
                        Huevos_SEM: 0,
                        Huevos_STD: 0,
                        Huevos_DIF: 0,
                        Huevos_MASA_SEM: 0,
                        Huevos_MASA_STD: 0,
                    }
                } else if (typeof element == "undefined" && typeof element4 == "undefined" && typeof element3 != "undefined") {
                    json = {
                        fecha: f,
                        Semana: element2.Semana,
                        semana_prod: element2.semana_prod,
                        NumHembras: element2.saldo_fin_sem,
                        NumMachos: element2_M.saldo_fin_sem,
                        PorcApareo: element2_M.PorcApareo,
                        NoAves: element2.NoAves,
                        NoAves_M: element2_M.NoAves,
                        PorcMortalidad: element2.PorcMortalidad,
                        PorcMortalidad_M: element2_M.PorcMortalidad,
                        PorcAcumMortalidad: element2.PorcAcumMortalidad,
                        PorcAcumMortalidad_M: element2_M.PorcAcumMortalidad,
                        MDH: element2.MortalidadTot,
                        MDH_Porc: element2.PorcMortalidadTot,
                        MDH_Porc_Acum: element2.PorcMortalidadTot_Acum,
                        PTH: 0,
                        PTH_Acum: 0,
                        Acum_x_Gall: 0,
                        STD_Gall: 0,
                        AveDiaSem: 0,
                        AveDiaSTD: 0,
                        PorHI: 0,
                        TotalHI: 0,
                        TotalHI_Acum: 0,
                        Acum_Galle_Enca: 0,
                        STD_HI: 0,
                        Ncto_Sem: 0,
                        Ncto_STD: 0,
                        AveDiaGrHem: 0,
                        SemKilos: 0,
                        SemKilos_Acum: 0,
                        HemGr: 0,
                        IncreHemGr: 0,
                        STDHem: 0,
                        AveDiaGrMac: 0,
                        SemKilos_M: 0,
                        SemKilos_Acum_M: 0,
                        MacGr: 0,
                        IncreMacGr: 0,
                        STDMac: 0,
                        NoEliminados_HEM: element2.NoEliminados,
                        NoEliminados_HEM_Acum: element2.NoEliminados_Acum,
                        NoEliminados_MAC: element2_M.NoEliminados,
                        NoEliminados_MAC_Acum: element2_M.NoEliminados_Acum,
                        Peso_HEM: element3.peso_actual_ave,
                        STD_HEM: element3.peso_standard_ave,
                        DIF_HEM: element3.peso_dif_ave,
                        Peso_MAC: element3_M.peso_actual_ave,
                        STD_MAC: element3_M.peso_standard_ave,
                        DIF_MAC: element3_M.peso_dif_ave,
                        Huevos_SEM: element3.peso_actual_huevo,
                        Huevos_STD: element3.peso_standard_huevo,
                        Huevos_DIF: element3.peso_dif_huevo,
                        Huevos_MASA_SEM: element3.masa_huevo,
                        Huevos_MASA_STD: element3.masa_standard_huevo
                    }
                } else if (typeof element4 == "undefined" && typeof element3 == "undefined") {
                    json = {
                        fecha: f,
                        Semana: element2.Semana,
                        semana_prod: element2.semana_prod,
                        NumHembras: element2.saldo_fin_sem,
                        NumMachos: element2_M.saldo_fin_sem,
                        PorcApareo: element2_M.PorcApareo,
                        NoAves: element2.NoAves,
                        NoAves_M: element2_M.NoAves,
                        PorcMortalidad: element2.PorcMortalidad,
                        PorcMortalidad_M: element2_M.PorcMortalidad,
                        PorcAcumMortalidad: element2.PorcAcumMortalidad,
                        PorcAcumMortalidad_M: element2_M.PorcAcumMortalidad,
                        MDH: element2.MortalidadTot,
                        MDH_Porc: element2.PorcMortalidadTot,
                        MDH_Porc_Acum: element2.PorcMortalidadTot_Acum,
                        PTH: 0,
                        PTH_Acum: 0,
                        Acum_x_Gall: 0,
                        STD_Gall: 0,
                        AveDiaSem: 0,
                        AveDiaSTD: 0,
                        PorHI: 0,
                        TotalHI: 0,
                        TotalHI_Acum: 0,
                        Acum_Galle_Enca: 0,
                        STD_HI: 0,
                        Ncto_Sem: 0,
                        Ncto_STD: 0,
                        AveDiaGrHem: element.Ave_Dia_Gr,
                        SemKilos: element.CantAlimentoSem,
                        SemKilos_Acum: element.CantAcumAlimento,
                        HemGr: element.gramos,
                        IncreHemGr: element.Increm_gramos,
                        STDHem: element.STD,
                        AveDiaGrMac: element_M.Ave_Dia_Gr,
                        SemKilos_M: element_M.CantAlimentoSem,
                        SemKilos_Acum_M: element_M.CantAcumAlimento,
                        MacGr: element_M.gramos,
                        IncreMacGr: element_M.Increm_gramos,
                        STDMac: element_M.STD,
                        NoEliminados_HEM: element2.NoEliminados,
                        NoEliminados_HEM_Acum: element2.NoEliminados_Acum,
                        NoEliminados_MAC: element2_M.NoEliminados,
                        NoEliminados_MAC_Acum: element2_M.NoEliminados_Acum,
                        Peso_HEM: 0,
                        STD_HEM: 0,
                        DIF_HEM: 0,
                        Peso_MAC: 0,
                        STD_MAC: 0,
                        DIF_MAC: 0,
                        Huevos_SEM: 0,
                        Huevos_STD: 0,
                        Huevos_DIF: 0,
                        Huevos_MASA_SEM: 0,
                        Huevos_MASA_STD: 0,
                    }
                } else {
                    json = {
                        fecha: f,
                        Semana: element2.Semana,
                        semana_prod: element2.semana_prod,
                        NumHembras: element2.saldo_fin_sem,
                        NumMachos: element2_M.saldo_fin_sem,
                        PorcApareo: element2_M.PorcApareo,
                        NoAves: element2.NoAves,
                        NoAves_M: element2_M.NoAves,
                        PorcMortalidad: element2.PorcMortalidad,
                        PorcMortalidad_M: element2_M.PorcMortalidad,
                        PorcAcumMortalidad: element2.PorcAcumMortalidad,
                        PorcAcumMortalidad_M: element2_M.PorcAcumMortalidad,
                        MDH: element2.MortalidadTot,
                        MDH_Porc: element2.PorcMortalidadTot,
                        MDH_Porc_Acum: element2.PorcMortalidadTot_Acum,
                        PTH: element4.TotalSemProd_Huevo,
                        PTH_Acum: element4.TotalSemProd_Huevo_Acum,
                        Acum_x_Gall: element4.Acum_x_Gall,
                        STD_Gall: element4.STD_Acum_Gall,
                        AveDiaSem: element4.Act_Avedia,
                        AveDiaSTD: element4.STD_Act_Avedia,
                        PorHI: element4.PorHI,
                        TotalHI: element4.TotalHI,
                        TotalHI_Acum: element4.TotalHI_Acum,
                        Acum_Galle_Enca: element4.Acum_Gall_Encase,
                        STD_HI: element4.STD_HI,
                        Ncto_Sem: 0,
                        Ncto_STD: 0,
                        AveDiaGrHem: element.Ave_Dia_Gr,
                        SemKilos: element.CantAlimentoSem,
                        SemKilos_Acum: element.CantAcumAlimento,
                        HemGr: element.gramos,
                        IncreHemGr: element.Increm_gramos,
                        STDHem: element.STD,
                        AveDiaGrMac: element_M.Ave_Dia_Gr,
                        SemKilos_M: element_M.CantAlimentoSem,
                        SemKilos_Acum_M: element_M.CantAcumAlimento,
                        MacGr: element_M.gramos,
                        IncreMacGr: element_M.Increm_gramos,
                        STDMac: element_M.STD,
                        NoEliminados_HEM: element2.NoEliminados,
                        NoEliminados_HEM_Acum: element2.NoEliminados_Acum,
                        NoEliminados_MAC: element2_M.NoEliminados,
                        NoEliminados_MAC_Acum: element2_M.NoEliminados_Acum,
                        Peso_HEM: element3.peso_actual_ave,
                        STD_HEM: element3.peso_standard_ave,
                        DIF_HEM: element3.peso_dif_ave,
                        Peso_MAC: element3_M.peso_actual_ave,
                        STD_MAC: element3_M.peso_standard_ave,
                        DIF_MAC: element3_M.peso_dif_ave,
                        Huevos_SEM: element3.peso_actual_huevo,
                        Huevos_STD: element3.peso_standard_huevo,
                        Huevos_DIF: element3.peso_dif_huevo,
                        Huevos_MASA_SEM: element3.masa_huevo,
                        Huevos_MASA_STD: element3.masa_standard_huevo
                    }
                }
                json.Granja = e.lote_info.Granja;
                json.Galpon = e.lote_info.Galpon;
                json.lote_str = e.lote_info.lote_str;
                if(i == 0){
                    json.class = "tabla-td1"
                }
                rows.push(json);
                j = j + 1;
            }
        }
        return {
            tabla : rows,
            rows: array,
            tablainfo: array2,
            Tipo : Data.Tipo
        };
    },
    ExportExcel: async function(Data){
        for (let i = 0; i < Data.rows.length; i++) {
            const e = Data.rows[i];
            if(Data.Tipo == 'Levante'){
                let r = await db.query(`SELECT * 
                FROM data_aviagen 
                WHERE idLote = ? and LOP = 'L'`,[e.lote_info.idLote]);
                if(r.length != 0){
                    await db.query(`UPDATE data_aviagen SET 
                    SemanaUltima = ?, idUser = ?, FechaResgistro = ? WHERE idLote = ? and LOP = 'L'`,
                    [e.ultimaSemana, Data.idUser, new Date(), e.lote_info.idLote])
                }else{
                    await db.query(`INSERT INTO data_aviagen (
                    idLote, LOP, SemanaUltima, idUser) 
                    VALUES (?,?,?,?)`,
                    [e.lote_info.idLote, 'L', e.ultimaSemana, Data.idUser])                    
                }
            }else{
                let r = await db.query(`SELECT * 
                FROM data_aviagen 
                WHERE idLote = ? and LOP = 'P'`,[e.lote_info.idLote]);
                if(r.length != 0){
                    await db.query(`UPDATE data_aviagen SET 
                    SemanaUltima = ?, idUser = ?, FechaResgistro = ? WHERE idLote = ? and LOP = 'P'`,
                    [e.ultimaSemana, Data.idUser, new Date(), e.lote_info.idLote])
                }else{
                    await db.query(`INSERT INTO data_aviagen(
                    idLote, LOP, SemanaUltima, idUser) 
                    VALUES (?,?,?,?)`,
                    [e.lote_info.idLote, 'P', e.ultimaSemana, Data.idUser])              
                }
            }
        }
        return {
            success : true
        }
    }
};
module.exports = Aviagen;