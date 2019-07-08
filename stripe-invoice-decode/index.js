module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    if (req.query.name || (req.body && req.body.name)) {
        context.res = {
            // status: 200, /* Defaults to 200 */
            headers: { "content-type" : "application/json"},
            body: {
                name: (req.query.name || req.body.name),
                customer_email: req.body.data.object.customer_email,
                invoice_date: new Date(req.body.created * 1000).toISOString(),
                lines_count : req.body.data.object.lines.data.length
            }
        };
    }
    else {
        context.res = {
            status: 400,
            headers: { "content-type" : "text/plain"},
            body: "Please pass a name on the query string or in the request body"
        };
    }
};