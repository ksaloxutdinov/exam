export const successResponse = (res, message = 'Success', data = undefined, code = 200) => {
    return res.status(code).json({
        statusCode: code,
        message,
        data
    });
}

export const errorResponse = (res, message = 'Internal server error', code = 500) => {
    return res.status(code).json({
        statusCode: code,
        message
    });
}