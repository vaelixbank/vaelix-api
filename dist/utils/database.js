"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const config_1 = __importDefault(require("../config"));
const pool = new pg_1.Pool({
    host: config_1.default.database.host,
    port: config_1.default.database.port,
    database: config_1.default.database.database,
    user: config_1.default.database.user,
    password: config_1.default.database.password,
});
exports.default = pool;
