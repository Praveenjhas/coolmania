import cors from 'cors'
import express from 'express'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const app = express()
const PORT = process.env.PORT || 4000
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.resolve(__dirname, '..', 'dist')
const dataDir = path.resolve(__dirname, 'data')
const dataPath = path.join(dataDir, 'db.json')

app.use(cors())
app.use(express.json())

const initialDb = {
  people: [
    {
      id: 'mentor-aarav',
      name: 'Aarav Mehta',
      role: 'Computer Science senior',
      school: 'IIT Bombay',
      city: 'Mumbai, India',
      price: 499,
      rating: 4.9,
      sessions: 128,
      focus: 'JEE, CS admissions, hostel life',
      verified: true,
      image:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
    },
    {
      id: 'mentor-maya',
      name: 'Maya Rodriguez',
      role: 'Scholarship mentor',
      school: 'University of Toronto',
      city: 'Toronto, Canada',
      price: 899,
      rating: 4.8,
      sessions: 84,
      focus: 'SOP review, scholarships, international transition',
      verified: true,
      image:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
    },
    {
      id: 'mentor-noah',
      name: 'Noah Williams',
      role: 'Mechanical engineering student',
      school: 'TU Munich',
      city: 'Munich, Germany',
      price: 699,
      rating: 4.7,
      sessions: 61,
      focus: 'Germany admissions, visa, first semester planning',
      verified: false,
      image:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80',
    },
  ],
  resources: [
    {
      id: 'res-cs-roadmap',
      title: 'Complete first-year CS roadmap',
      owner: 'Global CS Study Circle',
      type: 'Roadmap',
      subject: 'Computer Science',
      downloads: 18420,
      saves: 2810,
      language: 'English + Hindi',
      level: 'Beginner',
    },
    {
      id: 'res-scholarship-tracker',
      title: 'Scholarship tracker for Indian students',
      owner: 'Maya Rodriguez',
      type: 'Spreadsheet',
      subject: 'Admissions',
      downloads: 9720,
      saves: 1432,
      language: 'English',
      level: 'Class 12 and gap year',
    },
    {
      id: 'res-physics',
      title: 'Physics formulas and solved problems',
      owner: 'Delhi Open Notes',
      type: 'Notes',
      subject: 'Physics',
      downloads: 35100,
      saves: 5202,
      language: 'Hindi + English',
      level: 'Class 11-12',
    },
    {
      id: 'res-campus-questions',
      title: 'Campus questions to ask before admission',
      owner: 'BridgeEd team',
      type: 'Checklist',
      subject: 'College selection',
      downloads: 12880,
      saves: 1964,
      language: '12 languages',
      level: 'All students',
    },
  ],
  groups: [
    {
      id: 'group-fall-2027',
      name: 'Fall 2027 Admissions India',
      members: '18.4K',
      activity: '312 posts today',
      topic: 'Applications, exams, financial aid',
    },
    {
      id: 'group-women-stem',
      name: 'Women in STEM peer network',
      members: '42.9K',
      activity: '86 mentors online',
      topic: 'Mentorship, projects, internships',
    },
    {
      id: 'group-low-bandwidth',
      name: 'Low-bandwidth study resources',
      members: '9.8K',
      activity: '44 new resources',
      topic: 'Compressed notes, text-first learning',
    },
  ],
  feed: [
    {
      id: 'feed-match',
      type: 'match',
      title: '3 verified seniors can guide you on CS admissions',
      body: 'Based on your interest in computer science, scholarships, and Indian entrance exams.',
    },
    {
      id: 'feed-resource',
      type: 'resource',
      title: 'Physics formulas and solved problems is trending',
      body: '5,202 students saved it. Available in Hindi and English for low-data download.',
    },
    {
      id: 'feed-event',
      type: 'event',
      title: 'Live group session: choosing the right college after 12th',
      body: 'Tomorrow, 7:00 PM. Hosted by students from IIT Bombay, DU, and Ashoka.',
    },
  ],
  messages: [
    { id: 'msg-1', mentorId: 'mentor-aarav', from: 'Aarav', text: 'Hey Praveen, tell me your target colleges and exam status.' },
    { id: 'msg-2', mentorId: 'mentor-aarav', from: 'You', text: 'I want honest advice about CS options after 12th.' },
    { id: 'msg-3', mentorId: 'mentor-aarav', from: 'Aarav', text: 'Good. I can compare branches, campus life, placements, and fees.' },
  ],
  savedResources: ['Complete first-year CS roadmap'],
  bookings: [],
  profile: {
    name: 'Praveen Kumar Jha',
    classLevel: 'Class 12',
    interests: ['Computer Science', 'Scholarships', 'Indian entrance exams'],
    budget: 'Medium',
    preferredCountries: ['India'],
  },
}

let db = structuredClone(initialDb)

async function loadDb() {
  try {
    const file = await fs.readFile(dataPath, 'utf8')
    db = { ...structuredClone(initialDb), ...JSON.parse(file) }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('Could not load database, using seed data:', error.message)
    }
    await saveDb()
  }
}

async function saveDb() {
  await fs.mkdir(dataDir, { recursive: true })
  await fs.writeFile(dataPath, `${JSON.stringify(db, null, 2)}\n`)
}

function includesQuery(value, query) {
  return value.toLowerCase().includes(query.toLowerCase())
}

function searchAll(query, type = 'all') {
  const people = db.people
    .filter((person) =>
      includesQuery(`${person.name} ${person.school} ${person.focus} ${person.city}`, query),
    )
    .map((item) => ({ kind: 'people', title: item.name, meta: item.school, detail: item.focus }))

  const resources = db.resources
    .filter((resource) =>
      includesQuery(`${resource.title} ${resource.subject} ${resource.owner} ${resource.language}`, query),
    )
    .map((item) => ({
      kind: 'resources',
      title: item.title,
      meta: item.subject,
      detail: `${item.downloads.toLocaleString()} downloads`,
    }))

  const groups = db.groups
    .filter((group) => includesQuery(`${group.name} ${group.topic}`, query))
    .map((item) => ({ kind: 'groups', title: item.name, meta: item.members, detail: item.topic }))

  return [...people, ...resources, ...groups].filter((result) => (type === 'all' ? true : result.kind === type))
}

function getAdmissionAdvice(profile) {
  const interests = String(profile.interests || '').toLowerCase()
  const interestTerms = interests.split(/[^a-z0-9]+/).filter((term) => term.length > 2)
  const target = String(profile.target || '').trim()
  const budget = String(profile.budget || '').trim()
  const exams = String(profile.exams || '').trim()
  const timeline = String(profile.timeline || '').trim()

  const recommendations = [
    {
      title: 'Build a balanced college shortlist',
      body: `Create reach, match, and safe options${target ? ` around ${target}` : ''}. Compare fees, branch flexibility, placement data, and distance from home before applying.`,
    },
    {
      title: 'Use peer mentoring before paid counseling',
      body: 'Speak to current students first. Ask about actual workload, hostel life, hidden costs, internships, and whether the branch is easy to change later.',
    },
    {
      title: 'Keep documents ready early',
      body: 'Prepare marksheets, ID proof, category certificates if applicable, income documents for scholarships, SOP drafts, and a simple activity resume.',
    },
  ]

  if (interests.includes('computer') || interests.includes('cs') || interests.includes('coding')) {
    recommendations.unshift({
      title: 'Prioritize CS fit, not only the college name',
      body: 'Compare curriculum, coding culture, labs, clubs, internship access, and alumni outcomes. A strong CS environment can matter more than a small ranking difference.',
    })
  }

  if (interests.includes('scholar') || budget.toLowerCase().includes('low')) {
    recommendations.push({
      title: 'Apply for scholarships in parallel',
      body: 'Track deadlines in a spreadsheet and apply before admission results. Many scholarships need income proof, essays, recommendations, and early registration.',
    })
  }

  if (exams) {
    recommendations.push({
      title: 'Map exam scores to admission windows',
      body: `For ${exams}, note counseling dates, document verification steps, seat acceptance fees, and refund rules so you do not miss a round.`,
    })
  }

  return {
    summary: `Based on your profile${timeline ? ` and ${timeline} timeline` : ''}, focus on verified student advice, a practical shortlist, and scholarship readiness.`,
    nextSteps: recommendations.slice(0, 5),
    suggestedMentors: db.people
      .filter((person) => {
        const haystack = `${person.focus} ${person.role} ${person.school}`.toLowerCase()
        return interestTerms.length
          ? interestTerms.some((term) => haystack.includes(term))
          : includesQuery(haystack, target || 'admissions')
      })
      .slice(0, 2)
      .map((person) => ({ id: person.id, name: person.name, focus: person.focus })),
    generatedAt: new Date().toISOString(),
  }
}

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, service: 'BridgeEd API', time: new Date().toISOString() })
})

app.get('/api/bootstrap', (_request, response) => {
  response.json({
    people: db.people,
    resources: db.resources,
    groups: db.groups,
    feed: db.feed,
    messages: db.messages,
    savedResources: db.savedResources,
    bookings: db.bookings,
    profile: db.profile,
  })
})

app.get('/api/search', (request, response) => {
  const query = String(request.query.q || '').trim()
  const type = String(request.query.type || 'all')
  response.json({ results: query ? searchAll(query, type) : [] })
})

app.get('/api/messages/:mentorId', (request, response) => {
  response.json({
    messages: db.messages.filter((message) => message.mentorId === request.params.mentorId),
  })
})

app.post('/api/messages', (request, response) => {
  const mentorId = String(request.body.mentorId || '')
  const text = String(request.body.text || '').trim()

  if (!mentorId || !text) {
    response.status(400).json({ error: 'mentorId and text are required' })
    return
  }

  const message = {
    id: `msg-${Date.now()}`,
    mentorId,
    from: 'You',
    text,
  }
  db.messages.push(message)
  saveDb()
    .then(() => response.status(201).json({ message }))
    .catch(() => response.status(500).json({ error: 'Could not save message' }))
})

app.post('/api/bookings', (request, response) => {
  const mentorId = String(request.body.mentorId || '')
  const mentor = db.people.find((person) => person.id === mentorId)

  if (!mentor) {
    response.status(404).json({ error: 'Mentor not found' })
    return
  }

  const booking = {
    id: `booking-${Date.now()}`,
    mentorId,
    mentorName: mentor.name,
    price: mentor.price,
    advisorEarns: Math.round(mentor.price * 0.72),
    platformKeeps: Math.round(mentor.price * 0.28),
    status: 'requested',
    createdAt: new Date().toISOString(),
  }
  db.bookings.push(booking)
  saveDb()
    .then(() => response.status(201).json({ booking }))
    .catch(() => response.status(500).json({ error: 'Could not save booking' }))
})

app.post('/api/resources/save', (request, response) => {
  const title = String(request.body.title || '')

  if (!title) {
    response.status(400).json({ error: 'title is required' })
    return
  }

  if (db.savedResources.includes(title)) {
    db.savedResources = db.savedResources.filter((item) => item !== title)
  } else {
    db.savedResources.push(title)
  }

  saveDb()
    .then(() => response.json({ savedResources: db.savedResources }))
    .catch(() => response.status(500).json({ error: 'Could not update saved resources' }))
})

app.post('/api/resources', (request, response) => {
  const title = String(request.body.title || '').trim()
  const subject = String(request.body.subject || 'Admissions').trim()
  const type = String(request.body.type || 'Guide').trim()
  const owner = String(request.body.owner || db.profile.name || 'BridgeEd student').trim()
  const language = String(request.body.language || 'English').trim()
  const level = String(request.body.level || 'All students').trim()

  if (!title) {
    response.status(400).json({ error: 'title is required' })
    return
  }

  const resource = {
    id: `res-${Date.now()}`,
    title,
    owner,
    type,
    subject,
    downloads: 0,
    saves: 0,
    language,
    level,
  }

  db.resources.unshift(resource)
  saveDb()
    .then(() => response.status(201).json({ resource }))
    .catch(() => response.status(500).json({ error: 'Could not save resource' }))
})

app.post('/api/profile', (request, response) => {
  db.profile = {
    ...db.profile,
    ...request.body,
    updatedAt: new Date().toISOString(),
  }

  saveDb()
    .then(() => response.json({ profile: db.profile }))
    .catch(() => response.status(500).json({ error: 'Could not save profile' }))
})

app.post('/api/ai/advice', (request, response) => {
  const advice = getAdmissionAdvice({ ...db.profile, ...request.body })
  response.json({ advice })
})

app.use(express.static(distPath))

app.use((_request, response) => {
  response.sendFile(path.join(distPath, 'index.html'))
})

loadDb().then(() => {
  app.listen(PORT, () => {
    console.log(`BridgeEd API running on http://localhost:${PORT}`)
  })
})
