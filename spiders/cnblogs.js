const BaseSpider = require('./base')

class CnblogsSpider extends BaseSpider {

  // async inputContent(article, editorSel) {
  //   const content = article.contentHtml;
  //   const iframeWindow = document.querySelector('#Editor_Edit_EditorBody_ifr').contentWindow
  //   const el = iframeWindow.document.querySelector(editorSel.content)
  //   el.focus()
  //   iframeWindow.document.execCommand('delete', false)
  //   iframeWindow.document.execCommand('insertHTML', false, content)
  // }

  async inputFooter(article, editorSel) {
    // do nothing
  }

  async afterPublish() {
    const url = await this.page.evaluate(() => {
      return document.querySelector('.link-post-title').href
    })
    this.task.url = url
    this.task.updateTs = new Date()
    await this.task.save()
  }

  async fetchStats() {
    if (!this.task.url) return
    await this.page.goto(this.task.url, { timeout: 60000 })
    await this.page.waitFor(5000)

    const stats = await this.page.evaluate(() => {
      const text = document.querySelector('body').innerText
      const mRead = text.match(/阅读 \((\d+)\)/)
      const mLike = document.querySelector('#bury_count').innerText
      const mComment = text.match(/评论 \((\d+)\)/)
      const readNum = mRead ? Number(mRead[1]) : 0
      const likeNum = Number(mLike)
      const commentNum = mComment ? Number(mComment[1]) : 0
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

module.exports = CnblogsSpider
