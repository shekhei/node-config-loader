"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _glob = require("glob");

var _glob2 = _interopRequireDefault(_glob);

var _bunyan = require("bunyan");

var _bunyan2 = _interopRequireDefault(_bunyan);

var _fileReader = require("./fileReader.js");

var _fileReader2 = _interopRequireDefault(_fileReader);

var _path2 = require("path");

var _path3 = _interopRequireDefault(_path2);

var _jsYaml = require("js-yaml");

var _jsYaml2 = _interopRequireDefault(_jsYaml);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _eventemitter = require("eventemitter2");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function parseYml(data) {
    return new _bluebird2.default(function (res, rej) {
        try {
            var result = _jsYaml2.default.safeLoad(data);
        } catch (e) {
            rej(e);
        }
        res(result);
    });
}

function parseJson(data) {
    return _bluebird2.default.resolve(JSON.parse(data));
}

var configList = [];

var Configurer = (function (_EventEmitter) {
    _inherits(Configurer, _EventEmitter);

    _createClass(Configurer, null, [{
        key: "load",
        value: function load(path) {
            var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            return new Configurer(path).load();
        }
    }]);

    function Configurer(_path) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        _classCallCheck(this, Configurer);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Configurer).call(this));

        _this._path = _path3.default.resolve(_path);
        options.log = options.log || _bunyan2.default.createLogger({ name: "node-config-loader" });
        _this._log = options.log;
        _this._options = options;
        _this._options.parsers = _this._options.parsers || {
            yml: parseYml,
            json: parseJson
        };
        _this._configs = {};
        configList.push(_this);
        return _this;
    }

    _createClass(Configurer, [{
        key: "reset",
        value: function reset() {
            this._configs = {};
        }
    }, {
        key: "load",
        value: function load() {
            var _this2 = this;

            return new _bluebird2.default(function (resolve, reject) {
                _this2._log.info("Loading from path", _this2._path);
                (0, _glob2.default)(_this2._path + "/**/*.*(json|yml)", function (er, files) {
                    if (er) {
                        return reject(er);
                    }
                    _this2._log.info(files);
                    _fileReader2.default.load(files, _this2._options).then(function (reader) {
                        _this2._log.info(reader.result);
                        var transformArr = [];
                        for (var name in reader.result) {
                            _this2._log.info("dirname", _path3.default.dirname(name));
                            transformArr.push([_path3.default.dirname(name).substr(_this2._path.length + 1).split(_path3.default.sep), reader.result[name].filename, reader.result[name].data]);
                        }

                        transformArr.sort(function (a, b) {
                            return a[0].length < b[0].length;
                        });
                        _this2._log.info("results sorted", transformArr);

                        for (var i = 0; i < transformArr.length; i++) {
                            // sorter ones are first inserted, the further down the folder structure the higher the precedence
                            var key = transformArr[i][0],
                                val = transformArr[i][2],
                                base = _this2._configs,
                                filename = transformArr[i][1];
                            for (var j = 0; j < key.length; j++) {
                                _this2._log.info("Writing to key", key[j]);
                                if (!key[j].length) {
                                    continue;
                                }
                                base[key[j]] = base[key[j]] || {};
                                base = base[key[j]];
                            }
                            _this2._log.info("Writing to key", filename);
                            base[filename] = base[filename] || {};
                            base = base[filename];
                            _lodash2.default.assign(base, val);
                        }

                        _this2._log.info("results transformed", _this2._configs);
                        resolve(_this2);
                    });
                });
            });
        }
    }, {
        key: "configs",
        get: function get() {
            return this._configs;
        }
    }]);

    return Configurer;
})(_eventemitter.EventEmitter2);

exports.default = Configurer;

process.on('SIGHUP', function () {
    // this is call for a reload;
    for (var i = 0; i < configList.length; i++) {
        configList[i].reset();
        configList[i].load().then(function (config) {
            config.emit("reload");
        });
    }
});