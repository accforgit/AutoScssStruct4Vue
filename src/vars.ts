import { IConfig } from './sfc.d'

interface IVARS {
  autoScssStruct4VueConf: IConfig
}

// 全局变量
const VARS: IVARS = {
  // 暂存当前插件的配置项，由 ./util.ts/updateConfig 方法进行更新
  autoScssStruct4VueConf: {
    excuteMode: '',
    scssFilePath: ''
  }
}

export default VARS
