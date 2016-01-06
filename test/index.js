import Config from "../src/index.js";
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
            ncp("./test/config", dir+"/config", (err) => {
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
        expect(configs.configs).to.have.property('config');
        expect(configs.configs.config).to.have.property('config');
        expect(configs.configs.config.config.is).to.eql("some yaml");

        expect(configs.configs).to.have.property('config2');
        expect(configs.configs.config2).to.have.property('is');
        expect(configs.configs.config2.is).to.eql("some json");

        expect(configs.configs).to.have.property('configDir');
        expect(configs.configs.configDir).to.have.property('test');
        expect(configs.configs.configDir.test).to.have.property('this');
        expect(configs.configs.configDir.test.this).to.have.property('dir');
        expect(configs.configs.configDir.test.this.dir).to.have.property('should');
        expect(configs.configs.configDir.test.this.dir.should).to.eql('exist');

        done();
    })

    it('fire a signal and it should reload', function(done) {
        fs.rmdir(dir+"/config", (err) => {
            ncp("./test/config2", dir+"/config", (err) => {
                if ( err ) {
                    return done(err);
                }
                configs.on('reload', () => {
                    expect(configs.configs).to.have.property('config');
                    expect(configs.configs.config).to.have.property('config');
                    expect(configs.configs.config.config).to.have.property("is");
                    expect(configs.configs.config.config.is).to.eql("changed");

                    expect(configs.configs.config).to.have.property("override");
                    expect(configs.configs.config.override).to.have.property("not");
                    expect(configs.configs.config.override.not).to.eql("yet");

                    expect(configs.configs.config.override).to.have.property("is");
                    expect(configs.configs.config.override.is).to.eql("done");

                    done();
                })
                process.kill(process.pid, "SIGHUP");
            })
        });
    })
})
