var mysql = require('mysql');
var os = require('os');
const { promisify } = require('util');
let hostname = os.hostname();

console.log("host", hostname)
var conexion = {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'delphustechge3',
    multipleStatements: true
};

if (hostname == "DESKTOP-B9DMN09" || hostname == "DESKTOP-VVN6JPQ" || hostname == "EQUIPO") {
    var conexion = {
        host: '159.65.47.181',
        port: 3306,
        user: 'Developer1',
        password: 'Pa$$w0rd',
        database: 'supergen',
        multipleStatements: true
    };
    console.log("jorge is conecting ... ")
    // var conexion = {
    //     host: '127.0.0.1',
    //     port: 3306,
    //     user: 'root',
    //     password: 'mysql',
    //     database: 'supergen',
    //     multipleStatements: true
    // };
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
if (hostname == "DESKTOP-MFKBCR9") {
    conexion = {
        host: '127.0.0.1',
        port: 3306,
        user: 'happy',
        password: 'happy',
        database: 'supergennew',

        multipleStatements: true
    };
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
if (hostname == "Antony") {
    conexion = {
        host: '159.65.47.181',
        port: 3306,
        user: 'Developer1',
        password: 'Pa$$w0rd',
        database: 'supergen',
        multipleStatements: true
    }
}
if (hostname == "Jair_Wilmer") {
    conexion = {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: '',
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
var connection = mysql.createPool(conexion);
connection.query = promisify(connection.query)
module.exports = connection;