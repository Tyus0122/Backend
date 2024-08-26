class SuccessResponse {
    constructor(res, data) {
        this.data = data;
        res.status(200).json(this.data)
    }
}
class ErrorResponse {
    constructor(res, data, code=500) {
        this.data = {
            error: data
        };
        res.status(code).json(this.data)
    }
}
module.exports = {
    SuccessResponse,
    ErrorResponse,
}