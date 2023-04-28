var express = require('express');
var router = express.Router();
var granjas = require('../models/granjas');
const auth = require('../middlewares/auth')

router.get('/:id?', auth.isAuth, function (req, res, next) {

    console.log('todos', req.params)
    if (req.params.id > 0) {
        console.log('ruta', req.params.id)
        granjas.getGranjaById(req.params.id, function (err, rows) {

            if (err) {
                res.json(err);
            }
            else {
                res.json(rows);
            }
        });
    }
    else {

        granjas.getAllGranjas(function (err, rows) {

            if (err) {
                res.json(err);
            }
            else {
                res.json(rows);
            }

        });
    }
});
router.post('/', auth.isAuth, function (req, res, next) {

    granjas.addGranja(req.body, function (err, count) {

        //console.log(req.body);
        if (err) {
            res.json(err);
        }
        else {
            res.json(req.body);//or return count for 1 & 0
        }
    });
});
router.post('/:id', auth.isAuth, function (req, res, next) {
    granjas.deleteAll(req.body, function (err, count) {
        if (err) {
            res.json(err);
        }
        else {
            res.json(count);
        }
    });
});
router.delete('/:id', auth.isAuth, function (req, res, next) {

    granjas.deleteGranja(req.params.id, function (err, count) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(count);
        }

    });
});
router.put('/:id', auth.isAuth, function (req, res, next) {

    granjas.updateGranja(req.params.id, req.body, function (err, rows) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(rows);
        }
    });
});
router.get("/destinatarios/listar", auth.isAuth, async (req, res) => {
    try {
        const data = await granjas.listarDestinatarios()
        res.send(data)
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

})
router.post("/destinatarios/guardar", auth.isAuth, async (req, res) => {
    try {
        await granjas.crearNuevoDestinatario(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

})
router.post("/destinatarios/actualizar", auth.isAuth, async (req, res) => {
    try {
        await granjas.actualizarDestinatario(req.body)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

})
router.put("/destinatarios/desactivar/:id", auth.isAuth, async (req, res) => {
    try {
        await granjas.desactivarDestinatario(req.params.id)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})
router.put("/destinatarios/activar/:id", auth.isAuth, async (req, res) => {
    try {
        await granjas.activarDestinatario(req.params.id)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})
router.post("/consulta/traslado", auth.isAuth, async (req, res) => {
    try {
        const data = await granjas.getConsultaTraslado(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})
router.get("/consulta/traslado/ruta", auth.isAuth, async (req, res) => {
    try {
        const data = await granjas.getConsultaTrasladoRuta()
        res.send(data)
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})
router.post("/consulta/alimentacion", auth.isAuth, async (req, res) => {
    try {
        const data = await granjas.getConsultaAlimentacion(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})
module.exports = router;
