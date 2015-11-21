/**
 * @since 2015-11-20 13:11
 * @author vivaxy
 */
'use strict';
const fs = require('fs');
const path = require('path');

const mime = require('mime');
const log = require('log-util');

const readFile = require('../lib/read-file.js');
const buildFileBrowser = require('../lib/build-file-list.js');
const FALLBACK_CONTENT_TYPE = require('../lib/fallback-content-type.js');

const INDEX_PAGE = 'index.html';

const readFolder = folder => {
    return done=> {
        return fs.readdir(folder, done);
    };
};

const lStat = pathname => {
    return done => {
        return fs.lstat(pathname, done);
    };
};

module.exports = (absoluteWorkingDirectory) => {
    return function* (next) {
        let requestPath = this.request.path;
        let fullRequestPath = path.join(absoluteWorkingDirectory, requestPath);
        let stat = yield lStat(fullRequestPath);
        if (stat.isDirectory()) {
            let files = yield readFolder(fullRequestPath);
            if (~files.indexOf(INDEX_PAGE)) {
                this.redirect(path.join(requestPath, INDEX_PAGE), '/');
            } else {
                this.body = buildFileBrowser(files, requestPath, absoluteWorkingDirectory);
                this.type = mime.lookup(INDEX_PAGE);
            }
        } else if (stat.isFile()) {
            this.body = yield readFile(fullRequestPath);
            let type = mime.lookup(fullRequestPath);
            if (path.extname(fullRequestPath) === '') {
                type = FALLBACK_CONTENT_TYPE;
            }
            this.type = type;
            log.debug('server :', this.request.method, requestPath, '->', type);
        }
        yield next;
    };
};