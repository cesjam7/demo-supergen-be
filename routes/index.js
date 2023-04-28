var express = require('express');
var router = express.Router();
var usuario = require('../models/usuario');
const auth = require('../middlewares/auth')

usuario.getUltimoUsuario(function (err, rows) {
    if (err) {
        console.log('There was an error connecting', err);
    } else {
        console.log('Successful connection ', rows);
    }
});

/* GET home page. */
router.get('/test', function (req, res, next) {
    usuario.getUltimoUsuario(function (err, rows) {
        if (err) {
            console.log('There was an error connecting', err);
        } else {
            console.log('Successful connection ', rows);
        }
        res.end('test');
    });
});
router.post('/auth-proyeccion', async (req, res) => {
    let rows = await usuario.authProyeccion(req.body);
    if (rows.length == 0) {
        res.status(404).send({ message: 'No se encontró el usuario' })
    } else {
        res.json({
            message: 'Login correcto',
            User: rows[0],
            token: auth.createToken(rows[0].id)
        });
    }
})
router.get('/', function (req, res, next) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ a: 35 }));
});
router.post('/auth', async function (req, res, next) {
    console.log("r", req.body)
    let rows = await usuario.Auth(req.body);
    if (rows.length == 0) {
        res.status(404).send({ message: 'No se encontró el usuario' })
    } else {
        res.json({
            message: 'Login correcto',
            User: rows[0],
            token: auth.createToken(rows[0].id)
        });
    }
});

module.exports = router;
