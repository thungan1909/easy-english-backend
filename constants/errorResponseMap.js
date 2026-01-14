// constants/errorResponseMap.js
const ERRORS = require("./errorCodes");

module.exports = {
    [ERRORS.USER_NOT_FOUND]: {
        status: 404,
        message: "User not found.",
    },
    [ERRORS.USER_EXISTS]: {
        status: 400,
        message: "Username or email already exists.",
    },
    [ERRORS.MISSING_CREDENTIALS]: {
        status: 400,
        message: "Username and password are required.",
    },
    [ERRORS.INVALID_CREDENTIALS]: {
        status: 401,
        message: "Invalid username or password.",
    },
    [ERRORS.NOT_VERIFIED]: {
        status: 403,
        message: "Please verify your account first.",
    },
    [ERRORS.ALREADY_VERIFIED]: {
        status: 409,
        message: "User is already verified. Please sign in.",
    },
    [ERRORS.CODE_EXPIRED]: {
        status: 400,
        message: "Verification code has expired.",
    },
    [ERRORS.INVALID_CODE]: {
        status: 400,
        message: "Invalid verification code.",
    },
    [ERRORS.RESET_NOT_CONFIRMED]: {
        status: 400,
        message: "Reset code has not been confirmed.",
    },
    [ERRORS.COOLDOWN_ACTIVE]: {
        status: 429,
        message: "Please wait before requesting another code.",
    },
    [ERRORS.INCORRECT_PASSWORD]: {
        status: 400,
        message: "Current password is incorrect.",
    },
};
