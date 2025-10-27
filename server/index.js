const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${uuid()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

app.use('/api/files', express.static(uploadsDir));

const doctorUser = {
  id: 'doctor-1',
  name: 'Dr. Léa Martin',
  role: 'DOCTOR',
  avatarUrl: 'https://i.pravatar.cc/150?img=47'
};

const patients = [
  {
    id: 'patient-1',
    name: 'Jean Dupont',
    role: 'PATIENT',
    avatarUrl: 'https://i.pravatar.cc/150?img=12'
  },
  {
    id: 'patient-2',
    name: 'Sophie Bernard',
    role: 'PATIENT',
    avatarUrl: 'https://i.pravatar.cc/150?img=32'
  }
];

let conversations = [
  {
    id: 'conv-1',
    participants: [doctorUser, patients[0]],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    id: 'conv-2',
    participants: [doctorUser, patients[1]],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  }
];

let messages = [
  {
    id: uuid(),
    conversationId: 'conv-1',
    senderId: patients[0].id,
    senderName: patients[0].name,
    senderRole: patients[0].role,
    content: 'Bonjour docteur, je vous envoie mes derniers résultats d\'analyse.',
    createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    attachments: [
      {
        id: uuid(),
        fileName: 'analyses-sanguines.pdf',
        fileType: 'application/pdf',
        url: 'https://filesamples.com/samples/document/pdf/sample3.pdf',
        size: 254000
      }
    ],
    readBy: [patients[0].id]
  },
  {
    id: uuid(),
    conversationId: 'conv-1',
    senderId: doctorUser.id,
    senderName: doctorUser.name,
    senderRole: doctorUser.role,
    content: 'Merci Jean, je regarde cela et je reviens vers vous rapidement.',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    attachments: [],
    readBy: [doctorUser.id, patients[0].id]
  },
  {
    id: uuid(),
    conversationId: 'conv-2',
    senderId: patients[1].id,
    senderName: patients[1].name,
    senderRole: patients[1].role,
    content: 'Bonjour docteur, je ressens encore des douleurs à la cheville.',
    createdAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    attachments: [],
    readBy: [patients[1].id]
  }
];

const getConversationMessages = conversationId =>
  messages.filter(message => message.conversationId === conversationId).sort((a, b) => {
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

const getUnreadCount = (conversationId, userId) =>
  getConversationMessages(conversationId).filter(message => !message.readBy.includes(userId)).length;

const getLastMessage = conversationId => {
  const convMessages = getConversationMessages(conversationId);
  return convMessages[convMessages.length - 1] || null;
};

const mapConversation = (conversation, userId) => ({
  ...conversation,
  lastMessage: getLastMessage(conversation.id),
  unreadCount: getUnreadCount(conversation.id, userId)
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/chats', (req, res) => {
  const userId = req.query.userId || doctorUser.id;
  const convoResponse = conversations
    .map(conversation => mapConversation(conversation, userId))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  res.json({ conversations: convoResponse });
});

app.get('/api/chats/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  const userId = req.query.userId || doctorUser.id;
  const conversation = conversations.find(conv => conv.id === conversationId);

  if (!conversation) {
    return res.status(404).json({ message: 'Conversation introuvable' });
  }

  const convoMessages = getConversationMessages(conversationId);
  res.json({
    conversation: mapConversation(conversation, userId),
    messages: convoMessages
  });
});

app.post('/api/chats', (req, res) => {
  const { participantName, participantId, participantRole = 'PATIENT' } = req.body || {};
  if (!participantName) {
    return res.status(400).json({ message: 'Le nom du participant est requis' });
  }

  const existingConversation = participantId
    ? conversations.find(conv => conv.participants.some(participant => participant.id === participantId))
    : null;

  if (existingConversation) {
    return res.json({ conversation: mapConversation(existingConversation, doctorUser.id) });
  }

  const newParticipant = {
    id: participantId || `patient-${uuid().slice(0, 8)}`,
    name: participantName,
    role: participantRole
  };

  if (!patients.find(patient => patient.id === newParticipant.id)) {
    patients.push(newParticipant);
  }

  const newConversation = {
    id: `conv-${uuid().slice(0, 8)}`,
    participants: [doctorUser, newParticipant],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  conversations = [newConversation, ...conversations];
  res.status(201).json({ conversation: mapConversation(newConversation, doctorUser.id) });
});

app.post('/api/chats/:conversationId/messages', upload.array('files', 5), (req, res) => {
  const { conversationId } = req.params;
  const { senderId, senderName, senderRole = 'DOCTOR', content } = req.body;

  const conversation = conversations.find(conv => conv.id === conversationId);
  if (!conversation) {
    return res.status(404).json({ message: 'Conversation introuvable' });
  }

  if (!senderId || !senderName) {
    return res.status(400).json({ message: 'Informations d\'expéditeur manquantes' });
  }

  const attachments = (req.files || []).map(file => ({
    id: uuid(),
    fileName: file.originalname,
    fileType: file.mimetype,
    size: file.size,
    url: `${req.protocol}://${req.get('host')}/api/files/${file.filename}`
  }));

  const newMessage = {
    id: `msg-${uuid().slice(0, 8)}`,
    conversationId,
    senderId,
    senderName,
    senderRole,
    content: content || '',
    attachments,
    createdAt: new Date().toISOString(),
    readBy: [senderId]
  };

  messages.push(newMessage);

  conversations = conversations.map(conv =>
    conv.id === conversationId
      ? { ...conv, updatedAt: newMessage.createdAt }
      : conv
  );

  res.status(201).json({ message: newMessage });
});

app.post('/api/chats/:conversationId/read', (req, res) => {
  const { conversationId } = req.params;
  const { userId } = req.body || {};

  if (!userId) {
    return res.status(400).json({ message: "L'identifiant utilisateur est requis" });
  }

  const conversation = conversations.find(conv => conv.id === conversationId);
  if (!conversation) {
    return res.status(404).json({ message: 'Conversation introuvable' });
  }

  messages = messages.map(message =>
    message.conversationId === conversationId && !message.readBy.includes(userId)
      ? { ...message, readBy: [...message.readBy, userId] }
      : message
  );

  res.json({ conversation: mapConversation(conversation, userId) });
});

app.listen(PORT, () => {
  console.log(`Chat API server running on port ${PORT}`);
});
