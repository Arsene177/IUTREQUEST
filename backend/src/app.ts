import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import requeteRoutes from './routes/requeteRoutes';
import documentRoutes from './routes/documentRoutes';
import chatbotRoutes from './routes/chatbotRoutes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/requetes', requeteRoutes);
app.use('/requetes/:id/documents', documentRoutes);
app.use('/chatbot', chatbotRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'JANNGO API is running 🚀' });
});

export default app;
