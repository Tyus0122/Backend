const limitHelper = [
    {
        $skip: constants.PAGE_LIMIT * parseInt(req.query.page)
    },
    {
        $limit: constants.PAGE_LIMIT
    },
]
module.exports = {
    limitHelper
}