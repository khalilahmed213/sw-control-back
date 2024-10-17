const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db=require('./models')
const authRoutes = require('./routes/authRoutes');
const agentRoutes = require('./routes/agentRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const projectRoutes = require('./routes/projetRoutes');
const presenceRoutes = require('./routes/presenceRoutes');
const penaliteRoutes = require('./routes/penaliteRoutes');
const autorisationRoutes = require('./routes/autorisationRoutes')
const congeRoutes = require('./routes/congeRoutes')
const calaculeRoutes = require('./routes/calculeRoutes')
const { updateSchedule } = require('./cron/scheduleCron');
const app = express();


// Middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', presenceRoutes);
app.use('/api', penaliteRoutes);
app.use('/api',autorisationRoutes);
app.use('/api',congeRoutes);
app.use('/api',calaculeRoutes);
const PORT = process.env.PORT || 3000;
db.sequelize.sync().then(()=>
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}));
updateSchedule();
/*{ alter: true }*/