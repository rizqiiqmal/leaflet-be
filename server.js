require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors(
    {
        origin: 'https://rizqiiqmal.github.io', 
        methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }
));
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/db_ats';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Terhubung!'))
  .catch(err => console.error(err));

const LocationSchema = new mongoose.Schema({
    nama: String,
    deskripsi: String, 
    kategori: String,  
    latitude: Number,
    longitude: Number,
    waktu: { type: Date, default: Date.now }
});

const Location = mongoose.model('Location', LocationSchema);


app.get('/api/locations', async (req, res) => {
    try {
        const data = await Location.find();
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/locations', async (req, res) => {
    const { nama, deskripsi, kategori, latitude, longitude } = req.body;

    const lokasiBaru = new Location({
        nama, deskripsi, kategori, latitude, longitude
    });

    try {
        const savedLocation = await lokasiBaru.save();
        res.status(201).json(savedLocation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.delete('/api/locations/:id', async (req, res) => {
    try {
        await Location.findByIdAndDelete(req.params.id);
        res.json({ message: 'Lokasi berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = app;