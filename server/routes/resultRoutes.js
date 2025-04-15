const express = require('express');
const router = express.Router();
const Result = require('../models/Result');

router.post('/', async (req, res) => {
    try {
        const result = new Result(req.body);
        await result.save();
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
