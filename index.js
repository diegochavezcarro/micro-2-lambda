const express = require('express');
const axios = require('axios');
const AWSXRay = require('aws-xray-sdk');
const http = require('http');

const app = express();
const port = 3000;

// X-Ray: capturar llamadas HTTP
AWSXRay.captureHTTPsGlobal(http);
app.use(AWSXRay.express.openSegment('MicroservicioSuma'));

const LAMBDA_URL = process.env.LAMBDA_ALB_URL;

app.get('/saludar', async (req, res) => {
  const { nombre = 'usuario', num1 = '0', num2 = '0' } = req.query;

  const segment = AWSXRay.getSegment();
  const subsegment = segment.addNewSubsegment('InvocarLambda');
  console.log("Llamando a Lambda con: ", { num1, num2 });
  console.log("URL de Lambda: ", LAMBDA_URL);
  try {
    const response = await axios.post(LAMBDA_URL, {
      num1: parseFloat(num1),
      num2: parseFloat(num2)
    });
    const resultado = response.data.result;
    console.log("Respuesta de Lambda: ", resultado);
    subsegment.close();
    res.send(`Hola ${nombre}, la suma es ${resultado}`);
  } catch (err) {
    subsegment.addError(err);
    subsegment.close();
    console.error("Error llamando a Lambda: ", err);
    res.status(500).send('Error llamando a Lambda');
  }
});

app.use(AWSXRay.express.closeSegment());

app.listen(port, () => {
  console.log(`Microservicio escuchando en http://localhost:${port}`);
});
