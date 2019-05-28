// Libraries
const request = require('request');

    // Final url
    //const FINAL_URL = "https://prod-61.westeurope.logic.azure.com:443/workflows/a97e30c6dd51449f8def293b023363c2/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=fYabTi77sRRh4RH0HGtMbeKryTHmdB8BaoB-nfW_m38";

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const msg = req.body;

    // Determine destination endpoint to be called
    postOptions = {
        method: "POST",
        url: msg['destination-endpoint'],
        port: 443,
        headers: {
            "X-AppSecretToken": process.env.revisoAppSecretToken,
            "X-AgreementGrantToken": process.env.revisoAgreementGrantToken,
            "Content-Type": "multipart/form-data"
        }
    }
    
    // Relay info to API if correctly formed
    postOptions.formData = {
      filename: msg.filename,
      file: msg['file-content']
    };

    context.res.statusCode = 202; // added for testing

    request(postOptions, function (err, res, reqBody) {
        if(err) {
            context.res = {
                status: res.statusCode,
                body: err
            }
        }
        else
        {
            context.res = {
                status: res.statusCode,
                body: reqBody
            }
        }
    });
}
