/**
 * @jest-environment jsdom
 *
 */
// @ts-check
require("./helper");
const expect = require("expect");
const { default: RouterView } = require("../src/components/View");
const { components, isMocha } = require("./utils");

describe("RouterView", () => {
  // skip these tests on mocha because @vue/test-utils
  // do not work correctly
  if (isMocha()) return;
  const { mount } = require("@vue/test-utils");

  it("displays current route component", async () => {
    const wrapper = await mount(RouterView, {
      mocks: {
        $route: {
          fullPath: "/",
          name: undefined,
          path: "/",
          query: {},
          params: {},
          hash: "",
          meta: {},
          matched: [{ component: components.Home, path: "/", name: undefined }]
        }
      }
    });
    expect(wrapper.html()).toMatchInlineSnapshot(`"<div>Home</div>"`);
  });
});
