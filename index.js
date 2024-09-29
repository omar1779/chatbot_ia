const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const { OpenAI } = require('openai');

const app = express();
const port = 3000;

// Configurar OpenAI API
const client = new OpenAI({
  apiKey: process.env['OPENAI_API_TOKEN'], // This is the default and can be omitted
});
//const openai = new OpenAIApi(configuration);

// Configura el middleware para parsear el cuerpo de la solicitud en formato x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// Simulación de base de datos de productos
const products = [
  { name: 'Cargador', price: 15 },
  { name: 'Audífonos', price: 30 },
  { name: 'Cable', price: 10 },
];

// Función para generar el contexto de los productos
function generateProductContext() {
  return products.map(product => `${product.name} cuesta $${product.price}`).join(', ');
}

// Ruta para recibir mensajes de WhatsApp desde Twilio (Webhook)
app.post('/webhook', async (req, res) => {
  const from = req.body.From; // Número de WhatsApp que envió el mensaje
  const body = req.body.Body; // Contenido del mensaje

  console.log(`Mensaje recibido de ${from}: ${body}`);

  // Generar contexto dinámico basado en los productos de la tienda
  const productContext = `
    You are a virtual assistant for an online store that sells the following products: ${generateProductContext()}.
    Answer any questions the customer may have about these products.
  `;

  // Enviar el mensaje del usuario a la API de OpenAI usando gpt-3.5-turbo
  try {
    const chatCompletion = await client.chat.completions.create({
      model: 'gpt-3.5-turbo', // Usar el modelo más económico
      messages: [
        { role: 'system', content: productContext }, // Contexto dinámico
        { role: 'user', content: body },
      ],
    });

    const chatResponse = chatCompletion.choices[0].message.content;

    // Responder automáticamente al mensaje recibido con la respuesta de ChatGPT
    res.set('Content-Type', 'text/xml');
    res.send(`
      <Response>
        <Message>${chatResponse}</Message>
      </Response>
    `);
  } catch (error) {
    console.error('Error con la API de OpenAI:', error);
    res.status(500).send('Hubo un problema con el servidor.');
  }
});
// Iniciar el servidor
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
