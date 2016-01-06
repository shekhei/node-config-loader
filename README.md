#node-config-loader

This is a simple config loader that loads all the yml and json files from a folder and outputs into a structure, and reloads on SIGHUP signal

##Usage

For example, you have the following folder structure

config/config.yml
```yml
some: config
```
config/folder/config.json
```json
{
  "some": "json"
}
```

```js
import Configurer from "config-loader";

Configurer.load("./config").then((configurer) => {
  console.log(configurer.configs.config.some) // config
  console.log(configurer.configs.folder.config.some) // json
});
```

##SIGHUP
```
kill -SIGHUP [pid]
```

all the configs will be cleared and reloaded based on the previous folder.
