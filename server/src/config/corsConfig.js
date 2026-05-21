const corsOrigins = require("./corsOrigins");

const corsConfig = {
    origin: corsOrigins,
    credentials: true,
}

module.exports = corsConfig;