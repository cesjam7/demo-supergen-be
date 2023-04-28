const mysql = require('mysql');
const os = require('os');
const ServerError = require('./error');
const randStr = require("uuid")
const _ = require("lodash")
console.log("randStr", randStr.v4())
class ConexionMysql {
    dbConfig
    constructor() {
        this.dbConfig = {
            host: '159.65.47.181',
            port: 3306,
            user: 'Developer1',
            password: 'Pa$$w0rd',
            database: 'supergen',
            multipleStatements: true,
            connectionLimit : 10000000,
        };

    }

    async createPool() {
        const pool = mysql.createPool(this.dbConfig)
        const connection = await this.connection(pool)
        console.log("CONNECT", this.dbConfig.database)
        return connection;
    }
    connection(pool) {
        return new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) reject(err)
                console.log("MySQL pool connected: threadId " + connection.threadId);
                const query = (sql, binding) => {
                    return new Promise((resolve, reject) => {
                        connection.query(sql, binding, (err, result) => {
                            if (err) reject(err);
                            resolve(result)
                        })
                    })
                }
                const release = () => {
                    return new Promise((resolve, reject) => {
                        if (err) reject(err);
                        console.log("MySQL pool released: threadId " + connection.threadId);
                        resolve(connection.release());
                    });
                };
                resolve({ query, release });
            })
        })
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
                        let rand = 'c' + randStr.v4().slice(0, 20); //Magia, no pregunten// no es magia gente, solo usa una libreria para generar string aliatorios. By alfonsodav
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
    actualizar = (tabla, valores, condiciones) => {
        let set = [];
        let values = {};

        _.each(valores, (valor, campo) => {
            const rand = 'c' + randStr.v4().slice(0, 30); //Magia, no pregunten
            set.push(`${campo}=:${rand}`);
            values[rand] = valor;
        });
        let where = this.procesarCondicion(condiciones, values);
        let sql = `UPDATE  ${tabla} SET ${set} WHERE ${where}`;
        return this.ejecutarQueryPreparado(sql, values);
    };

    queryInsertarEnLotes = function (tabla, valores = []) {
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
        /*     let value = {};
            let placeholderRegistros = [];
            let placeholderStr;
            let camposStr;
            let sql = ""
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
            sql = `INSERT INTO ${tabla} ${camposStr} VALUES ${placeholderStr}`;
            const query = this.prepare(sql, value)
            return query; */
    }
    insertar = async (tabla, valores = [], actualizar = false) => {
        /*     let value = {};
            let placeholderRegistros = [];
            let placeholderStr;
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
    
            let sql = `INSERT INTO ${tabla} ${camposStr} VALUES ${placeholderStr}`;
            console.log("sql", sql) */
        let sql = this.queryInsertarEnLotes(tabla, valores)
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
        return this.ejecutarQueryPreparado(sql, {}, true);
    }
    prepare = (sql, valores) => {
        //TODO de verdad hacer un prepare con sql.input
        _.each(valores, (valor, key) => {
            sql = sql.replace(`:${key}`, typeof valor == 'string' ? `'${valor}'` : valor);
        });

        return sql;
    }
    ejecutarQueryPreparado = async (sql, valores, onlySingleValue = false) => {

        const pool = await this.createPool();
        try {
            if (Object.values(valores).indexOf(undefined) > -1) throw new ServerError('undefined_value', 500);
            const query = this.prepare(sql, valores)
            const data = await pool.query(query);
            let record = data;
            if (onlySingleValue) {
                record = data[0];
            }
            return record;
        } catch (err) {
            console.log('[ERR]', err);
            console.log('[SQL]', sql);
            console.log('[VALORES]', valores);
            throw err;
        } finally {
            await pool.release();
        }
    };
}
module.exports = new ConexionMysql()