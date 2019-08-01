import parseTemplate from './parseTemplate'
import { scssStr2Ast, scssAstObj2Str, resetScss } from './scssManage'
import { IScssAst } from './sfc.d'

// 在 scss文本外再包裹一层，避免遗漏变量等内容
const scssWrapper = 'wrapper {'

export default (vueStr: string, scssStr?: string): string => {
  let originscssStr = ''
  let originscssMt = null
  let originTemplateStr = ''
  const originTemplateMt = vueStr.match(/<template[^>]*>([\s\S]*)<\/template>/)
  if (originTemplateMt) {
    originTemplateStr = originTemplateMt[1].trim()
  }
  if (typeof scssStr === 'string') {
    originscssStr = scssStr
  } else {
    originscssMt = vueStr.match(/<style[^>]*>([\s\S]*)<\/style>/)
    if (originscssMt) {
      originscssStr = originscssMt[1].trim()
    }
  }
  // 解析 template文本得到 templateAst对象
  const templateObj = parseTemplate('<wrapper>' + originTemplateStr + '</wrapper>')
  // 解析 scss文本得到 scssAst对象
  const scssObj = scssStr2Ast(scssWrapper + originscssStr + '}')
  // 根据 templateAst 重置 scssAst（只增不删）
  resetScss(templateObj, (scssObj as IScssAst))
  // 将更新后的 scssAst转换为 scss文本
  const newscssStr = scssAstObj2Str((scssObj as IScssAst).children[0]).trim().slice(scssWrapper.length, -1).trimLeft()
  // 将 scss文本写入本地文件
  let newVueFile = ''
  if (typeof scssStr === 'string') {
    newVueFile = newscssStr
  } else {
    if (originscssMt) {
      const scssMt = vueStr.match(/([\s\S]*)(<style[^>]*>)([\s\S]*)(<\/style>\s*)/)
      if (scssMt) {
        newVueFile = scssMt[1] + scssMt[2] + '\n' + newscssStr.trimRight() + '\n' + scssMt[4]
      }
    } else {
      newVueFile = vueStr + `\n<style lang="scss" scoped>${'\n' + newscssStr.trimRight() + '\n'}</style>\n`
    }
  }
  return newVueFile
}
