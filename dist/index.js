import { defineComponent as a, createElementBlock as c, openBlock as r, createElementVNode as i, createTextVNode as l, toDisplayString as m } from "vue";
const d = { class: "ai-recommendations-for-single-instrument-view" }, p = /* @__PURE__ */ a({
  __name: "AiReccomendations",
  props: {
    symbolRoot: { default: "" },
    userId: { default: null }
  },
  setup(e) {
    const t = e;
    return (n, o) => (r(), c("div", d, [
      i("h2", null, "AI Recommendations for " + m(t.symbolRoot), 1),
      o[0] || (o[0] = l(" jaikalima ", -1))
    ]));
  }
}), _ = (e, t) => {
  const n = e.__vccOpts || e;
  for (const [o, s] of t)
    n[o] = s;
  return n;
}, u = /* @__PURE__ */ _(p, [["__scopeId", "data-v-a0ac2f16"]]);
export {
  u as AiReccomendations,
  u as default
};
