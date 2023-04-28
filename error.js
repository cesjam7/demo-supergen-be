class ServerError extends Error {
    codigo;
    constructor(mensaje, codigo) {
        super(mensaje);
        this.codigo = codigo;
    }
}

module.exports = ServerError