var db=require('../dbconnection');

var resultadosserologia = {
    getAllResultadosSerologia: async function() {
        let rows = await db.query(`SELECT * 
        FROM resultadosserologia 
        ORDER BY idLevante DESC`);
        return rows;
    },
    getAllLotesResultadosSerologia: async function() {
        let rows = await db.query(`SELECT lo.idLote, lo.lote, li.CodLinea
        FROM resultadosserologia rs
        INNER JOIN lotes lo ON lo.idLevante = rs.idLevante
        INNER JOIN lineas li ON li.idLinea = lo.idLinea
        GROUP BY lo.idLote, lo.lote`)
        return rows;
    },
    getResultadosSerologiaByid: async function(id) {
        let cabecera = await db.query("SELECT * FROM resultadosserologia WHERE idResultadoSerologia= ?",[id]);
        let detalle = await db.query(`SELECT * 
        FROM resultadosserologia_det rd
        INNER JOIN usuario us ON us.idUsuario = rd.idUsuario
        WHERE rd.idResultadoSerologia = ? 
        ORDER BY rd.Semana, rd.idLote, rd.idEnfermedad`,[id]);
        return {
            cabecera,
            detalle
        };
    },
    addResultadoSerologia: async function(Inv) {
        return await db.query("INSERT INTO resultadosserologia (idPrograma, Nombre, Descripcion, IdLevante, NombreLote, NroAves, FechaRegistro, idUsuario) VALUES (?,?,?,?,?,?,?,?)",
        [Inv.Programa.idProgramaVacunacion, Inv.Nombre, Inv.Descripcion, Inv.Programa.IdLevante, Inv.Programa.NombreLote, Inv.Programa.NroAves, new Date(Inv.FechaCreacion), Inv.idUser])
    },
    addDetalleResultadoSerologia: async function(Resultado) {
        let sel = await db.query("SELECT * FROM resultadosserologia_det WHERE idResultadoSerologia = ? and Semana = ? and idLote = ? and idEnfermedad = ?",
                            [Resultado.idResultadoSerologia, Resultado.Semana, Resultado.Lote.idLote, Resultado.Enfermedad.idEnfermedad])
        if(sel.length == 0){
            await db.query(`INSERT INTO resultadosserologia_det (
                idResultadoSerologia, idLote, NombreLote, Semana, idEnfermedad, Enfermedad, GMT, CV, Promedio,
                Maximo, Minimo, FechaRegistro, idUsuario) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [Resultado.idResultadoSerologia, Resultado.Lote.idLote, Resultado.Lote.lote, Resultado.Semana,
                Resultado.Enfermedad.idEnfermedad, Resultado.Enfermedad.Nombre, Resultado.GMT, Resultado.CV, 
                Resultado.Promedio, Resultado.Maximo, Resultado.Minimo, new Date(Resultado.FechaRegistro),
                Resultado.idUser ])
            return {
                success: true,
                message: 'Se ha registrado correctamente.'
            }
        }else{
            return {
                success: false,
                message: 'El día seleccionado, ya existe.'
            }
        }
    },
    updateResultadosSerologia: async function(Inv,id) {
        let rows = await db.query("UPDATE resultadosserologia set Nombre = ?, Descripcion = ? WHERE idResultadoSerologia = ?",
        [Inv.Nombre, Inv.Descripcion, id]);
        return {
            success : true,
            message : 'Se actualizó correctamente'
        };
    },
    updateResultadosSerologiaDet: async function(Resultado,id){
        let sel = await db.query("SELECT * FROM resultadosserologia_det WHERE idResultadoSerologia = ? and Semana = ? and idLote = ?",
                            [Resultado.idResultadoSerologia, Resultado.Semana, Resultado.Lote.idLote])
        if(sel.length == 0){
            await db.query(`UPDATE resultadosserologia_det SET
                idLote = ?, NombreLote = ?, Semana = ?, idEnfermedad = ?, Enfermedad = ?, GMT = ?,
                CV = ?, Promedio = ?, Maximo = ?, Minimo = ? WHERE idDetalleResultadoSerologia = ?`,
                [Resultado.Lote.idLote, Resultado.Lote.lote, Resultado.Semana, Resultado.Enfermedad.idEnfermedad,
                Resultado.Enfermedad.Nombre, Resultado.GMT, Resultado.CV, Resultado.Promedio, Resultado.Maximo,
                Resultado.Minimo, id])
            return {
                success: true,
                message: 'Se ha registrado correctamente.'
            }
        }else{
            return {
                success: false,
                message: 'El día seleccionado, ya existe.'
            }
        }
    },
    deleteResultadosSerologia: async function(id) {
        return await db.query("DELETE FROM resultadosserologia WHERE idResultadoSerologia = ?",[id]);
    },
    deleteResultadosSerologiaDet: async function(id) {
        let rows = await db.query("DELETE FROM resultadosserologia_det WHERE idDetalleResultadoSerologia = ?",[id]);
        return {
            success : true,
            message : 'Se actualizó correctamente.',
            data : rows
        }
    },
    graficar:async function(Resultado) {
        let rows = await db.query(`SELECT * 
        FROM resultadosserologia_det 
        WHERE idEnfermedad = ? and idResultadoSerologia = ?
        ORDER BY Semana`,
        [Resultado.Enfermedad.idEnfermedad, Resultado.idResultadoSerologia]);
        let pv = await db.query(`SELECT *
        FROM programasvacunacion_det
        WHERE idEnfermedad = ? and idProgramaVacunacion = ?`,
        [Resultado.Enfermedad.idEnfermedad, Resultado.ProgramaVacunacion]);
        let arraySem = [];
        let sem 
        if(pv.length != 0){
            sem = await db.query(`SELECT Semana 
            FROM(
                SELECT rsd.Semana as Semana
                FROM resultadosserologia_det rsd
                INNER JOIN resultadosserologia rs ON rs.idResultadoSerologia = rsd.idResultadoSerologia
                WHERE rsd.idEnfermedad = ${Resultado.Enfermedad.idEnfermedad} and 
                rsd.idResultadoSerologia = ${Resultado.idResultadoSerologia}
            UNION ALL
                SELECT pvd.Semana as Semana
                FROM programasvacunacion_det pvd
                WHERE pvd.idEnfermedad = ${Resultado.Enfermedad.idEnfermedad} and 
                pvd.idProgramaVacunacion = ${Resultado.ProgramaVacunacion}
            ) w
            GROUP BY Semana
            ORDER BY Semana`)
        }else{
            sem = await db.query(`SELECT Semana 
            FROM resultadosserologia_det 
            WHERE idEnfermedad = ? and idResultadoSerologia = ?
            GROUP BY Semana
            ORDER BY Semana`,
            [Resultado.Enfermedad.idEnfermedad, Resultado.idResultadoSerologia])
        }
        for (let i = 0; i < sem.length; i++) {
            const e = sem[i];
            arraySem.push(e.Semana);
        }
        let std = await db.query(`SELECT * 
        FROM standard_serologia 
        WHERE IdEnfermedad = ?
        ORDER BY Semana`,
        [Resultado.Enfermedad.idEnfermedad]);
        return {
            rows,
            pv,
            std,
            sem: arraySem
        };
    },
    graficarComparativo:async function(Resultado) {
        let rows = await db.query(`SELECT * 
        FROM resultadosserologia_det
        WHERE idEnfermedad = ${Resultado.Enfermedad.idEnfermedad} 
        and idLote IN (${Resultado.lotes.join()})
        ORDER BY Semana`)
        return rows;
    },
    importar: async function(Resultado) {
        let idResultadoSerologia = Resultado.idResultadoSerologia;
        let filas = Resultado.filas;
        let idLevante = Resultado.idLevante;
        let FechaRegistro = Resultado.FechaRegistro;
        let idUsuario = Resultado.idUsuario;
        let observaciones = [];
        let insertados_temp = [];
        for (let i = 0; i < filas.length; i++) {
            const e = filas[i];
            e.nroFila = (i+1)
            e.exist_LT = '';
            e.pert_LEV = '';
            e.exist_ENF = '';
            e.valid_Semana = '';
            e.valid_GMT = '';
            e.valid_CV = '';
            e.valid_Maximo = '';
            e.valid_Minimo = '';
            e.valid_Promedio = '';
            let exist_LT = await db.query(`SELECT *
            FROM lotes
            WHERE lote = '${e.Lote}'`);
            if(exist_LT.length != 1){
                e.exist_LT = false;
                observaciones.push(e);
            }else{
                let idLote = exist_LT[0].idLote;
                let NombreLote = exist_LT[0].lote;
                let pert_LEV = await db.query(`SELECT *
                FROM lotes
                WHERE idLote = ${idLote} and idLevante = ${idLevante}`);
                if(pert_LEV.length != 1){
                    e.pert_LEV = false;
                    observaciones.push(e);
                }else{
                    let exist_ENF = await db.query(`SELECT *
                    FROM enfermedades
                    WHERE Abreviacion = '${e.Enfermedad}'`);
                    if(exist_ENF.length != 1){
                        e.exist_ENF = false;
                        observaciones.push(e);
                    }else{
                        let idEnfermedad = exist_ENF[0].idEnfermedad;
                        let Nombre = exist_ENF[0].Nombre;
                        let Semana = e.Semana;
                        if(typeof Semana == 'number'){
                            if(typeof e.GMT == 'number'){
                                if(typeof e.CV == 'number'){
                                    if(typeof e.Maximo == 'number'){
                                        if(typeof e.Minimo == 'number'){
                                            if(typeof e.Promedio == 'number'){
                                                let rows = await db.query(`INSERT INTO resultadosserologia_det_temp (
                                                    idResultadoSerologia, idLote, NombreLote, Semana, idEnfermedad, Enfermedad, GMT, CV, Promedio,
                                                    Maximo, Minimo, FechaRegistro, idUsuario) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                                                    [   idResultadoSerologia, idLote, NombreLote, Semana, idEnfermedad,
                                                        Nombre, e.GMT, e.CV, e.Promedio, e.Maximo, e.Minimo,
                                                        new Date(FechaRegistro), idUsuario ])
                                                insertados_temp.push(rows.insertId);
                                            }else{
                                                e.valid_Promedio = false;
                                                observaciones.push(e);
                                            }
                                        }else{
                                            e.valid_Minimo = false;
                                            observaciones.push(e);
                                        }
                                    }else{
                                        e.valid_Maximo = false;
                                        observaciones.push(e);
                                    }
                                }else{
                                    e.valid_CV = false;
                                    observaciones.push(e);
                                }
                            }else{
                                e.valid_GMT = false;
                                observaciones.push(e);
                            }
                        }else{
                            e.valid_Semana = false;
                            observaciones.push(e);
                        }
                    } 
                }
            }
        }
        let inserto = 0;
        if(observaciones.length == 0){
            let duplicados = false;
            for (let i = 0; i < insertados_temp.length; i++) {
                const e = insertados_temp[i];
                let temp = await db.query(`SELECT * FROM resultadosserologia_det_temp
                    WHERE idDetalleResultadoSerologia = ${e}`)
                if(temp.length == 1){
                    let t = temp[0];
                    let validator = await db.query(`SELECT * FROM resultadosserologia_det
                    WHERE idResultadoSerologia = ${t.idResultadoSerologia}
                    and idLote = ${t.idLote} and Semana = ${t.Semana} and idEnfermedad = ${t.idEnfermedad}`);
                    console.log('validator :>> ', validator);
                    if(validator.length == 0){
                        let rows = await db.query(`INSERT INTO resultadosserologia_det (
                        idResultadoSerologia, idLote, NombreLote, Semana, idEnfermedad, Enfermedad, GMT, CV, Promedio,
                        Maximo, Minimo, FechaRegistro, idUsuario) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                        [   t.idResultadoSerologia, t.idLote, t.NombreLote, t.Semana, t.idEnfermedad,
                            t.Enfermedad, t.GMT, t.CV, t.Promedio, t.Maximo, t.Minimo,
                            new Date(t.FechaRegistro), t.idUsuario ])
                        inserto = inserto + 1;
                    }else{
                        duplicados = true;
                    }
                    let dlt = await db.query(`DELETE FROM resultadosserologia_det_temp
                        WHERE idDetalleResultadoSerologia = ${e}`)
                }
            }
            return {
                success : true,
                message : 'Se registró correctamente',
                duplicados,
                inserto
            }
        }else{
            return {
                success : false,
                observaciones,
                message : 'Existen observaciones',
                insertados_temp
            }
        }
    },
    eliminar_temp: async function(Resultado) {
        let it = Resultado.insertados_temp;
        for (let i = 0; i < it.length; i++) {
            const e = it[i];
            let dlt = await db.query(`DELETE FROM resultadosserologia_det_temp
            WHERE idDetalleResultadoSerologia = ${e}`)
        }
        return {
            success : true,
            message : 'Se cancelo el registro correctamente'
        }
    },
    registrar_temp: async function(Resultado) {
        let it = Resultado.insertados_temp;
        let inserto = 0;
        let duplicados = false;
        for (let i = 0; i < it.length; i++) {
            const e = it[i];
            let temp = await db.query(`SELECT * FROM resultadosserologia_det_temp
                WHERE idDetalleResultadoSerologia = ${e}`)
            if(temp.length == 1){
                let t = temp[0];
                let validator = await db.query(`SELECT * FROM resultadosserologia_det
                WHERE idResultadoSerologia = ${t.idResultadoSerologia}
                and idLote = ${t.idLote} and Semana = ${t.Semana} and idEnfermedad = ${t.idEnfermedad}`);
                console.log('validator :>> ', validator);
                if(validator.length == 0){
                    let rows = await db.query(`INSERT INTO resultadosserologia_det (
                    idResultadoSerologia, idLote, NombreLote, Semana, idEnfermedad, Enfermedad, GMT, CV, Promedio,
                    Maximo, Minimo, FechaRegistro, idUsuario) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    [   t.idResultadoSerologia, t.idLote, t.NombreLote, t.Semana, t.idEnfermedad,
                        t.Enfermedad, t.GMT, t.CV, t.Promedio, t.Maximo, t.Minimo,
                        new Date(t.FechaRegistro), t.idUsuario ])
                    inserto = inserto + 1;
                }else{
                    duplicados = true;
                }
                let dlt = await db.query(`DELETE FROM resultadosserologia_det_temp
                    WHERE idDetalleResultadoSerologia = ${e}`)
            }
        }
        return {
            success : true,
            message : 'Se registró correctamente',
            duplicados,
            inserto
        }
    }
}
module.exports=resultadosserologia;