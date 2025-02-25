const express = require('express');

const app = express();
const bodyParser = require('body-parser');


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', "*");
    res.setHeader("Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept");

    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
    next();
})

app.post("/api/posts", (req, res, next) => {
    const post = req.body;
    console.log(post);
    res.status(201).json({
        message: 'Post added successfully',
        post
    });
})


app.use('/api/posts', (req, res, next) => {
    const posts = 
        [
            {
            id: "jetley",
            title: "first title from server-side",
            content: "first content from server-side",
            },

            {
                id: "marco",
                title: "second title from server-side",
                content: "second content from server-side"
            },
        ];

    res.status(200).json({
        message: 'Posts successfully fetched',
        posts: posts
    });
});

module.exports = app;