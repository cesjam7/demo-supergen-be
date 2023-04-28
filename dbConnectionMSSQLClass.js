const mssql = require('mssql');
const ServerError = require('./error');
const randStr = require("uuid")
const _ = require("lodash")
console.log("randStr", randStr.v4())

class ConexionMssql {
    dbData;

    constructor(nombreBd = 'DBCostsSG') {
        this.dbData = {
            server: '190.187.114.60',
            user: 'sa',
            password: 'Supergen321',
            database: nombreBd,
            pool: {
                max: 150,
                min: 0,
                idleTimeoutMillis: 30000
            }
        }
        if (typeof dbData !== 'undefined') {
            Object.assign(this.dbData, dbData);
        }
    }

    createPool = async () => {
        try {
            /* 
                        const pool = await mssql.connect(this.dbData); */
            const pool = await mssql.connect(this.dbData)
            /* const poolPromise = await pool.connect(); */
            return pool;
        } catch (err) {

            console.log("error BDDD", err)
        }

    };

    end = () => {
        /* 		return mssql.close();
         */
    };

    queryInsertarEnLotes(tabla, valores = []) {
        let placeholderRegistros = [];
        let placeholderStr;
        let sql = '';
        let valoresV = "("
        const propiedades = Object.keys(valores[0])
        if (propiedades == null || propiedades == undefined) {
            throw new ServerError("Al menos un valor es necesario", 500)
        }
        for (const valor of valores) {
            let valoresProcesos = []
            for (const key of propiedades) {
                const valorKey = valor[key]
                const valorProcess = typeof valorKey == 'string' ? `'${valorKey}'` : valorKey
                valoresProcesos.push(valorProcess)
/*                 valoresV+=`${ typeof valorKey == 'string' ? `'${valorKey}'` : valorKey},`
 */            }
            /*      valoresV+=")" */

            placeholderRegistros.push(`(${valoresProcesos.map(String)})`)
        }
        placeholderStr = placeholderRegistros.map(String);
        sql = `INSERT INTO ${tabla}(${propiedades}) VALUES ${placeholderStr}`;
        /* const query = this.prepare(sql, value); */
        return sql;
    }
    procesarCondicion(condiciones, valores) {
        let arrCondicion = [];
        if (typeof condiciones == 'object') {
            for (const key in condiciones) {
                const condicion = condiciones[key];
                if (typeof condicion == 'object' && condicion != null) {
                    if (typeof condicion['valor'] == 'object') {
                        let list = [];
                        switch (condicion['operador']) {
                            case 'IN':
                                for (var i in condicion['valor']) {
                                    let rand = 'c' + randStr.v4().slice(0, 30); //Magia, no pregunten // no es magia gente, solo usa una libreria para generar string aliatorios. By alfonsodav
                                    valores[rand] = condicion['valor'][i];
                                    list.push(`:${rand}`);
                                }

                                arrCondicion.push(`${key} ${condicion['operador']} (${list.join(',')})`);
                                break;

                            case 'BETWEEN':
                                for (var i in condicion['valor']) {
                                    let rand = 'c' + randStr.v4().slice(0, 30); //Magia, no pregunten// no es magia gente, solo usa una libreria para generar string aliatorios. By alfonsodav
                                    valores[rand] = condicion['valor'][i];
                                    list.push(`:${rand}`);
                                }

                                arrCondicion.push(`${key} ${condicion['operador']} ${list.join(' AND ')}`);

                                break;

                            default:
                                break;
                        }
                    } else if (condicion['valor'] !== undefined) {
                        let rand = 'c' + randStr.v4().slice(0, 30); //Magia, no pregunten// no es magia gente, solo usa una libreria para generar string aliatorios. By alfonsodav
                        arrCondicion.push(`${key} ${condicion['operador']} :${rand}`);
                        valores[rand] = condicion['valor'];
                    }
                } else if (typeof condicion !== 'undefined') {
                    let rand = 'c' + randStr.v4().slice(0, 30); //Magia, no pregunten
                    console.log(rand), arrCondicion.push(`${key} = :${rand}`);
                    valores[rand] = condicion;
                }
            }
        }
        return arrCondicion.length ? arrCondicion.join(' AND ') : '1';
    }

    siguienteFila = async (tabla, id, campos, condiciones) => {
        let select = '*';
        if (typeof campos !== 'undefined') {
            select = campos.join(',');
        }
        let valores = {};

        condiciones['id'] = { valor: id, operador: '>' };

        let where = this.procesarCondicion(condiciones, valores);

        let sql = `SELECT ${select} FROM ${tabla} WHERE id = (SELECT MIN(id) FROM ${tabla} WHERE ${where})`;
        return this.ejecutarQueryPreparado(sql, valores).then((filas) => filas[0]);
    };
    /**
     * Regresa array con todos los nombre de los campos tiene la tabla especificada
     *
     * @param      string tabla        			tabla en la cual buscar
     *
     */
    campos = async (tabla) => {
        let sql = `SELECT COLUMN_NAME as campo
		FROM INFORMATION_SCHEMA.COLUMNS
		WHERE TABLE_SCHEMA = :db AND TABLE_NAME = :tabla;`;

        return await this.ejecutarQueryPreparado(sql, { tabla: tabla, db: this.dbData['database'] }).then((campos) => {
            return campos.map((campo) => campo['campo']);
        });
    };

    contar = (tabla, condiciones) => { };

    /**
     * Regresa true si existe un registro que cumpla con las condiciones
     *
     * @param      string tabla        			Tabla en la cual buscar
     * @param      DBCondiciones	condiciones  	Condiciones del registro
     *
     */
    existe = async (tabla, condiciones) => {
        let valores = {};
        let where = this.procesarCondicion(condiciones, valores);
        let sql = `SELECT EXISTS(SELECT 1 FROM ${tabla} WHERE ${where}) as existe`;
        return await this.ejecutarQueryPreparado(sql, valores).then((res) => {
            return !!res[0].existe;
        });
    };
    queryInsertar() { }

    /**
     * Inserta registros en la tabla especificada
     *
     * @param      string		tabla     		Tabla en la cual buscar
     * @param      object[]		valores   		valores del registro a crear
     * @param      boolean=false	actualizar   	Si actualiza cuando encuentra registro repetido
     *
     */
    insertar = async (tabla, valores, actualizar = false) => {
        let value = {};
        let placeholderRegistros = [];
        /*         let placeholderStr;
                let camposStr;
        
                for (var i in valores) {
                    let campos = [];
                    let placeholder = [];
                    for (var key in valores[i]) {
                        const rand = 'c' + randStr.v4().slice(0, 30);
                        campos.push(key);
                        placeholder.push(`:${rand}`);
                        value[rand] = valores[i][key];
                    }
                    camposStr = '(' + campos.join(',') + ')';
                    placeholderRegistros.push('(' + placeholder.join(',') + ')');
                }
                placeholderStr = placeholderRegistros.join(',');
         */
        let sql = this.queryInsertarEnLotes(tabla, valores);

        //TODO buscar reemplazo de onduplicate para mssql
        if (actualizar) {
            // await this.campos(tabla).then(campos => {
            // campos.shift();
            let camposArr = [];
            for (let key in valores[0]) {
                camposArr.push(` \`${key}\`=VALUES(\`${key}\`)`);
            }
            sql += ` ON DUPLICATE KEY UPDATE${camposArr.join(',')}`;
            // });
        }
        return this.ejecutarQueryPreparado(`${sql};;SELECT SCOPE_IDENTITY() as id;`, {}, true);
    };

    consultar = async function (query, onlySingleValue = false) {
        const pool = await this.createPool();
        const { recordset } = await pool.request().query(query);
        /*         await pool.close(); */
        if (onlySingleValue) {
            return recordset[0];
        }
        return recordset;
    };

    consultWithPagination = async function (
        query,
        where,
        size = 1,
        page = 1,
        withState = false,
        columnState = 'estado',
        stateActivo = 'Activo',
        orderBy = 'id',
        orderType = 'ASC' || 'DESC '
    ) {
        const skip = size * page - size;
        const pool = await this.createPool();
        let whereProced = where;
        if (withState) {
            whereProced += ` ${whereProced ? 'and' : ' '} ${columnState} = '${stateActivo}' `;
        }
        let queryParse = `${query} ${whereProced ? 'where ' + whereProced : ''} ORDER BY ${orderBy} ${orderType} ${size != 0 ? 'OFFSET ' + skip + ' ROWS FETCH NEXT ' + size + ' ROWS ONLY' : ''
            } `;
        console.log('qu', queryParse);
        const { recordset } = await pool.query(queryParse);
/*         await pool.close();
 */        return recordset;
    };

    /**
     * Lee los campos de los registros que cumplan con las condiciones dadas
     *
     * @param      string		tabla     		Tabla en la cual buscar
     * @param      array   		campos       	Campos a retornar
     * @param      DBCondiciones	condiciones  	Condiciones de los registros
     *
     */
    leer = async (tabla, campos = [], condiciones, join, group) => {
        let select = '*';
        let valores = {};
        let where = this.procesarCondicion(condiciones, valores);

        if (typeof campos !== 'undefined') {
            select = campos.join(',');
        }
        if (typeof group === 'undefined') {
            group = '';
        }

        if (typeof join !== 'undefined') {
        }

        let sql = condiciones
            ? `SELECT ${select} FROM ${CONFIG['db']['name']}.dbo.${tabla} WHERE ${where} ${group}`
            : `SELECT ${select} FROM ${tabla} ${group}`;
        return this.ejecutarQueryPreparado(sql, valores);
    };

    /**
     * Actualiza los registros que cumplan las condiciones con los valores dados
     *
     * @param      string		tabla     		Tabla en la cual buscar
     * @param      object[]		valores   		valores del registro a crear
     * @param      boolean=false	actualizar   	Si actualiza cuando encuentra registro repetido
     *
     */
    actualizar = (tabla, valores, condiciones) => {
        let set = [];
        let values = {};

        _.each(valores, (valor, campo) => {
            const rand = 'c' + randStr.v4().slice(0, 50); //Magia, no pregunten
            set.push(`${campo}=:${rand}`);
            values[rand] = valor;
        });
        let where = this.procesarCondicion(condiciones, values);
        console.log("WHEREEE", where)
        let sql = `UPDATE  ${tabla} SET ${set} WHERE ${where}`;
        return this.ejecutarQueryPreparado(sql, values);
    };

    eliminar = (tabla, condiciones) => {
        let valores = {};
        let where = this.procesarCondicion(condiciones, valores);
        let sql = `DELETE FROM ${tabla} WHERE ${where}`;
        return this.ejecutarQueryPreparado(sql, valores);
    };

    simQuery = (sql, value) => {
        _.each(value, (val, key) => {
            let regex = new RegExp(`:${key}`, 'g');
            sql = sql.replace(regex, val);
        });

        return sql.replace(/[ \t\s]+/g, ' ');
    };

    js2mssql = (val) => {
        switch (typeof val) {
            case 'number':
                return mssql.Int;

            case 'boolean':
                return mssql.TinyInt;
            case 'object':
                if (val instanceof Date) return mssql.DateTime;
                return mssql.VarChar;

            case 'string':
            default:
                return mssql.VarChar;
        }
    };

    prepare = (sql, valores) => {
        //TODO de verdad hacer un prepare con sql.input
        _.each(valores, (valor, key) => {
            sql = sql.replace(`:${key}`, typeof valor == 'string' ? `'${valor}'` : valor);
        });

        return sql;
    }
    /**
     *
     * Ejecuta un query preparado
     *
     */
    ejecutarQueryPreparado = async (sql, valores, onlySingleValue = false) => {

        const pool = await this.createPool();
        try {
            if (Object.values(valores).indexOf(undefined) > -1) throw new ServerError('undefined_value', 500);
            const query = this.prepare(sql, valores)
            const { recordset } = await pool.query(query);
            let record = recordset;
            if (onlySingleValue) {
                record = recordset[0];
            }
            return record;
        } catch (err) {
            /*       if (CONFIG['debug']) {
              console.log('[ERR]', err);
              console.log('[SQL]', sql);
              console.log('[VALORES]', valores);
            } */
            throw err;
        } 
    };
}
module.exports = function (dbName = "DBCostsSG") {
    return new ConexionMssql(dbName);
};