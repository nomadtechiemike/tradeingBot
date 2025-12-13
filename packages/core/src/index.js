"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = exports.releaseWorkerLock = exports.acquireWorkerLock = exports.getDatabase = exports.initializeDatabase = void 0;
__exportStar(require("./types"), exports);
__exportStar(require("./strategy"), exports);
__exportStar(require("./risk"), exports);
var db_1 = require("./db");
Object.defineProperty(exports, "initializeDatabase", { enumerable: true, get: function () { return db_1.initializeDatabase; } });
Object.defineProperty(exports, "getDatabase", { enumerable: true, get: function () { return db_1.getDatabase; } });
Object.defineProperty(exports, "acquireWorkerLock", { enumerable: true, get: function () { return db_1.acquireWorkerLock; } });
Object.defineProperty(exports, "releaseWorkerLock", { enumerable: true, get: function () { return db_1.releaseWorkerLock; } });
var db_2 = require("./db");
Object.defineProperty(exports, "schema", { enumerable: true, get: function () { return db_2.schema; } });
