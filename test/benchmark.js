import Config from "../index.js";
import {expect} from "chai";
import mkdirp from "mkdirp";
import ncp from "ncp";
import fs from "fs";

describe("loading config", function(){
    var configs;
    var dir = "/tmp/nodeConfigLoaderTest"+Date.now();
    before(function(done){
        mkdirp(dir, (err) => {
            if ( err ) {
                return done(err);
            }
            ncp("./test/benchmark", dir+"/config", (err) => {
                if ( err ) {
                    return done(err);
                }
                return Config.load(dir+"/config").then(function(c){
                    configs = c;
                    done();
                })

            })
        })
    })
    it('should load correctly', function(done){
        done();
    })

})
