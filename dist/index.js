#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var program = require("Commander");
var node_sp_auth_1 = require("node-sp-auth");
var request = require("request-promise");
var enums_1 = require("./enums");
var Preferences = require('preferences');
var colors = require('colors/safe');
program
    .version('0.1.0')
    .option('-c, --connect <siteurl>', 'Connect to SharePoint Online at <siteurl>', null)
    .option('-w, --web', 'Show extentions at the web level')
    .option('-s, --sitecollection', 'Show extentions at the site collection level')
    .option('-l, --list <listtitle>', 'Show extentions at the list level for <listtitle>')
    .parse(process.argv);
var prefs = new Preferences('vman.sp.extentions.cli', {
    siteUrl: '',
    authHeaders: null
});
if (program.connect) {
    prefs.siteUrl = program.connect;
    node_sp_auth_1.getAuth(prefs.siteUrl, {
        ondemand: true,
        electron: require('electron'),
        force: false,
        persist: true
    }).then(function (authResponse) {
        prefs.authHeaders = authResponse.headers;
        prefs.authHeaders.Accept = 'application/json;odata=nometadata';
    });
}
if (program.web) {
    displayExtentions(enums_1.ExtensionScope.Web);
}
if (program.sitecollection) {
    displayExtentions(enums_1.ExtensionScope.SiteCollection);
}
if (program.list) {
    displayListExtentions();
}
function displayExtentions(scope) {
    return __awaiter(this, void 0, void 0, function () {
        var userCustomActionUrl, fieldCustomizerUrl, _a, exts, fields, siteExtentions, fieldCustomizers, extentions, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    ensureAuth();
                    userCustomActionUrl = prefs.siteUrl + "/_api/" + scope + "/UserCustomActions?\n    $filter=startswith(Location, 'ClientSideExtension')\n    &$select=ClientSideComponentId,Title,Location,ClientSideComponentProperties";
                    fieldCustomizerUrl = void 0;
                    if (scope === enums_1.ExtensionScope.Web) {
                        fieldCustomizerUrl = prefs.siteUrl + "/_api/" + scope + "/fields?\n      $select=ClientSideComponentId,Title,ClientSideComponentProperties";
                    }
                    else {
                        fieldCustomizerUrl = prefs.siteUrl + "/_api/" + scope + "/rootWeb/availablefields?\n      $select=ClientSideComponentId,Title,ClientSideComponentProperties";
                    }
                    return [4 /*yield*/, Promise.all([fetchExtentions(userCustomActionUrl),
                            fetchExtentions(fieldCustomizerUrl)])];
                case 1:
                    _a = _b.sent(), exts = _a[0], fields = _a[1];
                    siteExtentions = exts;
                    fieldCustomizers = getFieldCustomizers(fields);
                    extentions = siteExtentions.concat(fieldCustomizers);
                    console.log(colors.magenta("'" + scope + "' level spfx extentions at '" + prefs.siteUrl + "'"));
                    printToConsole(extentions);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _b.sent();
                    console.log(colors.red(error_1.message));
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function printToConsole(extentions) {
    console.log(colors.yellow('Title | ClientSideComponentId | Location | ClientSideComponentProperties'));
    for (var _i = 0, extentions_1 = extentions; _i < extentions_1.length; _i++) {
        var ext = extentions_1[_i];
        console.log(colors.green([ext.Title, ext.ClientSideComponentId,
            ext.Location,
            ext.ClientSideComponentProperties].join(' | ')));
    }
}
function getFieldCustomizers(fields) {
    return fields
        .filter(function (field) { return field.ClientSideComponentId !== '00000000-0000-0000-0000-000000000000'; })
        .map(function (fieldCustomizer) {
        fieldCustomizer.Location = 'FieldCustomizer';
        return fieldCustomizer;
    });
}
function ensureAuth() {
    if (!prefs.siteUrl) {
        throw new Error('Please use --connect <siteurl> to auth with SPO. Type --help for help.');
    }
}
function fetchExtentions(restUrl) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, request.get({
                        url: restUrl,
                        headers: prefs.authHeaders
                    })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, JSON.parse(response).value];
            }
        });
    });
}
function displayListExtentions() {
    return __awaiter(this, void 0, void 0, function () {
        var restUrl, extentions, _a, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    ensureAuth();
                    restUrl = prefs.siteUrl + "/_api/web/lists/GetByTitle('" + program.list + "')/fields?\n  $select=Title,ClientSideComponentId,ClientSideComponentProperties";
                    _a = getFieldCustomizers;
                    return [4 /*yield*/, fetchExtentions(restUrl)];
                case 1:
                    extentions = _a.apply(void 0, [_b.sent()]);
                    console.log(colors.magenta("FieldCustomizer spfx extentions on '" + program.list + "' at '" + prefs.siteUrl + "'"));
                    printToConsole(extentions);
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _b.sent();
                    console.log(colors.red(error_2.message));
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}