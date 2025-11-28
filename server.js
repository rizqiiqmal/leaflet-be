// File: backend/server.js
const express = require('express');
const { MongoClient } = require('mongodb'); // Mengganti Mongoose dengan MongoClient
const cors = require('cors');

const app = express();

// --- KONFIGURASI ENV ---
// Variabel akan dibaca dari Vercel Environment Variables
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || 'be_ats'; // Ambil DB_NAME dari ENV (jika ada)

// GANTI DENGAN URL GITHUB PAGES ANDA YANG SEBENARNYA
const CLIENT_URL = 'https://rizqiiqmal.github.io/leaftlet-fe/'; 

// --- MIDDLEWARE ---
app.use(cors(
    {
        origin: CLIENT_URL,
        // Methods: POST dan DELETE dibutuhkan untuk fungsionalitas CRUD
        methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }
));
app.use(express.json());

// --- FUNGSI KONEKSI DATABASE ---
// Koneksi client harus dibuat dan ditutup per request di lingkungan Serverless
async function connectToDb() {
    if (!MONGO_URI) {
        throw new Error('MONGO_URI tidak dikonfigurasi. Periksa Vercel Environment Variables.');
    }
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    return client;
}

// --- DEFINISI COLLECTION ---
const COLLECTION_NAME = 'locations';
const { ObjectId } = require('mongodb'); // Untuk menangani ID

// --- RUTE API ---

// 1. GET: Mengambil semua lokasi
app.get('/api/locations', async (req, res) => {
    let client;
    try {
        client = await connectToDb();
        const db = client.db(DB_NAME);
        const data = await db.collection(COLLECTION_NAME).find().toArray();
        res.json(data);
    } catch (error) {
        console.error('Error GET:', error.message);
        res.status(500).json({ message: 'Gagal mengambil data lokasi. ' + error.message });
    } finally {
        if (client) await client.close();
    }
});

// 2. POST: Menambahkan lokasi baru
app.post('/api/locations', async (req, res) => {
    const { nama, deskripsi, kategori, latitude, longitude } = req.body;

    // Data yang akan disimpan (menggunakan GeoJSON Point)
    const lokasiBaru = {
        nama,
        deskripsi,
        kategori,
        location: { // GeoJSON Point: [Longitude, Latitude]
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
        },
        waktu: new Date()
    };

    let client;
    try {
        client = await connectToDb();
        const db = client.db(DB_NAME);
        const result = await db.collection(COLLECTION_NAME).insertOne(lokasiBaru);
        
        // Mengembalikan objek yang disimpan, termasuk ID yang baru dibuat
        res.status(201).json({ ...lokasiBaru, _id: result.insertedId });
    } catch (error) {
        console.error('Error POST:', error.message);
        res.status(400).json({ message: 'Gagal menyimpan lokasi baru. ' + error.message });
    } finally {
        if (client) await client.close();
    }
});

// 3. DELETE: Menghapus lokasi berdasarkan ID
app.delete('/api/locations/:id', async (req, res) => {
    let client;
    try {
        client = await connectToDb();
        const db = client.db(DB_NAME);
        const result = await db.collection(COLLECTION_NAME).deleteOne({ _id: new ObjectId(req.params.id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Lokasi tidak ditemukan.' });
        }
        
        res.json({ message: 'Lokasi berhasil dihapus' });
    } catch (error) {
        console.error('Error DELETE:', error.message);
        res.status(500).json({ message: 'Gagal menghapus lokasi. ' + error.message });
    } finally {
        if (client) await client.close();
    }
});

// Rute untuk memeriksa status server
app.get('/', (req, res) => {
    res.send('Vercel Express API is running.');
});


// !!! PENTING: Ekspor aplikasi agar Vercel bisa menjalankan sebagai Serverless Function !!!
module.exports = app;

// Kode app.listen() DIHAPUS karena Vercel menanganinya