
import Promise from "bluebird";
import fs from "fs";
import glob from "glob";
import bunyan from "bunyan";
import FilesReader from "./src/fileReader.js"
import path from "path";
import yaml from "js-yaml";
import _ from "lodash";
import {EventEmitter2} from "eventemitter2";

function parseYml(data) {
    return new Promise(function(res, rej) {
        try {
            var result = yaml.safeLoad(data);
        } catch(e ) {
            rej(e);
        }
        res(result);
    })
}

function parseJson(data) {
    return Promise.resolve(JSON.parse(data));
}

var configList = [];

export default class Configurer extends EventEmitter2 {
    static load(path, options = {}) {
        return new Configurer(path).load();
    }

    constructor(_path, options = {}) {
        super();
        this._path = path.resolve(_path);
        options.log = options.log || bunyan.createLogger({name: "node-config-loader"});
        this._log = options.log;
        this._options = options;
        this._options.parsers = this._options.parsers || {
            yml: parseYml,
            json: parseJson
        }
        this._configs = {};
        configList.push(this);
    }

    get configs() {
        return this._configs;
    }

    reset() {
        this._configs = {};
    }

    load() {
        return new Promise((resolve, reject) => {
            this._log.info("Loading from path", this._path);
            glob(this._path+"/**/*.*(json|yml)", (er, files) => {
                if ( er ) {
                    return reject(er);
                }
                this._log.info(files);
                FilesReader.load(files, this._options).then((reader) => {
                    this._log.info(reader.result);
                    var transformArr = [];
                    for ( let name in reader.result ) {
                        this._log.info("dirname", path.dirname(name))
                        transformArr.push([path.dirname(name).substr(this._path.length+1).split(path.sep), reader.result[name].filename, reader.result[name].data]);
                    }

                    transformArr.sort(function(a, b) {
                        return a[0].length < b[0].length;
                    })
                    this._log.info("results sorted", transformArr);

                    for ( let i = 0; i < transformArr.length; i++ ) {
                        // sorter ones are first inserted, the further down the folder structure the higher the precedence
                        let key = transformArr[i][0], val = transformArr[i][2], base = this._configs, filename = transformArr[i][1];
                        for ( var j = 0; j < key.length; j++ ) {
                            this._log.info("Writing to key", key[j]);
                            if ( !key[j].length ) { continue; }
                            base[key[j]] = base[key[j]] || {};
                            base = base[key[j]];
                        }
                        this._log.info("Writing to key", filename);
                        base[filename] = base[filename] || {};
                        base = base[filename];
                        _.assign(base, val);
                    }

                    this._log.info("results transformed", this._configs);
                    resolve(this);
                })
            })
        })
    }

}

process.on('SIGHUP', () => {
    // this is call for a reload;
    for ( var i = 0; i < configList.length; i++ ) {
        configList[i].reset();
        configList[i].load().then((config) => {
            config.emit("reload");
        });
    }
})
