// const express = require('express')
import express from 'express';
import { state, asyncState } from './state.js'
const app = express()
const port = 12345

app.get('/state.json', (req, res) => {
  console.log("HERE I AM")
  res.send({ 
    state: state,
    asyncState: asyncState
  })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})