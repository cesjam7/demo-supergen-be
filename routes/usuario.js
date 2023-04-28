var express = require('express');
var router = express.Router();
var usuario = require('../models/usuario');
const auth = require('../middlewares/auth')

router.get("/getFirma/:id", async (req, res) => {
    try {
        const urlFile = `./firmas/${req.params.id}/firma.jpg`
        res.download(urlFile)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get('/ultimo', auth.isAuth, function (req, res, next) {

    usuario.getUltimoUsuario(function (err, rows) {
        if (err) {
            res.json(err);
        }
        else {
            res.json(rows[0]);
        }

    });
});
router.get('/permisos/:id?', auth.isAuth, function (req, res, next) {
    usuario.getPermisosUsuarios(req.params.id, function (err, rows) {
        if (err) {
            res.json(err);
        }
        else {
            res.json(rows);
        }

    });
});
router.get('/permisos-proyeccion/:id', auth.isAuth, async(req, res) => {
    try {
        res.send(await usuario.getPermisosUsuarioProyeccion(req.params.id))
    } catch (error) {
        res.status(500).send(error);
    }
})
router.get('/:id?', auth.isAuth, function (req, res, next) {

    console.log('todos', req.params)
    if (req.params.id > 0) {
        console.log('ruta', req.params.id)
        usuario.getusuarioById(req.params.id, function (err, rows) {

            if (err) {
                res.json(err);
            }
            else {
                res.json(rows);
            }
        });
    } else {

        usuario.getAllusuario(function (err, rows) {

            if (err) {
                res.json(err);
            }
            else {
                res.json(rows);
            }

        });
    }
});
router.post('/rol', auth.isAuth, function (req, res, next) {

    usuario.addUsuarioRol(req.body, function (err, count) {

        //console.log(req.body);
        if (err) {
            res.json(err);
        }
        else {
            res.json(req.body);//or return count for 1 & 0
        }
    });
});
router.post('/', auth.isAuth, function (req, res, next) {

    usuario.addusuario(req.body, function (err, user) {

        //console.log(req.body);
        if (err) {
            res.json(err);
        }
        else {
            let response = {
                message: user
            };
            res.json(response);//or return count for 1 & 0
        }
    });
});
router.post('/:id', auth.isAuth, function (req, res, next) {
    usuario.deleteAll(req.body, function (err, count) {
        if (err) {
            res.json(err);
        }
        else {
            res.json(count);
        }
    });
});

router.delete('/:id', auth.isAuth, function (req, res, next) {

    usuario.deleteusuario(req.params.id, function (err, count) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(count);
        }

    });
});
router.post("/usuarioPro/proyUsuario", auth.isAuth, async (req, res) => {
    try {
        await usuario.guardarUsuarioProy(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/usuarioPro/proyUsuario/editar", auth.isAuth, async (req, res) => {
    try {
        await usuario.editarUsuarioProy(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get("/usuarios/usuariosProy", auth.isAuth, async (req, res) => {
    try {
        const usuarios = await usuario.getAllUsuarioProy();
        res.send(usuarios)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.put('/rol/:id', auth.isAuth, function (req, res, next) {

    usuario.updateuserroles(req.params.id, req.body, function (err, rows) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(rows);
        }
    });
});
router.put('/:id', auth.isAuth, function (req, res, next) {

    usuario.updateusuario(req.params.id, req.body, function (err, rows) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(rows);
        }
    });
});

router.get('/versionBE/:mod', async function (req, res, next) {
    let rows = await usuario.version(req.params.mod)
    res.json(rows);
})
module.exports = router;
