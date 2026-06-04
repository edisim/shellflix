"use strict";
/* IMPORT */
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var fs = require("fs");
var JSON5 = require("json5");
var localeCode = require("locale-code");
var os = require("os");
var osLocale = require("os-locale");
var path = require("path");
var specialist_1 = require("specialist");
var inquirer_helpers_1 = require("inquirer-helpers");
/* CONFIG */
var Config = {
    localConfigPath: path.join(os.homedir(), '.shellflix.json'),
    downloads: {
        path: path.join(os.homedir(), 'Downloads'),
        save: true
    },
    outputs: {
        supported: ['Airplay', 'Chromecast', 'DLNA', 'MPlayer', 'mpv', 'omx', 'VLC', 'IINA', 'XBMC', 'stdout'],
        available: ['Airplay', 'Chromecast', 'DLNA', 'MPlayer', 'mpv', 'VLC', 'IINA', 'XBMC'],
        favorites: ['VLC']
    },
    torrents: {
        limit: 30,
        details: {
            seeders: true,
            leechers: true,
            size: true,
            time: false
        },
        providers: {
            available: ['1337x', 'ThePirateBay', 'ExtraTorrent', 'Rarbg', 'Torrent9', 'KickassTorrents', 'TorrentProject', 'Torrentz2'],
            active: '1337x'
        },
        timeout: 30000
    },
    subtitles: {
        limit: 30,
        details: {
            downloads: true
        },
        languages: {
            available: ['Afrikaans', 'Albanian', 'Arabic', 'Armenian', 'Asturian', 'Azerbaijani', 'Basque', 'Belarusian', 'Bengali', 'Bosnian', 'Breton', 'Bulgarian', 'Burmese', 'Catalan', 'Chinese (simplified)', 'Chinese (traditional)', 'Chinese bilingual', 'Croatian', 'Czech', 'Danish', 'Dutch', 'English', 'Esperanto', 'Estonian', 'Extremaduran', 'Finnish', 'French', 'Galician', 'Georgian', 'German', 'Greek', 'Hebrew', 'Hindi', 'Hungarian', 'Icelandic', 'Indonesian', 'Italian', 'Japanese', 'Kannada', 'Kazakh', 'Khmer', 'Korean', 'Kurdish', 'Latvian', 'Lithuanian', 'Luxembourgish', 'Macedonian', 'Malay', 'Malayalam', 'Manipuri', 'Mongolian', 'Montenegrin', 'Norwegian', 'Occitan', 'Persian', 'Polish', 'Portuguese', 'Portuguese (BR)', 'Portuguese (MZ)', 'Romanian', 'Russian', 'Serbian', 'Sinhalese', 'Slovak', 'Slovenian', 'Spanish', 'Swahili', 'Swedish', 'Syriac', 'Tagalog', 'Tamil', 'Telugu', 'Thai', 'Turkish', 'Ukrainian', 'Urdu', 'Vietnamese'],
            favorites: ['English', 'French', 'German', 'Hindi', 'Italian', 'Japanese', 'Portuguese', 'Russian', 'Spanish']
        },
        opensubtitles: {
            useragent: 'PlayMe v1',
            username: null,
            password: null,
            ssl: true
        }
    },
    webtorrent: {
        options: [
            '--keep-seeding'
        ]
    },
    prompt: {
        fullscreen: true,
        rows: 10
    }
};
/* INIT */
function initPrompt() {
    inquirer_helpers_1.default.FULLSCREEN = Config.prompt.fullscreen;
    inquirer_helpers_1.default.PAGE_SIZE = Config.prompt.rows;
}
function initLocale() {
    var locale = osLocale.sync().replace('_', '-'), languageName = localeCode.getLanguageName(locale), language = Config.subtitles.languages.available.find(function (language) { return language.startsWith(languageName); });
    if (!language)
        return;
    Config.subtitles.languages.favorites = _.uniq([language].concat(Config.subtitles.languages.favorites));
}
function initLocalConfig() {
    try {
        var content = fs.readFileSync(Config.localConfigPath, { encoding: 'utf8' }).toString();
        if (!content || !content.trim())
            return;
        var localConfig = _.attempt(JSON5.parse, content);
        if (_.isError(localConfig)) {
            console.error(specialist_1.color.red("Error reading the configuration file (" + specialist_1.color.bold(Config.localConfigPath) + "). Is it properly formatted JSON?"));
        }
        else {
            _.mergeWith(Config, localConfig, function (prev, next) {
                if (!_.isArray(prev) || !_.isArray(next))
                    return;
                return next;
            });
        }
    }
    catch (e) { }
}
function expandHomePath(value) {
    if (!_.isString(value))
        return value;
    if (value === '~')
        return os.homedir();
    if (value.indexOf('~/') === 0)
        return path.join(os.homedir(), value.slice(2));
    if (value === '$HOME')
        return os.homedir();
    if (value.indexOf('$HOME/') === 0)
        return path.join(os.homedir(), value.slice(6));
    return value;
}
function initPaths() {
    Config.downloads.path = expandHomePath(Config.downloads.path);
}
initLocale();
initLocalConfig();
initPaths();
initPrompt();
/* EXPORT */
exports.default = Config;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0EsWUFBWTs7QUFFWiwwQkFBNEI7QUFDNUIsdUJBQXlCO0FBQ3pCLDZCQUErQjtBQUMvQix3Q0FBMEM7QUFDMUMsdUJBQXlCO0FBQ3pCLG9DQUFzQztBQUN0QywyQkFBNkI7QUFDN0IseUNBQWlDO0FBQ2pDLHFEQUFzQztBQUV0QyxZQUFZO0FBRVosSUFBTSxNQUFNLEdBQUc7SUFDYixlQUFlLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBRyxFQUFFLENBQUMsT0FBTyxFQUFHLEVBQUUsZUFBZSxDQUFFO0lBQzdELFNBQVMsRUFBRTtRQUNULElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFHLEVBQUUsQ0FBQyxPQUFPLEVBQUcsRUFBRSxXQUFXLENBQUU7UUFDOUMsSUFBSSxFQUFFLElBQUk7S0FDWDtJQUNELE9BQU8sRUFBRTtRQUNQLFNBQVMsRUFBRSxDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQztRQUN0RyxTQUFTLEVBQUUsQ0FBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDO1FBQ3JGLFNBQVMsRUFBRSxDQUFDLEtBQUssQ0FBQztLQUNuQjtJQUNELFFBQVEsRUFBRTtRQUNSLEtBQUssRUFBRSxFQUFFO1FBQ1QsT0FBTyxFQUFFO1lBQ1AsT0FBTyxFQUFFLElBQUk7WUFDYixRQUFRLEVBQUUsSUFBSTtZQUNkLElBQUksRUFBRSxJQUFJO1lBQ1YsSUFBSSxFQUFFLEtBQUs7U0FDWjtRQUNELFNBQVMsRUFBRTtZQUNULFNBQVMsRUFBRSxDQUFDLE9BQU8sRUFBRSxj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
