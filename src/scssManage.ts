import { IScssAst, ITemplateObj } from './sfc.d'

/**
 * 换行 + 缩进
 * @param n 缩进的 tab 数
 */
function rnIndent (n: number) {
  return n <= 0 ? '\n' : ('\n' + '  '.repeat(n))
}

/**
 * 对比新旧 scssAst结构时，对新增的 template 标签进行递归遍历所有子元素
 * @param obj 新增的 templateAst
 * @param destArr 用于递归的节点，初始调用无需传此值
 */
function trackChildren (obj: ITemplateObj, destArr: Array<any> = []) {
  for (let i = 0; i < obj.children.length; i++) {
    obj.children[i].selectorNames.forEach((item: any, index: number) => {
      destArr.push({
        rule: '',
        selectorNames: obj.children[i].selectorNames[index],
        children: index === 0 ? trackChildren(obj.children[i]) : [],
        rnInfo: {}
      })
    })
  }
  return destArr
}
const rootStrObj = JSON.stringify(
  {
    selectorNames: '',
    children: [],
    rule: '',
    rnInfo: {}
  }
)

// 四个以 | 分割的匹配规则，分别用于匹配 }、css规则、css规则、选择器{
const re1 = /^\s*}|[^{}]+;(?=[^{]+?{)|[^{}]+?(?=\s*})|[^{]*{/
// 匹配 scss 注释
const scssCommentRe = /^\s*\/\/[\s\S]*(?=\n)|^\s*\/\*[\s\S]*?\*\//
let mt = null

/**
 * 将 str文本转换为 scss ast
 * @param {*} scssStr scss字符串
 * @param {*} root 用于递归的节点，初始调用无需传此值
 */
const scssStr2Ast = (scssStr: string, root: IScssAst = JSON.parse(rootStrObj)): IScssAst | null => {
  // scssStr = scssStr.trim()
  if (!scssStr.trim()) return root
  mt = scssStr.match(re1)
  if (!mt) {
    console.log('no mt')
    return null
  }
  // const value = mt[0].trim()
  let value = mt[0]
  if (value.indexOf('{') !== -1) {
    scssStr = scssStr.slice(value.length)
    const child: IScssAst = {
      // 去掉左大括号 {
      selectorNames: '',
      children: [],
      rule: '',
      parent: root,
      // 选择器名以  @ 开头的，认为是关键字规则
      isKeyRule: value.trim().indexOf('@') === 0,
      rnInfo: {
        start: '',
        end: ''
      }
    }
    // 检查是否有注释
    const commentMt = value.match(scssCommentRe)
    if (commentMt) {
      child.comment = commentMt[0]
      value = value.slice(child.comment.length)
    }
    const selectorMt = <RegExpMatchArray>value.match(/(\s*)([\s\S]+)/)
    child.selectorNames = selectorMt[2].slice(0, -1).trim()
    child.rnInfo.start = selectorMt[1]
    root.children.push(child)
    return scssStr2Ast(scssStr, child)
  } else if (value.indexOf('}') !== -1) {
    // 匹配 }
    root.rnInfo.end = (value.match(/^\s*/) as RegExpMatchArray)[0]
    scssStr = scssStr.slice(value.length)
    return scssStr2Ast(scssStr, root.parent)
  } else {
    // 匹配 css规则
    root.rule = (root.rule || '') + scssStr.slice(0, value.length)
    scssStr = scssStr.slice(value.length)
    return scssStr2Ast(scssStr, root)
  }
}

/**
 * 子元素去重，当子元素中存在多个选择器相同并且都无子元素的项，则只保留第一个
 * @param {*} childrenArr 子元素集合
 */
const distinctChildren = (childrenArr: Array<IScssAst>) => {
  const obj: any = {}
  const distinctArr = []
  let len = childrenArr.length
  for (let i = 0; i < len; i++) {
    if (!obj[childrenArr[i].selectorNames]) {
      if (childrenArr[i].children.length === 0) {
        obj[childrenArr[i].selectorNames] = true
      }
      distinctArr.push(childrenArr[i])
    } else {
      if (childrenArr[i].children.length !== 0) {
        distinctArr.push(childrenArr[i])
      }
    }
  }
  return distinctArr
}

/**
 * 将 scss ast转换为 str文本
 * @param {*} obj scssAst
 * @param {*} n 用于给转换后的 scss字符串进行格式化
 */
const scssAstObj2Str = (obj: IScssAst, n = -1) => {
  if (!obj) return ''
  let scssStr = (obj.comment || '') + (obj.rnInfo.start || rnIndent(n)) + obj.selectorNames + ' {'
  if (obj.rule) {
    scssStr += (obj.rule || '')
  }
  if (obj.children.length) {
    const distinctArr = distinctChildren(obj.children)
    distinctArr.forEach(childScssObj => {
      scssStr += scssAstObj2Str(childScssObj, n + 1)
    })
  }
  // scssStr += (rnIndent(n) + '}')
  scssStr += ((obj.rnInfo.end || rnIndent(n)) + '}')
  return scssStr
}
/**
 * 根据当前的 template 结构重新整理 scss的结构
 * @param {*} templateObj template 结构
 * @param {*} scssObj scss 结构
 * @param {*} childIndex 当前比对的 templateObj是父元素的第几个子元素（从 0 开始）
 */
const resetScss = (templateObj: ITemplateObj, scssObj: IScssAst, childIndex = 0) => {
  if (!templateObj) return
  const selectorNames = templateObj.selectorNames
  for (let i = 0; i < selectorNames.length; i++) {
    const selector = selectorNames[i]
    const matchIndex = scssObj.children
      .findIndex(v => !v.hasMatch && (selector === v.selectorNames || (v.selectorNames.match(/^&/) && selector === v.selectorNames.slice(1))))
    if (matchIndex === -1) {
      // 没找到，说明 template 中新增了标签
      scssObj.children = scssObj.children.slice(0, childIndex + i).concat(
        {
          rule: '',
          selectorNames: selector,
          children: i == 0 ? trackChildren(templateObj) : [],
          rnInfo: {},
          hasMatch: true
        },
        scssObj.children.slice(childIndex + i)
      )
    } else {
      // 拥有多个选择器（class、id）的标签，只递归处理第一个选择器
      if (i > 0) continue
      scssObj.children[matchIndex].hasMatch = true
      let scssObjChild = null
      templateObj.children.forEach((obj, index) => {
        scssObjChild = scssObj.children[matchIndex]
        if (!scssObjChild.isKeyRule) {
          resetScss(obj, scssObjChild, templateObj.children.slice(0, index).reduce((t, c) => t + c.selectorNames.length, 0))
        }
      })
    }
  }
}

export {
  scssStr2Ast,
  scssAstObj2Str,
  resetScss
}
