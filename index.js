const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Kafka } = require('kafkajs');

const app = express();
app.use(express.json());

const MONGO = process.env.MONGO_URL || 'mongodb://localhost:27017/cds_auth';
const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';

mongoose.connect(MONGO).then(()=>console.log('auth mongo connected')).catch(()=>{console.log('auth mongo failed')});

const UserSchema = new mongoose.Schema({ email:String, password:String, createdAt:Date });
const User = mongoose.model('AuthUser', UserSchema);

// Kafka consumer to read registration topic
const kafka = new Kafka({ brokers: [KAFKA_BROKER] });
const consumer = kafka.consumer({ groupId: 'auth-group' });

async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'registration', fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const data = JSON.parse(message.value.toString());
        const { email, password } = data;
        const hashed = await bcrypt.hash(password, 10);
        await User.create({ email, password: hashed, createdAt: new Date() });
        console.log('Stored credentials for', email);
      } catch (e) { console.error('consumer error', e); }
    }
  });
}
startConsumer().catch(e=>console.error(e));

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'invalid' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'invalid' });
  const token = jwt.sign({ id: user._id, email }, process.env.JWT_SECRET || 'SUPER_SECRET_KEY', { expiresIn: '8h' });
  res.json({ token });
});

app.listen(4001, ()=>console.log('auth service on 4001'));
