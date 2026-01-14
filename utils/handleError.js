const errorMap = require("../constants/errorResponseMap");

const handleError = (res, err) => {
    const error = errorMap[err.message];
    if (!error) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }

    return res.status(error.status).json({ message: error.message });
}

module.exports = handleError;