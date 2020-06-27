const constants = require('../constants')
const BaseSpider = require('./base')

class CsdnSpider extends BaseSpider {
  async afterGoToEditor() {
    await this.page.evaluate(() => {
      const el = document.querySelector('#btnStart')
      if (el) el.click()
    })
    await this.page.waitFor(1000)
  }

  async inputContent(article, editorSel) {
    const el = document.querySelector(editorSel.content)
    el.textContent = ""
    el.focus()
    el.textContent = article.content
  }

  async inputFooter(article, editorSel) {
    // do nothing
  }

  async afterInputEditor() {
    //关闭右侧说明
    const cel = await this.page.$('.side-title__button_close')
    await cel.click()
    await this.page.waitFor(3000)

    //点击发布按钮
    const pel = await this.page.$('.btn.btn-publish')
    await pel.click()
    await this.page.waitFor(2000)

    // 选择文章类型
    const wtype = await this.page.$('.textfield')
    var selValue = 'original';  //原创
    if(this.task.category == '2'){
      selValue = 'repost'   //转载
    }
    else if(this.task.category == '3'){
      selValue = 'translated'   //转载
    }
    await wtype.select(selValue)
    await this.page.waitFor(2000)

    // 选择发布形式
    await this.page.evaluate(task => {
      const el = document.querySelector('#' + task.pubType)
      el.click()
    }, this.task)
    await this.page.waitFor(1000)
  }

  async afterPublish() {
    this.task.url = await this.page.evaluate(() => {
      const el = document.querySelector('.toarticle')
      return el.getAttribute('href')
    })
    this.task.updateTs = new Date()
    await this.task.save()
  }

  async fetchStats() {
    if (!this.task.url) return
    await this.page.goto(this.task.url, { timeout: 0 })
    await this.page.waitFor(5000)

    const stats = await this.page.evaluate(() => {
      const text = document.querySelector('body').innerText
      const mRead = text.match(/阅读数 (\d+)/)
      const readNum = mRead ? Number(mRead[1]) : 0
      const likeNum = Number(document.querySelector('#supportCount').innerText)
      const commentNum = 0 // 暂时获取不了评论数
      return {
        readNum,
        likeNum,
        commentNum
      }
    })
    this.task.readNum = stats.readNum
    this.task.likeNum = stats.likeNum
    this.task.commentNum = stats.commentNum
    await this.task.save()
    await this.page.waitFor(3000)
  }
}

module.exports = CsdnSpider
