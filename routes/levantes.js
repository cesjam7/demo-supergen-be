var express = require('express');
var router = express.Router();
var levantes = require('../models/levantes');
const auth = require('../middlewares/auth')

router.get('/:id?', auth.isAuth, async function (req, res, next) {

    if (req.params.id == 'lotes') {

        levantes.getLotesLevante(function (err, rows) {

            if (err) {
                res.json(err);
            }
            else {
                res.json(rows);
            }
        });
    } else if (req.params.id == 'ultimo') {

        let rows = await levantes.getUltimoLevante();
        res.json(rows[0]);
    } else if (req.params.id > 0) {

        levantes.getLevanteById(req.params.id, function (err, rows) {

            if (err) {
                res.json(err);
            }
            else {
                res.json(rows);
            }
        });
    } else {

        levantes.getAllLevantes(function (err, rows) {

            if (err) {
                res.json(err);
            }
            else {
                res.json(rows);
            }

        });
    }
});
router.get("/aveDiaGr/:idLevante", auth.isAuth, async function (req, res) {
    try {
        const rows = await levantes.aveDiaGr(req.params.idLevante)
        res.json(rows)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/aveDiaGr/update", auth.isAuth, async function (req, res) {
    try {
        await levantes.updateAveDiaGr(req.body.rows)
        res.status(200).send({ message: "Actualizado" })

    } catch (error) {
        res.status(500).send(error)
    }
})
router.get('/detalle/:id', auth.isAuth, async function (req, res, next) {

    let rows = await levantes.getLevanteById(req.params.id);
    res.json(rows);
})

router.post('/', auth.isAuth, async function (req, res, next) {

    await levantes.addLevante(req.body);
    res.json(req.body);
});
router.post('/:id', auth.isAuth, function (req, res, next) {
    levantes.deleteAll(req.body, function (err, count) {
        if (err) {
            res.json(err);
        }
        else {
            res.json(count);
        }
    });
});
router.delete('/:id', auth.isAuth, function (req, res, next) {

    levantes.deleteLevante(req.params.id, function (err, count) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(count);
        }

    });
});
router.put('/lotes/:id', auth.isAuth, async function (req, res, next) {

    let rows = await levantes.updateLevanteLotes(req.params.id, req.body);
    res.json(rows);
});
router.put('/:id', auth.isAuth, function (req, res, next) {

    levantes.updateLevante(req.params.id, req.body, function (err, rows) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(rows);
        }
    });
});

router.get("/levantes/levantesAppProduccion", auth.isAuth, async (req, res) => {
    try {
        const levantesData = await levantes.listarLevantesAppProduccion()
        res.send(levantesData);
    } catch (error) {
        res.status(500).send(error)
    }
})
module.exports = router;
