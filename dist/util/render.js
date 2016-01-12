'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = render;
function render(template, templateData) {
  var result = template.reduce(function (pv, cv) {
    var words = cv.split('/');
    var punctuation = words.pop();
    var r = words.map(function (placeholder) {
      var w = templateData[placeholder].pop();
      return w;
    });
    return pv + r.join('') + punctuation + '\n';
  }, '');
  return result;
}

// const t = ['A2+/A2-/A1+/，', 'A2-/A2+/B1-/。', 'A2-/A2+/A1+/，', 'A2+/A2-/B1-/。', ]
// const td = {
//   'A2+': ['今夜', '多少', '不似', '万里'],
//   'A2-': ['何时', '神仙', '斜阳', '东君'],
//   'A1+': ['物', '气'],
//   'B1-': ['同', '荣']
// }
// console.log(render(t, td))
//# sourceMappingURL=render.js.map