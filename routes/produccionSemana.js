var express = require('express');
var router = express.Router();
var produccionSemana = require('../models/produccionSemana');

router.get('/lote/:id/:idLote',function(req,res,next){
    produccionSemana.getLoteSemanalProduccion(req.params.id,req.params.idLote,function(err,rows){ 
        if(err){
            res.json(err);
        }else{
            res.json(rows);
        }
     });
})

router.get('/data/:id/:idLote',function(req,res,next){
produccionSemana.getAlimentoSemanalProduccion(req.params.id,req.params.idLote,function(err,rows){

    if(err){
        res.json(err);
    }else{
        let data = []
        data.push(rows);
        produccionSemana.getMortalidadSemanalProduccion(req.params.id,req.params.idLote,function(err2,rows2){
            if(err){
                res.json(err2);
            }
            else{
                data.push(rows2);
                produccionSemana.getPesoSemanalProduccion(req.params.id,req.params.idLote,function(err3,rows3){
                    if(err){
                        res.json(err3);
                    }
                    else{      
                        data.push(rows3)                      
                        produccionSemana.getHuevosProduccion(req.params.id,req.params.idLote,function(err4,rows4){
                            if(err){
                                res.json(err4);
                            }
                            else{      
                                data.push(rows4)                      
                                res.json(data);
                            }
                        })
                    }
                })
            }
        })
    }
});
})

router.get('/ultimo-dia/:id?',function(req,res,next){
   produccionSemana.getproduccionSemanaUltimoDia(req.params.id,function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows[0]);
        }
    });
})
router.get('/dia/:idlevante/:edad',function(req,res,next){
    console.log('params', req.params);
   produccionSemana.getproduccionSemanaDia(req.params.idlevante, req.params.edad,function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows[0]);
        }
    });
})
router.get('/levantes/',function(req,res,next){
   produccionSemana.getMortalidadProduccions(function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows);
        }
    });
})
router.get('/levante/:id?',function(req,res,next){
   produccionSemana.getMortalidadProduccion(req.params.id,function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows);
        }
    });
})
router.get('/produccionSemanaes/:id?',function(req,res,next){
   produccionSemana.getMortalidadByIdProduccion(req.params.id,function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows);
        }
    });
})
router.get('/dias/:id?',function(req,res,next){
   produccionSemana.getproduccionSemanaDia(req.params.id,function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows);
        }
    });
})
router.get('/edad-maximo/',function(req,res,next){
   produccionSemana.getEdadMaximo(function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows[0]);
        }
    });
})
router.get('/edad/:id?',function(req,res,next){
   produccionSemana.getEdadEspecifica(req.params.id,function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows);
        }
    });
})
router.get('/dia-inicio/',function(req,res,next){
   produccionSemana.getDiaInicio(function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows[0]);
        }
    });
})
router.get('/:id?',function(req,res,next){

    if(req.params.id > 0){

        produccionSemana.getproduccionSemanaById(req.params.id,function(err,rows){

            if(err)
            {
                res.json(err);
            }
            else{
                res.json(rows);
            }
        });
    }else{

        produccionSemana.getAllproduccionSemana(function(err,rows){

            if(err)
            {
                res.json(err);
            }
            else
            {
                res.json(rows);
            }

        });
    }
});
router.post('/',function(req,res,next){
    produccionSemana.addMortalidad(req.body,function(err,count){

        //console.log(req.body);
        if(err)
        {
            res.json(err);
        }
        else{
            res.json(req.body);//or return count for 1 & 0
        }
    });
});
router.post('/modal/',function(req,res,next){
    produccionSemana.addMortalidadModal(req.body,function(err,count){

        //console.log(req.body);
        if(err)
        {
            res.json(err);
        }
        else{
            res.json(req.body);//or return count for 1 & 0
        }
    });
});
router.post('/:id',function(req,res,next){
    produccionSemana.deleteAll(req.body,function(err,count){
        if(err)
        {
            res.json(err);
        }
        else
        {
            res.json(count);
        }
    });
});
router.delete('/:id',function(req,res,next){

    produccionSemana.deleteproduccionSemana(req.params.id,function(err,count){

        if(err)
        {
            res.json(err);
        }
        else
        {
            res.json(count);
        }

    });
});
router.put('/:id',function(req,res,next){

    produccionSemana.updateMortalidad(req.params.id,req.body,function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else
        {
            res.json(rows);
        }
    });
});
module.exports=router;
