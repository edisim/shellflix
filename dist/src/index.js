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
var _ = require("lodash");
var execa = require("execa");
var OpenSubtitles = require("opensubtitles-api");
var parseTorrent = require("parse-torrent");
var path = require("path");
var inquirer_helpers_1 = require("inquirer-helpers");
var specialist_1 = require("specialist");
var torrentSearch = require("torrent-search-api");
var ora = require("ora");
var config_1 = require("./config");
var utils_1 = require("./utils");
require("./temp");
/* CLIFIX */
var CLIFlix = {
    wizard: function (webtorrentOptions) {
        if (webtorrentOptions === void 0) { webtorrentOptions = []; }
        return __awaiter(this, void 0, void 0, function () {
            var torrent, magnet, subbed, languageName, languageCode, spinner, subtitlesAll, okay, subtitles, stream, app;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, CLIFlix.getTorrent()];
                    case 1:
                        torrent = _a.sent();
                        return [4 /*yield*/, CLIFlix.getMagnet(torrent)];
                    case 2:
                        magnet = _a.sent();
                        if (!magnet)
                            return [2 /*return*/, console.error(specialist_1.color.red('Magnet not found.'))];
                        if (!((config_1.default.subtitles.languages.available.length || config_1.default.subtitles.languages.favorites.length) && !utils_1.default.webtorrent.options.isSubtitlesSet(webtorrentOptions))) return [3 /*break*/, 10];
                        return [4 /*yield*/, inquirer_helpers_1.default.noYes('Do you want subtitles?')];
                    case 3:
                        subbed = _a.sent();
                        if (!subbed) return [3 /*break*/, 10];
                        return [4 /*yield*/, inquirer_helpers_1.default.list('Which language?', utils_1.default.prompt.parseList(config_1.default.subtitles.languages.available, config_1.default.subtitles.languages.favorites))];
                    case 4:
                        languageName = _a.sent(), languageCode = utils_1.default.language.getCode(languageName), spinner = ora("Waiting for \"" + specialist_1.color.bold('OpenSubtitles') + "\"...").start();
                        return [4 /*yield*/, CLIFlix.getSubtitles(torrent.title, languageCode)];
                    case 5:
                        subtitlesAll = _a.sent();
                        spinner.stop();
                        if (!!subtitlesAll.length) return [3 /*break*/, 7];
                        return [4 /*yield*/, inquirer_helpers_1.default.noYes("No subtitles found for \"" + languageName + "\", play it anyway?")];
                    case 6:
                        okay = _a.sent();
                        if (!okay)
                            return [2 /*return*/];
                        return [3 /*break*/, 10];
                    case 7: return [4 /*yield*/, utils_1.default.prompt.subtitles('Which subtitles?', subtitlesAll)];
                    case 8:
                        subtitles = _a.sent();
                        return [4 /*yield*/, utils_1.default.subtitles.download(subtitles)];
                    case 9:
                        stream = _a.sent();
                        utils_1.default.webtorrent.options.setSubtitles(webtorrentOptions, stream.path);
                        _a.label = 10;
                    case 10:
                        if (!((config_1.default.outputs.available.length || config_1.default.outputs.favorites.length) && !utils_1.default.webtorrent.options.isAppSet(webtorrentOptions))) return [3 /*break*/, 12];
                        return [4 /*yield*/, inquirer_helpers_1.default.list('Which app?', utils_1.default.prompt.parseList(config_1.default.outputs.available, config_1.default.outputs.favorites))];
                    case 11:
                        app = _a.sent();
                        webtorrentOptions = utils_1.default.webtorrent.options.setApp(webtorrentOptions, app);
                        _a.label = 12;
                    case 12:
                        CLIFlix.stream(magnet, webtorrentOptions);
                        return [2 /*return*/];
                }
            });
        });
    },
    lucky: function (queryOrTorrent, webtorrentOptions) {
        if (webtorrentOptions === void 0) { webtorrentOptions = []; }
        return __awaiter(this, void 0, void 0, function () {
            var torrent, e_1, torrents;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 1, , 4]);
                        parseTorrent(queryOrTorrent);
                        torrent = queryOrTorrent;
                        return [3 /*break*/, 4];
                    case 1:
                        e_1 = _a.sent();
                        return [4 /*yield*/, CLIFlix.getTorrents(queryOrTorrent, 1)];
                    case 2:
                        torrents = _a.sent();
                        if (!torrents.length)
                            return [2 /*return*/, console.error(specialist_1.color.red("No torrents found for \"" + specialist_1.color.bold(queryOrTorrent) + "\""))];
                        return [4 /*yield*/, CLIFlix.getMagnet(torrents[0])];
                    case 3:
                        torrent = _a.sent();
                        if (!torrent)
                            return [2 /*return*/, console.error(specialist_1.color.red('Magnet not found.'))];
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/, CLIFlix.stream(torrent, webtorrentOptions)];
                }
            });
        });
    },
    getTorrents: function (query, rows, provider, providers) {
        if (rows === void 0) { rows = config_1.default.torrents.limit; }
        if (provider === void 0) { provider = config_1.default.torrents.providers.active; }
        if (providers === void 0) { providers = config_1.default.torrents.providers.available; }
        return __awaiter(this, void 0, void 0, function () {
            var hasProvider, categories, category, spinner, torrents, e_2, nextProviders, nextProvider;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        hasProvider = !!provider;
                        if (!!provider) return [3 /*break*/, 2];
                        return [4 /*yield*/, inquirer_helpers_1.default.list('Which torrents provider?', providers)];
                    case 1:
                        provider = _a.sent();
                        _a.label = 2;
                    case 2:
                        categories = {
                            ThePirateBay: 'Video',
                            TorrentProject: 'Video'
                        };
                        category = categories[provider] || 'All', spinner = ora("Waiting for \"" + specialist_1.color.bold(provider) + "\"...").start();
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 7]);
                        torrentSearch.disableAllProviders();
                        torrentSearch.enableProvider(provider);
                        return [4 /*yield*/, torrentSearch.search(query, category, rows)];
                    case 4:
                        torrents = _a.sent();
                        spinner.stop();
                        if (!torrents.length)
                            throw new Error('No torrents found.');
                        return [2 /*return*/, torrents];
                    case 5:
                        e_2 = _a.sent();
                        spinner.stop();
                        console.error(specialist_1.color.yellow("No torrents found via \"" + specialist_1.color.bold(provider) + "\""));
                        nextProviders = _.without(providers, provider), nextProvider = hasProvider ? providers[providers.indexOf(provider) + 1] : '';
                        if (!nextProvider && !nextProviders.length)
                            return [2 /*return*/, []];
                        return [4 /*yield*/, CLIFlix.getTorrents(query, rows, nextProvider, nextProviders)];
                    case 6: return [2 /*return*/, _a.sent()];
                    case 7: return [2 /*return*/];
                }
            });
        });
    },
    getTorrent: function () {
        return __awaiter(this, void 0, void 0, function () {
            var query, torrents;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!true) return [3 /*break*/, 4];
                        return [4 /*yield*/, inquirer_helpers_1.default.input('What do you want to watch?')];
                    case 1:
                        query = _a.sent();
                        return [4 /*yield*/, CLIFlix.getTorrents(query)];
                    case 2:
                        torrents = _a.sent();
                        if (!torrents.length) {
                            console.error(specialist_1.color.yellow("No torrents found for \"" + specialist_1.color.bold(query) + "\", try another query."));
                            return [3 /*break*/, 0];
                        }
                        return [4 /*yield*/, utils_1.default.prompt.title('Which torrent?', torrents)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4: return [2 /*return*/];
                }
            });
        });
    },
    getMagnet: function (torrent) {
        return __awaiter(this, void 0, void 0, function () {
            var e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, torrentSearch.getMagnet(torrent)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        e_3 = _a.sent();
                        return [2 /*return*/];
                    case 3: return [2 /*return*/];
                }
            });
        });
    },
    getSubtitles: function (query, language) {
        return __awaiter(this, void 0, void 0, function () {
            var OS, results, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        OS = new OpenSubtitles(config_1.default.subtitles.opensubtitles);
                        return [4 /*yield*/, OS.search({
                                sublanguageid: language,
                                limit: config_1.default.subtitles.limit,
                                query: query
                            })];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results[Object.keys(results)[0]] || []];
                    case 2:
                        e_4 = _a.sent();
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    },
    stream: function (torrent, webtorrentOptions) {
        if (webtorrentOptions === void 0) { webtorrentOptions = []; }
        return __awaiter(this, void 0, void 0, function () {
            var webtorrentBin, execArgs, execOpts;
            return __generator(this, function (_a) {
                webtorrentOptions = utils_1.default.webtorrent.options.parse(webtorrentOptions, config_1.default.webtorrent.options);
                webtorrentBin = require.resolve('shellflix-webtorrent-cli/bin/cmd.js'), execArgs = [webtorrentBin, 'download', torrent].concat(webtorrentOptions), execOpts = {
                    cwd: path.resolve(__dirname, '..'),
                    stdio: 'inherit'
                };
                execa.sync(process.execPath, execArgs, execOpts);
                return [2 /*return*/];
            });
        });
    }
};
/* EXPORT */
module.exports = CLIFlix;
module.exports.default = CLIFlix;
Object.defineProperty(module.exports, "__esModule", { value: true });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUNBLFlBQVk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFWiwwQkFBNEI7QUFDNUIsNkJBQStCO0FBQy9CLGlEQUFtRDtBQUNuRCw0Q0FBOEM7QUFDOUMsMkJBQTZCO0FBQzdCLHFEQUFzQztBQUN0Qyx5Q0FBaUM7QUFDakMsa0RBQW9EO0FBQ3BELHlCQUEyQjtBQUMzQixtQ0FBOEI7QUFDOUIsaUNBQTRCO0FBQzVCLGtCQUFnQjtBQUVoQixZQUFZO0FBRVosSUFBTSxPQUFPLEdBQUc7SUFFUixNQUFNLFlBQUcsaUJBQWdDO1FBQWhDLGtDQUFBLEVBQUEsc0JBQWdDOzs7Ozs0QkFFN0IscUJBQU0sT0FBTyxDQUFDLFVBQVUsRUFBRyxFQUFBOzt3QkFBckMsT0FBTyxHQUFHLFNBQTJCO3dCQUM1QixxQkFBTSxPQUFPLENBQUMsU0FBUyxDQUFHLE9BQU8sQ0FBRSxFQUFBOzt3QkFBNUMsTUFBTSxHQUFHLFNBQW1DO3dCQUVsRCxJQUFLLENBQUMsTUFBTTs0QkFBRyxzQkFBTyxPQUFPLENBQUMsS0FBSyxDQUFHLGtCQUFLLENBQUMsR0FBRyxDQUFHLG1CQUFtQixDQUFFLENBQUUsRUFBQzs2QkFFckUsQ0FBQSxDQUFFLGdCQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxJQUFJLGdCQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFFLElBQUksQ0FBQyxlQUFLLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUcsaUJBQWlCLENBQUUsQ0FBQSxFQUFoSyx5QkFBZ0s7d0JBRXBKLHFCQUFNLDBCQUFNLENBQUMsS0FBSyxDQUFHLHdCQUF3QixDQUFFLEVBQUE7O3dCQUF4RCxNQUFNLEdBQUcsU0FBK0M7NkJBRXpELE1B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
