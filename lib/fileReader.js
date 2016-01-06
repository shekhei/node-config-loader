"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CONCURRENT_READS = 5;

var FilesReader = (function () {
    _createClass(FilesReader, null, [{
        key: "load",
        value: function load(list) {
            var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
            var concurrentReads = arguments.length <= 2 || arguments[2] === undefined ? CONCURRENT_READS : arguments[2];

            return new FilesReader(list, options, concurrentReads).load();
        }
    }]);

    function FilesReader(list) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var concurrentReads = arguments.length <= 2 || arguments[2] === undefined ? CONCURRENT_READS : arguments[2];

        _classCallCheck(this, FilesReader);

        this._list = list;
        this._options = options;
        this._options.parsers = this._options.parsers || {};
        this._log = this._options.log;
        this._concurrentReads = concurrentReads;
        this._result = {};
    }

    _createClass(FilesReader, [{
        key: "loadFileAndParse",
        value: function loadFileAndParse(file) {
            var _this = this;

            return new _bluebird2.default(function (res, rej) {
                _this._log.info("reading file", file);
                _fs2.default.readFile(file, function (err, data) {
                    _this._log.info("done reading file", file, data);
                    if (err) {
                        return rej(err);
                    }
                    var filename, extname, parser;
                    var fn = function fn(data) {
                        filename = _path2.default.basename(file, extname);
                        extname = _path2.default.extname(filename);
                        parser = _this._options.parsers[extname.substr(1)];
                        _this._log.info("going through pipe", filename, extname, parser, data);
                        if (extname.length && parser) {
                            return parser(data).then(fn);
                        } else {
                            res([file, data, filename]);
                        }
                    };
                    fn(data.toString());
                });
            });
        }
    }, {
        key: "load",
        value: function load() {
            var _this2 = this;

            this._log.info("called FilesReader.load with list:", this._list);
            var promiseArr = new Array(Math.min(this._concurrentReads, this._list.length));
            promiseArr.fill(null);
            var fileReadFn = function fileReadFn(index, skip) {

                _this2._log.info("called FilesReader.load.fileReadFn");
                if (!_this2._list[index]) {
                    return _bluebird2.default.resolve(undefined);
                }
                return _this2.loadFileAndParse(_this2._list[index]).then(function (result) {
                    _this2._log.info("done parsing file", result[0], result[1]);
                    _this2._result[result[0]] = { data: result[1], filename: result[2] };
                    return fileReadFn(index + skip, skip);
                });
            };
            return _bluebird2.default.all(promiseArr.map(function (el, i) {
                return fileReadFn(i, _this2._concurrentReads);
            })).then(function () {
                _this2._log.info("done reading all the files");
                return _this2;
            });
        }
    }, {
        key: "result",
        get: function get() {
            return this._result;
        }
    }]);

    return FilesReader;
})();

exports.default = FilesReader;