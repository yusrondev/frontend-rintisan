# Frontend Rintisan

Frontend Rintisan adalah proyek antarmuka pengguna berbasis **Vue** dengan bundler **Vite**. 
Proyek ini dirancang untuk pengembangan aplikasi web yang cepat, modular, dan mudah dikustomisasi.

## 📂 Struktur Project

```
frontend-rintisan-master/
├── public/             # File statis (ikon, gambar, dll)
├── src/                # Source code Vue
├── index.html          # Entry point aplikasi
├── package.json        # Daftar dependencies & script npm
├── vite.config.js      # Konfigurasi Vite
└── .env                # Konfigurasi environment variable
```

## 🔧 Instalasi & Menjalankan

Pastikan sudah menginstal **Node.js** (versi terbaru direkomendasikan).

1. Clone repository ini atau ekstrak file zip
   ```bash
   git clone <repository-url>
   cd frontend-rintisan
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Jalankan aplikasi dalam mode development
   ```bash
   npm run dev
   ```

   Aplikasi akan berjalan di `http://localhost:5173` (default Vite).

4. Build aplikasi untuk production
   ```bash
   npm run build
   ```

5. Preview hasil build
   ```bash
   npm run preview
   ```

## 📜 Script NPM

- `npm run dev` → Menjalankan server development
- `npm run build` → Build project untuk production
- `npm run preview` → Menjalankan preview hasil build

## 🤝 Kontribusi

Kontribusi sangat diterima!  
Silakan fork repo ini, buat branch baru, lalu ajukan pull request.