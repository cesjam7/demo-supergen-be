var db = require('../dbconnection');
const { rows } = require('mssql');

let Cierre = {
    getCierres: async () => {
        let json = {}
        try {
            let rows = await db.query(`SELECT ci.*, IFNULL(us.email,'-') as UsuarioCierre, IFNULL(us1.email,'-') as UsuarioApertura,
		   IFNULL(us2.email,'-') as UsuarioVistoBuenoGranja, IFNULL(us3.email,'-') 
           as UsuarioVistoBuenoCalidad, GROUP_CONCAT(DISTINCT(lo.lote_str) 
           ORDER BY TipoGenero SEPARATOR '-') as NombreLote FROM cierres ci 
           INNER JOIN lotes lo ON lo.idLevante = ci.idLevante 
           LEFT JOIN usuario us ON us.idUsuario = ci.UsuarioCierre 
           LEFT JOIN usuario us1 ON us1.idUsuario = ci.UsuarioApertura
           LEFT JOIN usuario us2 ON us2.idUsuario = ci.UsuarioVistoBuenoGranja
           LEFT JOIN usuario us3 ON us3.idUsuario = ci.UsuarioVistoBuenoCalidad GROUP BY lo.idLevante, Semana`)
            json = {
                success: true,
                messsage: "Extracción de cierres exitoso",
                rows
            }
        } catch (error) {
            console.log('error', error)
            json = {
                success: false,
                message: "Error en el servidor",
                code: error.code
            }
        }
        return json;
    },
    VerifyUpdates: async (Mortalidades) => {
        let cerrado = false;
        try {
            let { edad, semana, idLevante } = Mortalidades;
            let Semana = Math.ceil(edad / 7);
            if(semana){
                let info_semana = await db.query(`SELECT * FROM mortalidadsem WHERE Semana = ? 
                and idLevante = ?`, [semana, idLevante])
                if (info_semana.length != 0) {
                    if (info_semana[0].Estado == 0) {
                        cerrado = true;
                    }else{
                        cerrado = false;
                    }
                }

            }else{
                let info_semana = await db.query(`SELECT * FROM mortalidadsem WHERE Semana = ? 
                and idLevante = ?`, [Semana, idLevante])
                if (info_semana.length != 0) {
                    if (info_semana[0].Estado == 0) {
                        cerrado = true;
                    }else{
                        cerrado = false;
                    }
                }
            }
        } catch (error) {
            console.log('error', error)
        }
        return cerrado;
    },
    getMortalidadAbiertas: async () => {
        let json = {}
        try {
            let rows = await db.query(`SELECT *, GROUP_CONCAT(DISTINCT(lo.lote_str) ORDER BY TipoGenero 
            SEPARATOR '-') as NombreLote FROM mortalidadsem ms INNER JOIN lotes lo ON lo.idLote = ms.idLote 
            WHERE ms.Estado = 1 GROUP BY ms.idLevante`)
            json = {
                success: true,
                message: "Extracción de datos exitosa.",
                rows
            }
        } catch (error) {
            console.log('error', error)
            json = {
                success: false,
                message: "Error en el servidor",
                error: error.code
            }
        }
        return json
    },
    CerrarSemanasLev: async (Semanas) => {
        let json = {}
        try {

            let { idLevante, semana, UsuarioCierre } = Semanas;
            let rows = await db.query(`SELECT * FROM cierres WHERE idLevante = ${idLevante} and Semana = ${semana}`);
            if (rows.length == 0) {
                //INSERT INTO
                await db.query(`INSERT INTO cierres (idLevante, Semana, UsuarioCierre,FechaHoraCierre, Estado) VALUES (?,?,?,?,?)`,
                    [idLevante, semana, UsuarioCierre, new Date(), 0])
            } else {
                //UPDATE SET
                await db.query(`UPDATE cierres SET UsuarioCierre = ${UsuarioCierre}, FechaHoraCierre = ?, Estado = 0
                                WHERE idLevante = ${idLevante} and  Semana = ${semana}`, [new Date()])
            }
            //UPDATE A MORTALIDAD SET ESTADO = 0
            await db.query(`UPDATE mortalidadsem SET Estado = 0 WHERE idLevante = ${idLevante} and Semana = ${semana}`)

            json = {
                success: true,
                message: `Semana ${semana} Cerrada Exitosamente`
            }

        } catch (error) {
            console.log(error)
            json = {
                success: false,
                message: "Error en el servidor",
                code: error.code
            }
        }
        return json;

    },
    AperturarSemanaLev: async (Semanas) => {
        let json = {}
        try {
            let { idLevante, semana, UsuarioApertura } = Semanas;
            let rows = await db.query(`SELECT * FROM cierres WHERE idLevante = ${idLevante} and Semana = ${semana}`);
            if (rows.length != 0) {
                //UPDATE SET
                await db.query(`UPDATE cierres SET UsuarioCierre = ${null}, FechaHoraCierre = ${null}, FechaHoraApertura = ?, 
                            UsuarioApertura = ${UsuarioApertura}, Estado = 1, FechaHoraVistoBuenoGranja = ${null},
                            UsuarioVistoBuenoGranja = ${null}, FechaHoraVistoBuenoCalidad = ${null}, UsuarioVistoBuenoCalidad = ${null}
                            WHERE idLevante = ${idLevante} and  Semana = ${semana}`, [new Date()])
            } else {
                await db.query(`INSERT INTO cierres(UsuarioCierre,FechaHoraCierre,FechaHoraApertura,UsuarioApertura,Estado,FechaHoraVistoBuenoGranja,
                            UsuarioVistoBuenoGranja,FechaHoraVistoBuenoCalidad,UsuarioVistoBuenoCalidad ) VALUES (?,?,?,?,?,?,?,?,?)
                            WHERE idLevante = ${idLevante} and  Semana = ${semana}`, [null, null, new Date(), UsuarioApertura, 1, null, null, null, null])
            }
            //SET UsuarioCierre = ${null}, FechaHoraCierre = ${null}, FechaHoraApertura = ?, 
            //     UsuarioApertura = ${UsuarioApertura}, Estado = 1, FechaHoraVistoBuenoGranja = ${null},
            //  UsuarioVistoBuenoGranja = ${null}, FechaHoraVistoBuenoCalidad = ${null}, UsuarioVistoBuenoCalidad = ${null}
            //idCierre, idLevante, Semana, FechaHoraCierre, UsuarioCierre, FechaHoraApertura, UsuarioApertura, FechaHoraVistoBuenoGranja, UsuarioVistoBuenoGranja, FechaHoraVistoBuenoCalidad, UsuarioVistoBuenoCalidad, Estado
            //UPDATE A MORTALIDAD SET ESTADO = 1
            await db.query(`UPDATE mortalidadsem SET Estado = 1 WHERE idLevante = ${idLevante} and Semana = ${semana}`)

            json = {
                success: true,
                message: `Semana ${semana} Aperturada Exitosamente`
            }

        } catch (error) {
            console.log(error)
            json = {
                success: false,
                message: "Error en el servidor",
                error: error.code
            }
        }
        return json;
    },
    VistoBuenoGranjaLev: async (Semanas) => {
        let json = {}
        try {
            let { idLevante, semana, UsuarioVistoBuenoGranja } = Semanas;
            console.log(UsuarioVistoBuenoGranja)
            let rows = await db.query(`SELECT Estado FROM mortalidadsem  WHERE idLevante = ${idLevante} and Semana = ${semana}`)
            if (rows[0].Estado == 0) {

                await db.query(`UPDATE cierres SET FechaHoraVistoBuenoGranja = ?, UsuarioVistoBuenoGranja = ${UsuarioVistoBuenoGranja}
                 WHERE idLevante = ${idLevante} AND Semana = ${semana} `, [new Date()])

                json = {
                    success: true,
                    message: `Visto Bueno de Granja de la semana ${semana} Exitoso`
                }
            } else {
                json = {
                    success: false,
                    message: `Debe cerrar la semana seleccioando para poder dar el visto Bueno`
                }
            }
        } catch (error) {
            console.log(error)
            json = {
                success: false,
                message: `Error en el Servidor `,
                error: error.code
            }
        }
        return json;
    },
    VistoBuenoCalidadLev: async (Semanas) => {
        let json = {}
        try {
            let { idLevante, semana, UsuarioVistoBuenoCalidad } = Semanas;

            let rows = await db.query(`SELECT Estado FROM mortalidadsem  WHERE idLevante = ${idLevante} and Semana = ${semana}`)
            if (rows[0].Estado == 0) {
                await db.query(`UPDATE cierres SET FechaHoraVistoBuenoCalidad = ?, UsuarioVistoBuenoCalidad = ${UsuarioVistoBuenoCalidad}
                WHERE idLevante = ${idLevante} AND Semana = ${semana} `, [new Date()])
                json = {
                    success: true,
                    message: `Visto Bueno de Calidad de la semana ${semana} Exitoso`
                }
            } else {
                json = {
                    success: false,
                    message: `Debe cerrar la semana seleccioando para poder dar el visto Bueno`
                }
            }

        } catch (error) {
            console.log(error)
            json = {
                success: false,
                message: `Error en el Servidor `,
                error: error.code
            }
        }
        return json;
    },
    getCierresProd: async () => {
        let json = {}
        try {
            let rows = await db.query(`SELECT ci.*, IFNULL(us.email,'-') as UsuarioCierre, IFNULL(us1.email,'-') as UsuarioApertura,
		   IFNULL(us2.email,'-') as UsuarioVistoBuenoGranja, IFNULL(us3.email,'-') 
           as UsuarioVistoBuenoCalidad, GROUP_CONCAT(DISTINCT(lo.lote_str) 
           ORDER BY TipoGenero SEPARATOR '-') as NombreLote FROM cierres_prod ci 
           INNER JOIN lotes lo ON lo.idProduccion = ci.idProduccion 
           LEFT JOIN usuario us ON us.idUsuario = ci.UsuarioCierre 
           LEFT JOIN usuario us1 ON us1.idUsuario = ci.UsuarioApertura
           LEFT JOIN usuario us2 ON us2.idUsuario = ci.UsuarioVistoBuenoGranja
           LEFT JOIN usuario us3 ON us3.idUsuario = ci.UsuarioVistoBuenoCalidad GROUP BY lo.idProduccion, Semana`)
            json = {
                success: true,
                messsage: "Extracción de cierres exitoso",
                rows
            }
        } catch (error) {
            console.log('error', error)
            json = {
                success: false,
                message: "Error en el servidor",
                code: error.code
            }
        }
        return json;
    },
    getMortalidadAbiertasProd: async () => {
        let json = {}
        try {
            let rows = await db.query(`SELECT *, GROUP_CONCAT(DISTINCT(lo.lote_str) ORDER BY TipoGenero 
            SEPARATOR '-') as NombreLote, MIN(Semana) as Semana FROM mortalidad_prod_sem ms INNER JOIN lotes lo ON lo.idLote = ms.idLote 
            WHERE ms.Estado = 1 GROUP BY ms.idProduccion`)
            json = {
                success: true,
                message: "Extracción de datos exitosa.",
                rows
            }
        } catch (error) {
            console.log('error', error)
            json = {
                success: false,
                message: "Error en el servidor",
                error: error.code
            }
        }
        return json
    },
    CerrarSemanasProd: async (Semanas) => {
        let json = {}
        try {

            let { idProduccion, semana, UsuarioCierre } = Semanas;
            let rows = await db.query(`SELECT * FROM cierres_prod WHERE idProduccion = ${idProduccion} and Semana = ${semana}`);
            if (rows.length == 0) {
                //INSERT INTO
                await db.query(`INSERT INTO cierres_prod (idProduccion, Semana, UsuarioCierre,FechaHoraCierre, Estado) VALUES (?,?,?,?,?)`,
                    [idProduccion, semana, UsuarioCierre, new Date(), 0])
            } else {
                //UPDATE SET
                await db.query(`UPDATE cierres_prod SET UsuarioCierre = ${UsuarioCierre}, FechaHoraCierre = ?, Estado = 0
                                WHERE idProduccion = ${idProduccion} and  Semana = ${semana}`, [new Date()])
            }
            //UPDATE A MORTALIDAD SET ESTADO = 0
            await db.query(`UPDATE mortalidad_prod_sem SET Estado = 0 WHERE idProduccion = ${idProduccion} and Semana = ${semana}`)

            json = {
                success: true,
                message: `Semana ${semana} Cerrada Exitosamente`
            }

        } catch (error) {
            console.log(error)
            json = {
                success: false,
                message: "Error en el servidor",
                code: error.code
            }
        }
        return json;

    },
    AperturarSemanaProd: async (Semanas) => {
        let json = {}
        try {
            let { idProduccion, semana, UsuarioApertura } = Semanas;
            let rows = await db.query(`SELECT * FROM cierres_prod WHERE idProduccion = ${idProduccion} and Semana = ${semana}`);
            if (rows.length != 0) {
                //UPDATE SET
                await db.query(`UPDATE cierres_prod SET UsuarioCierre = ${null}, FechaHoraCierre = ${null}, FechaHoraApertura = ?, 
                            UsuarioApertura = ${UsuarioApertura}, Estado = 1, FechaHoraVistoBuenoGranja = ${null},
                            UsuarioVistoBuenoGranja = ${null}, FechaHoraVistoBuenoCalidad = ${null}, UsuarioVistoBuenoCalidad = ${null}
                            WHERE idProduccion = ${idProduccion} and  Semana = ${semana}`, [new Date()])
            } else {
                await db.query(`INSERT INTO cierres_prod (UsuarioCierre,FechaHoraCierre,FechaHoraApertura,UsuarioApertura,Estado,FechaHoraVistoBuenoGranja,
                    UsuarioVistoBuenoGranja,FechaHoraVistoBuenoCalidad,UsuarioVistoBuenoCalidad ) VALUES (?,?,?,?,?,?,?,?,?)
                    WHERE idProduccion = ${idProduccion} and  Semana = ${semana}`, [null, null, new Date(), UsuarioApertura, 1, null, null, null, null])
            }
            //idCierre, idLevante, Semana, FechaHoraCierre, UsuarioCierre, FechaHoraApertura, UsuarioApertura, FechaHoraVistoBuenoGranja, UsuarioVistoBuenoGranja, FechaHoraVistoBuenoCalidad, UsuarioVistoBuenoCalidad, Estado
            //UPDATE A MORTALIDAD SET ESTADO = 1
            await db.query(`UPDATE mortalidad_prod_sem SET Estado = 1 WHERE idProduccion = ${idProduccion} and Semana = ${semana}`)

            json = {
                success: true,
                message: `Semana ${semana} Aperturada Exitosamente`
            }

        } catch (error) {
            console.log(error)
            json = {
                success: false,
                message: "Error en el servidor",
                error: error.code
            }
        }
        return json;
    },
    VistoBuenoGranjaProd: async (Semanas) => {
        let json = {}
        try {
            let { idProduccion, semana, UsuarioVistoBuenoGranja } = Semanas;
            console.log(UsuarioVistoBuenoGranja)
            let rows = await db.query(`SELECT Estado FROM mortalidad_prod_sem  WHERE idProduccion = ${idProduccion} and Semana = ${semana}`)
            if (rows[0].Estado == 0) {

                await db.query(`UPDATE cierres_prod SET FechaHoraVistoBuenoGranja = ?, UsuarioVistoBuenoGranja = ${UsuarioVistoBuenoGranja}
                 WHERE idProduccion = ${idProduccion} AND Semana = ${semana} `, [new Date()])

                json = {
                    success: true,
                    message: `Visto Bueno de Granja de la semana ${semana} Exitoso`
                }
            } else {
                json = {
                    success: false,
                    message: `Debe cerrar la semana seleccioando para poder dar el visto Bueno`
                }
            }
        } catch (error) {
            console.log(error)
            json = {
                success: false,
                message: `Error en el Servidor `,
                error: error.code
            }
        }
        return json;
    },
    VistoBuenoCalidadProd: async (Semanas) => {
        let json = {}
        try {
            let { idProduccion, semana, UsuarioVistoBuenoCalidad } = Semanas;

            let rows = await db.query(`SELECT Estado FROM mortalidad_prod_sem  WHERE idProduccion = ${idProduccion} and Semana = ${semana}`)
            if (rows[0].Estado == 0) {
                await db.query(`UPDATE cierres_prod SET FechaHoraVistoBuenoCalidad = ?, UsuarioVistoBuenoCalidad = ${UsuarioVistoBuenoCalidad}
                WHERE idProduccion = ${idProduccion} AND Semana = ${semana} `, [new Date()])
                json = {
                    success: true,
                    message: `Visto Bueno de Calidad de la semana ${semana} Exitoso`
                }
            } else {
                json = {
                    success: false,
                    message: `Debe cerrar la semana seleccioando para poder dar el visto Bueno`
                }
            }

        } catch (error) {
            console.log(error)
            json = {
                success: false,
                message: `Error en el Servidor `,
                error: error.code
            }
        }
        return json;
    }
};
module.exports = Cierre;