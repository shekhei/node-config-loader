import fs from "fs";
import path from "path";
import Promise from "bluebird";

const CONCURRENT_READS=5;

export default class FilesReader {
    static load(list, options = {}, concurrentReads = CONCURRENT_READS) {
        return new FilesReader(list, options, concurrentReads).load();
    }

    constructor(list, options = {}, concurrentReads = CONCURRENT_READS) {
        this._list = list;
        this._options = options;
        this._options.parsers = this._options.parsers || {};
        this._log = this._options.log;
        this._concurrentReads = concurrentReads;
        this._result = {};
    }

    get result() {
        return this._result;
    }

    loadFileAndParse(file) {
        return new Promise((res, rej) => {
            this._log.info("reading file", file);
            fs.readFile(file, (err, data) => {
                this._log.info("done reading file", file, data);
                if ( err ) { return rej(err); }
                var filename, extname, parser;
                let fn = ((data) => {
                    filename = path.basename(file, extname);
                    extname = path.extname(filename);
                    parser = this._options.parsers[extname.substr(1)];
                    this._log.info("going through pipe", filename, extname, parser, data)
                    if ( extname.length && parser ) {
                        return parser(data).then(fn);
                    } else {
                        res([file, data, filename]);
                    }
                });
                fn(data.toString());
            })
        });
    }

    load() {
        this._log.info("called FilesReader.load with list:", this._list);
        var promiseArr = new Array(Math.min(this._concurrentReads, this._list.length));
        promiseArr.fill(null);
        var fileReadFn = ((index, skip) => {

            this._log.info("called FilesReader.load.fileReadFn");
            if (!this._list[index] ) { return Promise.resolve(undefined); }
            return this.loadFileAndParse(this._list[index]).then((result) => {
                this._log.info("done parsing file", result[0], result[1]);
                this._result[result[0]] = {data: result[1], filename: result[2]};
                return fileReadFn(index+skip, skip);
            })
        })
        return Promise.all(promiseArr.map((el, i) => {
            return fileReadFn(i, this._concurrentReads);
        })).then(() => {
            this._log.info("done reading all the files");
            return this;
        })
    }
}
