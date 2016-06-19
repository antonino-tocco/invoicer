var Invoice = require('./index.js');
var fs = require('fs');

var invoice = new Invoice();
var input = {
  balance: 10,
  subtotal: 10,
  tax: 0,
  paid: 0,
  from_name: 'nCrazed',
  items: [
    {
      description: 'Woah!',
      quantity: 1,
      rate: 10,
      amount: 10
    }
  ],
  currencyFormat: '£%d'
};

invoice.generatePDFStream(input).pipe(fs.createWriteStream('invoice.pdf'));
