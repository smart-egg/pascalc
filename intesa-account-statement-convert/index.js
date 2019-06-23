const XLSX = require('xlsx');
const request = require('request');

var contextCopy;
var reqCopy;
var fileContents;

module.exports = function (context, req) {
    context.log('ver 002 - v2 JavaScript HTTP trigger function processed a request.');
    contextCopy = context;
    reqCopy = req;
    if (req.body.filename && req.body.url) {
        if (req.body.url) {
            // var workbook = XLSX.read((req.body.contents), {type : "base64"});
            // var workbook = XLSX.read((req.body.contents), {type : "base64", cellDates : true});
            var fileRequest = request.get(
                req.body.url,
                {encoding:null},
                parseExcel);
            // Execution transferred to parseExcel()
        }
    }
    else {
        context.res = {
            status: 400,
            body: "Please pass a filename and url in the request body"
        };
        context.done();
    }
};

function parseExcel(error, response, body){
    console.log('error:', error); // Print the error if one occurred
    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
    var fileBuffer = body;
    var workbook = XLSX.read(body, {type : "buffer", cellDates : true});
    var wname = workbook.SheetNames[0];
    var ws = workbook.Sheets[wname];
    // BankAccountHolder
    var cell = ws['D1'];
    var val = (cell ? cell.v : "");
    var BankAccountHolder = val;
    // BankAccountNumber
    var cell = ws['D3'];
    var val = (cell ? cell.v : "");
    var BankAccountNumber = val;
    // BankAgencyNumber
    var cell = ws['D4'];
    var val = (cell ? cell.v : "");
    var BankAgencyNumber = val.trim();
    // OpeningBalanceDate
    var cell = ws['D6'];
    var val = (cell ? cell.v : "");
    var OpeningBalanceDate = val;
    // OpeningBalanceAmount
    var cell = ws['E6'];
    var val = (cell ? cell.v : 0);
    var OpeningBalanceAmount = val;
    // ClosingBalanceDate
    var cell = ws['D7'];
    var val = (cell ? cell.v : "");
    var ClosingBalanceDate = val;
    // ClosingBalanceAmount
    var cell = ws['E7'];
    var val = (cell ? cell.v : 0);
    var ClosingBalanceAmount = val;
    // Transactions
    // Find last transaction
    var txRowNumber = 21;
    var cellAddress = 'A' + txRowNumber.toString();
    var cell = ws[cellAddress];
    var val = (cell ? cell.v : "");
    while (val != ""){
        txRowNumber++
        var cellAddress = 'A' + txRowNumber.toString();
        var cell = ws[cellAddress];
        var val = (cell ? cell.v : "");
    }
    if (--txRowNumber > 21){
        var transactions = XLSX.utils.sheet_to_json(ws, 
            {
                range : "A21:F" + txRowNumber.toString(), 
                header : ["Date", "DateCleared", "Description", "Debit", "Credit", "ExtendedDescription"],
                dateNF : "yyyy-mm-dd HH:MM"
            }
        );
        for(let tx of transactions) {
            tx.key = tx.Date.toLocaleDateString() 
                + "|" + tx.DateCleared.toLocaleDateString() 
                + "|" + tx.Description.trim()
                + "|" + (tx.Debit ? tx.Debit.toString() : '-') 
                + "|" + (tx.Credit ? tx.Credit.toString() : '-') 
                + "|" + tx.ExtendedDescription.trim();
        };
    }
    var context = contextCopy;
    var req = reqCopy;
    context.res = {
        // status: 200,
        status : 200,
        body: {
            version : 1,
            url : req.body.url,
            WorksheetName : wname ? wname : "",
            BankAccountHolder : BankAccountHolder,
            BankAccountNumber : BankAccountNumber,
            BankAgencyNumber : BankAgencyNumber,
            OpeningBalanceDate : OpeningBalanceDate,
            OpeningBalanceAmount : OpeningBalanceAmount,
            ClosingBalanceDate : ClosingBalanceDate,
            ClosingBalanceAmount : ClosingBalanceAmount,
            StatementTransactions : transactions
        },
        headers : {"Content-Type" : "application/json"}
    };
    context.done();
}