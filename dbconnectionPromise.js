var mysql = require('mysql');
var os = require('os');
let hostname = os.hostname();
console.log("hos", hostname)
var conexion = {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'delphustechge3',
    multipleStatements: true
};


if (hostname == "DESKTOP-B9DMN09" || hostname == "DESKTOP-VVN6JPQ" || hostname=="EQUIPO") {
    var conexion = {
        host: '159.65.47.181',
        port: 3306,
        user: 'Developer1',
        password: 'Pa$$w0rd',
        database: 'supergen',
        multipleStatements: true
    };
    console.log("jorge is conecting ... ")
        /*var conexion = {
            host: '127.0.0.1',
            port: 3306,
            user: 'root',
            password: 'mysql',
            database: 'supergen',
            multipleStatements: true
        };*/
}

if (hostname == "DESKTOP-DQHFQMM" || hostname == "DESKTOP-RMVE4RO" || hostname == 'OMBC-DESKTOP-H067CHB' || hostname === 'DESKTOP-ESGS6RB') {
    var conexion = {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: '',
        database: 'supergen',
        multipleStatements: true
    }
}

if (hostname == 'SUPERGEN' || hostname == 'DESKTOP-GDNKSOO' || hostname == 'ubuntu-s-1vcpu-1gb-nyc1-01') {
    var conexion = {
        host: '127.0.0.1',
        port: 3306,
        user: 'Developer1',
        password: 'Pa$$w0rd',
        database: 'supergen',
        multipleStatements: true
    }
}
if (hostname == "DESKTOP-7DN31TS") {
    conexion = {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: '',
        database: 'supergen',
        multipleStatements: true
    }
}
if (hostname == "tony") {
    conexion = {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: 'root',
        database: 'supergen',
        multipleStatements: true
    }
}
if (hostname == "DESKTOP-GCM75LV") {
    conexion = {
        host: '159.65.47.181',
        port: 3306,
        user: 'Developer1',
        password: 'Pa$$w0rd',
        database: 'supergen',
        multipleStatements: true
    }
}
if (hostname == "SERVIDOR") {
    conexion = {
        host: '159.65.47.181',
        port: 3306,
        user: 'Developer1',
        password: 'Pa$$w0rd',
        database: 'supergen',
        multipleStatements: true
    }
}
if (hostname == "code") {
    conexion = {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: 'root',
        database: 'supergen',
        multipleStatements: true
    }
}
if (hostname == "LAPTOP-UNPMDLR2") {
    conexion = {
        host: '127.0.0.1',
        port: 3306,
        user: 'happy',
        password: 'happy',
        database: 'supergennew',

        multipleStatements: true
    };
}
const pool = mysql.createPool(conexion);
const connection = () => {
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
const query = (sql, binding) => {
    return new Promise((resolve, reject) => {
        pool.query(sql, binding, (err, result, fields) => {
            if (err) reject(err);
            resolve(result);
        });
    });
};
module.exports = { pool, connection, query }