"use strict";
/* IMPORT */
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
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
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
var _ = require("lodash");
var filesizeParser = require("filesize-parser");
var fs = require("fs");
var inquirer = require("inquirer");
var path = require("path");
var inquirer_helpers_1 = require("inquirer-helpers");
var isOnline = require("is-online");
var prettySize = require("prettysize");
var request = require("request-promise-native");
var specialist_1 = require("specialist");
var temp = require("temp");
var config_1 = require("./config");
/* UTILS */
var Utils = {
    checkConnection: function () {
        return __awaiter(this, void 0, void 0, function () {
            var online;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, isOnline()];
                    case 1:
                        online = _a.sent();
                        if (!online)
                            throw new Error(specialist_1.color.red('Looks like you are offline, try again later.\n'));
                        return [2 /*return*/];
                }
            });
        });
    },
    prompt: {
        parseList: function (list, favorites) {
            if (favorites === void 0) { favorites = []; }
            list = _.difference(list, favorites);
            if (!list.length)
                return favorites;
            if (!favorites.length)
                return list;
            return favorites.concat([new inquirer.Separator()], list); //FIXME: Proper separator width
        },
        title: function (message, titles) {
            return __awaiter(this, void 0, void 0, function () {
                var hasSeeders, hasLeechers, hasSize, hasTime, table, colors;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            hasSeeders = titles.some(function (title) { return _.isNumber(title.seeds); }), hasLeechers = titles.some(function (title) { return _.isNumber(title.peers); }), hasSize = titles.some(function (title) { return _.isString(title.size); }), hasTime = titles.some(function (title) { return _.isString(title.time); });
                            table = [];
                            titles.forEach(function (title) {
                                var row = [];
                                row.push(Utils.torrent.parseTitle(title.title));
                                if (config_1.default.torrents.details.seeders && hasSeeders)
                                    row.push(_.isNumber(title.seeds) ? title.seeds : '');
                                if (config_1.default.torrents.details.leechers && hasLeechers)
                                    row.push(_.isNumber(title.peers) ? title.peers : '');
                                if (config_1.default.torrents.details.size && hasSize)
                                    row.push(_.isString(title.size) ? Utils.torrent.parseSize(title.size) : '');
                                if (config_1.default.torrents.details.time && hasTime)
                                    row.push(_.isString(title.time) ? title.time : '');
                                table.push(row);
                            });
                            colors = [undefined];
                            if (config_1.default.torrents.details.seeders && hasSeeders)
                                colors.push('green');
                            if (config_1.default.torrents.details.leechers && hasLeechers)
                                colors.push('red');
                            if (config_1.default.torrents.details.size && hasSize)
                                colors.push('yellow');
                            if (config_1.default.torrents.details.time && hasTime)
                                colors.push('magenta');
                            return [4 /*yield*/, inquirer_helpers_1.default.table(message, table, titles, colors)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        },
        subtitles: function (message, subtitlesAll) {
            return __awaiter(this, void 0, void 0, function () {
                var table, colors;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            table = [];
                            subtitlesAll.forEach(function (subtitles) {
                                var row = [];
                                row.push(Utils.subtitles.parseTitle(subtitles.filename));
                                if (config_1.default.subtitles.details.downloads)
                                    row.push(subtitles.downloads);
                                table.push(row);
                            });
                            colors = [undefined, 'green'];
                            return [4 /*yield*/, inquirer_helpers_1.default.table(message, table, subtitlesAll, colors)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        }
    },
    torrent: {
        parseTitle: function (title) {
            return String(title).replace(/\d+(\.\d+)? ?[k|m|g|t]b/gi, '') // Size info
                .replace(/\s\s+/g, ' ') // Multiple spaces
                .replace(/- -/g, '-') // Empty blocks between dashes
                .replace(/\s*-$/, ''); // Ending dash
        },
        parseSize: function (size) {
            try {
                var bytes = filesizeParser(size);
                return prettySize(bytes, true, true, 1);
            }
            catch (e) {
                return size;
            }
        }
    },
    subtitles: {
        parseTitle: function (title) {
            return title.replace(/\.srt$/i, ''); // Extension
        },
        download: function (_a) {
            var url = _a.url, filename = _a.filename;
            return __awaiter(this, void 0, void 0, function () {
                var content, filepath, stream;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, request(encodeURI(url))];
                        case 1:
                            content = _b.sent(), filepath = path.join(config_1.default.downloads.path, Utils.subtitles.sanitizeFilename(filename));
                            if (config_1.default.downloads.save)
                                Utils.fs.ensureDir(path.dirname(filepath));
                            stream = config_1.default.downloads.save ? fs.createWriteStream(filepath) : temp.createWriteStream();
                            stream.write(content);
                            stream.end();
                            return [2 /*return*/, stream];
                    }
                });
            });
        },
        sanitizeFilename: function (filename) {
            return path.basename(String(filename)).replace(/[\\/:*?"<>|\x00-\x1F]/g, '_');
        }
    },
    fs: {
        ensureDir: function (dir) {
            if (fs.existsSync(dir))
                return;
            Utils.fs.ensureDir(path.dirname(dir));
            fs.mkdirSync(dir);
        }
    },
    promise: {
        timeout: function (promise, ms, message) {
            if (!ms || ms <= 0)
                return promise;
            var timer;
            var timeout = new Promise(function (resolve, reject) {
                timer = setTimeout(function () { return reject(new Error(message)); }, ms);
            });
            return Promise.race([promise, timeout]).then(function (result) {
                clearTimeout(timer);
                return result;
            }, function (error) {
                clearTimeout(timer);
                throw error;
            });
        }
    },
    webtorrent: {
        options: {
            appRe: new RegExp("^--(" + config_1.default.outputs.supported.join('|') + ")$", 'i'),
            outRe: /^--(o|out)$/i,
            subtitlesRe: /^--subtitles$/i,
            isOptionSet: function (options, regex) {
                return !!options.find(function (option) { return !!option.match(regex); });
            },
            isAppSet: function (options) {
                return Utils.webtorrent.options.isOptionSet(options, Utils.webtorrent.options.appRe);
            },
            isSubtitlesSet: function (options) {
                return Utils.webtorrent.options.isOptionSet(options, Utils.webtorrent.options.subtitlesRe);
            },
            isOutSet: function (options) {
                return Utils.webtorrent.options.isOptionSet(options, Utils.webtorrent.options.outRe);
            },
            setApp: function (options, app) {
                options.push("--" + app.toLowerCase());
                return options;
            },
            setSubtitles: function (options, subtitles) {
                options.push('--subtitles', subtitles);
                return options;
            },
            setOut: function (options, output) {
                options.push('--out', output);
                return options;
            },
            parse: function (dynamics, defaults) {
                /* ENSURING NO DUPLICATE --APP SWITCH */
                if (defaults === void 0) { defaults = []; }
                if (Utils.webtorrent.options.isAppSet(dynamics) && Utils.webtorrent.options.isAppSet(defaults)) {
                    defaults = defaults.filter(function (option) { return !option.match(Utils.webtorrent.options.appRe); });
                }
                /* OPTIONS */
                var options = defaults.concat(dynamics);
                /* ENSURING --APP SWITCH */
                if ((config_1.default.outputs.available.length || config_1.default.outputs.favorites.length) && !Utils.webtorrent.options.isAppSet(dynamics)) {
                    options = Utils.webtorrent.options.setApp(dynamics, config_1.default.outputs.favorites[0] || config_1.default.outputs.available[0]);
                }
                /* ENSURING --OUT SETTING */
                if (!Utils.webtorrent.options.isOutSet(options)) {
                    var outPath = config_1.default.downloads.save ? config_1.default.downloads.path : temp.mkdirSync('shellflix-');
                    options = Utils.webtorrent.options.setOut(options, outPath);
                }
                /* RETURN */
                return options;
            }
        }
    },
    language: {
        codes: ['afr', 'alb', 'ara', 'arm', 'ast', 'aze', 'baq', 'bel', 'ben', 'bos', 'bre', 'bul', 'bur', 'cat', 'chi', 'zht', 'zhe', 'hrv', 'cze', 'dan', 'dut', 'eng', 'epo', 'est', 'ext', 'fin', 'fre', 'glg', 'geo', 'ger', 'ell', 'heb', 'hin', 'hun', 'ice', 'ind', 'ita', 'jpn', 'kan', 'kaz', 'khm', 'kor', 'kur', 'lav', 'lit', 'ltz', 'mac', 'may', 'mal', 'mni', 'mon', 'mne', 'nor', 'oci', 'per', 'pol', 'por', 'pob', 'pom', 'rum', 'rus', 'scc', 'sin', 'slo', 'slv', 'spa', 'swa', 'swe', 'syr', 'tgl', 'tam', 'tel', 'tha', 'tur', 'ukr', 'urd', 'vie'],
        names: ['Afrikaans', 'Albanian', 'Arabic', 'Armenian', 'Asturian', 'Azerbaijani', 'Basque', 'Belarusian', 'Bengali', 'Bosnian', 'Breton', 'Bulgarian', 'Burmese', 'Catalan', 'Chinese (simplified)', 'Chinese (traditional)', 'Chinese bilingual', 'Croatian', 'Czech', 'Danish', 'Dutch', 'English', 'Esperanto', 'Estonian', 'Extremaduran', 'Finnish', 'French', 'Galician', 'Georgian', 'German', 'Greek', 'Hebrew', 'Hindi', 'Hungarian', 'Icelandic', 'Indonesian', 'Italian', 'Japanese', 'Kannada', 'Kazakh', 'Khmer', 'Korean', 'Kurdish', 'Latvian', 'Lithuanian', 'Luxembourgish', 'Macedonian', 'Malay', 'Malayalam', 'Manipuri', 'Mongolian', 'Montenegrin', 'Norwegian', 'Occitan', 'Persian', 'Polish', 'Portuguese', 'Portuguese (BR)', 'Portuguese (MZ)', 'Romanian', 'Russian', 'Serbian', 'Sinhalese', 'Slovak', 'Slovenian', 'Spanish', 'Swahili', 'Swedish', 'Syriac', 'Tagalog', 'Tamil', 'Telugu', 'Thai', 'Turkish', 'Ukrainian', 'Urdu', 'Vietnamese'],
        getCode: function (name) {
            var _a = Utils.language, codes = _a.codes, names = _a.names;
            return codes[_.indexOf(names, name)];
        },
        getName: function (code) {
            var _a = Utils.language, codes = _a.codes, names = _a.names;
            return names[_.indexOf(codes, code)];
        }
    }
};
/* EXPORT */
exports.default = Utils;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUNBLFlBQVk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFWiwwQkFBNEI7QUFDNUIsZ0RBQWtEO0FBQ2xELHVCQUF5QjtBQUN6QixtQ0FBcUM7QUFDckMsMkJBQTZCO0FBQzdCLHFEQUFzQztBQUN0QyxvQ0FBc0M7QUFDdEMsdUNBQXlDO0FBQ3pDLGdEQUFrRDtBQUNsRCx5Q0FBaUM7QUFDakMsMkJBQTZCO0FBQzdCLG1DQUE4QjtBQUU5QixXQUFXO0FBRVgsSUFBTSxLQUFLLEdBQUc7SUFFTixlQUFlOzs7Ozs0QkFFSixxQkFBTSxRQUFRLEVBQUcsRUFBQTs7d0JBQTFCLE1BQU0sR0FBRyxTQUFpQjt3QkFFaEMsSUFBSyxDQUFDLE1BQU07NEJBQUcsTUFBTSxJQUFJLEtBQUssQ0FBRyxrQkFBSyxDQUFDLEdBQUcsQ0FBRyxnREFBZ0QsQ0FBRSxDQUFFLENBQUU7Ozs7O0tBRXBHO0lBRUQsTUFBTSxFQUFFO1FBRU4sU0FBUyxZQUFHLElBQWMsRUFBRSxTQUF3QjtZQUF4QiwwQkFBQSxFQUFBLGNBQXdCO1lBRWxELElBQUksR0FBRyxDQUFDLENBQUMsVUFBVSxDQUFHLElBQUksRUFBRSxTQUFTLENBQUUsQ0FBQztZQUV4QyxJQUFLLENBQUMsSUFBSSxDQUFDLE1BQU07Z0JBQUcsT0FBTyxTQUFTLENBQUM7WUFDckMsSUFBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNO2dCQUFHLE9BQU8sSUFBSSxDQUFDO1lBRXJDLE9BQVcsU0FBUyxTQUFFLElBQUksUUFBUSxDQUFDLFNBQVMsRUFBRyxHQUFLLElBQUksRUFBRSxDQUFDLCtCQUErQjtRQUU1RixDQUFDO1FBRUssS0FBSyxZQUFHLE9BQU8sRUFBRSxNQUFNOzs7Ozs7NEJBSXJCLFVBQVUsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FB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QUFLLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDO1FBQ2xpQixLQUFLLEVBQUUsQ0FBQyxXQUFXLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLGFBQWEsRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLHNCQUFzQixFQUFFLHVCQUF1QixFQUFFLG1CQUFtQixFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxjQUFjLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxpQkFBaUIsRUFBRSxpQkFBaUIsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLFlBQVksQ0FBQztRQUUvNkIsT0FBTyxZQUFHLElBQUk7WUFFTixJQUFBLG1CQUErQixFQUE5QixnQkFBSyxFQUFFLGdCQUFLLENBQW1CO1lBRXRDLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUcsS0FBSyxFQUFFLElBQUksQ0FBRSxDQUFDLENBQUM7UUFFMUMsQ0FBQztRQUVELE9BQU8sWUFBRyxJQUFJO1lBRU4sSUFBQSxtQkFBK0IsRUFBOUIsZ0JBQUssRUFBRSxnQkFBSyxDQUFtQjtZQUV0QyxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFHLEtBQUssRUFBRSxJQUFJLENBQUUsQ0FBQyxDQUFDO1FBRTFDLENBQUM7S0FFRjtDQUVGLENBQUM7QUFFRixZQUFZO0FBRVosa0JBQWUsS0FBSyxDQUFDIn0=
