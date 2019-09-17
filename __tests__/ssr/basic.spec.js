const { renderApp, renderer } = require('./shared')

describe('SSR: basicRenderer', () => {
  it('renders the view', async () => {
    const app = await renderApp({ url: '/' })
    const result = await renderer.renderToString(app)
    expect(result).toMatchInlineSnapshot(
      `"<div data-server-rendered=\\"true\\"><div>Home</div></div>"`
    )
  })

  /**
   * TODO:
   * - KeepAlive
   * - Suspense
   * - Navigation Guards
   *  - Cancelled
   *  - Redirection
   * - Async components
   *  - Views
   *  - Inner components
   */

  it('should work', async () => {
    const app = await renderApp(
      { url: '/' },
      {},
      {
        template: `
        <div>
          <p class="hi">yoyo</p>
          <div id="ho" :class="{ red: isRed }"></div>
          <span>{{ test }}</span>
          <input :value="test">
          <img :src="imageUrl">
          <test></test>
          <test-async></test-async>
        </div>
      `,
        data: {
          test: 'hi',
          isRed: true,
          imageUrl: 'https://vuejs.org/images/logo.png',
        },
        components: {
          test: {
            render() {
              return this.$createElement('div', { class: ['a'] }, 'test')
            },
          },
          testAsync(resolve) {
            resolve({
              render() {
                return this.$createElement(
                  'span',
                  { class: ['b'] },
                  'testAsync'
                )
              },
            })
          },
        },
      }
    )
    const result = await renderer.renderToString(app)

    expect(result).toContain(
      '<div data-server-rendered="true">' +
        '<p class="hi">yoyo</p> ' +
        '<div id="ho" class="red"></div> ' +
        '<span>hi</span> ' +
        '<input value="hi"> ' +
        '<img src="https://vuejs.org/images/logo.png"> ' +
        '<div class="a">test</div> ' +
        '<span class="b">testAsync</span>' +
        '</div>'
    )
  })
})
