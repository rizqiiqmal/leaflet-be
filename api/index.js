const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();

// PASTIKAN MONGODB_URI DIDEFINISIKAN SEBAGAI ENVIRONMENT VARIABLE DI VERCEL
const MONGODB_URI = process.env.MONGODB_URI; 
// GANTI DENGAN URL GITHUB PAGES ANDA YANG SEBENARNYA (misal: https://username.github.io/my-leaflet-frontend)
const CLIENT_URL = 'GANTI_DENGAN_URL_GITHUB_PAGES_ANDA'; 
const DB_NAME = 'GANTI_DENGAN_NAMA_DB_ANDA'; // Nama database di MongoDB Atlas

// 1. Konfigurasi CORS (Wajib untuk komunikasi lintas domain)
app.use(cors({
    origin: CLIENT_URL,
    methods: ['GET', 'POST'], // Izinkan GET (ambil data) dan POST (kirim data)
    credentials: true,
}));

app.use(express.json()); // Middleware untuk mem-parsing body JSON

// Fungsi koneksi ke MongoDB yang reusable
async function connectToDb() {
    if (!MONGODB_URI) {
        throw new Error('MongoDB URI not configured.');
    }
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    return client;
}

// 2. Rute GET: Mengambil semua marker
app.get('/api/markers', async (req, res) => {
    let client;
    try {
        client = await connectToDb();
        const db = client.db(DB_NAME);
        const markers = await db.collection('markers').find({}).toArray();
        
        res.json(markers);
    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).send('Internal Server Error: ' + error.message);
    } finally {
        if (client) {
            await client.close();
        }
    }
});

// 3. Rute POST: Menyimpan marker baru
app.post('/api/add-marker', async (req, res) => {
    const { name, description, lat, lon } = req.body; 

    // Validasi input
    if (!name || !description || !lat || !lon) {
        return res.status(400).send('Missing required fields: name, description, lat, or lon.');
    }

    // Buat objek marker GeoJSON (MongoDB: [Longitude, Latitude])
    const newMarker = {
        name,
        description,
        location: {
            type: "Point",
            coordinates: [parseFloat(lon), parseFloat(lat)] 
        },
        createdAt: new Date()
    };

    let client;
    try {
        client = await connectToDb();
        const db = client.db(DB_NAME);
        const result = await db.collection('markers').insertOne(newMarker);
        
        res.status(201).json({ 
            message: 'Marker added successfully', 
            id: result.insertedId,
            marker: newMarker
        });
    } catch (error) {
        console.error('Error inserting data:', error.message);
        res.status(500).send('Internal Server Error while saving data: ' + error.message);
    } finally {
        if (client) {
            await client.close();
        }
    }
});

// 4. Rute Root (Test deployment)
app.get('/', (req, res) => {
    res.send('Vercel Express API is running successfully.');
});

module.exports = app;