import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import requeteRoutes from './routes/requeteRoutes';
import documentRoutes from './routes/documentRoutes';
import chatbotRoutes from './routes/chatbotRoutes';
import notificationRoutes from './routes/notificationRoutes';

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
app.use('/notifications', notificationRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'IutRequest API is running 🚀' });
});

export default app;
