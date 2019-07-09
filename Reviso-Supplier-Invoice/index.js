// REVIEW
// [!] I'm assuming some formulas, please check them.
// [!] Should I take out the letters on supplierInvoiceNumber? (ABC123 → 123)
// [!] I'm using the same currency/exchangeRate in both the account and contraVatAccount sections
// [!] I mapped supplierNumber to supplierID. Is it correct or should it be another number?

// Settings
const FINAL_URL = "https://rest.reviso.com/vouchers/drafts/supplier-invoices";
// You can test the correct mapping replacing the final endpoint w/ this tool:
//const FINAL_URL = "https://postman-echo.com/post" 
const HEADERS = {
    "X-AppSecretToken": process.env.revisoAppSecretToken,
    "X-AgreementGrantToken": process.env.revisoAgreementGrantToken,
    "Content-Type": "application/json"
};
const ERRORS = {
    BAD_INPUT: "You have sent an incorrect JSON body"
};

// Libraries
const request = require('request');

// Endpoint
exports.endpoint = function(request, response) {
    let rawBody = '';
    request.on('data', (chunk) => {
        rawBody += chunk;
    });
    request.on('end', () => {
        endpointRelay(rawBody, response);
    });
}

// Post options
let postOptions = {
    method: "POST",
    url: FINAL_URL,
    port: 443,
    json: true,
    headers: HEADERS
};

// Functions
function endpointRelay (rawBody, response) {

    // Parse JSON and finish if badly constructed
    const msg = parseBody(rawBody);
    if ("error" in msg) {
        response.end(formatError(msg.error));
    }
    
    // Relay info to API if correctly formed
    postOptions.body = mapMessage(msg);
    //postOptions.body = {"test":"yes"};
    
    request(postOptions, function (err, res, body) {
        if(err) {
            response.end(err);
        }
        response.end(JSON.stringify(body));
    });
}

function parseBody(rawBody) {
    let msg = {};
    try {
        msg = JSON.parse(rawBody);
    }  catch (e) {
        msg.error = ERRORS.BAD_INPUT;
    }
    return msg;
}

function mapMessage (msg) {
     
    // Compute properties which depend on input values   
    let computed = {};
//    computed["exchangeRateDecimal"] = (msg["exchangeRate"])/100;
//    computed["contraVatPctDecimal"] = (msg["contraVatPercentage"])/100;
    
    // amountInBaseCurrency = amount * exchangeRate/100
    computed["amountInBaseCurrency"] = roundTwoDecimals (
            Number(msg["amount"]) * Number(msg["exchangeRate"]) / 100
    );
    // contraVatAmount = |amount * contraVatPercent/100|
    computed["contraVatAmount"] = Math.abs(
        roundTwoDecimals (
            msg["amount"] * (msg["contraVatPercentage"]) / 100
        )
    );
    // contraVatAmountInBaseCurrency = |contraVatAmount * exchangeRate/100|
    computed["contraVatAmountInBaseCurrency"] =  Math.abs(
        roundTwoDecimals(
            (msg["amount"] * (msg["contraVatPercentage"]) / 100) * (Number(msg["exchangeRate"]) / 100)
        )
    );

    // Construct the final structure
    return {
        "lines": [
            {
                "account": {
                    "accountNumber": msg["accountNumber"]
                },
                "amount": -msg["amount"],
                "amountInBaseCurrency": -computed["amountInBaseCurrency"],
                "currency": msg["currency"],
                "exchangeRate": msg["exchangeRate"],
                "remittanceInformation": {
                    "paymentType": {
                        "paymentTypeNumber": msg["paymentTypeNumber"]
                    }
                },
                "supplier": {
                    "supplierNumber": msg["supplierID"]
                },
                "supplierInvoiceNumber": msg["supplierInvoiceNumber"]
            },
            {
                "contraAccount": {
                    "accountNumber": msg["contraAccountNumber"]
                },
                "contraVatAccount": {
                    "vatCode": msg["contraVatCode"]
                },
                "contraVatAmount": computed["contraVatAmount"],
                "contraVatAmountInBaseCurrency": computed["contraVatAmountInBaseCurrency"],
                "amount": -msg["amount"],
                "amountInBaseCurrency": -computed["amountInBaseCurrency"],
                "currency": msg["currency"],
                "exchangeRate": msg["exchangeRate"],
                "text": msg["text"]
            }
        ],
        "date": msg["date"],
        "dueDate": msg["dueDate"],
        "invoiceDate": msg["invoiceDate"],
        "numberSeries": {
            "numberSeriesNumber": msg["numberSeriesNumber"]
        }
    }
}

function roundPlaces(num, places) {
    //return (Math.round( num * 100 ) / 100).toFixed(places);
    return Number(Math.round(num + 'e' + places) + 'e-' + places);
}

function roundTwoDecimals(num) {
    return roundPlaces(num, 2);
}

function formatError(errorMsg) {
    let errorTpl = `{
        "status": "Error",
        "message": "${errorMsg}"
    }`;
    return errorTpl;
}