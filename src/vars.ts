import { IConfig } from './sfc.d'

interface IVARS {
  config: IConfig
}

// 全局变量
const VARS: IVARS = {
  config: {
    // 暂存当前插件的配置项，由 ./util.ts/updateConfig 方法进行更新
    autoScssStruct4VueConf: {
      excuteMode: '',
      scssFilePath: ''
    },
    indenConf: {
      tabSize: 2
    }
  }
}

export default VARS
