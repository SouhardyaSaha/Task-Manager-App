const mongoose = require('mongoose');

const connectionURL = process.env.DATABASE_CONNECTION_URL;

mongoose.connect(connectionURL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});



