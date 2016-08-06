var markdownpdf = require("markdown-pdf");
var path = require('path');
var fs = require('fs');
var util = require('util');
var split = require('split');
var through = require('through');
var duplexer = require('duplexer');
var _ = require('lodash');

var BASE_TEMPLATE = path.resolve(__dirname, 'template.md');
var ROW_TEMPLATE = path.resolve(__dirname, 'row.md');
var CSS_FILE = path.resolve(__dirname, 'bootstrap.css');

/*
* List of template fields and expected inputs excluding item_list
* as it's processed separately.
*/


function Invoice(options) {
  options = options || {};

  options.baseTemplate = options.baseTemplate || BASE_TEMPLATE
  options.rowTemplate = options.rowTemplate || ROW_TEMPLATE
  options.cssPath = options.cssPath || CSS_FILE
  options.preProcessMd = populate;

  this.options = options;
}

Invoice.prototype.baseTemplate = '';
Invoice.prototype.rowTemplate = '';
Invoice.prototype.cssPath = '';
Invoice.prototype.input = {};

Invoice.prototype.generatePDFStream = function generatePDFStream(input) {
  this.options.input = input;
  return fs.createReadStream(this.options.baseTemplate)
  .pipe(markdownpdf(this.options));
};

var populate = function () {
  var splitter = split();
  var input = this.input;
  var rowTemplate = this.rowTemplate;
  var value, re, i;
  var replacer = through(function (data) {
    var matches = data.match(/%[a-zA-Z0-9_]+%/g);
    _.each(matches, function (match) {
      if(match) {
        var regexp = new RegExp(match, 'g');
        var key = match.substr(1, match.length - 2).toLowerCase();
        if(_.isObject(input[key])) {
          data = data.replace(regexp,util.format(input.currencyFormat, input[key].value));
        } else {
          if(input[key]) {
            data = data.replace(regexp, input[key]);
          } else {
            data = data.replace(regexp, '');
          }
        }
      }
    });
    var itemsMatch = data.match(/@[a-zA-Z0-9_]+@/g);
    _.each(itemsMatch, function (match) {
      var regexp = new RegExp(match, 'g');
      data = data.replace(regexp, generateItemList(input.items, input.currencyFormat, rowTemplate));
    });
    this.queue(data + "\n");
  });

  splitter.pipe(replacer);
  return duplexer(splitter, replacer);
};
var generateItemList = function(items, currencyFormat, template) {
  var out = '';
  var row = fs.readFileSync(template, { encoding: 'utf8' });
  if (items) {
   items.forEach(function (element) {
        out += row
          .replace(/COD/g, element.cod ? element.cod : '')
          .replace(/NAME/g, element.name ? element.name : '')
          .replace(/DESCRIPTION/g, element.description ? element.description : '')
          .replace(/QUANTITY/g, element.qty ? element.qty : 0)
          .replace(/PRICE/g, util.format(currencyFormat, element.price ? element.price : 0))
          .replace(/TAX/g, element.tax ? element.tax * 100 + '%' : '0%')
          .replace(/TOTAL/g, util.format(currencyFormat, element.total ? element.total : 0));
      });
    }

  return out;
};

module.exports = Invoice;
