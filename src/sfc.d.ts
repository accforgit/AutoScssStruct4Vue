export interface IScssAst {
  // css 规则内容
  rule: string
  selectorNames: string
  children: Array<IScssAst>
  parent?: IScssAst
  // 同级别元素，选择器相同，但子元素不同，需要按照出现的顺序进行标记是否已经被匹配比较过了
  hasMatch?: boolean,
  // 是否是以 @ 开头的关键字规则，例如
  isKeyRule?: boolean,
  // scss 注释
  comment?: string,
  // 换行、缩进字符信息
  rnInfo: {
    // 选择器字符前面的换行、缩进信息
    start?: string
    // 选择器字符 与 { 字符之间的换行、缩进信息
    startAfter?: string
    // } 字符前面的换行、缩进信息
    end?: string
  },
  // 相比于上一次是否是新增节点
  isNew?: boolean
}

export interface ITemplateObj {
  // 选择器集合
  selectorNames: Array<string>
  children: Array<ITemplateObj>
}

export interface IDoc {
  // 类型，tag/text
	type: string
  content?: string
  // 是否是自闭合标签
  voidElement: boolean
  // 标签名
  name: string
  // 属性
	attrs: object | any
  children: IDoc[]
  // 使用了 v-bind 的属性
  bindAttrs: object | any
  // [propName: string]: any
}

export interface IConfig {
  autoScssStruct4VueConf: {
    // 执行方式
    excuteMode: string
    // scss保存路径
    scssFilePath: string
  },
  indenConf: {
    tabSize: number
  }
}