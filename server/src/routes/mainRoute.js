const mainRouter = require('express').Router();
const apiRouter = require('./apiRoute');
const formatResponse = require('../utils/formatResponse');

mainRouter.use('/api', apiRouter);


mainRouter.use((req, res) => {
  res.status(404).json(formatResponse(404, 'Ресурс не найден'));
});

module.exports = mainRouter;
